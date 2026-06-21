// ✅ PROTECCIÓN: Evitar inicialización múltiple
if (window._elimProcesadosInit) {
    console.warn('⚠️ elim-procesados.js ya estaba inicializado. Saltando duplicado.');
} else {
    window._elimProcesadosInit = true;

    window.initElimProcesados = function() {
        console.log("✅ Módulo elim-procesados.js cargado correctamente.");

        // 🔹 Variables de estado
        let currentData = null;
        let currentId = null;
        let pendingAction = null;

        // 🔹 Helpers UI
        const showMsg = (el, txt, type) => {
            if (!el) return;
            el.innerHTML = txt;
            el.className = `search-msg ${type}`;
            el.style.display = 'block';
        };
        const hideMsg = (el) => { if (el) el.style.display = 'none'; };
        const showMsgElim = (txt, type) => {
            const el = document.getElementById('msg-elim-procesado');
            if (el) { el.innerHTML = txt; el.className = `msg ${type}`; el.style.display = 'block'; }
        };
        const hideMsgElim = () => {
            const el = document.getElementById('msg-elim-procesado');
            if (el) el.style.display = 'none';
        };

        function renderUI(data, isArchived) {
            const resumenContainer = document.getElementById('elim-procesado-resumen');
            const archivedNotice = document.getElementById('archived-notice-elim');
            const archivedBanner = document.getElementById('archived-banner-elim');
            const btnEliminar = document.getElementById('btn-eliminar-procesado');
            const btnReintegrar = document.getElementById('btn-reintegrar-procesado');

            const orig = data.datos_originales || {};
            const nombre = `${orig.primer_nombre || ''} ${orig.primer_apellido || ''}`.trim() || 'No especificado';
            const cedula = orig.cedula || 'N/A';
            const placa = orig.placa || 'N/A';

            let docsCount = 0;
            const camposDocs = ['portada', 'oficio_remision', 'acta_denuncia', 'datos_filiatorios', 'acta_policial', 'derechos_imputado', 'evaluacion_medica', 'identificacion_cedula', 'solicitud_examen_forense', 'resultados_examen_forense', 'asistencia_comdepro', 'remision_estacionamiento', 'planilla_pvr', 'otros_documentos'];
            camposDocs.forEach(campo => { if (data[campo]) docsCount++; });
            ['entrevista', 'cadena_custodia', 'inspecciones_tecnicas'].forEach(campo => {
                if (Array.isArray(data[campo])) docsCount += data[campo].length;
            });

            if (resumenContainer) {
                resumenContainer.innerHTML = `
                    <div class="data-row"><span class="data-label">🆔 ID Original:</span><span class="data-value">${data.id_original || data.id}</span></div>
                    <div class="data-row"><span class="data-label">📋 Tabla Origen:</span><span class="data-value">${data.tabla_origen || 'N/A'}</span></div>
                    <div class="data-row"><span class="data-label">🔍 Identificador:</span><span class="data-value">${data.identificador_principal || 'N/A'}</span></div>
                    <div class="data-row"><span class="data-label">👤 Nombre:</span><span class="data-value">${nombre}</span></div>
                    <div class="data-row"><span class="data-label">🆔 Cédula:</span><span class="data-value">${cedula}</span></div>
                    <div class="data-row"><span class="data-label">🚗 Placa:</span><span class="data-value">${placa}</span></div>
                    <div class="data-row"><span class="data-label">⚖️ Tipo Delito:</span><span class="data-value">${data.tipo_delito || 'N/A'}</span></div>
                    <div class="data-row"><span class="data-label">📎 Documentos:</span><span class="data-value">${docsCount > 0 ? docsCount + ' archivos' : 'Sin documentos'}</span></div>
                `;
            }

            if (isArchived) {
                if (archivedBanner) archivedBanner.style.display = 'block';
                if (archivedNotice) archivedNotice.style.display = 'block';
                const archivedDate = document.getElementById('archived-date-elim');
                const archivedBy = document.getElementById('archived-by-elim');
                if (archivedDate) archivedDate.textContent = data.eliminado_en ? new Date(data.eliminado_en).toLocaleString('es-VE') : '-';
                if (archivedBy) archivedBy.textContent = data.eliminado_por || 'Sistema';
                if (btnEliminar) btnEliminar.style.display = 'none';
                if (btnReintegrar) btnReintegrar.style.display = 'block';
            } else {
                if (archivedBanner) archivedBanner.style.display = 'none';
                if (archivedNotice) archivedNotice.style.display = 'none';
                if (btnEliminar) btnEliminar.style.display = 'block';
                if (btnReintegrar) btnReintegrar.style.display = 'none';
            }
        }

        // ==========================================
        // 🔍 BÚSQUEDA (LEE DIRECTAMENTE DEL DOM)
        // ==========================================
        async function buscarProcesado() {
            // ✅ LEER DIRECTAMENTE DEL DOM (no usar variables cached)
            const input = document.getElementById('buscar-procesado-elim');
            const msgBuscar = document.getElementById('buscar-msg-elim');
            const dataContainer = document.getElementById('elim-procesado-data-container');
            const archivedNotice = document.getElementById('archived-notice-elim');
            const buscarBtn = document.getElementById('btn-buscar-procesado-elim');

            if (!input) {
                console.error('❌ No se encontró el input de búsqueda');
                return;
            }

            const val = input.value.trim().toUpperCase();
            console.log('🔍 Buscando procesado con valor:', val, '| Longitud:', val.length);

            if (val.length < 3) {
                showMsg(msgBuscar, '⚠️ Ingrese al menos 3 caracteres', 'error');
                return;
            }

            showMsg(msgBuscar, '🔍 Buscando...', 'success');
            if (buscarBtn) buscarBtn.disabled = true;
            if (dataContainer) dataContainer.style.display = 'none';
            hideMsg(msgBuscar);
            hideMsgElim();
            if (archivedNotice) archivedNotice.style.display = 'none';

            try {
                const queryOr = `identificador_principal.eq.${val},datos_originales->>cedula.eq.${val},datos_originales->>placa.eq.${val},datos_originales->>serial_carroceria.eq.${val},datos_originales->>serial_motor.eq.${val}`;

                // 1. Buscar en Activos
                let { data: activo, error: errActivo } = await window.supabaseClient
                    .from('registro_procesados')
                    .select('*')
                    .or(queryOr)
                    .order('fecha_procesamiento', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (errActivo) throw errActivo;

                if (activo) {
                    currentData = activo;
                    currentId = activo.id;
                    renderUI(activo, false);
                    if (dataContainer) dataContainer.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }

                // 2. Buscar en Archivados
                let { data: archivado, error: errArch } = await window.supabaseClient
                    .from('eliminados_procesados')
                    .select('*')
                    .or(queryOr)
                    .order('eliminado_en', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (errArch) throw errArch;

                if (archivado) {
                    currentData = archivado;
                    currentId = archivado.id_original || archivado.id;
                    renderUI(archivado, true);
                    if (dataContainer) dataContainer.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }

                showMsg(msgBuscar, '❌ Procesado no encontrado en el sistema.', 'error');
            } catch (err) {
                console.error('❌ Error buscando:', err);
                showMsg(msgBuscar, '❌ Error de conexión al buscar.', 'error');
            } finally {
                if (buscarBtn) buscarBtn.disabled = false;
            }
        }

        // ==========================================
        // 🔹 MODAL DE CONFIRMACIÓN
        // ==========================================
        function showModal(titulo, texto, accion, tipo) {
            pendingAction = accion;
            const modalTitle = document.getElementById('modal-title-elim');
            const modalText = document.getElementById('modal-text-elim');
            const btnModalYes = document.getElementById('btn-modal-yes-elim');
            const modal = document.getElementById('elim-modal-procesado');

            if (modalTitle) modalTitle.textContent = titulo;
            if (modalText) modalText.textContent = texto;
            if (btnModalYes) {
                btnModalYes.className = tipo === 'danger' ? 'btn-modal-danger' : 'btn-modal-success';
                btnModalYes.textContent = tipo === 'danger' ? '✅ Sí, Eliminar' : '✅ Sí, Reintegrar';
            }
            if (modal) modal.style.display = 'flex';
        }

        function closeModal() {
            const modal = document.getElementById('elim-modal-procesado');
            if (modal) modal.style.display = 'none';
            pendingAction = null;
        }

        async function ejecutarAccion() {
            if (pendingAction === 'delete') await eliminarRegistro();
            else if (pendingAction === 'reintegrate') await reintegrarRegistro();
            closeModal();
        }

        // ==========================================
        // 🔹 ELIMINAR
        // ==========================================
        async function eliminarRegistro() {
            const btnEliminar = document.getElementById('btn-eliminar-procesado');
            const btnReintegrar = document.getElementById('btn-reintegrar-procesado');
            const dataContainer = document.getElementById('elim-procesado-data-container');
            const input = document.getElementById('buscar-procesado-elim');

            if (!currentData) return;
            if (btnEliminar) { btnEliminar.disabled = true; btnEliminar.textContent = '⏳ Procesando...'; }
            if (btnReintegrar) btnReintegrar.disabled = true;
            hideMsgElim();

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                const eliminadoPor = user?.email || sessionStorage.getItem('pnb_user_email') || 'usuario@sistema';

                const dataToArchive = {
                    id_original: currentId,
                    eliminado_por: eliminadoPor,
                    tabla_origen: currentData.tabla_origen,
                    registro_id: currentData.registro_id,
                    identificador_principal: currentData.identificador_principal,
                    tipo_delito: currentData.tipo_delito,
                    observaciones: currentData.observaciones,
                    datos_originales: currentData.datos_originales,
                    tipo_registro: currentData.tipo_registro || 'procesado',
                    estatus: currentData.estatus || 'activo',
                    fecha_procesamiento: currentData.fecha_procesamiento || currentData.created_at,
                    portada: currentData.portada, oficio_remision: currentData.oficio_remision,
                    acta_denuncia: currentData.acta_denuncia, datos_filiatorios: currentData.datos_filiatorios,
                    acta_policial: currentData.acta_policial, derechos_imputado: currentData.derechos_imputado,
                    evaluacion_medica: currentData.evaluacion_medica, identificacion_cedula: currentData.identificacion_cedula,
                    solicitud_examen_forense: currentData.solicitud_examen_forense, resultados_examen_forense: currentData.resultados_examen_forense,
                    asistencia_comdepro: currentData.asistencia_comdepro, remision_estacionamiento: currentData.remision_estacionamiento,
                    planilla_pvr: currentData.planilla_pvr, otros_documentos: currentData.otros_documentos,
                    entrevista: currentData.entrevista, cadena_custodia: currentData.cadena_custodia,
                    inspecciones_tecnicas: currentData.inspecciones_tecnicas,
                    created_at_original: currentData.created_at, updated_at_original: currentData.updated_at
                };

                const { error: insErr } = await window.supabaseClient.from('eliminados_procesados').insert([dataToArchive]);
                if (insErr) throw new Error('Error archivando: ' + insErr.message);

                const { error: delErr } = await window.supabaseClient.from('registro_procesados').delete().eq('id', currentId);
                if (delErr) throw new Error('Error eliminando: ' + delErr.message);

                // ✅ LOG USANDO UTILS.JS
                if (typeof window.registrarLog === 'function') {
                    const orig = currentData.datos_originales || {};
                    await window.registrarLog('ELIMINAR', 'PROCESADOS', {
                        registro: 'Eliminado/Archivado',
                        estatus: 'Eliminado',
                        identificador: currentData.identificador_principal || orig.cedula || 'N/A',
                        cedula: orig.cedula || 'N/A',
                        nombre_completo: `${orig.primer_nombre || ''} ${orig.primer_apellido || ''}`.trim() || 'N/A',
                        tipo_registro: currentData.tipo_registro || 'procesado',
                        tipo_delito: currentData.tipo_delito || 'N/A',
                        accion_detalle: 'Registro procesado eliminado y archivado como respaldo histórico'
                    }, currentId);
                }

                showMsgElim('✅ Procesado eliminado y archivado correctamente.', 'success');
                setTimeout(() => {
                    if (dataContainer) dataContainer.style.display = 'none';
                    if (input) input.value = '';
                    const msgBuscar = document.getElementById('buscar-msg-elim');
                    hideMsg(msgBuscar);
                    hideMsgElim();
                }, 4000);
            } catch (err) {
                console.error('❌ Error eliminando:', err);
                showMsgElim('❌ Error al procesar la solicitud: ' + err.message, 'error');
            } finally {
                if (btnEliminar) { btnEliminar.disabled = false; btnEliminar.textContent = '🗑️ Eliminar Procesado del Sistema'; }
                if (btnReintegrar) btnReintegrar.disabled = false;
            }
        }

        // ==========================================
        // 🔹 REINTEGRAR
        // ==========================================
        async function reintegrarRegistro() {
            const btnEliminar = document.getElementById('btn-eliminar-procesado');
            const btnReintegrar = document.getElementById('btn-reintegrar-procesado');
            const dataContainer = document.getElementById('elim-procesado-data-container');
            const input = document.getElementById('buscar-procesado-elim');

            if (!currentData) return;
            if (btnReintegrar) { btnReintegrar.disabled = true; btnReintegrar.textContent = '⏳ Procesando...'; }
            if (btnEliminar) btnEliminar.disabled = true;
            hideMsgElim();

            try {
                const dataToRestore = {
                    tabla_origen: currentData.tabla_origen,
                    registro_id: currentData.registro_id,
                    identificador_principal: currentData.identificador_principal,
                    tipo_delito: currentData.tipo_delito,
                    observaciones: currentData.observaciones,
                    datos_originales: currentData.datos_originales,
                    tipo_registro: currentData.tipo_registro || 'procesado',
                    estatus: currentData.estatus || 'Procesado',
                    fecha_procesamiento: currentData.fecha_procesamiento || currentData.created_at_original || new Date().toISOString(),
                    portada: currentData.portada, oficio_remision: currentData.oficio_remision,
                    acta_denuncia: currentData.acta_denuncia, datos_filiatorios: currentData.datos_filiatorios,
                    acta_policial: currentData.acta_policial, derechos_imputado: currentData.derechos_imputado,
                    evaluacion_medica: currentData.evaluacion_medica, identificacion_cedula: currentData.identificacion_cedula,
                    solicitud_examen_forense: currentData.solicitud_examen_forense, resultados_examen_forense: currentData.resultados_examen_forense,
                    asistencia_comdepro: currentData.asistencia_comdepro, remision_estacionamiento: currentData.remision_estacionamiento,
                    planilla_pvr: currentData.planilla_pvr, otros_documentos: currentData.otros_documentos,
                    entrevista: currentData.entrevista, cadena_custodia: currentData.cadena_custodia,
                    inspecciones_tecnicas: currentData.inspecciones_tecnicas
                };

                const { error: insErr } = await window.supabaseClient.from('registro_procesados').insert([dataToRestore]);
                if (insErr) throw new Error('Error restaurando: ' + insErr.message);

                const { error: delErr } = await window.supabaseClient.from('eliminados_procesados').delete().eq('id', currentData.id);
                if (delErr) throw new Error('Error quitando archivo: ' + delErr.message);

                // ✅ LOG USANDO UTILS.JS
                if (typeof window.registrarLog === 'function') {
                    const orig = currentData.datos_originales || {};
                    await window.registrarLog('REINTEGRAR', 'PROCESADOS', {
                        registro: 'Reintegrado/Activo',
                        estatus: 'Procesado',
                        identificador: currentData.identificador_principal || orig.cedula || 'N/A',
                        cedula: orig.cedula || 'N/A',
                        nombre_completo: `${orig.primer_nombre || ''} ${orig.primer_apellido || ''}`.trim() || 'N/A',
                        tipo_registro: currentData.tipo_registro || 'procesado',
                        tipo_delito: currentData.tipo_delito || 'N/A',
                        accion_detalle: 'Registro procesado reintegrado al sistema activo desde el respaldo histórico'
                    }, currentId);
                }

                showMsgElim('✅ Procesado reintegrado al sistema activo.', 'success');
                setTimeout(() => {
                    if (dataContainer) dataContainer.style.display = 'none';
                    if (input) input.value = '';
                    const msgBuscar = document.getElementById('buscar-msg-elim');
                    hideMsg(msgBuscar);
                    hideMsgElim();
                }, 4000);
            } catch (err) {
                console.error('❌ Error reintegrando:', err);
                let msg = err.message.includes('23505') || err.message.includes('unique')
                    ? '❌ <strong>No se puede reintegrar:</strong> Ya existe un registro activo con este identificador.'
                    : '❌ ' + err.message;
                showMsgElim(msg, 'error');
            } finally {
                if (btnReintegrar) { btnReintegrar.disabled = false; btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo'; }
                if (btnEliminar) btnEliminar.disabled = false;
            }
        }

        // ==========================================
        // 🔹 LISTENERS (SE AGREGAN UNA SOLA VEZ)
        // ==========================================
        const btnBuscar = document.getElementById('btn-buscar-procesado-elim');
        const inputBusqueda = document.getElementById('buscar-procesado-elim');
        const btnEliminar = document.getElementById('btn-eliminar-procesado');
        const btnReintegrar = document.getElementById('btn-reintegrar-procesado');
        const btnModalYes = document.getElementById('btn-modal-yes-elim');
        const btnModalNo = document.getElementById('btn-modal-no-elim');
        const modal = document.getElementById('elim-modal-procesado');

        if (btnBuscar) {
            btnBuscar.onclick = () => {
                console.log('🖱️ Click en buscar');
                buscarProcesado();
            };
        }

        if (inputBusqueda) {
            inputBusqueda.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('⌨️ Enter en input');
                    buscarProcesado();
                }
            };
        }

        if (btnEliminar) {
            btnEliminar.onclick = () => {
                if (!currentData) return;
                const orig = currentData.datos_originales || {};
                const identificador = orig.cedula || currentData.identificador_principal || 'este registro';
                showModal('⚠️ Confirmar Eliminación', `¿Eliminar el procesado con identificador "${identificador}"? Se moverá a la papelera de archivo.`, 'delete', 'danger');
            };
        }

        if (btnReintegrar) {
            btnReintegrar.onclick = () => {
                if (!currentData) return;
                const orig = currentData.datos_originales || {};
                const identificador = orig.cedula || currentData.identificador_principal || 'este registro';
                showModal('♻️ Confirmar Reintegración', `¿Reintegrar el procesado con identificador "${identificador}"? Volverá a estar disponible en el sistema activo.`, 'reintegrate', 'success');
            };
        }

        if (btnModalYes) btnModalYes.onclick = ejecutarAccion;
        if (btnModalNo) btnModalNo.onclick = closeModal;
        if (modal) modal.onclick = (e) => { if (e.target === modal) closeModal(); };

        console.log("✅ Módulo elim-procesados.js inicializado correctamente.");
    };

    // ✅ AUTO-INICIALIZACIÓN SEGURA
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initElimProcesados);
    } else {
        window.initElimProcesados();
    }
}
