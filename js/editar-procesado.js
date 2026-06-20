// 🔍 DIAGNÓSTICO INICIAL
console.log("🔍 [editar-procesado.js] Archivo cargado - Iniciando diagnóstico...");
console.log("🔍 window.supabaseClient existe:", typeof window.supabaseClient !== 'undefined');

window.initEditarProcesado = function() {
    console.log("🚀 [editar-procesado] Módulo initEditarProcesado ejecutándose...");

    const docsUnicos = [
        { id: 'portada', label: '📑 Portada' },
        { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
        { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
        { id: 'datos_filiatorios', label: '👤 Datos Filiatorios' },
        { id: 'acta_policial', label: '📋 Acta Policial' },
        { id: 'derechos_imputado', label: '⚖️ Derechos del Imputado' },
        { id: 'evaluacion_medica', label: '🏥 Evaluación Médica' },
        { id: 'identificacion_cedula', label: '🆔 Identificación (Cédula)' },
        { id: 'solicitud_examen_forense', label: '🔬 Solicitud de Examen Forense' },
        { id: 'resultados_examen_forense', label: '🔬 Resultados del Examen Forense' },
        { id: 'asistencia_comdepro', label: '🤝 Asistencia de Comdepro' },
        { id: 'remision_estacionamiento', label: '🚗 Remisión a Estacionamiento' },
        { id: 'planilla_pvr', label: '🚙 Planilla PVR' },
        { id: 'otros_documentos', label: '📎 Otros Documentos' }
    ];

    const docsMultiples = [
        { id: 'entrevista', label: '🎤 Entrevistas', max: 10 },
        { id: 'cadena_custodia', label: '⛓️ Cadena de Custodia', max: 10 },
        { id: 'inspecciones_tecnicas', label: '🔧 Inspecciones Técnicas', max: 10 }
    ];

    let procesadoActual = null;
    const archivosActuales = {};
    const archivosNuevos = {};
    const archivosAEliminar = {};
    const archivosMultiplesNuevos = {};
    const archivosMultiplesEliminados = {};

    docsUnicos.forEach(d => {
        archivosActuales[d.id] = null;
        archivosNuevos[d.id] = null;
        archivosAEliminar[d.id] = false;
    });

    docsMultiples.forEach(d => {
        archivosActuales[d.id] = [];
        archivosMultiplesNuevos[d.id] = [];
        archivosMultiplesEliminados[d.id] = [];
    });

    // 🔍 DIAGNÓSTICO: Verificar elementos DOM
    const btnBuscar = document.getElementById('edit_btn_buscar');
    const inputBusqueda = document.getElementById('edit_busqueda_input');
    const msgBusqueda = document.getElementById('edit_msg_busqueda');
    const datosPanel = document.getElementById('edit-datos-panel');
    const datosContenido = document.getElementById('edit-datos-contenido');
    const form = document.getElementById('form-editar-procesado');
    const msgForm = document.getElementById('edit-msg-form');
    const contenedorUnicos = document.getElementById('edit-docs-unicos-container');
    const contenedorMultiples = document.getElementById('edit-docs-multiples-container');
    const loadingOverlay = document.getElementById('edit-loading-overlay');

    console.log("🔍 Elementos DOM encontrados:");
    console.log("  - btnBuscar:", btnBuscar);
    console.log("  - inputBusqueda:", inputBusqueda);
    console.log("  - msgBusqueda:", msgBusqueda);
    console.log("  - form:", form);

    if (!btnBuscar || !inputBusqueda) {
        console.error('❌ [editar-procesado] No se encontraron los elementos de búsqueda. Verifica el HTML.');
        return;
    }
    console.log('✅ [editar-procesado] Elementos DOM encontrados correctamente');

    const mostrarMsg = (el, txt, type) => {
        if (!el) return;
        el.innerHTML = txt;
        el.className = `msg ${type}`;
        el.style.display = 'block';
    };

    function generarDocsUnicos() {
        if (!contenedorUnicos) return;
        contenedorUnicos.innerHTML = '';
        docsUnicos.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.id = `doc-item-${doc.id}`;
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label}</label>
                </div>
                <div id="current-${doc.id}"></div>
                <div class="doc-upload-area" id="upload-${doc.id}">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" onchange="mostrarNuevoArchivo('${doc.id}', this)">
                    <div id="status-${doc.id}" class="file-status-container"></div>
                </div>
            `;
            contenedorUnicos.appendChild(div);
        });
    }

    function generarDocsMultiples() {
        if (!contenedorMultiples) return;
        contenedorMultiples.innerHTML = '';
        docsMultiples.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.id = `doc-item-${doc.id}`;
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Máximo ${doc.max})</span></label>
                </div>
                <div id="current-list-${doc.id}" style="margin-top: 10px;"></div>
                <div class="doc-upload-area active" id="upload-${doc.id}">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" multiple>
                    <button type="button" class="btn-add-file" onclick="agregarNuevosMultiples('${doc.id}', ${doc.max})">➕ Agregar más archivos</button>
                    <div class="file-count" id="count-${doc.id}">0 archivos nuevos</div>
                    <div class="file-list" id="new-list-${doc.id}"></div>
                </div>
            `;
            contenedorMultiples.appendChild(div);
        });
    }

    generarDocsUnicos();
    generarDocsMultiples();

    window.mostrarNuevoArchivo = function(docId, input) {
        const statusContainer = document.getElementById(`status-${docId}`);
        if (!statusContainer) return;
        if (input.files && input.files[0]) {
            archivosNuevos[docId] = input.files[0];
            archivosAEliminar[docId] = true;
            statusContainer.innerHTML = `
                <div class="file-loaded">
                    <span>🔄</span>
                    <span class="file-name">${input.files[0].name}</span>
                    <button type="button" class="btn-remove" onclick="cancelarNuevo('${docId}')">❌ Cancelar</button>
                </div>
            `;
        }
    };

    window.cancelarNuevo = function(docId) {
        const input = document.getElementById(`file_${docId}`);
        const statusContainer = document.getElementById(`status-${docId}`);
        if (input) input.value = '';
        if (statusContainer) statusContainer.innerHTML = '';
        archivosNuevos[docId] = null;
        archivosAEliminar[docId] = false;
    };

    window.agregarNuevosMultiples = function(campo, max) {
        const input = document.getElementById(`file_${campo}`);
        if (!input || !input.files || input.files.length === 0) return;
        const actuales = archivosActuales[campo].length;
        const nuevos = archivosMultiplesNuevos[campo].length;
        const disponibles = max - actuales - nuevos;
        if (disponibles <= 0) {
            alert(`Máximo ${max} archivos permitidos en total`);
            return;
        }
        let agregados = 0;
        for (const file of input.files) {
            if (agregados >= disponibles) break;
            if (file.type === 'application/pdf') {
                archivosMultiplesNuevos[campo].push(file);
                agregados++;
            }
        }
        actualizarListaNuevos(campo, max);
        input.value = '';
    };

    function actualizarListaNuevos(campo, max) {
        const list = document.getElementById(`new-list-${campo}`);
        const count = document.getElementById(`count-${campo}`);
        if (!list || !count) return;
        list.innerHTML = '';
        archivosMultiplesNuevos[campo].forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item-multiple';
            item.innerHTML = `
                <span>🆕 ${file.name}</span>
                <div class="file-actions">
                    <button type="button" onclick="quitarNuevoMultiple('${campo}', ${index})">❌</button>
                </div>
            `;
            list.appendChild(item);
        });
        count.textContent = `${archivosMultiplesNuevos[campo].length} archivos nuevos por subir`;
    }

    window.quitarNuevoMultiple = function(campo, index) {
        archivosMultiplesNuevos[campo].splice(index, 1);
        actualizarListaNuevos(campo, docsMultiples.find(d => d.id === campo).max);
    };

    window.verArchivo = function(url) {
        window.open(url, '_blank');
    };

    window.reemplazarArchivo = function(docId) {
        const area = document.getElementById(`upload-${docId}`);
        if (area) {
            area.classList.toggle('active');
            const input = document.getElementById(`file_${docId}`);
            if (input) input.click();
        }
    };

    window.eliminarArchivoActual = function(docId) {
        if (!confirm('¿Está seguro de eliminar este archivo? Se borrará permanentemente.')) return;
        archivosAEliminar[docId] = true;
        archivosNuevos[docId] = null;
        const currentDiv = document.getElementById(`current-${docId}`);
        if (currentDiv) currentDiv.innerHTML = '<p style="color: #dc2626; font-size: 0.85rem; margin-top: 10px;">🗑️ Archivo marcado para eliminar (se guardará al actualizar)</p>';
    };

    window.eliminarArchivoMultipleActual = function(campo, index) {
        if (!confirm('¿Está seguro de eliminar este archivo?')) return;
        const url = archivosActuales[campo][index];
        archivosMultiplesEliminados[campo].push(url);
        archivosActuales[campo].splice(index, 1);
        renderizarArchivosMultiplesActuales(campo);
    };

    function renderizarArchivosMultiplesActuales(campo) {
        const listDiv = document.getElementById(`current-list-${campo}`);
        if (!listDiv) return;
        if (archivosActuales[campo].length === 0) {
            listDiv.innerHTML = '<p style="color: #64748b; font-size: 0.85rem;">No hay archivos actuales</p>';
            return;
        }
        listDiv.innerHTML = '';
        archivosActuales[campo].forEach((url, index) => {
            const item = document.createElement('div');
            item.className = 'file-item-multiple';
            item.innerHTML = `
                <span>📄 Archivo ${index + 1}</span>
                <div class="file-actions">
                    <button type="button" class="btn-view" onclick="verArchivo('${url}')">👁️ Ver</button>
                    <button type="button" onclick="eliminarArchivoMultipleActual('${campo}', ${index})">❌</button>
                </div>
            `;
            listDiv.appendChild(item);
        });
    }

    async function cargarProcesado(valor) {
        if (!window.supabaseClient) {
            throw new Error("Supabase no está inicializado");
        }
        
        const val = valor.trim().toUpperCase();
        
        const { data: dataColumnas, error: errColumnas } = await window.supabaseClient
            .from('registro_procesados')
            .select('*')
            .or(`identificador_principal.eq.${val},cedula.eq.${val}`)
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (!errColumnas && dataColumnas && dataColumnas.length > 0) {
            return dataColumnas;
        }
        
        const { data: dataJson, error: errJson } = await window.supabaseClient
            .from('registro_procesados')
            .select('*')
            .or(`datos_originales->>placa.eq.${val},datos_originales->>serial_carroceria.eq.${val},datos_originales->>serial_motor.eq.${val}`)
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (!errJson && dataJson && dataJson.length > 0) {
            return dataJson;
        }
        return [];
    }

    function mostrarDatosProcesado(proc) {
        const data = proc.datos_originales || {};
        let html = '';
        html += `<div class="dato-fila"><span class="dato-label">🆔 ID Procesado:</span><span class="dato-valor">${proc.id}</span></div>`;
        html += `<div class="dato-fila"><span class="dato-label">📋 Tabla Origen:</span><span class="dato-valor">${proc.tabla_origen}</span></div>`;
        html += `<div class="dato-fila"><span class="dato-label">🔍 Identificador:</span><span class="dato-valor">${proc.identificador_principal || '-'}</span></div>`;
        if (data.cedula) html += `<div class="dato-fila"><span class="dato-label">👤 Cédula:</span><span class="dato-valor">${data.cedula}</span></div>`;
        if (data.primer_nombre) {
            const nombre = `${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}`.trim();
            html += `<div class="dato-fila"><span class="dato-label">👤 Nombre:</span><span class="dato-valor">${nombre}</span></div>`;
        }
        if (data.placa) html += `<div class="dato-fila"><span class="dato-label">🚗 Placa:</span><span class="dato-valor">${data.placa}</span></div>`;
        html += `<div class="dato-fila"><span class="dato-label">⚖️ Tipo Delito:</span><span class="dato-valor">${proc.tipo_delito || '-'}</span></div>`;
        html += `<div class="dato-fila"><span class="dato-label">📅 Fecha:</span><span class="dato-valor">${new Date(proc.created_at).toLocaleString()}</span></div>`;
        datosContenido.innerHTML = html;
        datosPanel.style.display = 'block';
    }

    function cargarArchivosEnForm(proc) {
        docsUnicos.forEach(d => {
            archivosActuales[d.id] = null;
            archivosNuevos[d.id] = null;
            archivosAEliminar[d.id] = false;
        });
        docsMultiples.forEach(d => {
            archivosActuales[d.id] = [];
            archivosMultiplesNuevos[d.id] = [];
            archivosMultiplesEliminados[d.id] = [];
        });
        document.getElementById('edit_procesado_id').value = proc.id;
        document.getElementById('edit_tabla_origen').value = proc.tabla_origen;
        document.getElementById('edit_registro_id').value = proc.registro_id;
        document.getElementById('edit_tipo_delito').value = proc.tipo_delito || '';
        document.getElementById('edit_observaciones').value = proc.observaciones || '';
        docsUnicos.forEach(doc => {
            const currentDiv = document.getElementById(`current-${doc.id}`);
            const url = proc[doc.id];
            if (url) {
                archivosActuales[doc.id] = url;
                const fileName = url.split('/').pop();
                currentDiv.innerHTML = `
                    <div class="doc-current">
                        <div class="file-info">
                            <span>📄</span>
                            <span>${fileName}</span>
                        </div>
                        <div class="actions">
                            <button type="button" class="btn-view" onclick="verArchivo('${url}')">👁️ Ver</button>
                            <button type="button" class="btn-replace" onclick="reemplazarArchivo('${doc.id}')">🔄 Reemplazar</button>
                            <button type="button" class="btn-delete" onclick="eliminarArchivoActual('${doc.id}')">🗑️ Eliminar</button>
                        </div>
                    </div>
                `;
            } else {
                currentDiv.innerHTML = '<p style="color: #64748b; font-size: 0.85rem; margin-top: 10px;">Sin archivo</p>';
            }
        });
        docsMultiples.forEach(doc => {
            const urls = proc[doc.id] || [];
            archivosActuales[doc.id] = Array.isArray(urls) ? urls : [];
            renderizarArchivosMultiplesActuales(doc.id);
            actualizarListaNuevos(doc.id, doc.max);
        });
    }

    // 🔹 LISTENER DEL BOTÓN BUSCAR
    console.log("🔍 Registrando listener del botón buscar...");
    btnBuscar.addEventListener('click', async () => {
        console.log('🖱️ [editar-procesado] Click en botón buscar detectado');
        const val = inputBusqueda.value.trim();
        if (val.length < 3) {
            return mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 3 caracteres.', 'error');
        }
        console.log('🔍 Buscando:', val);
        mostrarMsg(msgBusqueda, '🔍 Buscando procesado...', 'success');
        btnBuscar.disabled = true;
        form.style.display = 'none';
        datosPanel.style.display = 'none';
        try {
            const resultados = await cargarProcesado(val);
            console.log('📊 Resultados encontrados:', resultados.length);
            if (resultados.length === 0) {
                mostrarMsg(msgBusqueda, '❌ No se encontró ningún procesado con ese dato.', 'error');
            } else {
                procesadoActual = resultados[0];
                mostrarMsg(msgBusqueda, `✅ ${resultados.length} procesado(s) encontrado(s). Mostrando el más reciente.`, 'success');
                mostrarDatosProcesado(procesadoActual);
                cargarArchivosEnForm(procesadoActual);
                form.style.display = 'block';
                window.scrollTo({ top: datosPanel.offsetTop - 20, behavior: 'smooth' });
            }
        } catch (err) {
            console.error('❌ Error al buscar:', err);
            mostrarMsg(msgBusqueda, '❌ Error de conexión: ' + err.message, 'error');
        } finally {
            btnBuscar.disabled = false;
        }
    });
    console.log("✅ Listener del botón buscar registrado");

    inputBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnBuscar.click();
        }
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!procesadoActual) {
                return mostrarMsg(msgForm, '❌ Debe buscar un procesado primero.', 'error');
            }
            const tipoDelito = document.getElementById('edit_tipo_delito').value.trim();
            if (!tipoDelito) {
                return mostrarMsg(msgForm, '⚠️ El tipo de delito es obligatorio.', 'error');
            }
            if (loadingOverlay) loadingOverlay.classList.add('active');
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
                    observaciones: document.getElementById('edit_observaciones').value.trim() || null
                };
                for (const doc of docsUnicos) {
                    const urlActual = archivosActuales[doc.id];
                    const archivoNuevo = archivosNuevos[doc.id];
                    const marcadoEliminar = archivosAEliminar[doc.id];
                    if (archivoNuevo) {
                        const path = `${uid}/${ts}_${doc.id}.pdf`;
                        const { error } = await bucket.upload(path, archivoNuevo, { contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${doc.id}: ${error.message}`);
                        const newUrl = bucket.getPublicUrl(path).data.publicUrl;
                        dataToUpdate[doc.id] = newUrl;
                        if (urlActual) {
                            const oldPath = urlActual.split('/procesados_documentos/')[1];
                            if (oldPath) await bucket.remove([oldPath]);
                        }
                    } else if (marcadoEliminar) {
                        dataToUpdate[doc.id] = null;
                        if (urlActual) {
                            const oldPath = urlActual.split('/procesados_documentos/')[1];
                            if (oldPath) await bucket.remove([oldPath]);
                        }
                    }
                }
                for (const doc of docsMultiples) {
                    const urlsActuales = archivosActuales[doc.id] || [];
                    const archivosNuevosCampo = archivosMultiplesNuevos[doc.id] || [];
                    const urlsEliminadas = archivosMultiplesEliminados[doc.id] || [];
                    if (archivosNuevosCampo.length > 0 || urlsEliminadas.length > 0) {
                        const nuevasUrls = [];
                        for (let i = 0; i < archivosNuevosCampo.length; i++) {
                            const path = `${uid}/${ts}_${doc.id}_${Date.now()}_${i}.pdf`;
                            const { error } = await bucket.upload(path, archivosNuevosCampo[i], { contentType: 'application/pdf' });
                            if (error) throw new Error(`Error subiendo ${doc.id}[${i}]: ${error.message}`);
                            nuevasUrls.push(bucket.getPublicUrl(path).data.publicUrl);
                        }
                        for (const oldUrl of urlsEliminadas) {
                            const oldPath = oldUrl.split('/procesados_documentos/')[1];
                            if (oldPath) await bucket.remove([oldPath]);
                        }
                        const finales = [...urlsActuales, ...nuevasUrls];
                        dataToUpdate[doc.id] = finales;
                    }
                }
                const datosOriginales = procesadoActual.datos_originales || {};
                if (datosOriginales.documentos_adjuntos) {
                    for (const doc of docsUnicos) {
                        if (dataToUpdate[doc.id] !== undefined) {
                            datosOriginales.documentos_adjuntos[doc.id] = dataToUpdate[doc.id];
                        }
                    }
                    for (const doc of docsMultiples) {
                        if (dataToUpdate[doc.id] !== undefined) {
                            datosOriginales.documentos_adjuntos[doc.id] = dataToUpdate[doc.id];
                        }
                    }
                    dataToUpdate.datos_originales = datosOriginales;
                }
                const { error: updErr } = await window.supabaseClient
                    .from('registro_procesados')
                    .update(dataToUpdate)
                    .eq('id', procesadoActual.id);
                if (updErr) throw new Error(`Error al actualizar: ${updErr.message}`);

                // 🔹 LOG CENTRALIZADO USANDO UTILS.JS
                if (typeof window.registrarLog === 'function' && procesadoActual?.id) {
                    await window.registrarLog(
                        'MODIFICAR',
                        'PROCESADOS',
                        {
                            identificador: procesadoActual.identificador_principal,
                            tipo_registro: procesadoActual.tipo_registro || 'Procesado',
                            tipo: 'Procesado',
                            cedula: datosOriginales.cedula || 'N/A',
                            nombre_completo: datosOriginales.primer_nombre ? `${datosOriginales.primer_nombre} ${datosOriginales.primer_apellido}`.trim() : 'N/A',
                            placa: datosOriginales.placa || 'N/A',
                            marca: datosOriginales.marca || datosOriginales.marca_vehiculo || 'N/A',
                            modelo: datosOriginales.modelo || datosOriginales.modelo_vehiculo || 'N/A',
                            anio: datosOriginales.anio || datosOriginales.anio_vehiculo || 'N/A',
                            color: datosOriginales.color || datosOriginales.color_vehiculo || 'N/A',
                            tipo_vehiculo: datosOriginales.tipo_vehiculo || 'N/A',
                            tipo_delito: tipoDelito,
                            estatus: 'Procesado',
                            estacion: datosOriginales.estacion_policial || 'N/A',
                            direccion_detencion: datosOriginales.direccion_detencion || 'N/A',
                            observaciones: document.getElementById('edit_observaciones').value.trim() || null,
                            cambios_realizados: 'Datos del registro procesado actualizados'
                        },
                        procesadoActual.id
                    );
                    console.log('✅ Log de modificación de procesado registrado exitosamente');
                }

                mostrarMsg(msgForm, '✅ Cambios guardados exitosamente.', 'success');
                setTimeout(() => {
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    procesadoActual = null;
                    form.reset();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 3000);
            } catch (err) {
                console.error('❌ Error al guardar:', err);
                mostrarMsg(msgForm, '❌ Error: ' + err.message, 'error');
            } finally {
                if (loadingOverlay) loadingOverlay.classList.remove('active');
                btnSubmit.disabled = false;
                btnSubmit.textContent = '💾 Guardar Cambios';
            }
        });
    }

    console.log("✅ [editar-procesado] Módulo inicializado correctamente.");
};
