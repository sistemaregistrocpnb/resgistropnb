document.addEventListener('DOMContentLoaded', async () => {
    // ✅ 1. PROTECCIÓN INICIAL: Si ya hay sesión, ir al dashboard
    const { data: { session: sesionExistente } } = await window.supabaseClient.auth.getSession();
    if (sesionExistente) {
        window.location.href = 'dashboard.html';
        return;
    }

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
            // ==========================================
            // 🔍 PASO 1: Verificar perfil
            // ==========================================
            const { data: perfil, error: perfilErr } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('user_id, email, bloqueado, intentos_fallidos, fecha_bloqueo, nivel, nombre, apellido')
                .eq('email', email)
                .maybeSingle();

            if (perfilErr) throw new Error('Error de conexión con la base de datos.');
            if (!perfil) {
                mostrarMensaje('📭 <strong>Correo no registrado.</strong><br><span style="font-size:0.85rem;">Verifique que sea correcto.</span>', 'error');
                btn.disabled = false; btn.textContent = 'Iniciar Sesión'; return;
            }
            if (perfil.bloqueado === true) {
                const fechaBloqueo = perfil.fecha_bloqueo ? new Date(perfil.fecha_bloqueo).toLocaleString('es-VE') : 'fecha no disponible';
                mostrarMensaje(`🚫 <strong>Cuenta Bloqueada</strong><br><span style="font-size:0.85rem;">Bloqueada el ${fechaBloqueo}. Contacte al administrador.</span>`, 'error');
                btn.disabled = false; btn.textContent = 'Iniciar Sesión'; return;
            }

            // ==========================================
            // 🔐 PASO 2: Autenticación
            // ==========================================
            const { data: auth, error: authErr } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            
            if (authErr) {
                const intentosActuales = (perfil.intentos_fallidos || 0) + 1;
                await window.supabaseClient.from('perfiles_usuario').update({ intentos_fallidos: intentosActuales }).eq('user_id', perfil.user_id);
                
                if (intentosActuales >= MAX_INTENTOS) {
                    await window.supabaseClient.from('perfiles_usuario').update({ bloqueado: true, fecha_bloqueo: new Date().toISOString() }).eq('user_id', perfil.user_id);
                    mostrarMensaje('🚫 <strong>Bloqueado por exceder intentos.</strong>', 'error');
                } else {
                    mostrarMensaje(`❌ Contraseña incorrecta. Quedan ${MAX_INTENTOS - intentosActuales} intentos.`, 'error');
                }
                btn.disabled = false; btn.textContent = 'Iniciar Sesión'; return;
            }

            // ==========================================
            // ✅ PASO 3: Login exitoso - Verificar sesión duplicada
            // ==========================================
            const nivel = perfil.nivel || 'usuario';
            const nombreCompleto = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim().toUpperCase() || auth.user.email.split('@')[0].toUpperCase();

            // 🔒 Verificar si ya existe una sesión activa para este usuario en el canal global
            const canalVerificacion = window.supabaseClient.channel('sistema-presencia-global');
            let sesionesActivas = 0;

            await new Promise((resolve) => {
                canalVerificacion.on('presence', { event: 'sync' }, () => {
                    const estado = canalVerificacion.presenceState();
                    let count = 0;
                    for (const [key, presenceData] of Object.entries(estado)) {
                        // La clave en dashboard.js es: "user_id_sessionId"
                        // Contamos cuántas sesiones existen para este user_id específico
                        if (key.startsWith(auth.user.id + '_')) {
                            count++;
                        }
                    }
                    sesionesActivas = count;
                    resolve();
                });
                
                canalVerificacion.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        // Esperar 1 segundo para asegurar que la sincronización de presencia esté completa
                        setTimeout(() => resolve(), 1000);
                    }
                });
            });

            await canalVerificacion.unsubscribe();

            if (sesionesActivas > 0) {
                // Cerrar la sesión recién creada para mantener la seguridad
                await window.supabaseClient.auth.signOut();
                mostrarMensaje(
                    '🚫 <strong>Sesión Activa Detectada</strong><br>' +
                    '<span style="font-size:0.85rem;">Este usuario ya está conectado en otra ventana o dispositivo.<br><br>Por seguridad, no se permiten múltiples sesiones simultáneas del mismo usuario.<br><br>📞 Si cree que esto es un error, cierre la otra sesión o contacte al administrador.</span>',
                    'error'
                );
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
                return;
            }

            // Resetear contador de intentos al iniciar sesión correctamente
            if (perfil.intentos_fallidos > 0) {
                await window.supabaseClient.from('perfiles_usuario').update({ intentos_fallidos: 0, bloqueado: false, fecha_bloqueo: null }).eq('user_id', auth.user.id);
            }

            // ✅ GUARDAR HORA DE INICIO (para calcular duración al cerrar sesión)
            sessionStorage.setItem('pnb_login_time', Date.now().toString());

            // ✅ REGISTRAR EL LOGIN EN sistema_logs (con nombre y nivel)
            if (typeof window.registrarLogin === 'function') {
                await window.registrarLogin(nombreCompleto, auth.user.email, auth.user.id, nivel);
            }

            // Guardar sesión
            sessionStorage.setItem('pnb_user_id', auth.user.id);
            sessionStorage.setItem('pnb_user_email', auth.user.email);
            sessionStorage.setItem('pnb_user_nivel', nivel);

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
            mostrarMensaje('⚠️ <strong>Error de conexión.</strong><br><span style="font-size:0.85rem;">Verifique su conexión a internet.</span>', 'error');
            btn.disabled = false; btn.textContent = 'Iniciar Sesión';
        }
    });
});
