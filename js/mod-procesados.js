window.initModProcesados = function() {
    console.log("✅ Módulo mod-procesados.js cargado correctamente.");

    // ==========================================
    //  1. LISTA DE DOCUMENTOS
    // ==========================================
    const docsUnicos = [
        { id: 'portada', label: '📑 Portada' },
        { id: 'oficio_remision', label: ' Oficio de Remisión' },
        { id: 'acta_denuncia', label: ' Acta de Denuncia' },
        { id: 'datos_filiatorios', label: ' Datos Filiatorios' },
        { id: 'acta_policial', label: '📋 Acta Policial' },
        { id: 'derechos_imputado', label: '⚖️ Derechos del Imputado' },
        { id: 'evaluacion_medica', label: ' Evaluación Médica' },
        { id: 'identificacion_cedula', label: '🆔 Identificación (Cédula)' },
        { id: 'solicitud_examen_forense', label: '🔬 Solicitud de Examen Forense' },
        { id: 'resultados_examen_forense', label: '🔬 Resultados del Examen Forense' },
        { id: 'asistencia_comdepro', label: ' Asistencia de Comdepro' },
        { id: 'remision_estacionamiento', label: '🚗 Remisión a Estacionamiento' },
        { id: 'planilla_pvr', label: '🚙 Planilla de Revisión de Vehículo (PVR)' },
        { id: 'otros_documentos', label: '📎 Otros Documentos' }
    ];

    const docsMultiples = [
        { id: 'entrevista', label: '🎤 Entrevista', max: 10 },
        { id: 'cadena_custodia', label: '🔗 Cadena de Custodia', max: 10 },
        { id: 'inspecciones_tecnicas', label: '🔍 Inspecciones Técnicas', max: 10 }
    ];

    // ==========================================
    // 🔹 2. REFERENCIAS DOM
    // ==========================================
    const btnBuscar = document.getElementById('proc_mod_btn_buscar');
    const inputBusqueda = document.getElementById('proc_mod_busqueda');
    const selectTipoBusqueda = document.getElementById('proc_mod_tipo_busqueda');
    const msgBusqueda = document.getElementById('proc_mod_msg_busqueda');
    const datosPanel = document.getElementById('proc_mod_datos_panel');
    const datosContenido = document.getElementById('proc_mod_datos_contenido');
    const form = document.getElementById('form-mod-procesados');
    const msgForm = document.getElementById('proc_mod_msg_form');

    let registroActual = null;
    let archivosNuevos = {}; // Archivos PDF nuevos a subir
    let docsMultiplesActuales = {}; // URLs de documentos múltiples actuales
    let docsMultiplesAEliminar = {}; // IDs/URLs a eliminar

    // ==========================================
    // 🔹 3. HELPERS
    // ==========================================
    const mostrarMsg = (el, txt, type) => {
        if (!el) return;
        el.innerHTML = txt;
        el.className = `msg ${type}`;
        el.style.display = 'block';
    };

    const tipoRegistroLabel = (tipo) => {
        const map = {
            'persona': '👤 Persona',
            'moto': '🏍️ Motocicleta',
            'auto': '🚙 Automóvil',
            'vinculado': '🔗 Persona + Vehículo'
        };
        return map[tipo] || tipo;
    };

    const tablaLabel = (tabla) => {
        const map = {
            'registro_personas': 'Registro de Personas',
            'registro_motos': 'Registro de Motocicletas',
            'registro_automoviles': 'Registro de Automóviles',
            'registro_vinculado': 'Registro Vinculado'
        };
        return map[tabla] || tabla;
    };

    // ==========================================
    // 🔹 4. BÚSQUEDA
    // ==========================================
    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const val = inputBusqueda.value.trim();
            if (val.length < 3) {
                return mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 3 caracteres.', 'error');
            }

            mostrarMsg(msgBusqueda, ' Buscando...', 'success');
            btnBuscar.disabled = true;
            form.style.display = 'none';
            datosPanel.style.display = 'none';
            registroActual = null;

            try {
                const tipoBusqueda = selectTipoBusqueda.value;
                let query = window.supabaseClient.from('registro_procesados').select('*');

                if (tipoBusqueda === 'delito') {
                    query = query.ilike('tipo_delito', `%${val}%`);
                } else {
                    query = query.eq('identificador_principal', val.toUpperCase());
                }

                query = query.order('fecha_procesamiento', { ascending: false }).limit(5);

                const { data, error } = await query;

                if (error) throw error;

                if (!data || data.length === 0) {
                    mostrarMsg(msgBusqueda, '❌ No se encontró ningún registro procesado.', 'error');
                } else if (data.length === 1) {
                    mostrarMsg(msgBusqueda, '✅ 1 registro encontrado.', 'success');
                    setTimeout(() => cargarRegistro(data[0]), 300);
                } else {
                    // Mostrar los más recientes y permitir seleccionar
                    let html = '<div style="margin-top: 10px;">';
                    data.forEach((reg, idx) => {
                        const fecha = reg.fecha_procesamiento 
                            ? new Date(reg.fecha_procesamiento).toLocaleDateString('es-VE')
                            : '-';
                        html += `
                            <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px; background: #fff; cursor: pointer;" 
                                 onclick="seleccionarRegistroProcesado(${idx})"
                                 data-reg-idx="${idx}">
                                <div style="font-weight: 600; color: #1e40af;">
                                    ${tipoRegistroLabel(reg.tipo_registro)} - ${reg.tipo_delito || 'Sin delito'}
                                </div>
                                <div style="font-size: 0.85rem; color: #475569; margin-top: 4px;">
                                    🆔 ${reg.identificador_principal} | 📅 ${fecha} |  ${reg.procesado_por || '-'}
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    mostrarMsg(msgBusqueda, `🔎 Se encontraron <strong>${data.length} registros</strong>. Seleccione cuál editar:${html}`, 'success');
                    
                    // Guardar temporalmente para el onclick
                    window._procModResultados = data;
                    window.seleccionarRegistroProcesado = (idx) => {
                        const reg = window._procModResultados[idx];
                        if (reg) cargarRegistro(reg);
                    };
                }
            } catch (err) {
                console.error('Error en búsqueda:', err);
                mostrarMsg(msgBusqueda, '❌ Error al buscar: ' + err.message, 'error');
            } finally {
                btnBuscar.disabled = false;
            }
        });

        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar.click();
            }
        });
    }

    // ==========================================
    // 🔹 5. CARGAR REGISTRO EN FORMULARIO
    // ==========================================
    async function cargarRegistro(data) {
        registroActual = data;
        archivosNuevos = {};
        docsMultiplesActuales = {};
        docsMultiplesAEliminar = {};

        // Mostrar panel de datos actuales
        const fechaProc = data.fecha_procesamiento 
            ? new Date(data.fecha_procesamiento).toLocaleString('es-VE')
            : '-';

        datosContenido.innerHTML = `
            <div class="dato-fila"><span class="dato-label">⚖️ Delito:</span><span class="dato-valor">${data.tipo_delito || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label"> Tipo:</span><span class="dato-valor">${tipoRegistroLabel(data.tipo_registro)}</span></div>
            <div class="dato-fila"><span class="dato-label">🆔 Identificador:</span><span class="dato-valor">${data.identificador_principal || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label"> Procesado:</span><span class="dato-valor">${fechaProc}</span></div>
            <div class="dato-fila"><span class="dato-label">👤 Por:</span><span class="dato-valor">${data.procesado_por || '-'}</span></div>
        `;
        datosPanel.style.display = 'block';

        // Llenar campos del formulario
        document.getElementById('proc_mod_id').value = data.id;
        document.getElementById('proc_mod_tipo_delito').value = data.tipo_delito || '';
        document.getElementById('proc_mod_tabla_origen').value = tablaLabel(data.tabla_origen);
        document.getElementById('proc_mod_registro_id_display').value = data.registro_id || '-';
        document.getElementById('proc_mod_tipo_registro_display').value = tipoRegistroLabel(data.tipo_registro);
        document.getElementById('proc_mod_identificador_display').value = data.identificador_principal || '-';
        document.getElementById('proc_mod_procesado_por').value = data.procesado_por || '-';
        document.getElementById('proc_mod_fecha_display').value = fechaProc;
        document.getElementById('proc_mod_observaciones').value = data.observaciones || '';

        // Renderizar documentos únicos
        renderDocsUnicos(data);

        // Renderizar documentos múltiples
        renderDocsMultiples(data);

        form.style.display = 'block';
        mostrarMsg(msgBusqueda, '✅ Registro cargado. Puede editar los campos resaltados.', 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // 🔹 6. RENDER DOCUMENTOS ÚNICOS
    // ==========================================
    function renderDocsUnicos(data) {
        const container = document.getElementById('docs-unicos-edit-container');
        container.innerHTML = '';

        docsUnicos.forEach(doc => {
            const url = data[doc.id];
            const div = document.createElement('div');
            div.className = 'doc-actual';
            div.innerHTML = `
                <div class="doc-actual-info">
                    <div class="doc-actual-label">${doc.label}</div>
                    ${url 
                        ? `<a href="${url}" target="_blank" class="doc-actual-link">📄 Ver documento actual</a>`
                        : `<span class="doc-actual-link no-doc"> Sin documento</span>`
                    }
                </div>
                <div id="replace-area-${doc.id}" class="replace-area">
                    <input type="file" id="file-replace-${doc.id}" accept=".pdf,application/pdf">
                    <button type="button" class="btn-confirm-replace" onclick="confirmarReemplazo('${doc.id}')">✅ Confirmar</button>
                    <button type="button" class="btn-cancel-replace" onclick="cancelarReemplazo('${doc.id}')">❌ Cancelar</button>
                </div>
                <button type="button" class="btn-replace" id="btn-replace-${doc.id}" onclick="mostrarReemplazo('${doc.id}')">
                    ${url ? '🔄 Reemplazar' : '📤 Subir'}
                </button>
            `;
            container.appendChild(div);
        });
    }

    // Funciones globales para reemplazo
    window.mostrarReemplazo = function(docId) {
        document.getElementById(`replace-area-${docId}`).classList.add('active');
        document.getElementById(`btn-replace-${docId}`).style.display = 'none';
    };

    window.cancelarReemplazo = function(docId) {
        document.getElementById(`replace-area-${docId}`).classList.remove('active');
        document.getElementById(`btn-replace-${docId}`).style.display = 'block';
        const fileInput = document.getElementById(`file-replace-${docId}`);
        if (fileInput) fileInput.value = '';
        delete archivosNuevos[docId];
    };

    window.confirmarReemplazo = function(docId) {
        const fileInput = document.getElementById(`file-replace-${docId}`);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Seleccione un archivo PDF primero.');
            return;
        }
        const file = fileInput.files[0];
        if (file.type !== 'application/pdf') {
            alert('Solo se aceptan archivos PDF.');
            return;
        }
        archivosNuevos[docId] = file;
        document.getElementById(`replace-area-${docId}`).classList.remove('active');
        document.getElementById(`btn-replace-${docId}`).style.display = 'block';
        document.getElementById(`btn-replace-${docId}`).textContent = '✅ Nuevo pendiente de guardar';
        document.getElementById(`btn-replace-${docId}`).style.background = '#059669';
        fileInput.value = '';
    };

    // ==========================================
    // 🔹 7. RENDER DOCUMENTOS MÚLTIPLES
    // ==========================================
    function renderDocsMultiples(data) {
        const container = document.getElementById('docs-multiples-edit-container');
        container.innerHTML = '';

        docsMultiples.forEach(doc => {
            const listaActual = Array.isArray(data[doc.id]) ? data[doc.id] : [];
            docsMultiplesActuales[doc.id] = [...listaActual];
            docsMultiplesAEliminar[doc.id] = [];

            const div = document.createElement('div');
            div.style.marginBottom = '15px';
            
            let html = `<div class="doc-actual-label" style="margin-bottom: 8px; font-size: 0.95rem;">${doc.label} (${listaActual.length}/10)</div>`;
            html += `<div id="list-multiple-${doc.id}">`;
            
            if (listaActual.length === 0) {
                html += `<div style="color: #94a3b8; font-size: 0.85rem; padding: 8px;">Sin documentos cargados</div>`;
            } else {
                listaActual.forEach((url, idx) => {
                    const nombre = url.split('/').pop() || `Documento ${idx + 1}`;
                    html += `
                        <div class="doc-multiple-item" id="doc-mult-${doc.id}-${idx}">
                            <div style="flex: 1;">
                                <a href="${url}" target="_blank">📄 ${nombre}</a>
                            </div>
                            <button type="button" class="btn-remove-doc" onclick="eliminarDocMultiple('${doc.id}', ${idx}, '${url}')">️ Eliminar</button>
                        </div>
                    `;
                });
            }
            
            html += `</div>`;
            html += `<input type="file" id="file-add-${doc.id}" accept=".pdf,application/pdf" multiple style="margin-top: 8px; display: block;">`;
            html += `<button type="button" class="btn-add-more" onclick="agregarDocsMultiples('${doc.id}', ${doc.max})">➕ Agregar más documentos</button>`;
            html += `<div id="status-multiple-${doc.id}" style="font-size: 0.8rem; color: #059669; margin-top: 4px;"></div>`;
            
            div.innerHTML = html;
            container.appendChild(div);
        });
    }

    window.eliminarDocMultiple = function(docId, idx, url) {
        if (!confirm('¿Eliminar este documento de la lista?')) return;
        
        const item = document.getElementById(`doc-mult-${docId}-${idx}`);
        if (item) item.remove();
        
        // Agregar a lista de eliminados
        if (!docsMultiplesAEliminar[docId]) docsMultiplesAEliminar[docId] = [];
        docsMultiplesAEliminar[docId].push(url);
        
        // Quitar de lista actual
        docsMultiplesActuales[docId] = docsMultiplesActuales[docId].filter(u => u !== url);
        
        // Actualizar contador
        actualizarContadorMultiple(docId);
    };

    window.agregarDocsMultiples = function(docId, max) {
        const fileInput = document.getElementById(`file-add-${docId}`);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Seleccione al menos un archivo PDF.');
            return;
        }
        
        const cantidadActual = docsMultiplesActuales[docId].length;
        const nuevos = Array.from(fileInput.files).filter(f => f.type === 'application/pdf');
        const disponibles = max - cantidadActual;
        
        if (disponibles <= 0) {
            alert(`Ya alcanzó el máximo de ${max} documentos.`);
            return;
        }
        
        if (nuevos.length > disponibles) {
            alert(`Solo puede agregar ${disponibles} más. Se tomarán los primeros ${disponibles}.`);
        }
        
        const aAgregar = nuevos.slice(0, disponibles);
        aAgregar.forEach(file => {
            archivosNuevos[`mult_${docId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`] = {
                file: file,
                docId: docId
            };
            // Agregar preview
            const idx = docsMultiplesActuales[docId].length;
            docsMultiplesActuales[docId].push('pendiente_' + idx); // placeholder
            
            const list = document.getElementById(`list-multiple-${docId}`);
            // Remover mensaje "Sin documentos" si existe
            const sinDocs = list.querySelector('div[style*="color: #94a3b8"]');
            if (sinDocs) sinDocs.remove();
            
            const div = document.createElement('div');
            div.className = 'doc-multiple-item';
            div.id = `doc-mult-${docId}-nuevo-${idx}`;
            div.innerHTML = `
                <div style="flex: 1;">
                    <span style="color: #059669; font-weight: 500;">📄 ${file.name} <em>(nuevo, pendiente de guardar)</em></span>
                </div>
                <button type="button" class="btn-remove-doc" onclick="quitarNuevoMultiple('${docId}', '${div.id}')">🗑️ Quitar</button>
            `;
            list.appendChild(div);
        });
        
        fileInput.value = '';
        actualizarContadorMultiple(docId);
        
        const status = document.getElementById(`status-multiple-${docId}`);
        if (status) {
            status.textContent = `✅ ${aAgregar.length} documento(s) nuevo(s) agregado(s). Se guardarán al confirmar.`;
            setTimeout(() => { status.textContent = ''; }, 3000);
        }
    };

    window.quitarNuevoMultiple = function(docId, divId) {
        const div = document.getElementById(divId);
        if (div) div.remove();
        docsMultiplesActuales[docId].pop();
        actualizarContadorMultiple(docId);
    };

    function actualizarContadorMultiple(docId) {
        const label = document.querySelector(`#docs-multiples-edit-container > div:nth-child(${docsMultiples.findIndex(d => d.id === docId) + 1}) .doc-actual-label`);
        if (label) {
            const max = docsMultiples.find(d => d.id === docId).max;
            label.textContent = `${docsMultiples.find(d => d.id === docId).label} (${docsMultiplesActuales[docId].length}/${max})`;
        }
    }

    // ==========================================
    // 🔹 8. ENVÍO DEL FORMULARIO
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!registroActual) {
                return mostrarMsg(msgForm, '❌ No hay registro seleccionado.', 'error');
            }

            const tipoDelito = document.getElementById('proc_mod_tipo_delito').value.trim();
            if (!tipoDelito) {
                return mostrarMsg(msgForm, '❌ El tipo de delito es obligatorio.', 'error');
            }

            const btnSubmit = form.querySelector('.btn-submit');
            btnSubmit.disabled = true;
            btnSubmit.textContent = '⏳ Guardando cambios...';
            msgForm.style.display = 'none';

            try {
                const bucket = window.supabaseClient.storage.from('procesados_documentos');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();

                const dataToUpdate = {
                    tipo_delito: tipoDelito,
                    observaciones: document.getElementById('proc_mod_observaciones').value.trim() || null
                };

                // Subir documentos únicos nuevos
                for (const [docId, file] of Object.entries(archivosNuevos)) {
                    if (file instanceof File) {
                        // Documento único
                        const path = `${uid}/mod_${ts}_${docId}.pdf`;
                        const { error } = await bucket.upload(path, file, { 
                            cacheControl: '3600', 
                            contentType: 'application/pdf' 
                        });
                        if (error) throw new Error(`Error subiendo ${docId}: ${error.message}`);
                        const publicUrl = bucket.getPublicUrl(path).data.publicUrl;
                        dataToUpdate[docId] = publicUrl;
                    }
                }

                // Manejar documentos múltiples nuevos (pendientes)
                const nuevosMultiples = Object.entries(archivosNuevos)
                    .filter(([key, val]) => val && val.docId);
                
                for (const [key, { file, docId }] of nuevosMultiples) {
                    const path = `${uid}/mod_${ts}_${docId}_${Math.random().toString(36).substr(2, 5)}.pdf`;
                    const { error } = await bucket.upload(path, file, { 
                        cacheControl: '3600', 
                        contentType: 'application/pdf' 
                    });
                    if (error) throw new Error(`Error subiendo múltiple ${docId}: ${error.message}`);
                    const publicUrl = bucket.getPublicUrl(path).data.publicUrl;
                    
                    // Reemplazar placeholder con URL real
                    const idx = docsMultiplesActuales[docId].findIndex(u => u.startsWith('pendiente_'));
                    if (idx !== -1) {
                        docsMultiplesActuales[docId][idx] = publicUrl;
                    } else {
                        docsMultiplesActuales[docId].push(publicUrl);
                    }
                }

                // Actualizar arrays de documentos múltiples
                for (const doc of docsMultiples) {
                    // Filtrar placeholders y URLs eliminadas
                    const listaFinal = docsMultiplesActuales[doc.id]
                        .filter(u => !u.startsWith('pendiente_'))
                        .filter(u => !(docsMultiplesAEliminar[doc.id] || []).includes(u));
                    dataToUpdate[doc.id] = listaFinal;
                }

                const { error: updErr } = await window.supabaseClient
                    .from('registro_procesados')
                    .update(dataToUpdate)
                    .eq('id', registroActual.id);

                if (updErr) throw updErr;

                mostrarMsg(msgForm, '✅ Cambios guardados exitosamente.', 'success');
                
                setTimeout(() => {
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    msgForm.style.display = 'none';
                    registroActual = null;
                    archivosNuevos = {};
                    docsMultiplesActuales = {};
                    docsMultiplesAEliminar = {};
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 4000);

            } catch (err) {
                console.error('Error al guardar:', err);
                mostrarMsg(msgForm, ' Error: ' + err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = '💾 Guardar Cambios';
            }
        });
    }

    console.log("✅ Módulo mod-procesados.js inicializado correctamente");
};
