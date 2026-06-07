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
    let userRoleCache = null;

    // Listeners
    if (btnBuscar) btnBuscar.onclick = () => buscarPersona();
    
    if (buscarInput) {
        buscarInput.oninput = (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8); };
        buscarInput.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); btnBuscar?.click(); } };
    }

    // Cerrar modales
    if (el('cp_modal_close')) el('cp_modal_close').onclick = () => modalDetalles.classList.remove('active');
    if (el('cp_modal_cerrar')) el('cp_modal_cerrar').onclick = () => modalDetalles.classList.remove('active');
    if (el('cp_modal_inc_close')) el('cp_modal_inc_close').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cp_btn_cancelar_incidencia')) el('cp_btn_cancelar_incidencia').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cp_btn_guardar_incidencia')) el('cp_btn_guardar_incidencia').onclick = () => guardarIncidencia();
    
    // El botón de imprimir solo ejecuta la impresión, el número ya está generado
    if (el('cp_btn_imprimir_reporte')) el('cp_btn_imprimir_reporte').onclick = () => window.print();

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
            userRoleCache = nivel;
            return nivel === 'administrador' || nivel === 'moderador';
        } catch (err) {
            console.error("Error verificando permisos:", err);
            return false;
        }
    }

    async function buscarPersona() {
        const cedula = buscarInput?.value.trim() || '';
        if (!cedula || cedula.length < 7 || cedula.length > 8) {
            mostrarMensaje('⚠️ Ingrese una cédula válida (entre 7 y 8 dígitos)', 'error');
            return;
        }

        mostrarMensaje('🔍 Buscando...', 'info');
        fichaBreve.style.display = 'none';
        incidenciasSection.style.display = 'none';
        personaActual = null;
        tipoRegistroActual = null;
        datosProcesado = null;

        try {
            const { data: persona, error: errPersona } = await window.supabaseClient
                .from('registro_personas').select('*').eq('cedula', cedula).maybeSingle();
            if (errPersona) throw errPersona;

            if (persona) {
                personaActual = persona;
                tipoRegistroActual = 'persona';
                const estatus = (persona.estatus || '').toLowerCase();
                if (estatus.includes('procesad')) {
                    try {
                        const { data: procData } = await window.supabaseClient
                            .from('registro_procesados').select('tipo_delito').eq('cedula', cedula)
                            .order('created_at', { ascending: false }).limit(1).maybeSingle();
                        if (procData) datosProcesado = procData;
                    } catch (e) { /* Silencioso */ }
                }
                await renderFichaBreve(persona, 'persona');
                await cargarIncidencias(cedula, 'persona');
                mostrarMensaje('✅ Persona encontrada', 'success');
                return;
            }

            const { data: vinculado, error: errVinculado } = await window.supabaseClient
                .from('registro_vinculado').select('*').eq('cedula', cedula).maybeSingle();
            if (errVinculado) throw errVinculado;

            if (vinculado) {
                personaActual = vinculado;
                tipoRegistroActual = 'vinculado';
                const estatus = (vinculado.estatus || '').toLowerCase();
                if (estatus.includes('procesad')) {
                    try {
                        const { data: procData } = await window.supabaseClient
                            .from('registro_procesados').select('tipo_delito').eq('cedula', cedula)
                            .order('created_at', { ascending: false }).limit(1).maybeSingle();
                        if (procData) datosProcesado = procData;
                    } catch (e) { /* Silencioso */ }
                }
                await renderFichaBreve(vinculado, 'vinculado');
                await cargarIncidencias(cedula, 'vinculado');
                mostrarMensaje('✅ Vehículo vinculado encontrado', 'success');
                return;
            }
            mostrarMensaje('❌ No se encontró ninguna persona con esa cédula', 'error');
        } catch (err) {
            console.error('Error buscando:', err);
            mostrarMensaje('❌ Error: ' + err.message, 'error');
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
            <div class="ficha-breve-item"><div class="ficha-breve-label">Estación de Detención</div><div class="ficha-breve-value">${data.estacion_policial || 'N/A'}</div></div>
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

            const { data: nuevoReporte, error: errorInsert } = await window.supabaseClient
                .from('reportes_generados')
                .insert([{
                    fecha_texto: fechaStr,
                    cedula_consultada: data.cedula,
                    tipo_registro: tipo,
                    user_id: user.id,
                    user_email: user.email
                }])
                .select('consecutivo_global')
                .single();

            if (errorInsert) throw errorInsert;

            const consecutivoFormateado = String(nuevoReporte.consecutivo_global).padStart(8, '0');
            const numeroReporteFinal = `REPORTE-CPNB-${fechaStr}-N° ${consecutivoFormateado}`;

            let html = `<div class="reporte-header-print" style="text-align: center; margin-bottom: 20px; border-bottom: 3px double var(--primary); padding-bottom: 15px;">
                <img src="img/LOGO-PNB.png" alt="Logo PNB" style="max-height: 90px; width: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none'">
                <h2 style="color: var(--primary); margin: 0; font-family: 'Playfair Display', serif;">CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h2>
                <h3 style="color: var(--secondary); margin: 5px 0; font-size: 1rem;">CENTRO DE COORDINACIÓN POLICIAL ESTADAL (CCPE) ZULIA</h3>
                <p style="font-size: 0.9rem; color: #334155; margin-top: 15px;">
                    <strong>N° de Reporte:</strong> 
                    <span id="cp_numero_reporte_display" style="color: var(--primary); font-weight: 800; font-size: 1.1rem;">${numeroReporteFinal}</span>
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
                html += `<div class="seccion-titulo">👤 Datos Personales</div><div class="ficha-completa-grid">`;
                const camposPersona = [
                    { label: 'Nombre', value: `${data.primer_nombre || ''} ${data.segundo_nombre || ''}` },
                    { label: 'Apellido', value: `${data.primer_apellido || ''} ${data.segundo_apellido || ''}` },
                    { label: 'Cédula', value: data.cedula },
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
                    { label: 'Lentes', value: data.usa_lentes ? 'Sí' : 'No' },
                    { label: 'Detalle Lentes', value: data.detalle_lentes },
                    { label: 'Perforaciones', value: data.perforaciones ? 'Sí' : 'No' },
                    { label: 'Detalle Perfor.', value: data.detalle_perforaciones },
                    { label: 'Cond. Médica', value: data.condicion_medica },
                    { label: 'Medicamento', value: data.consume_medicamento },
                    { label: 'Prob. Judicial', value: data.problema_judicial },
                    { label: 'Estación', value: data.estacion_policial },
                    { label: 'Dir. Detención', value: data.direccion_detencion },
                    { label: 'Estatus', value: data.estatus }
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
                html += `<div class="seccion-titulo">👤 Datos de la Persona</div><div class="ficha-completa-grid">`;
                const camposPersonaVinc = [
                    { label: 'Nombre', value: `${data.primer_nombre || ''} ${data.segundo_nombre || ''}` },
                    { label: 'Apellido', value: `${data.primer_apellido || ''} ${data.segundo_apellido || ''}` },
                    { label: 'Cédula', value: data.cedula },
                    { label: 'Fecha Nac.', value: data.fecha_nacimiento },
                    { label: 'Edad', value: data.edad },
                    { label: 'Nacionalidad', value: data.nacionalidad },
                    { label: 'Sexo', value: data.sexo },
                    { label: 'Teléfono', value: `${data.tlf_pais || ''} ${data.tlf_numero || ''}`.trim() || null },
                    { label: 'Dirección', value: data.direccion },
                    { label: 'Problema Judicial', value: data.problema_judicial }
                ];
                camposPersonaVinc.forEach(c => {
                    if (c.value) html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`;
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
                    { label: 'Serial Carroc.', value: data.serial_carroceria },
                    { label: 'Cilindraje', value: data.cilindraje },
                    { label: 'Marca Corporal', value: data.marca_corporal },
                    { label: 'Propietario', value: data.propietario },
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
            }

            html += `<div class="seccion-titulo" style="margin-top: 30px;">📜 Historial de Incidencias</div>`;
            try {
                const { data: incidencias } = await window.supabaseClient.from('registro_incidencias').select('*').eq('cedula', data.cedula).eq('tipo_registro', tipo).order('fecha_hora', { ascending: false });
                if (incidencias && incidencias.length > 0) {
                    html += `<div class="incidencias-print-container">`;
                   
