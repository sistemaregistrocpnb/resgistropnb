window.initConsultaPersonas = function() {
    const el = (id) => document.getElementById(id);
    const buscarInput = el('cp_buscar_cedula');
    const btnBuscar = el('cp_btn_buscar');
    const msg = el('cp_msg');
    const fichaBreve = el('cp_ficha_breve');
    const incidenciasSection = el('cp_incidencias_section');
    const modalDetalles = el('cp_modal_detalles');
    const modalIncidencia = el('cp_modal_incidencia');
    const modalTitulo = el('cp_modal_titulo');
    const modalBody = el('cp_modal_body');
    let personaActual = null;
    let tipoRegistroActual = null;
    let datosProcesado = null;
    let incidenciasPaginaActual = 1;
    const incidenciasPorPagina = 10;
    let totalIncidencias = 0;
    let cedulaActualIncidencias = null;
    let tipoActualIncidencias = null;
    async function logConsultaPersonas(accion, detalles, registroId = null) {
        if (typeof window.registrarLog !== 'function') {
            console.warn('⚠️ utils.js no disponible para registrar log');
            return;
        }
        try {
            await window.registrarLog(accion, 'PERSONAS', detalles, registroId);
        } catch (e) {
            console.warn('⚠️ Error registrando log:', e);
        }
    }

    function normalizarCedula(cedulaInput) {
        if (!cedulaInput) return '';
        let cedula = cedulaInput.trim().toUpperCase().replace(/\s/g, '');
        cedula = cedula.replace(/^[VE]-/, '');
        cedula = cedula.replace(/\D/g, '');
        return cedula;
    }

    if (btnBuscar) btnBuscar.onclick = () => buscarPersona();
    if (buscarInput) {
        buscarInput.oninput = (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8); };
        buscarInput.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); btnBuscar?.click(); } };
    }

    if (el('cp_modal_close')) el('cp_modal_close').onclick = () => modalDetalles.classList.remove('active');
    if (el('cp_modal_cerrar')) el('cp_modal_cerrar').onclick = () => modalDetalles.classList.remove('active');
    if (el('cp_modal_inc_close')) el('cp_modal_inc_close').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cp_btn_cancelar_incidencia')) el('cp_btn_cancelar_incidencia').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cp_btn_guardar_incidencia')) el('cp_btn_guardar_incidencia').onclick = () => guardarIncidencia();
    if (el('cp_btn_imprimir_reporte')) el('cp_btn_imprimir_reporte').onclick = () => window.print();
    if (el('cp_modal_elim_close')) el('cp_modal_elim_close').onclick = () => {
        el('cp_modal_confirmar_eliminacion').classList.remove('active');
        window.incidenciaPendienteEliminacion = null;
    };
    if (el('cp_btn_cancelar_eliminacion')) el('cp_btn_cancelar_eliminacion').onclick = () => {
        el('cp_modal_confirmar_eliminacion').classList.remove('active');
        window.incidenciaPendienteEliminacion = null;
    };

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

    async function buscarPersona() {
        const cedulaInput = buscarInput?.value.trim() || '';
        const cedulaNormalizada = normalizarCedula(cedulaInput);
        
        if (!cedulaNormalizada || cedulaNormalizada.length < 7 || cedulaNormalizada.length > 8) {
            mostrarMensaje('⚠️ Ingrese una cédula válida (entre 7 y 8 dígitos)', 'error');
            return;
        }

        console.log('🔍 Buscando cédula:', cedulaInput, '→ Normalizada:', cedulaNormalizada);

        mostrarMensaje('🔍 Buscando...', 'info');
        fichaBreve.style.display = 'none';
        incidenciasSection.style.display = 'none';
        personaActual = null;
        tipoRegistroActual = null;
        datosProcesado = null;
        incidenciasPaginaActual = 1;

        try {
    
            const { data: persona, error: errPersona } = await window.supabaseClient
                .from('registro_personas')
                .select('*')
                .eq('cedula', cedulaNormalizada)
                .maybeSingle();
            
            if (errPersona) throw errPersona;
            
            if (persona) {
                console.log('✅ Persona encontrada:', persona.cedula);
                personaActual = persona;
                tipoRegistroActual = 'persona';
                const estatus = (persona.estatus || '').toLowerCase();
                if (estatus.includes('procesad')) {
                    try {
                        const { data: procData } = await window.supabaseClient
                            .from('registro_procesados').select('tipo_delito').eq('cedula', cedulaNormalizada)
                            .order('created_at', { ascending: false }).limit(1).maybeSingle();
                        if (procData) datosProcesado = procData;
                    } catch (e) { /* Silencioso */ }
                }
                await renderFichaBreve(persona, 'persona');
                await window.cargarIncidencias(cedulaNormalizada, 'persona', 1);
                mostrarMensaje('✅ Persona encontrada', 'success');
                
                await logConsultaPersonas('CONSULTA', {
                    cedula_buscada: cedulaInput,
                    cedula_normalizada: cedulaNormalizada,
                    nombre_completo: `${persona.primer_nombre || ''} ${persona.primer_apellido || ''}`.trim() || 'No disponible',
                    tipo: 'Persona',
                    estacion: persona.estacion_policial || 'N/A',
                    estatus: 'Verificación'
                }, persona.id);
                return;
            }

            const { data: vinculado, error: errVinculado } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .eq('cedula', cedulaNormalizada)
                .maybeSingle();
            
            if (errVinculado) throw errVinculado;
            
            if (vinculado) {
                console.log('✅ Vinculado encontrado:', vinculado.cedula);
                personaActual = vinculado;
                tipoRegistroActual = 'vinculado';
                const estatus = (vinculado.estatus || '').toLowerCase();
                if (estatus.includes('procesad')) {
                    try {
                        const { data: procData } = await window.supabaseClient
                            .from('registro_procesados').select('tipo_delito').eq('cedula', cedulaNormalizada)
                            .order('created_at', { ascending: false }).limit(1).maybeSingle();
                        if (procData) datosProcesado = procData;
                    } catch (e) { /* Silencioso */ }
                }
                await renderFichaBreve(vinculado, 'vinculado');
                await window.cargarIncidencias(cedulaNormalizada, 'vinculado', 1);
                mostrarMensaje('✅ Vehículo vinculado encontrado', 'success');
                
                await logConsultaPersonas('CONSULTA', {
                    cedula_buscada: cedulaInput,
                    cedula_normalizada: cedulaNormalizada,
                    nombre_completo: `${vinculado.primer_nombre || ''} ${vinculado.primer_apellido || ''}`.trim() || 'No disponible',
                    tipo: 'Vinculado',
                    estacion: vinculado.estacion_policial || 'N/A',
                    placa: vinculado.placa || 'N/A',
                    estatus: 'Verificación'
                }, vinculado.id);
                return;
            }

                   console.log('❌ No se encontró en ninguna tabla');
            mostrarMensaje(' No se encontró ninguna persona con esa cédula', 'error');
        } catch (err) {
            console.error('Error buscando:', err);
            mostrarMensaje('❌ Error: ' + err.message, 'error');
            
            await logConsultaPersonas('ERROR', {
                accion: 'CONSULTA',
                cedula_buscada: cedulaInput,
                cedula_normalizada: cedulaNormalizada,
                error: err.message
            });
        }
    }

    async function renderFichaBreve(data, tipo) {
        if (!fichaBreve) return;
        const estatus = data.estatus || 'N/A';
        const estatusLower = (estatus || '').toLowerCase();
        const estatusClass = estatusLower.includes('verificaci') ? 'estatus-verificacion' :
            estatusLower.includes('procesad') ? 'estatus-procesado' : 'estatus-liberado';
        
        let nombreCompleto = tipo === 'persona'
            ? `${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}`.trim() || 'N/A'
            : ((data.primer_nombre && data.primer_apellido) ? `${data.primer_nombre} ${data.primer_apellido}` : (data.propietario || `Vehículo ${data.placa || ''}`));

        let alertasHtml = '';
        if (estatusLower.includes('procesad') && datosProcesado?.tipo_delito) {
            alertasHtml += `<div class="ficha-alert ficha-alert-delito">⚖️ <strong>Procesado por:</strong> ${datosProcesado.tipo_delito}</div>`;
        }
        const problemaJudicial = data.problema_judicial || '';
        if (problemaJudicial && problemaJudicial.trim() !== '' && problemaJudicial.toLowerCase() !== 'no') {
            alertasHtml += `<div class="ficha-alert ficha-alert-judicial">⚠️ <strong>Antecedentes:</strong> ${problemaJudicial}</div>`;
        }

        let htmlCampos = `
            <div class="ficha-breve-item"><div class="ficha-breve-label">Cédula</div><div class="ficha-breve-value">${data.cedula || 'N/A'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Tipo</div><div class="ficha-breve-value">${tipo === 'persona' ? '👤 Persona' : '🚗 Vinculado (Vehículo)'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Estación/Servicio de Detención</div><div class="ficha-breve-value">${data.estacion_policial || 'N/A'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Fecha</div><div class="ficha-breve-value">${new Date(data.created_at || data.creado_en).toLocaleString('es-VE')}</div></div>
        `;

        if (tipo === 'vinculado') {
            htmlCampos += `
                <div class="ficha-breve-item"><div class="ficha-breve-label">Vehículo</div><div class="ficha-breve-value">${data.tipo_vehiculo || 'N/A'} ${data.marca_vehiculo || ''} ${data.modelo_vehiculo || ''}</div></div>
                <div class="ficha-breve-item"><div class="ficha-breve-label">Placa</div><div class="ficha-breve-value" style="font-weight:800; color:var(--primary); font-size:1.1rem;">${data.placa || 'N/A'}</div></div>
            `;
        }

        if (data.observaciones) {
            htmlCampos += `<div class="ficha-breve-item full-width"><div class="ficha-breve-label">📝 Observaciones</div><div class="ficha-breve-value">${data.observaciones}</div></div>`;
        }

        const tienePermisos = await tienePermisosIncidencia();
        const btnIncidenciaHtml = tienePermisos
            ? `<button type="button" class="btn-nueva-incidencia" id="cp_btn_nueva_incidencia">➕ Nueva Incidencia</button>`
            : '';

        let html = `
            <div class="ficha-breve">
                <div class="ficha-breve-header">
                    <h3>${tipo === 'persona' ? '👤' : '🚗'} ${nombreCompleto}</h3>
                    <span class="estatus-badge ${estatusClass}">${estatus}</span>
                </div>
                ${alertasHtml}
                <div class="ficha-breve-grid">${htmlCampos}</div>
                <div class="ficha-breve-actions">
                    <button type="button" class="btn-ver-detalles" id="cp_btn_ver_detalles">📋 Ver Detalles Completos</button>
                    ${btnIncidenciaHtml}
                </div>
            </div>
        `;

        fichaBreve.innerHTML = html;
        fichaBreve.style.display = 'block';

        setTimeout(() => {
            const btnDetalles = el('cp_btn_ver_detalles');
            if (btnDetalles) btnDetalles.onclick = () => mostrarDetallesCompletos(data, tipo);
            const btnIncidencia = el('cp_btn_nueva_incidencia');
            if (btnIncidencia) {
                btnIncidencia.onclick = () => {
                    modalIncidencia.classList.add('active');
                    el('cp_incidencia_descripcion').value = '';
                    el('cp_incidencia_descripcion').focus();
                };
            }
        }, 100);
    }

    async function mostrarDetallesCompletos(data, tipo) {
        if (!modalBody || !modalTitulo) return;
        modalTitulo.textContent = `📋 Detalles - ${tipo === 'persona' ? 'Persona' : 'Vehículo Vinculado'}`;
        modalBody.innerHTML = '<div class="loading">⏳ Generando número de reporte oficial...</div>';
        modalDetalles.classList.add('active');

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const fechaHoy = new Date();
            const fechaStr = fechaHoy.getFullYear().toString() + String(fechaHoy.getMonth() + 1).padStart(2, '0') + String(fechaHoy.getDate()).padStart(2, '0');

            const [nuevoReporte, datosProcesadosCompletos] = await Promise.all([
                window.supabaseClient
                    .from('reportes_generados')
                    .insert([{
                        fecha_texto: fechaStr,
                        cedula_consultada: data.cedula,
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
                        .eq('cedula', data.cedula)
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

            if (tipo === 'persona') {
                if (data.foto_frontal || data.foto_perfil_izq || data.foto_perfil_der) {
                    html += `<div class="seccion-titulo">📸 Fotografías</div><div class="fotos-container">`;
                    if (data.foto_frontal) html += `<div class="foto-item"><img src="${data.foto_frontal}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                    if (data.foto_perfil_izq) html += `<div class="foto-item"><img src="${data.foto_perfil_izq}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Izq.</div></div>`;
                    if (data.foto_perfil_der) html += `<div class="foto-item"><img src="${data.foto_perfil_der}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Der.</div></div>`;
                    html += `</div>`;
                }

                let alertasHtml = '';
                if (datosProcesados?.tipo_delito) {
                    alertasHtml += `<div class="ficha-alert ficha-alert-delito" style="page-break-inside: avoid; margin: 15px 0;">⚖️ <strong>Procesado por:</strong> ${datosProcesados.tipo_delito}</div>`;
                }
                const problemaJudicial = data.problema_judicial || '';
                if (problemaJudicial && problemaJudicial.trim() !== '' && problemaJudicial.toLowerCase() !== 'no') {
                    alertasHtml += `<div class="ficha-alert ficha-alert-judicial" style="page-break-inside: avoid; margin: 15px 0;">⚠️ <strong>Antecedentes:</strong> ${problemaJudicial}</div>`;
                }

                html += `<div class="seccion-titulo">👤 Datos Personales</div>`;
                html += alertasHtml;
                html += `<div class="ficha-completa-grid">`;
                const camposPersona = [
                    { label: 'Primer Nombre', value: data.primer_nombre },
                    { label: 'Segundo Nombre', value: data.segundo_nombre },
                    { label: 'Primer Apellido', value: data.primer_apellido },
                    { label: 'Segundo Apellido', value: data.segundo_apellido },
                    { label: 'Cédula', value: data.cedula },
                    { label: 'Estación de Detención', value: data.estacion_policial },
                    { label: 'Fecha Nac.', value: data.fecha_nacimiento },
                    { label: 'Edad', value: data.edad ? `${data.edad} años` : null },
                    { label: 'Nacionalidad', value: data.nacionalidad },
                    { label: 'Sexo', value: data.sexo },
                    { label: 'Estatura', value: data.estatura_cm ? `${data.estatura_cm} cm` : null },
                    { label: 'Color Piel', value: data.color_piel },
                    { label: 'Color Ojos', value: data.color_ojos },
                    { label: 'Cabello', value: data.color_cabello },
                    { label: 'Complexión', value: data.complexion },
                    { label: 'Teléfono', value: `${data.tlf_pais || ''} ${data.tlf_numero || ''}`.trim() || null },
                    { label: 'Dirección', value: data.direccion },
                    { label: 'Apodo', value: data.apodo },
                    { label: 'Marca Corporal', value: data.marca_corporal },
                    { label: 'Lentes', value: data.usa_lentes !== undefined ? (data.usa_lentes ? 'Sí' : 'No') : null },
                    { label: 'Detalle Lentes', value: data.detalle_lentes },
                    { label: 'Perforaciones', value: data.perforaciones !== undefined ? (data.perforaciones ? 'Sí' : 'No') : null },
                    { label: 'Detalle Perfor.', value: data.detalle_perforaciones },
                    { label: 'Cond. Médica', value: data.condicion_medica },
                    { label: 'Medicamento', value: data.consume_medicamento },
                    { label: 'Dir. Detención', value: data.direccion_detencion }
                ];

                camposPersona.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`;
                    }
                });

                if (data.observaciones) {
                    html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Observaciones</div><div class="ficha-completa-value">${data.observaciones}</div></div>`;
                }
                html += `</div>`;
            } else {
                if (data.foto_frontal_persona || data.foto_perfil_izq_persona || data.foto_perfil_der_persona) {
                    html += `<div class="seccion-titulo">📸 Fotografías de la Persona</div><div class="fotos-container">`;
                    if (data.foto_frontal_persona) html += `<div class="foto-item"><img src="${data.foto_frontal_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                    if (data.foto_perfil_izq_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_izq_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Izq.</div></div>`;
                    if (data.foto_perfil_der_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_der_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Der.</div></div>`;
                    html += `</div>`;
                }

                let alertasHtmlVinc = '';
                if (datosProcesados?.tipo_delito) {
                    alertasHtmlVinc += `<div class="ficha-alert ficha-alert-delito" style="page-break-inside: avoid; margin: 15px 0;">⚖️ <strong>Procesado por:</strong> ${datosProcesados.tipo_delito}</div>`;
                }
                const problemaJudicialVinc = data.problema_judicial || '';
                if (problemaJudicialVinc && problemaJudicialVinc.trim() !== '' && problemaJudicialVinc.toLowerCase() !== 'no') {
                    alertasHtmlVinc += `<div class="ficha-alert ficha-alert-judicial" style="page-break-inside: avoid; margin: 15px 0;">⚠️ <strong>Antecedentes:</strong> ${problemaJudicialVinc}</div>`;
                }

                html += `<div class="seccion-titulo">👤 Datos de la Persona</div>`;
                html += alertasHtmlVinc;
                html += `<div class="ficha-completa-grid">`;

                const camposPersonaVinc = [
                    { label: 'Primer Nombre', value: data.primer_nombre },
                    { label: 'Segundo Nombre', value: data.segundo_nombre },
                    { label: 'Primer Apellido', value: data.primer_apellido },
                    { label: 'Segundo Apellido', value: data.segundo_apellido },
                    { label: 'Cédula', value: data.cedula },
                    { label: 'Estación de Detención', value: data.estacion_policial },
                    { label: 'Fecha Nac.', value: data.fecha_nacimiento },
                    { label: 'Edad', value: data.edad ? `${data.edad} años` : null },
                    { label: 'Apodo', value: data.apodo },
                    { label: 'Nacionalidad', value: data.nacionalidad },
                    { label: 'Sexo', value: data.sexo },
                    { label: 'Estatura', value: data.estatura_cm ? `${data.estatura_cm} cm` : null },
                    { label: 'Color Piel', value: data.color_piel },
                    { label: 'Color Ojos', value: data.color_ojos },
                    { label: 'Cabello', value: data.color_cabello },
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

                camposPersonaVinc.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`;
                    }
                });
                html += `</div>`;

                if (data.foto_frontal_vehiculo || data.foto_trasera_vehiculo || data.foto_lado_der_vehiculo || data.foto_lado_izq_vehiculo) {
                    html += `<div class="seccion-titulo">📸 Fotografías del Vehículo</div><div class="fotos-container">`;
                    if (data.foto_frontal_vehiculo) html += `<div class="foto-item"><img src="${data.foto_frontal_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                    if (data.foto_trasera_vehiculo) html += `<div class="foto-item"><img src="${data.foto_trasera_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Trasera</div></div>`;
                    if (data.foto_lado_der_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_der_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Der.</div></div>`;
                    if (data.foto_lado_izq_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_izq_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Izq.</div></div>`;
                    html += `</div>`;
                }

                html += `<div class="seccion-titulo">🚗 Datos del Vehículo</div><div class="ficha-completa-grid">`;
                const camposVehiculo = [
                    { label: 'Placa', value: data.placa, highlight: true },
                    { label: 'Tipo', value: data.tipo_vehiculo },
                    { label: 'Marca', value: data.marca_vehiculo },
                    { label: 'Modelo', value: data.modelo_vehiculo },
                    { label: 'Color', value: data.color_vehiculo },
                    { label: 'Año', value: data.anio_vehiculo },
                    { label: 'Serial Motor', value: data.serial_motor },
                    { label: 'Serial Carrocería', value: data.serial_carroceria },
                    { label: 'Cilindraje', value: data.cilindraje },
                    { label: 'Marca Corporal (Vehículo)', value: data.marca_corporal }
                ];
                camposVehiculo.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        const style = c.highlight ? 'font-weight:800; color:var(--primary); font-size:1.1rem;' : '';
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value" style="${style}">${c.value}</div></div>`;
                    }
                });
                html += `</div>`;

                html += `<div class="seccion-titulo">🏛️ Datos de Detención</div><div class="ficha-completa-grid">`;
                const camposDetencion = [
                    { label: 'Estación Policial', value: data.estacion_policial },
                    { label: 'Dirección de Detención', value: data.direccion_detencion }
                ];
                camposDetencion.forEach(c => {
                    if (c.value !== null && c.value !== undefined && c.value !== '') {
                        html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`;
                    }
                });
                if (data.observaciones) {
                    html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Observaciones</div><div class="ficha-completa-value">${data.observaciones}</div></div>`;
                }
                html += `</div>`;
            }

            html += `<div class="seccion-titulo" style="margin-top: 30px;">📜 Historial de Incidencias</div>`;
            try {
                const { data: incidencias } = await window.supabaseClient.from('registro_incidencias').select('*').eq('cedula', data.cedula).eq('tipo_registro', tipo).order('fecha_hora', { ascending: false });
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

    window.cargarIncidencias = async function(cedula, tipo, pagina = 1) {
        if (!incidenciasSection) return;
        cedulaActualIncidencias = cedula;
        tipoActualIncidencias = tipo;
        incidenciasPaginaActual = pagina;

        try {
            const desde = (pagina - 1) * incidenciasPorPagina;
            const hasta = desde + incidenciasPorPagina - 1;

            const { data: todasIncidencias, error: errorCount } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*', { count: 'exact', head: false })
                .eq('cedula', cedula)
                .eq('tipo_registro', tipo);
            
            if (errorCount) throw errorCount;
            totalIncidencias = todasIncidencias ? todasIncidencias.length : 0;
            const totalPaginas = Math.ceil(totalIncidencias / incidenciasPorPagina);

            const { data: incidencias, error } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*')
                .eq('cedula', cedula)
                .eq('tipo_registro', tipo)
                .order('fecha_hora', { ascending: false })
                .range(desde, hasta);

            if (error) throw error;

            const esAdministrador = sessionStorage.getItem('pnb_user_nivel') === 'administrador';

            let html = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3>';
            if (!incidencias || incidencias.length === 0) {
                html += '<div class="sin-incidencias">No hay incidencias registradas</div>';
            } else {
                incidencias.forEach(inc => {
                    const btnEliminarHtml = esAdministrador
                        ? `<button class="btn-eliminar-incidencia"
                            data-id="${inc.id}"
                            data-cedula="${cedula}"
                            data-tipo="${tipo}"
                            data-pagina="${pagina}"
                            data-desc="${inc.descripcion}"
                            data-fecha="${inc.fecha_hora}"
                            data-autor="${inc.email_registrante || 'N/A'}"
                            onclick="window.prepararEliminacion(this)">🗑️ Eliminar</button>`
                        : '';
                    html += `
                        <div class="incidencia-item">
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

                if (totalPaginas > 1) {
                    html += `<div class="paginacion-incidencias" style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--beige-border);">`;
                    html += `<button type="button" class="btn-paginacion" ${pagina === 1 ? 'disabled' : ''} onclick="window.cambiarPaginaIncidencias(${pagina - 1})" style="padding: 8px 16px; background: ${pagina === 1 ? '#cbd5e1' : 'var(--primary)'}; color: white; border: none; border-radius: 5px; cursor: ${pagina === 1 ? 'not-allowed' : 'pointer'}; font-weight: 600;">⬅️ Anterior</button>`;
                    html += `<span style="font-size: 0.9rem; color: #64748b; font-weight: 600;">Página ${pagina} de ${totalPaginas} (${totalIncidencias} incidencias)</span>`;
                    html += `<button type="button" class="btn-paginacion" ${pagina === totalPaginas ? 'disabled' : ''} onclick="window.cambiarPaginaIncidencias(${pagina + 1})" style="padding: 8px 16px; background: ${pagina === totalPaginas ? '#cbd5e1' : 'var(--primary)'}; color: white; border: none; border-radius: 5px; cursor: ${pagina === totalPaginas ? 'not-allowed' : 'pointer'}; font-weight: 600;">Siguiente ➡️</button>`;
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
    };

    window.cambiarPaginaIncidencias = function(nuevaPagina) {
        if (cedulaActualIncidencias && tipoActualIncidencias) {
            window.cargarIncidencias(cedulaActualIncidencias, tipoActualIncidencias, nuevaPagina);
        }
    };

    async function guardarIncidencia() {
        const descripcion = el('cp_incidencia_descripcion')?.value.trim();
        if (!descripcion) { alert('⚠️ Ingrese una descripción'); return; }

        const btnGuardar = el('cp_btn_guardar_incidencia');
        btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Guardando...';

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const { data: insertedData, error } = await window.supabaseClient
                .from('registro_incidencias')
                .insert([{
                    cedula: personaActual.cedula,
                    tipo_registro: tipoRegistroActual,
                    descripcion: descripcion,
                    fecha_hora: new Date().toISOString(),
                    registrada_por: user.id,
                    email_registrante: user.email
                }])
                .select('id')
                .maybeSingle();

            if (error) throw error;

            modalIncidencia.classList.remove('active');
            mostrarMensaje('✅ Incidencia registrada', 'success');
            await window.cargarIncidencias(personaActual.cedula, tipoRegistroActual, 1);

            await logConsultaPersonas('CREAR', {
                cedula: personaActual.cedula,
                nombre_completo: `${personaActual.primer_nombre || ''} ${personaActual.primer_apellido || ''}`.trim() || 'No disponible',
                tipo: tipoRegistroActual,
                descripcion: descripcion,
                estacion: personaActual.estacion_policial || 'N/A'
            }, insertedData?.id);
        } catch (err) {
            console.error('Error guardando incidencia:', err);
            alert('❌ Error: ' + err.message);
        } finally {
            btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Incidencia';
        }
    }

    window.prepararEliminacion = function(btn) {
        window.incidenciaPendienteEliminacion = {
            id: btn.dataset.id,
            cedula: btn.dataset.cedula,
            tipo: btn.dataset.tipo,
            pagina: parseInt(btn.dataset.pagina),
            descripcion: btn.dataset.desc,
            fecha: btn.dataset.fecha,
            autor: btn.dataset.autor,
            nombre_completo: personaActual ? `${personaActual.primer_nombre || ''} ${personaActual.primer_apellido || ''}`.trim() : 'No disponible'
        };
        document.getElementById('cp_elim_descripcion').textContent = window.incidenciaPendienteEliminacion.descripcion;
        document.getElementById('cp_elim_fecha').textContent = new Date(window.incidenciaPendienteEliminacion.fecha).toLocaleString('es-VE');
        document.getElementById('cp_elim_autor').textContent = window.incidenciaPendienteEliminacion.autor;
        document.getElementById('cp_modal_confirmar_eliminacion').classList.add('active');
    };

    document.getElementById('cp_btn_confirmar_eliminacion').onclick = async () => {
        const datos = window.incidenciaPendienteEliminacion;
        if (!datos) return;

        const btnConfirmar = document.getElementById('cp_btn_confirmar_eliminacion');
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

            document.getElementById('cp_modal_confirmar_eliminacion').classList.remove('active');
            window.incidenciaPendienteEliminacion = null;

            await window.cargarIncidencias(datos.cedula, datos.tipo, datos.pagina);

            const msgEl = document.getElementById('cp_msg');
            if (msgEl) {
                msgEl.textContent = '✅ Incidencia eliminada y respaldada correctamente';
                msgEl.className = 'msg success';
                msgEl.style.display = 'block';
                setTimeout(() => { msgEl.style.display = 'none'; }, 3000);
            }

            await logConsultaPersonas('ELIMINAR', {
                cedula: datos.cedula,
                nombre_completo: datos.nombre_completo || 'No disponible',
                tipo: datos.tipo,
                descripcion_eliminada: datos.descripcion,
                estacion: personaActual?.estacion_policial || 'N/A'
            }, datos.id);
        } catch (err) {
            console.error('Error al eliminar:', err);
            alert('❌ Error al eliminar: ' + err.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = '🗑️ Sí, Eliminar y Respaldar';
        }
    };

    console.log("✅ Módulo consulta-personas.js inicializado correctamente");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConsultaPersonas);
} else {
    window.initConsultaPersonas();
}
