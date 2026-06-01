window.initRegVinculado = function() {
    console.log("✅ Módulo reg-vinculado.js cargado.");

    // ==========================================
    // 🔹 1. LISTAS (Marcas y Modelos)
    // ==========================================
    const marcasModelosMoto = { "Empire Keeway": ["Matrix", "Owen 200"], "Yamaha": ["YBR 125", "FZ16"], "Honda": ["CG 150", "CB 190R"], "Otra": ["Otra"] };
    const marcasModelosAuto = { "Toyota": ["Corolla", "Yaris"], "Chevrolet": ["Aveo", "Spark"], "Ford": ["Fiesta", "Focus"], "Otra": ["Otra"] };

    // ==========================================
    // 🔹 2. FUNCIONES UI
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
            const cm = Math.round(metros * 100);
            if (inputCm) inputCm.value = cm; return cm;
        }
        return null;
    };

    window.cargarMarcasPV = function() {
        const tipo = document.getElementById('pv_v_tipo').value;
        const marcaSelect = document.getElementById('pv_v_marca');
        const modeloSelect = document.getElementById('pv_v_modelo');
        const boxCilindro = document.getElementById('pv_box_cilindro');
        marcaSelect.innerHTML = '<option value="">Seleccione marca...</option>';
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';
        if (tipo === 'Motocicleta') {
            Object.keys(marcasModelosMoto).sort().forEach(m => marcaSelect.innerHTML += `<option value="${m}">${m}</option>`);
            boxCilindro.style.display = 'block';
        } else if (tipo === 'Automóvil') {
            Object.keys(marcasModelosAuto).sort().forEach(m => marcaSelect.innerHTML += `<option value="${m}">${m}</option>`);
            boxCilindro.style.display = 'none';
        }
    };

    window.cargarModelosPV = function() {
        const tipo = document.getElementById('pv_v_tipo').value;
        const marca = document.getElementById('pv_v_marca').value;
        const modeloSelect = document.getElementById('pv_v_modelo');
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';
        let lista = tipo === 'Motocicleta' ? marcasModelosMoto[marca] : marcasModelosAuto[marca];
        if (lista) lista.forEach(mod => modeloSelect.innerHTML += `<option value="${mod}">${mod}</option>`);
    };

    // Dropdown de Banderas
    const nativeSelect = document.getElementById('pv_p_tlf_pais');
    const displayBox = document.querySelector('.phone-display');
    const optionsBox = document.querySelector('.phone-options');
    const flagImg = document.getElementById('pv_tlf-flag-img');
    const codeText = document.getElementById('pv_tlf-code-text');
    
    const isoMap = { "Venezuela":"ve", "Colombia":"co", "Estados Unidos":"us", "EE.UU.":"us" };

    if (optionsBox && nativeSelect && displayBox) {
        optionsBox.innerHTML = '';
        Array.from(nativeSelect.options).forEach(opt => {
            if (!opt.value) return;
            const iso = isoMap[opt.text] || opt.value.replace('+','').toLowerCase();
            const div = document.createElement('div');
            div.className = 'phone-option';
            div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country">${opt.text}</span>`;
            div.addEventListener('click', () => {
                nativeSelect.value = opt.value;
                flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                codeText.textContent = opt.value;
                optionsBox.style.display = 'none';
            });
            optionsBox.appendChild(div);
        });
        displayBox.addEventListener('click', (e) => { e.stopPropagation(); optionsBox.style.display = optionsBox.style.display === 'block' ? 'none' : 'block'; });
        document.addEventListener('click', (e) => { if (!e.target.closest('.phone-dropdown-wrapper')) optionsBox.style.display = 'none'; });
    }

    // Vista Previa de Fotos
    const setupPreview = (idIn, idImg) => {
        const input = document.getElementById(idIn), preview = document.getElementById(idImg);
        if (!input || !preview) return;
        input.addEventListener('change', function() {
            const f = this.files[0];
            if (f) { const r = new FileReader(); r.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; }; r.readAsDataURL(f); }
            else preview.style.display = 'none';
        });
    };
    ['pv_foto_p_frontal','pv_foto_p_izq','pv_foto_p_der'].forEach((id, i) => setupPreview(id, `prev_p_frontal,prev_p_izq,prev_p_der`.split(',')[i]));
    ['pv_foto_v_frontal','pv_foto_v_trasera','pv_foto_v_der','pv_foto_v_izq'].forEach((id, i) => setupPreview(id, `prev_v_frontal,prev_v_trasera,prev_v_der,prev_v_izq`.split(',')[i]));

    // ==========================================
    // 🔹 3. VALIDACIÓN (Cédula, Placa, Seriales)
    // ==========================================
    function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }

    async function verificarDuplicado(inputId, msgId, tablas, columna) {
        const input = document.getElementById(inputId);
        const msgEl = document.getElementById(msgId);
        if (!input || !msgEl) return;
        const val = input.value.trim().toUpperCase();
        if (!val) { input.classList.remove('input-valid', 'input-error'); msgEl.textContent = ''; return; }
        msgEl.textContent = '🔍 Verificando...'; 
        try {
            let found = false;
            for (const tabla of tablas) {
                const { data } = await window.supabaseClient.from(tabla).select('id').ilike(columna, val).limit(1);
                if (data && data.length > 0) { found = true; break; }
            }
            if (found) { input.classList.add('input-error'); msgEl.textContent = '❌ Ya registrado'; } 
            else { input.classList.add('input-valid'); msgEl.textContent = '✅ Disponible'; }
        } catch (e) { msgEl.textContent = '⚠️ Error'; }
    }

    const validateCedula = debounce(() => verificarDuplicado('pv_p_cedula', 'pv-msg-cedula', ['registro_personas'], 'cedula'), 600);
    const elCedula = document.getElementById('pv_p_cedula'); if (elCedula) elCedula.addEventListener('input', validateCedula);

    const validatePlaca = debounce(() => verificarDuplicado('pv_v_placa', 'pv-msg-placa', ['registro_motos', 'registro_automoviles'], 'placa'), 600);
    const elPlaca = document.getElementById('pv_v_placa'); if (elPlaca) elPlaca.addEventListener('input', validatePlaca);

    const validateCarro = debounce(() => verificarDuplicado('pv_v_serial_carro', 'pv-msg-carro', ['registro_motos', 'registro_automoviles'], 'serial_carroceria'), 600);
    const elCarro = document.getElementById('pv_v_serial_carro'); if (elCarro) elCarro.addEventListener('input', validateCarro);

    const validateMotor = debounce(() => verificarDuplicado('pv_v_serial_motor', 'pv-msg-motor', ['registro_motos', 'registro_automoviles'], 'serial_motor'), 600);
    const elMotor = document.getElementById('pv_v_serial_motor'); if (elMotor) elMotor.addEventListener('input', validateMotor);

    // ==========================================
    // 🔹 4. ENVÍO DEL FORMULARIO
    // ==========================================
    const form = document.getElementById('form-reg-vinculado');
    const btn = form?.querySelector('.btn-submit');
    const msg = document.getElementById('msg-reg-vinculado');
    const mostrarError = (t) => { if(msg){msg.textContent='❌ '+t; msg.className='msg error'; msg.style.display='block';} };

    if (!form || !btn) return;

    // Inicializar
    window.cargarMarcasPV();

    // Validación de campos numéricos
    const cedulaInput = document.getElementById('pv_p_cedula');
    if (cedulaInput) cedulaInput.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        // ✅ AQUÍ ES DONDE SE LEEN LOS VALORES
        // Lee los valores directamente del DOM al momento del submit
        const valComplexion = document.getElementById('pv_p_complexion')?.value;
        const valMarca = document.getElementById('pv_p_marca')?.value.trim();
        
        const valCondMedicaSel = document.getElementById('pv_p_cond_medica')?.value;
        const valCondMedicaTxt = document.getElementById('pv_txt_cond')?.value.trim();
        
        const valMedSel = document.getElementById('pv_p_medicamento')?.value;
        const valMedTxt = document.getElementById('pv_txt_med')?.value.trim();
        
        const valJudSel = document.getElementById('pv_p_judicial')?.value;
        const valJudTxt = document.getElementById('pv_txt_jud')?.value.trim();

        console.log("DEBUG - Valores leídos:", {
            complexion: valComplexion,
            marca: valMarca,
            condMedica: valCondMedicaSel,
            medicamento: valMedSel
        });

        if (valCondMedicaSel === 'true' && !valCondMedicaTxt) return mostrarError('Describa la condición médica.');
        if (valMedSel === 'true' && !valMedTxt) return mostrarError('Indique el medicamento.');

        btn.disabled = true; btn.textContent = '⏳ Registrando...'; msg.style.display = 'none';

        try {
            const bucket = window.supabaseClient.storage.from('fotos_personas');
            const uid = sessionStorage.getItem('pnb_user_id') || 'user';
            const ts = Date.now();

            const uploadFile = async (inputId, suffix) => {
                const file = document.getElementById(inputId).files[0];
                if (!file) throw new Error('Falta foto: ' + inputId);
                const { error } = await bucket.upload(`${uid}/${ts}_${suffix}.jpg`, file, { cacheControl: '3600' });
                if (error) throw error;
                return bucket.getPublicUrl(`${uid}/${ts}_${suffix}.jpg`).data.publicUrl;
            };

            const urls = await Promise.all([
                uploadFile('pv_foto_p_frontal', 'f'), uploadFile('pv_foto_p_izq', 'i'), uploadFile('pv_foto_p_der', 'd'),
                uploadFile('pv_foto_v_frontal', 'vf'), uploadFile('pv_foto_v_trasera', 'vt'), uploadFile('pv_foto_v_der', 'vd'), uploadFile('pv_foto_v_izq', 'vi')
            ]);

            const data = {
                // Persona
                primer_nombre: document.getElementById('pv_p_nombre1').value.trim(),
                segundo_nombre: document.getElementById('pv_p_nombre2').value.trim() || null,
                primer_apellido: document.getElementById('pv_p_apellido1').value.trim(),
                segundo_apellido: document.getElementById('pv_p_apellido2').value.trim() || null,
                cedula: document.getElementById('pv_p_cedula').value.trim(),
                fecha_nacimiento: document.getElementById('pv_p_fecha_nac').value,
                edad: parseInt(document.getElementById('pv_p_edad').value) || 0,
                apodo: document.getElementById('pv_p_apodo').value.trim() || null,
                nacionalidad: document.getElementById('pv_p_nacionalidad').value,
                sexo: document.getElementById('pv_p_sexo').value,
                direccion: document.getElementById('pv_p_direccion').value.trim() || null,
                tlf_pais: document.getElementById('pv_p_tlf_pais').value || null,
                tlf_numero: document.getElementById('pv_p_tlf_num').value.trim() || null,
                estatura_cm: window.convertirEstatura(),
                color_piel: document.getElementById('pv_p_color_piel').value,
                color_ojos: document.getElementById('pv_p_color_ojos').value,
                color_cabello: document.getElementById('pv_p_color_cabello').value,
                
                // ✅ MAPEO EXACTO A COLUMNS DE BD
                complexion: valComplexion || null, // Usa la variable leída arriba
                marca_corporal: valMarca || null,  // Usa la variable leída arriba
                
                usa_lentes: document.getElementById('pv_p_lentes').value === 'true',
                detalle_lentes: document.getElementById('pv_p_lentes').value === 'true' ? document.getElementById('pv_txt_lentes').value.trim() : null,
                perforaciones: document.getElementById('pv_p_perforaciones').value === 'true',
                detalle_perforaciones: document.getElementById('pv_p_perforaciones').value === 'true' ? document.getElementById('pv_txt_lugar_perforacion').value.trim() : null,
                
                // ✅ MAPEO EXACTO A COLUMNS DE BD
                condicion_medica: valCondMedicaSel === 'true' ? (valCondMedicaTxt || null) : null,
                consume_medicamento: valMedSel === 'true' ? (valMedTxt || null) : null,
                problema_judicial: valJudSel === 'true' ? (valJudTxt || null) : null,

                foto_frontal_persona: urls[0], foto_perfil_izq_persona: urls[1], foto_perfil_der_persona: urls[2],

                // Vehículo
                tipo_vehiculo: document.getElementById('pv_v_tipo').value,
                placa: document.getElementById('pv_v_placa').value.trim().toUpperCase(),
                serial_carroceria: document.getElementById('pv_v_serial_carro').value.trim(),
                serial_motor: document.getElementById('pv_v_serial_motor').value.trim() || null,
                cilindraje: document.getElementById('pv_v_cilindraje').value || null,
                color_vehiculo: document.getElementById('pv_v_color').value,
                anio_vehiculo: parseInt(document.getElementById('pv_v_anio').value),
                marca_vehiculo: document.getElementById('pv_v_marca').value,
                modelo_vehiculo: document.getElementById('pv_v_modelo').value,
                foto_frontal_vehiculo: urls[3], foto_trasera_vehiculo: urls[4], foto_lado_der_vehiculo: urls[5], foto_lado_izq_vehiculo: urls[6],

                // Registro
                estacion_policial: document.getElementById('pv_estacion').value,
                direccion_detencion: document.getElementById('pv_dir_detencion').value.trim() || null,
                observaciones: document.getElementById('pv_observaciones').value.trim() || null
            };

            const { error } = await window.supabaseClient.from('registro_vinculado').insert([data]);
            if (error) throw error;

            msg.textContent = '✅ Registro creado exitosamente.'; 
            msg.className = 'msg success'; msg.style.display = 'block';
            setTimeout(() => { msg.style.display = 'none'; form.reset(); document.querySelectorAll('.img-preview').forEach(i => i.style.display = 'none'); }, 4000);
            
        } catch (err) {
            console.error('Error:', err);
            mostrarError('❌ ' + err.message);
        } finally {
            btn.disabled = false; btn.textContent = '✅ Registrar Persona y Vehículo';
        }
    });
};
