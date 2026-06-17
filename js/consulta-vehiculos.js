window.initConsultaVehiculos = function() {
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

    if (btnBuscar) btnBuscar.onclick = () => buscarVehiculo();
    if (buscarInput) {
        buscarInput.onkeypress = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnBuscar?.click(); }
        };
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
                .from('perfiles_usuario').select('nivel').eq('user_id', user.id).maybeSingle();
            if (error || !perfil) return false;
            const nivel = (perfil.nivel || '').toLowerCase().trim();
            return nivel === 'administrador' || nivel === 'moderador';
        } catch (err) {
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

        try {
            const resultados = [];

            const { data: automoviles, error: errAuto } = await window.supabaseClient
                .from('registro_automoviles').select('*').eq(tipoBusqueda, valor);
            if (errAuto) throw errAuto;
            if (automoviles && automoviles.length > 0) {
                automoviles.forEach(v => resultados.push({ ...v, tipo_registro: 'automovil' }));
            }

            const { data: motos, error: errMoto } = await window.supabaseClient
                .from('registro_motos').select('*').eq(tipoBusqueda, valor);
            if (errMoto) throw errMoto;
            if (motos && motos.length > 0) {
                motos.forEach(v => resultados.push({ ...v, tipo_registro: 'moto' }));
            }

            const { data: vinculados, error: errVinc } = await window.supabaseClient
                .from('registro_vinculado').select('*').eq(tipoBusqueda, valor);
            if (errVinc) throw errVinc;
            if (vinculados && vinculados.length > 0) {
                for (const v of vinculados) {
                    resultados.push({ ...v, tipo_registro: 'vinculado' });
                    const estatus = (v.estatus || '').toLowerCase();
                    if (estatus.includes('procesad') && v.cedula) {
                        try {
                            const { data: procData } = await window.supabaseClient
                                .from('registro_procesados').select('tipo_delito').eq('cedula', v.cedula)
                                .order('created_at', { ascending: false }).limit(1).maybeSingle();
                            if (procData) datosProcesado = procData;
                        } catch (e) { }
                    }
                }
            }

            if (resultados.length === 0) {
                mostrarMensaje('❌ No se encontró ningún vehículo con ese valor', 'error');
                return;
            }

 
            if (typeof window.registrarLog === 'function') {
                const primerResultado = resultados[0];
                window.registrarLog(
                    'CONSULTA_VEHICULO',
                    'VEHICULOS',
                    {
                        tipo_busqueda: tipoBusqueda,
                        valor_buscado: valor,
                        resultados_encontrados: resultados.length,
                        estatus: primerResultado.estatus || 'N/A',
                        placa: primerResultado.placa || null,
                        marca: primerResultado.marca || primerResultado.marca_vehiculo || null,
                        modelo: primerResultado.modelo || primerResultado.modelo_vehiculo || null
                    },
                    primerResultado.id
                );
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
                const identificador = vehiculoActual.placa || vehiculoActual.serial_carroceria || vehiculoActual.serial_motor;
                await window.cargarIncidenciasVehiculo(identificador, tipoRegistroActual, 1);
                mostrarMensaje('✅ Vehículo encontrado', 'success');
            }
        } catch (err) {
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
            html += `<div class="tipo-option" onclick="window.seleccionarTipoVehiculo('${tipo}')">
                <div class="tipo-option-icon">${iconos[tipo]}</div>
                <div class="tipo-option-title">${titulos[tipo]}</div>
                <div class="tipo-option-detail">${count} registro(s) encontrado(s)</div>
            </div>`;
        });
        html += `</div></div>`;
        tipoSelector.innerHTML = html;
        tipoSelector.style.display = 'block';
    }

    window.seleccionarTipoVehiculo = async function(tipo) {
        if (!resultadosMultiples) return;
        const seleccionados = resultadosMultiples.filter(r => r.tipo_registro === tipo);
        if (seleccionados.length >= 1) {
            vehiculoActual = seleccionados[0];
            tipoRegistroActual = tipo;
            tipoSelector.style.display = 'none';
            await renderFichaBreve(vehiculoActual, tipoRegistroActual);
            const identificador = vehiculoActual.placa || vehiculoActual.serial_carroceria || vehiculoActual.serial_motor;
            await window.cargarIncidenciasVehiculo(identificador, tipoRegistroActual, 1);
            mostrarMensaje('✅ Vehículo seleccionado', 'success');


            if (typeof window.registrarLog === 'function' && vehiculoActual) {
                window.registrarLog(
                    'CONSULTA_VEHICULO',
                    'VEHICULOS',
                    {
                        tipo_busqueda: tipoBusquedaSelect?.value || 'placa',
                        valor_buscado: buscarInput?.value.trim().toUpperCase() || '',
                        tipo_seleccionado: tipo,
                        estatus: vehiculoActual.estatus || 'N/A',
                        placa: vehiculoActual.placa || null,
                        marca: vehiculoActual.marca || vehiculoActual.marca_vehiculo || null,
                        modelo: vehiculoActual.modelo || vehiculoActual.modelo_vehiculo || null
                    },
                    vehiculoActual.id
                );
            }
        }
    };

    async function renderFichaBreve(data, tipo) {
        if (!fichaBreve) return;
        const estatus = data.estatus || 'N/A';
        const estatusLower = (estatus || '').toLowerCase();
        const estatusClass = estatusLower.includes('verificaci') ? 'estatus-verificacion' :
            estatusLower.includes('procesad') ? 'estatus-procesado' : 'estatus-liberado';
        const tipoIconos = { automovil: '🚗', moto: '️', vinculado: '🔗' };
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
        `;

        if (tipo === 'automovil' || tipo === 'moto') {
            htmlCampos += `
                <div class="ficha-breve-item"><div class="ficha-breve-label">Vehículo</div><div class="ficha-breve-value">${data.marca || 'N/A'} ${data.modelo || ''}</div></div>
                <div class="ficha-breve-item"><div class="ficha-breve-label">Año</div><div class="ficha-breve-value">${data.anio || 'N/A'}</div></div>
                <div class="ficha-breve-item"><div class="ficha-breve-label">Color</div><div class="ficha-breve-value">${data.color || 'N/A'}</div></div>
            `;
        } else if (tipo === 'vinculado') {
            htmlCampos += `
                <div class="ficha-breve-item"><div class="ficha-breve-label">Vehículo</div><div class="ficha-breve-value">${data.marca_vehiculo || 'N/A'} ${data.modelo_vehiculo || ''}</div></div>
                <div class="ficha-breve-item"><div class="ficha-breve-label">Año</div><div class="ficha-breve-value">${data.anio_vehiculo || 'N/A'}</div></div>
                <div class="ficha-breve-item"><div class="ficha-breve-label">Color</div><div class="ficha-breve-value">${data.color_vehiculo || 'N/A'}</div></div>
            `;
            if (data.primer_nombre) {
                htmlCampos += `
                    <div class="ficha-breve-item"><div class="ficha-breve-label">Conductor</div><div class="ficha-breve-value">${data.primer_nombre || ''} ${data.primer_apellido || ''}</div></div>
                    <div class="ficha-breve-item"><div class="ficha-breve-label">Cédula</div><div class="ficha-breve-value">${data.cedula || 'N/A'}</div></div>
                `;
            }
        }

        htmlCampos += `<div class="ficha-breve-item"><div class="ficha-breve-label">Estación</div><div class="ficha-breve-value">${data.estacion_policial || 'N/A'}</div></div>`;

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
                    <h3>${tipoIconos[tipo]} ${data.placa || 'N/A'} - ${tipo === 'vinculado' ? (data.marca_vehiculo || '') : (data.marca || '')} ${tipo === 'vinculado' ? (data.modelo_vehiculo || '') : (data.modelo || '')}</h3>
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

    async function mostrarDetallesCompletos(data, tipo) {
        if (!modalBody || !modalTitulo || !modalDetalles) return;
        modalTitulo.textContent = `📋 Detalles - ${tipo === 'automovil' ? 'Automóvil' : tipo === 'moto' ? 'Motocicleta' : 'Vehículo Vinculado'}`;
        modalBody.innerHTML = '<div class="loading">⏳ Generando reporte oficial...</div>';
        modalDetalles.classList.add('active');

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const fechaHoy = new Date();
            const fechaStr = fechaHoy.getFullYear().toString() + String(fechaHoy.getMonth() + 1).padStart(2, '0') + String(fechaHoy.getDate()).padStart(2, '0');
            const identificador = data.placa || data.serial_carroceria || data.serial_motor;

            const { data: nuevoReporte, error: errorReporte } = await window.supabaseClient
                .from('reportes_generados')
                .insert([{
                    fecha_texto: fechaStr,
                    cedula_consultada: identificador,
                    tipo_registro: tipo,
                    user_id: user.id,
                    user_email: user.email
                }])
                .select('consecutivo_global')
                .single();

            if (errorReporte) throw errorReporte;

            const consecutivoFormateado = String(nuevoReporte.consecutivo_global).padStart(8, '0');
            const numeroReporte = `REPORTE-CPNB-${fechaStr}-N° ${consecutivoFormateado}`;

            let datosProcesados = null;
            if ((data.estatus || '').toLowerCase().includes('procesad')) {
                const cedulaBusqueda = data.cedula || (tipo === 'vinculado' ? data.cedula : null);
                if (cedulaBusqueda) {
                    const { data: procData } = await window.supabaseClient
                        .from('registro_procesados')
                        .select('*')
                        .eq('cedula', cedulaBusqueda)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    datosProcesados = procData;
                }
            }

            let html = `<div class="reporte-header-print" style="text-align: center; margin-bottom: 20px; border-bottom: 3px double var(--primary); padding-bottom: 15px;">
                <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 10px;">
                    <img src="img/LOGO-PNB.png" alt="Logo PNB" style="max-height: 90px; width: auto;" onerror="this.style.display='none'">
                </div>
                <h2 style="color: var(--primary); margin: 0; font-family: 'Playfair Display', serif; font-size: 1.5rem;">CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h2>
                <h3 style="color: var(--secondary); margin: 5px 0; font-size: 1rem;">CENTRO DE COORDINACIÓN POLICIAL ESTADAL (CCPE) ZULIA</h3>
                <p style="font-size: 0.95rem; color: #334155; margin-top: 15px; font-weight: 600;">
                    N° de Reporte: <span style="color: var(--primary); font-size: 1.1rem;">${numeroReporte}</span>
                </p>
                <p style="font-size: 0.85rem; color: #64748b; margin: 5px 0;"><strong>Fecha de Consulta:</strong> ${fechaHoy.toLocaleString('es-VE')}</p>
                <p style="font-size: 0.85rem; color: #64748b; margin: 5px 0;"><strong>Generado por:</strong> ${user.email}</p>
            </div>`;

            if (datosProcesados?.tipo_delito) {
                html += `<div class="ficha-alert ficha-alert-delito" style="page-break-inside: avoid; margin: 15px 0; padding: 12px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 6px;">⚖️ <strong>Procesado por:</strong> ${datosProcesados.tipo_delito}</div>`;
            }

            const problemaJudicial = data.problema_judicial || '';
            if (problemaJudicial && problemaJudicial.trim() !== '' && problemaJudicial.toLowerCase() !== 'no') {
                html += `<div class="ficha-alert ficha-alert-judicial" style="page-break-inside: avoid; margin: 15px 0; padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; border-radius: 6px;">⚠️ <strong>Antecedentes:</strong> ${problemaJudicial}</div>`;
            }

            if (tipo === 'automovil' || tipo === 'moto') {
                if (data.foto_frontal || data.foto_trasera || data.foto_lado_derecho || data.foto_lado_izquierdo) {
                    html += `<div class="seccion-titulo">📸 Fotografías del Vehículo</div><div class="fotos-container">`;
                    if (data.foto_frontal) html += `<div class="foto-item"><img src="${data.foto_frontal}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                    if (data.foto_trasera) html += `<div class="foto-item"><img src="${data.foto_trasera}" onerror="this.style.display='none'"><div class="foto-item-label">Trasera</div></div>`;
                    if (data.foto_lado_derecho) html += `<div class="foto-item"><img src="${data.foto_lado_derecho}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Der.</div></div>`;
                    if (data.foto_lado_izquierdo) html += `<div class="foto-item"><img src="${data.foto_lado_izquierdo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Izq.</div></div>`;
                    html += `</div>`;
                }
            } else if (tipo === 'vinculado') {
                if (data.foto_frontal_persona || data.foto_perfil_izq_persona || data.foto_perfil_der_persona) {
                    html += `<div class="seccion-titulo">📸 Fotografías de la Persona</div><div class="fotos-container">`;
                    if (data.foto_frontal_persona) html += `<div class="foto-item"><img src="${data.foto_frontal_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                    if (data.foto_perfil_izq_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_izq_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Izq.</div></div>`;
                    if (data.foto_perfil_der_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_der_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Der.</div></div>`;
                    html += `</div>`;
                }
                if (data.foto_frontal_vehiculo || data.foto_trasera_vehiculo || data.foto_lado_der_vehiculo || data.foto_lado_izq_vehiculo) {
                    html += `<div class="seccion-titulo">📸 Fotografías del Vehículo</div><div class="fotos-container">`;
                    if (data.foto_frontal_vehiculo) html += `<div class="foto-item"><img src="${data.foto_frontal_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                    if (data.foto_trasera_vehiculo) html += `<div class="foto-item"><img src="${data.foto_trasera_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Trasera</div></div>`;
                    if (data.foto_lado_der_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_der_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Der.</div></div>`;
                    if (data.foto_lado_izq_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_izq_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Izq.</div></div>`;
                    html += `</div>`;
                }
            }

            html += `<div class="seccion-titulo">🚗 Datos del Vehículo</div><div class="ficha-completa-grid">`;

            if (tipo === 'automovil' || tipo === 'moto') {
                const campos = [
                    { label: 'Placa', value: data.placa, highlight: true },
                    { label: 'Marca', value: data.marca },
                    { label: 'Modelo', value: data.modelo },
                    { label: 'Año', value: data.anio },
                    { label: 'Color', value: data.color },
                    { label: 'Serial Motor', value: data.serial_motor },
                    { label: 'Serial Carroc.', value: data.serial_carroceria },
                    { label: 'Cilindraje', value: data.cilindraje },
                    { label: 'Tipo Carrocería', value: data.tipo_carroceria },
                    { label: 'Cédula Propietario', value: data.cedula_propietario },
                    { label: 'Estación', value: data.estacion_policial },
                    { label: 'Estatus', value: data.estatus }
                ];
                campos.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        const style = c.highlight ? 'font-weight:800; color:var(--primary); font-size:1.1rem;' : '';
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value" style="${style}">${c.value}</div></div>`;
                    }
                });
                if (data.observaciones) html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Observaciones</div><div class="ficha-completa-value">${data.observaciones}</div></div>`;
                if (data.direccion_detencion) html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Dirección de Detención</div><div class="ficha-completa-value">${data.direccion_detencion}</div></div>`;
            } else if (tipo === 'vinculado') {
                const campos = [
                    { label: 'Placa', value: data.placa, highlight: true },
                    { label: 'Tipo Vehículo', value: data.tipo_vehiculo },
                    { label: 'Marca', value: data.marca_vehiculo },
                    { label: 'Modelo', value: data.modelo_vehiculo },
                    { label: 'Año', value: data.anio_vehiculo },
                    { label: 'Color', value: data.color_vehiculo },
                    { label: 'Serial Motor', value: data.serial_motor },
                    { label: 'Serial Carroc.', value: data.serial_carroceria },
                    { label: 'Cilindraje', value: data.cilindraje },
                    { label: 'Marca Corporal', value: data.marca_corporal },
                    { label: 'Estación', value: data.estacion_policial },
                    { label: 'Estatus', value: data.estatus }
                ];
                campos.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        const style = c.highlight ? 'font-weight:800; color:var(--primary); font-size:1.1rem;' : '';
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value" style="${style}">${c.value}</div></div>`;
                    }
                });
                if (data.observaciones) html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Observaciones</div><div class="ficha-completa-value">${data.observaciones}</div></div>`;
            }
            html += `</div>`;

            if (tipo === 'vinculado' && data.primer_nombre) {
                html += `<div class="seccion-titulo"> Datos de la Persona</div><div class="ficha-completa-grid">`;
                const camposPersona = [
                    { label: 'Primer Nombre', value: data.primer_nombre },
                    { label: 'Segundo Nombre', value: data.segundo_nombre },
                    { label: 'Primer Apellido', value: data.primer_apellido },
                    { label: 'Segundo Apellido', value: data.segundo_apellido },
                    { label: 'Cédula', value: data.cedula },
                    { label: 'Fecha Nac.', value: data.fecha_nacimiento },
                    { label: 'Edad', value: data.edad ? `${data.edad} años` : null },
                    { label: 'Apodo', value: data.apodo },
                    { label: 'Nacionalidad', value: data.nacionalidad },
                    { label: 'Sexo', value: data.sexo },
                    { label: 'Estatura', value: data.estatura_cm ? `${data.estatura_cm} cm` : null },
                    { label: 'Color Piel', value: data.color_piel },
                    { label: 'Color Ojos', value: data.color_ojos },
                    { label: 'Color Cabello', value: data.color_cabello },
                    { label: 'Complexión', value: data.complexion },
                    { label: 'Teléfono', value: `${data.tlf_pais || ''} ${data.tlf_numero || ''}`.trim() || null },
                    { label: 'Dirección', value: data.direccion },
                    { label: 'Lentes', value: data.usa_lentes !== undefined ? (data.usa_lentes ? 'Sí' : 'No') : null },
                    { label: 'Detalle Lentes', value: data.detalle_lentes },
                    { label: 'Perforaciones', value: data.perforaciones !== undefined ? (data.perforaciones ? 'Sí' : 'No') : null },
                    { label: 'Detalle Perfor.', value: data.detalle_perforaciones },
                    { label: 'Cond. Médica', value: data.condicion_medica },
                    { label: 'Medicamento', value: data.consume_medicamento },
                    { label: 'Prob. Judicial', value: data.problema_judicial }
                ];
                camposPersona.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`;
                    }
                });
                html += `</div>`;
            }

            html += `<div class="seccion-titulo" style="margin-top: 30px;">📜 Historial de Incidencias</div>`;
            try {
                const { data: incidencias } = await window.supabaseClient.from('registro_incidencias').select('*').eq('cedula', identificador).eq('tipo_registro', tipo).order('fecha_hora', { ascending: false });
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
            } catch (err) { }

            html += `<div class="reporte-footer-print" style="margin-top: 40px; text-align: center; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                <p>Documento generado electrónicamente por el Sistema de Verificación y Registro Policial.</p>
                <p>Este reporte es de carácter informativo y confidencial. Uso exclusivo del CPNB.</p>
            </div>`;

            modalBody.innerHTML = html;
        } catch (err) {
            modalBody.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger);">
                <h3>❌ Error al generar el reporte</h3>
                <p>${err.message}</p>
            </div>`;
        }
    }

    window.cargarIncidenciasVehiculo = async function(identificador, tipo, pagina = 1) {
        const section = document.getElementById('cv_incidencias_section');
        if (!section) return;

        try {
            const { data: incidencias, error } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*')
                .eq('cedula', identificador)
                .eq('tipo_registro', tipo)
                .order('fecha_hora', { ascending: false });

            if (error) throw error;

            let html = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3>';

            if (!incidencias || incidencias.length === 0) {
                html += '<div class="sin-incidencias">No hay incidencias registradas</div>';
            } else {
                const esAdministrador = sessionStorage.getItem('pnb_user_nivel') === 'administrador';
                incidencias.forEach(inc => {
                    const btnEliminarHtml = esAdministrador
                        ? `<button class="btn-eliminar-incidencia"
                            data-id="${inc.id}"
                            data-identificador="${identificador}"
                            data-tipo="${tipo}"
                            data-pagina="${pagina}"
                            data-desc="${inc.descripcion}"
                            data-fecha="${inc.fecha_hora}"
                            data-autor="${inc.email_registrante || 'N/A'}"
                            onclick="window.prepararEliminacionVehiculo(this)">🗑️ Eliminar</button>`
                        : '';

                    html += `<div class="incidencia-item">
                        <div class="incidencia-item-header">
                            <div>
                                <span class="incidencia-fecha">🕒 ${new Date(inc.fecha_hora).toLocaleString('es-VE')}</span>
                                <span class="incidencia-autor">Por: ${inc.email_registrante || 'N/A'}</span>
                            </div>
                            ${btnEliminarHtml}
                        </div>
                        <div class="incidencia-descripcion">${inc.descripcion}</div>
                    </div>`;
                });
            }

            html += '</div>';
            section.innerHTML = html;
            section.style.display = 'block';
        } catch (err) {
            section.innerHTML = '<div class="incidencias-section"><h3> Historial de Incidencias</h3><div class="sin-incidencias">Error al cargar</div></div>';
            section.style.display = 'block';
        }
    };

    async function guardarIncidencia() {
        const descripcion = el('cv_incidencia_descripcion')?.value.trim();
        if (!descripcion) {
            mostrarMensaje('️ Ingrese una descripción', 'error');
            return;
        }
        if (!vehiculoActual) {
            mostrarMensaje('❌ Error: No hay un vehículo seleccionado', 'error');
            return;
        }

        const btnGuardar = el('cv_btn_guardar_incidencia');
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.textContent = '⏳ Guardando...';
        }

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

            const { data: insertedData, error } = await window.supabaseClient
                .from('registro_incidencias')
                .insert([incidencia])
                .select('id')
                .maybeSingle();

            if (error) throw error;

            if (modalIncidencia) modalIncidencia.classList.remove('active');
            mostrarMensaje('✅ Incidencia registrada', 'success');
            await window.cargarIncidenciasVehiculo(identificador, tipoRegistroActual, 1);


            if (typeof window.registrarLog === 'function' && insertedData?.id) {
                window.registrarLog(
                    'CREAR_INCIDENCIA_VEHICULO',
                    'VEHICULOS',
                    {
                        identificador: identificador,
                        tipo: tipoRegistroActual,
                        descripcion: descripcion,
                        placa: vehiculoActual.placa || null,
                        estatus: vehiculoActual.estatus || 'N/A'
                    },
                    insertedData.id
                );
            }
        } catch (err) {
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        } finally {
            const btnGuardarFinal = el('cv_btn_guardar_incidencia');
            if (btnGuardarFinal) {
                btnGuardarFinal.disabled = false;
                btnGuardarFinal.textContent = '💾 Guardar Incidencia';
            }
        }
    }


    window.prepararEliminacionVehiculo = function(btn) {
        window.incidenciaPendienteEliminacionVehiculo = {
            id: btn.dataset.id,
            identificador: btn.dataset.identificador,
            tipo: btn.dataset.tipo,
            pagina: parseInt(btn.dataset.pagina),
            descripcion: btn.dataset.desc,
            fecha: btn.dataset.fecha,
            autor: btn.dataset.autor
        };

        document.getElementById('cv_elim_descripcion').textContent = window.incidenciaPendienteEliminacionVehiculo.descripcion;
        document.getElementById('cv_elim_fecha').textContent = new Date(window.incidenciaPendienteEliminacionVehiculo.fecha).toLocaleString('es-VE');
        document.getElementById('cv_elim_autor').textContent = window.incidenciaPendienteEliminacionVehiculo.autor;
        document.getElementById('cv_modal_confirmar_eliminacion').classList.add('active');
    };

    document.getElementById('cv_btn_confirmar_eliminacion').onclick = async () => {
        const datos = window.incidenciaPendienteEliminacionVehiculo;
        if (!datos) return;

        const btnConfirmar = document.getElementById('cv_btn_confirmar_eliminacion');
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = '⏳ Procesando...';

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const { data: incData, error: fetchError } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*')
                .eq('id', datos.id)
                .single();

            if (fetchError) throw new Error('No se encontró la incidencia: ' + fetchError.message);

            const { id, created_at, ...datosBackup } = incData;
            datosBackup.incidencia_id_original = datos.id;
            datosBackup.eliminado_por = user.id;
            datosBackup.email_eliminador = user.email;
            datosBackup.fecha_eliminacion = new Date().toISOString();

            const { error: backupError } = await window.supabaseClient
                .from('registro_incidencias_backup')
                .insert([datosBackup])
                .select();

            if (backupError) throw new Error('Error al crear respaldo: ' + backupError.message);

            const { error: deleteError } = await window.supabaseClient
                .from('registro_incidencias')
                .delete()
                .eq('id', datos.id)
                .select();

            if (deleteError) throw new Error('Error al eliminar: ' + deleteError.message);

            document.getElementById('cv_modal_confirmar_eliminacion').classList.remove('active');
            window.incidenciaPendienteEliminacionVehiculo = null;
            await window.cargarIncidenciasVehiculo(datos.identificador, datos.tipo, datos.pagina);

            const msgEl = document.getElementById('cv_msg');
            if (msgEl) {
                msgEl.textContent = '✅ Incidencia eliminada y respaldada correctamente';
                msgEl.className = 'msg success';
                msgEl.style.display = 'block';
                setTimeout(() => { msgEl.style.display = 'none'; }, 4000);
            }


            if (typeof window.registrarLog === 'function') {
                window.registrarLog(
                    'ELIMINAR_INCIDENCIA_VEHICULO',
                    'VEHICULOS',
                    {
                        identificador: datos.identificador,
                        tipo: datos.tipo,
                        descripcion_eliminada: datos.descripcion,
                        placa: vehiculoActual?.placa || null,
                        estatus: vehiculoActual?.estatus || 'N/A'
                    },
                    datos.id
                );
            }
        } catch (err) {
            alert('❌ Error al eliminar: ' + err.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = '🗑️ Sí, Eliminar y Respaldar';
        }
    };

    console.log("✅ Módulo consulta-vehiculos.js inicializado correctamente");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConsultaVehiculos);
} else {
    window.initConsultaVehiculos();
}
