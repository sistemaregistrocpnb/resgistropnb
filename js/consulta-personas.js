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

    // Listeners
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
    
    // ✅ NUEVO: Listener para imprimir con generación de número en BD
    if (el('cp_btn_imprimir_reporte')) el('cp_btn_imprimir_reporte').onclick = () => generarEImprimirReporte(personaActual, tipoRegistroActual);

    function mostrarMensaje(texto, tipo) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `msg ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
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
            <div class="ficha-breve-item"><div class="ficha-breve-label">Tipo</div><div class="ficha-breve-value">${tipo === 'persona' ? '👤 Persona' : '🚗 Vinculado'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Estación</div><div class="ficha-breve-value">${data.estacion_policial || 'N/A'}</div></div>
            <div class="ficha-breve-item"><div class="ficha-breve-label">Fecha</div><div class="ficha-breve-value">${new Date(data.created_at || data.creado_en).toLocaleString('es-VE')}</div></div>
        `;

        if (tipo === 'vinculado') {
            htmlCampos += `
                <div class="ficha-breve-item"><div class="ficha-breve-label">Vehículo</div><div class="ficha-breve-value">${data.tipo_vehiculo || 'N/A'} ${data.marca_vehiculo || ''}</div></div>
                <div class="ficha-breve-item"><div class="ficha-breve-label">Placa</div><div class="ficha-breve-value" style="font-weight:800; color:var(--primary); font-size:1.1rem;">${data.placa || 'N/A'}</div></div>
            `;
        }

        if (data.observaciones) {
            htmlCampos += `<div class="ficha-breve-item full-width"><div class="ficha-breve-label">📝 Observaciones</div><div class="ficha-breve-value">${data.observaciones}</div></div>`;
        }

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
                </div>
            </div>
        `;

        fichaBreve.innerHTML = html;
        fichaBreve.style.display = 'block';

        setTimeout(() => {
            const btnDetalles = el('cp_btn_ver_detalles');
            if (btnDetalles) btnDetalles.onclick = () => mostrarDetallesCompletos(data, tipo);
        }, 100);
    }

    async function mostrarDetallesCompletos(data, tipo) {
        if (!modalBody || !modalTitulo) return;
        modalTitulo.textContent = `📋 Detalles - ${tipo === 'persona' ? 'Persona' : 'Vehículo Vinculado'}`;
        
        const fechaHoy = new Date();
        const fechaStr = fechaHoy.getFullYear().toString() + String(fechaHoy.getMonth() + 1).padStart(2, '0') + String(fechaHoy.getDate()).padStart(2, '0');

        let html = `<div class="reporte-header-print" style="text-align: center; margin-bottom: 20px; border-bottom: 3px double var(--primary); padding-bottom: 15px;">
            <h2 style="color: var(--primary); margin: 0; font-family: 'Playfair Display', serif;">CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h2>
            <h3 style="color: var(--secondary); margin: 5px 0; font-size: 1rem;">CENTRO DE COORDINACIÓN POLICIAL ESTADAL (CCPE) ZULIA</h3>
            <p style="font-size: 0.9rem; color: #334155; margin-top: 15px;">
                <strong>N° de Reporte:</strong> 
                <span id="cp_numero_reporte_display" style="color: var(--danger); font-weight: 800; font-size: 1.1rem;">Pendiente de generación...</span>
            </p>
            <p style="font-size: 0.85rem; color: #64748b;"><strong>Fecha de Consulta:</strong> ${fechaHoy.toLocaleString('es-VE')}</p>
        </div>`;

        // ... (Aquí va el mismo código de generación de campos de persona/vehículo que ya tenías, lo mantengo resumido para no exceder límites, pero debes pegar tu bloque completo de 'if (tipo === "persona")' aquí) ...
        
        if (tipo === 'persona') {
            if (data.foto_frontal || data.foto_perfil_izq || data.foto_perfil_der) {
                html += `<div class="seccion-titulo">📸 Fotografías</div><div class="fotos-container">`;
                if (data.foto_frontal) html += `<div class="foto-item"><img src="${data.foto_frontal}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
                if (data.foto_perfil_izq) html += `<div class="foto-item"><img src="${data.foto_perfil_izq}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Izq.</div></div>`;
                if (data.foto_perfil_der) html += `<div class="foto-item"><img src="${data.foto_perfil_der}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Der.</div></div>`;
                html += `</div>`;
            }
            html += `<div class="seccion-titulo">👤 Datos Personales</div><div class="ficha-completa-grid">`;
            const campos = [
                { label: 'Nombre', value: `${data.primer_nombre || ''} ${data.segundo_nombre || ''}` },
                { label: 'Apellido', value: `${data.primer_apellido || ''} ${data.segundo_apellido || ''}` },
                { label: 'Cédula', value: data.cedula },
                { label: 'Estación', value: data.estacion_policial },
                { label: 'Estatus', value: data.estatus }
            ]; // (Agrega aquí el resto de tus campos originales)
            campos.forEach(c => { if (c.value) html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`; });
            html += `</div>`;
        } else {
            // (Pega aquí tu bloque original de 'else' para vehículos)
            html += `<div class="seccion-titulo">🚗 Datos del Vehículo</div><div class="ficha-completa-grid">`;
            html += `<div class="ficha-completa-item"><div class="ficha-completa-label">Placa</div><div class="ficha-completa-value" style="font-weight:800; color:var(--primary);">${data.placa}</div></div>`;
            html += `</div>`;
        }

        // Incidencias
        html += `<div class="seccion-titulo" style="margin-top: 30px;">📜 Historial de Incidencias</div>`;
        try {
            const { data: incidencias } = await window.supabaseClient.from('registro_incidencias').select('*').eq('cedula', data.cedula).eq('tipo_registro', tipo).order('fecha_hora', { ascending: false });
            if (incidencias && incidencias.length > 0) {
                incidencias.forEach(inc => {
                    html += `<div class="incidencia-item-print" style="border: 1px solid #e2e8f0; padding: 10px; margin-bottom: 10px; border-left: 4px solid var(--secondary); border-radius: 4px; page-break-inside: avoid;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; margin-bottom: 5px;">
                            <span>🕒 ${new Date(inc.fecha_hora).toLocaleString('es-VE')}</span><span>Por: ${inc.email_registrante || 'N/A'}</span>
                        </div>
                        <div style="font-size: 0.9rem; color: #1e293b;">${inc.descripcion}</div>
                    </div>`;
                });
            } else {
                html += `<div style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic; border: 1px dashed #cbd5e1; border-radius: 5px;">Sin incidencias registradas.</div>`;
            }
        } catch (err) { /* Silencioso */ }

        html += `<div class="reporte-footer-print" style="margin-top: 40px; text-align: center; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <p>Documento generado electrónicamente. Uso exclusivo del CPNB.</p>
        </div>`;

        modalBody.innerHTML = html;
        modalDetalles.classList.add('active');
    }

    // ✅ FUNCIÓN NUEVA: Genera el número en BD y luego imprime
    async function generarEImprimirReporte(data, tipo) {
        if (!data) return;
        const btnImprimir = el('cp_btn_imprimir_reporte');
        const spanReporte = el('cp_numero_reporte_display');
        const textoOriginal = btnImprimir.textContent;

        btnImprimir.disabled = true;
        btnImprimir.textContent = '⏳ Generando número...';
        if (spanReporte) spanReporte.textContent = 'Conectando con base de datos...';

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const fechaHoy = new Date();
            const fechaStr = fechaHoy.getFullYear().toString() + String(fechaHoy.getMonth() + 1).padStart(2, '0') + String(fechaHoy.getDate()).padStart(2, '0');

            // 1. Insertar en la BD. La columna 'consecutivo_global' se llena sola automáticamente.
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

            // 2. Formatear el número a 8 dígitos (Ej: 1 -> "00000001")
            const consecutivoFormateado = String(nuevoReporte.consecutivo_global).padStart(8, '0');
            const numeroReporteFinal = `REPORTE-CPNB-${fechaStr}-N° ${consecutivoFormateado}`;

            // 3. Actualizar la pantalla con el número real
            if (spanReporte) spanReporte.textContent = numeroReporteFinal;

            // 4. Ejecutar la impresión del navegador
            window.print();

        } catch (err) {
            console.error('Error generando reporte:', err);
            alert('❌ Error al generar el número de reporte: ' + err.message);
            if (spanReporte) spanReporte.textContent = 'Error al generar';
        } finally {
            btnImprimir.disabled = false;
            btnImprimir.textContent = textoOriginal;
        }
    }

    async function cargarIncidencias(cedula, tipo) {
        if (!incidenciasSection) return;
        try {
            const { data: incidencias, error } = await window.supabaseClient
                .from('registro_incidencias').select('*').eq('cedula', cedula).eq('tipo_registro', tipo).order('fecha_hora', { ascending: false });
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
            }
            html += '</div>';
            incidenciasSection.innerHTML = html;
            incidenciasSection.style.display = 'block';
        } catch (err) {
            console.error('Error cargando incidencias:', err);
        }
    }

    async function guardarIncidencia() {
        const descripcion = el('cp_incidencia_descripcion')?.value.trim();
        if (!descripcion) { alert('⚠️ Ingrese una descripción'); return; }

        const btnGuardar = el('cp_btn_guardar_incidencia');
        btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Guardando...';

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const { error } = await window.supabaseClient.from('registro_incidencias').insert([{
                cedula: personaActual.cedula,
                tipo_registro: tipoRegistroActual,
                descripcion: descripcion,
                fecha_hora: new Date().toISOString(),
                registrada_por: user.id,
                email_registrante: user.email
            }]);
            if (error) throw error;

            modalIncidencia.classList.remove('active');
            mostrarMensaje('✅ Incidencia registrada', 'success');
            await cargarIncidencias(personaActual.cedula, tipoRegistroActual);
        } catch (err) {
            console.error('Error guardando incidencia:', err);
            alert('❌ Error: ' + err.message);
        } finally {
            btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Incidencia';
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConsultaPersonas);
} else {
    window.initConsultaPersonas();
}
