window.initModDenuncias = function() {
    console.log("⚙️ Iniciando módulo mod-denuncias.js...");

    if (window._modDenunciasInitialized) return;
    window._modDenunciasInitialized = true;

    const docsUnicos = [
        { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
        { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
        { id: 'medida_proteccion', label: '🛡️ Medida de Protección' }
    ];

    const docsMultiples = [
        { id: 'acta_entrevista', label: '🎤 Acta de Entrevista', max: 10 },
        { id: 'datos_filiatorios', label: '👤 Datos Filiatorios', max: 10 },
        { id: 'evidencias', label: '🔍 Evidencias', max: 10 },
        { id: 'solicitud_senamecf', label: '🏥 Solicitud SENAMECF', max: 10 }
    ];

    // Estado de los documentos durante la edición
    const modEstadoDocs = {
        unicos: {},
        multiples: {}
    };

    function inicializarContenedores() {
        const contUnicos = document.getElementById('mod_docs_unicos_container');
        const contMultiples = document.getElementById('mod_docs_multiples_container');
        if (contUnicos) contUnicos.innerHTML = '';
        if (contMultiples) contMultiples.innerHTML = '';

        docsUnicos.forEach(doc => {
            modEstadoDocs.unicos[doc.id] = { urlOriginal: null, toDelete: false, newFile: null };
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label}</label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="mod_doc_${doc.id}" value="no" checked onchange="window.mod_toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="mod_doc_${doc.id}" value="si" onchange="window.mod_toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="mod_upload_${doc.id}">
                    <div id="mod_status_${doc.id}"></div>
                    <input type="file" id="mod_file_${doc.id}" accept=".pdf,application/pdf" onchange="window.mod_cargarDocUnico('${doc.id}', this)" style="margin-top: 8px;">
                </div>
            `;
            if (contUnicos) contUnicos.appendChild(div);
        });

        docsMultiples.forEach(doc => {
            modEstadoDocs.multiples[doc.id] = { urlsOriginales: [], indicesToDelete: [], newFiles: [] };
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Máximo ${doc.max})</span></label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="mod_doc_${doc.id}" value="no" checked onchange="window.mod_toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="mod_doc_${doc.id}" value="si" onchange="window.mod_toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="mod_upload_${doc.id}">
                    <div id="mod_list_${doc.id}" style="margin-bottom: 8px;"></div>
                    <input type="file" id="mod_file_${doc.id}" accept=".pdf,application/pdf" multiple style="margin-bottom: 8px;">
                    <button type="button" class="btn-add-file" onclick="window.mod_agregarMultiples('${doc.id}', ${doc.max})">➕ Agregar archivos</button>
                    <div class="file-count" id="mod_count_${doc.id}">0 archivos</div>
                </div>
            `;
            if (contMultiples) contMultiples.appendChild(div);
        });
    }

    // ==========================================
    // FUNCIONES GLOBALES DE UI (Prefijo mod_)
    // ==========================================
    window.mod_toggleDocField = function(campo, mostrar) {
        const area = document.getElementById(`mod_upload_${campo}`);
        if (area) {
            area.style.display = mostrar ? 'block' : 'none';
        }
    };

    window.mod_cargarDocUnico = function(docId, input) {
        if (input.files && input.files[0]) {
            modEstadoDocs.unicos[docId].newFile = input.files[0];
            modEstadoDocs.unicos[docId].toDelete = false; // Si sube uno nuevo, ya no se borra el viejo, se reemplaza
            const statusDiv = document.getElementById(`mod_status_${docId}`);
            statusDiv.innerHTML = `
                <div class="file-loaded" style="background: #dcfce7; border-color: #86efac; color: #15803d;">
                    <span>🔄 Nuevo:</span>
                    <span class="file-name">${input.files[0].name}</span>
                </div>
            `;
        }
    };

    window.mod_quitarDocUnico = function(docId) {
        modEstadoDocs.unicos[docId].toDelete = true;
        modEstadoDocs.unicos[docId].newFile = null;
        const statusDiv = document.getElementById(`mod_status_${docId}`);
        statusDiv.innerHTML = `
            <div class="file-loaded" style="background: #fde2e2; border-color: #fca5a5; color: #b91c1c;">
                <span>❌ Marcado para eliminar</span>
            </div>
        `;
        const fileInput = document.getElementById(`mod_file_${docId}`);
        if (fileInput) fileInput.value = '';
    };

    window.mod_agregarMultiples = function(docId, max) {
        const input = document.getElementById(`mod_file_${docId}`);
        if (!input || !input.files || input.files.length === 0) return;
        
        const estado = modEstadoDocs.multiples[docId];
        const totalActual = estado.urlsOriginales.length - estado.indicesToDelete.length + estado.newFiles.length;
        const disponibles = max - totalActual;
        
        if (disponibles <= 0) {
            alert(`Máximo ${max} archivos permitidos`);
            return;
        }
        
        let agregados = 0;
        for (const file of input.files) {
            if (agregados >= disponibles) break;
            if (file.type === 'application/pdf') {
                estado.newFiles.push(file);
                agregados++;
            }
        }
        window.mod_actualizarListaMultiples(docId, max);
        input.value = '';
    };

    window.mod_quitarMultipleExistente = function(docId, indexOriginal) {
        modEstadoDocs.multiples[docId].indicesToDelete.push(indexOriginal);
        window.mod_actualizarListaMultiples(docId, docsMultiples.find(d => d.id === docId).max);
    };

    window.mod_quitarMultipleNuevo = function(docId, indexNuevo) {
        modEstadoDocs.multiples[docId].newFiles.splice(indexNuevo, 1);
        window.mod_actualizarListaMultiples(docId, docsMultiples.find(d => d.id === docId).max);
    };

    window.mod_actualizarListaMultiples = function(docId, max) {
        const listDiv = document.getElementById(`mod_list_${docId}`);
        const countDiv = document.getElementById(`mod_count_${docId}`);
        if (!listDiv || !countDiv) return;
        
        const estado = modEstadoDocs.multiples[docId];
        listDiv.innerHTML = '';
        let contador = 0;

        // Mostrar archivos originales no eliminados
        estado.urlsOriginales.forEach((url, idx) => {
            if (!estado.indicesToDelete.includes(idx)) {
                contador++;
                const nombre = url.split('/').pop() || 'Archivo';
                const item = document.createElement('div');
                item.className = 'file-item-multiple';
                item.innerHTML = `
                    <span>📄 ${nombre} (Actual)</span>
                    <button type="button" onclick="window.mod_quitarMultipleExistente('${docId}', ${idx})">❌ Quitar</button>
                `;
                listDiv.appendChild(item);
            }
        });

        // Mostrar archivos nuevos
        estado.newFiles.forEach((file, idx) => {
            contador++;
            const item = document.createElement('div');
            item.className = 'file-item-multiple';
            item.style.background = '#dcfce7';
            item.style.borderColor = '#86efac';
            item.innerHTML = `
                <span>🆕 ${file.name} (Nuevo)</span>
                <button type="button" onclick="window.mod_quitarMultipleNuevo('${docId}', ${idx})">❌ Quitar</button>
            `;
            listDiv.appendChild(item);
        });

        countDiv.textContent = `${contador} de ${max} archivos`;
    };

    // ==========================================
    // LÓGICA DE BÚSQUEDA Y CARGA
    // ==========================================
    document.getElementById('mod_btn_buscar')?.addEventListener('click', async () => {
        const cedulaInput = document.getElementById('mod_buscar_cedula').value.trim().toUpperCase().replace(/\s/g, '');
        const msgBusqueda = document.getElementById('mod_msg_busqueda');
        const formContainer = document.getElementById('mod_form_container');

        if (!cedulaInput) {
            msgBusqueda.textContent = '⚠️ Ingrese una cédula para buscar.';
            msgBusqueda.className = 'msg error';
            msgBusqueda.style.display = 'block';
            return;
        }

        msgBusqueda.textContent = '⏳ Buscando...';
        msgBusqueda.className = 'msg';
        msgBusqueda.style.display = 'block';
        formContainer.style.display = 'none';

        try {
            const { data, error } = await window.supabaseClient
                .from('denuncias')
                .select('*')
                .eq('cedula', cedulaInput)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                msgBusqueda.textContent = '❌ No se encontró ninguna denuncia con esa cédula.';
                msgBusqueda.className = 'msg error';
                return;
            }

            // Cargar datos en el formulario
            document.getElementById('mod_denuncia_id').value = data.id;
            document.getElementById('mod_numero_denuncia').value = data.numero_denuncia || 'N/A';
            document.getElementById('mod_fecha_hora').value = data.fecha_hora || ''; // Ajustar si el nombre de columna es distinto
            document.getElementById('mod_cedula').value = data.cedula;
            document.getElementById('mod_estacion').value = data.estacion_policial || '';
            document.getElementById('mod_nombre1').value = data.primer_nombre || '';
            document.getElementById('mod_nombre2').value = data.segundo_nombre || '';
            document.getElementById('mod_apellido1').value = data.primer_apellido || '';
            document.getElementById('mod_apellido2').value = data.segundo_apellido || '';
            document.getElementById('mod_tlf_pais').value = data.tlf_pais || '+58';
            document.getElementById('mod_tlf_num').value = data.tlf_numero || '';
            document.getElementById('mod_direccion').value = data.direccion || '';
            document.getElementById('mod_motivo').value = data.motivo_denuncia || '';
            document.getElementById('mod_observaciones').value = data.observaciones || '';

            // Cargar estado de documentos
            inicializarContenedores(); // Resetear estado

            docsUnicos.forEach(doc => {
                const url = data[doc.id];
                if (url) {
                    modEstadoDocs.unicos[doc.id].urlOriginal = url;
                    const statusDiv = document.getElementById(`mod_status_${doc.id}`);
                    const nombre = url.split('/').pop() || 'Archivo';
                    statusDiv.innerHTML = `
                        <div class="file-loaded">
                            <span>📄 Actual:</span>
                            <span class="file-name">${nombre}</span>
                            <button type="button" class="btn-remove" onclick="window.mod_quitarDocUnico('${doc.id}')">❌ Quitar</button>
                        </div>
                    `;
                    // Activar el radio "Sí"
                    const radioSi = document.querySelector(`input[name="mod_doc_${doc.id}"][value="si"]`);
                    if (radioSi) {
                        radioSi.checked = true;
                        window.mod_toggleDocField(doc.id, true);
                    }
                }
            });

            docsMultiples.forEach(doc => {
                const urls = data[doc.id];
                if (Array.isArray(urls) && urls.length > 0) {
                    modEstadoDocs.multiples[doc.id].urlsOriginales = urls;
                    const radioSi = document.querySelector(`input[name="mod_doc_${doc.id}"][value="si"]`);
                    if (radioSi) {
                        radioSi.checked = true;
                        window.mod_toggleDocField(doc.id, true);
                    }
                    window.mod_actualizarListaMultiples(doc.id, doc.max);
                }
            });

            msgBusqueda.textContent = '✅ Denuncia encontrada. Puede editar los campos permitidos.';
            msgBusqueda.className = 'msg success';
            formContainer.style.display = 'block';

        } catch (err) {
            console.error('Error en búsqueda:', err);
            msgBusqueda.textContent = '❌ Error al buscar: ' + err.message;
            msgBusqueda.className = 'msg error';
        }
    });

    // ==========================================
    // ENVÍO DEL FORMULARIO DE EDICIÓN
    // ==========================================
    document.getElementById('form-mod-denuncias')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const btn = form.querySelector('.btn-submit');
        const msg = document.getElementById('mod_msg_form');
        const loading = document.getElementById('mod_loading_overlay');
        const denunciaId = document.getElementById('mod_denuncia_id').value;

        btn.disabled = true;
        btn.textContent = '⏳ Guardando cambios...';
        msg.style.display = 'none';
        loading.classList.add('active');

        try {
            const bucket = window.supabaseClient.storage.from('denuncias_documentos');
            const updateData = {};

            // Procesar documentos únicos
            for (const doc of docsUnicos) {
                const radio = document.querySelector(`input[name="mod_doc_${doc.id}"]:checked`);
                const estado = modEstadoDocs.unicos[doc.id];

                if (radio && radio.value === 'si') {
                    if (estado.newFile) {
                        // Reemplazar: Subir nuevo archivo
                        const ts = Date.now();
                        const path = `mod_${ts}_${doc.id}.pdf`;
                        const { error: uploadError } = await bucket.upload(path, estado.newFile, { contentType: 'application/pdf' });
                        if (uploadError) throw new Error(`Error subiendo ${doc.label}: ${uploadError.message}`);
                        
                        updateData[doc.id] = bucket.getPublicUrl(path).data.publicUrl;

                        // Opcional: Eliminar el archivo antiguo del storage si existe
                        if (estado.urlOriginal) {
                            const oldPath = estado.urlOriginal.split('/denuncias_documentos/')[1];
                            if (oldPath) await bucket.remove([oldPath]).catch(() => {}); // Ignorar errores de borrado
                        }
                    } else if (estado.toDelete) {
                        // Eliminar referencia
                        updateData[doc.id] = null;
                        if (estado.urlOriginal) {
                            const oldPath = estado.urlOriginal.split('/denuncias_documentos/')[1];
                            if (oldPath) await bucket.remove([oldPath]).catch(() => {});
                        }
                    } else {
                        // Mantener original
                        updateData[doc.id] = estado.urlOriginal;
                    }
                } else {
                    updateData[doc.id] = null; // Marcado como "No"
                }
            }

            // Procesar documentos múltiples
            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="mod_doc_${doc.id}"]:checked`);
                const estado = modEstadoDocs.multiples[doc.id];

                if (radio && radio.value === 'si') {
                    const urlsFinales = [];
                    
                    // 1. Agregar archivos originales que NO fueron marcados para eliminar
                    estado.urlsOriginales.forEach((url, idx) => {
                        if (!estado.indicesToDelete.includes(idx)) {
                            urlsFinales.push(url);
                        } else {
                            // Eliminar del storage los que se quitaron
                            const oldPath = url.split('/denuncias_documentos/')[1];
                            if (oldPath) bucket.remove([oldPath]).catch(() => {});
                        }
                    });

                    // 2. Subir archivos nuevos
                    for (const file of estado.newFiles) {
                        const ts = Date.now() + Math.random();
                        const path = `mod_${ts}_${doc.id}.pdf`;
                        const { error: uploadError } = await bucket.upload(path, file, { contentType: 'application/pdf' });
                        if (uploadError) throw new Error(`Error subiendo ${doc.label}: ${uploadError.message}`);
                        urlsFinales.push(bucket.getPublicUrl(path).data.publicUrl);
                    }

                    updateData[doc.id] = urlsFinales.length > 0 ? urlsFinales : null;
                } else {
                    // Marcado como "No", eliminar todo
                    updateData[doc.id] = null;
                    estado.urlsOriginales.forEach(url => {
                        const oldPath = url.split('/denuncias_documentos/')[1];
                        if (oldPath) bucket.remove([oldPath]).catch(() => {});
                    });
                }
            }

            // Datos generales
            updateData.estacion_policial = document.getElementById('mod_estacion').value;
            updateData.primer_nombre = document.getElementById('mod_nombre1').value.trim();
            updateData.segundo_nombre = document.getElementById('mod_nombre2').value.trim() || null;
            updateData.primer_apellido = document.getElementById('mod_apellido1').value.trim();
            updateData.segundo_apellido = document.getElementById('mod_apellido2').value.trim() || null;
            updateData.tlf_pais = document.getElementById('mod_tlf_pais').value || null;
            updateData.tlf_numero = document.getElementById('mod_tlf_num').value.trim().replace(/\D/g, '') || null;
            updateData.direccion = document.getElementById('mod_direccion').value.trim() || null;
            updateData.motivo_denuncia = document.getElementById('mod_motivo').value.trim() || null;
            updateData.observaciones = document.getElementById('mod_observaciones').value.trim() || null;

            // Actualizar en Supabase
            const { error: dbError } = await window.supabaseClient
                .from('denuncias')
                .update(updateData)
                .eq('id', denunciaId);

            if (dbError) throw dbError;

            msg.textContent = '✅ Denuncia actualizada exitosamente.';
            msg.className = 'msg success';
            msg.style.display = 'block';
            
            setTimeout(() => {
                msg.style.display = 'none';
                document.getElementById('mod_form_container').style.display = 'none';
                document.getElementById('mod_buscar_cedula').value = '';
            }, 3000);

        } catch (err) {
            console.error('Error al actualizar:', err);
            msg.textContent = '❌ ' + err.message;
            msg.className = 'msg error';
            msg.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 Guardar Cambios';
            loading.classList.remove('active');
        }
    });

    inicializarContenedores();
    console.log("✅ Módulo mod-denuncias.js inicializado correctamente");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initModDenuncias);
} else {
    window.initModDenuncias();
}
