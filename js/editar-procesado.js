window.initRegProcesados = function() {
    console.log("✅ Módulo reg-procesados.js cargado correctamente.");

    // ==========================================

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

    // ==========================================
    // GENERAR DOCUMENTOS EN DOM
    // ==========================================
    const contenedorUnicos = document.getElementById('docs-unicos-container');
    if (contenedorUnicos) {
        docsUnicos.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label}</label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="doc_${doc.id}" value="no" checked onchange="toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="doc_${doc.id}" value="si" onchange="toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="upload-${doc.id}">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" onchange="mostrarArchivoCargado('${doc.id}', this)">
                    <div id="status-${doc.id}" class="file-status-container"></div>
                </div>
            `;
            contenedorUnicos.appendChild(div);
        });
    }

    const contenedorMultiples = document.getElementById('docs-multiples-container');
    if (contenedorMultiples) {
        docsMultiples.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Mínimo ${doc.min}, máximo ${doc.max})</span></label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="doc_${doc.id}" value="no" checked onchange="toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="doc_${doc.id}" value="si" onchange="toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="upload-${doc.id}">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" multiple>
                    <button type="button" class="btn-add-file" onclick="agregarArchivo('${doc.id}', ${doc.max})">➕ Agregar</button>
                    <div class="file-count" id="count-${doc.id}">0 de ${doc.max} archivos</div>
                    <div class="file-list" id="list-${doc.id}"></div>
                    <div id="status-${doc.id}" class="file-status-container"></div>
                </div>
            `;
            contenedorMultiples.appendChild(div);
        });
    }

    // ==========================================
    // FUNCIONES GLOBALES DE UI
    // ==========================================
    window.toggleDocField = function(campo, mostrar) {
        const area = document.getElementById(`upload-${campo}`);
        if (area) area.classList.toggle('active', mostrar);
    };

    window.mostrarArchivoCargado = function(docId, input) {
        const statusContainer = document.getElementById(`status-${docId}`);
        if (!statusContainer) return;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            statusContainer.innerHTML = `
                <div class="file-loaded">
                    <span>✅</span>
                    <span class="file-name">${file.name}</span>
                    <button type="button" class="btn-remove" onclick="removerArchivo('${docId}')">❌ Quitar</button>
                </div>
            `;
        } else {
            statusContainer.innerHTML = '';
        }
    };

    window.removerArchivo = function(docId) {
        const input = document.getElementById(`file_${docId}`);
        const statusContainer = document.getElementById(`status-${docId}`);
        if (input) input.value = '';
        if (statusContainer) statusContainer.innerHTML = '';
    };

    window.agregarArchivo = function(campo, max) {
        const input = document.getElementById(`file_${campo}`);
        const statusContainer = document.getElementById(`status-${campo}`);
        if (!input || !input.files || input.files.length === 0) return;
        
        const disponibles = max - archivosMultiples[campo].length;
        if (disponibles <= 0) {
            alert(`Máximo ${max} archivos permitidos`);
            return;
        }

        let agregados = 0;
        const archivosAgregados = [];
        for (const file of input.files) {
            if (agregados >= disponibles) break;
            if (file.type === 'application/pdf') {
                archivosMultiples[campo].push(file);
                archivosAgregados.push(file.name);
                agregados++;
            }
        }
        actualizarListaArchivos(campo, max);
        input.value = '';

        if (archivosAgregados.length > 0 && statusContainer) {
            statusContainer.innerHTML = `<div class="file-loaded"><span>✅</span><span class="file-name">${archivosAgregados.length} archivo(s) cargado(s)</span></div>`;
            setTimeout(() => { if (statusContainer) statusContainer.innerHTML = ''; }, 3000);
        }
    };

    function actualizarListaArchivos(campo, max) {
        const list = document.getElementById(`list-${campo}`);
        const count = document.getElementById(`count-${campo}`);
        if (!list || !count) return;
        list.innerHTML = '';
        archivosMultiples[campo].forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item-multiple';
            item.innerHTML = `<span>📄 ${file.name}</span><button type="button" onclick="eliminarArchivoMultiple('${campo}', ${max}, ${index})">❌</button>`;
            list.appendChild(item);
        });
        count.textContent = `${archivosMultiples[campo].length} de ${max} archivos`;
    }

    window.eliminarArchivoMultiple = function(campo, max, index) {
        archivosMultiples[campo].splice(index, 1);
        actualizarListaArchivos(campo, max);
    };

    // ==========================================
    // OVERLAY DE CARGA
    // ==========================================
    const loadingOverlay = document.getElementById('loading-overlay');
    function mostrarOverlay(mensaje = '⏳ Procesando y subiendo archivos...') {
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.innerHTML = `${mensaje}<br><small>Por favor, no cierre ni recargue esta ventana.</small>`;
            }
            loadingOverlay.classList.add('active');
        }
    }
    function ocultarOverlay() {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }

    // ==========================================
    // REFERENCIAS DOM
    // ==========================================
    const btnBuscar = document.getElementById('proc_btn_buscar');
    const inputBusqueda = document.getElementById('proc_busqueda_input');
    const msgBusqueda = document.getElementById('proc_msg_busqueda');
    const selectionPanel = document.getElementById('selection-panel');
    const selectionList = document.getElementById('selection-list');
    const resultCount = document.getElementById('result-count');
    const btnCancelSearch = document.getElementById('btn-cancelar-seleccion');
    const datosPanel = document.getElementById('datos-encontrados-panel');
    const datosContenido = document.getElementById('datos-contenido');
    const form = document.getElementById('form-reg-procesados');
    const msgForm = document.getElementById('msg-reg-procesados');

    let registroSeleccionado = null;

    const mostrarMsg = (el, txt, type) => {
        if (!el) return;
        el.innerHTML = txt;
        el.className = `msg ${type}`;
        el.style.display = 'block';
    };

    // ==========================================
    // DETECTAR COINCIDENCIAS
    // ==========================================
    function detectarCoincidencias(reg, val, tabla) {
        const campos = [];
        const v = val.trim().toUpperCase();
        if ((tabla === 'registro_personas' || tabla === 'registro_vinculado') && reg.cedula && reg.cedula.toUpperCase() === v) campos.push('Cédula');
        if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
        if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial Carrocería');
        if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial Motor');
        return campos;
    }

    // ==========================================
    // BÚSQUEDA EN LAS 4 TABLAS
    // ==========================================
    async function buscarEnTodasLasTablas(valor) {
        const resultados = [];
        const val = valor.trim().toUpperCase();
        
        try {
            // 1. REGISTRO_PERSONAS
            const { data: personas, error: errPers } = await window.supabaseClient
                .from('registro_personas')
                .select('*')
                .eq('cedula', val)
                .eq('estatus', 'Verificación');
            
            if (!errPers && personas) {
                personas.forEach(reg => {
                    const nombre = `${reg.primer_nombre || ''} ${reg.primer_apellido || ''}`.trim();
                    resultados.push({
                        origen: 'registro_personas', id: reg.id,
                        tipo: '👤 Persona', icono: '👤', color: '#7c3aed', colorBg: '#f5f3ff',
                        tipoRegistro: 'persona',
                        datos: reg,
                        linea1: `${nombre} | C.I: ${reg.cedula || '-'}`,
                        linea2: `Sexo: ${reg.sexo || '-'}`,
                        linea3: `Estación: ${reg.estacion_policial || '-'}`,
                        encontrado_por: ['Cédula']
                    });
                });
            }

            // 2. REGISTRO_MOTOS
            const { data: motos, error: errMoto } = await window.supabaseClient
                .from('registro_motos')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`)
                .eq('estatus', 'Verificación');
            
            if (!errMoto && motos) {
                motos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_motos', id: reg.id,
                        tipo: '🏍️ Motocicleta', icono: '🏍️', color: '#dc2626', colorBg: '#fef2f2',
                        tipoRegistro: 'moto',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial: ${reg.serial_carroceria || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_motos')
                    });
                });
            }

            // 3. REGISTRO_AUTOMOVILES
            const { data: autos, error: errAuto } = await window.supabaseClient
                .from('registro_automoviles')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`)
                .eq('estatus', 'Verificación');
            
            if (!errAuto && autos) {
                autos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_automoviles', id: reg.id,
                        tipo: '🚙 Automóvil', icono: '🚙', color: '#059669', colorBg: '#ecfdf5',
                        tipoRegistro: 'auto',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial: ${reg.serial_carroceria || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_automoviles')
                    });
                });
            }

            // 4. REGISTRO_VINCULADO
            const { data: vinculados, error: errVinc } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .or(`cedula.eq.${val},placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`)
                .eq('estatus', 'Verificación');
            
            if (!errVinc && vinculados) {
                vinculados.forEach(reg => {
                    const nombre = `${reg.primer_nombre || ''} ${reg.primer_apellido || ''}`.trim();
                    resultados.push({
                        origen: 'registro_vinculado', id: reg.id,
                        tipo: '🔗 Persona + Vehículo', icono: '🔗', color: '#002b5c', colorBg: '#eff6ff',
                        tipoRegistro: 'vinculado',
                        datos: reg,
                        linea1: `👤 ${nombre} | C.I: ${reg.cedula || '-'}`,
                        linea2: `🚗 ${reg.tipo_vehiculo || ''} ${reg.marca_vehiculo || ''} | Placa: ${reg.placa || '-'}`,
                        linea3: `🏛️ ${reg.estacion_policial || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_vinculado')
                    });
                });
            }

            return resultados;
        } catch (err) {
            throw err;
        }
    }

    // ==========================================
    // MOSTRAR PANEL DE SELECCIÓN
    // ==========================================
    function mostrarPanelSeleccion(resultados, valorBuscado) {
        selectionList.innerHTML = '';
        resultCount.textContent = resultados.length;

        resultados.forEach((res, index) => {
            const card = document.createElement('div');
            card.style.cssText = `background: ${res.colorBg}; border: 2px solid ${res.color}; border-left: 6px solid ${res.color}; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; margin-bottom: 12px;`;
            
            card.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 1.5rem;">${res.icono}</span>
                        <strong style="color: ${res.color}; font-size: 0.95rem;">${res.tipo}</strong>
                    </div>
                    <div style="font-size: 0.9rem; color: #334155; margin-bottom: 3px;">${res.linea1}</div>
                    <div style="font-size: 0.85rem; color: #475569; margin-bottom: 3px;">${res.linea2}</div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">${res.linea3}</div>
                    <div style="font-size: 0.75rem; color: #0369a1; background: #e0f2fe; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                        🔎 Coincidencia en: <strong>${res.encontrado_por.join(', ')}</strong>
                    </div>
                </div>
                <button class="btn-seleccionar" data-index="${index}" style="padding: 12px 24px; background: ${res.color}; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; white-space: nowrap;">⚖️ Procesar</button>
            `;
            selectionList.appendChild(card);
        });

        document.querySelectorAll('.btn-seleccionar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                seleccionarRegistro(resultados[idx]);
            });
        });

        selectionPanel.style.display = 'block';
        form.style.display = 'none';
        datosPanel.style.display = 'none';
        msgBusqueda.style.display = 'none';
    }

    // ==========================================
    // SELECCIONAR REGISTRO Y MOSTRAR DATOS
    // ==========================================
    function seleccionarRegistro(resultado) {
        registroSeleccionado = resultado;
        selectionPanel.style.display = 'none';

        const data = resultado.datos;
        const badge = document.getElementById('tipo-vehiculo-badge');
        if (badge) {
            badge.textContent = ` ${resultado.tipo}`;
            badge.style.display = 'inline-block';
        }

        let html = '';
        if (resultado.origen === 'registro_personas' || resultado.origen === 'registro_vinculado') {
            html += `<div class="dato-fila"><span class="dato-label">👤 Nombre:</span><span class="dato-valor">${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🆔 Cédula:</span><span class="dato-valor">${data.cedula || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🌍 Nacionalidad:</span><span class="dato-valor">${data.nacionalidad || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">⚧ Sexo:</span><span class="dato-valor">${data.sexo || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🏛️ Estación:</span><span class="dato-valor">${data.estacion_policial || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">📍 Detención:</span><span class="dato-valor">${data.direccion_detencion || '-'}</span></div>`;
        }

        if (resultado.origen === 'registro_motos' || resultado.origen === 'registro_automoviles' || resultado.origen === 'registro_vinculado') {
            if (html) html += `<div style="margin-top: 12px; padding-top: 12px; border-top: 2px dashed #bbf7d0;"></div>`;
            
            const tipoVeh = resultado.origen === 'registro_motos' ? '🏍️ Motocicleta' : resultado.origen === 'registro_automoviles' ? '🚙 Automóvil' : (data.tipo_vehiculo || '-');
            html += `<div class="dato-fila"><span class="dato-label">🚗 Tipo Vehículo:</span><span class="dato-valor">${tipoVeh}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🔢 Placa:</span><span class="dato-valor">${data.placa || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🔢 Serial Carrocería:</span><span class="dato-valor">${data.serial_carroceria || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🔢 Serial Motor:</span><span class="dato-valor">${data.serial_motor || '-'}</span></div>`;
            
            const marca = data.marca || data.marca_vehiculo;
            const modelo = data.modelo || data.modelo_vehiculo;
            const anio = data.anio || data.anio_vehiculo;
            const color = data.color || data.color_vehiculo;
            
            html += `<div class="dato-fila"><span class="dato-label">🏭 Marca:</span><span class="dato-valor">${marca || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">📦 Modelo:</span><span class="dato-valor">${modelo || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">📅 Año:</span><span class="dato-valor">${anio || '-'}</span></div>`;
            html += `<div class="dato-fila"><span class="dato-label">🎨 Color:</span><span class="dato-valor">${color || '-'}</span></div>`;
        }

        datosContenido.innerHTML = html;
        datosPanel.style.display = 'block';

        document.getElementById('proc_tabla_origen').value = resultado.origen;
        document.getElementById('proc_registro_id').value = resultado.id;
        document.getElementById('proc_tipo_registro').value = resultado.tipoRegistro || '';
        document.getElementById('proc_identificador').value = resultado.origen === 'registro_personas' ? (data.cedula || '') : (data.placa || '');

        form.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // LISTENER BÚSQUEDA
    // ==========================================
    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const val = inputBusqueda.value.trim();
            if (val.length < 5) {
                return mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 5 caracteres.', 'error');
            }

            mostrarMsg(msgBusqueda, '🔍 Buscando en todos los registros (Verificación)...', 'success');
            btnBuscar.disabled = true;
            form.style.display = 'none';
            datosPanel.style.display = 'none';
            selectionPanel.style.display = 'none';

            try {
                const resultados = await buscarEnTodasLasTablas(val);
                
                if (resultados.length === 0) {
                    mostrarMsg(msgBusqueda, '❌ No se encontró ningún registro en estado Verificación.', 'error');
                } else if (resultados.length === 1) {
                    mostrarMsg(msgBusqueda, '✅ 1 registro encontrado.', 'success');
                    setTimeout(() => seleccionarRegistro(resultados[0]), 300);
                } else {
                    mostrarMsg(msgBusqueda, `🔎 Se encontraron <strong>${resultados.length} registros</strong>. Seleccione cuál procesar:`, 'success');
                    setTimeout(() => mostrarPanelSeleccion(resultados, val), 300);
                }
            } catch (err) {
                mostrarMsg(msgBusqueda, '❌ Error de conexión al buscar.', 'error');
            } finally {
                btnBuscar.disabled = false;
            }
        });

        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnBuscar.click(); }
        });
    }

    if (btnCancelSearch) {
        btnCancelSearch.addEventListener('click', () => {
            selectionPanel.style.display = 'none';
            msgBusqueda.style.display = 'none';
            inputBusqueda.value = '';
            inputBusqueda.focus();
        });
    }

    // ==========================================
    // ENVÍO DEL FORMULARIO CON LOGS CORREGIDOS
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!registroSeleccionado) {
                return mostrarMsg(msgForm, '❌ Debe buscar y seleccionar un registro primero.', 'error');
            }

            const tipoDelito = document.getElementById('proc_tipo_delito').value.trim();
            if (!tipoDelito) {
                return mostrarMsg(msgForm, '⚠️ El tipo de delito es obligatorio.', 'error');
            }

            // Validar documentos únicos
            for (const doc of docsUnicos) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    const fileInput = document.getElementById(`file_${doc.id}`);
                    if (!fileInput.files || fileInput.files.length === 0) {
                        return mostrarMsg(msgForm, `⚠️ Debe subir un PDF para: ${doc.label}`, 'error');
                    }
                }
            }

            // Validar documentos múltiples
            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    if (archivosMultiples[doc.id].length < doc.min) {
                        return mostrarMsg(msgForm, `❌ Debe subir al menos ${doc.min} PDF para: ${doc.label}`, 'error');
                    }
                }
            }

            // MOSTRAR OVERLAY DE CARGA
            mostrarOverlay('⏳ Procesando y subiendo archivos...');

            try {
                const bucket = window.supabaseClient.storage.from('procesados_documentos');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();

                // Subir PDF único
                const subirPDF = async (fileInputId, suffix) => {
                    const fileInput = document.getElementById(fileInputId);
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                        const file = fileInput.files[0];
                        const path = `${uid}/${ts}_${suffix}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${suffix}: ${error.message}`);
                        return bucket.getPublicUrl(path).data.publicUrl;
                    }
                    return null;
                };

                // Subir PDFs múltiples
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

                const dataOriginal = registroSeleccionado.datos;
                const documentosMultiplesSubidos = {};

                // Procesar entrevista_multi
                const radioEntrevistaMulti = document.querySelector(`input[name="doc_entrevista_multi"]:checked`);
                if (radioEntrevistaMulti && radioEntrevistaMulti.value === 'si' && archivosMultiples['entrevista_multi'].length > 0) {
                    documentosMultiplesSubidos['entrevista_multi'] = await subirPDFsMultiples('entrevista_multi');
                } else {
                    documentosMultiplesSubidos['entrevista_multi'] = [];
                }

                const dataToInsert = {
                    tabla_origen: registroSeleccionado.origen,
                    registro_id: registroSeleccionado.id,
                    tipo_registro: registroSeleccionado.tipoRegistro || '',
                    identificador_principal: document.getElementById('proc_identificador').value,
                    tipo_delito: tipoDelito,
                    observaciones: document.getElementById('proc_observaciones').value.trim() || null,
                    datos_originales: {
                        ...dataOriginal,
                        documentos_multiples_adicionales: documentosMultiplesSubidos
                    },
                    estatus: 'Procesado'
                };

                if (registroSeleccionado.origen === 'registro_personas' || registroSeleccionado.origen === 'registro_vinculado') {
                    dataToInsert.cedula = dataOriginal.cedula;
                }

                // Procesar documentos únicos (guardar como ARRAY)
                for (const doc of docsUnicos) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si') {
                        const url = await subirPDF(`file_${doc.id}`, doc.id);
                        dataToInsert[doc.id] = url ? [url] : [];
                    } else {
                        dataToInsert[doc.id] = [];
                    }
                }

                // Procesar cadena_custodia
                const radioCadena = document.querySelector(`input[name="doc_cadena_custodia"]:checked`);
                if (radioCadena && radioCadena.value === 'si' && archivosMultiples['cadena_custodia'].length > 0) {
                    dataToInsert.cadena_custodia = await subirPDFsMultiples('cadena_custodia');
                } else {
                    dataToInsert.cadena_custodia = [];
                }

                // Procesar inspecciones_tecnicas
                const radioInspeccion = document.querySelector(`input[name="doc_inspecciones_tecnicas"]:checked`);
                if (radioInspeccion && radioInspeccion.value === 'si' && archivosMultiples['inspecciones_tecnicas'].length > 0) {
                    dataToInsert.inspecciones_tecnicas = await subirPDFsMultiples('inspecciones_tecnicas');
                } else {
                    dataToInsert.inspecciones_tecnicas = [];
                }

                // 1. Insertar en registro_procesados
                const { error: insErr } = await window.supabaseClient
                    .from('registro_procesados')
                    .insert([dataToInsert]);

                if (insErr) throw new Error(`Error al registrar procesado: ${insErr.message}`);

                // 2. Cambiar estatus del registro original
                const { error: updErr } = await window.supabaseClient
                    .from(registroSeleccionado.origen)
                    .update({ estatus: 'Procesado' })
                    .eq('id', registroSeleccionado.id);

                if (updErr) throw new Error(`Error al cambiar estatus: ${updErr.message}`);

                // 🔹 LOG CENTRALIZADO USANDO UTILS.JS
                if (typeof window.registrarLog === 'function' && registroSeleccionado?.id) {
                    const logDetalles = {
                        tipo_delito: tipoDelito,
                        estatus: 'Procesado',
                        estacion: dataOriginal.estacion_policial || 'N/A',
                        direccion_detencion: dataOriginal.direccion_detencion || 'N/A',
                        observaciones: document.getElementById('proc_observaciones').value.trim() || null
                    };

                    if (registroSeleccionado.tipoRegistro === 'persona') {
                        logDetalles.tipo = 'Persona';
                        logDetalles.cedula = dataOriginal.cedula || 'N/A';
                        logDetalles.nombre_completo = `${dataOriginal.primer_nombre || ''} ${dataOriginal.primer_apellido || ''}`.trim() || 'N/A';
                    } else if (registroSeleccionado.tipoRegistro === 'moto' || registroSeleccionado.tipoRegistro === 'auto') {
                        logDetalles.tipo = registroSeleccionado.tipoRegistro === 'moto' ? 'Motocicleta' : 'Automóvil';
                        logDetalles.placa = dataOriginal.placa || 'N/A';
                        logDetalles.marca = dataOriginal.marca || 'N/A';
                        logDetalles.modelo = dataOriginal.modelo || 'N/A';
                        logDetalles.anio = dataOriginal.anio || 'N/A';
                        logDetalles.color = dataOriginal.color || 'N/A';
                    } else if (registroSeleccionado.tipoRegistro === 'vinculado') {
                        logDetalles.tipo = 'Vinculado';
                        logDetalles.cedula = dataOriginal.cedula || 'N/A';
                        logDetalles.nombre_completo = `${dataOriginal.primer_nombre || ''} ${dataOriginal.primer_apellido || ''}`.trim() || 'N/A';
                        logDetalles.placa = dataOriginal.placa || 'N/A';
                        logDetalles.marca = dataOriginal.marca_vehiculo || 'N/A';
                        logDetalles.modelo = dataOriginal.modelo_vehiculo || 'N/A';
                        logDetalles.anio = dataOriginal.anio_vehiculo || 'N/A';
                        logDetalles.color = dataOriginal.color_vehiculo || 'N/A';
                        logDetalles.tipo_vehiculo = dataOriginal.tipo_vehiculo || 'N/A';
                    }

                    await window.registrarLog(
                        'PROCESAR',
                        'PROCESADOS',
                        logDetalles,
                        registroSeleccionado.id
                    );
                    console.log('✅ Log de procesamiento registrado exitosamente');
                }

                // OCULTAR OVERLAY - ÉXITO
                ocultarOverlay();
                mostrarMsg(msgForm, '✅ Procesado registrado exitosamente. El estatus del registro original cambió a "Procesado".', 'success');

                setTimeout(() => {
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    registroSeleccionado = null;
                    form.reset();
                    docsMultiples.forEach(d => {
                        archivosMultiples[d.id] = [];
                        actualizarListaArchivos(d.id, d.max);
                    });
                    document.querySelectorAll('.doc-upload-area').forEach(area => area.classList.remove('active'));
                    document.querySelectorAll('.file-status-container').forEach(c => c.innerHTML = '');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 5000);

            } catch (err) {
                // OCULTAR OVERLAY - ERROR
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
