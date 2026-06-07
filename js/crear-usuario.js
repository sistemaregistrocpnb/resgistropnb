window.initCrearUsuario = function() {
    console.log("⚙️ Iniciando módulo crear-usuario.js...");

    if (window._crearUsuarioInitialized) {
        return;
    }
    window._crearUsuarioInitialized = true;

    const el = (id) => document.getElementById(id);
    const form = el('form-crear-usuario');
    const btnSubmit = el('cu_btn_submit');
    const msg = el('cu_msg');
    const passwordInput = el('cu_password');
    const passwordConfirm = el('cu_password_confirm');
    const passwordStrength = el('cu_password_strength');
    const fotoInput = el('cu_foto');
    const fotoPreview = el('cu_foto_preview');
    const emailInput = el('cu_email');
    const emailStatus = el('cu_email_status');

    let fotoUrl = null;
    let emailValido = false;

    // 🔍 DIAGNÓSTICO: Verificar que los elementos existen
    console.log(" Diagnóstico de elementos:");
    console.log("  emailInput:", emailInput ? "✅ Existe" : "❌ NO EXISTE");
    console.log("  emailStatus:", emailStatus ? "✅ Existe" : "❌ NO EXISTE");
    console.log("  supabaseClient:", window.supabaseClient ? "✅ Existe" : "❌ NO EXISTE");

    if (!emailInput || !emailStatus) {
        console.error("❌ Faltan elementos del DOM. Verifica que el HTML tenga:");
        console.error("  - <input id='cu_email'>");
        console.error("  - <div id='cu_email_status'>");
        return;
    }

    // Verificar permisos
    async function verificarPermisos() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                mostrarMensaje('❌ Debe iniciar sesión', 'error');
                return false;
            }

            const { data: perfil } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!perfil || perfil.nivel !== 'administrador') {
                mostrarMensaje(' Solo los administradores pueden crear usuarios', 'error');
                return false;
            }

            return true;
        } catch (err) {
            console.error('Error verificando permisos:', err);
            return false;
        }
    }

    function mostrarMensaje(texto, tipo) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `msg ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') {
            setTimeout(() => { if (msg) msg.style.display = 'none'; }, 5000);
        }
    }

    function validarFormatoEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    // ✅ FUNCIÓN DE VERIFICACIÓN CON LOGS DETALLADOS
    async function verificarEmailExiste(email) {
        console.log("🔍 [VERIFICAR EMAIL] Iniciando verificación para:", email);
        
        if (!emailStatus) {
            console.error("❌ [VERIFICAR EMAIL] emailStatus es null");
            return false;
        }

        emailStatus.className = 'email-status checking';
        emailStatus.textContent = '🔍 Verificando email...';
        emailInput.classList.remove('email-duplicate');
        emailValido = false;

        try {
            console.log(" [VERIFICAR EMAIL] Consultando Supabase...");
            
            const { data: perfilExistente, error: errPerfil } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('email, nombre, apellido, nivel')
                .eq('email', email.toLowerCase())
                .maybeSingle();

            console.log("📊 [VERIFICAR EMAIL] Respuesta de Supabase:");
            console.log("  data:", perfilExistente);
            console.log("  error:", errPerfil);

            if (errPerfil) {
                console.error("❌ [VERIFICAR EMAIL] Error en la consulta:", errPerfil);
                emailStatus.className = 'email-status error';
                emailStatus.textContent = `⚠️ Error: ${errPerfil.message}`;
                return false;
            }

            if (perfilExistente) {
                console.log("⚠️ [VERIFICAR EMAIL] Email YA registrado:", perfilExistente);
                emailStatus.className = 'email-status error';
                const nombreCompleto = `${perfilExistente.nombre || ''} ${perfilExistente.apellido || ''}`.trim();
                emailStatus.textContent = `⚠️ Email ya registrado${nombreCompleto ? ` a: ${nombreCompleto} (${perfilExistente.nivel})` : ''}`;
                emailInput.classList.add('email-duplicate');
                return true;
            }

            console.log("✅ [VERIFICAR EMAIL] Email DISPONIBLE");
            emailStatus.className = 'email-status success';
            emailStatus.textContent = '✅ Email disponible';
            emailInput.classList.remove('email-duplicate');
            emailValido = true;
            return false;

        } catch (e) {
            console.error('❌ [VERIFICAR EMAIL] Excepción:', e);
            emailStatus.className = 'email-status error';
            emailStatus.textContent = '⚠️ Error de conexión';
            return false;
        }
    }

    // ✅ EVENT LISTENERS CON LOGS
    let emailCheckTimeout = null;
    
    emailInput.addEventListener('input', function() {
        const val = this.value.trim().toLowerCase();
        console.log("⌨️ [INPUT EMAIL] Valor actual:", val);
        
        if (val.length === 0) {
            emailStatus.className = 'email-status';
            emailStatus.textContent = '';
            this.classList.remove('email-duplicate');
            emailValido = false;
            return;
        }

        if (!val.includes('@')) {
            emailStatus.className = 'email-status error';
            emailStatus.textContent = '⚠️ Falta el símbolo @';
            this.classList.remove('email-duplicate');
            emailValido = false;
            return;
        }

        if (!validarFormatoEmail(val)) {
            emailStatus.className = 'email-status checking';
            emailStatus.textContent = '⏳ Complete el email...';
            this.classList.remove('email-duplicate');
            emailValido = false;
            return;
        }

        // Email válido, verificar con debounce
        if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
        console.log("⏱️ [INPUT EMAIL] Programando verificación en 800ms...");
        emailCheckTimeout = setTimeout(() => {
            console.log("⏱️ [INPUT EMAIL] Ejecutando verificación...");
            verificarEmailExiste(val);
        }, 800);
    });

    emailInput.addEventListener('blur', function() {
        const val = this.value.trim().toLowerCase();
        console.log("🔵 [BLUR EMAIL] Valor:", val);
        if (val.length > 0 && validarFormatoEmail(val)) {
            verificarEmailExiste(val);
        }
    });

    // Validación de contraseña
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const val = e.target.value;
            let strength = '';
            let className = '';

            if (val.length === 0) strength = '';
            else if (val.length < 6) { strength = '⚠️ Muy débil (mínimo 6 caracteres)'; className = 'weak'; }
            else if (val.length < 8) { strength = '🟡 Débil'; className = 'medium'; }
            else if (val.length < 12) { strength = '🟠 Media'; className = 'medium'; }
            else { strength = '🟢 Fuerte'; className = 'strong'; }

            if (passwordStrength) {
                passwordStrength.textContent = strength;
                passwordStrength.className = `password-strength ${className}`;
            }
        });
    }

    // Subir foto
    if (fotoInput) {
        fotoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                mostrarMensaje('❌ Solo se permiten imágenes', 'error');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                mostrarMensaje('❌ La imagen no debe superar 2MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => { if (fotoPreview) fotoPreview.src = e.target.result; };
            reader.readAsDataURL(file);

            try {
                mostrarMensaje('⏳ Subiendo foto...', 'info');
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                const fileName = `fotos_perfiles/${user.id}/${Date.now()}_${file.name}`;
                
                const { error } = await window.supabaseClient.storage
                    .from('fotos_perfiles')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (error) throw error;

                const { data: { publicUrl } } = window.supabaseClient.storage
                    .from('fotos_perfiles')
                    .getPublicUrl(fileName);

                fotoUrl = publicUrl;
                mostrarMensaje('✅ Foto subida exitosamente', 'success');
            } catch (err) {
                console.error('Error subiendo foto:', err);
                mostrarMensaje('❌ Error al subir la foto: ' + err.message, 'error');
            }
        });
    }

    function limpiarFoto() {
        fotoUrl = null;
        if (fotoPreview) fotoPreview.src = 'https://ui-avatars.com/api/?name=Usuario&background=002b5c&color=fff';
        if (fotoInput) fotoInput.value = '';
    }

    // Envío del formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tienePermiso = await verificarPermisos();
            if (!tienePermiso) return;

            const email = emailInput?.value.trim().toLowerCase();
            const password = passwordInput?.value;
            const passwordConf = passwordConfirm?.value;
            const nombre = el('cu_nombre')?.value.trim();
            const apellido = el('cu_apellido')?.value.trim();
            const cedula = el('cu_cedula')?.value.trim();
            const jerarquia = el('cu_jerarquia')?.value;
            const nivel = el('cu_nivel')?.value;

            if (!email || !password || !nombre || !apellido || !cedula || !jerarquia || !nivel) {
                mostrarMensaje('⚠️ Todos los campos obligatorios deben estar completos', 'error');
                return;
            }

            if (!validarFormatoEmail(email)) {
                mostrarMensaje('❌ El formato del email no es válido', 'error');
                emailInput.focus();
                return;
            }

            const emailExiste = await verificarEmailExiste(email);
            if (emailExiste) {
                mostrarMensaje('❌ No se puede crear el usuario: el email ya está registrado', 'error');
                emailInput.focus();
                return;
            }

            if (password !== passwordConf) {
                mostrarMensaje('❌ Las contraseñas no coinciden', 'error');
                return;
            }

            if (password.length < 6) {
                mostrarMensaje('❌ La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.textContent = '⏳ Creando usuario...';
            mostrarMensaje('⏳ Creando usuario...', 'info');

            try {
                const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: { data: { nombre, apellido, cedula } }
                });

                if (authError) throw new Error(authError.message);
                if (!authData.user) throw new Error('No se pudo crear el usuario');

                const { error: perfilError } = await window.supabaseClient
                    .from('perfiles_usuario')
                    .insert([{
                        user_id: authData.user.id,
                        nivel, creado_en: new Date().toISOString(),
                        intentos_fallidos: 0, bloqueado: false,
                        email, nombre, apellido, cedula,
                        foto_url: fotoUrl, jerarquia
                    }]);

                if (perfilError) throw new Error('Error en perfil: ' + perfilError.message);

                mostrarMensaje(`✅ Usuario creado exitosamente: ${email}`, 'success');
                form.reset();
                limpiarFoto();
                if (passwordStrength) passwordStrength.textContent = '';
                if (emailStatus) { emailStatus.className = 'email-status'; emailStatus.textContent = ''; }
                emailValido = false;

            } catch (err) {
                console.error('Error creando usuario:', err);
                mostrarMensaje('❌ Error: ' + err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = '✅ Crear Usuario';
            }
        });
    }

    console.log("✅ Módulo crear-usuario.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initCrearUsuario);
} else {
    window.initCrearUsuario();
}
