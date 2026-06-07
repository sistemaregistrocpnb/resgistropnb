window.initConsultaVehiculos = function() {
    console.log("⚙️ Iniciando módulo consulta-vehiculos.js...");
    if (window._consultaVehiculosInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
        return;
    }
    window._consultaVehiculosInitialized = true;
    
    const el = (id) => document.getElementById(id);
    const tipoBusquedaSelect = el('cv_tipo_busqueda');
    const buscarInput = el('cv_buscar_valor');
    const btnBuscar = el('cv_btn_buscar');
    const msg = el('cv_msg');
    const tipoSelector = el('cv_tipo_selector');
    const fichaBreve = el('cv_ficha_breve');
    const incidenciasSection = el('cv_incidencias_section');
    const modalDetalles = el('cv_modal_detalles');
    const modalIncidencia = el('cv_modal_incidencia');
    const modalTitulo = el('cv_modal_titulo');
    const modalBody = el('cv_modal_body');
    
    let vehiculoActual = null;
    let tipoRegistroActual = null;
    let resultadosMultiples = null;
    let datosProcesado = null;
    
    // ✅ Variables para paginación
    let incidenciasPaginaActual = 1;
    const incidenciasPorPagina = 10;
    let totalIncidencias = 0;
    let identificadorActualIncidencias = null;
    let tipoActualIncidencias = null;

    // Listeners
    if (btnBuscar) btnBuscar.onclick = () => buscarVehiculo();
    if (buscarInput) {
        buscarInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnBuscar?.click(); }
        });
    }
    if (el('cv_modal_close')) el('cv_modal_close').onclick = () => modalDetalles.classList.remove('active');
    if (el('cv_modal_cerrar')) el('cv_modal_cerrar').onclick = () => modalDetalles.classList.remove('active');
    if (el('cv_modal_inc_close')) el('cv_modal_inc_close').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cv_btn_cancelar_incidencia')) el('cv_btn_cancelar_incidencia').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cv_btn_guardar_incidencia')) el('cv_btn_guardar_incidencia').onclick = () => guardarIncidencia();
    if (el('cv_btn_imprimir_reporte')) el('cv_btn_imprimir_reporte').onclick = () => window.print();

    function mostrarMensaje(texto, tipo) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `msg ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
    }

    async function tienePermisosIncidencia() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return false;
            const { data: perfil, error } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error || !perfil) return false;
            const nivel = (perfil.nivel || '').toLowerCase().trim();
            return nivel === 'administrador' || nivel === 'moderador';
        } catch (err) {
            console.error('❌ Error verificando permisos:', err);
            return false;
        }
    }

    async function buscarVehiculo() {
        const tipoBusqueda = tipoBusquedaSelect?.value || 'placa';
        const valor = buscarInput?.value.trim().toUpperCase() || '';
        if (!valor) {
            mostrarMensaje('⚠️ Ingrese un valor para buscar', 'error');
            return;
        }
        mostrarMensaje('🔍 Buscando...', 'info');
        tipoSelector.style.display = 'none';
        fichaBreve.style.display = 'none';
        incidenciasSection.style.display = 'none';
        vehiculoActual = null;
        tipoRegistroActual = null;
        resultadosMultiples = null;
        datosProcesado = null;
        incidenciasPaginaActual = 1;

        try {
            const resultados = [];
            const { data: automoviles, error: errAuto } = await window.supabaseClient
                .from('registro_automoviles')
                .select('*')
                .eq(tipoBusqueda, valor);
            if (errAuto) throw errAuto;
            if (automoviles && automoviles.length > 0) {
                automoviles.forEach(v => resultados.push({ ...v, tipo_registro: 'automovil' }));
            }
            const { data: motos, error: errMoto } = await window.supabaseClient
                .from('registro_motos')
                .select('*')
                .eq(tipoBusqueda, valor);
            if (errMoto) throw errMoto;
            if (motos && motos.length > 0) {
                motos.forEach(v => resultados.push({ ...v, tipo_registro: 'moto' }));
            }
            const { data: vinculados, error: errVinc } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .eq(tipoBusqueda, valor);
            if (errVinc) throw errVinc;
            if (vinculados && vinculados.length > 0) {
                vinculados.forEach(v => {
                    resultados.push({ ...v, tipo_registro: 'vinculado' });
                    const estatus = (v.estatus || '').toLowerCase();
                    if (estatus.includes('procesad')) {
                        try {
                            const { data: procData } = await window.supabaseClient
                                .from('registro_procesados')
                                .select('tipo_delito')
                                .eq('cedula', v.cedula)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();
                            if (procData) datosProcesado = procData;
                        } catch (e) { /* Silencioso */ }
                    }
                });
            }
            if (resultados.length === 0) {
                mostrarMensaje('❌ No se encontró ningún vehículo con ese valor', 'error');
                return;
            }
            const tiposUnicos = [...new Set(resultados.map(r => r.tipo_registro))];
            if (tiposUnicos.length > 1) {
                resultadosMultiples = resultados;
                mostrarSelectorTipos(resultados);
                mostrarMensaje(`⚠️ Se encontraron ${resultados.length} registros en diferentes tipos`, 'info');
            } else {
                vehiculoActual = resultados[0];
                tipoRegistroActual = resultados[0].tipo_registro;
                await renderFichaBreve(vehiculoActual, tipoRegistroActual);
                await cargarIncidencias(vehiculoActual.placa || vehiculoActual.serial_carroceria || vehiculoActual.serial_motor, tipoRegistroActual, 1);
                mostrarMensaje('✅ Vehículo encontrado', 'success');
            }
        } catch (err) {
            console.error('❌ Error buscando vehículo:', err);
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        }
    }

    function mostrarSelectorTipos(resultados) {
        if (!tipoSelector) return;
        const agrupados = {};
        resultados.forEach(r => {
            if (!agrupados[r.tipo_registro]) agrupados[r.tipo_registro] = [];
            agrupados[r.tipo_registro].push(r);
        });
        const iconos = { automovil: '🚗', moto: '🏍️', vinculado: '🔗' };
        const titulos = { automovil: 'Automóvil', moto: 'Motocicleta', vinculado: 'Vinculado (Persona + Vehículo)' };
        let html = `<div class="tipo-selector"><h3>⚠️ Se encontraron registros en múltiples tipos. Seleccione cuál desea ver:</h3><div class="tipo-options">`;
        Object.keys(agrupados).forEach(tipo => {
            const count = agrupados[tipo].length;
            html += `<div class="tipo-option" onclick="window.seleccionarTipoVehiculo('${tipo}')"><div class="tipo-option-icon">${iconos[tipo]}</div><div class="tipo-option-title">${titulos[tipo]}</div><div class="tipo-option-detail">${count} registro(s) encontrado(s)</div></div>`;
        });
        html += `</div></div>`;
        tipoSelector.innerHTML = html;
        tipoSelector.style.display = 'block';
    }

    window.seleccionarTipoVehiculo = async function(tipo) {
        if (!resultadosMultiples) return;
        const seleccionados = resultadosMultiples.filter(r => r.tipo_registro === tipo);
        if (seleccionados.length === 1) {
            vehiculoActual = seleccionados[0];
            tipoRegistroActual = tipo;
            tipoSelector.style.display = 'none';
            await renderFichaBreve(vehiculoActual, tipoRegistroActual);
            await cargarIncidencias(vehiculoActual.placa || vehiculoActual.serial_carroceria || vehiculoActual.serial_motor, tipoRegistroActual, 1);
            mostrarMensaje('✅ Vehículo seleccionado', 'success');
        } else {
            vehiculoActual = seleccionados[0];
            tipoRegistroActual = tipo;
            tipoSelector.style.display = 'none';
            await renderFichaBreve(vehiculoActual, tipoRegistroActual);
            await cargarIncidencias(vehiculoActual.placa || vehiculoActual.serial_carroceria || vehiculoActual.serial_motor, tipoRegistroActual, 1);
            mostrarMensaje(`✅ Mostrando primero de ${seleccionados.length} registros`, 'info');
        }
    };

    async function renderFichaBreve(data, tipo) {
        if (!fichaBreve) return;
        const estatus = data.estatus || 'N/A';
        const estatusLower = (estatus || '').toLowerCase();
        const estatusClass = estatusLower.includes('verificaci') ? 'estatus-verificacion' :
                             estatusLower.includes('procesad') ? 'estatus-procesado' : 'estatus-liberado';
        const tipoIconos = { automovil: '🚗', moto: '🏍️', vinculado: '🔗' };
        const tipoTitulos = { automovil: 'Automóvil', moto: 'Motocicleta', vinculado: 'Vehículo Vinculado' };
        
        let alertasHtml = '';
        if (estatusLower.includes('procesad') && datosProcesado?.tipo_delito) {
            alertasHtml += `<div class="ficha-alert ficha-alert-delito">⚖️ <strong>Procesado por:</strong> ${datosProcesado.tipo_delito}</div>`;
        }
        const problemaJudicial = data.problema_judicial || '';
        if (problemaJudicial && problemaJudicial.trim() !== '' && problemaJudicial.toLowerCase() !== 'no') {
            alertasHtml += `<div class="ficha-alert ficha-alert-judicial">⚠️ <strong>Antecedentes:</strong> ${problemaJudicial}</div>`;
        }

        let htmlCampos = `
            <div class="ficha-breve-item"><div class="ficha-breve-label">Placa</div><div class="ficha-breve-value" style="font-weight:800; color:var(--primary); font-size:1.1rem;">${data.placa || 'N/A'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Tipo</div><div class="ficha-breve-value">${tipoIconos[tipo]} ${tipoTitulos[tipo]}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Vehículo</div><div class="ficha-breve-value">${data.tipo_vehiculo || data.marca_vehiculo || 'N/A'} ${data.marca_vehiculo || ''} ${data.modelo_vehiculo || ''}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Año</div><div class="ficha-breve-value">${data.anio_vehiculo || 'N/A'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Color</div><div class="ficha-breve-value">${data.color_vehiculo || 'N/A'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Estación</div><div class="ficha-breve-value">${data.estacion_policial || 'N/A'}</div></div>
        `;
        
        if (tipo === 'vinculado' && data.primer_nombre) {
            htmlCampos += `
                <div class="ficha-breve-item"><div class="ficha-breve-label">Conductor</div><div class="ficha-breve-value">${data.primer_nombre || ''} ${data.primer_apellido || ''}</div></div>
                <div class="ficha-breve-item"><div class="ficha-breve-label">Cédula</div><div class="ficha-breve-value">${data.cedula || 'N/A'}</div></div>
            `;
        }
        
        const observaciones = data.observaciones || '';
        if (observaciones) {
            htmlCampos += `<div class="ficha-breve-item full-width"><div class="ficha-breve-label">📝 Observaciones</div><div class="ficha-breve-value">${observaciones}</div></div>`;
        }

        const tienePermisos = await tienePermisosIncidencia();
        const btnIncidenciaHtml = tienePermisos
            ? `<button type="button" class="btn-nueva-incidencia" id="cv_btn_nueva_incidencia">➕ Nueva Incidencia</button>`
            : '';

        let html = `
            <div class="ficha-breve">
                <div class="ficha-breve-header">
                    <h3>${tipoIconos[tipo]} ${data.placa || 'N/A'} - ${data.marca_vehiculo || ''} ${data.modelo_vehiculo || ''}</h3>
                    <span class="estatus-badge ${estatusClass}">${estatus}</span>
                </div>
                ${alertasHtml}
                <div class="ficha-breve-grid">${htmlCampos}</div>
                <div class="ficha-breve-actions">
                    <button type="button" class="btn-ver-detalles" id="cv_btn_ver_detalles">📋 Ver Detalles Completos</button>
                    ${btnIncidenciaHtml}
                </div>
            </div>
        `;

        fichaBreve.innerHTML = html;
        fichaBreve.style.display = 'block';

        setTimeout(() => {
            const btnDetalles = el('cv_btn_ver_detalles');
            if (btnDetalles) btnDetalles.onclick = () => mostrarDetallesCompletos(data, tipo);
            const btnIncidencia = el('cv_btn_nueva_incidencia');
            if (btnIncidencia) {
                btnIncidencia.onclick = () => {
                    modalIncidencia.classList.add('active');
                    el('cv_incidencia_descripcion').value = '';
                    el('cv_incidencia_descripcion').focus();
                };
            }
        }, 100);
    }

    // ✅ FUNCIÓN ASYNC PARA MOSTRAR DETALLES CON REPORTE
    async function mostrarDetallesCompletos(data, tipo) {
        if (!modalBody || !modalTitulo) return;
        modalTitulo.textContent = `📋 Detalles - ${tipo === 'automovil' ? 'Automóvil' : tipo === 'moto' ? 'Motocicleta' : 'Vehículo Vinculado'}`;
        modalBody.innerHTML = '<div class="loading">⏳ Generando número de reporte oficial...</div>';
        modalDetalles.classList.add('active');

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const fechaHoy = new Date();
            const fechaStr = fechaHoy.getFullYear().toString() + String(fechaHoy.getMonth() + 1).padStart(2, '0') + String(fechaHoy.getDate()).padStart(2, '0');

            const identificador = data.placa || data.serial_carroceria || data.serial_motor;

            const [nuevoReporte, datosProcesadosCompletos] = await Promise.all([
                window.supabaseClient
                    .from('reportes_generados')
                    .insert([{
                        fecha_texto: fechaStr,
                        cedula_consultada: identificador,
                        tipo_registro: tipo,
                        user_id: user.id,
                        user_email: user.email
                    }])
                    .select('consecutivo_global')
                    .single(),
                
                (data.estatus || '').toLowerCase().includes('procesad')
                    ? window.supabaseClient
                        .from('registro_procesados')
                        .select('*')
                        .eq('cedula', data.cedula || identificador)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()
                    : Promise.resolve({ data: null })
            ]);

            if (nuevoReporte.error) throw nuevoReporte.error;
            
            const consecutivoFormateado = String(nuevoReporte.data.consecutivo_global).padStart(8, '0');
            const numeroReporteFinal = `REPORTE-CPNB-${fechaStr}-N° ${consecutivoFormateado}`;
            const datosProcesados = datosProcesadosCompletos.data;

            let html = `<div class="reporte-header-print" style="text-align: center; margin-bottom: 20px; border-bottom: 3px double var(--primary); padding-bottom: 15px;">
                <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 10px;">
                    <img src="img/LOGO-PNB.png" alt="Logo PNB" style="max-height: 90px; width: auto;" onerror="this.style.display='none'">
                </div>
                <h2 style="color: var(--primary); margin: 0; font-family: 'Playfair Display', serif;">CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h2>
                <h3 style="color: var(--secondary); margin: 5px 0; font-size: 1rem;">CENTRO DE COORDINACIÓN POLICIAL ESTADAL (CCPE) ZULIA</h3>
                <p style="font-size: 0.9rem; color: #334155; margin-top: 15px;">
                    <strong>N° de Reporte:</strong> 
                    <span style="color: var(--primary); font-weight: 800; font-size: 1.1rem;">${numeroReporteFinal}</span>
                </p>
                <p style="font-size: 0.85rem; color: #64748b;"><strong>Fecha de Consulta:</strong> ${fechaHoy.toLocaleString('es-VE')}</p>
                <p style="font-size: 0.85rem; color: #64748b;"><strong>Generado por:</strong> ${user.email}</p>
            </div>`;

            // Fotos del vehículo
            if (data.foto_frontal_vehiculo || data.foto_trasera_vehiculo || data.foto_lado_der_vehiculo || data.foto_lado_izq_vehiculo) {
                html += `<div class="seccion-titulo">📸 Fotografías del Vehículo</div><div class="fotos-container">`;
                if (data.foto_frontal_vehiculo) html += `<div class="foto-item"><img src="${data.foto_frontal_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                if (data.foto_trasera_vehiculo) html += `<div class="foto-item"><img src="${data.foto_trasera_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Trasera</div></div>`;
                if (data.foto_lado_der_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_der_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Der.</div></div>`;
                if (data.foto_lado_izq_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_izq_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Izq.</div></div>`;
                html += `</div>`;
            }

            // ✅ ALERTAS DE DELITO Y ANTECEDENTES
            let alertasHtml = '';
            if (datosProcesados?.tipo_delito) {
                alertasHtml += `<div class="ficha-alert ficha-alert-delito" style="page-break-inside: avoid; margin: 15px 0;">⚖️ <strong>Procesado por:</strong> ${datosProcesados.tipo_delito}</div>`;
            }
            const problemaJudicial = data.problema_judicial || '';
            if (problemaJudicial && problemaJudicial.trim() !== '' && problemaJudicial.toLowerCase() !== 'no') {
                alertasHtml += `<div class="ficha-alert ficha-alert-judicial" style="page-break-inside: avoid; margin: 15px 0;">⚠️ <strong>Antecedentes:</strong> ${problemaJudicial}</div>`;
            }

            // Datos del vehículo
            html += `<div class="seccion-titulo">🚗 Datos del Vehículo</div>`;
            html += alertasHtml;
            html += `<div class="ficha-completa-grid">`;
            
            const camposVehiculo = [
                { label: 'Placa', value: data.placa, highlight: true },
                { label: 'Tipo', value: data.tipo_vehiculo },
                { label: 'Marca', value: data.marca_vehiculo },
                { label: 'Modelo', value: data.modelo_vehiculo },
                { label: 'Color', value: data.color_vehiculo },
                { label: 'Año', value: data.anio_vehiculo },
                { label: 'Serial Motor', value: data.serial_motor },
                { label: 'Serial Carroc.', value: data.serial_carroceria },
                { label: 'Cilindraje', value: data.cilindraje },
                { label: 'Marca Corporal', value: data.marca_corporal },
                { label: 'Estación', value: data.estacion_policial },
                { label: 'Dir. Detención', value: data.direccion_detencion },
                { label: 'Estatus', value: data.estatus }
            ];
            camposVehiculo.forEach(c => {
                if (c.value !== null && c.value !== undefined && c.value !== '') {
                    const style = c.highlight ? 'font-weight:800; color:var(--primary); font-size:1.1rem;' : '';
                    html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value" style="${style}">${c.value}</div></div>`;
                }
            });
            if (data.observaciones) {
                html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Observaciones</div><div class="ficha-completa-value">${data.observaciones}</div></div>`;
            }
            html += `</div>`;

            // Si es vinculado, mostrar datos de la persona
            if (tipo === 'vinculado' && data.primer_nombre) {
                if (data.foto_frontal_persona || data.foto_perfil_izq_persona || data.foto_perfil_der_persona) {
                    html += `<div class="seccion-titulo">📸 Fotografías de la Persona</div><div class="fotos-container">`;
                    if (data.foto_frontal_persona) html += `<div class="foto-item"><img src="${data.foto_frontal_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                    if (data.foto_perfil_izq_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_izq_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Izq.</div></div>`;
                    if (data.foto_perfil_der_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_der_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Der.</div></div>`;
                    html += `</div>`;
                }
                html += `<div class="seccion-titulo">👤 Datos de la Persona</div><div class="ficha-completa-grid">`;
                const camposPersona = [
                    { label: 'Primer Nombre', value: data.primer_nombre },
                    { label: 'Segundo Nombre', value: data.segundo_nombre },
                    { label: 'Primer Apellido', value: data.primer_apellido },
                    { label: 'Segundo Apellido', value: data.segundo_apellido },
                    { label: 'Cédula', value: data.cedula },
                    { label: 'Fecha Nac.', value: data.fecha_nacimiento },
                    { label: 'Edad', value: data.edad ? `${data.edad} años` : null },
                    { label: 'Nacionalidad', value: data.nacionalidad },
                    { label: 'Sexo', value: data.sexo },
                    { label: 'Teléfono', value: `${data.tlf_pais || ''} ${data.tlf_numero || ''}`.trim() || null },
                    { label: 'Dirección', value: data.direccion }
                ];
                camposPersona.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`;
                    }
                });
                html += `</div>`;
            }

            // Incidencias (todas para impresión)
            html += `<div class="seccion-titulo" style="margin-top: 30px;">📜 Historial de Incidencias</div>`;
            try {
                const identificadorInc = data.placa || data.serial_carroceria || data.serial_motor;
                const { data: incidencias } = await window.supabaseClient.from('registro_incidencias').select('*').eq('cedula', identificadorInc).eq('tipo_registro', tipo).order('fecha_hora', { ascending: false });
                if (incidencias && incidencias.length > 0) {
                    html += `<div class="incidencias-print-container">`;
                    incidencias.forEach(inc => {
                        html += `<div class="incidencia-item-print" style="border: 1px solid #e2e8f0; padding: 10px; margin-bottom: 10px; border-left: 4px solid var(--secondary); border-radius: 4px; page-break-inside: avoid;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; margin-bottom: 5px;">
                                <span>🕒 ${new Date(inc.fecha_hora).toLocaleString('es-VE')}</span>
                                <span>Por: ${inc.email_registrante || 'N/A'}</span>
                            </div>
                            <div style="font-size: 0.9rem; color: #1e293b; line-height: 1.5;">${inc.descripcion}</div>
                        </div>`;
                    });
                    html += `</div>`;
                } else {
                    html += `<div style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic; border: 1px dashed #cbd5e1; border-radius: 5px;">No hay incidencias registradas para este expediente.</div>`;
                }
            } catch (err) { /* Silencioso */ }

            html += `<div class="reporte-footer-print" style="margin-top: 40px; text-align: center; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                <p>Documento generado electrónicamente por el Sistema de Verificación y Registro Policial.</p>
                <p>Este reporte es de carácter informativo y confidencial. Uso exclusivo del CPNB.</p>
            </div>`;

            modalBody.innerHTML = html;

        } catch (err) {
            console.error('Error generando reporte:', err);
            modalBody.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger);">
                <h3>❌ Error al generar el reporte</h3>
                <p>${err.message}</p>
            </div>`;
        }
    }

    // ✅ FUNCIÓN DE PAGINACIÓN PARA INCIDENCIAS
    async function cargarIncidencias(identificador, tipo, pagina = 1) {
        if (!incidenciasSection) return;
        
        identificadorActualIncidencias = identificador;
        tipoActualIncidencias = tipo;
        incidenciasPaginaActual = pagina;
        
        try {
            const desde = (pagina - 1) * incidenciasPorPagina;
            const hasta = desde + incidenciasPorPagina - 1;
            
            const { data: todasIncidencias, error: errorCount } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*', { count: 'exact', head: false })
                .eq('cedula', identificador)
                .eq('tipo_registro', tipo);
            
            if (errorCount) throw errorCount;
            
            totalIncidencias = todasIncidencias ? todasIncidencias.length : 0;
            const totalPaginas = Math.ceil(totalIncidencias / incidenciasPorPagina);
            
            const { data: incidencias, error } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*')
                .eq('cedula', identificador)
                .eq('tipo_registro', tipo)
                .order('fecha_hora', { ascending: false })
                .range(desde, hasta);
            
            if (error) throw error;

            let html = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3>';
            
            if (!incidencias || incidencias.length === 0) {
                html += '<div class="sin-incidencias">No hay incidencias registradas</div>';
            } else {
                incidencias.forEach(inc => {
                    html += `<div class="incidencia-item">
                        <div class="incidencia-item-header">
                            <span class="incidencia-fecha">🕒 ${new Date(inc.fecha_hora).toLocaleString('es-VE')}</span>
                            <span class="incidencia-autor">Por: ${inc.email_registrante || 'N/A'}</span>
                        </div>
                        <div class="incidencia-descripcion">${inc.descripcion}</div>
                    </div>`;
                });
                
                if (totalPaginas > 1) {
                    html += `<div class="paginacion-incidencias">`;
                    html += `<button type="button" class="btn-paginacion" ${pagina === 1 ? 'disabled' : ''} onclick="window.cambiarPaginaIncidenciasVehiculos(${pagina - 1})">⬅️ Anterior</button>`;
                    html += `<span style="font-size: 0.9rem; color: #64748b; font-weight: 600;">Página ${pagina} de ${totalPaginas} (${totalIncidencias} incidencias)</span>`;
                    html += `<button type="button" class="btn-paginacion" ${pagina === totalPaginas ? 'disabled' : ''} onclick="window.cambiarPaginaIncidenciasVehiculos(${pagina + 1})">Siguiente ➡️</button>`;
                    html += `</div>`;
                }
            }
            
            html += '</div>';
            incidenciasSection.innerHTML = html;
            incidenciasSection.style.display = 'block';
        } catch (err) {
            console.error('Error cargando incidencias:', err);
            incidenciasSection.innerHTML = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3><div class="sin-incidencias">Error al cargar</div></div>';
            incidenciasSection.style.display = 'block';
        }
    }

    // ✅ FUNCIÓN GLOBAL PARA CAMBIAR DE PÁGINA
    window.cambiarPaginaIncidenciasVehiculos = function(nuevaPagina) {
        if (identificadorActualIncidencias && tipoActualIncidencias) {
            cargarIncidencias(identificadorActualIncidencias, tipoActualIncidencias, nuevaPagina);
        }
    };

    async function guardarIncidencia() {
        const descripcion = el('cv_incidencia_descripcion')?.value.trim();
        if (!descripcion) { alert('⚠️ Ingrese una descripción'); return; }

        const btnGuardar = el('cv_btn_guardar_incidencia');
        btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Guardando...';

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const identificador = vehiculoActual.placa || vehiculoActual.serial_carroceria || vehiculoActual.serial_motor;
            const incidencia = {
                cedula: identificador,
                tipo_registro: tipoRegistroActual,
                descripcion: descripcion,
                fecha_hora: new Date().toISOString(),
                registrada_por: user.id,
                email_registrante: user.email
            };

            const { error } = await window.supabaseClient.from('registro_incidencias').insert([incidencia]);
            if (error) throw error;

            modalIncidencia.classList.remove('active');
            mostrarMensaje('✅ Incidencia registrada', 'success');
            await cargarIncidencias(identificador, tipoRegistroActual, 1);
        } catch (err) {
            console.error('Error:', err);
            alert('❌ Error: ' + err.message);
        } finally {
            btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Incidencia';
        }
    }

    console.log("✅ Módulo consulta-vehiculos.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConsultaVehiculos);
} else {
    window.initConsultaVehiculos();
}
