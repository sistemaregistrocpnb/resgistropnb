window.initRegProcesados = function() {
    console.log("✅ Módulo reg-procesados.js cargado correctamente.");

    const btnBuscar = document.getElementById('proc_btn_buscar');
    const inputBusqueda = document.getElementById('proc_busqueda_input');
    const msgBusqueda = document.getElementById('proc_msg_busqueda');
    const selectionPanel = document.getElementById('selection-panel');
    const selectionList = document.getElementById('selection-list');
    const resultCount = document.getElementById('result-count');
    const btnCancelSearch = document.getElementById('btn-cancelar-seleccion');
    const datosPanel = document.getElementById('datos-encontrados-panel');
    const btnCambiarRegistro = document.getElementById('btn-cambiar-registro');
    const form = document.getElementById('form-reg-procesados');
    const msgForm = document.getElementById('msg-reg-procesados');

    let registroSeleccionado = null;

    const mostrarMsg = (el, txt, type) => {
        if (!el) return;
        el.innerHTML = txt;
        el.className = `msg ${type}`;
        el.style.display = 'block';
    };

    const limpiarFotos = (gridId) => {
        const grid = document.getElementById(gridId);
        if (grid) grid.innerHTML = '';
    };

    const agregarFoto = (gridId, url, label) => {
        const grid = document.getElementById(gridId);
        if (!grid) return;
        const div = document.createElement('div');
        div.className = 'foto-item';
        if (url) {
            div.innerHTML = `<img src="${url}" alt="${label}"><div class="foto-label">${label}</div>`;
        } else {
            div.innerHTML = `<div class="foto-vacia">Sin foto</div><div class="foto-label">${label}</div>`;
        }
        grid.appendChild(div);
    };

    function detectarCoincidencias(reg, val, tabla) {
        const campos = [];
        const v = val.trim().toUpperCase();
        if ((tabla === 'registro_personas' || tabla === 'registro_vinculado') && reg.cedula && reg.cedula.toUpperCase() === v) campos.push('Cédula');
        if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
        if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial Carrocería');
        if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial Motor');
        return campos;
    }

    async function buscarEnTodasLasTablas(valor) {
        const resultados = [];
        const val = valor.trim().toUpperCase();
        try {
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
                        tipo: 'Persona', icono: '👤', color: '#7c3aed', colorBg: '#f5f3ff',
                        tipoVehiculo: 'Persona',
                        datos: reg,
                        linea1: `${nombre} | C.I: ${reg.cedula || '-'}`,
                        linea2: `Sexo: ${reg.sexo || '-'} | Edad: ${reg.edad || '-'}`,
                        linea3: `Estación: ${reg.estacion_policial || '-'}`,
                        encontrado_por: ['Cédula']
                    });
                });
            }
            const { data: motos, error: errMoto } = await window.supabaseClient
                .from('registro_motos')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`)
                .eq('estatus', 'Verificación');
            if (!errMoto && motos) {
                motos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_motos', id: reg.id,
                        tipo: 'Motocicleta', icono: '🏍️', color: '#dc2626', colorBg: '#fef2f2',
                        tipoVehiculo: 'Motocicleta',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial: ${reg.serial_carroceria || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_motos')
                    });
                });
            }
            const { data: autos, error: errAuto } = await window.supabaseClient
                .from('registro_automoviles')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`)
                .eq('estatus', 'Verificación');
            if (!errAuto && autos) {
                autos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_automoviles', id: reg.id,
                        tipo: 'Automóvil', icono: '', color: '#059669', colorBg: '#ecfdf5',
                        tipoVehiculo: 'Automóvil',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial: ${reg.serial_carroceria || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_automoviles')
                    });
                });
            }
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
                        tipo: 'Persona + Vehículo', icono: '🔗', color: '#002b5c', colorBg: '#eff6ff',
                        tipoVehiculo: reg.tipo_vehiculo || 'Vehículo',
                        datos: reg,
                        linea1: `👤 ${nombre} | C.I: ${reg.cedula || '-'}`,
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

        const data = resultado.datos;
        const tipo = resultado.origen;
        const seccionPersona = document.getElementById('seccion-persona');
        const seccionVehiculo = document.getElementById('seccion-vehiculo');

        // Mostrar badge de tipo de vehículo al lado del título
        const badge = document.getElementById('tipo-vehiculo-badge');
        if (badge) {
            badge.textContent = ` ${resultado.tipoVehiculo}`;
            badge.style.display = 'inline-block';
        }

        // Limpiar fotos
        limpiarFotos('fotos-persona-grid');
        limpiarFotos('fotos-vehiculo-grid');

        // Sección Persona
        if (tipo === 'registro_personas' || tipo === 'registro_vinculado') {
            seccionPersona.style.display = 'block';
            document.getElementById('val-nombre').textContent = `${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}`.trim() || '-';
            document.getElementById('val-cedula').textContent = data.cedula || '-';
            document.getElementById('val-edad').textContent = data.edad ? `${data.edad} años` : '-';
            document.getElementById('val-nacionalidad').textContent = data.nacionalidad || '-';
            document.getElementById('val-sexo').textContent = data.sexo || '-';
            document.getElementById('val-estacion').textContent = data.estacion_policial || '-';
            document.getElementById('val-detencion').textContent = data.direccion_detencion || '-';

            // Fotos persona
            if (tipo === 'registro_vinculado') {
                agregarFoto('fotos-persona-grid', data.foto_frontal_persona, 'Frontal');
                agregarFoto('fotos-persona-grid', data.foto_perfil_izq_persona, 'Perfil Izquierdo');
                agregarFoto('fotos-persona-grid', data.foto_perfil_der_persona, 'Perfil Derecho');
            } else {
                agregarFoto('fotos-persona-grid', data.foto_frontal, 'Frontal');
                agregarFoto('fotos-persona-grid', data.foto_perfil_izq, 'Perfil Izquierdo');
                agregarFoto('fotos-persona-grid', data.foto_perfil_der, 'Perfil Derecho');
            }
        } else {
            seccionPersona.style.display = 'none';
        }

        // Sección Vehículo
        if (tipo === 'registro_motos' || tipo === 'registro_automoviles' || tipo === 'registro_vinculado') {
            seccionVehiculo.style.display = 'block';
            document.getElementById('val-placa').textContent = data.placa || '-';
            document.getElementById('val-carroceria').textContent = data.serial_carroceria || '-';
            document.getElementById('val-motor').textContent = data.serial_motor || '-';
            document.getElementById('val-marca').textContent = data.marca || data.marca_vehiculo || '-';
            document.getElementById('val-modelo').textContent = data.modelo || data.modelo_vehiculo || '-';
            document.getElementById('val-anio').textContent = data.anio || data.anio_vehiculo || '-';
            document.getElementById('val-color').textContent = data.color || data.color_vehiculo || '-';
            document.getElementById('val-estacion-veh').textContent = data.estacion_policial || '-';
            document.getElementById('val-detencion-veh').textContent = data.direccion_detencion || '-';

            // Fotos vehículo
            if (tipo === 'registro_vinculado') {
                agregarFoto('fotos-vehiculo-grid', data.foto_frontal_vehiculo, 'Frontal');
                agregarFoto('fotos-vehiculo-grid', data.foto_trasera_vehiculo, 'Trasera');
                agregarFoto('fotos-vehiculo-grid', data.foto_lado_der_vehiculo, 'Lado Derecho');
                agregarFoto('fotos-vehiculo-grid', data.foto_lado_izq_vehiculo, 'Lado Izquierdo');
            } else {
                agregarFoto('fotos-vehiculo-grid', data.foto_frontal, 'Frontal');
                agregarFoto('fotos-vehiculo-grid', data.foto_trasera || data.foto_trasera_vehiculo, 'Trasera');
                agregarFoto('fotos-vehiculo-grid', data.foto_lado_derecho || data.foto_lado_der_vehiculo, 'Lado Derecho');
                agregarFoto('fotos-vehiculo-grid', data.foto_lado_izquierdo || data.foto_lado_izq_vehiculo, 'Lado Izquierdo');
            }
        } else {
            seccionVehiculo.style.display = 'none';
        }

        datosPanel.style.display = 'block';

        document.getElementById('proc_tabla_origen').value = resultado.origen;
        document.getElementById('proc_registro_id').value = resultado.id;

        const tipoMap = { 'registro_personas': 'persona', 'registro_motos': 'moto', 'registro_automoviles': 'auto', 'registro_vinculado': 'vinculado' };
        document.getElementById('proc_tipo_registro').value = tipoMap[resultado.origen] || '';

        const identificador = resultado.origen === 'registro_personas' ? (data.cedula || '') : (data.placa || '');
        document.getElementById('proc_identificador').value = identificador;

        form.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const val = inputBusqueda.value.trim();
            if (val.length < 5) {
                return mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 5 caracteres.', 'error');
            }
            mostrarMsg(msgBusqueda, ' Buscando registros en estado Verificación...', 'success');
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
    // 🔹 ENVÍO DEL FORMULARIO
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

            // Validar documentos marcados como Sí
            for (const doc of docsUnicos) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    const fileInput = document.getElementById(`file_${doc.id}`);
                    if (!fileInput.files || fileInput.files.length === 0) {
                        return mostrarMsg(msgForm, ` Debe subir un PDF para: ${doc.label}`, 'error');
                    }
                }
            }

            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    if (archivosMultiples[doc.id].length < doc.min) {
                        return mostrarMsg(msgForm, `❌ Debe subir al menos ${doc.min} PDF para: ${doc.label}`, 'error');
                    }
                }
            }

            const btnSubmit = form.querySelector('.btn-submit');
            btnSubmit.disabled = true;
            btnSubmit.textContent = '⏳ Procesando...';
            msgForm.style.display = 'none';

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                const procesadoPor = user?.email || 'usuario@sistema';
                const bucket = window.supabaseClient.storage.from('procesados_documentos');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();

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

                const dataToInsert = {
                    tabla_origen: registroSeleccionado.origen,
                    registro_id: registroSeleccionado.id,
                    tipo_registro: document.getElementById('proc_tipo_registro').value,
                    identificador_principal: document.getElementById('proc_identificador').value,
                    datos_originales: registroSeleccionado.datos,
                    tipo_delito: tipoDelito,
                    estatus: 'Procesado',
                    fecha_procesamiento: new Date().toISOString(),
                    procesado_por: procesadoPor,
                    observaciones: document.getElementById('proc_observaciones').value.trim() || null
                };

                // Documentos únicos
                for (const doc of docsUnicos) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si') {
                        dataToInsert[doc.id] = await subirPDF(`file_${doc.id}`, doc.id);
                    } else {
                        dataToInsert[doc.id] = null;
                    }
                }

                // Documentos múltiples
                for (const doc of docsMultiples) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si' && archivosMultiples[doc.id].length > 0) {
                        dataToInsert[doc.id] = await subirPDFsMultiples(doc.id);
                    } else {
                        dataToInsert[doc.id] = [];
                    }
                }

                // Insertar en registro_procesados
                const { error: insErr } = await window.supabaseClient
                    .from('registro_procesados')
                    .insert([dataToInsert]);
                if (insErr) throw new Error(`Error al registrar procesado: ${insErr.message}`);

                // Cambiar estatus en tabla original
                const { error: updErr } = await window.supabaseClient
                    .from(registroSeleccionado.origen)
                    .update({ estatus: 'Procesado' })
                    .eq('id', registroSeleccionado.id);
                if (updErr) throw new Error(`Error al cambiar estatus: ${updErr.message}`);

                mostrarMsg(msgForm, '✅ Procesado registrado exitosamente. El estatus cambió a "Procesado".', 'success');

                setTimeout(() => {
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    registroSeleccionado = null;
                    form.reset();
                    docsMultiples.forEach(d => { archivosMultiples[d.id] = []; actualizarListaArchivos(d.id, d.max); });
                    document.querySelectorAll('.doc-upload-area').forEach(area => area.classList.remove('active'));
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
