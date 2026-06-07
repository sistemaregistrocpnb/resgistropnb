window.initCrearUsuario = function() {
    console.log("⚙️ Iniciando módulo crear-usuario.js...");

    if (window._crearUsuarioInitialized) return;
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

    // Verificar permisos (solo administrador)
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
                mostrarMensaje('❌ Solo los administradores pueden crear usuarios', 'error');
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

    // ✅ VERIFICACIÓN DOBLE: perfiles_usuario + auth.users
    async function verificarEmailExiste(email) {
        if (!emailStatus) return false;

        emailStatus.className = 'email-status checking';
        emailStatus.textContent = '🔍 Verificando email...';
        emailInput.classList.remove('email-duplicate');
        emailValido = false;

        try {
            // 1️⃣ Verificar en perfiles_usuario
            const { data: perfilExistente, error: errPerfil } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('email, nombre, apellido, nivel')
                .eq('email', email.toLowerCase())
                .maybeSingle();

            if (perfilExistente) {
                emailStatus.className = 'email-status error';
                const nombreCompleto = `${perfilExistente.nombre || ''} ${perfilExistente.apellido || ''}`.trim();
                emailStatus.textContent = `⚠️ Email ya registrado${nombreCompleto ? ` a: ${nombreCompleto} (${perfilExistente.nivel})` : ''}`;
                emailInput.classList.add('email-duplicate');
                return { existe: true, tipo: 'perfil', datos: perfilExistente };
            }

            // 2️⃣ Verificar en auth.users (intentando login con contraseña incorrecta)
            try {
                const { error: authError } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: 'password_incorrecta_test_12345'
                });

                // Si el error es "Invalid login credentials", el email SÍ existe en auth
                if (authError && authError.message.toLowerCase().includes('invalid login credentials')) {
                    emailStatus.className = 'email-status error';
                    emailStatus.textContent = '⚠️ Email existe en el sistema (usuario huérfano - contactar soporte)';
                    emailInput.classList.add('email-duplicate');
                    return { existe: true, tipo: 'huerfano', datos: null };
                }
            } catch (e) {
                // Ignorar errores de red
            }

            // ✅ Email completamente disponible
            emailStatus.className = 'email-status success';
            emailStatus.textContent = '✅ Email disponible';
            emailInput.classList.remove('email-duplicate');
            emailValido = true;
            return { existe: false, tipo: null, datos: null };

        } catch (e) {
            console.error('Error verificando email:', e);
            emailStatus.className = 'email-status error';
            emailStatus.textContent = '⚠️ Error de conexión';
            return { existe: false, tipo: null, datos: null };
        }
    }

    // Event listeners para email
    let emailCheckTimeout = null;
    if (emailInput && emailStatus) {
        emailInput.addEventListener('input', function() {
            const val = this.value.trim().toLowerCase();
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
            if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
            emailCheckTimeout = setTimeout(() => verificarEmailExiste(val), 800);
        });

        emailInput.addEventListener('blur', function() {
            const val = this.value.trim().toLowerCase();
            if (val.length > 0 && validarFormatoEmail(val)) {
                verificarEmailExiste(val);
            }
        });
    }

    // Validación de contraseña
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const val = e.target.value;
            let strength = '', className = '';
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

    // Función limpiar foto (global)
    function limpiarFoto() {
        fotoUrl = null;
        if (fotoPreview) fotoPreview.src = 'https://ui-avatars.com/api/?name=Usuario&background=002b5c&color=fff';
        if (fotoInput) fotoInput.value = '';
    }
    window.limpiarFoto = limpiarFoto;

    if (el('cu_btn_quitar_foto')) {
        el('cu_btn_quitar_foto').onclick = () => limpiarFoto();
    }

    // Subir foto con validación
    if (fotoInput) {
        fotoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const camposObligatorios = [
                { id: 'cu_email', nombre: 'Email' },
                { id: 'cu_nombre', nombre: 'Nombre' },
                { id: 'cu_apellido', nombre: 'Apellido' },
                { id: 'cu_cedula', nombre: 'Cédula' },
                { id: 'cu_jerarquia', nombre: 'Jerarquía' },
                { id: 'cu_nivel', nombre: 'Nivel de Acceso' }
            ];

            const camposFaltantes = [];
            camposObligatorios.forEach(campo => {
                const elCampo = el(campo.id);
                if (!elCampo || !elCampo.value.trim()) camposFaltantes.push(campo.nombre);
            });

            if (camposFaltantes.length > 0) {
                mostrarMensaje(`⚠️ Complete primero: ${camposFaltantes.join(', ')}`, 'error');
                fotoInput.value = '';
                return;
            }

            if (!file.type.startsWith('image/')) {
                mostrarMensaje('❌ Solo se permiten imágenes', 'error');
                fotoInput.value = '';
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                mostrarMensaje('❌ La imagen no debe superar 2MB', 'error');
                fotoInput.value = '';
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
                fotoInput.value = '';
            }
        });
    }

    // ✅ FUNCIÓN PARA RECUPERAR USUARIO HUÉRFANO
    async function recuperarUsuarioHuerfano(email, password, userData) {
        try {
            // Intentar hacer login con la contraseña que el admin está creando
            const { data: loginData, error: loginError } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (loginError) {
                // Si la contraseña es incorrecta, no podemos recuperar
                return { success: false, error: 'El usuario existe pero con otra contraseña. Contacte al administrador del sistema.' };
            }

            // Si pudimos hacer login, el usuario existe y la contraseña es correcta
            // Ahora insertamos el perfil
            const { error: perfilError } = await window.supabaseClient
                .from('perfiles_usuario')
                .insert([{
                    user_id: loginData.user.id,
                    nivel: userData.nivel,
                    creado_en: new Date().toISOString(),
                    intentos_fallidos: 0,
                    bloqueado: false,
                    email: email,
                    nombre: userData.nombre,
                    apellido: userData.apellido,
                    cedula: userData.cedula,
                    foto_url: userData.foto_url,
                    jerarquia: userData.jerarquia
                }]);

            if (perfilError) {
                await window.supabaseClient.auth.signOut();
                return { success: false, error: 'Error al crear perfil: ' + perfilError.message };
            }

            await window.supabaseClient.auth.signOut();
            return { success: true, message: 'Usuario huérfano recuperado exitosamente' };
        } catch (err) {
            return { success: false, error: err.message };
        }
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

            const camposRequeridos = [
                { valor: email, nombre: 'Email', id: 'cu_email' },
                { valor: password, nombre: 'Contraseña', id: 'cu_password' },
                { valor: passwordConf, nombre: 'Confirmar Contraseña', id: 'cu_password_confirm' },
                { valor: nombre, nombre: 'Nombre', id: 'cu_nombre' },
                { valor: apellido, nombre: 'Apellido', id: 'cu_apellido' },
                { valor: cedula, nombre: 'Cédula', id: 'cu_cedula' },
                { valor: jerarquia, nombre: 'Jerarquía', id: 'cu_jerarquia' },
                { valor: nivel, nombre: 'Nivel de Acceso', id: 'cu_nivel' }
            ];

            const camposFaltantes = camposRequeridos.filter(c => !c.valor).map(c => c.nombre);
            if (camposFaltantes.length > 0) {
                mostrarMensaje(`⚠️ Faltan campos: ${camposFaltantes.join(', ')}`, 'error');
                const primerFaltante = camposRequeridos.find(c => !c.valor);
                if (primerFaltante) el(primerFaltante.id)?.focus();
                return;
            }

            if (!validarFormatoEmail(email)) {
                mostrarMensaje('❌ El formato del email no es válido', 'error');
                emailInput.focus();
                return;
            }

            // ✅ Verificación final
            const emailCheck = await verificarEmailExiste(email);
            if (emailCheck.existe) {
                if (emailCheck.tipo === 'huerfano') {
                    mostrarMensaje('⚠️ Este email ya existe en el sistema pero sin perfil. Contacte al administrador para recuperarlo.', 'error');
                } else {
                    mostrarMensaje('❌ No se puede crear el usuario: el email ya está registrado', 'error');
                }
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

                // ✅ Manejo específico del error "User already registered"
                if (authError) {
                    if (authError.message.toLowerCase().includes('already registered') || 
                        authError.message.toLowerCase().includes('already been registered')) {
                        
                        // Intentar recuperar el usuario huérfano
                        mostrarMensaje('⚠️ Email existe en auth. Intentando recuperar...', 'info');
                        
                        const recuperacion = await recuperarUsuarioHuerfano(email, password, {
                            nivel, nombre, apellido, cedula, foto_url: fotoUrl, jerarquia
                        });

                        if (recuperacion.success) {
                            mostrarMensaje(`✅ ${recuperacion.message}: ${email}`, 'success');
                            form.reset();
                            limpiarFoto();
                            if (passwordStrength) passwordStrength.textContent = '';
                            if (emailStatus) { emailStatus.className = 'email-status'; emailStatus.textContent = ''; }
                            emailValido = false;
                            return;
                        } else {
                            throw new Error(recuperacion.error);
                        }
                    }
                    throw new Error(authError.message);
                }

                if (!authData.user) {
                    throw new Error('No se pudo crear el usuario');
                }

                const { error: perfilError } = await window.supabaseClient
                    .from('perfiles_usuario')
                    .insert([{
                        user_id: authData.user.id,
                        nivel, creado_en: new Date().toISOString(),
                        intentos_fallidos: 0, bloqueado: false,
                        email, nombre, apellido, cedula,
                        foto_url: fotoUrl, jerarquia
                    }]);

                if (perfilError) {
                    console.error('Error insertando perfil:', perfilError);
                    throw new Error('Usuario creado pero no se pudo guardar el perfil: ' + perfilError.message);
                }

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
