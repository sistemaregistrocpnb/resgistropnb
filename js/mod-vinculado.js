window.initModVinculado = function() {
    console.log("✅ Módulo mod-vinculado.js cargado correctamente.");

    // ==========================================
    // 🔹 MAPA DE BANDERAS
    // ==========================================
    const isoMap = {
        "Afganistán":"af","Albania":"al","Alemania":"de","Andorra":"ad","Angola":"ao",
        "Antigua y Barbuda":"ag","Arabia Saudita":"sa","Argelia":"dz","Argentina":"ar",
        "Armenia":"am","Australia":"au","Austria":"at","Azerbaiyán":"az","Bahamas":"bs",
        "Bangladés":"bd","Barbados":"bb","Baréin":"bh","Bélgica":"be","Belice":"bz",
        "Benín":"bj","Bielorrusia":"by","Birmania":"mm","Bolivia":"bo",
        "Bosnia y Herzegovina":"ba","Brasil":"br","Brunéi":"bn","Bulgaria":"bg",
        "Burkina Faso":"bf","Burundi":"bi","Bután":"bt","Cabo Verde":"cv","Camboya":"kh",
        "Camerún":"cm","Canadá":"ca","Catar":"qa","Chad":"td","Chile":"cl","China":"cn",
        "Chipre":"cy","Colombia":"co","Comoras":"km","Congo (Rep.)":"cg","Congo (R.D.)":"cd",
        "Corea del Norte":"kp","Corea del Sur":"kr","Costa Rica":"cr",
        "Costa de Marfil":"ci","Croacia":"hr","Cuba":"cu","Dinamarca":"dk",
        "Dominica":"dm","Ecuador":"ec","Egipto":"eg","El Salvador":"sv",
        "Emiratos Árabes Unidos":"ae","Eritrea":"er","Eslovaquia":"sk",
        "Eslovenia":"si","España":"es","Estados Unidos":"us","Estonia":"ee",
        "Etiopía":"et","Filipinas":"ph","Finlandia":"fi","Fiyi":"fj","Francia":"fr",
        "Gabón":"ga","Gambia":"gm","Georgia":"ge","Ghana":"gh","Granada":"gd",
        "Grecia":"gr","Guatemala":"gt","Guinea":"gn","Guinea Ecuatorial":"gq",
        "Guinea-Bisáu":"gw","Guyana":"gy","Haití":"ht","Honduras":"hn",
        "Hungría":"hu","India":"in","Indonesia":"id","Irak":"iq","Irán":"ir",
        "Irlanda":"ie","Islandia":"is","Israel":"il","Italia":"it","Jamaica":"jm",
        "Japón":"jp","Jordania":"jo","Kazajistán":"kz","Kenia":"ke",
        "Kirguistán":"kg","Kiribati":"ki","Kuwait":"kw","Laos":"la","Lesoto":"ls",
        "Letonia":"lv","Líbano":"lb","Liberia":"lr","Libia":"ly",
        "Liechtenstein":"li","Lituania":"lt","Luxemburgo":"lu",
        "Macedonia del Norte":"mk","Madagascar":"mg","Malasia":"my",
        "Malaui":"mw","Maldivas":"mv","Malí":"ml","Malta":"mt",
        "Marruecos":"ma","Mauricio":"mu","Mauritania":"mr","México":"mx",
        "Micronesia":"fm","Moldavia":"md","Mónaco":"mc","Mongolia":"mn",
        "Montenegro":"me","Mozambique":"mz","Namibia":"na","Nauru":"nr",
        "Nepal":"np","Nicaragua":"ni","Níger":"ne","Nigeria":"ng",
        "Noruega":"no","Nueva Zelanda":"nz","Omán":"om","Países Bajos":"nl",
        "Pakistán":"pk","Palaos":"pw","Palestina":"ps","Panamá":"pa",
        "Papúa Nueva Guinea":"pg","Paraguay":"py","Perú":"pe","Polonia":"pl",
        "Portugal":"pt","Puerto Rico":"pr","Reino Unido":"gb",
        "Rep. Centroafricana":"cf","Rep. Checa":"cz","Rep. Dominicana":"do",
        "Ruanda":"rw","Rumania":"ro","Rusia":"ru","Samoa":"ws",
        "San Marino":"sm","Santa Lucía":"lc","Santo Tomé y Príncipe":"st",
        "San Vicente y las Granadinas":"vc","Senegal":"sn","Serbia":"rs",
        "Seychelles":"sc","Sierra Leona":"sl","Singapur":"sg","Siria":"sy",
        "Somalia":"so","Sudáfrica":"za","Sudán":"sd","Sudán del Sur":"ss",
        "Suecia":"se","Suiza":"ch","Surinam":"sr","Esuatini":"sz",
        "Tayikistán":"tj","Tanzania":"tz","Tailandia":"th",
        "Timor Oriental":"tl","Togo":"tg","Tonga":"to",
        "Trinidad y Tobago":"tt","Túnez":"tn","Turquía":"tr",
        "Turkmenistán":"tm","Tuvalu":"tv","Ucrania":"ua","Uganda":"ug",
        "Uruguay":"uy","Uzbekistán":"uz","Vanuatu":"vu",
        "Ciudad del Vaticano":"va","Venezuela":"ve","Vietnam":"vn",
        "Yemen":"ye","Yibuti":"dj","Zambia":"zm","Zimbabue":"zw"
    };

    // ==========================================
    // 🔹 FUNCIONES UI
    // ==========================================
    window.toggleCampo = function(select, targetId) {
        const el = document.getElementById(targetId);
        const input = el?.querySelector('input');
        if (select.value === 'true') {
            if (el) el.style.display = 'block';
            if (input) input.required = true;
        } else {
            if (el) el.style.display = 'none';
            if (input) { input.value = ''; input.required = false; }
        }
    };

    window.activarCampoPerforacion = function(select) {
        const caja = document.getElementById('pv_box-lugar-perforacion');
        const input = document.getElementById('pv_txt_lugar_perforacion');
        if (!caja || !input) return;
        if (select.value === 'true') { caja.style.display = 'block'; input.required = true; }
        else { caja.style.display = 'none'; input.value = ''; input.required = false; }
    };

    window.convertirEstatura = function() {
        const inputM = document.getElementById('pv_p_estatura');
        const inputCm = document.getElementById('pv_p_estatura_cm');
        if (!inputM) return null;
        const metros = parseFloat(inputM.value);
        if (!isNaN(metros) && metros >= 0.50 && metros <= 2.30) {
            if (inputCm) inputCm.value = Math.round(metros * 100);
            return parseInt(inputCm.value);
        }
        return null;
    };

    // ==========================================
    // 🔹 BÚSQUEDA Y LLENADO
    // ==========================================
    const btnBuscar = document.getElementById('btn_buscar_mod');
    const inputBusqueda = document.getElementById('mod_busqueda_input');
    const msgBusqueda = document.getElementById('mod_msg_busqueda');
    const form = document.getElementById('form-mod-vinculado');

    const showMsgBusq = (txt, type) => {
        msgBusqueda.innerHTML = txt;
        msgBusqueda.className = `msg ${type}`;
        msgBusqueda.style.display = 'block';
    };

    // ✅ LISTENER DEL BOTÓN BUSCAR
    if (btnBuscar && inputBusqueda) {
        console.log("✅ Botón buscar vinculado correctamente");
        
        btnBuscar.addEventListener('click', async () => {
            console.log("🔍 Botón buscar clickeado");
            const val = inputBusqueda.value.trim().toUpperCase();
            
            if (val.length < 5) {
                showMsgBusq('⚠️ Ingrese al menos 5 caracteres (cédula o placa)', 'error');
                return;
            }

            showMsgBusq('🔍 Buscando...', 'success');
            btnBuscar.disabled = true;
            form.style.display = 'none';

            try {
                // Buscar en registro_vinculado por cédula O placa
                const { data, error } = await window.supabaseClient
                    .from('registro_vinculado')
                    .select('*')
                    .or(`cedula.eq.${val},placa.eq.${val}`)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    console.log("✅ Registro encontrado:", data);
                    showMsgBusq('✅ Registro encontrado. Cargando...', 'success');
                    document.getElementById('mod_vinculado_id').value = data.id;

                    // Llenar campos de persona
                    document.getElementById('pv_p_nombre1').value = data.primer_nombre || '';
                    document.getElementById('pv_p_nombre2').value = data.segundo_nombre || '';
                    document.getElementById('pv_p_apellido1').value = data.primer_apellido || '';
                    document.getElementById('pv_p_apellido2').value = data.segundo_apellido || '';
                    document.getElementById('pv_p_cedula').value = data.cedula || '';
                    document.getElementById('pv_p_marca').value = data.marca_corporal || '';
                    document.getElementById('pv_p_apodo').value = data.apodo || '';
                    document.getElementById('pv_p_fecha_nac').value = data.fecha_nacimiento || '';
                    document.getElementById('pv_p_nacionalidad').value = data.nacionalidad || '';
                    document.getElementById('pv_p_sexo').value = data.sexo || '';
                    document.getElementById('pv_p_direccion').value = data.direccion || '';
                    document.getElementById('pv_p_tlf_pais').value = data.tlf_pais || '';
                    document.getElementById('pv_p_tlf_num').value = data.tlf_numero || '';

                    // Calcular edad
                    document.getElementById('pv_p_fecha_nac').dispatchEvent(new Event('change'));

                    // Fotos persona
                    if (data.foto_frontal_persona) {
                        const img = document.getElementById('prev_p_frontal');
                        img.src = data.foto_frontal_persona; img.style.display = 'block';
                    }
                    if (data.foto_perfil_izq_persona) {
                        const img = document.getElementById('prev_p_izq');
                        img.src = data.foto_perfil_izq_persona; img.style.display = 'block';
                    }
                    if (data.foto_perfil_der_persona) {
                        const img = document.getElementById('prev_p_der');
                        img.src = data.foto_perfil_der_persona; img.style.display = 'block';
                    }

                    // Características físicas
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
                    if (window.cargarMarcasPV) window.cargarMarcasPV();
                    document.getElementById('pv_v_placa').value = data.placa || '';
                    document.getElementById('pv_v_serial_carro').value = data.serial_carroceria || '';
                    document.getElementById('pv_v_serial_motor').value = data.serial_motor || '';
                    document.getElementById('pv_v_cilindraje').value = data.cilindraje || '';
                    document.getElementById('pv_v_marca').value = data.marca_vehiculo || '';
                    if (window.cargarModelosPV) window.cargarModelosPV();
                    document.getElementById('pv_v_modelo').value = data.modelo_vehiculo || '';
                    document.getElementById('pv_v_anio').value = data.anio_vehiculo || '';
                    document.getElementById('pv_v_color').value = data.color_vehiculo || '';

                    // Fotos vehículo
                    if (data.foto_frontal_vehiculo) {
                        const img = document.getElementById('prev_v_frontal');
                        img.src = data.foto_frontal_vehiculo; img.style.display = 'block';
                    }
                    if (data.foto_trasera_vehiculo) {
                        const img = document.getElementById('prev_v_trasera');
                        img.src = data.foto_trasera_vehiculo; img.style.display = 'block';
                    }
                    if (data.foto_lado_der_vehiculo) {
                        const img = document.getElementById('prev_v_der');
                        img.src = data.foto_lado_der_vehiculo; img.style.display = 'block';
                    }
                    if (data.foto_lado_izq_vehiculo) {
                        const img = document.getElementById('prev_v_izq');
                        img.src = data.foto_lado_izq_vehiculo; img.style.display = 'block';
                    }

                    // Registro
                    document.getElementById('pv_estacion').value = data.estacion_policial || '';
                    document.getElementById('pv_dir_detencion').value = data.direccion_detencion || '';
                    document.getElementById('pv_observaciones').value = data.observaciones || '';

                    setTimeout(() => {
                        form.style.display = 'block';
                        msgBusqueda.style.display = 'none';
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 500);
                } else {
                    showMsgBusq('❌ No se encontró ningún registro con esa cédula o placa.', 'error');
                }
            } catch (err) {
                console.error('Error al buscar:', err);
                showMsgBusq('❌ Error al buscar: ' + err.message, 'error');
            } finally {
                btnBuscar.disabled = false;
            }
        });

        // También buscar con Enter
        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar.click();
            }
        });
    } else {
        console.error("❌ NO se encontró el botón buscar o el input de búsqueda");
    }

    // ==========================================
    // 🔹 PREVISUALIZACIÓN DE FOTOS
    // ==========================================
    const setupPhotoPreview = (inputId, imgId) => {
        const input = document.getElementById(inputId);
        const img = document.getElementById(imgId);
        if (!input || !img) return;
        input.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => { img.src = e.target.result; img.style.display = 'block'; };
                reader.readAsDataURL(this.files[0]);
            }
        });
    };

    setupPhotoPreview('pv_foto_p_frontal', 'prev_p_frontal');
    setupPhotoPreview('pv_foto_p_izq', 'prev_p_izq');
    setupPhotoPreview('pv_foto_p_der', 'prev_p_der');
    setupPhotoPreview('pv_foto_v_frontal', 'prev_v_frontal');
    setupPhotoPreview('pv_foto_v_trasera', 'prev_v_trasera');
    setupPhotoPreview('pv_foto_v_der', 'prev_v_der');
    setupPhotoPreview('pv_foto_v_izq', 'prev_v_izq');

    // ==========================================
    // 🔹 TELÉFONO SOLO NUMÉRICO
    // ==========================================
    const tlfNumInput = document.getElementById('pv_p_tlf_num');
    if (tlfNumInput) {
        tlfNumInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // ==========================================
    // 🔹 AÑOS Y EDAD
    // ==========================================
    const anioSelect = document.getElementById('pv_v_anio');
    if (anioSelect) {
        const currentYear = new Date().getFullYear();
        anioSelect.innerHTML = '<option value="">Seleccione...</option>';
        for (let y = currentYear; y >= 1990; y--) {
            anioSelect.innerHTML += `<option value="${y}">${y}</option>`;
        }
    }

    const fechaNac = document.getElementById('pv_p_fecha_nac');
    const edadInput = document.getElementById('pv_p_edad');
    if (fechaNac && edadInput) {
        fechaNac.addEventListener('change', () => {
            if (!fechaNac.value) return;
            const hoy = new Date(), nac = new Date(fechaNac.value);
            let edad = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
            edadInput.value = (edad >= 0 && edad <= 120) ? edad : '';
        });
    }

    // ==========================================
    // 🔹 GUARDAR CAMBIOS
    // ==========================================
    const msgForm = document.getElementById('msg-mod-vinculado');
    const btnSubmit = form?.querySelector('.btn-submit');

    const mostrarError = (t) => {
        if (msgForm) {
            msgForm.innerHTML = '❌ ' + t;
            msgForm.className = 'msg error';
            msgForm.style.display = 'block';
        }
    };

    if (form && btnSubmit) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }

            const cedula = document.getElementById('pv_p_cedula').value.trim();
            if (cedula.length < 7) return mostrarError('La cédula debe tener entre 7 y 8 dígitos.');

            const idRegistro = document.getElementById('mod_vinculado_id').value;
            if (!idRegistro) return mostrarError('No hay registro seleccionado.');

            btnSubmit.disabled = true;
            btnSubmit.textContent = '⏳ Guardando...';
            msgForm.style.display = 'none';

            try {
                const bucket = window.supabaseClient.storage.from('fotos_personas');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();

                const uploadIfChanged = async (inputId, suffix) => {
                    const fileInput = document.getElementById(inputId);
                    if (fileInput && fileInput.files.length > 0) {
                        const file = fileInput.files[0];
                        const path = `${uid}/mod_${ts}_${suffix}.jpg`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600' });
                        if (error) throw error;
                        return bucket.getPublicUrl(path).data.publicUrl;
                    }
                    return null;
                };

                const data = {
                    primer_nombre: document.getElementById('pv_p_nombre1').value.trim(),
                    segundo_nombre: document.getElementById('pv_p_nombre2').value.trim() || null,
                    primer_apellido: document.getElementById('pv_p_apellido1').value.trim(),
                    segundo_apellido: document.getElementById('pv_p_apellido2').value.trim() || null,
                    cedula: cedula,
                    fecha_nacimiento: document.getElementById('pv_p_fecha_nac').value,
                    edad: parseInt(document.getElementById('pv_p_edad').value) || 0,
                    apodo: document.getElementById('pv_p_apodo').value.trim() || null,
                    marca_corporal: document.getElementById('pv_p_marca').value.trim() || null,
                    nacionalidad: document.getElementById('pv_p_nacionalidad').value,
                    sexo: document.getElementById('pv_p_sexo').value,
                    direccion: document.getElementById('pv_p_direccion').value.trim() || null,
                    tlf_pais: document.getElementById('pv_p_tlf_pais').value || null,
                    tlf_numero: document.getElementById('pv_p_tlf_num').value.trim() || null,
                    estatura_cm: window.convertirEstatura(),
                    color_piel: document.getElementById('pv_p_color_piel').value,
                    color_ojos: document.getElementById('pv_p_color_ojos').value,
                    color_cabello: document.getElementById('pv_p_color_cabello').value,
                    complexion: document.getElementById('pv_p_complexion').value,
                    condicion_medica: document.getElementById('pv_p_cond_medica').value === 'true' ? document.getElementById('pv_txt_cond').value.trim() : null,
                    consume_medicamento: document.getElementById('pv_p_medicamento').value === 'true' ? document.getElementById('pv_txt_med').value.trim() : null,
                    problema_judicial: document.getElementById('pv_p_judicial').value === 'true' ? document.getElementById('pv_txt_jud').value.trim() : null,
                    usa_lentes: document.getElementById('pv_p_lentes').value === 'true',
                    detalle_lentes: document.getElementById('pv_p_lentes').value === 'true' ? document.getElementById('pv_txt_lentes').value.trim() : null,
                    perforaciones: document.getElementById('pv_p_perforaciones').value === 'true',
                    detalle_perforaciones: document.getElementById('pv_p_perforaciones').value === 'true' ? document.getElementById('pv_txt_lugar_perforacion').value.trim() : null,
                    tipo_vehiculo: document.getElementById('pv_v_tipo').value,
                    placa: document.getElementById('pv_v_placa').value.trim().toUpperCase(),
                    serial_carroceria: document.getElementById('pv_v_serial_carro').value.trim(),
                    serial_motor: document.getElementById('pv_v_serial_motor').value.trim() || null,
                    cilindraje: document.getElementById('pv_v_cilindraje').value || null,
                    color_vehiculo: document.getElementById('pv_v_color').value,
                    anio_vehiculo: parseInt(document.getElementById('pv_v_anio').value),
                    marca_vehiculo: document.getElementById('pv_v_marca').value,
                    modelo_vehiculo: document.getElementById('pv_v_modelo').value,
                    estacion_policial: document.getElementById('pv_estacion').value,
                    direccion_detencion: document.getElementById('pv_dir_detencion').value.trim() || null,
                    observaciones: document.getElementById('pv_observaciones').value.trim() || null
                };

                // Subir fotos si cambiaron
                const newFoto1 = await uploadIfChanged('pv_foto_p_frontal', 'p_f');
                if (newFoto1) data.foto_frontal_persona = newFoto1;
                const newFoto2 = await uploadIfChanged('pv_foto_p_izq', 'p_i');
                if (newFoto2) data.foto_perfil_izq_persona = newFoto2;
                const newFoto3 = await uploadIfChanged('pv_foto_p_der', 'p_d');
                if (newFoto3) data.foto_perfil_der_persona = newFoto3;
                const newVFoto1 = await uploadIfChanged('pv_foto_v_frontal', 'v_f');
                if (newVFoto1) data.foto_frontal_vehiculo = newVFoto1;
                const newVFoto2 = await uploadIfChanged('pv_foto_v_trasera', 'v_t');
                if (newVFoto2) data.foto_trasera_vehiculo = newVFoto2;
                const newVFoto3 = await uploadIfChanged('pv_foto_v_der', 'v_rd');
                if (newVFoto3) data.foto_lado_der_vehiculo = newVFoto3;
                const newVFoto4 = await uploadIfChanged('pv_foto_v_izq', 'v_ri');
                if (newVFoto4) data.foto_lado_izq_vehiculo = newVFoto4;

                const { error } = await window.supabaseClient
                    .from('registro_vinculado')
                    .update(data)
                    .eq('id', idRegistro);

                if (error) throw error;

                msgForm.innerHTML = '✅ Cambios guardados exitosamente.';
                msgForm.className = 'msg success';
                msgForm.style.display = 'block';

                setTimeout(() => {
                    form.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    msgForm.style.display = 'none';
                    document.querySelectorAll('.img-preview').forEach(i => i.style.display = 'none');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 3000);

            } catch (err) {
                console.error('Error al guardar:', err);
                mostrarError('Error al guardar: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = '💾 Guardar Cambios';
            }
        });
    }

    console.log("✅ Módulo mod-vinculado.js inicializado correctamente");
};
