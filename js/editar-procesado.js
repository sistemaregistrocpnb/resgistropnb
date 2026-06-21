window.initEditarProcesado = function() {
    console.log("✅ Módulo editar-procesado.js inicializado correctamente.");

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
    let tablaActual = '';
    let registroIdActual = null;

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
        const val = valor.trim().toUpperCase();
        // ⚠️ NOTA: Cambia 'procesados' por el nombre real de tu tabla en Supabase
       const tabla = 'registro_procesados'; 
        
        const query = `cedula.ilike.%${val}%,placa.ilike.%${val}%,id.eq.${val}`;

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
            tablaActual = tabla;
            registroIdActual = currentData.id;

            showMsg(msgBusqueda, '✅ Registro encontrado. Puede editarlo a continuación.', 'success');
            renderizarDatos(currentData);
            cargarFormulario(currentData);
            renderizarDocumentos(currentData);
            
            datosPanel.style.display = 'block';
            formEditar.style.display = 'block';

        } catch (err) {
            console.error('❌ Error buscando:', err);
            showMsg(msgBusqueda, '❌ Error de conexión: ' + err.message, 'error');
        }
    }

    // ==========================================
    // 📋 2. RENDERIZAR DATOS Y FORMULARIO
    // ==========================================
    function renderizarDatos(data) {
        datosContenido.innerHTML = `
            <div class="dato-fila"><span class="dato-label">Cédula:</span> <span class="dato-valor">${data.cedula || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">Placa:</span> <span class="dato-valor">${data.placa || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">Nombre:</span> <span class="dato-valor">${data.primer_nombre || ''} ${data.primer_apellido || ''}</span></div>
            <div class="dato-fila"><span class="dato-label">ID Registro:</span> <span class="dato-valor">${data.id}</span></div>
        `;
    }

    function cargarFormulario(data) {
        document.getElementById('edit_procesado_id').value = data.id;
        document.getElementById('edit_tabla_origen').value = tablaActual;
        document.getElementById('edit_registro_id').value = data.id;
        document.getElementById('edit_tipo_delito').value = data.tipo_delito || '';
        document.getElementById('edit_observaciones').value = data.observaciones || '';
    }

    // ==========================================
    // 📁 3. MANEJO DE DOCUMENTOS (PDFs)
    // ==========================================
    function renderizarDocumentos(data) {
        // Limpiar contenedores
        docsUnicosContainer.innerHTML = '';
        docsMultiplesContainer.innerHTML = '';

        // Ejemplo: Renderizar documentos únicos (Ajusta los nombres de las columnas según tu BD)
        const docsUnicos = ['documento_identidad', 'antecedentes_penales']; 
        docsUnicos.forEach(campo => {
            if (data[campo]) {
                docsUnicosContainer.innerHTML += crearItemDocUnico(campo, data[campo]);
            }
        });

        // Ejemplo: Renderizar documentos múltiples (Asumiendo que es un Array JSON)
        const docsMultiples = data.pruebas_adicionales || [];
        if (Array.isArray(docsMultiples) && docsMultiples.length > 0) {
            docsMultiples.forEach((url, index) => {
                docsMultiplesContainer.innerHTML += crearItemDocMultiple(url, index);
            });
        } else {
            docsMultiplesContainer.innerHTML = '<p style="color:#64748b; font-size:0.85rem;">No hay documentos múltiples cargados.</p>';
        }

        // Agregar botones para subir nuevos archivos
        docsMultiplesContainer.innerHTML += `
            <button type="button" class="btn-add-file" onclick="document.getElementById('file-multiple-input').click()">➕ Agregar Más Documentos</button>
            <input type="file" id="file-multiple-input" multiple accept=".pdf" style="display:none;">
            <div id="file-multiple-list" class="file-count"></div>
        `;
    }

    function crearItemDocUnico(campo, url) {
        return `
            <div class="doc-item" data-campo="${campo}">
                <div class="doc-header">
                    <label>${campo.replace(/_/g, ' ').toUpperCase()}</label>
                </div>
                <div class="doc-current">
                    <div class="file-info">📄 <span>${url.split('/').pop()}</span></div>
                    <div class="actions">
                        <button type="button" class="btn-view" onclick="window.open('${url}', '_blank')">👁️ Ver</button>
                        <button type="button" class="btn-delete" onclick="eliminarDocUnico(this, '${campo}')">🗑️</button>
                    </div>
                </div>
                <div class="doc-upload-area">
                    <input type="file" accept=".pdf" onchange="reemplazarDocUnico(this, '${campo}')">
                </div>
            </div>
        `;
    }

    function crearItemDocMultiple(url, index) {
        return `
            <div class="file-item-multiple" data-index="${index}">
                <span>📎 ${url.split('/').pop()}</span>
                <div class="file-actions">
                    <button type="button" class="btn-view" onclick="window.open('${url}', '_blank')">👁️</button>
                    <button type="button" onclick="eliminarDocMultiple(this, ${index})">🗑️</button>
                </div>
            </div>
        `;
    }

    // Funciones globales para los botones de documentos
    window.eliminarDocUnico = function(btn, campo) {
        if(confirm('¿Eliminar este documento? Se subirá uno nuevo al guardar.')) {
            btn.closest('.doc-item').style.opacity = '0.5';
            btn.closest('.doc-item').dataset.action = 'delete';
        }
    };
    window.reemplazarDocUnico = function(input, campo) {
        if(input.files.length > 0) {
            const item = input.closest('.doc-item');
            item.dataset.action = 'replace';
            item.dataset.newFile = input.files[0];
            item.querySelector('.doc-current').style.background = '#fef3c7';
        }
    };
    window.eliminarDocMultiple = function(btn, index) {
        btn.closest('.file-item-multiple').style.display = 'none';
        btn.closest('.file-item-multiple').dataset.action = 'delete';
    };

    // ==========================================
    // 💾 4. GUARDAR CAMBIOS (SUPABASE)
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

            // 1. Actualizar campos de texto
            const { error: updateError } = await window.supabaseClient
                .from(tablaActual)
                .update({ 
                    tipo_delito: tipoDelito,
                    observaciones: observaciones,
                    updated_at: new Date().toISOString()
                })
                .eq('id', registroIdActual);

            if (updateError) throw updateError;

            // 2. Aquí iría la lógica para subir los PDFs nuevos al Storage de Supabase
            // y actualizar las URLs en la base de datos. (Se omite para mantener el ejemplo limpio, 
            // pero debes usar supabase.storage.from('bucket_name').upload(...))

            toggleLoading(false);
            showMsg(msgForm, '✅ Cambios guardados exitosamente.', 'success');
            
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
            buscarProcesado(val);
        });

        buscarInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarBtn.click();
            }
        });
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initEditarProcesado);
} else {
    window.initEditarProcesado();
}
