document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const btn = document.getElementById('btn-acceso');
    const msgBox = document.getElementById('mensaje');
    const MAX_INTENTOS = 3;
    
    if (!form) {
        console.error('⚠️ Formulario #login-form no encontrado en el DOM');
        return;
    }

    function mostrarMensaje(texto, tipo) {
        msgBox.textContent = texto;
        msgBox.className = `mensaje ${tipo}`;
        msgBox.style.display = 'block';
        setTimeout(() => { msgBox.style.display = 'none'; }, 5000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // ✅ Acceso seguro a los inputs
        const email = form.elements['email'].value.trim().toLowerCase();
        const password = form.elements['password'].value;

        // 🔍 PASO 1: Verificar si el usuario está bloqueado ANTES de intentar login
        btn.disabled = true;
        btn.textContent = 'Verificando...';
        msgBox.style.display = 'none';

        try {
            // Primero verificamos si el email existe y está bloqueado
            const { data: perfilCheck, error: checkErr } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('user_id, bloqueado, intentos_fallidos, fecha_bloqueo')
                .eq('email', email)
                .maybeSingle();

            // Si hay un perfil y está bloqueado, rechazar inmediatamente
            if (perfilCheck && perfilCheck.bloqueado === true) {
                const fechaBloqueo = perfilCheck.fecha_bloqueo 
                    ? new Date(perfilCheck.fecha_bloqueo).toLocaleString('es-VE')
                    : 'fecha desconocida';
                
                mostrarMensaje(
                    `🚫 CUENTA BLOQUEADA - Su cuenta ha sido bloqueada después de ${MAX_INTENTOS} intentos fallidos el ${fechaBloqueo}. ` +
                    `Contacte al administrador del sistema para solicitar el desbloqueo.`,
                    'error'
                );
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            // 🔍 PASO 2: Intentar autenticación normal
            const { data: auth, error: authErr } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (authErr) {
                // ❌ Credenciales incorrectas
                let intentosActuales = (perfilCheck?.intentos_fallidos || 0) + 1;
                
                // Si el perfil no existe, buscarlo después del primer fallo para registrar
                if (!perfilCheck && authErr.message.includes('Invalid login credentials')) {
                    // Intentar buscar por email nuevamente (puede haber fallado el maybeSingle)
                    const { data: perfilRetry } = await window.supabaseClient
                        .from('perfiles_usuario')
                        .select('user_id, intentos_fallidos')
                        .eq('email', email)
                        .maybeSingle();
                    
                    if (perfilRetry) {
                        intentosActuales = (perfilRetry.intentos_fallidos || 0) + 1;
                        // Actualizar intentos
                        await window.supabaseClient
                            .from('perfiles_usuario')
                            .update({ intentos_fallidos: intentosActuales })
                            .eq('user_id', perfilRetry.user_id);
                    }
                } else if (perfilCheck) {
                    // Actualizar contador de intentos
                    await window.supabaseClient
                        .from('perfiles_usuario')
                        .update({ intentos_fallidos: intentosActuales })
                        .eq('user_id', perfilCheck.user_id);
                }

                // 🔒 BLOQUEAR si alcanzó el máximo
                if (intentosActuales >= MAX_INTENTOS && perfilCheck) {
                    await window.supabaseClient
                        .from('perfiles_usuario')
                        .update({ 
                            bloqueado: true, 
                            intentos_fallidos: 0,
                            fecha_bloqueo: new Date().toISOString()
                        })
                        .eq('user_id', perfilCheck.user_id);

                    mostrarMensaje(
                        `🚫 CUENTA BLOQUEADA - Ha excedido el número máximo de intentos (${MAX_INTENTOS}). ` +
                        `Su cuenta ha sido bloqueada. Contacte al administrador para desbloquearla.`,
                        'error'
                    );
                } else {
                    const intentosRestantes = MAX_INTENTOS - intentosActuales;
                    mostrarMensaje(
                        `❌ Credenciales incorrectas. Le ${intentosRestantes === 1 ? 'queda' : 'quedan'} ` +
                        `<strong>${intentosRestantes}</strong> intento${intentosRestantes === 1 ? '' : 's'} antes del bloqueo.`,
                        'error'
                    );
                }

                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            // ✅ PASO 3: Login exitoso - verificar perfil
            const { data: perfil, error: perfilErr } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel')
                .eq('user_id', auth.user.id)
                .single();

            if (perfilErr || !perfil) throw new Error('Perfil de acceso no encontrado.');

            // 🔒 PASO 4: Resetear contador de intentos tras login exitoso
            await window.supabaseClient
                .from('perfiles_usuario')
                .update({ 
                    intentos_fallidos: 0,
                    bloqueado: false,
                    fecha_bloqueo: null
                })
                .eq('user_id', auth.user.id);

            sessionStorage.setItem('pnb_user_id', auth.user.id);
            sessionStorage.setItem('pnb_user_email', auth.user.email);
            sessionStorage.setItem('pnb_user_nivel', perfil.nivel);
            
            mostrarMensaje('✅ Acceso concedido. Redirigiendo...', 'exito');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1200);

        } catch (err) {
            console.error('Error de acceso:', err);
            mostrarMensaje('❌ ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesión';
        }
    });
});
