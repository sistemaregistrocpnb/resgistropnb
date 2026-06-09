window.initRegPersonas = function() {
    console.log("⚙️ Iniciando módulo reg-personas.js...");
    
    // ✅ 1. DEFINIR FUNCIÓN AUXILIAR 'el' PARA EVITAR ERRORES DE SCOPE
    const el = (id) => document.getElementById(id);
    const form = el('form-reg-personas');
    const msg = el('msg-reg-personas');

    if (!form) return;

    function mostrarMensaje(texto, tipo) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `msg ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') setTimeout(() => { if (msg) msg.style.display = 'none'; }, 4000);
    }

    // ✅ 2. PREVISUALIZACIÓN DE IMÁGENES
    ['foto_frontal', 'foto_perfil_izq', 'foto_perfil_der'].forEach(id => {
        const input = el(id);
        const preview = el(id === 'foto_frontal' ? 'prev_frontal' : id === 'foto_perfil_izq' ? 'prev_izq' : 'prev_der');
        if (input && preview) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.style.display = 'none';
                }
            });
        }
    });

    // ✅ 3. CÁLCULO AUTOMÁTICO DE EDAD
    const fechaNacInput = el('p_fecha_nac');
    const edadInput = el('p_edad');
    if (fechaNacInput && edadInput) {
        fechaNacInput.addEventListener('change', () => {
            const fechaNac = new Date(fechaNacInput.value);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const mes = hoy.getMonth() - fechaNac.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
            edadInput.value = edad >= 0 ? edad : '';
        });
    }

    // ✅ 4. CAMPOS CONDICIONALES (Lentes, Perforaciones, etc.)
    window.toggleCampo = function(select, detId) {
        const det = el(detId);
        if (det) det.style.display = select.value === 'true' ? 'block' : 'none';
    };

    window.activarCampoPerforacion = function(select) {
        const box = el('box-lugar-perforacion');
        if (box) box.style.display = select.value === 'true' ? 'block' : 'none';
    };

    // ✅ 5. DROPDOWN DE TELÉFONO PERSONALIZADO
    const tlfPaisSelect = el('p_tlf_pais');
    const tlfDisplay = document.querySelector('.phone-display');
    const tlfOptions = document.querySelector('.phone-options');
    
    if (tlfPaisSelect && tlfDisplay && tlfOptions) {
        // Poblar opciones
        Array.from(tlfPaisSelect.options).forEach(opt => {
            if (opt.value) {
                const countryCode = opt.value.replace('+', '').toLowerCase();
                const div = document.createElement('div');
                div.className = 'phone-option';
                div.innerHTML = `
                    <img src="https://flagcdn.com/w20/${countryCode === 'xx' ? 'xx' : countryCode}.png" alt="${opt.text}">
                    <span class="code">${opt.value}</span>
                    <span class="country">${opt.text}</span>
                `;
                div.addEventListener('click', () => {
                    tlfPaisSelect.value = opt.value;
                    document.getElementById('tlf-flag-img').src = `https://flagcdn.com/w20/${countryCode === 'xx' ? 'xx' : countryCode}.png`;
                    document.getElementById('tlf-code-text').textContent = opt.value;
                    document.getElementById('tlf-country-text').textContent = opt.text;
                    tlfOptions.style.display = 'none';
                });
                tlfOptions.appendChild(div);
            }
        });

        tlfDisplay.addEventListener('click', () => {
            tlfOptions.style.display = tlfOptions.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (!tlfDisplay.contains(e.target) && !tlfOptions.contains(e.target)) {
                tlfOptions.style.display = 'none';
            }
        });
    }

    // ✅ 6. MANEJO DEL ENVÍO DEL FORMULARIO
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // A. VALIDAR QUE HAYA AL MENOS 1 FOTO
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

            // B. SUBIR FOTOS (Solo las que el usuario seleccionó)
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

            // C. PREPARAR DATOS PARA LA BASE DE DATOS
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

            // D. INSERTAR EN LA BASE DE DATOS
            const { data: nuevaPersona, error: dbError } = await window.supabaseClient
                .from('registro_personas')
                .insert([personaData])
                .select('id, cedula')
                .single();

            if (dbError) throw dbError;

            // E. ✅ REGISTRAR EN EL LOG DEL SISTEMA
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
            
            // Resetear campos condicionales
            window.toggleCampo(el('p_lentes'), 'det-lentes');
            window.activarCampoPerforacion(el('p_perforaciones'));
            window.toggleCampo(el('p_cond_medica'), 'det-cond');
            window.toggleCampo(el('p_medicamento'), 'det-med');
            window.toggleCampo(el('p_judicial'), 'det-jud');

        } catch (err) {
            console.error('Error al registrar:', err);
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = '✅ Registrar Persona';
        }
    });

    console.log("✅ Módulo reg-personas.js inicializado correctamente");
};

// ✅ FUNCIÓN REUTILIZABLE PARA REGISTRAR LOGS EN EL SISTEMA
async function registrarLog(accion, modulo, registroId = null, detalles = {}) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        const { data: perfil } = await window.supabaseClient
            .from('perfiles_usuario')
            .select('nombre, apellido')
            .eq('user_id', user.id)
            .maybeSingle();
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initRegPersonas);
} else {
    window.initRegPersonas();
}
