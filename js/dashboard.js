
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

}

const rolActual = (sessionStorage.getItem('pnb_user_nivel') || 'consultor').toLowerCase();
userRoleEl.textContent = rolActual;
aplicarPermisos(rolActual);

configurarMenu();
iniciarReloj();
iniciarChatPrivado();
}

function aplicarPermisos(rol) {
const mostrar = (elemento) => {
if (elemento) {
elemento.style.display = ''; 
}
};

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
} 
else if (rol === 'moderador') {

mostrar(document.getElementById('menu-reg-personas'));
mostrar(document.getElementById('menu-reg-vehiculos'));
mostrar(document.getElementById('menu-pv'));
mostrar(document.getElementById('menu-procesar'));
mostrar(document.getElementById('menu-denuncias'));


} 
else if (rol === 'consultor') {

} 
else {

}
}

async function cargarModulo(htmlPath, jsPath, initFnName) {
appContent.innerHTML = '<div class="loading"> Cargando módulo...</div>';
try {
const res = await fetch(htmlPath + '?v=' + Date.now());
if (!res.ok) throw new Error('Archivo no encontrado');
appContent.innerHTML = await res.text();

if (jsPath) {
const script = document.createElement('script');
script.src = jsPath + '?v=' + Date.now();
script.onload = () => {
if (initFnName && typeof window[initFnName] === 'function') {
window[initFnName]();
}
};
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
const opciones = { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
clockEl.textContent = ahora.toLocaleString('es-VE', opciones).replace(',', '');
};
actualizar();
setInterval(actualizar, 1000);
}
btnLogout.addEventListener('click', async () => {
    // ✅ REGISTRAR LOGOUT ANTES DE CERRAR SESIÓN (calcula duración)
    if (typeof window.registrarLogout === 'function') {
        await window.registrarLogout();
    }
    
    await window.supabaseClient.auth.signOut();
    sessionStorage.clear();
    window.location.href = 'index.html';
});

// ==========================================
// 🔹 LÓGICA DE CHAT PRIVADO Y PRESENCIA MEJORADA
// ==========================================
let chatChannelPresence = null;
let chatChannelMessages = null;
let replyingToUserId = null;
let activeChatUserId = null; // Usuario con el que se está chateando (null = general)
let currentChatPage = 1; // Página actual del panel de usuarios
const USERS_PER_PAGE = 5; // Usuarios por página

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
    const usersPagination = document.getElementById('users-pagination');
    const onlineUsersCount = document.getElementById('online-users-count');
    const activeChatIndicator = document.getElementById('active-chat-indicator');
    const activeChatUserName = document.getElementById('active-chat-user-name');
    const backToGeneralBtn = document.getElementById('back-to-general');

    // Variable para almacenar usuarios en línea
    let usuariosEnLinea = [];

    // 1. PRESENCIA
    chatChannelPresence = window.supabaseClient.channel('sistema-presence', {
        config: { presence: { key: currentUserId } }
    });

    chatChannelPresence.on('presence', { event: 'sync' }, () => {
        const state = chatChannelPresence.presenceState();
        usuariosEnLinea = [];

        for (const [userId, presenceData] of Object.entries(state)) {
            if (presenceData && presenceData.length > 0) {
                usuariosEnLinea.push({ id: userId, ...presenceData[presenceData.length - 1] });
            }
        }

        // Solo el administrador ve el panel
        if (currentUserRole === 'administrador') {
            adminOnlinePanel.style.display = 'block';
            adminOnlineIndicator.style.display = 'block';
            onlineCountSpan.textContent = usuariosEnLinea.length;
            onlineUsersCount.textContent = `(${usuariosEnLinea.length} conectados)`;
            renderizarUsuariosEnLinea();
        }
    });

    await chatChannelPresence.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await chatChannelPresence.track({ nombre: currentUserName, rol: currentUserRole });
        }
    });

    // 2. Renderizar usuarios en línea con paginación
    function renderizarUsuariosEnLinea() {
        if (!onlineUsersList || !usersPagination) return;

        const totalPages = Math.ceil(usuariosEnLinea.length / USERS_PER_PAGE);
        if (currentChatPage > totalPages) currentChatPage = 1;

        const inicio = (currentChatPage - 1) * USERS_PER_PAGE;
        const fin = inicio + USERS_PER_PAGE;
        const usuariosPagina = usuariosEnLinea.slice(inicio, fin);

        // Renderizar lista de usuarios
        onlineUsersList.innerHTML = '';
        usuariosPagina.forEach(user => {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.style.padding = '4px 8px';
            li.style.borderRadius = '4px';
            li.style.transition = 'background 0.2s';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';

            const nombreUser = user.nombre ? user.nombre.toUpperCase() : 'USUARIO';
            const rolUser = user.rol ? user.rol.toUpperCase() : 'ROL';

            // Indicador de chat activo
            const isActive = activeChatUserId === user.id;
            if (isActive) {
                li.style.background = '#dbeafe';
                li.style.border = '1px solid #93c5fd';
            }

            li.innerHTML = `
                <span style="flex: 1;">
                    <span style="font-weight: 600; font-size: 0.8rem;">${nombreUser}</span>
                    <span style="font-size: 0.7rem; color: #64748b; margin-left: 4px;">(${rolUser})</span>
                </span>
                <button class="btn-chat-user" data-user-id="${user.id}" data-user-name="${nombreUser}" 
                    style="background: ${isActive ? '#1e40af' : '#10b981'}; color: white; border: none; 
                    padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
                    ${isActive ? '💬 Activo' : '💬 Chat'}
                </button>
            `;

            // Evento para iniciar chat individual
            const btnChat = li.querySelector('.btn-chat-user');
            btnChat.addEventListener('click', (e) => {
                e.stopPropagation();
                iniciarChatIndividual(user.id, nombreUser);
            });

            onlineUsersList.appendChild(li);
        });

        // Renderizar paginación
        usersPagination.innerHTML = '';
        if (totalPages > 1) {
            // Botón anterior
            const btnPrev = document.createElement('button');
            btnPrev.textContent = '◀';
            btnPrev.disabled = currentChatPage === 1;
            btnPrev.style.cssText = 'background: white; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;';
            btnPrev.onclick = () => {
                if (currentChatPage > 1) {
                    currentChatPage--;
                    renderizarUsuariosEnLinea();
                }
            };
            usersPagination.appendChild(btnPrev);

            // Números de página
            for (let i = 1; i <= totalPages; i++) {
                const btnPage = document.createElement('button');
                btnPage.textContent = i;
                btnPage.style.cssText = `background: ${i === currentChatPage ? '#10b981' : 'white'}; 
                    color: ${i === currentChatPage ? 'white' : '#166534'}; 
                    border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 4px; 
                    cursor: pointer; font-size: 0.7rem; font-weight: ${i === currentChatPage ? 'bold' : 'normal'};`;
                btnPage.onclick = () => {
                    currentChatPage = i;
                    renderizarUsuariosEnLinea();
                };
                usersPagination.appendChild(btnPage);
            }

            // Botón siguiente
            const btnNext = document.createElement('button');
            btnNext.textContent = '▶';
            btnNext.disabled = currentChatPage === totalPages;
            btnNext.style.cssText = 'background: white; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;';
            btnNext.onclick = () => {
                if (currentChatPage < totalPages) {
                    currentChatPage++;
                    renderizarUsuariosEnLinea();
                }
            };
            usersPagination.appendChild(btnNext);
        }
    }

    // 3. Iniciar chat individual
    function iniciarChatIndividual(userId, userName) {
        activeChatUserId = userId;
        activeChatUserName.textContent = userName;
        activeChatIndicator.style.display = 'block';
        
        // Actualizar placeholder del input
        chatInput.placeholder = `Escribe un mensaje para ${userName}...`;
        
        // Re-renderizar para actualizar botones
        renderizarUsuariosEnLinea();
        
        // Cargar mensajes del chat individual
        cargarMensajesIndividuales(userId);
    }

    // 4. Volver al chat general
    if (backToGeneralBtn) {
        backToGeneralBtn.addEventListener('click', () => {
            activeChatUserId = null;
            activeChatIndicator.style.display = 'none';
            chatInput.placeholder = 'Escribe tu mensaje...';
            renderizarUsuariosEnLinea();
            cargarMensajesRecientes();
        });
    }

    // 5. TIEMPO REAL MENSAJES
    chatChannelMessages = window.supabaseClient
        .channel('chat-room-privado')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensajes' }, (payload) => {
            const nuevoMensaje = payload.new;

            if (nuevoMensaje.id && document.querySelector(`[data-msg-id="${nuevoMensaje.id}"]`)) {
                return;
            }

            const esParaMi = nuevoMensaje.receptor_id === currentUserId || nuevoMensaje.receptor_id === null;
            const esMio = nuevoMensaje.remitente_id === currentUserId;
            const esDelChatActivo = !activeChatUserId || nuevoMensaje.receptor_id === activeChatUserId || nuevoMensaje.remitente_id === activeChatUserId;

            // Mostrar mensaje si:
            // - Es para mí (general o individual)
            // - Es mío
            // - Soy admin y el mensaje es del chat activo
            if ((esParaMi || esMio) && esDelChatActivo) {
                if (chatWindow.style.display === 'none' && !esMio) {
                    const badge = document.getElementById('chat-notification');
                    badge.style.display = 'flex';
                    badge.textContent = parseInt(badge.textContent || 0) + 1;
                }
                agregarMensajeAlDOM(nuevoMensaje);
            }

            // Si el admin está en chat general y llega un mensaje individual, actualizar panel
            if (currentUserRole === 'administrador' && !activeChatUserId && nuevoMensaje.receptor_id) {
                renderizarUsuariosEnLinea();
            }
        })
        .subscribe();

    // 6. INTERFAZ
    if (chatBubble) {
        chatBubble.addEventListener('click', () => {
            const isVisible = chatWindow.style.display === 'flex';
            chatWindow.style.display = isVisible ? 'none' : 'flex';
            document.getElementById('chat-notification').style.display = 'none';
            document.getElementById('chat-notification').textContent = '0';
            if (!isVisible) {
                chatInput.focus();
                if (activeChatUserId) {
                    cargarMensajesIndividuales(activeChatUserId);
                } else {
                    cargarMensajesRecientes();
                }
            }
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => { chatWindow.style.display = 'none'; });
    }

    // 7. LÓGICA DE RESPUESTA
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

    // 8. ENVIAR MENSAJE
    async function enviarMensaje() {
        const texto = chatInput.value.trim();
        if (!texto) return;

        const tempId = 'temp-' + Date.now();
        const targetReceptor = replyingToUserId || activeChatUserId; // Si hay respuesta individual, usar ese; si no, el chat activo

        const mensajeTemp = {
            id: tempId,
            remitente_id: currentUserId,
            nombre_remitente: currentUserName,
            rol_remitente: currentUserRole,
            receptor_id: targetReceptor,
            mensaje: texto,
            tipo: currentUserRole === 'administrador' ? 'admin' : 'user',
            creado_en: new Date().toISOString()
        };

        agregarMensajeAlDOM(mensajeTemp);
        chatInput.value = '';

        if (targetReceptor) {
            replyingToUserId = null;
            replyIndicator.style.display = 'none';
            chatInput.placeholder = activeChatUserId ? `Escribe un mensaje para ${activeChatUserName.textContent}...` : 'Escribe tu mensaje...';
        }

        const { data, error } = await window.supabaseClient
            .from('chat_mensajes')
            .insert([{
                remitente_id: currentUserId,
                nombre_remitente: currentUserName,
                rol_remitente: currentUserRole,
                receptor_id: targetReceptor,
                mensaje: texto,
                tipo: currentUserRole === 'administrador' ? 'admin' : 'user'
            }])
            .select()
            .single();

        if (error) {
            const tempDiv = document.querySelector(`[data-msg-id="${tempId}"]`);
            if (tempDiv) tempDiv.remove();
        } else if (data) {
            const tempDiv = document.querySelector(`[data-msg-id="${tempId}"]`);
            if (tempDiv) tempDiv.remove();
        }
    }

    if (chatSend) chatSend.addEventListener('click', enviarMensaje);
    if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensaje(); });

    // 9. CARGAR MENSAJES INDIVIDUALES
    async function cargarMensajesIndividuales(userId) {
        chatMessages.innerHTML = '<div class="chat-message system"><p>Cargando conversación...</p></div>';

        const { data, error } = await window.supabaseClient
            .from('chat_mensajes')
            .select('*')
            .or(`and(remitente_id.eq.${currentUserId},receptor_id.eq.${userId}),and(remitente_id.eq.${userId},receptor_id.eq.${currentUserId})`)
            .order('creado_en', { ascending: true })
            .limit(50);

        chatMessages.innerHTML = '';

        if (error) {
            chatMessages.innerHTML = '<div class="chat-message system"><p>Error al cargar la conversación.</p></div>';
            return;
        }

        if (data && data.length > 0) {
            data.forEach(msg => agregarMensajeAlDOM(msg));
        } else {
            chatMessages.innerHTML = `
                <div class="chat-message system">
                    <p style="font-size: 0.9rem; font-weight: 600;">💬 Inicio de conversación privada</p>
                    <p style="margin-top: 5px; font-size: 0.8rem;">Escribe tu mensaje aquí. Solo tú y el usuario podrán ver esta conversación.</p>
                </div>
            `;
        }
    }

    // 10. CARGAR HISTORIAL GENERAL
    async function cargarMensajesRecientes() {
        chatMessages.innerHTML = '<div class="chat-message system"><p>Cargando...</p></div>';

        const { data, error } = await window.supabaseClient
            .from('chat_mensajes')
            .select('*')
            .is('receptor_id', null)
            .order('creado_en', { ascending: true })
            .limit(50);

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
                    <p style="font-size: 0.9rem; font-weight: 600;">👋 ¡Bienvenido al Chat General!</p>
                    <p style="margin-top: 5px; font-size: 0.8rem;">Este es el chat general del sistema. Los administradores pueden responder tus consultas.</p>
                </div>
            `;
        }
    }

    // 11. RENDERIZAR MENSAJE
    function agregarMensajeAlDOM(msg) {
        const div = document.createElement('div');

        if (msg.id && !msg.id.startsWith('temp-')) {
            div.dataset.msgId = msg.id;
        }

        const esMio = msg.remitente_id === currentUserId;
        const tipoClase = esMio ? (currentUserRole === 'administrador' ? 'admin' : 'user') : (msg.tipo || 'user');
        div.className = `chat-message ${tipoClase}`;

        const fecha = msg.creado_en ? new Date(msg.creado_en) : new Date();
        const hora = fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

        let htmlContent = '';
        const nombreMostrar = msg.nombre_remitente ? msg.nombre_remitente.toUpperCase() : (esMio ? 'TÚ' : 'USUARIO');

        // Indicador de mensaje privado
        if (msg.receptor_id && !msg.receptor_id.startsWith('temp-')) {
            htmlContent += `<div class="msg-sender" style="font-size: 0.65rem; color: #f59e0b;">🔒 Mensaje privado</div>`;
        }

        if (msg.rol_remitente === 'administrador' && msg.receptor_id) {
            htmlContent += `<div class="msg-sender">✉️ Respuesta de Soporte</div>`;
        } else if (!esMio) {
            htmlContent += `<div class="msg-sender">${nombreMostrar}</div>`;
        }

        htmlContent += `<p>${msg.mensaje}</p><span class="msg-meta">${hora}</span>`;

        if (currentUserRole === 'administrador' && msg.rol_remitente !== 'administrador' && !esMio) {
            const nombreSeguro = nombreMostrar.replace(/'/g, "\\'");
            htmlContent += `<button class="btn-reply" onclick="activarRespuesta('${msg.remitente_id}', '${nombreSeguro}')" title="Responder">↩️</button>`;
        }

        div.innerHTML = htmlContent;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

initDashboard();
});
