window.initRegPersonas = function() {
    console.log("✅ Módulo reg-personas.js cargado correctamente.");

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

    const form = document.getElementById('form-reg-personas');
    const cedulaInput = document.getElementById('p_cedula');
    const cedulaStatus = document.getElementById('cedula-status');
    const tlfNumInput = document.getElementById('p_tlf_num');
    const estaturaInput = document.getElementById('p_estatura');
    const fechaNac = document.getElementById('p_fecha_nac');
    const edadInput = document.getElementById('p_edad');
    const btn = form?.querySelector('.btn-submit');
    const msg = document.getElementById('msg-reg-personas');

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
    if (nativeSelect) nativeSelect.value = '+58';
if (flagImg) flagImg.src = 'https://flagcdn.com/w20/ve.png';
if (codeText) codeText.textContent = '+58';
if (countryText) countryText.textContent = 'Venezuela';


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

    let cedulaCheckTimeout = null;

    async function verificarCedula(cedula) {
        if (!cedulaStatus || !window.supabaseClient) return false;
        cedulaStatus.className = 'cedula-status checking';
        cedulaStatus.textContent = '🔍 Verificando...';
        cedulaInput?.classList.remove('cedula-duplicate');
        try {
            const { data: dataPersonas } = await window.supabaseClient
                .from('registro_personas').select('cedula').eq('cedula', cedula).maybeSingle();
            if (dataPersonas) {
                cedulaStatus.className = 'cedula-status error';
                cedulaStatus.textContent = '⚠️ Cédula ya registrada';
                cedulaInput?.classList.add('cedula-duplicate');
                return true;
            }
            const { data: dataProc } = await window.supabaseClient
                .from('registro_procesados').select('cedula, tipo_delito').eq('cedula', cedula).maybeSingle();
            if (dataProc) {
                cedulaStatus.className = 'cedula-status error';
                cedulaStatus.textContent = '⚠️ Cédula PROCESADA';
                cedulaInput?.classList.add('cedula-duplicate');
                return true;
            }
            cedulaStatus.className = 'cedula-status success';
            cedulaStatus.textContent = '✅ Disponible';
            return false;
        } catch (e) {
            console.warn('Error:', e.message);
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
                cedulaStatus.textContent = '⚠️ Mínimo 7 dígitos';
                return;
            }
            if (val.length === 0) {
                cedulaStatus.className = 'cedula-status';
                cedulaStatus.textContent = '';
                return;
            }
            if (cedulaCheckTimeout) clearTimeout(cedulaCheckTimeout);
            cedulaCheckTimeout = setTimeout(() => verificarCedula(val), 600);
        });
    }


    const mostrarError = (t) => {
        if(msg){msg.textContent='❌ '+t; msg.className='msg error'; msg.style.display='block';}
    };

    if (!form || !btn) { console.error('❌ Formulario no encontrado'); return; }

 form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const cedula = cedulaInput?.value.trim().replace(/\D/g, '') || '';
    const edad = parseInt(edadInput?.value) || 0;
    const tlfPais = document.getElementById('p_tlf_pais')?.value;
    const tlfNumRaw = (document.getElementById('p_tlf_num')?.value.trim().replace(/\D/g, '') || '').slice(0, 20);
    const estCm = window.convertirEstatura();
    
    if (cedula.length < 7 || cedula.length > 8) {
        mostrarError('La cédula debe tener entre 7 y 8 dígitos.');
        cedulaInput?.focus();
        return;
    }
    if (!document.getElementById('p_fecha_nac')?.value || edad < 0 || edad > 120) {
        mostrarError('Verifique la fecha de nacimiento.');
        document.getElementById('p_fecha_nac')?.focus();
        return;
    }
    if (!estCm || estCm < 50 || estCm > 230) {
        mostrarError('Estatura inválida (0.50m - 2.30m).');
        document.getElementById('p_estatura')?.focus();
        return;
    }
    
    if (!document.getElementById('p_direccion_detencion')?.value.trim()) {
        mostrarError('La dirección de detención es obligatoria.');
        document.getElementById('p_direccion_detencion')?.focus();
        return;
    }
    
    const duplicada = await verificarCedula(cedula);
    if (duplicada) {
        mostrarError('Cédula ya registrada');
        cedulaInput?.focus();
        return;
    }
    
    btn.disabled = true;
    btn.textContent = ' Guardando...';
    if(msg) msg.style.display='none';
    
    try {
  
        const bucket = window.supabaseClient.storage.from('fotos_personas');
        const files = {
            f: document.getElementById('foto_frontal').files[0],
            i: document.getElementById('foto_perfil_izq').files[0],
            d: document.getElementById('foto_perfil_der').files[0]
        };
        if (!files.f) throw new Error('Foto frontal obligatoria');
        
        const uid = sessionStorage.getItem('pnb_user_id') || 'user';
        const ts = Date.now();
        const uploadFile = async (file, suffix) => {
            if (!file) return null;
            const path = `${uid}/${ts}_${suffix}.jpg`;
            await bucket.upload(path, file, { cacheControl: '3600' });
            return bucket.getPublicUrl(path).data.publicUrl;
        };
        
        const urls = {
            f: await uploadFile(files.f, 'f'),
            i: await uploadFile(files.i, 'i'),
            d: await uploadFile(files.d, 'd')
        };
        
        const tlfCodigo = (tlfPais && tlfNumRaw.length >= 1) ? tlfPais : null;
        const tlfNumero = (tlfPais && tlfNumRaw.length >= 1) ? tlfNumRaw : null;
        
        const data = {
            estatus: 'Verificación',
            estacion_policial: document.getElementById('v_estacion')?.value || null,
            direccion_detencion: document.getElementById('p_direccion_detencion')?.value.trim() || null,
            foto_frontal: urls.f, foto_perfil_izq: urls.i, foto_perfil_der: urls.d,
            primer_nombre: document.getElementById('p_nombre1')?.value.trim(),
            segundo_nombre: document.getElementById('p_nombre2')?.value.trim() || null,
            primer_apellido: document.getElementById('p_apellido1')?.value.trim(),
            segundo_apellido: document.getElementById('p_apellido2')?.value.trim() || null,
            cedula, fecha_nacimiento: document.getElementById('p_fecha_nac')?.value, edad,
            tlf_pais: tlfCodigo, tlf_numero: tlfNumero,
            direccion: document.getElementById('p_direccion')?.value.trim(),
            apodo: document.getElementById('p_apodo')?.value.trim() || null,
            marca_corporal: document.getElementById('p_marca')?.value.trim() || null,
            nacionalidad: document.getElementById('p_nacionalidad')?.value,
            sexo: document.getElementById('p_sexo')?.value,
            estatura_cm: estCm,
            color_piel: document.getElementById('p_color_piel')?.value,
            color_ojos: document.getElementById('p_color_ojos')?.value,
            color_cabello: document.getElementById('p_color_cabello')?.value,
            complexion: document.getElementById('p_complexion')?.value,
            usa_lentes: document.getElementById('p_lentes')?.value === 'true',
            detalle_lentes: document.getElementById('p_lentes')?.value === 'true' ? document.getElementById('txt_lentes')?.value.trim() : null,
            perforaciones: document.getElementById('p_perforaciones')?.value === 'true',
            detalle_perforaciones: document.getElementById('p_perforaciones')?.value === 'true' ? document.getElementById('txt_lugar_perforacion')?.value.trim() : null,
            condicion_medica: document.getElementById('p_cond_medica')?.value === 'true' ? document.getElementById('txt_cond')?.value : null,
            consume_medicamento: document.getElementById('p_medicamento')?.value === 'true' ? document.getElementById('txt_med')?.value : null,
            problema_judicial: document.getElementById('p_judicial')?.value === 'true' ? document.getElementById('txt_jud')?.value : null,
            observaciones: document.getElementById('p_observaciones') ? document.getElementById('p_observaciones').value.trim() : null
        };
        
        const { data: insertedData, error: insertError } = await window.supabaseClient
            .from('registro_personas').insert([data]).select('id').maybeSingle();
        if (insertError) throw insertError;
        
        if (msg) {
            msg.textContent = '✅ Registro guardado exitosamente.';
            msg.className = 'msg success';
            msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 4000);
        }
        
        form.reset();
        if(edadInput) edadInput.value = '';
        document.querySelectorAll('.hidden-field').forEach(e => e.style.display='none');
        document.querySelectorAll('.img-preview').forEach(e => e.style.display='none');
        if(cedulaStatus){cedulaStatus.className='cedula-status';cedulaStatus.textContent='';}
        if(nativeSelect) nativeSelect.value = '';
        flagImg.src = 'https://flagcdn.com/w20/ve.png';
        codeText.textContent = '+58';
        countryText.textContent = 'Venezuela';
        
        if (typeof window.registrarLog === 'function' && insertedData?.id) {
            await window.registrarLog(
                'CREAR',
                'PERSONAS',
                {
                    cedula: cedula,
                    nombre_completo: `${data.primer_nombre} ${data.primer_apellido}`.trim(),
                    estatus: data.estatus,
                    estacion: data.estacion_policial,
                    direccion_detencion: data.direccion_detencion
                },
                insertedData.id
            );
        }
    } catch (err) {
        console.error('Error:', err);
        let m = 'Error inesperado. Intente nuevamente.';
        if (err.message.includes('23505') || err.message.includes('cedula')) m = 'Esta cédula ya está registrada.';
        else if (err.message.includes('storage')) m = 'Error subiendo fotografías.';
        else if (err.message.includes('22001') || err.message.includes('too long')) m = 'El número de teléfono es demasiado largo (máx. 20 dígitos).';
        else if (err.message.includes('tlf_numero_check')) m = 'Formato de teléfono inválido.';
        else m = err.message;
        mostrarError(m);
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Registrar Persona';
    }
});
    console.log("✅ Módulo inicializado");
};
