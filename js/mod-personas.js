window.initModPersonas = function() {
    console.log("✅ Módulo mod-personas.js cargado correctamente.");

    window.toggleCampo = function(select, targetId) {
        const el = document.getElementById(targetId);
        const input = el?.querySelector('input');
        if (select.value === 'true') { if (el) el.style.display = 'block'; if (input) input.required = true; }
        else { if (el) el.style.display = 'none'; if (input) { input.value = ''; input.required = false; } }
    };

    window.activarCampoPerforacion = function(select) {
        const caja = document.getElementById('box-lugar-perforacion');
        const input = document.getElementById('txt_lugar_perforacion');
        if (!caja || !input) return;
        if (select.value === 'true') { caja.style.display = 'block'; input.required = true; }
        else { caja.style.display = 'none'; input.value = ''; input.required = false; }
    };

    window.convertirEstatura = function() {
        const m = document.getElementById('p_estatura')?.value;
        if (!m) return null;
        const val = parseFloat(m);
        return (!isNaN(val) && val >= 0.50 && val <= 2.30) ? Math.round(val * 100) : null;
    };

    window.calcularEdad = function(fechaStr) {
        if (!fechaStr) return null;
        const hoy = new Date(), nac = new Date(fechaStr);
        let edad = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
        return (edad >= 0 && edad <= 120) ? edad : null;
    };

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
        "Corea del Norte":"kp","Corea del Sur":"kr","Costa de Marfil":"ci","Costa Rica":"cr",
        "Croacia":"hr","Cuba":"cu","Dinamarca":"dk","Dominica":"dm","Ecuador":"ec",
        "Egipto":"eg","El Salvador":"sv","Emiratos Árabes":"ae","Eritrea":"er",
        "Eslovaquia":"sk","Eslovenia":"si","España":"es","Estados Unidos":"us",
        "Estonia":"ee","Etiopía":"et","Filipinas":"ph","Finlandia":"fi","Fiyi":"fj",
        "Francia":"fr","Gabón":"ga","Gambia":"gm","Georgia":"ge","Ghana":"gh",
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
            div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png"><span class="code">${opt.value}</span><span class="country">${opt.text}</span>`;
            div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;';
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

    const fechaNac = document.getElementById('p_fecha_nac');
    const edadInput = document.getElementById('p_edad');
    if (fechaNac && edadInput) {
        fechaNac.addEventListener('change', () => {
            if (!fechaNac.value) { edadInput.value = ''; return; }
            const edad = window.calcularEdad(fechaNac.value);
            edadInput.value = edad !== null ? edad : '';
        });
    }

    const cedulaInput = document.getElementById('p_cedula');
    const tlfNumInput = document.getElementById('p_tlf_num');
    if (cedulaInput) cedulaInput.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8));
    if (tlfNumInput) tlfNumInput.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 20));

    const estInput = document.getElementById('p_estatura');
    if (estInput) {
        estInput.addEventListener('input', window.convertirEstatura);
        estInput.addEventListener('blur', window.convertirEstatura);
    }

    let cedulaCheckTimeout = null;
    let cedulaOriginal = '';

    async function verificarCedulaEdicion(cedula, idActual) {
        const statusEl = document.getElementById('cedula-status');
        if (!statusEl || !window.supabaseClient) return { valido: false, mensaje: 'Error de conexión' };

        if (cedula === cedulaOriginal) {
            statusEl.className = 'cedula-status success';
            statusEl.textContent = '✅ Cédula actual';
            return { valido: true, mensaje: 'ok' };
        }

        statusEl.className = 'cedula-status checking';
        statusEl.textContent = '🔍 Verificando disponibilidad...';

        try {
            const { data, error } = await window.supabaseClient
                .from('registro_personas')
                .select('id, cedula')
                .eq('cedula', cedula)
                .neq('id', idActual)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                statusEl.className = 'cedula-status error';
                statusEl.textContent = '⚠️ Cédula ya registrada por otra persona';
                return { valido: false, mensaje: 'duplicada' };
            } else {
                statusEl.className = 'cedula-status success';
                statusEl.textContent = '✅ Cédula disponible';
                return { valido: true, mensaje: 'ok' };
            }
        } catch (e) {
            console.warn('⚠️ Error verificando cédula:', e.message);
            statusEl.className = 'cedula-status';
            statusEl.textContent = '';
            return { valido: true, mensaje: 'error_silencioso' };
        }
    }

    if (cedulaInput) {
        cedulaInput.addEventListener('input', function() {
            const val = this.value.trim().replace(/\D/g, '');
            this.value = val;
            if (val.length > 0 && val.length < 7) {
                const statusEl = document.getElementById('cedula-status');
                if (statusEl) { statusEl.className = 'cedula-status error'; statusEl.textContent = '️ Faltan dígitos (mínimo 7)'; }
                return;
            }
            if (val.length === 0) {
                const statusEl = document.getElementById('cedula-status');
                if (statusEl) { statusEl.className = 'cedula-status'; statusEl.textContent = ''; }
                return;
            }
            if (val.length >= 7 && val.length <= 8 && currentId) {
                if (cedulaCheckTimeout) clearTimeout(cedulaCheckTimeout);
                cedulaCheckTimeout = setTimeout(() => verificarCedulaEdicion(val, currentId), 600);
            }
        });
    }

    const buscarBtn = document.getElementById('btn-buscar');
    const buscarInput = document.getElementById('buscar-cedula');
    const form = document.getElementById('form-mod-personas');
    const msgBuscar = document.getElementById('buscar-msg');
    let currentId = null;
    let currentUrls = { front: '', izq: '', der: '' };

    const showBuscarMsg = (txt, type) => {
        msgBuscar.textContent = txt;
        msgBuscar.className = `search-msg ${type}`;
        msgBuscar.style.display = 'block';
    };

    async function ejecutarBusqueda() {
        const cedula = buscarInput.value.trim().replace(/\D/g, '');
        if (cedula.length < 7) { showBuscarMsg('⚠️ Ingrese entre 7 y 8 dígitos', 'error'); return; }

        showBuscarMsg('🔍 Buscando...', 'success');
        buscarBtn.disabled = true;

        try {
            const { data, error } = await window.supabaseClient
                .from('registro_personas')
                .select('*')
                .eq('cedula', cedula)
                .single();

            if (error || !data) {
                showBuscarMsg('❌ Persona no encontrada en el sistema.', 'error');
                form.style.display = 'none';
                return;
            }

            currentId = data.id;
            cedulaOriginal = data.cedula;
            currentUrls = { front: data.foto_frontal, izq: data.foto_perfil_izq, der: data.foto_perfil_der };

            document.getElementById('mod_record_id').value = currentId;
            document.getElementById('p_cedula').value = data.cedula;
            document.getElementById('p_cedula').removeAttribute('readonly');
            document.getElementById('p_cedula').style.background = '#fff';
            document.getElementById('p_cedula').style.cursor = 'text';

            document.getElementById('p_nombre1').value = data.primer_nombre || '';
            document.getElementById('p_nombre2').value = data.segundo_nombre || '';
            document.getElementById('p_apellido1').value = data.primer_apellido || '';
            document.getElementById('p_apellido2').value = data.segundo_apellido || '';
            document.getElementById('p_fecha_nac').value = data.fecha_nacimiento || '';
            document.getElementById('p_edad').value = data.edad || window.calcularEdad(data.fecha_nacimiento) || '';
            document.getElementById('p_apodo').value = data.apodo || '';
            document.getElementById('p_marca').value = data.marca_corporal || '';
            document.getElementById('p_nacionalidad').value = data.nacionalidad || '';
            document.getElementById('p_sexo').value = data.sexo || '';
            document.getElementById('p_direccion').value = data.direccion || '';
            document.getElementById('p_estatura').value = data.estatura_cm ? (data.estatura_cm / 100).toFixed(2) : '';
            document.getElementById('p_color_piel').value = data.color_piel || '';
            document.getElementById('p_color_ojos').value = data.color_ojos || '';
            document.getElementById('p_color_cabello').value = data.color_cabello || '';
            document.getElementById('p_complexion').value = data.complexion || '';
       // Asignar estación policial
const estacionSelect = document.getElementById('p_estacion');
if (data.estacion_policial) {
    // Verificar si el valor existe en las opciones
    const existe = Array.from(estacionSelect.options).some(opt => opt.value === data.estacion_policial);
    if (!existe) {
        // Si no existe, agregarlo como opción temporal
        const nuevaOpcion = document.createElement('option');
        nuevaOpcion.value = data.estacion_policial;
        nuevaOpcion.textContent = data.estacion_policial;
        estacionSelect.appendChild(nuevaOpcion);
    }
    estacionSelect.value = data.estacion_policial;
} else {
    estacionSelect.value = '';
}
            document.getElementById('p_direccion_detencion').value = data.direccion_detencion || '';
            document.getElementById('p_observaciones').value = data.observaciones || '';

            if (data.tlf_pais) {
                nativeSelect.value = data.tlf_pais;
                const optText = Array.from(nativeSelect.options).find(o => o.value === data.tlf_pais)?.text || '';
                const iso = isoMap[optText] || data.tlf_pais.replace('+','').toLowerCase();
                flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                codeText.textContent = data.tlf_pais;
                countryText.textContent = optText;
            }
            if (data.tlf_numero) document.getElementById('p_tlf_num').value = data.tlf_numero;

            const setCond = (selId, txtId, showId, val, detail) => {
                document.getElementById(selId).value = val ? 'true' : 'false';
                toggleCampo(document.getElementById(selId), showId);
                if (val && detail) document.getElementById(txtId).value = detail;
            };

            setCond('p_lentes', 'txt_lentes', 'det-lentes', data.usa_lentes, data.detalle_lentes);
            setCond('p_perforaciones', 'txt_lugar_perforacion', 'box-lugar-perforacion', data.perforaciones, data.detalle_perforaciones);
            setCond('p_cond_medica', 'txt_cond', 'det-cond', data.condicion_medica !== null, data.condicion_medica);
            setCond('p_medicamento', 'txt_med', 'det-med', data.consume_medicamento !== null, data.consume_medicamento);
            setCond('p_judicial', 'txt_jud', 'det-jud', data.problema_judicial !== null, data.problema_judicial);

            ['front', 'izq', 'der'].forEach(k => {
                const el = document.getElementById(k === 'front' ? 'prev_frontal' : k === 'izq' ? 'prev_izq' : 'prev_der');
                if (currentUrls[k]) { el.src = currentUrls[k]; el.style.display = 'block'; }
            });

            form.style.display = 'block';
            showBuscarMsg('✅ Registro cargado. Puede editar la cédula si es necesario.', 'success');

        } catch (err) {
            console.error(err);
            showBuscarMsg(' Error de conexión al buscar.', 'error');
        } finally {
            buscarBtn.disabled = false;
        }
    }

    if (buscarBtn) buscarBtn.addEventListener('click', ejecutarBusqueda);
    if (buscarInput) {
        buscarInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                ejecutarBusqueda();
            }
        });
    }

    const submitBtn = form?.querySelector('.btn-submit');
    const msgForm = document.getElementById('msg-mod-personas');
    const mostrarError = (txt) => {
        if(msgForm) {
            msgForm.textContent = '❌ ' + txt;
            msgForm.className = 'msg error';
            msgForm.style.display = 'block';
        }
    };

    if (form) {
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        });
    }

    if (form && submitBtn) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }
            if (!currentId) { mostrarError('Busque un registro primero.'); return; }

            const nuevaCedula = document.getElementById('p_cedula')?.value.trim().replace(/\D/g, '');
            if (nuevaCedula.length < 7 || nuevaCedula.length > 8) {
                mostrarError('La cédula debe tener entre 7 y 8 dígitos.');
                document.getElementById('p_cedula')?.focus();
                return;
            }

            const verif = await verificarCedulaEdicion(nuevaCedula, currentId);
            if (!verif.valido) {
                mostrarError('Esta cédula ya está registrada por otra persona.');
                document.getElementById('p_cedula')?.focus();
                return;
            }

            const fechaVal = document.getElementById('p_fecha_nac')?.value;
            const edadCalculada = window.calcularEdad(fechaVal);
            if (!fechaVal || edadCalculada === null) {
                mostrarError('Verifique la fecha de nacimiento para calcular la edad correctamente.');
                document.getElementById('p_fecha_nac')?.focus();
                return;
            }

            const estCm = window.convertirEstatura();
            if (!estCm) { mostrarError('La estatura es obligatoria y debe estar entre 0.50 y 2.30 m.'); return; }

            const fotoFrontalFile = document.getElementById('foto_frontal').files[0];
            if (!fotoFrontalFile && !currentUrls.front) {
                mostrarError('La fotografía frontal es obligatoria.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Guardando cambios...';
            if (msgForm) msgForm.style.display = 'none';

            try {
                const bucket = window.supabaseClient.storage.from('fotos_personas');

                const uploadIfChanged = async (fileInput, originalUrl) => {
                    const f = document.getElementById(fileInput).files[0];
                    if (!f) return originalUrl;
                    const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                    const path = `${uid}/${Date.now()}_${fileInput}.jpg`;
                    const { error } = await bucket.upload(path, f, { cacheControl: '3600' });
                    if (error) throw new Error('Error subiendo imagen: ' + error.message);
                    return bucket.getPublicUrl(path).data.publicUrl;
                };

                const newFront = await uploadIfChanged('foto_frontal', currentUrls.front);
                const newIzq = await uploadIfChanged('foto_perfil_izq', currentUrls.izq);
                const newDer = await uploadIfChanged('foto_perfil_der', currentUrls.der);

                const tlfPais = document.getElementById('p_tlf_pais')?.value;
                const tlfNumRaw = (document.getElementById('p_tlf_num')?.value.trim().replace(/\D/g, '') || '').slice(0, 20);
                const tlfCodigoFinal = (tlfPais && tlfNumRaw.length >= 1) ? tlfPais : null;
                const tlfNumeroFinal = (tlfPais && tlfNumRaw.length >= 1) ? tlfNumRaw : null;

                const updateData = {
                    cedula: nuevaCedula,
                    foto_frontal: newFront, foto_perfil_izq: newIzq, foto_perfil_der: newDer,
                    primer_nombre: document.getElementById('p_nombre1').value.trim(),
                    segundo_nombre: document.getElementById('p_nombre2').value.trim() || null,
                    primer_apellido: document.getElementById('p_apellido1').value.trim(),
                    segundo_apellido: document.getElementById('p_apellido2').value.trim() || null,
                    fecha_nacimiento: fechaVal,
                    edad: edadCalculada,
                    tlf_pais: tlfCodigoFinal,
                    tlf_numero: tlfNumeroFinal,
                    direccion: document.getElementById('p_direccion').value.trim(),
                    apodo: document.getElementById('p_apodo').value.trim() || null,
                    marca_corporal: document.getElementById('p_marca').value.trim() || null,
                    nacionalidad: document.getElementById('p_nacionalidad').value,
                    sexo: document.getElementById('p_sexo').value,
                    estatura_cm: estCm,
                    color_piel: document.getElementById('p_color_piel').value,
                    color_ojos: document.getElementById('p_color_ojos').value,
                    color_cabello: document.getElementById('p_color_cabello').value,
                    complexion: document.getElementById('p_complexion').value,
                    usa_lentes: document.getElementById('p_lentes').value === 'true',
                    detalle_lentes: document.getElementById('p_lentes').value === 'true' ? document.getElementById('txt_lentes').value.trim() : null,
                    perforaciones: document.getElementById('p_perforaciones').value === 'true',
                    detalle_perforaciones: document.getElementById('p_perforaciones').value === 'true' ? document.getElementById('txt_lugar_perforacion').value.trim() : null,
                    condicion_medica: document.getElementById('p_cond_medica').value === 'true' ? document.getElementById('txt_cond').value : null,
                    consume_medicamento: document.getElementById('p_medicamento').value === 'true' ? document.getElementById('txt_med').value : null,
                    problema_judicial: document.getElementById('p_judicial').value === 'true' ? document.getElementById('txt_jud').value : null,
                    estacion_policial: document.getElementById('p_estacion').value,
                    direccion_detencion: document.getElementById('p_direccion_detencion')?.value.trim() || null,
                    observaciones: document.getElementById('p_observaciones').value.trim() || null
                };

                const { data, error } = await window.supabaseClient
                    .from('registro_personas')
                    .update(updateData)
                    .eq('id', currentId)
                    .select('id, cedula');

                if (error) throw error;
                if (!data || data.length === 0) throw new Error('No se pudo aplicar la actualización.');

                if (msgForm) {
                    const cedulaCambio = (nuevaCedula !== cedulaOriginal) ? ` (Cédula: ${cedulaOriginal} → ${nuevaCedula})` : '';
                    msgForm.textContent = `✅ Cambios guardados correctamente.${cedulaCambio}`;
                    msgForm.className = 'msg success';
                    msgForm.style.display = 'block';
                    setTimeout(() => msgForm.style.display = 'none', 5000);
                }
                
if (typeof window.registrarLog === 'function' && currentId) {
    await window.registrarLog(
        'MODIFICAR',
        'PERSONAS',
        {
            cedula: nuevaCedula,
            nombre_completo: `${updateData.primer_nombre} ${updateData.primer_apellido}`.trim(),
            estatus: 'Verificación',
            estacion: updateData.estacion_policial,
            direccion_detencion: updateData.direccion_detencion,
            cambios_realizados: 'Actualización de datos'
        },
        currentId
    );
    console.log('✅ Log de modificación registrado exitosamente');
}           setTimeout(() => {
                    form.style.display = 'none';
                    buscarInput.value = '';
                    msgBuscar.style.display = 'none';
                    currentId = null;
                    cedulaOriginal = '';
                }, 5000);

            } catch (err) {
                console.error('Error actualización:', err);
                let mensaje = 'Error al guardar cambios. Intente nuevamente.';
                if (err.message.includes('23505') || err.message.includes('unique_cedula') || err.message.includes('cedula_key')) {
                    mensaje = 'Esta cédula ya está registrada por otra persona. Verifique el número.';
                } else if (err.message.includes('storage')) {
                    mensaje = 'No se pudieron subir las fotografías nuevas.';
                } else if (err.message.includes('22001') || err.message.includes('too long')) {
                    mensaje = 'El número de teléfono es demasiado largo (máx. 20 dígitos).';
                } else if (err.message.includes('edad') || err.message.includes('23502')) {
                    mensaje = 'Error con la edad. Verifique la fecha de nacimiento.';
                }
                mostrarError(mensaje);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '💾 Guardar Cambios';
            }
        });
    }

    console.log("✅ Módulo mod-personas.js inicializado correctamente");
};
