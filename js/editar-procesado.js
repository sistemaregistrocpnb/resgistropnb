window.initRegProcesados = function() {
    console.log("✅ Módulo reg-procesados.js cargado correctamente.");

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

    const archivosMultiples = {};
    docsMultiples.forEach(d => archivosMultiples[d.id] = []);
    let registroSeleccionado = null;

    // ==========================================
    // GENERAR DOCUMENTOS EN DOM
    // ==========================================
    const contenedorUnicos = document.getElementById('docs-unicos-container');
    const contenedorMultiples = document.getElementById('docs-multiples-container');

    if (contenedorUnicos) {
        docsUnicos.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header"><label>${doc.label}</label></div>
                <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" class="file-input-unico">
                <div id="status-${doc.id}" class="file-status-container"></div>
            `;
            contenedorUnicos.appendChild(div);
        });
    }

    if (contenedorMultiples) {
        docsMultiples.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header"><label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Máx ${doc.max})</span></label></div>
                <div class="doc-options">
                    <label><input type="radio" name="doc_${doc.id}" value="no" checked> No</label>
                    <label><input type="radio" name="doc_${doc.id}" value="si"> Sí</label>
                </div>
                <div class="doc-upload-area" id="upload-area-${doc.id}" style="display:none;">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" multiple>
                    <button type="button" class="btn-add-file" onclick="window.agregarMultiple('${doc.id}', this)">➕ Agregar Seleccionados</button>
                    <div class="file-count" id="count-${doc.id}">0 archivos</div>
                    <div class="file-list" id="list-${doc.id}"></div>
                </div>
            `;
            contenedorMultiples.appendChild(div);
        });
    }

    // Activar/desactivar áreas de subida múltiples
    document.querySelectorAll('input[type="radio"][name^="doc_"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const docId = this.name.replace('doc_', '');
            const area = document.getElementById(`upload-area-${docId}`);
            if (area) area.style.display = this.value === 'si' ? 'block' : 'none';
        });
    });

    // ==========================================
    // FUNCIONES GLOBALES DE UI
    // ==========================================
    window.agregarMultiple = function(campo, btn) {
        const input = document.getElementById(`file_${campo}`);
        if (!input.files || input.files.length === 0) return;
        
        if (archivosMultiples[campo].length + input.files.length > docsMultiples.find(d=>d.id===campo).max) {
            alert(`⚠️ Máximo ${docsMultiples.find(d=>d.id===campo).max} archivos permitidos.`);
            input.value = '';
            return;
        }

        for (const file of input.files) {
            if (file.type === 'application/pdf') archivosMultiples[campo].push(file);
        }
        actualizarListaArchivos(campo, docsMultiples.find(d=>d.id===campo).max);
        input.value = '';
    };

    function actualizarListaArchivos(campo, max) {
        const listEl = document.getElementById(`list-${campo}`);
        const countEl = document.getElementById(`count-${campo}`);
        if (listEl && countEl) {
            countEl.textContent = `${archivosMultiples[campo].length}/${max} archivos`;
            listEl.innerHTML = archivosMultiples[campo].map((f, i) => `
                <div class="file-item">📎 ${f.name} 
                    <button type="button" class="btn-remove" onclick="window.eliminarMultiple('${campo}', ${i})">❌</button>
                </div>
            `).join('');
        }
    }

    window.eliminarMultiple = function(campo, index) {
        archivosMultiples[campo].splice(index, 1);
        actualizarListaArchivos(campo, docsMultiples.find(d=>d.id===campo).max);
    };

    // ==========================================
    // OVERLAY Y MENSAJES
    // ==========================================
    const loadingOverlay = document.getElementById('reg-loading-overlay');
    const mostrarOverlay = (msg) => {
        if(loadingOverlay) {
            loadingOverlay.querySelector('.loading-text').innerHTML = `${msg}<br><small>Por favor, no cierre esta ventana.</small>`;
            loadingOverlay.classList.add('active');
        }
    };
    const ocultarOverlay = () => loadingOverlay?.classList.remove('active');

    const mostrarMsg = (el, txt, type) => { if(el) { el.innerHTML = txt; el.className = `msg ${type}`; el.style.display = 'block'; } };
    const ocultarMsg = (el) => { if(el) el.style.display = 'none'; };

    // ==========================================
    // BÚSQUEDA Y SELECCIÓN DE REGISTRO
    // ==========================================
    const btnBuscar = document.getElementById('reg_btn_buscar');
    const inputBusqueda = document.getElementById('reg_busqueda_input');
    const msgBusqueda = document.getElementById('reg_msg_busqueda');
    const datosPanel = document.getElementById('reg-datos-panel');
    const datosContenido = document.getElementById('reg-datos-contenido');
    const form = document.getElementById('form-reg-procesados');
    const msgForm = document.getElementById('reg-msg-form');

    async function buscarEnTodasLasTablas(valor) {
        const val = valor.trim().toUpperCase();
        const resultados = [];
        
        try {
            const { data: personas } = await window.supabaseClient.from('registro_personas').select('*').eq('cedula', val).eq('estatus', 'Verificación');
            if (personas) personas.forEach(r => resultados.push({ origen: 'registro_personas', id: r.id, tipo: '👤 Persona', datos: r }));

            const { data: motos } = await window.supabaseClient.from('registro_motos').select('*').eq('placa', val).eq('estatus', 'Verificación');
            if (motos) motos.forEach(r => resultados.push({ origen: 'registro_motos', id: r.id, tipo: '🏍️ Motocicleta', datos: r }));

            const { data: autos } = await window.supabaseClient.from('registro_automoviles').select('*').eq('placa', val).eq('estatus', 'Verificación');
            if (autos) autos.forEach(r => resultados.push({ origen: 'registro_automoviles', id: r.id, tipo: '🚙 Automóvil', datos: r }));

            const { data: vinculados } = await window.supabaseClient.from('registro_vinculado').select('*').or(`cedula.eq.${val},placa.eq.${val}`).eq('estatus', 'Verificación');
            if (vinculados) vinculados.forEach(r => resultados.push({ origen: 'registro_vinculado', id: r.id, tipo: '🔗 Vinculado', datos: r }));

            if (resultados.length === 0) {
                mostrarMsg(msgBusqueda, '❌ No se encontraron registros con estatus "Verificación".', 'error');
                datosPanel.style.display = 'none';
                form.style.display = 'none';
                return;
            }

            registroSeleccionado = resultados[0]; // Toma el primero encontrado
            renderizarDatosRegistro(registroSeleccionado);
            mostrarMsg(msgBusqueda, '✅ Registro encontrado. Complete los datos y adjunte documentos.', 'success');
            datosPanel.style.display = 'block';
            form.style.display = 'block';

        } catch (err) {
            console.error('❌ Error buscando:', err);
            mostrarMsg(msgBusqueda, '❌ Error de conexión: ' + err.message, 'error');
        }
    }

    function renderizarDatosRegistro(res) {
        const d = res.datos;
        let html = `<div class="dato-fila"><span class="dato-label">🆔 ID Original:</span> <span class="dato-valor">${res.id}</span></div>`;
        
        if (res.origen === 'registro_personas' || res.origen === 'registro_vinculado') {
            html += `<div class="dato-fila"><span class="dato-label">👤 Cédula:</span> <span class="dato-valor">${d.cedula|| '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">📝 Nombre:</span> <span class="dato-valor">${d.primer_nombre|| ''} ${d.primer_apellido|| ''}</span></div>`;
        } else {
            html += `<div class="dato-fila"><span class="dato-label">🚗 Placa:</span> <span class="dato-valor">${d.placa|| '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🏷️ Marca:</span> <span class="dato-valor">${d.marca|| d.marca_vehiculo|| '-'}</span></div>`;
        }
        datosContenido.innerHTML = html;
    }

    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', () => {
            if (inputBusqueda.value.trim().length < 3) return mostrarMsg(msgBusqueda, '⚠️ Mínimo 3 caracteres.', 'error');
            ocultarMsg(msgBusqueda);
            buscarEnTodasLasTablas(inputBusqueda.value);
        });
        inputBusqueda.addEventListener('keypress', e => { if(e.key==='Enter') { e.preventDefault(); btnBuscar.click(); } });
    }

    // ==========================================
    // ENVÍO DEL FORMULARIO (CORREGIDO)
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!registroSeleccionado) return mostrarMsg(msgForm, '❌ Debe buscar y seleccionar un registro primero.', 'error');

            const tipoDelito = document.getElementById('proc_tipo_delito').value.trim();
            if (!tipoDelito) return mostrarMsg(msgForm, '⚠️ El tipo de delito es obligatorio.', 'error');

            // Validar docs múltiples mínimos
            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si' && archivosMultiples[doc.id].length < doc.min) {
                    return mostrarMsg(msgForm, `❌ Debe subir al menos ${doc.min} PDF para: ${doc.label}`, 'error');
                }
            }

            mostrarOverlay('⏳ Procesando y subiendo documentos...');
            ocultarMsg(msgForm);

            try {
                const bucket = window.supabaseClient.storage.from('procesados_documentos');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();
                const subirPDF = async (campo, file) => {
                    const path = `${uid}/${ts}_${campo}.pdf`;
                    const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                    if (error) throw new Error(`Error subiendo ${campo}: ${error.message}`);
                    return bucket.getPublicUrl(path).data.publicUrl;
                };
                const subirPDFsMultiples = async (campo) => {
                    const urls = [];
                    for (let i = 0; i < archivosMultiples[campo].length; i++) {
                        const file = archivosMultiples[campo][i];
                        const path = `${uid}/${ts}_${campo}_${i}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${campo}[${i}]: ${error.message}`);
                        urls.push(bucket.getPublicUrl(path).data.publicUrl);
                    }
                    return urls;
                };

                // 1. Subir Documentos Únicos
                const dataToInsert = {
                    tabla_origen: registroSeleccionado.origen,
                    registro_id: registroSeleccionado.id,
                    tipo_registro: registroSeleccionado.tipo || '',
                    identificador_principal: document.getElementById('proc_identificador').value,
                    tipo_delito: tipoDelito,
                    observaciones: document.getElementById('proc_observaciones').value.trim(),
                    datos_originales: registroSeleccionado.datos // Guarda datos originales completos
                };

                for (const doc of docsUnicos) {
                    const fileInput = document.getElementById(`file_${doc.id}`);
                    if (fileInput && fileInput.files[0]) {
                        dataToInsert[doc.id] = await subirPDF(doc.id, fileInput.files[0]);
                    } else {
                        dataToInsert[doc.id] = null; // O [] si la BD lo requiere
                    }
                }

                // 2. Subir Documentos Múltiples (Incluye entrevista_multi)
                const docsMultiplesAdicionales = {};
                for (const doc of docsMultiples) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si' && archivosMultiples[doc.id].length > 0) {
                        const urls = await subirPDFsMultiples(doc.id);
                        
                        // ✅ GUARDAR ENTREVISTA_MULTI EN EL JSON ANIDADO
                        if (doc.id === 'entrevista_multi') {
                            if (!dataToInsert.datos_originales.documentos_multiples_adicionales) {
                                dataToInsert.datos_originales.documentos_multiples_adicionales = {};
                            }
                            dataToInsert.datos_originales.documentos_multiples_adicionales.entrevista_multi = urls;
                        } else {
                            // Cadena de custodia e inspecciones van en columnas directas
                            dataToInsert[doc.id] = urls;
                        }
                    } else {
                        if (doc.id === 'entrevista_multi') {
                            if (!dataToInsert.datos_originales.documentos_multiples_adicionales) dataToInsert.datos_originales.documentos_multiples_adicionales = {};
                            dataToInsert.datos_originales.documentos_multiples_adicionales.entrevista_multi = [];
                        } else {
                            dataToInsert[doc.id] = [];
                        }
                    }
                }

                // 3. Insertar en registro_procesados
                const { error: insErr } = await window.supabaseClient.from('registro_procesados').insert([dataToInsert]);
                if (insErr) throw new Error(`Error al registrar procesado: ${insErr.message}`);

                // 4. Actualizar estatus del origen
                await window.supabaseClient.from(registroSeleccionado.origen).update({ estatus: 'Procesado' }).eq('id', registroSeleccionado.id);

                // 5. ✅ REGISTRAR LOG
                const logDetalles = { tipo: registroSeleccionado.tipo };
                if (registroSeleccionado.origen === 'registro_personas') {
                    logDetalles.cedula = registroSeleccionado.datos.cedula || 'N/A';
                    logDetalles.nombre = `${registroSeleccionado.datos.primer_nombre|| ''} ${registroSeleccionado.datos.primer_apellido|| ''}`.trim();
                } else {
                    logDetalles.placa = registroSeleccionado.datos.placa || 'N/A';
                }
                if (typeof window.registrarLog === 'function') {
                    await window.registrarLog('PROCESAR', 'PROCESADOS', logDetalles, registroSeleccionado.id);
                }

                ocultarOverlay();
                mostrarMsg(msgForm, '✅ Procesado registrado exitosamente. El estatus cambió a "Procesado".', 'success');

                setTimeout(() => {
                    form.reset();
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    registroSeleccionado = null;
                    docsMultiples.forEach(d => {
                        archivosMultiples[d.id] = [];
                        actualizarListaArchivos(d.id, d.max);
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 5000);

            } catch (err) {
                ocultarOverlay();
                console.error('❌ Error:', err);
                mostrarMsg(msgForm, '❌ Error: ' + err.message, 'error');
            }
        });
    }

    console.log("✅ Módulo reg-procesados.js inicializado correctamente.");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initRegProcesados);
} else {
    window.initRegProcesados();
}
