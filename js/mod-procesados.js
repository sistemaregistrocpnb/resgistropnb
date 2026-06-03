window.initModProcesados = function() {
    console.log("✅ Módulo mod-procesados.js cargado correctamente.");

    const docsUnicos = [
        { id: 'portada', label: '📑 Portada' },
        { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
        { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
        { id: 'entrevista', label: '🎤 Entrevista' },
        { id: 'datos_filiatorios', label: ' Datos Filiatorios' },
        { id: 'acta_policial', label: '📋 Acta Policial' },
        { id: 'derechos_imputado', label: '⚖️ Derechos del Imputado' },
        { id: 'evaluacion_medica', label: '🏥 Evaluación Médica' },
        { id: 'identificacion_cedula', label: '🆔 Identificación (Cédula)' },
        { id: 'solicitud_examen_forense', label: '🔬 Solicitud de Examen Forense' },
        { id: 'resultados_examen_forense', label: '🔬 Resultados del Examen Forense' },
        { id: 'asistencia_comdepro', label: '👶 Asistencia de Comdepro' },
        { id: 'remision_estacionamiento', label: ' Remisión a Estacionamiento' },
        { id: 'planilla_pvr', label: '🚙 Planilla de Revisión de Vehículo (PVR)' },
        { id: 'otros_documentos', label: '📎 Otros Documentos' }
    ];

    const docsMultiples = [
        { id: 'entrevista_multi', label: '🎤 Entrevistas (Múltiples)', max: 10 },
        { id: 'cadena_custodia', label: '🔗 Cadena de Custodia', max: 10 },
        { id: 'inspecciones_tecnicas', label: '🔍 Inspecciones Técnicas', max: 10 }
    ];

    const btnBuscar = document.getElementById('proc_mod_btn_buscar');
    const inputBusqueda = document.getElementById('proc_mod_busqueda');
    const msgBusqueda = document.getElementById('proc_mod_msg_busqueda');
    const datosPanel = document.getElementById('proc_mod_datos_panel');
    const datosContenido = document.getElementById('proc_mod_datos_contenido');
    const form = document.getElementById('form-mod-procesados');
    const msgForm = document.getElementById('proc_mod_msg_form');

    let registroActual = null;
    let docsUnicosActuales = {};
    let docsMultiplesActuales = {};
    let docsUnicosAEliminar = {};
    let archivosNuevosMultiples = {};

    const mostrarMsg = (el, txt, type) => {
        if (!el) return;
        el.innerHTML = txt;
        el.className = `msg ${type}`;
        el.style.display = 'block';
    };

    const tipoRegistroLabel = (tipo) => {
        const map = { 'persona': '👤 Persona', 'moto': '️ Motocicleta', 'auto': ' Automóvil', 'vinculado': ' Persona + Vehículo' };
        return map[tipo] || tipo;
    };

    const tablaLabel = (tabla) => {
        const map = { 'registro_personas': 'Registro de Personas', 'registro_motos': 'Registro de Motocicletas', 'registro_automoviles': 'Registro de Automóviles', 'registro_vinculado': 'Registro Vinculado' };
        return map[tabla] || tabla;
    };

    // ==========================================
    // GENERAR CONTENEDORES DE DOCUMENTOS
    // ==========================================
    const contenedorUnicos = document.getElementById('docs-unicos-edit-container');
    if (contenedorUnicos) {
        docsUnicos.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-actual';
            div.id = `doc-unico-${doc.id}`;
            div.innerHTML = `
                <div class="doc-actual-info">
                    <div class="doc-actual-label">${doc.label}</div>
                    <div id="doc-link-${doc.id}"><span class="doc-actual-link no-doc">Cargando...</span></div>
                </div>
                <div class="replace-area" id="replace-area-${doc.id}">
                    <input type="file" id="file-replace-${doc.id}" accept=".pdf,application/pdf">
                    <button type="button" class="btn-confirm-replace" onclick="confirmarReemplazo('${doc.id}')">✅ Confirmar</button>
                    <button type="button" class="btn-cancel-replace" onclick="cancelarReemplazo('${doc.id}')">❌ Cancelar</button>
                </div>
                <button type="button" class="btn-replace" id="btn-replace-${doc.id}" onclick="mostrarReemplazo('${doc.id}')">🔄 Reemplazar</button>
            `;
            contenedorUnicos.appendChild(div);
        });
    }

    const contenedorMultiples = document.getElementById('docs-multiples-edit-container');
    if (contenedorMultiples) {
        docsMultiples.forEach(doc => {
            const div = document.createElement('div');
            div.id = `doc-multiple-${doc.id}`;
            div.style.marginBottom = '15px';
            div.innerHTML = `
                <div class="doc-actual-label" style="margin-bottom: 8px; font-size: 0.95rem;">${doc.label}</div>
                <div id="list-multiple-${doc.id}"></div>
                <input type="file" id="file-add-${doc.id}" accept=".pdf,application/pdf" multiple style="margin-top: 8px; display: block;">
                <button type="button" class="btn-add-more" onclick="agregarDocsMultiples('${doc.id}', ${doc.max})">➕ Agregar más documentos</button>
                <div id="status-multiple-${doc.id}" style="font-size: 0.8rem; color: #059669; margin-top: 4px;"></div>
            `;
            contenedorMultiples.appendChild(div);
        });
    }

    // ==========================================
    // FUNCIONES GLOBALES
    // ==========================================
    window.mostrarReemplazo = function(docId) {
        document.getElementById(`replace-area-${docId}`).classList.add('active');
        document.getElementById(`btn-replace-${docId}`).style.display = 'none';
    };

    window.cancelarReemplazo = function(docId) {
        document.getElementById(`replace-area-${docId}`).classList.remove('active');
        document.getElementById(`btn-replace-${docId}`).style.display = 'block';
        const fileInput = document.getElementById(`file-replace-${docId}`);
        if (fileInput) fileInput.value = '';
        delete archivosNuevosMultiples[docId];
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
        archivosNuevosMultiples[docId] = file;
        document.getElementById(`replace-area-${docId}`).classList.remove('active');
        document.getElementById(`btn-replace-${docId}`).style.display = 'block';
        document.getElementById(`btn-replace-${docId}`).textContent = '✅ Nuevo pendiente';
        document.getElementById(`btn-replace-${docId}`).style.background = '#059669';
        fileInput.value = '';
    };

    window.agregarDocsMultiples = function(docId, max) {
        const fileInput = document.getElementById(`file-add-${docId}`);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Seleccione al menos un archivo PDF.');
            return;
        }
        const listaActual = docsMultiplesActuales[docId] || [];
        const nuevos = Array.from(fileInput.files).filter(f => f.type === 'application/pdf');
        const disponibles = max - listaActual.length;
        if (disponibles <= 0) {
            alert(`Ya alcanzó el máximo de ${max} documentos.`);
            return;
        }
        const aAgregar = nuevos.slice(0, disponibles);
        if (nuevos.length > disponibles) {
            alert(`Solo puede agregar ${disponibles} más.`);
        }
        if (!archivosNuevosMultiples[`multi_${docId}`]) archivosNuevosMultiples[`multi_${docId}`] = [];
        aAgregar.forEach(file => archivosNuevosMultiples[`multi_${docId}`].push(file));
        fileInput.value = '';
        const list = document.getElementById(`list-multiple-${docId}`);
        const sinDocs = list.querySelector('div[style*="color: #94a3b8"]');
        if (sinDocs) sinDocs.remove();
        aAgregar.forEach((file, i) => {
            const idx = listaActual.length + i;
            const div = document.createElement('div');
            div.className = 'doc-multiple-item';
            div.id = `doc-mult-new-${docId}-${idx}`;
            div.innerHTML = `
                <div style="flex: 1;"><span style="color: #059669; font-weight: 500;">📄 ${file.name} <em>(nuevo, pendiente de guardar)</em></span></div>
                <button type="button" class="btn-remove-doc" onclick="this.parentElement.remove()">🗑️ Quitar</button>
            `;
            list.appendChild(div);
        });
        const status = document.getElementById(`status-multiple-${docId}`);
        if (status) {
            status.textContent = `✅ ${aAgregar.length} documento(s) agregado(s)`;
            setTimeout(() => { if (status) status.textContent = ''; }, 3000);
        }
    };

    // ==========================================
    // BÚSQUEDA (SOLO en registro_procesados)
    // ==========================================
    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const val = inputBusqueda.value.trim();
            if (val.length < 3) {
                return mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 3 caracteres.', 'error');
            }
            mostrarMsg(msgBusqueda, '🔍 Buscando...', 'success');
            btnBuscar.disabled = true;
            form.style.display = 'none';
            datosPanel.style.display = 'none';
            registroActual = null;

            try {
                const valUpper = val.toUpperCase();
                let query = window.supabaseClient
                    .from('registro_procesados')
                    .select('*')
                    .order('fecha_procesamiento', { ascending: false })
                    .limit(5);

                // Buscar por cualquiera de los 4 campos
                query = query.or(`identificador_principal.eq.${valUpper},cedula.eq.${valUpper},placa.eq.${valUpper},serial_carroceria.eq.${valUpper},serial_motor.eq.${valUpper}`);

                const { data, error } = await query;
                if (error) throw error;

                if (!data || data.length === 0) {
                    mostrarMsg(msgBusqueda, ' No se encontró ningún registro procesado.', 'error');
                } else if (data.length === 1) {
                    mostrarMsg(msgBusqueda, '✅ 1 registro encontrado.', 'success');
                    setTimeout(() => cargarRegistro(data[0]), 300);
                } else {
                    let html = '<div style="margin-top: 10px;">';
                    data.forEach((reg, idx) => {
                        const fecha = reg.fecha_procesamiento ? new Date(reg.fecha_procesamiento).toLocaleDateString('es-VE') : '-';
                        html += `
                            <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px; background: #fff; cursor: pointer;" 
                                 onclick="window.seleccionarRegistroMod(${idx})">
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
                    mostrarMsg(msgBusqueda, ` Se encontraron <strong>${data.length} registros</strong>. Seleccione cuál editar:${html}`, 'success');
                    window._procModResultados = data;
                    window.seleccionarRegistroMod = (idx) => {
                        const reg = window._procModResultados[idx];
                        if (reg) cargarRegistro(reg);
                    };
                }
            } catch (err) {
                console.error('Error en búsqueda:', err);
                mostrarMsg(msgBusqueda, '❌ Error: ' + err.message, 'error');
            } finally {
                btnBuscar.disabled = false;
            }
        });
        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnBuscar.click(); }
        });
    }

    // ==========================================
    // CARGAR REGISTRO EN FORMULARIO
    // ==========================================
    async function cargarRegistro(data) {
        registroActual = data;
        docsUnicosActuales = {};
        docsMultiplesActuales = {};
        docsUnicosAEliminar = {};
        archivosNuevosMultiples = {};

        const fechaProc = data.fecha_procesamiento ? new Date(data.fecha_procesamiento).toLocaleString('es-VE') : '-';

        // Mostrar datos actuales
        let htmlDatos = '';
        htmlDatos += `<div class="dato-fila"><span class="dato-label">⚖️ Delito:</span><span class="dato-valor">${data.tipo_delito || '-'}</span></div>`;
        htmlDatos += `<div class="dato-fila"><span class="dato-label"> Tipo:</span><span class="dato-valor">${tipoRegistroLabel(data.tipo_registro)}</span></div>`;
        htmlDatos += `<div class="dato-fila"><span class="dato-label"> Identificador:</span><span class="dato-valor">${data.identificador_principal || '-'}</span></div>`;
        htmlDatos += `<div class="dato-fila"><span class="dato-label">📅 Procesado:</span><span class="dato-valor">${fechaProc}</span></div>`;
        htmlDatos += `<div class="dato-fila"><span class="dato-label">👤 Por:</span><span class="dato-valor">${data.procesado_por || '-'}</span></div>`;
        
        if (data.cedula) htmlDatos += `<div class="dato-fila"><span class="dato-label">🆔 Cédula:</span><span class="dato-valor">${data.cedula}</span></div>`;
        if (data.placa) htmlDatos += `<div class="dato-fila"><span class="dato-label">🔢 Placa:</span><span class="dato-valor">${data.placa}</span></div>`;
        if (data.serial_carroceria) htmlDatos += `<div class="dato-fila"><span class="dato-label">🔢 Serial Carrocería:</span><span class="dato-valor">${data.serial_carroceria}</span></div>`;
        if (data.serial_motor) htmlDatos += `<div class="dato-fila"><span class="dato-label">🔢 Serial Motor:</span><span class="dato-valor">${data.serial_motor}</span></div>`;
        if (data.nombre_completo) htmlDatos += `<div class="dato-fila"><span class="dato-label">👤 Nombre:</span><span class="dato-valor">${data.nombre_completo}</span></div>`;
        if (data.tipo_vehiculo) htmlDatos += `<div class="dato-fila"><span class="dato-label">🚗 Tipo Vehículo:</span><span class="dato-valor">${data.tipo_vehiculo}</span></div>`;
        if (data.marca || data.marca_vehiculo) htmlDatos += `<div class="dato-fila"><span class="dato-label">🏭 Marca:</span><span class="dato-valor">${data.marca || data.marca_vehiculo}</span></div>`;

        datosContenido.innerHTML = htmlDatos;
        datosPanel.style.display = 'block';

        // Llenar campos
        document.getElementById('proc_mod_id').value = data.id;
        document.getElementById('proc_mod_tipo_delito').value = data.tipo_delito || '';
        document.getElementById('proc_mod_tabla_origen').value = tablaLabel(data.tabla_origen);
        document.getElementById('proc_mod_registro_id_display').value = data.registro_id || '-';
        document.getElementById('proc_mod_tipo_registro_display').value = tipoRegistroLabel(data.tipo_registro);
        document.getElementById('proc_mod_identificador_display').value = data.identificador_principal || '-';
        document.getElementById('proc_mod_procesado_por').value = data.procesado_por || '-';
        document.getElementById('proc_mod_fecha_display').value = fechaProc;
        document.getElementById('proc_mod_observaciones').value = data.observaciones || '';

        // Documentos únicos
        docsUnicos.forEach(doc => {
            const url = data[doc.id];
            const linkDiv = document.getElementById(`doc-link-${doc.id}`);
            if (url) {
                linkDiv.innerHTML = `<a href="${url}" target="_blank" class="doc-actual-link">📄 Ver documento</a>`;
                docsUnicosActuales[doc.id] = url;
            } else {
                linkDiv.innerHTML = `<span class="doc-actual-link no-doc">Sin documento</span>`;
            }
        });

        // Documentos múltiples
        docsMultiples.forEach(doc => {
            const lista = Array.isArray(data[doc.id]) ? data[doc.id] : [];
            docsMultiplesActuales[doc.id] = [...lista];
            const list = document.getElementById(`list-multiple-${doc.id}`);
            if (!list) return;
            list.innerHTML = '';
            if (lista.length === 0) {
                list.innerHTML = `<div style="color: #94a3b8; font-size: 0.85rem; padding: 8px;">Sin documentos</div>`;
            } else {
                lista.forEach((url, idx) => {
                    const nombre = url.split('/').pop() || `Documento ${idx + 1}`;
                    const div = document.createElement('div');
                    div.className = 'doc-multiple-item';
                    div.innerHTML = `
                        <div style="flex: 1;"><a href="${url}" target="_blank">📄 ${nombre}</a></div>
                        <button type="button" class="btn-remove-doc" onclick="eliminarDocMultiple('${doc.id}', ${idx}, '${url}')">🗑️ Eliminar</button>
                    `;
                    list.appendChild(div);
                });
            }
        });

        form.style.display = 'block';
        mostrarMsg(msgBusqueda, '✅ Registro cargado. Puede editar los campos resaltados.', 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.eliminarDocMultiple = function(docId, idx, url) {
        if (!confirm('¿Eliminar este documento?')) return;
        const item = document.getElementById(`doc-mult-new-${docId}-${idx}`);
        if (item) item.remove();
        if (!docsUnicosAEliminar[docId]) docsUnicosAEliminar[docId] = [];
        docsUnicosAEliminar[docId].push(url);
        docsMultiplesActuales[docId] = docsMultiplesActuales[docId].filter(u => u !== url);
    };

    // ==========================================
    // ENVÍO DEL FORMULARIO
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
            btnSubmit.textContent = ' Guardando...';
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
                for (const [docId, file] of Object.entries(archivosNuevosMultiples)) {
                    if (file instanceof File) {
                        const path = `${uid}/mod_${ts}_${docId}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${docId}: ${error.message}`);
                        dataToUpdate[docId] = bucket.getPublicUrl(path).data.publicUrl;
                    }
                }

                // Subir documentos múltiples nuevos
                const keysMulti = Object.keys(archivosNuevosMultiples).filter(k => k.startsWith('multi_'));
                for (const key of keysMulti) {
                    const docId = key.replace('multi_', '');
                    const files = archivosNuevosMultiples[key];
                    if (!Array.isArray(files)) continue;
                    if (!dataToUpdate[docId]) dataToUpdate[docId] = [];
                    for (const file of files) {
                        const path = `${uid}/mod_${ts}_${docId}_${Math.random().toString(36).substr(2, 5)}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo múltiple ${docId}: ${error.message}`);
                        dataToUpdate[docId].push(bucket.getPublicUrl(path).data.publicUrl);
                    }
                }

                // Actualizar documentos múltiples existentes
                for (const doc of docsMultiples) {
                    const listaActual = docsMultiplesActuales[doc.id] || [];
                    const eliminadas = docsUnicosAEliminar[doc.id] || [];
                    const listaFinal = listaActual.filter(u => !eliminadas.includes(u));
                    const nuevas = dataToUpdate[doc.id] || [];
                    dataToUpdate[doc.id] = [...listaFinal, ...nuevas];
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 4000);
            } catch (err) {
                console.error('Error al guardar:', err);
                mostrarMsg(msgForm, '❌ Error: ' + err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = '💾 Guardar Cambios';
            }
        });
    }

    console.log("✅ Módulo mod-procesados.js inicializado correctamente");
};
