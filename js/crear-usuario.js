window.initCrearUsuario = function() {
    console.log("⚙️ Iniciando módulo crear-usuario.js...");

    if (window._crearUsuarioInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
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

    let fotoUrl = null;

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

    // Validación de contraseña en tiempo real
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const val = e.target.value;
            let strength = '';
            let className = '';

            if (val.length === 0) {
                strength = '';
            } else if (val.length < 6) {
                strength = '⚠️ Muy débil (mínimo 6 caracteres)';
                className = 'weak';
            } else if (val.length < 8) {
                strength = '🟡 Débil';
                className = 'medium';
            } else if (val.length < 12) {
                strength = '🟠 Media';
                className = 'medium';
            } else {
                strength = '🟢 Fuerte';
                className = 'strong';
            }

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

            // Mostrar preview
            const reader = new FileReader();
            reader.onload = (e) => {
                if (fotoPreview) fotoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Subir a Supabase Storage
            try {
                mostrarMensaje('⏳ Subiendo foto...', 'info');
                
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                const fileName = `fotos_perfiles/${user.id}/${Date.now()}_${file.name}`;
                
                const { data, error } = await window.supabaseClient.storage
                    .from('fotos_perfiles')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

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
        if (fotoPreview) {
            fotoPreview.src = 'https://ui-avatars.com/api/?name=Usuario&background=002b5c&color=fff';
        }
        if (fotoInput) fotoInput.value = '';
    }

    // Envío del formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Verificar permisos
            const tienePermiso = await verificarPermisos();
            if (!tienePermiso) return;

            // Validaciones
            const email = el('cu_email')?.value.trim();
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

            if (password !== passwordConf) {
                mostrarMensaje('❌ Las contraseñas no coinciden', 'error');
                return;
            }

            if (password.length < 6) {
                mostrarMensaje('❌ La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }

            // Deshabilitar botón
            btnSubmit.disabled = true;
            btnSubmit.textContent = ' Creando usuario...';
            mostrarMensaje('⏳ Procesando...', 'info');

            try {
                // ✅ MÉTODO DIRECTO: Crear usuario con signUp
                const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            nombre: nombre,
                            apellido: apellido,
                            cedula: cedula
                        }
                    }
                });

                if (authError) throw authError;

                if (!authData.user) {
                    throw new Error('No se pudo crear el usuario');
                }

                // ✅ Insertar en perfiles_usuario
                const { error: perfilError } = await window.supabaseClient
                    .from('perfiles_usuario')
                    .insert([{
                        user_id: authData.user.id,
                        nivel: nivel,
                        creado_en: new Date().toISOString(),
                        intentos_fallidos: 0,
                        bloqueado: false,
                        email: email,
                        nombre: nombre,
                        apellido: apellido,
                        cedula: cedula,
                        foto_url: fotoUrl,
                        jerarquia: jerarquia
                    }]);

                if (perfilError) {
                    console.error('Error insertando perfil:', perfilError);
                    // Si falla el perfil, intentar eliminar el usuario creado
                    await window.supabaseClient.auth.admin.deleteUser(authData.user.id);
                    throw new Error('Usuario creado pero no se pudo guardar el perfil: ' + perfilError.message);
                }

                mostrarMensaje(`✅ Usuario creado exitosamente: ${email}`, 'success');
                form.reset();
                limpiarFoto();
                if (passwordStrength) passwordStrength.textContent = '';

            } catch (err) {
                console.error('Error creando usuario:', err);
                let errorMsg = err.message;
                
                if (errorMsg.includes('User already registered')) {
                    errorMsg = 'Este email ya está registrado';
                } else if (errorMsg.includes('password')) {
                    errorMsg = 'La contraseña no cumple los requisitos';
                }
                
                mostrarMensaje('❌ Error: ' + errorMsg, 'error');
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
