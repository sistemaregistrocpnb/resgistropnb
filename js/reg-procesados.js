window.initRegProcesados = function() {
    console.log("✅ Módulo reg-procesados.js cargado correctamente.");

    // ==========================================
    // 🔹 REFERENCIAS DOM
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
    const btnCambiarRegistro = document.getElementById('btn-cambiar-registro');
    const form = document.getElementById('form-reg-procesados');
    const msgForm = document.getElementById('msg-reg-procesados');

    let registroSeleccionado = null;

    // ==========================================
    // 🔹 FUNCIONES UI
    // ==========================================
    function mostrarMsg(el, txt, type) {
        if (el) { el.innerHTML = txt; el.className = `msg ${type}`; el.style.display = txt ? 'block' : 'none'; }
    }

    // ==========================================
    // 🔹 BÚSQUEDA MULTI-TABLA
    // ==========================================
    function detectarCoincidencias(reg, val, tabla) {
        const campos = [];
        const v = val.trim().toUpperCase();
        if ((tabla === 'registro_personas' || tabla === 'registro_vinculado') && reg.cedula && reg.cedula.toUpperCase() === v) {
            campos.push('Cédula');
        }
        if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
        if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial Carrocería');
        if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial Motor');
        return campos;
    }

    async function buscarEnTodasLasTablas(valor) {
        const resultados = [];
        const val = valor.trim().toUpperCase();
        
        try {
            // 1. REGISTRO_PERSONAS (solo por cédula)
            const { data: personas, error: errPers } = await window.supabaseClient
                .from('registro_personas')
                .select('*')
                .eq('cedula', val)
                .eq('estatus', 'Verificación');
            
            if (!errPers && personas && personas.length > 0) {
                personas.forEach(reg => {
                    resultados.push({
                        origen: 'registro_personas',
                        id: reg.id,
                        tipo: '👤 Persona',
                        icono: '👤',
                        color: '#7c3aed',
                        colorBg: '#f5f3ff',
                        datos: reg,
                        linea1: `${reg.primer_nombre || ''} ${reg.primer_apellido || ''} | C.I: ${reg.cedula || '-'}`,
                        linea2: `Sexo: ${reg.sexo || '-'} | Edad: ${reg.edad || '-'}`,
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

            if (!errMoto && motos && motos.length > 0) {
                motos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_motos',
                        id: reg.id,
                        tipo: '🏍️ Motocicleta',
                        icono: '🏍️',
                        color: '#dc2626',
                        colorBg: '#fef2f2',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial Carrocería: ${reg.serial_carroceria || '-'}`,
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

            if (!errAuto && autos && autos.length > 0) {
                autos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_automoviles',
                        id: reg.id,
                        tipo: '🚙 Automóvil',
                        icono: '🚙',
                        color: '#059669',
                        colorBg: '#ecfdf5',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial Carrocería: ${reg.serial_carroceria || '-'}`,
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

            if (!errVinc && vinculados && vinculados.length > 0) {
                vinculados.forEach(reg => {
                    resultados.push({
                        origen: 'registro_vinculado',
                        id: reg.id,
                        tipo: '🔗 Registro Vinculado',
                        icono: '🔗',
                        color: '#002b5c',
                        colorBg: '#eff6ff',
                        datos: reg,
                        linea1: `👤 ${reg.primer_nombre || ''} ${reg.primer_apellido || ''} | C.I: ${reg.cedula || '-'}`,
                        linea2: `🚗 ${reg.tipo_vehiculo || ''} ${reg.marca_vehiculo || ''} ${reg.modelo_vehiculo || ''} | Placa: ${reg.placa || '-'}`,
                        linea3: `🏛️ ${reg.estacion_policial || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_vinculado')
                    });
                });
            }

            return resultados;
        } catch (err) {
            console.error('Error en búsqueda multi-tabla:', err);
            throw err;
        }
    }

    function mostrarPanelSeleccion(resultados, valorBuscado) {
        selectionList.innerHTML = '';
        resultCount.textContent = resultados.length;

        resultados.forEach((res, index) => {
            const card = document.createElement('div');
            card.style.cssText = `background: ${res.colorBg}; border: 2px solid ${res.color}; border-left: 6px solid ${res.color}; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; margin-bottom: 12px;`;
            card.onmouseover = () => card.style.transform = 'translateX(4px)';
            card.onmouseout = () => card.style.transform = 'translateX(0)';
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
                <button class="btn-seleccionar" data-index="${index}" style="padding: 12px 24px; background: ${res.color}; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; white-space: nowrap;">✅ Procesar</button>
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

    function seleccionarRegistro(resultado) {
        registroSeleccionado = resultado;
        selectionPanel.style.display = 'none';
        
        // Mostrar datos encontrados
        const tipoTexto = {
            'registro_personas': 'Persona',
            'registro_motos': 'Motocicleta',
            'registro_automoviles': 'Automóvil',
            'registro_vinculado': 'Registro Vinculado'
        };

        const identificador = resultado.origen === 'registro_personas' 
            ? `Cédula: ${resultado.datos.cedula || '-'}`
            : `Placa: ${resultado.datos.placa || '-'}`;

        datosContenido.innerHTML = `
            <div class="dato-fila"><span class="dato-label">📋 Tipo:</span><span class="dato-valor">${resultado.tipo}</span></div>
            <div class="dato-fila"><span class="dato-label">🔍 Identificador:</span><span class="dato-valor">${identificador}</span></div>
            <div class="dato-fila"><span class="dato-label">📊 Origen:</span><span class="dato-valor">${tipoTexto[resultado.origen]}</span></div>
            <div class="dato-fila"><span class="dato-label"> Nombre:</span><span class="dato-valor">${resultado.datos.primer_nombre || resultado.datos.marca || '-'}</span></div>
            <div class="dato-fila"><span class="dato-label">🏛️ Estación:</span><span class="dato-valor">${resultado.datos.estacion_policial || '-'}</span></div>
        `;

        datosPanel.style.display = 'block';

        // Llenar campos ocultos del formulario
        document.getElementById('proc_tabla_origen').value = resultado.origen;
        document.getElementById('proc_registro_id').value = resultado.id;
        
        const tipoMap = {
            'registro_personas': 'persona',
            'registro_motos': 'moto',
            'registro_automoviles': 'auto',
            'registro_vinculado': 'vinculado'
        };
        document.getElementById('proc_tipo_registro').value = tipoMap[resultado.origen];
        document.getElementById('proc_identificador').value = resultado.origen === 'registro_personas' 
            ? resultado.datos.cedula 
            : resultado.datos.placa;

        form.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // 🔹 LISTENERS DE BÚSQUEDA
    // ==========================================
    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const val = inputBusqueda.value.trim();
            if (val.length < 5) {
                mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 5 caracteres.', 'error');
                return;
            }

            mostrarMsg(msgBusqueda, '🔍 Buscando registros en estado Verificación...', 'success');
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
                console.error('Error en búsqueda:', err);
                mostrarMsg(msgBusqueda, '❌ Error al buscar: ' + err.message, 'error');
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

    if (btnCambiarRegistro) {
        btnCambiarRegistro.addEventListener('click', () => {
            datosPanel.style.display = 'none';
            form.style.display = 'none';
            registroSeleccionado = null;
            inputBusqueda.focus();
        });
    }

    // ==========================================
    // 🔹 VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!registroSeleccionado) {
                return mostrarMsg(msgForm, '❌ Debe buscar y seleccionar un registro primero.', 'error');
            }

            const tipoDelito = document.getElementById('proc_tipo_delito').value.trim();
            if (!tipoDelito) {
                return mostrarMsg(msgForm, '❌ El tipo de delito es obligatorio.', 'error');
            }

            // Validar documentos marcados como "Sí"
            const documentosUnicos = [
                'portada', 'oficio_remision', 'acta_denuncia', 'datos_filiatorios',
                'acta_policial', 'derechos_imputado', 'evaluacion_medica', 'identificacion_cedula',
                'solicitud_examen_forense', 'resultados_examen_forense', 'asistencia_comdepro',
                'remision_estacionamiento', 'planilla_pvr', 'otros_documentos'
            ];

            const documentosMultiples = ['entrevista', 'cadena_custodia', 'inspecciones_tecnicas'];

            // Validar documentos únicos marcados como Sí
            for (const doc of documentosUnicos) {
                const radio = document.querySelector(`input[name="doc_${doc}"]:checked`);
                if (radio && radio.value === 'si') {
                    const fileInput = document.getElementById(`file_${doc}`);
                    if (!fileInput.files || fileInput.files.length === 0) {
                        return mostrarMsg(msgForm, `❌ Debe subir un PDF para: ${doc.replace(/_/g, ' ')}`, 'error');
                    }
                    if (fileInput.files[0].type !== 'application/pdf') {
                        return mostrarMsg(msgForm, `❌ El archivo debe ser PDF: ${doc.replace(/_/g, ' ')}`, 'error');
                    }
                }
            }

            // Validar documentos múltiples marcados como Sí
            for (const doc of documentosMultiples) {
                const radio = document.querySelector(`input[name="doc_${doc}"]:checked`);
                if (radio && radio.value === 'si') {
                    if (archivosMultiples[doc].length === 0) {
                        return mostrarMsg(msgForm, `❌ Debe subir al menos 1 PDF para: ${doc.replace(/_/g, ' ')}`, 'error');
                    }
                }
            }

            const btnSubmit = form.querySelector('.btn-submit');
            btnSubmit.disabled = true;
            btnSubmit.textContent = '⏳ Procesando...';
            mostrarMsg(msgForm, '', '');

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                const procesadoPor = user?.email || 'usuario@sistema';
                const bucket = window.supabaseClient.storage.from('procesados_documentos');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();

                // Función para subir PDF único
                const subirPDF = async (fileInputId) => {
                    const fileInput = document.getElementById(fileInputId);
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                        const file = fileInput.files[0];
                        const path = `${uid}/${ts}_${fileInputId.replace('file_', '')}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${fileInputId}: ${error.message}`);
                        return bucket.getPublicUrl(path).data.publicUrl;
                    }
                    return null;
                };

                // Función para subir PDFs múltiples
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

                // Subir documentos únicos
                const docData = {};
                for (const doc of documentosUnicos) {
                    const radio = document.querySelector(`input[name="doc_${doc}"]:checked`);
                    if (radio && radio.value === 'si') {
                        docData[doc] = await subirPDF(`file_${doc}`);
                    } else {
                        docData[doc] = null;
                    }
                }

                // Subir documentos múltiples
                for (const doc of documentosMultiples) {
                    const radio = document.querySelector(`input[name="doc_${doc}"]:checked`);
                    if (radio && radio.value === 'si' && archivosMultiples[doc].length > 0) {
                        docData[doc] = await subirPDFsMultiples(doc);
                    } else {
                        docData[doc] = [];
                    }
                }

                // Preparar datos para insertar
                const dataToInsert = {
                    tabla_origen: registroSeleccionado.origen,
                    registro_id: registroSeleccionado.id,
                    tipo_registro: document.getElementById('proc_tipo_registro').value,
                    identificador_principal: document.getElementById('proc_identificador').value,
                    datos_originales: registroSeleccionado.datos,
                    tipo_delito: tipoDelito,
                    estatus: 'Procesado',
                    procesado_por: procesadoPor,
                    observaciones: document.getElementById('proc_observaciones').value.trim() || null,
                    ...docData
                };

                // Insertar en registro_procesados
                const { error: insErr } = await window.supabaseClient
                    .from('registro_procesados')
                    .insert([dataToInsert]);

                if (insErr) throw new Error(`Error al registrar procesado: ${insErr.message}`);

                // Cambiar estatus en la tabla original
                const { error: updErr } = await window.supabaseClient
                    .from(registroSeleccionado.origen)
                    .update({ estatus: 'Procesado' })
                    .eq('id', registroSeleccionado.id);

                if (updErr) throw new Error(`Error al cambiar estatus: ${updErr.message}`);

                mostrarMsg(msgForm, '✅ Procesado registrado exitosamente. El estatus del registro original cambió a "Procesado".', 'success');

                setTimeout(() => {
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    registroSeleccionado = null;
                    form.reset();
                    // Resetear archivos múltiples
                    archivosMultiples.entrevista = [];
                    archivosMultiples.cadena_custodia = [];
                    archivosMultiples.inspecciones_tecnicas = [];
                    ['entrevista', 'cadena_custodia', 'inspecciones_tecnicas'].forEach(campo => {
                        actualizarListaArchivos(campo);
                    });
                    // Ocultar todas las áreas de upload
                    document.querySelectorAll('.doc-upload-area').forEach(area => {
                        area.classList.remove('active');
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 5000);

            } catch (err) {
                console.error('Error al procesar:', err);
                mostrarMsg(msgForm, '❌ Error: ' + err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = '💾 Registrar Procesado y Cambiar Estatus';
            }
        });
    }

    console.log("✅ Módulo reg-procesados.js inicializado correctamente");
};
