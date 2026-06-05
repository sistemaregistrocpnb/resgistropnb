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
        
        // Contar documentos adjuntos para mostrar un resumen
        let docsCount = 0;
        const docsList = [];
        const camposDocs = ['portada', 'oficio_remision', 'acta_denuncia', 'datos_filiatorios', 'acta_policial', 'derechos_imputado', 'evaluacion_medica', 'identificacion_cedula', 'solicitud_examen_forense', 'resultados_examen_forense', 'asistencia_comdepro', 'remision_estacionamiento', 'planilla_pvr', 'otros_documentos'];
        
        camposDocs.forEach(campo => {
            if (data[campo]) {
                docsCount++;
                docsList.push(campo.replace(/_/g, ' ').toUpperCase());
            }
        });
        
        // Documentos múltiples
        ['entrevista', 'cadena_custodia', 'inspecciones_tecnicas'].forEach(campo => {
            if (Array.isArray(data[campo]) && data[campo].length > 0) {
                docsCount += data[campo].length;
                docsList.push(`${campo.replace(/_/g, ' ').toUpperCase()} (${data[campo].length} archivos)`);
            }
        });

        let html = `
            <div class="data-row"><span class="data-label">🆔 ID Original:</span><span class="data-value">${data.id_original || data.id}</span></div>
            <div class="data-row"><span class="data-label">📋 Tabla Origen:</span><span class="data-value">${data.tabla_origen || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">🔍 Identificador:</span><span class="data-value">${data.identificador_principal || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">👤 Nombre:</span><span class="data-value">${nombre}</span></div>
            <div class="data-row"><span class="data-label">🆔 Cédula:</span><span class="data-value">${cedula}</span></div>
            <div class="data-row"><span class="data-label">🚗 Placa:</span><span class="data-value">${placa}</span></div>
            <div class="data-row"><span class="data-label">⚖️ Tipo Delito:</span><span class="data-value">${data.tipo_delito || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">📎 Documentos:</span><span class="data-value">${docsCount > 0 ? docsCount + ' archivos (' + docsList.join(', ') + ')' : 'Sin documentos'}</span></div>
            <div class="data-row"><span class="data-label">📝 Observaciones:</span><span class="data-value">${data.observaciones || 'Ninguna'}</span></div>
        `;
        resumenContainer.innerHTML = html;

        if (isArchived) {
            archivedBanner.style.display = 'block';
            archivedNotice.style.display = 'block';
            document.getElementById('archived-date-elim').textContent = data.eliminado_en ? new Date(data.eliminado_en).toLocaleString('es-VE') : '-';
            document.getElementById('archived-by-elim').textContent = data.eliminado_por || 'Sistema';
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block';
        } else {
            archivedBanner.style.display = 'none';
            archivedNotice.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 Búsqueda principal (Activa -> Archivada)
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
            // 1. Buscar en activos (usando la lógica corregida de JSON)
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
                renderUI(activo, false);
                dataContainer.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // 2. Buscar en eliminados/archivados
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
                renderUI(archivado, true);
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
            const user = sessionStorage.getItem('pnb_user_email') || 'usuario@sistema'; // Ajusta según cómo guardes el usuario
            
            // Preparar datos para archivar
            const dataToArchive = {
                id_original: currentId,
                eliminado_por: user,
                ...currentData // Copia todos los demás campos (tipo_delito, documentos, datos_originales, etc.)
            };
            // Eliminar campos que no deben ir en la tabla de eliminados o que se sobrescriben
            delete dataToArchive.id; 

            const { error: insErr } = await window.supabaseClient.from('eliminados_procesados').insert([dataToArchive]);
            if (insErr) throw new Error('Error archivando: ' + insErr.message);

            const { data: delData, error: delErr } = await window.supabaseClient
                .from('registro_procesados')
                .delete()
                .eq('id', currentData.id)
                .select('id');

            if (delErr) throw new Error('Error eliminando: ' + delErr.message);
            if (!delData || delData.length === 0) throw new Error('No se encontró el registro para eliminar.');

            showMsgElim('✅ Procesado eliminado y archivado correctamente.', 'success');
            setTimeout(() => {
                dataContainer.style.display = 'none';
                buscarInput.value = '';
                hideMsg(msgBuscar);
                hideMsgElim();
            }, 4000);
        } catch (err) {
            console.error('Error eliminando:', err);
            showMsgElim('❌ ' + err.message, 'error');
        } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '🗑️ Eliminar Procesado del Sistema';
        }
    }

    // 🔹 Reintegrar (Eliminados → Activa)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true;
        btnReintegrar.textContent = '⏳ Procesando...';
        hideMsgElim();

        try {
            const dataToRestore = { ...currentData };
            // Limpiar metadatos de eliminación
            delete dataToRestore.eliminado_en;
            delete dataToRestore.eliminado_por;
            delete dataToRestore.id; // Dejar que Supabase genere un nuevo ID, pero mantenemos id_original

            const { error: insErr } = await window.supabaseClient.from('registro_procesados').insert([dataToRestore]);
            if (insErr) throw new Error('Error restaurando: ' + insErr.message);

            // Eliminar SOLO este registro específico de la tabla de eliminados
            await window.supabaseClient
                .from('eliminados_procesados')
                .delete()
                .eq('id', currentData.id);

            showMsgElim('✅ Procesado reintegrado al sistema activo.', 'success');
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
            `¿Reintegrar el procesado con identificador "${identificador}"? Volverá a estar disponible en el sistema activo.`,
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
