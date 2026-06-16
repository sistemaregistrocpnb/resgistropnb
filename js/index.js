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
        msgBox.innerHTML = texto;
        msgBox.className = `mensaje ${tipo}`;
        msgBox.style.display = 'block';
        setTimeout(() => { msgBox.style.display = 'none'; }, 15000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.elements['email'].value.trim().toLowerCase();
        const password = form.elements['password'].value;
        
        btn.disabled = true;
        btn.textContent = 'Verificando...';
        msgBox.style.display = 'none';

        try {
            const { data: perfil, error: perfilErr } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('user_id, email, bloqueado, intentos_fallidos, fecha_bloqueo, nivel, nombre, apellido')
                .eq('email', email)
                .maybeSingle();

            if (perfilErr) throw new Error('Error de conexión con la base de datos.');

            if (!perfil) {
                mostrarMensaje(
                    '📭 <strong>Correo no registrado.</strong><br>' +
                    '<span style="font-size:0.85rem;">El correo ingresado no se encuentra en nuestro sistema. Verifique que sea correcto.</span>',
                    'error'
                );
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            if (perfil.bloqueado === true) {
                const fechaBloqueo = perfil.fecha_bloqueo 
                    ? new Date(perfil.fecha_bloqueo).toLocaleString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                    : 'fecha no disponible';
                
                mostrarMensaje(
                    '🚫 <strong>Cuenta Bloqueada</strong><br>' +
                    `<span style="font-size:0.85rem;">Su cuenta fue bloqueada el <strong>${fechaBloqueo}</strong> por exceder el número máximo de intentos.<br><br>📞 Comuníquese con el Administrador del Sistema (OTIC-ZULIA) para solicitar el desbloqueo.</span>`,
                    'error'
                );
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            const canalVerificacion = window.supabaseClient.channel('sistema-presencia-global');
            let sesionesActivas = 0;

            await new Promise((resolve) => {
                canalVerificacion.on('presence', { event: 'sync' }, () => {
                    const estado = canalVerificacion.presenceState();
                    let count = 0;
                    for (const [key] of Object.entries(estado)) {
                        if (key.startsWith(perfil.user_id + '_')) {
                            count++;
                        }
                    }
                    sesionesActivas = count;
                    resolve();
                });
                
                canalVerificacion.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        setTimeout(() => resolve(), 1000); 
                    }
                });
            });

            await canalVerificacion.unsubscribe();

            if (sesionesActivas > 0) {
                await window.supabaseClient.auth.signOut();
                mostrarMensaje(
                    '🚫 <strong>Usuario ya conectado</strong><br>' +
                    '<span style="font-size:0.85rem;">Este usuario tiene una sesión activa en otro dispositivo o ventana.<br><br>Por seguridad, no se permiten intentos de inicio de sesión mientras la sesión esté activa, protegiendo su cuenta de bloqueos maliciosos.</span>',
                    'error'
                );
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            const { data: auth, error: authErr } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            
            if (authErr) {
                const intentosActuales = (perfil.intentos_fallidos || 0) + 1;
                
                await window.supabaseClient
                    .from('perfiles_usuario')
                    .update({ intentos_fallidos: intentosActuales })
                    .eq('user_id', perfil.user_id);

                const intentosRestantes = MAX_INTENTOS - intentosActuales;

                if (intentosRestantes <= 0) {
                    await window.supabaseClient
                        .from('perfiles_usuario')
                        .update({ bloqueado: true, intentos_fallidos: 0, fecha_bloqueo: new Date().toISOString() })
                        .eq('user_id', perfil.user_id);
                    
                    mostrarMensaje(
                        '🚫 <strong>Usted ha sido bloqueado</strong><br>' +
                        '<span style="font-size:0.85rem;">Ha excedido el número máximo de intentos de acceso (3).<br><br>📞 Comuníquese con el Administrador del Sistema para solicitar el desbloqueo.</span>',
                        'error'
                    );
                } else {
                    const advertencia = intentosRestantes === 1 
                        ? '⚠️ <strong>ADVERTENCIA:</strong> Le queda <strong>1 intento</strong> antes del bloqueo.' 
                        : `Le quedan <strong>${intentosRestantes} intentos</strong> disponibles.`;
                    
                    mostrarMensaje(
                        '❌ <strong>Contraseña incorrecta.</strong><br>' +
                        `<span style="font-size:0.85rem;">Las credenciales ingresadas no son válidas. Verifique su contraseña.<br><br>${advertencia}</span>`,
                        'error'
                    );
                }
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            const nivel = perfil.nivel || 'usuario';
            const nombreCompleto = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim().toUpperCase() || auth.user.email.split('@')[0].toUpperCase();

            if (perfil.intentos_fallidos > 0) {
                await window.supabaseClient
                    .from('perfiles_usuario')
                    .update({ intentos_fallidos: 0, bloqueado: false, fecha_bloqueo: null })
                    .eq('user_id', auth.user.id);
            }

    
            sessionStorage.setItem('pnb_login_time', Date.now().toString());
            if (typeof window.registrarLogin === 'function') {
                await window.registrarLogin(nombreCompleto, auth.user.email, auth.user.id, nivel);
            }

            sessionStorage.setItem('pnb_user_id', auth.user.id);
            sessionStorage.setItem('pnb_user_email', auth.user.email);
            sessionStorage.setItem('pnb_user_nivel', nivel);
            sessionStorage.setItem('pnb_session_token', auth.session.access_token); 
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
                '<span style="font-size:0.85rem;">No se pudo establecer comunicación con el servidor. Verifique su conexión a internet o contacte a soporte.</span>',
                'error'
            );
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesión';
        }
    });
});
