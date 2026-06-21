// ✅ MÓDULO EDITAR PROCESADO - ADAPTADO A ESTRUCTURA REAL DE SUPABASE
window.initEditarProcesado = function() {
    console.log("✅ Módulo editar-procesado.js inicializado correctamente.");

    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('edit_busqueda_input');
    const buscarBtn = document.getElementById('edit_btn_buscar');
    const msgBusqueda = document.getElementById('edit_msg_busqueda');
    const datosPanel = document.getElementById('edit-datos-panel');
    const datosContenido = document.getElementById('edit-datos-contenido');
    const formEditar = document.getElementById('form-editar-procesado');
    const msgForm = document.getElementById('edit-msg-form');
    const loadingOverlay = document.getElementById('edit-loading-overlay');
    const docsUnicosContainer = document.getElementById('edit-docs-unicos-container');
    const docsMultiplesContainer = document.getElementById('edit-docs-multiples-container');

    let currentData = null;
    let registroIdActual = null;
    let personaData = null; // Datos de la persona extraídos del JSON

    // 🔹 Columnas de documentos PDF en tu tabla registro_procesados
    const COLUMNAS_DOCS = [
        'portada', 'oficio_remision', 'acta_denuncia', 'datos_filiatorios',
        'acta_policial', 'derechos_imputado', 'evaluacion_medica', 'identificacion_cedula',
        'solicitud_examen_forense', 'resultados_examen_forense', 'asistencia_comdepro',
        'remision_estacionamiento', 'planilla_pvr', 'otros_documentos', 'entrevista',
        'cadena_custodia', 'inspecciones_tecnicas'
    ];

    // 🔹 Helpers UI
    const showMsg = (el, txt, type) => {
        if (!el) return;
        el.innerHTML = txt;
        el.className = `msg ${type}`;
        el.style.display = 'block';
    };
    const hideMsg = (el) => { if (el) el.style.display = 'none'; };
    
    const toggleLoading = (show, text = '⏳ Actualizando registro...') => {
        if (!loadingOverlay) return;
        const loadingText = loadingOverlay.querySelector('.loading-text');
        if (loadingText) loadingText.innerHTML = `${text}<small>Por favor, no cierre ni recargue esta ventana.</small>`;
        loadingOverlay.classList.toggle('active', show);
    };

    // ==========================================
    // 🔍 1. BÚSQUEDA DE PROCESADO
    // ==========================================
    async function buscarProcesado(valor) {
        const val = valor.trim();
        const tabla = 'registro_procesados';
        
        // Buscar por cédula (columna real) o por ID
        let query;
        if (/^\d+$/.test(val)) {
            // Si es solo números, buscar por cédula o ID
            query = `cedula.eq.${val},id.eq.${val}`;
        } else {
            // Si tiene letras, buscar solo por ID (UUID)
            query = `id.eq.${val}`;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from(tabla)
                .select('*')
                .or(query)
                .limit(1);

            if (error) throw error;

            if (!data || data.length === 0) {
                showMsg(msgBusqueda, '❌ No se encontró ningún procesado con ese dato.', 'error');
                datosPanel.style.display = 'none';
                formEditar.style.display = 'none';
                return;
            }

            currentData = data[0];
            registroIdActual = currentData.id;

            // Extraer datos de la persona del JSON
            try {
                personaData = typeof currentData.datos_originales === 'string' 
                    ? JSON.parse(currentData.datos_originales) 
                    : currentData.datos_originales;
            } catch (e) {
                console.error('❌ Error parseando datos_originales:', e);
                personaData = {};
            }

            showMsg(msgBusqueda, '✅ Registro encontrado. Puede editarlo a continuación.', 'success');
            renderizarDatos();
            cargarFormulario();
            renderizarDocumentos();
            
            datosPanel.style.display = 'block';
            formEditar.style.display = 'block';

        } catch (err) {
            console.error('❌ Error buscando:', err);
            showMsg(msgBusqueda, '❌ Error de conexión: ' + err.message, 'error');
        }
    }

    // ==========================================
    // 📋 2. RENDERIZAR DATOS DE LA PERSONA
    // ==========================================
    function renderizarDatos() {
        const nombreCompleto = [
            personaData.primer_nombre,
            personaData.segundo_nombre,
            personaData.primer_apellido,
            personaData.segundo_apellido
        ].filter(n => n && n.trim() !== '').join(' ') || 'Sin nombre';

        datosContenido.innerHTML = `
            <div class="dato-fila"><span class="dato-label">Cédula:</span> <span class="dato-valor">${personaData.cedula || currentData.cedula || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">Nombre Completo:</span> <span class="dato-valor">${nombreCompleto}</span></div>
            <div class="dato-fila"><span class="dato-label">Estatus:</span> <span class="dato-valor">${currentData.estatus || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">Fecha Procesamiento:</span> <span class="dato-valor">${currentData.fecha_procesamiento ? new Date(currentData.fecha_procesamiento).toLocaleDateString('es-VE') : '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">ID Registro:</span> <span class="dato-valor">${currentData.id}</span></div>
        `;
    }

    function cargarFormulario() {
        document.getElementById('edit_procesado_id').value = currentData.id;
        document.getElementById('edit_tabla_origen').value = currentData.tabla_origen || '';
        document.getElementById('edit_registro_id').value = currentData.registro_id || '';
        document.getElementById('edit_tipo_delito').value = currentData.tipo_delito || '';
        document.getElementById('edit_observaciones').value = currentData.observaciones || '';
    }

    // ==========================================
    // 📁 3. MANEJO DE DOCUMENTOS PDF
    // ==========================================
    function renderizarDocumentos() {
        docsUnicosContainer.innerHTML = '';
        docsMultiplesContainer.innerHTML = '';

        let totalDocs = 0;

        COLUMNAS_DOCS.forEach(campo => {
            const urls = currentData[campo] || [];
            
            // Asegurar que sea un array
            let urlsArray = [];
            if (Array.isArray(urls)) {
                urlsArray = urls;
            } else if (typeof urls === 'string' && urls.startsWith('[')) {
                try {
                    urlsArray = JSON.parse(urls);
                } catch (e) {
                    urlsArray = [];
                }
            }

            if (urlsArray.length > 0) {
                totalDocs += urlsArray.length;
                docsUnicosContainer.innerHTML += crearItemDoc(campo, urlsArray);
            }
        });

        if (totalDocs === 0) {
            docsUnicosContainer.innerHTML = '<p style="color:#64748b; font-size:0.85rem; text-align:center; padding:20px;">📭 No se encontraron documentos cargados en este registro.</p>';
        }
    }

    function crearItemDoc(campo, urls) {
        const nombreCampo = campo.replace(/_/g, ' ').toUpperCase();
        let html = `
            <div class="doc-item" data-campo="${campo}">
                <div class="doc-header">
                    <label>📄 ${nombreCampo} (${urls.length} archivo${urls.length > 1 ? 's' : ''})</label>
                </div>
        `;

        urls.forEach((url, index) => {
            const nombreArchivo = url.split('/').pop();
            html += `
                <div class="doc-current" data-index="${index}" data-url="${url}">
                    <div class="file-info">📎 <span title="${nombreArchivo}">${nombreArchivo}</span></div>
                    <div class="actions">
                        <button type="button" class="btn-view" onclick="window.open('${url}', '_blank')">👁️ Ver</button>
                        <button type="button" class="btn-delete" onclick="marcarDocEliminacion(this, '${campo}', ${index})">🗑️</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    // Función global para marcar documento para eliminación
    window.marcarDocEliminacion = function(btn, campo, index) {
        if(confirm('¿Eliminar este documento? Se marcará para eliminación al guardar.')) {
            const docCurrent = btn.closest('.doc-current');
            docCurrent.style.opacity = '0.4';
            docCurrent.style.textDecoration = 'line-through';
            docCurrent.dataset.action = 'delete';
            
            // Guardar en un objeto global las eliminaciones pendientes
            if (!window.docsEliminados) window.docsEliminados = {};
            if (!window.docsEliminados[campo]) window.docsEliminados[campo] = [];
            window.docsEliminados[campo].push(index);
        }
    };

    // ==========================================
    // 💾 4. GUARDAR CAMBIOS
    // ==========================================
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!registroIdActual) return;

        toggleLoading(true);
        hideMsg(msgForm);

        try {
            const tipoDelito = document.getElementById('edit_tipo_delito').value.trim();
            const observaciones = document.getElementById('edit_observaciones').value.trim();

            if (!tipoDelito) {
                toggleLoading(false);
                return showMsg(msgForm, '⚠️ El Tipo de Delito es obligatorio.', 'error');
            }

            // Preparar datos a actualizar
            const datosActualizar = { 
                tipo_delito: tipoDelito,
                observaciones: observaciones
            };

            // Procesar eliminaciones de documentos
            if (window.docsEliminados && Object.keys(window.docsEliminados).length > 0) {
                for (const [campo, indices] of Object.entries(window.docsEliminados)) {
                    const urlsActuales = currentData[campo] || [];
                    // Filtrar las URLs eliminadas (de atrás hacia adelante para no afectar los índices)
                    const urlsFiltradas = urlsActuales.filter((_, idx) => !indices.includes(idx));
                    datosActualizar[campo] = urlsFiltradas;
                }
            }

            const { error: updateError } = await window.supabaseClient
                .from('registro_procesados')
                .update(datosActualizar)
                .eq('id', registroIdActual);

            if (updateError) throw updateError;

            toggleLoading(false);
            showMsg(msgForm, '✅ Cambios guardados exitosamente.', 'success');
            
            // Limpiar estado
            window.docsEliminados = {};
            
            setTimeout(() => {
                formEditar.reset();
                formEditar.style.display = 'none';
                datosPanel.style.display = 'none';
                hideMsg(msgBusqueda);
                buscarInput.value = '';
            }, 3000);

        } catch (err) {
            console.error('❌ Error guardando:', err);
            toggleLoading(false);
            showMsg(msgForm, '❌ Error al guardar: ' + err.message, 'error');
        }
    });

    // ==========================================

    if (buscarBtn && buscarInput) {
        buscarBtn.addEventListener('click', () => {
            const val = buscarInput.value.trim();
            if (val.length < 3) return showMsg(msgBusqueda, '⚠️ Ingrese al menos 3 caracteres.', 'error');
            hideMsg(msgBusqueda);
            window.docsEliminados = {};
            buscarProcesado(val);
        });

        buscarInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarBtn.click();
            }
        });
    }

    // Inicializar objeto global para eliminaciones
    window.docsEliminados = {};
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initEditarProcesado);
} else {
    window.initEditarProcesado();
}
