// 🔒 BLOQUEO DE CONSOLA PARA SEGURIDAD
window.console.log = function() {};
window.console.warn = function() {};
window.console.error = function() {};
window.console.info = function() {};
window.console.debug = function() {};

document.addEventListener('DOMContentLoaded', async () => {
    const userEmailEl = document.getElementById('user-email');
    const userRoleEl = document.getElementById('user-role');
    const btnLogout = document.getElementById('btn-logout');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const appContent = document.getElementById('app-content');

    async function initDashboard() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        userEmailEl.textContent = session.user.email;

        try {
            const { data: perfil, error } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel, nombre, apellido, jerarquia, foto_url')
                .eq('user_id', session.user.id)
                .single();

            if (error || !perfil) {
                const nombreFallback = session.user.email.split('@')[0];
                document.getElementById('user-nombre-display').textContent = nombreFallback.toUpperCase();
                document.getElementById('user-jerarquia-display').textContent = 'NO ASIGNADA';
                document.getElementById('user-foto').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreFallback)}&background=002b5c&color=fff&size=128`;
            } else {
                const rol = (perfil.nivel || 'consultor').toLowerCase();
                sessionStorage.setItem('pnb_user_nivel', rol);
                document.getElementById('user-nombre-display').textContent = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim().toUpperCase() || 'NOMBRE NO DISPONIBLE';
                document.getElementById('user-jerarquia-display').textContent = perfil.jerarquia ? perfil.jerarquia.toUpperCase() : 'NO ASIGNADA';
                if (perfil.foto_url) {
                    document.getElementById('user-foto').src = perfil.foto_url;
                } else {
                    const iniciales = `${perfil.nombre || 'U'} ${perfil.apellido || 'S'}`;
                    document.getElementById('user-foto').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&background=002b5c&color=fff&size=128`;
                }
            }
        } catch (err) {
            // Error silencioso
        }

        const rolActual = (sessionStorage.getItem('pnb_user_nivel') || 'consultor').toLowerCase();
        userRoleEl.textContent = rolActual;
        aplicarPermisos(rolActual);
        configurarMenu();
        iniciarReloj();
        iniciarChatPrivado();
    }

    function aplicarPermisos(rol) {
        const mostrar = (elemento) => { if (elemento) elemento.style.display = ''; };
        
        if (rol === 'administrador') {
            mostrar(document.getElementById('menu-historial'));
            mostrar(document.getElementById('menu-gestion-usuarios'));
            mostrar(document.getElementById('menu-reg-personas'));
            mostrar(document.getElementById('menu-reg-vehiculos'));
            mostrar(document.getElementById('menu-pv'));
            mostrar(document.getElementById('menu-procesar'));
            mostrar(document.getElementById('menu-denuncias'));
            document.querySelectorAll('.submenu-item[data-accion="modificar"]').forEach(btn => mostrar(btn));
            document.querySelectorAll('.submenu-item[data-accion="eliminar"]').forEach(btn => mostrar(btn));
            document.querySelectorAll('.submenu-item[data-accion="consultar"]').forEach(btn => mostrar(btn));
        } else if (rol === 'moderador') {
            mostrar(document.getElementById('menu-reg-personas'));
            mostrar(document.getElementById('menu-reg-vehiculos'));
            mostrar(document.getElementById('menu-pv'));
            mostrar(document.getElementById('menu-procesar'));
            mostrar(document.getElementById('menu-denuncias'));
        }
    }

    async function cargarModulo(htmlPath, jsPath, initFnName) {
        appContent.innerHTML = '<div class="loading">⏳ Cargando módulo...</div>';
        try {
            const res = await fetch(htmlPath + '?v=' + Date.now());
            if (!res.ok) throw new Error('Archivo no encontrado');
            appContent.innerHTML = await res.text();
            if (jsPath) {
                const script = document.createElement('script');
                script.src = jsPath + '?v=' + Date.now();
                script.onload = () => { if (initFnName && typeof window[initFnName] === 'function') window[initFnName](); };
                document.head.appendChild(script);
            }
        } catch (err) {
            appContent.innerHTML = `<div class="card"><div class="placeholder error">❌ Error al cargar: ${err.message}</div></div>`;
        }
    }

    function configurarMenu() {
        document.querySelectorAll('[data-toggle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const submenu = document.getElementById(btn.dataset.toggle);
                document.querySelectorAll('.submenu').forEach(sm => {
                    if (sm.id !== btn.dataset.toggle) {
                        sm.classList.remove('show');
                        document.querySelector(`[data-toggle="${sm.id}"]`)?.classList.remove('expanded');
                    }
                });
                submenu.classList.toggle('show');
                btn.classList.toggle('expanded');
            });
        });

        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-src]');
            if (!btn) return;
            e.preventDefault();
            document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await cargarModulo(btn.dataset.src, btn.dataset.js, btn.dataset.init);
            if (window.innerWidth <= 900) sidebar.classList.remove('open');
        });

        if (menuToggle) {
            menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 900 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }

    function iniciarReloj() {
        const clockEl = document.getElementById('live-clock');
        if (!clockEl) return;
        const actualizar = () => {
            const ahora = new Date();
            clockEl.textContent = ahora.toLocaleString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
        };
        actualizar();
        setInterval(actualizar, 1000);
    }

    btnLogout.addEventListener('click', async () => {
        if (typeof window.registrarLogout === 'function') await window.registrarLogout();
        if (window.chatChannelPresence) {
            try { await window.chatChannelPresence.untrack(); await window.chatChannelPresence.unsubscribe(); } catch (e) {}
        }
        await window.supabaseClient.auth.signOut();
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    async function iniciarChatPrivado() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        const currentUserId = session.user.id;
        const currentUserRole = sessionStorage.getItem('pnb_user_nivel') || 'consultor';
        const nombreDOM = document.getElementById('user-nombre-display')?.textContent;
        const currentUserName = (nombreDOM && nombreDOM !== 'Cargando...' && nombreDOM !== 'NOMBRE NO DISPONIBLE')
            ? nombreDOM
            : (session.user.email?.split('@')[0].toUpperCase() || 'USUARIO');

        const chatBubble = document.getElementById('chat-bubble');
        const chatWindow = document.getElementById('chat-window');
        const chatClose = document.getElementById('chat-close');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatMessages = document.getElementById('chat-messages');
        const adminOnlinePanel = document.getElementById('admin-online-panel');
        const adminOnlineIndicator = document.getElementById('admin-online-indicator');
        const onlineCountSpan = document.getElementById('online-count');
        const onlineUsersList = document.getElementById('online-users-list');
        const replyIndicator = document.getElementById('reply-indicator');
        const replyToName = document.getElementById('reply-to-name');
        const cancelReplyBtn = document.getElementById('cancel-reply');

        let replyingToUserId = null;
        let activeChatUserId = null;

        // 1. PRESENCIA
        window.chatChannelPresence = window.supabaseClient.channel('sistema-presencia-global', {
            config: { presence: { key: currentUserId + '_' + (sessionStorage.getItem('pnb_session_id') || 'sess_default') } }
        });

        window.chatChannelPresence.on('presence', { event: 'sync' }, () => {
            const state = window.chatChannelPresence.presenceState();
            const usuariosEnLinea = [];
            for (const [clave, presenceData] of Object.entries(state)) {
                if (presenceData && presenceData.length > 0) {
                    usuariosEnLinea.push({ id: presenceData[0].user_id, ...presenceData[0] });
                }
            }
            if ((currentUserRole === 'administrador' || currentUserRole === 'moderador') && adminOnlinePanel) {
                const usuariosUnicos = [];
                const userIdsVistos = new Set();
                usuariosEnLinea.forEach(u => {
                    if (!userIdsVistos.has(u.id)) {
                        userIdsVistos.add(u.id);
                        usuariosUnicos.push(u);
                    }
                });
                adminOnlinePanel.style.display = 'block';
                adminOnlineIndicator.style.display = 'block';
                onlineCountSpan.textContent = usuariosUnicos.length;
                onlineUsersList.innerHTML = '';
                usuariosUnicos.forEach(user => {
                    const li = document.createElement('li');
                    li.textContent = `${user.nombre ? user.nombre.toUpperCase() : 'USUARIO'} (${user.rol ? user.rol.toUpperCase() : 'ROL'})`;
                    onlineUsersList.appendChild(li);
                });
            }
        });

        await window.chatChannelPresence.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await window.chatChannelPresence.track({ 
                    nombre: currentUserName, 
                    rol: currentUserRole,
                    user_id: currentUserId,
                    sessionId: sessionStorage.getItem('pnb_session_id') || 'sess_default',
                    timestamp: Date.now()
                });
            }
        });

        // 2. TIEMPO REAL MENSAJES (Lógica de privacidad corregida)
        window.chatChannelMessages = window.supabaseClient.channel('chat-room-privado')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensajes' }, (payload) => {
                const nuevoMensaje = payload.new;

                // ✅ Evitar duplicados estrictos por ID
                if (nuevoMensaje.id && document.querySelector(`[data-msg-id="${nuevoMensaje.id}"]`)) {
                    return;
                }

                const esMio = nuevoMensaje.remitente_id === currentUserId;
                const esParaMi = nuevoMensaje.receptor_id === currentUserId;
                const esParaSoporte = nuevoMensaje.receptor_id === null; // Mensajes dirigidos a Admin/Mod

                let puedoVerlo = false;

                if (currentUserRole === 'administrador' || currentUserRole === 'moderador') {
                    // Staff ve: mensajes propios, dirigidos a ellos, y consultas generales de soporte
                    puedoVerlo = esMio || esParaMi || esParaSoporte;
                } else {
                    // Consultor solo ve: mensajes propios y respuestas dirigidas específicamente a él
                    puedoVerlo = esMio || esParaMi;
                }

                if (puedoVerlo) {
                    if (chatWindow.style.display === 'none' && !esMio) {
                        const badge = document.getElementById('chat-notification');
                        if (badge) {
                            badge.style.display = 'flex';
                            badge.textContent = parseInt(badge.textContent || 0) + 1;
                        }
                    }
                    if (chatMessages) agregarMensajeAlDOM(nuevoMensaje);
                }
            })
            .subscribe();

        // 3. INTERFAZ
        if (chatBubble) {
            chatBubble.addEventListener('click', () => {
                const isVisible = chatWindow.style.display === 'flex';
                chatWindow.style.display = isVisible ? 'none' : 'flex';
                document.getElementById('chat-notification').style.display = 'none';
                document.getElementById('chat-notification').textContent = '0';
                if (!isVisible && chatInput) {
                    chatInput.focus();
                    cargarMensajesRecientes();
                }
            });
        }

        if (chatClose) chatClose.addEventListener('click', () => { chatWindow.style.display = 'none'; });

        if (cancelReplyBtn) {
            cancelReplyBtn.addEventListener('click', () => {
                replyingToUserId = null;
                replyIndicator.style.display = 'none';
                chatInput.placeholder = activeChatUserId ? `Escribe un mensaje para ${activeChatUserName.textContent}...` : 'Escribe tu mensaje...';
            });
        }

        window.activarRespuesta = (userId, userName) => {
            replyingToUserId = userId;
            replyToName.textContent = userName;
            replyIndicator.style.display = 'flex';
            chatInput.placeholder = `Escribe la respuesta para ${userName}...`;
            chatInput.focus();
        };

        // 4. ENVIAR MENSAJE (Sin vista optimista para evitar duplicados 100%)
        async function enviarMensaje() {
            const texto = chatInput.value.trim();
            if (!texto) return;

            // Deshabilitar controles para evitar doble envío
            chatSend.disabled = true;
            chatInput.disabled = true;

            let targetReceptor = replyingToUserId;
            // Si es staff y está en chat individual, va a ese usuario. Si no, va a null (soporte).
            if (!targetReceptor && activeChatUserId && (currentUserRole === 'administrador' || currentUserRole === 'moderador')) {
                targetReceptor = activeChatUserId;
            }

            try {
                const { error } = await window.supabaseClient.from('chat_mensajes').insert([{
                    remitente_id: currentUserId,
                    nombre_remitente: currentUserName,
                    rol_remitente: currentUserRole,
                    receptor_id: targetReceptor,
                    mensaje: texto,
                    tipo: (currentUserRole === 'administrador' || currentUserRole === 'moderador') ? 'staff' : 'user'
                }]);

                if (error) throw error;

                // Limpiar input (El listener de tiempo real agregará el mensaje real de forma segura)
                chatInput.value = '';
                if (targetReceptor) {
                    replyingToUserId = null;
                    replyIndicator.style.display = 'none';
                }
            } catch (err) {
                console.error('Error al enviar:', err);
                alert('No se pudo enviar el mensaje. Verifique su conexión.');
            } finally {
                chatSend.disabled = false;
                chatInput.disabled = false;
                chatInput.focus();
                chatInput.placeholder = activeChatUserId ? `Escribe un mensaje para ${activeChatUserName.textContent}...` : 'Escribe tu mensaje...';
            }
        }

        if (chatSend) chatSend.addEventListener('click', enviarMensaje);
        if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensaje(); });

        // 5. CARGAR HISTORIAL
        async function cargarMensajesRecientes() {
            if (!chatMessages) return;
            chatMessages.innerHTML = '<div class="chat-message system"><p>Cargando...</p></div>';
            
            let query = window.supabaseClient.from('chat_mensajes').select('*').order('creado_en', { ascending: true }).limit(50);
            
            // Aplicar la misma lógica de privacidad al cargar el historial
            if (currentUserRole === 'administrador' || currentUserRole === 'moderador') {
                // Staff ve todo lo que es para ellos o para soporte general
                query = query.or(`remitente_id.eq.${currentUserId},receptor_id.eq.${currentUserId},receptor_id.is.null`);
            } else {
                // Consultor solo ve lo propio o lo dirigido a él
                query = query.or(`remitente_id.eq.${currentUserId},receptor_id.eq.${currentUserId}`);
            }

            const { data, error } = await query;
            chatMessages.innerHTML = '';
            
            if (error) {
                chatMessages.innerHTML = '<div class="chat-message system"><p>Error al cargar el historial.</p></div>';
                return;
            }
            
            if (data && data.length > 0) {
                data.forEach(msg => agregarMensajeAlDOM(msg));
            } else {
                chatMessages.innerHTML = `
                <div class="chat-message system">
                    <p style="font-size: 0.9rem; font-weight: 600;">👋 ¡Bienvenido al Chat de Soporte OTIC-ZULIA!</p>
                    <p style="margin-top: 5px; font-size: 0.8rem;">Escribe tu consulta aquí abajo. Un administrador o moderador te responderá de forma privada a la brevedad.</p>
                </div>`;
            }
        }

        // 6. RENDERIZAR MENSAJE (Con Nombre y Nivel)
        function agregarMensajeAlDOM(msg) {
            if (!chatMessages) return;
            const div = document.createElement('div');
            if (msg.id) div.dataset.msgId = msg.id;

            const esMio = msg.remitente_id === currentUserId;
            const tipoClase = esMio ? ((currentUserRole === 'administrador' || currentUserRole === 'moderador') ? 'admin' : 'user') : (msg.tipo === 'staff' ? 'admin' : 'user');
            div.className = `chat-message ${tipoClase}`;

            const fecha = msg.creado_en ? new Date(msg.creado_en) : new Date();
            const hora = fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

            let htmlContent = '';
            const nombreMostrar = msg.nombre_remitente ? msg.nombre_remitente.toUpperCase() : (esMio ? 'TÚ' : 'USUARIO');
            const rolMostrar = msg.rol_remitente ? msg.rol_remitente.toUpperCase() : 'USUARIO';

            // Indicador de privado
            if (msg.receptor_id && msg.receptor_id !== 'general') {
                htmlContent += `<div class="msg-sender" style="font-size: 0.65rem; color: #f59e0b; margin-bottom: 2px;">🔒 Mensaje Privado</div>`;
            }

            // ✅ Mostrar Nombre y Nivel (Badge de color según rol)
            const badgeColor = rolMostrar === 'ADMINISTRADOR' ? '#dc2626' : (rolMostrar === 'MODERADOR' ? '#2563eb' : '#64748b');
            htmlContent += `<div class="msg-sender" style="display:flex; align-items:center; gap:6px; margin-bottom: 4px;">
                <span style="font-weight:700;">${esMio ? 'TÚ' : nombreMostrar}</span>
                <span style="font-size:0.65rem; background:${badgeColor}; color:white; padding:1px 6px; border-radius:4px; font-weight:700; letter-spacing:0.5px;">${rolMostrar}</span>
            </div>`;

            htmlContent += `<p style="margin-top: 0; line-height: 1.4;">${msg.mensaje}</p><span class="msg-meta">${hora}</span>`;

            // Botón de responder (Solo Admin/Mod)
            if ((currentUserRole === 'administrador' || currentUserRole === 'moderador') && msg.rol_remitente !== 'administrador' && msg.rol_remitente !== 'moderador' && !esMio) {
                const nombreSeguro = nombreMostrar.replace(/'/g, "\\'");
                htmlContent += `<button class="btn-reply" onclick="activarRespuesta('${msg.remitente_id}', '${nombreSeguro}')" title="Responder">↩️</button>`;
            }

            div.innerHTML = htmlContent;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    window.addEventListener('beforeunload', () => {
        if (window.chatChannelPresence) {
            try { window.chatChannelPresence.untrack(); } catch (e) {}
        }
    });

    initDashboard();
});
