// ✅ MÓDULO EDITAR PROCESADO - CORREGIDO PARA STRINGS JSON
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
    let personaData = null;
    let archivosNuevos = {};

    // 🔹 Columnas de documentos PDF
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

    // 🔹 Función para convertir a array (maneja strings JSON y arrays)
    function convertirAArray(valor) {
        if (Array.isArray(valor)) {
            return valor;
        }
        if (typeof valor === 'string') {
            try {
                const parsed = JSON.parse(valor);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.warn('⚠️ No se pudo parsear como JSON:', valor);
                return [];
            }
        }
        return [];
    }

    // 🔹 Función para detectar si es un UUID válido
    function esUUID(valor) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(valor);
    }

    // ==========================================
    // 🔍 1. BÚSQUEDA DE PROCESADO
    // ==========================================
    async function buscarProcesado(valor) {
        const val = valor.trim();
        const tabla = 'registro_procesados';
        
        let query;
        if (esUUID(val)) {
            query = `id.eq.${val}`;
            console.log('🔍 Buscando por UUID:', val);
        } else if (/^\d+$/.test(val)) {
            query = `cedula.eq.${val}`;
            console.log('🔍 Buscando por cédula:', val);
        } else {
            query = `cedula.ilike.%${val}%`;
            console.log('🔍 Buscando por cédula (parcial):', val);
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
    // 📁 3. MANEJO DE DOCUMENTOS PDF (TODOS LOS CAMPOS)
    // ==========================================
    function renderizarDocumentos() {
        docsUnicosContainer.innerHTML = '';
        docsMultiplesContainer.innerHTML = '';
        archivosNuevos = {};

        COLUMNAS_DOCS.forEach(campo => {
            const urlsArray = convertirAArray(currentData[campo]);
            docsUnicosContainer.innerHTML += crearItemDocCompleto(campo, urlsArray);
        });
    }

    function crearItemDocCompleto(campo, urls) {
        const nombreCampo = campo.replace(/_/g, ' ').toUpperCase();
        let html = `
            <div class="doc-item" data-campo="${campo}">
                <div class="doc-header">
                    <label>📄 ${nombreCampo}</label>
                </div>
        `;

        if (urls.length > 0) {
            html += `<div class="doc-current-count">${urls.length} archivo${urls.length > 1 ? 's' : ''} cargado${urls.length > 1 ? 's' : ''}</div>`;
            
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
        } else {
            html += `<div class="doc-empty">📭 Sin documentos cargados</div>`;
        }

        html += `
            <div class="doc-upload-area active">
                <input type="file" id="file-${campo}" accept=".pdf" multiple onchange="agregarArchivosNuevos(this, '${campo}')">
                <div id="file-list-${campo}" class="file-count"></div>
            </div>
        `;

        html += `</div>`;
        return html;
    }

    window.agregarArchivosNuevos = function(input, campo) {
        const files = Array.from(input.files);
        if (files.length === 0) return;

        if (!archivosNuevos[campo]) {
            archivosNuevos[campo] = [];
        }

        files.forEach(file => {
            archivosNuevos[campo].push(file);
        });

        const fileList = document.getElementById(`file-list-${campo}`);
        if (fileList) {
            const fileNames = archivosNuevos[campo].map(f => f.name).join(', ');
            fileList.innerHTML = `<div class="file-loaded">📎 ${archivosNuevos[campo].length} archivo(s) seleccionado(s): ${fileNames}</div>`;
        }

        console.log(`✅ Archivos agregados para ${campo}:`, archivosNuevos[campo]);
    };

    window.marcarDocEliminacion = function(btn, campo, index) {
        if(confirm('¿Eliminar este documento? Se marcará para eliminación al guardar.')) {
            const docCurrent = btn.closest('.doc-current');
            docCurrent.style.opacity = '0.4';
            docCurrent.style.textDecoration = 'line-through';
            docCurrent.dataset.action = 'delete';
            
            if (!window.docsEliminados) window.docsEliminados = {};
            if (!window.docsEliminados[campo]) window.docsEliminados[campo] = [];
            window.docsEliminados[campo].push(index);
        }
    };

    // ==========================================
    // 💾 4. GUARDAR CAMBIOS (CORREGIDO)
    // ==========================================
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!registroIdActual) return;

        toggleLoading(true, '⏳ Guardando cambios...');
        hideMsg(msgForm);

        try {
            const tipoDelito = document.getElementById('edit_tipo_delito').value.trim();
            const observaciones = document.getElementById('edit_observaciones').value.trim();

            if (!tipoDelito) {
                toggleLoading(false);
                return showMsg(msgForm, '⚠️ El Tipo de Delito es obligatorio.', 'error');
            }

            const datosActualizar = { 
                tipo_delito: tipoDelito,
                observaciones: observaciones
            };

            // ✅ PROCESAR ELIMINACIONES DE DOCUMENTOS (CORREGIDO)
            if (window.docsEliminados && Object.keys(window.docsEliminados).length > 0) {
                for (const [campo, indices] of Object.entries(window.docsEliminados)) {
                    // ✅ CORREGIDO: Usar convertirAArray para asegurar que sea un array
                    const urlsActuales = convertirAArray(currentData[campo]);
                    const urlsFiltradas = urlsActuales.filter((_, idx) => !indices.includes(idx));
                    datosActualizar[campo] = urlsFiltradas;
                }
            }

            // ✅ SUBIR ARCHIVOS NUEVOS AL STORAGE
            if (Object.keys(archivosNuevos).length > 0) {
                toggleLoading(true, '⏳ Subiendo documentos nuevos...');
                
                for (const [campo, files] of Object.entries(archivosNuevos)) {
                    const urlsNuevas = [];
                    
                    for (const file of files) {
                        const timestamp = Date.now();
                        const fileName = `${timestamp}_${campo}_${file.name}`;
                        const userId = personaData.id || currentData.registro_id || 'unknown';
                        const filePath = `${userId}/${fileName}`;

                        const { data: uploadData, error: uploadError } = await window.supabaseClient
                            .storage
                            .from('procesados_documentos')
                            .upload(filePath, file, {
                                cacheControl: '3600',
                                upsert: false
                            });

                        if (uploadError) {
                            console.error(`❌ Error subiendo ${file.name}:`, uploadError);
                            throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);
                        }

                        const { data: urlData } = window.supabaseClient
                            .storage
                            .from('procesados_documentos')
                            .getPublicUrl(filePath);

                        urlsNuevas.push(urlData.publicUrl);
                        console.log(`✅ Archivo subido: ${file.name}`);
                    }

                    // ✅ CORREGIDO: Combinar URLs existentes (convertidas a array) con las nuevas
                    const urlsExistentes = datosActualizar[campo] || convertirAArray(currentData[campo]);
                    datosActualizar[campo] = [...urlsExistentes, ...urlsNuevas];
                }
            }

            // ✅ ACTUALIZAR BASE DE DATOS
            toggleLoading(true, '⏳ Actualizando registro...');
            const { error: updateError } = await window.supabaseClient
                .from('registro_procesados')
                .update(datosActualizar)
                .eq('id', registroIdActual);

            if (updateError) throw updateError;

            toggleLoading(false);
            showMsg(msgForm, '✅ Cambios guardados exitosamente.', 'success');
            
            window.docsEliminados = {};
            archivosNuevos = {};
            
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
    // 🔹 LISTENERS INICIALES
    // ==========================================
    if (buscarBtn && buscarInput) {
        buscarBtn.addEventListener('click', () => {
            const val = buscarInput.value.trim();
            if (val.length < 3) return showMsg(msgBusqueda, '⚠️ Ingrese al menos 3 caracteres.', 'error');
            hideMsg(msgBusqueda);
            window.docsEliminados = {};
            archivosNuevos = {};
            buscarProcesado(val);
        });

        buscarInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarBtn.click();
            }
        });
    }

    window.docsEliminados = {};
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initEditarProcesado);
} else {
    window.initEditarProcesado();
}
