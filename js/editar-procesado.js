window.initEditarProcesado = function() {
    console.log("✅ Módulo editar-procesado.js cargado correctamente.");

    // ==========================================
    // LISTAS DE DOCUMENTOS (CORREGIDO: Sin 'entrevista' en Únicos)
    // ==========================================
    const docsUnicos = [
        { id: 'portada', label: '📑 Portada' },
        { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
        { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
        // ❌ ELIMINADO: { id: 'entrevista', label: '🎤 Entrevista' },
        { id: 'datos_filiatorios', label: '📋 Datos Filiatorios' },
        { id: 'acta_policial', label: '📋 Acta Policial' },
        { id: 'derechos_imputado', label: '⚖️ Derechos del Imputado' },
        { id: 'evaluacion_medica', label: '🏥 Evaluación Médica' },
        { id: 'identificacion_cedula', label: '🆔 Identificación (Cédula)' },
        { id: 'solicitud_examen_forense', label: '🔬 Solicitud de Examen Forense' },
        { id: 'resultados_examen_forense', label: '🔬 Resultados del Examen Forense' },
        { id: 'asistencia_comdepro', label: '🤝 Asistencia de Comdepro' },
        { id: 'remision_estacionamiento', label: '🚗 Remisión a Estacionamiento' },
        { id: 'planilla_pvr', label: '🚙 Planilla de Revisión de Vehículo (PVR)' },
        { id: 'otros_documentos', label: '📎 Otros Documentos' }
    ];

    const docsMultiples = [
        { id: 'entrevista_multi', label: '🎤 Entrevistas (Múltiples)', max: 10, min: 1 },
        { id: 'cadena_custodia', label: '🔗 Cadena de Custodia', max: 10, min: 1 },
        { id: 'inspecciones_tecnicas', label: '🔍 Inspecciones Técnicas', max: 10, min: 1 }
    ];

    // ==========================================
    // ESTADO Y VARIABLES GLOBALES
    // ==========================================
    let archivosNuevos = {}; 
    let docsEliminados = {}; 
    let currentData = null;
    let registroIdActual = null;
    let personaData = null;

    // ==========================================
    // GENERAR DOCUMENTOS EN DOM
    // ==========================================
    function generarEstructuraDocumentos() {
        const contenedorUnicos = document.getElementById('edit-docs-unicos-container');
        const contenedorMultiples = document.getElementById('edit-docs-multiples-container');
        if (!contenedorUnicos || !contenedorMultiples) return;

        contenedorUnicos.innerHTML = '';
        contenedorMultiples.innerHTML = '';

        // ✅ DOCS ÚNICOS (SIN atributo 'multiple', solo 1 archivo)
        docsUnicos.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.id = `doc-item-${doc.id}`;
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label}</label>
                </div>
                <div class="doc-current-list" id="current-${doc.id}"></div>
                <div class="doc-upload-area active">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" onchange="agregarArchivosNuevos('${doc.id}', this)">
                    <div id="status-${doc.id}" class="file-status-container"></div>
                </div>
            `;
            contenedorUnicos.appendChild(div);
        });

        // ✅ DOCS MÚLTIPLES (CON atributo 'multiple')
        docsMultiples.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.id = `doc-item-${doc.id}`;
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Máx ${doc.max})</span></label>
                </div>
                <div class="doc-current-list" id="current-${doc.id}"></div>
                <div class="doc-upload-area active">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" multiple onchange="agregarArchivosNuevos('${doc.id}', this)">
                    <div id="status-${doc.id}" class="file-status-container"></div>
                </div>
            `;
            contenedorMultiples.appendChild(div);
        });
    }

    // ==========================================
    // FUNCIONES GLOBALES DE UI
    // ==========================================
    window.agregarArchivosNuevos = function(campo, input) {
        if (!input.files || input.files.length === 0) return;
        
        const esUnico = docsUnicos.some(d => d.id === campo);
        
        if (esUnico) {
            // ✅ ÚNICO: Solo guarda 1 archivo
            archivosNuevos[campo] = [input.files[0]];
        } else {
            // ✅ MÚLTIPLE: Agrega a la lista
            if (!archivosNuevos[campo]) archivosNuevos[campo] = [];
            for (const file of input.files) {
                if (file.type === 'application/pdf') {
                    archivosNuevos[campo].push(file);
                }
            }
        }
        
        const statusContainer = document.getElementById(`status-${campo}`);
        if (statusContainer) {
            const count = archivosNuevos[campo].length;
            statusContainer.innerHTML = `<div class="file-loaded"><span>✅</span><span class="file-name">${count} archivo(s) listo(s) para subir al guardar</span></div>`;
        }
        input.value = ''; // Limpiar input
    };

    window.marcarDocEliminacion = function(campo, index, btn) {
        if(confirm('¿Eliminar este documento? Se marcará para eliminación al guardar.')) {
            const item = btn.closest('.doc-current');
            item.style.opacity = '0.4';
            item.style.textDecoration = 'line-through';
            
            if (!docsEliminados[campo]) docsEliminados[campo] = [];
            docsEliminados[campo].push(index);
        }
    };

    // ==========================================
    // OVERLAY DE CARGA
    // ==========================================
    const loadingOverlay = document.getElementById('edit-loading-overlay');
    
    function mostrarOverlay(mensaje = '⏳ Actualizando registro...') {
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('.loading-text');
            if (loadingText) loadingText.innerHTML = `${mensaje}<br><small>Por favor, no cierre ni recargue esta ventana.</small>`;
            loadingOverlay.classList.add('active');
        }
    }
    function ocultarOverlay() {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }

    // ==========================================
    // REFERENCIAS DOM Y HELPERS
    // ==========================================
    const btnBuscar = document.getElementById('edit_btn_buscar');
    const inputBusqueda = document.getElementById('edit_busqueda_input');
    const msgBusqueda = document.getElementById('edit_msg_busqueda');
    const datosPanel = document.getElementById('edit-datos-panel');
    const datosContenido = document.getElementById('edit-datos-contenido');
    const form = document.getElementById('form-editar-procesado');
    const msgForm = document.getElementById('edit-msg-form');

    const mostrarMsg = (el, txt, type) => {
        if (!el) return;
        el.innerHTML = txt;
        el.className = `msg ${type}`;
        el.style.display = 'block';
    };
    const ocultarMsg = (el) => { if (el) el.style.display = 'none'; };

    function convertirAArray(valor) {
        if (Array.isArray(valor)) return valor;
        if (typeof valor === 'string') {
            try {
                const parsed = JSON.parse(valor);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) { return []; }
        }
        return [];
    }

    function esUUID(valor) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
    }

    // ==========================================
    // BÚSQUEDA DE PROCESADO
    // ==========================================
    async function buscarProcesado(valor) {
        const val = valor.trim();
        let query;
        
        if (esUUID(val)) query = `id.eq.${val}`;
        else if (/^\d+$/.test(val)) query = `cedula.eq.${val}`;
        else query = `cedula.ilike.%${val}%`;

        try {
            const { data, error } = await window.supabaseClient
                .from('registro_procesados')
                .select('*')
                .or(query)
                .limit(1);

            if (error) throw error;
            if (!data || data.length === 0) {
                mostrarMsg(msgBusqueda, '❌ No se encontró ningún procesado.', 'error');
                datosPanel.style.display = 'none';
                form.style.display = 'none';
                return;
            }

            currentData = data[0];
            registroIdActual = currentData.id;

            try {
                personaData = typeof currentData.datos_originales === 'string' 
                    ? JSON.parse(currentData.datos_originales || '{}') 
                    : (currentData.datos_originales || {});
            } catch (e) { personaData = {}; }

            mostrarMsg(msgBusqueda, '✅ Registro encontrado. Puede editarlo a continuación.', 'success');
            renderizarDatos();
            cargarFormulario();
            cargarDocumentosExistentes();
            
            datosPanel.style.display = 'block';
            form.style.display = 'block';

        } catch (err) {
            console.error('❌ Error buscando:', err);
            mostrarMsg(msgBusqueda, '❌ Error de conexión: ' + err.message, 'error');
        }
    }

    // ==========================================
    // RENDERIZAR DATOS Y FORMULARIO
    // ==========================================
    function renderizarDatos() {
        const nombreCompleto = [
            personaData.primer_nombre, personaData.segundo_nombre, 
            personaData.primer_apellido, personaData.segundo_apellido
        ].filter(n => n && n.trim() !== '').join(' ') || 'Sin nombre';

        datosContenido.innerHTML = `
            <div class="dato-fila"><span class="dato-label">Cédula:</span> <span class="dato-valor">${personaData.cedula || currentData.cedula || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">Nombre Completo:</span> <span class="dato-valor">${nombreCompleto}</span></div>
            <div class="dato-fila"><span class="dato-label">Estatus:</span> <span class="dato-valor">${currentData.estatus || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">Fecha Procesamiento:</span> <span class="dato-valor">${currentData.fecha_procesamiento ? new Date(currentData.fecha_procesamiento).toLocaleDateString('es-VE') : '-'}</span></div>
        `;
    }

    function cargarFormulario() {
        document.getElementById('edit_procesado_id').value = currentData.id;
        document.getElementById('edit_tipo_delito').value = currentData.tipo_delito || '';
        document.getElementById('edit_observaciones').value = currentData.observaciones || '';
    }

    // ==========================================
    // CARGAR DOCUMENTOS EXISTENTES
    // ==========================================
    function cargarDocumentosExistentes() {
        const todasLasColumnas = [...docsUnicos, ...docsMultiples];
        
        // Extraer documentos multiples adicionales del JSON
        const multiplesAdicionales = personaData.documentos_multiples_adicionales || {};

        todasLasColumnas.forEach(doc => {
            const currentList = document.getElementById(`current-${doc.id}`);
            if (!currentList) return;
            currentList.innerHTML = '';

            let urls = [];
            if (doc.id === 'entrevista_multi') {
                // ✅ Leer 'entrevista_multi' desde el JSON anidado
                urls = convertirAArray(multiplesAdicionales.entrevista_multi);
            } else {
                // Leer el resto desde columnas top-level
                urls = convertirAArray(currentData[doc.id]);
            }
            
            urls.forEach((url, index) => {
                const nombreArchivo = url.split('/').pop();
                const itemDiv = document.createElement('div');
                itemDiv.className = 'doc-current';
                itemDiv.innerHTML = `
                    <div class="file-info">📎 <span title="${nombreArchivo}">${nombreArchivo}</span></div>
                    <div class="actions">
                        <button type="button" class="btn-view" onclick="window.open('${url}', '_blank')">👁️ Ver</button>
                        <button type="button" class="btn-delete" onclick="marcarDocEliminacion('${doc.id}', ${index}, this)">🗑️</button>
                    </div>
                `;
                currentList.appendChild(itemDiv);
            });

            if (urls.length === 0) {
                currentList.innerHTML = `<div style="font-size:0.8rem; color:#94a3b8; padding:8px;">📭 Sin documentos cargados</div>`;
            }
        });
    }

    // ==========================================
    // LISTENERS DE BÚSQUEDA
    // ==========================================
    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', () => {
            const val = inputBusqueda.value.trim();
            if (val.length < 3) return mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 3 caracteres.', 'error');
            ocultarMsg(msgBusqueda);
            archivosNuevos = {};
            docsEliminados = {};
            buscarProcesado(val);
        });

        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnBuscar.click(); }
        });
    }

    // ==========================================
    // ENVÍO DEL FORMULARIO
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!registroIdActual) return mostrarMsg(msgForm, '❌ Debe buscar un registro primero.', 'error');

            const tipoDelito = document.getElementById('edit_tipo_delito').value.trim();
            if (!tipoDelito) return mostrarMsg(msgForm, '⚠️ El tipo de delito es obligatorio.', 'error');

            mostrarOverlay('⏳ Actualizando registro y documentos...');
            ocultarMsg(msgForm);

            try {
                const datosActualizar = { 
                    tipo_delito: tipoDelito,
                    observaciones: document.getElementById('edit_observaciones').value.trim()
                };

                // Preparar JSON de datos originales
                let datosOriginales = typeof currentData.datos_originales === 'string' 
                    ? JSON.parse(currentData.datos_originales || '{}') 
                    : (currentData.datos_originales || {});
                if (!datosOriginales.documentos_multiples_adicionales) datosOriginales.documentos_multiples_adicionales = {};

                const bucket = window.supabaseClient.storage.from('procesados_documentos');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();

                // Función auxiliar para subir archivos
                const subirArchivos = async (campo, files) => {
                    const urls = [];
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const path = `${uid}/${ts}_${campo}_${i}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${campo}[${i}]: ${error.message}`);
                        urls.push(bucket.getPublicUrl(path).data.publicUrl);
                    }
                    return urls;
                };

                // 1. Procesar Campos Top (Únicos + Cadena + Inspecciones)
                // ✅ 'entrevista' ya no está en docsUnicos, por lo que no se procesará aquí
                const camposTop = [...docsUnicos.map(d=>d.id), 'cadena_custodia', 'inspecciones_tecnicas'];
                for (const campo of camposTop) {
                    let urlsActuales = convertirAArray(currentData[campo]);
                    
                    if (docsEliminados[campo]) {
                        urlsActuales = urlsActuales.filter((_, idx) => !docsEliminados[campo].includes(idx));
                    }
                    if (archivosNuevos[campo] && archivosNuevos[campo].length > 0) {
                        const urlsNuevas = await subirArchivos(campo, archivosNuevos[campo]);
                        urlsActuales = [...urlsActuales, ...urlsNuevas];
                    }
                    datosActualizar[campo] = urlsActuales;
                }

                // 2. Procesar entrevista_multi (Dentro de datos_originales)
                let urlsEntrevista = convertirAArray(datosOriginales.documentos_multiples_adicionales.entrevista_multi || []);
                if (docsEliminados['entrevista_multi']) {
                    urlsEntrevista = urlsEntrevista.filter((_, idx) => !docsEliminados['entrevista_multi'].includes(idx));
                }
                if (archivosNuevos['entrevista_multi'] && archivosNuevos['entrevista_multi'].length > 0) {
                    const urlsNuevas = await subirArchivos('entrevista_multi', archivosNuevos['entrevista_multi']);
                    urlsEntrevista = [...urlsEntrevista, ...urlsNuevas];
                }
                datosOriginales.documentos_multiples_adicionales.entrevista_multi = urlsEntrevista;
                datosActualizar.datos_originales = datosOriginales; // Actualizar el JSONB

                // 3. Actualizar Base de Datos
                const { error: updateError } = await window.supabaseClient
                    .from('registro_procesados')
                    .update(datosActualizar)
                    .eq('id', registroIdActual);

                if (updateError) throw updateError;

                // 4. ✅ REGISTRAR LOG USANDO UTILS.JS
                if (typeof window.registrarLog === 'function') {
                    const logDetalles = {
                        tipo_delito: tipoDelito,
                        cedula: currentData.cedula || personaData?.cedula || 'N/A',
                        nombre_completo: `${personaData?.primer_nombre || ''} ${personaData?.primer_apellido || ''}`.trim() || 'N/A',
                        documentos_eliminados: Object.keys(docsEliminados).length,
                        documentos_agregados: Object.keys(archivosNuevos).length
                    };
                    await window.registrarLog('EDITAR_PROCESADO', 'PROCESADOS', logDetalles, registroIdActual);
                    console.log('✅ Log de edición registrado en sistema_logs');
                }

                ocultarOverlay();
                mostrarMsg(msgForm, '✅ Cambios guardados exitosamente.', 'success');
                
                archivosNuevos = {};
                docsEliminados = {};
                
                setTimeout(() => {
                    form.reset();
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    ocultarMsg(msgBusqueda);
                    inputBusqueda.value = '';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 3000);

            } catch (err) {
                ocultarOverlay();
                console.error('❌ Error guardando:', err);
                mostrarMsg(msgForm, '❌ Error al guardar: ' + err.message, 'error');
            }
        });
    }

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    generarEstructuraDocumentos();
    console.log("✅ Módulo editar-procesado.js inicializado correctamente.");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initEditarProcesado);
} else {
    window.initEditarProcesado();
}
