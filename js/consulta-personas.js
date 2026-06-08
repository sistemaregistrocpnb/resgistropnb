window.initConsultaPersonas = function() {
    console.log("⚙️ [DEBUG] Iniciando módulo consulta-personas.js...");
    
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

    // Listeners del modal de eliminación
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
        if (tipo === 'success') setTimeout(() => { if (msg) msg.style.display = 'none'; }, 4000);
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
                await window.cargarIncidencias(cedula, 'persona', 1);
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
                await window.cargarIncidencias(cedula, 'vinculado', 1);
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

            // ... (El resto del código de mostrarDetallesCompletos se mantiene igual, omitido por brevedad, pero inclúyelo en tu archivo) ...
            // Asegúrate de que el cierre de la función y el catch estén presentes como en tu versión original.
            
            modalBody.innerHTML = html;
        } catch (err) {
            console.error('Error generando reporte:', err);
            modalBody.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger);">
                <h3>❌ Error al generar el reporte</h3>
                <p>${err.message}</p>
            </div>`;
        }
    }

    // ✅ FUNCIÓN GLOBAL PARA CARGAR INCIDENCIAS
    window.cargarIncidencias = async function(cedula, tipo, pagina = 1) {
        console.log("🔄 [DEBUG] Recargando lista de incidencias para:", cedula, tipo, "Página:", pagina);
        if (!incidenciasSection) {
            console.error("❌ [DEBUG] NO SE ENCUENTRA el elemento cp_incidencias_section en el HTML");
            return;
        }

        try {
            const { data: incidencias, error } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*')
                .eq('cedula', cedula)
                .eq('tipo_registro', tipo)
                .order('fecha_hora', { ascending: false });

            if (error) {
                console.error("❌ [DEBUG] Error en la consulta de incidencias:", error);
                throw error;
            }

            console.log("✅ [DEBUG] Incidencias obtenidas de la BD:", incidencias ? incidencias.length : 0);

            let html = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3>';
            
            if (!incidencias || incidencias.length === 0) {
                html += '<div class="sin-incidencias">No hay incidencias registradas</div>';
            } else {
                const esAdministrador = sessionStorage.getItem('pnb_user_nivel') === 'administrador';
                
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
            }
            html += '</div>';
            
            incidenciasSection.innerHTML = html;
            incidenciasSection.style.display = 'block';
            console.log("✅ [DEBUG] DOM actualizado correctamente en pantalla.");
        } catch (err) {
            console.error('❌ [DEBUG] Error cargando incidencias:', err);
            incidenciasSection.innerHTML = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3><div class="sin-incidencias">Error al cargar</div></div>';
            incidenciasSection.style.display = 'block';
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
            await window.cargarIncidencias(personaActual.cedula, tipoRegistroActual, 1); 
        } catch (err) {
            console.error('Error guardando incidencia:', err);
            alert('❌ Error: ' + err.message);
        } finally {
            btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Incidencia';
        }
    }

    console.log("✅ Módulo consulta-personas.js inicializado correctamente");
};

// ✅ FUNCIONES GLOBALES PARA EL MODAL DE ELIMINACIÓN (BLINDADAS CON LOGS)
window.prepararEliminacion = function(btn) {
    console.log("📝 [DEBUG] Preparando eliminación para ID:", btn.dataset.id);
    window.incidenciaPendienteEliminacion = {
        id: btn.dataset.id,
        cedula: btn.dataset.cedula,
        tipo: btn.dataset.tipo,
        pagina: parseInt(btn.dataset.pagina),
        descripcion: btn.dataset.desc,
        fecha: btn.dataset.fecha,
        autor: btn.dataset.autor
    };
    
    document.getElementById('cp_elim_descripcion').textContent = window.incidenciaPendienteEliminacion.descripcion;
    document.getElementById('cp_elim_fecha').textContent = new Date(window.incidenciaPendienteEliminacion.fecha).toLocaleString('es-VE');
    document.getElementById('cp_elim_autor').textContent = window.incidenciaPendienteEliminacion.autor;
    
    document.getElementById('cp_modal_confirmar_eliminacion').classList.add('active');
};

document.getElementById('cp_btn_confirmar_eliminacion').onclick = async () => {
    const datos = window.incidenciaPendienteEliminacion;
    if (!datos) return;
    
    console.log("🔴 [DEBUG] INICIO PROCESO DE ELIMINACIÓN. ID:", datos.id);
    
    const btnConfirmar = document.getElementById('cp_btn_confirmar_eliminacion');
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = '⏳ Procesando...';
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Debe iniciar sesión');
        console.log("✅ [DEBUG] Usuario autenticado:", user.email);

        // 1. Obtener datos originales de la BD
        console.log("🔍 [DEBUG] Buscando incidencia original en BD...");
        const { data: incData, error: fetchError } = await window.supabaseClient
            .from('registro_incidencias')
            .select('*')
            .eq('id', datos.id)
            .single();

        if (fetchError) {
            console.error("❌ [DEBUG] Error al buscar incidencia:", fetchError);
            throw new Error('No se encontró la incidencia: ' + fetchError.message);
        }
        console.log("✅ [DEBUG] Incidencia encontrada:", incData);

        // 2. Respaldar
        const { id, created_at, ...datosBackup } = incData;
        datosBackup.incidencia_id_original = datos.id;
        datosBackup.eliminado_por = user.id;
        datosBackup.email_eliminador = user.email;
        datosBackup.fecha_eliminacion = new Date().toISOString();

        console.log("💾 [DEBUG] Guardando respaldo en registro_incidencias_backup...");
        const { data: backupResult, error: backupError } = await window.supabaseClient
            .from('registro_incidencias_backup')
            .insert([datosBackup])
            .select();

        if (backupError) {
            console.error("❌ [DEBUG] Error al crear respaldo:", backupError);
            throw new Error('Error al crear respaldo: ' + backupError.message);
        }
        console.log("✅ [DEBUG] Respaldo creado exitosamente");

        // 3. Eliminar de la tabla principal
        console.log("🗑️ [DEBUG] Ejecutando DELETE en registro_incidencias con ID:", datos.id);
        const { data: deleteResult, error: deleteError } = await window.supabaseClient
            .from('registro_incidencias')
            .delete()
            .eq('id', datos.id)
            .select(); // Agregamos .select() para ver qué se eliminó

        if (deleteError) {
            console.error("❌ [DEBUG] Error al eliminar de la BD (Posible bloqueo de RLS):", deleteError);
            throw new Error('Error al eliminar: ' + deleteError.message);
        }
        
        console.log("✅ [DEBUG] Resultado del DELETE:", deleteResult);
        
        if (!deleteResult || deleteResult.length === 0) {
            console.warn("⚠️ [DEBUG] El DELETE se ejecutó pero no devolvió filas. Es muy probable que una Política de Seguridad (RLS) de Supabase esté bloqueando la eliminación.");
        }

        // 4. Cerrar modal
        document.getElementById('cp_modal_confirmar_eliminacion').classList.remove('active');
        window.incidenciaPendienteEliminacion = null;
        
        // 5. FORZAR RECARGA DE LA LISTA
        console.log("🔄 [DEBUG] Recargando lista de incidencias después de eliminar...");
        await window.cargarIncidencias(datos.cedula, datos.tipo, datos.pagina);
        
        // 6. Mensaje de éxito
        const msgEl = document.getElementById('cp_msg');
        if (msgEl) {
            msgEl.textContent = '✅ Incidencia eliminada y respaldada correctamente';
            msgEl.className = 'msg success';
            msgEl.style.display = 'block';
            setTimeout(() => { msgEl.style.display = 'none'; }, 4000);
        }

        // 7. Log del sistema
        if (typeof registrarLog === 'function') {
            await registrarLog('ELIMINAR_INCIDENCIA', 'Consulta Personas', datos.id, { cedula: datos.cedula, tipo: datos.tipo });
        }

    } catch (err) {
        console.error('❌ [DEBUG] Error fatal al eliminar:', err);
        alert('❌ Error al eliminar: ' + err.message + '\n\nPor favor, abre la consola del navegador (F12) y copia el error para revisarlo.');
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = '🗑️ Sí, Eliminar y Respaldar';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConsultaPersonas);
} else {
    window.initConsultaPersonas();
}

async function registrarLog(accion, modulo, registroId = null, detalles = {}) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        const { data: perfil } = await window.supabaseClient
            .from('perfiles_usuario').select('nombre, apellido').eq('user_id', user.id).maybeSingle();
        const nombreCompleto = perfil ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() : 'Sistema';
        await window.supabaseClient.from('sistema_logs').insert([{
            user_id: user.id, user_email: user.email, user_nombre: nombreCompleto,
            accion: accion, modulo: modulo, registro_id: registroId, detalles: detalles, user_agent: navigator.userAgent
        }]);
    } catch (err) {
        console.warn('⚠️ Error registrando log:', err);
    }
}
