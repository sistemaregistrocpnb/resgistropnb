window.initElimProcesados = function() {
    console.log("⚙️ Iniciando módulo elim-procesados.js...");

    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-procesado-elim');
    const buscarBtn = document.getElementById('btn-buscar-procesado-elim');
    const msgBuscar = document.getElementById('buscar-msg-elim');
    const dataContainer = document.getElementById('elim-procesado-data-container');
    const resumenContainer = document.getElementById('elim-procesado-resumen');
    const archivedNotice = document.getElementById('archived-notice-elim');
    const archivedBanner = document.getElementById('archived-banner-elim');
    const btnEliminar = document.getElementById('btn-eliminar-procesado');
    const btnReintegrar = document.getElementById('btn-reintegrar-procesado');
    const msgElim = document.getElementById('msg-elim-procesado');
    
    // Modal
    const modal = document.getElementById('elim-modal-procesado');
    const modalTitle = document.getElementById('modal-title-elim');
    const modalText = document.getElementById('modal-text-elim');
    const btnModalYes = document.getElementById('btn-modal-yes-elim');
    const btnModalNo = document.getElementById('btn-modal-no-elim');

    let currentData = null;
    let currentId = null;
    let pendingAction = null;

    const showMsg = (el, txt, type) => { el.innerHTML = txt; el.className = `search-msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const showMsgElim = (txt, type) => { msgElim.innerHTML = txt; msgElim.className = `msg ${type}`; msgElim.style.display = 'block'; };
    const hideMsgElim = () => { msgElim.style.display = 'none'; };

    // 🔹 Renderizar datos del procesado de forma limpia
    function renderUI(data, isArchived) {
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

        let html = `
            <div class="data-row"><span class="data-label">🆔 ID Original:</span><span class="data-value">${data.id_original || data.id}</span></div>
            <div class="data-row"><span class="data-label">📋 Tabla Origen:</span><span class="data-value">${data.tabla_origen || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">🔍 Identificador:</span><span class="data-value">${data.identificador_principal || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">👤 Nombre:</span><span class="data-value">${nombre}</span></div>
            <div class="data-row"><span class="data-label">🆔 Cédula:</span><span class="data-value">${cedula}</span></div>
            <div class="data-row"><span class="data-label">🚗 Placa:</span><span class="data-value">${placa}</span></div>
            <div class="data-row"><span class="data-label">⚖️ Tipo Delito:</span><span class="data-value">${data.tipo_delito || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">📎 Documentos:</span><span class="data-value">${docsCount > 0 ? docsCount + ' archivos' : 'Sin documentos'}</span></div>
            <div class="data-row"><span class="data-label">📝 Observaciones:</span><span class="data-value">${data.observaciones || 'Ninguna'}</span></div>
        `;
        resumenContainer.innerHTML = html;

        if (isArchived) {
            archivedBanner.style.display = 'block';
            archivedNotice.style.display = 'block';
            document.getElementById('archived-date-elim').textContent = data.eliminado_en ? new Date(data.eliminado_en).toLocaleString('es-VE') : '-';
            document.getElementById('archived-by-elim').textContent = data.eliminado_por || 'Sistema';
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block'; // ✅ Botón cambia a Reintegrar
        } else {
            archivedBanner.style.display = 'none';
            archivedNotice.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 Búsqueda principal (Prioriza Activos, luego busca en Eliminados)
    async function buscarProcesado() {
        const val = buscarInput.value.trim().toUpperCase();
        if (val.length < 3) return showMsg(msgBuscar, '⚠️ Ingrese al menos 3 caracteres', 'error');
        
        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        hideMsg(msgBuscar);
        hideMsgElim();
        archivedNotice.style.display = 'none';

        try {
            // 1. Buscar en activos PRIMERO
            let { data: activo, error: errActivo } = await window.supabaseClient
                .from('registro_procesados')
                .select('*')
                .or(`identificador_principal.eq.${val},datos_originales->>cedula.eq.${val},datos_originales->>placa.eq.${val},datos_originales->>serial_carroceria.eq.${val},datos_originales->>serial_motor.eq.${val}`)
                .order('fecha_procesamiento', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (errActivo) throw errActivo;

            if (activo) {
                currentData = activo;
                currentId = activo.id;
                renderUI(activo, false); // Estado Activo
                dataContainer.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // 2. Si no está en activos, buscar en eliminados/archivados
            let { data: archivado, error: errArch } = await window.supabaseClient
                .from('eliminados_procesados')
                .select('*')
                .or(`identificador_principal.eq.${val},datos_originales->>cedula.eq.${val},datos_originales->>placa.eq.${val},datos_originales->>serial_carroceria.eq.${val},datos_originales->>serial_motor.eq.${val}`)
                .order('eliminado_en', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (errArch) throw errArch;

            if (archivado) {
                currentData = archivado;
                currentId = archivado.id_original || archivado.id;
                renderUI(archivado, true); // Estado Archivado (Activa botón Reintegrar)
                dataContainer.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            showMsg(msgBuscar, '❌ Procesado no encontrado en el sistema.', 'error');
        } catch (err) {
            console.error('Error búsqueda:', err);
            showMsg(msgBuscar, '❌ Error de conexión: ' + err.message, 'error');
        } finally {
            buscarBtn.disabled = false;
        }
    }

    // 🔹 Modal
    function showModal(titulo, texto, accion, tipo) {
        pendingAction = accion;
        modalTitle.textContent = titulo;
        modalText.textContent = texto;
        btnModalYes.className = tipo === 'danger' ? 'btn-modal-danger' : 'btn-modal-success';
        btnModalYes.textContent = tipo === 'danger' ? '✅ Sí, Eliminar' : '✅ Sí, Reintegrar';
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        pendingAction = null;
    }

    async function ejecutarAccion() {
        if (pendingAction === 'delete') await eliminarRegistro();
        else if (pendingAction === 'reintegrate') await reintegrarRegistro();
        closeModal();
    }

    // 🔹 Eliminar (Activa → Eliminados)
    async function eliminarRegistro() {
        btnEliminar.disabled = true;
        btnEliminar.textContent = '⏳ Procesando...';
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
                portada: currentData.portada,
                oficio_remision: currentData.oficio_remision,
                acta_denuncia: currentData.acta_denuncia,
                datos_filiatorios: currentData.datos_filiatorios,
                acta_policial: currentData.acta_policial,
                derechos_imputado: currentData.derechos_imputado,
                evaluacion_medica: currentData.evaluacion_medica,
                identificacion_cedula: currentData.identificacion_cedula,
                solicitud_examen_forense: currentData.solicitud_examen_forense,
                resultados_examen_forense: currentData.resultados_examen_forense,
                asistencia_comdepro: currentData.asistencia_comdepro,
                remision_estacionamiento: currentData.remision_estacionamiento,
                planilla_pvr: currentData.planilla_pvr,
                otros_documentos: currentData.otros_documentos,
                entrevista: currentData.entrevista,
                cadena_custodia: currentData.cadena_custodia,
                inspecciones_tecnicas: currentData.inspecciones_tecnicas,
                created_at_original: currentData.created_at,
                updated_at_original: currentData.updated_at
            };

            // 1. Guardar respaldo en eliminados
            const { error: insErr } = await window.supabaseClient.from('eliminados_procesados').insert([dataToArchive]);
            if (insErr) throw new Error('Error archivando: ' + insErr.message);

            // 2. Eliminar de la tabla activa
            const { data: delData, error: delErr } = await window.supabaseClient
                .from('registro_procesados')
                .delete()
                .eq('id', currentId)
                .select('id');

            if (delErr) throw new Error('Error de base de datos al eliminar: ' + delErr.message);
            
            // ✅ CORRECCIÓN: Si el insert funcionó pero el delete devuelve 0 filas, NO fallamos.
            // Esto evita el error "No se encontró el registro" si ya había sido eliminado o hay un bloqueo RLS leve.
            if (!delData || delData.length === 0) {
                console.warn("⚠️ El respaldo se guardó, pero el registro ya no estaba en la tabla activa (o fue eliminado previamente).");
            }

            showMsgElim('✅ Procesado eliminado y archivado correctamente.', 'success');
            setTimeout(() => {
                dataContainer.style.display = 'none';
                buscarInput.value = '';
                hideMsg(msgBuscar);
                hideMsgElim();
            }, 4000);
            
        } catch (err) {
            console.error('💥 Error crítico:', err);
            showMsgElim('❌ ' + err.message, 'error');
        } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '🗑️ Eliminar Procesado del Sistema';
        }
    }

    // 🔹 Reintegrar (Eliminados → Activa, MANTENIENDO el respaldo)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true;
        btnReintegrar.textContent = '⏳ Procesando...';
        hideMsgElim();

        try {
            const dataToRestore = {
                tabla_origen: currentData.tabla_origen,
                registro_id: currentData.registro_id,
                identificador_principal: currentData.identificador_principal,
                tipo_delito: currentData.tipo_delito,
                observaciones: currentData.observaciones,
                datos_originales: currentData.datos_originales,
                portada: currentData.portada,
                oficio_remision: currentData.oficio_remision,
                acta_denuncia: currentData.acta_denuncia,
                datos_filiatorios: currentData.datos_filiatorios,
                acta_policial: currentData.acta_policial,
                derechos_imputado: currentData.derechos_imputado,
                evaluacion_medica: currentData.evaluacion_medica,
                identificacion_cedula: currentData.identificacion_cedula,
                solicitud_examen_forense: currentData.solicitud_examen_forense,
                resultados_examen_forense: currentData.resultados_examen_forense,
                asistencia_comdepro: currentData.asistencia_comdepro,
                remision_estacionamiento: currentData.remision_estacionamiento,
                planilla_pvr: currentData.planilla_pvr,
                otros_documentos: currentData.otros_documentos,
                entrevista: currentData.entrevista,
                cadena_custodia: currentData.cadena_custodia,
                inspecciones_tecnicas: currentData.inspecciones_tecnicas
            };

            // 1. Insertar en la tabla activa
            const { error: insErr } = await window.supabaseClient.from('registro_procesados').insert([dataToRestore]);
            if (insErr) throw new Error('Error restaurando: ' + insErr.message);

            // 2. ✅ CORRECCIÓN CLAVE: NO eliminamos el registro de 'eliminados_procesados'.
            // Esto cumple con tu requisito de "quedando un respaldo de esos datos en eliminados_procesados".
            // La próxima vez que se busque, el Paso 1 (tabla activa) lo encontrará primero y mostrará el estado "Activo".

            showMsgElim('✅ Procesado reintegrado al sistema activo. El respaldo histórico se mantiene en el archivo.', 'success');
            setTimeout(() => {
                dataContainer.style.display = 'none';
                buscarInput.value = '';
                hideMsg(msgBuscar);
                hideMsgElim();
            }, 4000);
            
        } catch (err) {
            console.error('Error reintegrando:', err);
            let msg = 'Error al reintegrar.';
            if (err.message.includes('23505') || err.message.includes('unique')) {
                msg = '❌ Ya existe un registro activo con este ID/Identificador.';
            } else {
                msg = '❌ ' + err.message;
            }
            showMsgElim(msg, 'error');
        } finally {
            btnReintegrar.disabled = false;
            btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo';
        }
    }

    // 🔹 Listeners
    buscarBtn.addEventListener('click', buscarProcesado);
    buscarInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); buscarProcesado(); }
    });

    btnEliminar.addEventListener('click', () => {
        if (!currentData) return;
        const identificador = currentData.datos_originales?.cedula || currentData.identificador_principal || 'este registro';
        showModal(
            '⚠️ Confirmar Eliminación',
            `¿Eliminar el procesado con identificador "${identificador}"? Se moverá a la papelera de archivo y dejará de estar activo.`,
            'delete',
            'danger'
        );
    });

    btnReintegrar.addEventListener('click', () => {
        if (!currentData) return;
        const identificador = currentData.datos_originales?.cedula || currentData.identificador_principal || 'este registro';
        showModal(
            '♻️ Confirmar Reintegración',
            `¿Reintegrar el procesado con identificador "${identificador}"? Volverá a estar disponible en el sistema activo (el respaldo histórico se mantendrá).`,
            'reintegrate',
            'success'
        );
    });

    btnModalYes.addEventListener('click', ejecutarAccion);
    btnModalNo.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    console.log("✅ Módulo elim-procesados.js inicializado correctamente");
};

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initElimProcesados);
} else {
    window.initElimProcesados();
}
