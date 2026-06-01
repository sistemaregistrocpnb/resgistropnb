    // ==========================================
    // 🔹 3. BARRA DE BÚSQUEDA Y LLENADO (MULTI-TABLA CON PANEL DE SELECCIÓN)
    // ==========================================
    const btnBuscar = document.getElementById('btn_buscar_mod');
    const inputBusqueda = document.getElementById('mod_busqueda_input');
    const msgBusqueda = document.getElementById('mod_msg_busqueda');
    const form = document.getElementById('form-mod-vinculado');
    const selectionPanel = document.getElementById('selection-panel');
    const selectionList = document.getElementById('selection-list');
    const resultCount = document.getElementById('result-count');
    const crossPlateWarning = document.getElementById('cross-plate-warning');
    const btnCancelSel = document.getElementById('btn-cancelar-seleccion');

    const showMsgBusq = (txt, type) => {
        msgBusqueda.innerHTML = txt;
        msgBusqueda.className = `msg ${type}`;
        msgBusqueda.style.display = 'block';
    };

    // 🔍 Detectar en qué campos coincide el valor buscado
    function detectarCoincidencias(reg, val, tabla) {
        const campos = [];
        const v = val.trim().toUpperCase();
        
        if (tabla === 'registro_vinculado' || tabla === 'registro_personas') {
            if (reg.cedula && reg.cedula.toUpperCase() === v) campos.push('Cédula');
        }
        if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
        if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial Carrocería');
        if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial Motor');
        
        return campos;
    }

    // 🔍 Búsqueda multi-tabla (en las 3 tablas, por cédula/placa/seriales)
    async function buscarEnTodasLasTablas(valor) {
        const resultados = [];
        const val = valor.trim().toUpperCase();

        try {
            // 1. REGISTRO_VINCULADO (por cédula O placa O serial_carroceria O serial_motor)
            const { data: vinculados, error: errVinc } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .or(`cedula.eq.${val},placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`);

            if (!errVinc && vinculados && vinculados.length > 0) {
                vinculados.forEach(reg => {
                    resultados.push({
                        origen: 'registro_vinculado',
                        id: reg.id,
                        tipo: '🔗 Registro Vinculado (Persona + Vehículo)',
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

            // 2. REGISTRO_MOTOS (por placa O serial_carroceria O serial_motor)
            const { data: motos, error: errMoto } = await window.supabaseClient
                .from('registro_motos')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`);

            if (!errMoto && motos && motos.length > 0) {
                motos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_motos',
                        id: reg.id,
                        tipo: '🏍️ Motocicleta (Registro Individual)',
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

            // 3. REGISTRO_AUTOMOVILES (por placa O serial_carroceria O serial_motor)
            const { data: autos, error: errAuto } = await window.supabaseClient
                .from('registro_automoviles')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`);

            if (!errAuto && autos && autos.length > 0) {
                autos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_automoviles',
                        id: reg.id,
                        tipo: '🚙 Automóvil (Registro Individual)',
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

            return resultados;
        } catch (err) {
            console.error('Error en búsqueda multi-tabla:', err);
            throw err;
        }
    }

    // 📋 Mostrar panel de selección con tarjetas visuales
    function mostrarPanelSeleccion(resultados, valorBuscado) {
        selectionList.innerHTML = '';
        resultCount.textContent = resultados.length;

        // ⚠️ Detectar alerta cruzada (misma placa/serial en moto Y auto)
        const tieneMoto = resultados.some(r => r.origen === 'registro_motos');
        const tieneAuto = resultados.some(r => r.origen === 'registro_automoviles');
        const tieneVinculado = resultados.some(r => r.origen === 'registro_vinculado');

        if (crossPlateWarning) {
            if ((tieneMoto && tieneAuto) || (tieneVinculado && (tieneMoto || tieneAuto))) {
                crossPlateWarning.innerHTML = `
                    <strong>⚠️ ALERTA CRUZADA DETECTADA:</strong><br>
                    El dato <strong>"${valorBuscado}"</strong> aparece en más de un tipo de registro 
                    (motos/autos/vinculados). Esto puede indicar un caso de clonación de placas/seriales. 
                    Revise cuidadosamente antes de editar.
                `;
                crossPlateWarning.style.display = 'block';
            } else {
                crossPlateWarning.style.display = 'none';
            }
        }

        // Crear tarjetas para cada resultado
        resultados.forEach((res, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: ${res.colorBg};
                border: 2px solid ${res.color};
                border-left: 6px solid ${res.color};
                border-radius: 8px;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            `;
            card.onmouseover = () => card.style.transform = 'translateX(4px)';
            card.onmouseout = () => card.style.transform = 'translateX(0)';

            card.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 1.5rem;">${res.icono}</span>
                        <strong style="color: ${res.color}; font-size: 0.95rem;">${res.tipo}</strong>
                    </div>
                    <div style="font-size: 0.9rem; color: #334155; margin-bottom: 3px;">
                        ${res.linea1}
                    </div>
                    <div style="font-size: 0.85rem; color: #475569; margin-bottom: 3px;">
                        ${res.linea2}
                    </div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">
                        ${res.linea3}
                    </div>
                    <div style="font-size: 0.75rem; color: #0369a1; background: #e0f2fe; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                        🔎 Coincidencia en: <strong>${res.encontrado_por.join(', ')}</strong>
                    </div>
                </div>
                <button class="btn-seleccionar" data-index="${index}" style="
                    padding: 12px 24px;
                    background: ${res.color};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 700;
                    cursor: pointer;
                    white-space: nowrap;
                    font-size: 0.95rem;
                ">✏️ Editar</button>
            `;

            selectionList.appendChild(card);
        });

        // Eventos de botones "Editar"
        document.querySelectorAll('.btn-seleccionar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                cargarResultado(resultados[idx]);
            });
        });

        selectionPanel.style.display = 'block';
        form.style.display = 'none';
        msgBusqueda.style.display = 'none';
    }

    // 🎯 Cargar un resultado específico en el formulario
    async function cargarResultado(resultado) {
        selectionPanel.style.display = 'none';
        if (crossPlateWarning) crossPlateWarning.style.display = 'none';
        showMsgBusq('✅ Cargando registro...', 'success');

        try {
            if (resultado.origen === 'registro_vinculado') {
                cargarVinculado(resultado.datos);
            } else {
                // Para registros individuales (moto/auto), mostrar mensaje y redirigir
                showMsgBusq(
                    `⚠️ Este es un <strong>registro individual</strong> (${resultado.tipo}).<br>
                     <span style="font-size:0.85rem;">Para modificarlo, use el módulo de 
                     <strong>Registro de Vehículos → Modificar</strong>.</span>`,
                    'error'
                );
                setTimeout(() => {
                    msgBusqueda.style.display = 'none';
                    inputBusqueda.focus();
                }, 6000);
            }
        } catch (err) {
            console.error('Error cargando resultado:', err);
            showMsgBusq('❌ Error al cargar: ' + err.message, 'error');
        }
    }

    // 📋 Cargar registro vinculado en el formulario
    function cargarVinculado(data) {
        document.getElementById('mod_vinculado_id').value = data.id;

        // Persona
        document.getElementById('pv_p_nombre1').value = data.primer_nombre || '';
        document.getElementById('pv_p_nombre2').value = data.segundo_nombre || '';
        document.getElementById('pv_p_apellido1').value = data.primer_apellido || '';
        document.getElementById('pv_p_apellido2').value = data.segundo_apellido || '';
        document.getElementById('pv_p_cedula').value = data.cedula || '';
        document.getElementById('pv_p_fecha_nac').value = data.fecha_nacimiento || '';
        document.getElementById('pv_p_edad').value = data.edad || '';
        document.getElementById('pv_p_apodo').value = data.apodo || '';
        document.getElementById('pv_p_marca').value = data.marca_corporal || '';
        document.getElementById('pv_p_nacionalidad').value = data.nacionalidad || '';
        document.getElementById('pv_p_sexo').value = data.sexo || '';
        document.getElementById('pv_p_direccion').value = data.direccion || '';
        document.getElementById('pv_p_tlf_pais').value = data.tlf_pais || '';
        document.getElementById('pv_p_tlf_num').value = data.tlf_numero || '';
        document.getElementById('pv_p_fecha_nac').dispatchEvent(new Event('change'));

        // Fotos persona
        if (data.foto_frontal_persona) {
            const p = document.getElementById('prev_p_frontal');
            p.src = data.foto_frontal_persona; p.style.display = 'block';
        }
        if (data.foto_perfil_izq_persona) {
            const p = document.getElementById('prev_p_izq');
            p.src = data.foto_perfil_izq_persona; p.style.display = 'block';
        }
        if (data.foto_perfil_der_persona) {
            const p = document.getElementById('prev_p_der');
            p.src = data.foto_perfil_der_persona; p.style.display = 'block';
        }

        // Características
        document.getElementById('pv_p_estatura').value = data.estatura_cm ? (data.estatura_cm / 100).toFixed(2) : '';
        document.getElementById('pv_p_color_piel').value = data.color_piel || '';
        document.getElementById('pv_p_color_ojos').value = data.color_ojos || '';
        document.getElementById('pv_p_color_cabello').value = data.color_cabello || '';
        document.getElementById('pv_p_complexion').value = data.complexion || '';

        // Salud
        document.getElementById('pv_p_lentes').value = data.usa_lentes ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_lentes'), 'pv_det-lentes');
        document.getElementById('pv_txt_lentes').value = data.detalle_lentes || '';

        document.getElementById('pv_p_perforaciones').value = data.perforaciones ? 'true' : 'false';
        window.activarCampoPerforacion(document.getElementById('pv_p_perforaciones'));
        document.getElementById('pv_txt_lugar_perforacion').value = data.detalle_perforaciones || '';

        document.getElementById('pv_p_cond_medica').value = data.condicion_medica ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_cond_medica'), 'pv_det-cond');
        document.getElementById('pv_txt_cond').value = data.condicion_medica || '';

        document.getElementById('pv_p_medicamento').value = data.consume_medicamento ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_medicamento'), 'pv_det-med');
        document.getElementById('pv_txt_med').value = data.consume_medicamento || '';

        document.getElementById('pv_p_judicial').value = data.problema_judicial ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_judicial'), 'pv_det-jud');
        document.getElementById('pv_txt_jud').value = data.problema_judicial || '';

        // Vehículo
        document.getElementById('pv_v_tipo').value = data.tipo_vehiculo || '';
        window.cargarMarcasPV();
        document.getElementById('pv_v_placa').value = data.placa || '';
        document.getElementById('pv_v_serial_carro').value = data.serial_carroceria || '';
        document.getElementById('pv_v_serial_motor').value = data.serial_motor || '';
        document.getElementById('pv_v_cilindraje').value = data.cilindraje || '';
        document.getElementById('pv_v_marca').value = data.marca_vehiculo || '';
        window.cargarModelosPV();
        document.getElementById('pv_v_modelo').value = data.modelo_vehiculo || '';
        document.getElementById('pv_v_anio').value = data.anio_vehiculo || '';
        document.getElementById('pv_v_color').value = data.color_vehiculo || '';

        // Fotos vehículo
        if (data.foto_frontal_vehiculo) {
            const p = document.getElementById('prev_v_frontal');
            p.src = data.foto_frontal_vehiculo; p.style.display = 'block';
        }
        if (data.foto_trasera_vehiculo) {
            const p = document.getElementById('prev_v_trasera');
            p.src = data.foto_trasera_vehiculo; p.style.display = 'block';
        }
        if (data.foto_lado_der_vehiculo) {
            const p = document.getElementById('prev_v_der');
            p.src = data.foto_lado_der_vehiculo; p.style.display = 'block';
        }
        if (data.foto_lado_izq_vehiculo) {
            const p = document.getElementById('prev_v_izq');
            p.src = data.foto_lado_izq_vehiculo; p.style.display = 'block';
        }

        // Registro
        document.getElementById('pv_estacion').value = data.estacion_policial || '';
        document.getElementById('pv_dir_detencion').value = data.direccion_detencion || '';
        document.getElementById('pv_observaciones').value = data.observaciones || '';

        setTimeout(() => {
            form.style.display = 'block';
            msgBusqueda.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }

    // 🎯 LISTENER PRINCIPAL DEL BOTÓN BUSCAR
    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const val = inputBusqueda.value.trim();

            if (val.length < 5) {
                showMsgBusq('⚠️ Ingrese al menos 5 caracteres (cédula, placa, serial de carrocería o motor)', 'error');
                return;
            }

            showMsgBusq('🔍 Buscando en todos los registros...', 'success');
            btnBuscar.disabled = true;
            form.style.display = 'none';
            selectionPanel.style.display = 'none';
            if (crossPlateWarning) crossPlateWarning.style.display = 'none';

            try {
                const resultados = await buscarEnTodasLasTablas(val);

                if (resultados.length === 0) {
                    showMsgBusq('❌ No se encontró ningún registro con ese dato.', 'error');
                } else if (resultados.length === 1) {
                    // 1 resultado → cargar directamente
                    showMsgBusq('✅ 1 registro encontrado. Cargando...', 'success');
                    setTimeout(() => cargarResultado(resultados[0]), 300);
                } else {
                    // Múltiples resultados → mostrar panel de selección
                    showMsgBusq(
                        `🔎 Se encontraron <strong>${resultados.length} coincidencias</strong>. Seleccione cuál editar:`,
                        'success'
                    );
                    setTimeout(() => mostrarPanelSeleccion(resultados, val), 300);
                }
            } catch (err) {
                console.error('Error en búsqueda:', err);
                showMsgBusq('❌ Error al buscar: ' + err.message, 'error');
            } finally {
                btnBuscar.disabled = false;
            }
        });

        // Buscar con tecla Enter
        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar.click();
            }
        });
    }

    // Botón cancelar selección
    if (btnCancelSel) {
        btnCancelSel.addEventListener('click', () => {
            selectionPanel.style.display = 'none';
            if (crossPlateWarning) crossPlateWarning.style.display = 'none';
            msgBusqueda.style.display = 'none';
            inputBusqueda.value = '';
            inputBusqueda.focus();
        });
    }
