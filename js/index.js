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
     
           const { data: perfiles, error: perfilErr } = await window.supabaseClient
  .from('perfiles_usuario')
  .select('user_id, email, bloqueado, intentos_fallidos, fecha_bloqueo, nivel')
  .eq('email', email)
  .limit(1); 

if (perfilErr) {
  console.error('Error al buscar perfil:', perfilErr);
  throw new Error('Error de conexión con la base de datos. Verifique las políticas RLS.');
}

const perfil = perfiles && perfiles.length > 0 ? perfiles[0] : null;

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

            const { data: auth, error: authErr } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (authErr) {
            
                const intentosActuales = (perfil.intentos_fallidos || 0) + 1;
                const intentosRestantes = MAX_INTENTOS - intentosActuales;

                await window.supabaseClient
                    .from('perfiles_usuario')
                    .update({ intentos_fallidos: intentosActuales })
                    .eq('user_id', perfil.user_id);

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
                } 
                    
                else {
                    const advertencia = intentosRestantes === 1 
                        ? '⚠️ <strong>ADVERTENCIA:</strong> Le queda 1 intento antes del bloqueo.' 
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

            if (perfil.intentos_fallidos > 0) {
                await window.supabaseClient
                    .from('perfiles_usuario')
                    .update({ intentos_fallidos: 0, bloqueado: false, fecha_bloqueo: null })
                    .eq('user_id', auth.user.id);
            }

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
