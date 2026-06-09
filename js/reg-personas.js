window.initRegPersonas = function() {
    console.log("✅ Módulo reg-personas.js cargado correctamente.");

    // ==========================================
    // 🔹 1. FUNCIONES GLOBALES
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
        const caja = document.getElementById('box-lugar-perforacion');
        const input = document.getElementById('txt_lugar_perforacion');
        if (!caja || !input) return;
        if (select.value === 'true') { caja.style.display = 'block'; input.required = true; }
        else { caja.style.display = 'none'; input.value = ''; input.required = false; }
    };

    window.convertirEstatura = function() {
        const inputM = document.getElementById('p_estatura');
        const inputCm = document.getElementById('p_estatura_cm');
        if (!inputM) return null;
        const metros = parseFloat(inputM.value);
        if (!isNaN(metros) && metros >= 0.50 && metros <= 2.30) {
            const cm = Math.round(metros * 100);
            if (inputCm) inputCm.value = cm;
            return cm;
        }
        return null;
    };

    // ==========================================
    // 🔹 2. REFERENCIAS DEL DOM
    // ==========================================
    const form = document.getElementById('form-reg-personas');
    const cedulaInput = document.getElementById('p_cedula');
    const cedulaStatus = document.getElementById('cedula-status');
    const tlfNumInput = document.getElementById('p_tlf_num');
    const estaturaInput = document.getElementById('p_estatura');
    const fechaNac = document.getElementById('p_fecha_nac');
    const edadInput = document.getElementById('p_edad');
    const btn = form?.querySelector('.btn-submit');
    const msg = document.getElementById('msg-reg-personas');

    // ==========================================
    // 🔹 3. DROPDOWN DE BANDERAS
    // ==========================================
    const nativeSelect = document.getElementById('p_tlf_pais');
    const displayBox = document.querySelector('.phone-display');
    const optionsBox = document.querySelector('.phone-options');
    const flagImg = document.getElementById('tlf-flag-img');
    const codeText = document.getElementById('tlf-code-text');
    const countryText = document.getElementById('tlf-country-text');

    const isoMap = {
        "Afganistán":"af","Albania":"al","Alemania":"de","Andorra":"ad","Angola":"ao",
        "Antigua y Barbuda":"ag","Arabia Saudita":"sa","Argelia":"dz","Argentina":"ar",
        "Armenia":"am","Australia":"au","Austria":"at","Azerbaiyán":"az","Bahamas":"bs",
        "Baréin":"bh","Bangladés":"bd","Barbados":"bb","Bélgica":"be","Belice":"bz",
        "Benín":"bj","Bielorrusia":"by","Birmania":"mm","Bolivia":"bo","Bosnia y Herzegovina":"ba",
        "Botsuana":"bw","Brasil":"br","Brunéi":"bn","Bulgaria":"bg","Burkina Faso":"bf",
        "Burundi":"bi","Bután":"bt","Cabo Verde":"cv","Camboya":"kh","Camerún":"cm",
        "Canadá":"ca","Catar":"qa","Rep. Centroafricana":"cf","Chad":"td","Rep. Checa":"cz",
        "Chile":"cl","China":"cn","Chipre":"cy","Colombia":"co","Comoras":"km",
        "Congo (Rep.)":"cg","Congo (R.D.)":"cd","Corea del Norte":"kp","Corea del Sur":"kr",
        "Costa de Marfil":"ci","Costa Rica":"cr","Croacia":"hr","Cuba":"cu","Dinamarca":"dk",
        "Dominica":"dm","Ecuador":"ec","Egipto":"eg","El Salvador":"sv",
        "Emiratos Árabes":"ae","Eritrea":"er","Eslovaquia":"sk","Eslovenia":"si","España":"es",
        "Estados Unidos":"us","Estonia":"ee","Etiopía":"et","Filipinas":"ph","Finlandia":"fi",
        "Fiyi":"fj","Francia":"fr","Gabón":"ga","Gambia":"gm","Georgia":"ge","Ghana":"gh",
        "Granada":"gd","Grecia":"gr","Guatemala":"gt","Guinea":"gn","Guinea Ecuatorial":"gq",
        "Guinea-Bisáu":"gw","Guyana":"gy","Haití":"ht","Honduras":"hn","Hungría":"hu",
        "India":"in","Indonesia":"id","Irak":"iq","Irán":"ir","Irlanda":"ie","Islandia":"is",
        "Israel":"il","Italia":"it","Jamaica":"jm","Japón":"jp","Jordania":"jo",
        "Kazajistán":"kz","Kenia":"ke","Kirguistán":"kg","Kiribati":"ki","Kuwait":"kw",
        "Laos":"la","Lesoto":"ls","Letonia":"lv","Líbano":"lb","Liberia":"lr","Libia":"ly",
        "Liechtenstein":"li","Lituania":"lt","Luxemburgo":"lu","Macedonia del Norte":"mk",
        "Madagascar":"mg","Malasia":"my","Malaui":"mw","Maldivas":"mv","Malí":"ml","Malta":"mt",
        "Marruecos":"ma","Mauricio":"mu","Mauritania":"mr","México":"mx","Micronesia":"fm",
        "Moldavia":"md","Mónaco":"mc","Mongolia":"mn","Montenegro":"me","Mozambique":"mz",
        "Namibia":"na","Nauru":"nr","Nepal":"np","Nicaragua":"ni","Níger":"ne","Nigeria":"ng",
        "Nueva Zelanda":"nz","Noruega":"no","Omán":"om","Países Bajos":"nl","Pakistán":"pk",
        "Palaos":"pw","Palestina":"ps","Panamá":"pa","Papúa Nueva Guinea":"pg","Paraguay":"py",
        "Perú":"pe","Polonia":"pl","Portugal":"pt","Reino Unido":"gb","Puerto Rico":"pr",
        "Ruanda":"rw","Rumania":"ro","Rusia":"ru","Samoa":"ws","San Marino":"sm",
        "Santa Lucía":"lc","Santo Tomé y Príncipe":"st","San Vicente y las Granadinas":"vc",
        "Senegal":"sn","Serbia":"rs","Seychelles":"sc","Sierra Leona":"sl","Singapur":"sg",
        "Siria":"sy","Somalia":"so","Sudáfrica":"za","Sudán":"sd","Sudán del Sur":"ss",
        "Suecia":"se","Suiza":"ch","Surinam":"sr","Esuatini":"sz","Tayikistán":"tj",
        "Tanzania":"tz","Tailandia":"th","Timor Oriental":"tl","Togo":"tg","Tonga":"to",
        "Trinidad y Tobago":"tt","Túnez":"tn","Turquía":"tr","Turkmenistán":"tm","Tuvalu":"tv",
        "Ucrania":"ua","Uganda":"ug","Uruguay":"uy","Uzbekistán":"uz","Vanuatu":"vu",
        "Vaticano":"va","Venezuela":"ve","Vietnam":"vn","Yemen":"ye","Yibuti":"dj",
        "Zambia":"zm","Zimbabue":"zw"
    };

    if (optionsBox && nativeSelect && displayBox) {
        optionsBox.innerHTML = '';
        Array.from(nativeSelect.options).forEach(opt => {
            if (!opt.value) return;
            const iso = isoMap[opt.text] || opt.value.replace('+','').toLowerCase();
            const div = document.createElement('div');
            div.className = 'phone-option';
            div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country" style="color:#475569;font-size:0.8rem;">${opt.text}</span>`;
            div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;';
            div.onmouseenter = () => div.style.background = '#f8fafc';
            div.onmouseleave = () => div.style.background = '';
            div.addEventListener('click', () => {
                nativeSelect.value = opt.value;
                flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                codeText.textContent = opt.value;
                countryText.textContent = opt.text;
                optionsBox.style.display = 'none';
            });
            optionsBox.appendChild(div);
        });
        displayBox.addEventListener('click', (e) => { e.stopPropagation(); optionsBox.style.display = optionsBox.style.display === 'block' ? 'none' : 'block'; });
        document.addEventListener('click', (e) => { if (!e.target.closest('.phone-dropdown-wrapper')) optionsBox.style.display = 'none'; });
    }

    // ==========================================
    // 🔹 4. VISTA PREVIA + EDAD + MÁSCARAS
    // ==========================================
    const setupPreview = (idIn, idImg) => {
        const input = document.getElementById(idIn), preview = document.getElementById(idImg);
        if (!input || !preview) return;
        input.addEventListener('change', function() {
            const f = this.files[0];
            if (f) { const r = new FileReader(); r.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; }; r.readAsDataURL(f); }
            else preview.style.display = 'none';
        });
    };
    setupPreview('foto_frontal', 'prev_frontal');
    setupPreview('foto_perfil_izq', 'prev_izq');
    setupPreview('foto_perfil_der', 'prev_der');

    if (fechaNac && edadInput) {
        fechaNac.addEventListener('change', () => {
            if (!fechaNac.value) { edadInput.value = ''; return; }
            const hoy = new Date(), nac = new Date(fechaNac.value);
            let edad = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
            edadInput.value = (edad >= 0 && edad <= 120) ? edad : '';
        });
    }

    if (cedulaInput) cedulaInput.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8));
    if (tlfNumInput) tlfNumInput.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 20));
    if (estaturaInput) {
        estaturaInput.addEventListener('input', window.convertirEstatura);
        estaturaInput.addEventListener('blur', window.convertirEstatura);
    }

    // ==========================================
    // 🔹 5. VALIDACIÓN DE CÉDULA (Personas + Procesados)
    // ==========================================
    let cedulaCheckTimeout = null;

    async function verificarCedula(cedula) {
        if (!cedulaStatus || !window.supabaseClient) return false;
        cedulaStatus.className = 'cedula-status checking';
        cedulaStatus.textContent = '🔍 Verificando...';
        cedulaInput?.classList.remove('cedula-duplicate');

        try {
            // 1. Buscar en registro_personas
            const { data: dataPersonas, error: errPersonas } = await window.supabaseClient
                .from('registro_personas')
                .select('cedula')
                .eq('cedula', cedula)
                .maybeSingle();

            if (errPersonas) throw errPersonas;

            if (dataPersonas) {
                cedulaStatus.className = 'cedula-status error';
                cedulaStatus.textContent = '⚠️ Cédula ya registrada en personas';
                cedulaInput?.classList.add('cedula-duplicate');
                return true;
            }

            // 2. Buscar en registro_procesados
            const { data: dataProcesados, error: errProcesados } = await window.supabaseClient
                .from('registro_procesados')
                .select('cedula, tipo_delito')
                .eq('cedula', cedula)
                .maybeSingle();

            if (errProcesados) throw errProcesados;

            if (dataProcesados) {
                cedulaStatus.className = 'cedula-status error';
                const delito = dataProcesados.tipo_delito || 'sin especificar';
                cedulaStatus.textContent = `⚠️ Cédula ya está PROCESADA`;
                cedulaStatus.title = `Esta cédula ya tiene un proceso registrado: ${delito}`;
                cedulaInput?.classList.add('cedula-duplicate');
                return true;
            }

            // ✅ Disponible
            cedulaStatus.className = 'cedula-status success';
            cedulaStatus.textContent = '✅ Cédula disponible';
            cedulaInput?.classList.remove('cedula-duplicate');
            return false;

        } catch (e) {
            console.warn('⚠️ Error verificando cédula:', e.message);
            cedulaStatus.className = 'cedula-status';
            cedulaStatus.textContent = '';
            return false;
        }
    }

    if (cedulaInput && cedulaStatus) {
        cedulaInput.addEventListener('input', function() {
            const val = this.value.trim();
            if (val.length > 0 && val.length < 7) {
                cedulaStatus.className = 'cedula-status error';
                cedulaStatus.textContent = '⚠️ Faltan dígitos (mínimo 7)';
                this.classList.remove('cedula-duplicate');
                return;
            }
            if (val.length === 0) {
                cedulaStatus.className = 'cedula-status';
                cedulaStatus.textContent = '';
                this.classList.remove('cedula-duplicate');
                return;
            }
            if (cedulaCheckTimeout) clearTimeout(cedulaCheckTimeout);
            cedulaCheckTimeout = setTimeout(() => verificarCedula(val), 600);
        });

        cedulaInput.addEventListener('blur', function() {
            const val = this.value.trim();
            if (val.length > 0 && val.length < 7) {
                cedulaStatus.className = 'cedula-status error';
                cedulaStatus.textContent = '⚠️ Faltan dígitos (mínimo 7)';
            } else if (val.length >= 7) {
                verificarCedula(val);
            }
        });
    }

    // ==========================================
    // 🔹 6. ENVÍO DEL FORMULARIO
    // ==========================================
    const mostrarError = (t) => {
        if(msg){msg.textContent='❌ '+t; msg.className='msg error'; msg.style.display='block';}
    };

    if (!form || !btn) { console.error('❌ Formulario no encontrado'); return; }

 form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. ✅ VALIDAR QUE HAYA AL MENOS 1 FOTO
    const fotoFrontal = el('foto_frontal').files[0];
    const fotoIzq = el('foto_perfil_izq').files[0];
    const fotoDer = el('foto_perfil_der').files[0];
    
    if (!fotoFrontal && !fotoIzq && !fotoDer) {
        mostrarMensaje('⚠️ Debe subir al menos una (1) fotografía', 'error');
        return;
    }

    const btnSubmit = form.querySelector('.btn-submit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Registrando...';

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Debe iniciar sesión');

        const cedula = el('p_cedula').value.trim();
        const nombre1 = el('p_nombre1').value.trim();
        const apellido1 = el('p_apellido1').value.trim();
        const nombreCompleto = `${nombre1} ${el('p_nombre2').value.trim()} ${apellido1} ${el('p_apellido2').value.trim()}`.trim();
        const estatusActual = el('p_estatus').value || 'Verificación';

        // 2. SUBIR FOTOS (Solo las que el usuario seleccionó)
        const bucket = 'fotos_personas';
        const folder = user.id;
        let urlFrontal = null, urlIzq = null, urlDer = null;

        if (fotoFrontal) {
            const fileName = `${Date.now()}_pp_f.jpg`;
            const { error: errUp1 } = await window.supabaseClient.storage.from(bucket).upload(`${folder}/${fileName}`, fotoFrontal);
            if (errUp1) throw errUp1;
            const { data: { publicUrl } } = window.supabaseClient.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
            urlFrontal = publicUrl;
        }
        if (fotoIzq) {
            const fileName = `${Date.now()}_pp_i.jpg`;
            const { error: errUp2 } = await window.supabaseClient.storage.from(bucket).upload(`${folder}/${fileName}`, fotoIzq);
            if (errUp2) throw errUp2;
            const { data: { publicUrl } } = window.supabaseClient.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
            urlIzq = publicUrl;
        }
        if (fotoDer) {
            const fileName = `${Date.now()}_pp_d.jpg`;
            const { error: errUp3 } = await window.supabaseClient.storage.from(bucket).upload(`${folder}/${fileName}`, fotoDer);
            if (errUp3) throw errUp3;
            const { data: { publicUrl } } = window.supabaseClient.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
            urlDer = publicUrl;
        }

        // 3. PREPARAR DATOS PARA LA BASE DE DATOS
        const personaData = {
            primer_nombre: nombre1,
            segundo_nombre: el('p_nombre2').value.trim(),
            primer_apellido: apellido1,
            segundo_apellido: el('p_apellido2').value.trim(),
            cedula: cedula,
            fecha_nacimiento: el('p_fecha_nac').value,
            edad: parseInt(el('p_edad').value) || null,
            apodo: el('p_apodo').value.trim(),
            nacionalidad: el('p_nacionalidad').value,
            sexo: el('p_sexo').value,
            direccion: el('p_direccion').value.trim(),
            tlf_pais: el('p_tlf_pais').value,
            tlf_numero: el('p_tlf_num').value.trim(),
            estatura_cm: el('p_estatura').value ? parseFloat(el('p_estatura').value) * 100 : null,
            color_piel: el('p_color_piel').value,
            color_ojos: el('p_color_ojos').value,
            color_cabello: el('p_color_cabello').value,
            complexion: el('p_complexion').value,
            usa_lentes: el('p_lentes').value === 'true',
            detalle_lentes: el('p_lentes').value === 'true' ? el('txt_lentes').value.trim() : null,
            perforaciones: el('p_perforaciones').value === 'true',
            detalle_perforaciones: el('p_perforaciones').value === 'true' ? el('txt_lugar_perforacion').value.trim() : null,
            condicion_medica: el('p_cond_medica').value === 'true',
            consume_medicamento: el('p_medicamento').value === 'true',
            problema_judicial: el('p_judicial').value === 'true' ? el('txt_jud').value.trim() : 'No',
            foto_frontal: urlFrontal,
            foto_perfil_izq: urlIzq,
            foto_perfil_der: urlDer,
            estacion_policial: el('p_estacion').value,
            direccion_detencion: el('p_direccion_detencion').value.trim(),
            observaciones: el('p_observaciones').value.trim(),
            estatus: estatusActual,
            registrado_por: user.id
        };

        // 4. INSERTAR EN LA BASE DE DATOS
        const { data: nuevaPersona, error: dbError } = await window.supabaseClient
            .from('registro_personas')
            .insert([personaData])
            .select('id, cedula')
            .single();

        if (dbError) throw dbError;

        // 5. ✅ REGISTRAR EN EL LOG DEL SISTEMA
        if (typeof registrarLog === 'function') {
            await registrarLog('CREAR_PERSONA', 'Registro de Personas', nuevaPersona.id, {
                cedula: nuevaPersona.cedula,
                nombre: nombreCompleto,
                estatus: estatusActual
            });
        }

        mostrarMensaje('✅ Persona registrada exitosamente', 'success');
        form.reset();
        
        // Limpiar vistas previas
        if(el('prev_frontal')) el('prev_frontal').style.display = 'none';
        if(el('prev_izq')) el('prev_izq').style.display = 'none';
        if(el('prev_der')) el('prev_der').style.display = 'none';

    } catch (err) {
        console.error('Error al registrar:', err);
        mostrarMensaje('❌ Error: ' + err.message, 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '✅ Registrar Persona';
    }
});
    async function registrarLog(accion, modulo, registroId = null, detalles = {}) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        const { data: perfil } = await window.supabaseClient
            .from('perfiles_usuario').select('nombre, apellido').eq('user_id', user.id).maybeSingle();
        const nombreCompleto = perfil ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() : 'Sistema';
        await window.supabaseClient.from('sistema_logs').insert([{
            user_id: user.id, 
            user_email: user.email, 
            user_nombre: nombreCompleto,
            accion: accion, 
            modulo: modulo, 
            registro_id: registroId, 
            detalles: detalles, 
            user_agent: navigator.userAgent
        }]);
    } catch (err) {
        console.warn('⚠️ Error registrando log:', err);
    }
}
    console.log("✅ Módulo reg-personas.js inicializado correctamente");
};
