document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const btn = document.getElementById('btn-acceso');
    const msgBox = document.getElementById('mensaje');
    const MAX_INTENTOS = 3;
    
    if (!form) {
        console.error('⚠️ Formulario #login-form no encontrado en el DOM');
        return;
    }

    // ✅ Función para mostrar mensajes (usa innerHTML para permitir formato)
    function mostrarMensaje(texto, tipo) {
        msgBox.innerHTML = texto;
        msgBox.className = `mensaje ${tipo}`;
        msgBox.style.display = 'block';
        setTimeout(() => { msgBox.style.display = 'none'; }, 6000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = form.elements['email'].value.trim().toLowerCase();
        const password = form.elements['password'].value;

        btn.disabled = true;
        btn.textContent = 'Verificando...';
        msgBox.style.display = 'none';

        try {
            // ==========================================
            // 🔍 PASO 1: Verificar si el correo existe en perfiles_usuario
            // ==========================================
            const { data: perfil, error: perfilErr } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('user_id, email, bloqueado, intentos_fallidos, fecha_bloqueo')
                .eq('email', email)
                .maybeSingle();

            if (perfilErr) throw perfilErr;

            // ❌ CASO 1: El correo NO está registrado en el sistema
            if (!perfil) {
                mostrarMensaje(
                    '📭 <strong>Correo no registrado.</strong><br>' +
                    '<span style="font-size:0.85rem;">El correo ingresado no se encuentra en nuestro sistema. ' +
                    'Verifique que sea correcto o comuníquese con el administrador.</span>',
                    'error'
                );
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            // ==========================================
            // 🔒 PASO 2: Verificar si la cuenta está bloqueada
            // ==========================================
            if (perfil.bloqueado === true) {
                const fechaBloqueo = perfil.fecha_bloqueo 
                    ? new Date(perfil.fecha_bloqueo).toLocaleString('es-VE', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : 'fecha no disponible';
                
                mostrarMensaje(
                    '🚫 <strong>Cuenta Bloqueada</strong><br>' +
                    '<span style="font-size:0.85rem;">Su cuenta fue bloqueada el <strong>' + fechaBloqueo + '</strong> ' +
                    'por exceder el número máximo de intentos de acceso.<br><br>' +
                    '📞 Para solicitar el desbloqueo, comuníquese con el <strong>Administrador del Sistema</strong> ' +
                    'a través del Departamento OTIC-ZULIA.</span>',
                    'error'
                );
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            // ==========================================
            // 🔐 PASO 3: Intentar autenticación
            // ==========================================
            const { data: auth, error: authErr } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (authErr) {
                // ❌ Contraseña incorrecta (el email sí existe)
                const intentosActuales = (perfil.intentos_fallidos || 0) + 1;
                const intentosRestantes = MAX_INTENTOS - intentosActuales;

                // Actualizar contador de intentos
                await window.supabaseClient
                    .from('perfiles_usuario')
                    .update({ intentos_fallidos: intentosActuales })
                    .eq('user_id', perfil.user_id);

                // 🔒 CASO 3: Se agotaron los 3 intentos → BLOQUEAR
                if (intentosRestantes <= 0) {
                    await window.supabaseClient
                        .from('perfiles_usuario')
                        .update({ 
                            bloqueado: true, 
                            intentos_fallidos: 0,
                            fecha_bloqueo: new Date().toISOString()
                        })
                        .eq('user_id', perfil.user_id);

                    mostrarMensaje(
                        '🚫 <strong>Usted ha sido bloqueado</strong><br>' +
                        '<span style="font-size:0.85rem;">Ha excedido el número máximo de intentos de acceso (' + MAX_INTENTOS + ').<br><br>' +
                        '📞 <strong>Comuníquese con el Administrador del Sistema</strong> a través del Departamento OTIC-ZULIA ' +
                        'para solicitar el desbloqueo de su cuenta.</span>',
                        'error'
                    );
                } 
                // ⚠️ CASO 2: Todavía tiene intentos disponibles
                else {
                    let mensajeAdvertencia = '';
                    if (intentosRestantes === 1) {
                        mensajeAdvertencia = '⚠️ <strong>ADVERTENCIA:</strong> Le queda 1 intento antes del bloqueo.';
                    } else {
                        mensajeAdvertencia = 'Le quedan <strong>' + intentosRestantes + ' intentos</strong> disponibles.';
                    }

                    mostrarMensaje(
                        '❌ <strong>Contraseña incorrecta.</strong><br>' +
                        '<span style="font-size:0.85rem;">Las credenciales ingresadas no son válidas. ' +
                        'Verifique su contraseña e intente nuevamente.<br><br>' +
                        mensajeAdvertencia + '</span>',
                        'error'
                    );
                }

                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            // ==========================================
            // ✅ PASO 4: Login exitoso - verificar perfil completo
            // ==========================================
            const { data: perfilCompleto, error: perfilCompletoErr } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel, nombre_completo')
                .eq('user_id', auth.user.id)
                .single();

            if (perfilCompletoErr || !perfilCompleto) {
                throw new Error('Perfil de acceso no encontrado en el sistema.');
            }

            // 🔄 Resetear contador de intentos al iniciar sesión correctamente
            if (perfil.intentos_fallidos > 0) {
                await window.supabaseClient
                    .from('perfiles_usuario')
                    .update({ 
                        intentos_fallidos: 0,
                        bloqueado: false,
                        fecha_bloqueo: null
                    })
                    .eq('user_id', auth.user.id);
            }

            // Guardar sesión
            sessionStorage.setItem('pnb_user_id', auth.user.id);
            sessionStorage.setItem('pnb_user_email', auth.user.email);
            sessionStorage.setItem('pnb_user_nivel', perfilCompleto.nivel);
            if (perfilCompleto.nombre_completo) {
                sessionStorage.setItem('pnb_user_nombre', perfilCompleto.nombre_completo);
            }
            
            mostrarMensaje(
                '✅ <strong>Acceso concedido.</strong><br>' +
                '<span style="font-size:0.85rem;">Bienvenido al sistema. Redirigiendo al panel principal...</span>',
                'exito'
            );
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (err) {
            console.error('Error de acceso:', err);
            mostrarMensaje(
                '⚠️ <strong>Error de conexión.</strong><br>' +
                '<span style="font-size:0.85rem;">No se pudo establecer comunicación con el servidor. ' +
                'Verifique su conexión a internet e intente nuevamente.</span>',
                'error'
            );
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesión';
        }
    });
});
