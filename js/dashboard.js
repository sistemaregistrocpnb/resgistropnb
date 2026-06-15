
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
// 🔹 LÓGICA DE CHAT PRIVADO, PRESENCIA Y PAGINACIÓN
// ==========================================
let chatChannelPresence = null;
let chatChannelMessages = null;
let replyingToUserId = null;
let activeChatUserId = null; // ID del usuario con el que chatea el admin (null = general)
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

    // ✅ 1. DEFINIR TODOS LOS ELEMENTOS DEL DOM AQUÍ PARA EVITAR ERRORES
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
    
    // Elementos nuevos para paginación y chat individual
    const usersPagination = document.getElementById('users-pagination');
    const onlineUsersCount = document.getElementById('online-users-count');
    const activeChatIndicator = document.getElementById('active-chat-indicator');
    const activeChatUserName = document.getElementById('active-chat-user-name');
    const backToGeneralBtn = document.getElementById('back-to-general');
    
    const replyIndicator = document.getElementById('reply-indicator');
    const replyToName = document.getElementById('reply-to-name');
    const cancelReplyBtn = document.getElementById('cancel-reply'); // ✅ ESTA ERA LA QUE FALTABA

    let usuariosEnLinea = [];

    // 2. PRESENCIA (Usuarios conectados)
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

        // Solo el admin ve el panel y la paginación
        if (currentUserRole === 'administrador') {
            adminOnlinePanel.style.display = 'block';
            adminOnlineIndicator.style.display = 'block';
            onlineCountSpan.textContent = usuariosEnLinea.length;
            if(onlineUsersCount) onlineUsersCount.textContent = `(${usuariosEnLinea.length} conectados)`;
            renderizarUsuariosEnLinea();
        }
    });

    await chatChannelPresence.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await chatChannelPresence.track({ nombre: currentUserName, rol: currentUserRole });
        }
    });

    // 3. FUNCIÓN PARA RENDERIZAR USUARIOS CON PAGINACIÓN
    function renderizarUsuariosEnLinea() {
        if (!onlineUsersList || !usersPagination) return;

        const totalPages = Math.ceil(usuariosEnLinea.length / USERS_PER_PAGE);
        if (currentChatPage > totalPages && totalPages > 0) currentChatPage = totalPages;
        if (totalPages === 0) currentChatPage = 1;

        const inicio = (currentChatPage - 1) * USERS_PER_PAGE;
        const fin = inicio + USERS_PER_PAGE;
        const usuariosPagina = usuariosEnLinea.slice(inicio, fin);

        onlineUsersList.innerHTML = '';
        usuariosPagina.forEach(user => {
            const li = document.createElement('li');
            li.style.cssText = 'cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: background 0.2s; display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';
            
            const nombreUser = user.nombre ? user.nombre.toUpperCase() : 'USUARIO';
            const rolUser = user.rol ? user.rol.toUpperCase() : 'ROL';
            const isActive = activeChatUserId === user.id;

            if (isActive) {
                li.style.background = '#dbeafe';
                li.style.border = '1px solid #93c5fd';
            } else {
                li.style.background = 'transparent';
                li.style.border = '1px solid transparent';
            }

            li.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.8rem; color: #1e293b;">${nombreUser}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">${rolUser}</div>
                </div>
                <button class="btn-chat-user" data-user-id="${user.id}" data-user-name="${nombreUser}" 
                    style="background: ${isActive ? '#1e40af' : '#10b981'}; color: white; border: none; 
                    padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
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

        // Renderizar botones de paginación
        usersPagination.innerHTML = '';
        if (totalPages > 1) {
            const crearBtn = (texto, disabled, onClick) => {
                const btn = document.createElement('button');
                btn.textContent = texto;
                btn.disabled = disabled;
                btn.style.cssText = `background: white; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 4px; cursor: ${disabled ? 'default' : 'pointer'}; font-size: 0.7rem; color: ${disabled ? '#ccc' : '#166534'};`;
                if (!disabled) btn.onclick = onClick;
                return btn;
            };

            usersPagination.appendChild(crearBtn('◀', currentChatPage === 1, () => { currentChatPage--; renderizarUsuariosEnLinea(); }));
            
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.style.cssText = `background: ${i === currentChatPage ? '#10b981' : 'white'}; color: ${i === currentChatPage ? 'white' : '#166534'}; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; font-weight: bold;`;
                btn.onclick = () => { currentChatPage = i; renderizarUsuariosEnLinea(); };
                usersPagination.appendChild(btn);
            }

            usersPagination.appendChild(crearBtn('▶', currentChatPage === totalPages, () => { currentChatPage++; renderizarUsuariosEnLinea(); }));
        }
    }

    // 4. INICIAR CHAT INDIVIDUAL
    function iniciarChatIndividual(userId, userName) {
        activeChatUserId = userId;
        if(activeChatUserName) activeChatUserName.textContent = userName;
        if(activeChatIndicator) activeChatIndicator.style.display = 'flex';
        
        chatInput.placeholder = `Escribe un mensaje para ${userName}...`;
        renderizarUsuariosEnLinea();
        cargarMensajesIndividuales(userId);
    }

    // 5. VOLVER AL CHAT GENERAL (O LISTA)
    if (backToGeneralBtn) {
        backToGeneralBtn.addEventListener('click', () => {
            activeChatUserId = null;
            if(activeChatIndicator) activeChatIndicator.style.display = 'none';
            chatInput.placeholder = 'Escribe tu mensaje...';
            renderizarUsuariosEnLinea();
            cargarMensajesRecientes();
        });
    }

    // 6. TIEMPO REAL MENSAJES
    chatChannelMessages = window.supabaseClient
        .channel('chat-room-privado')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensajes' }, (payload) => {
            const nuevoMensaje = payload.new;

            if (nuevoMensaje.id && document.querySelector(`[data-msg-id="${nuevoMensaje.id}"]`)) {
                return;
            }

            // Lógica de visibilidad:
            // 1. Es mío -> Lo veo.
            // 2. Es para mí (receptor_id == mi ID) -> Lo veo.
            // 3. Soy Admin -> Veo todo (para poder moderar y ver solicitudes de usuarios).
            // 4. Si es mensaje de usuario (receptor_id null o admin) y no soy admin -> Solo veo si soy el remitente.
            
            const esMio = nuevoMensaje.remitente_id === currentUserId;
            const esParaMi = nuevoMensaje.receptor_id === currentUserId;
            const soyAdmin = currentUserRole === 'administrador';
            
            // Los mensajes con receptor_id null son "Solicitudes al Admin". Solo los ve el Admin y el que lo envió.
            const esSolicitudAdmin = !nuevoMensaje.receptor_id && nuevoMensaje.remitente_id !== currentUserId;
            
            if (esMio || esParaMi || soyAdmin) {
                // Si soy usuario y no es mío ni para mí, no lo muestro (a menos que sea broadcast, pero aquí usamos null para admin)
                if (!soyAdmin && !esMio && !esParaMi) return;

                if (chatWindow.style.display === 'none' && !esMio) {
                    const badge = document.getElementById('chat-notification');
                    if(badge) {
                        badge.style.display = 'flex';
                        badge.textContent = parseInt(badge.textContent || 0) + 1;
                    }
                }
                
                // Si estoy viendo el chat individual con este usuario, o es general, lo muestro
                if (!activeChatUserId || nuevoMensaje.remitente_id === activeChatUserId || nuevoMensaje.receptor_id === activeChatUserId || soyAdmin) {
                     agregarMensajeAlDOM(nuevoMensaje);
                }
            }
        })
        .subscribe();

    // 7. INTERFAZ (Abrir/Cerrar chat)
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

    // 8. LÓGICA DE RESPUESTA RÁPIDA
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

    // 9. ENVIAR MENSAJE
    async function enviarMensaje() {
        const texto = chatInput.value.trim();
        if (!texto) return;

        const tempId = 'temp-' + Date.now();
        
        // Lógica de destino:
        // Si estoy respondiendo a alguien específico -> Ese usuario.
        // Si soy Admin y estoy en un chat individual -> Ese usuario.
        // Si soy Usuario -> Siempre va al Admin (receptor_id = null o ID de admin si se supiera, usaremos null para "Soporte")
        let targetReceptor = replyingToUserId;
        if (!targetReceptor && activeChatUserId && currentUserRole === 'administrador') {
            targetReceptor = activeChatUserId;
        }
        // Si es usuario y no hay target, se queda null (llega al admin por RLS)

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

    // 10. CARGAR MENSAJES INDIVIDUALES (Admin <-> Usuario)
    async function cargarMensajesIndividuales(userId) {
        chatMessages.innerHTML = '<div class="chat-message system"><p>Cargando conversación...</p></div>';

        // Traer mensajes entre yo y el usuario seleccionado
        const { data, error } = await window.supabaseClient
            .from('chat_mensajes')
            .select('*')
            .or(`and(remitente_id.eq.${currentUserId},receptor_id.eq.${userId}),and(remitente_id.eq.${userId},receptor_id.eq.${currentUserId})`)
            .order('creado_en', { ascending: true })
            .limit(50);

        chatMessages.innerHTML = '';

        if (error) {
            chatMessages.innerHTML = '<div class="chat-message system"><p>Error al cargar.</p></div>';
            return;
        }

        if (data && data.length > 0) {
            data.forEach(msg => agregarMensajeAlDOM(msg));
        } else {
            chatMessages.innerHTML = `<div class="chat-message system"><p>💬 Inicio de conversación privada</p></div>`;
        }
    }

    // 11. CARGAR HISTORIAL GENERAL (Para Admin)
    async function cargarMensajesRecientes() {
        chatMessages.innerHTML = '<div class="chat-message system"><p>Cargando...</p></div>';

        // Si soy admin, veo los mensajes generales (receptor null) o todos los de usuarios esperando respuesta
        // Si soy usuario, veo mis mensajes (remitente o receptor)
        let query = window.supabaseClient.from('chat_mensajes').select('*').order('creado_en', { ascending: true }).limit(50);
        
        if (currentUserRole !== 'administrador') {
            query = query.or(`remitente_id.eq.${currentUserId},receptor_id.eq.${currentUserId}`);
        }

        const { data, error } = await query;

        chatMessages.innerHTML = '';
        if (error) {
            chatMessages.innerHTML = '<div class="chat-message system"><p>Error al cargar.</p></div>';
            return;
        }

        if (data && data.length > 0) {
            data.forEach(msg => agregarMensajeAlDOM(msg));
        } else {
            chatMessages.innerHTML = `<div class="chat-message system"><p>👋 No hay mensajes recientes.</p></div>`;
        }
    }

    // 12. RENDERIZAR MENSAJE EN PANTALLA
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

        // Indicador de privado
        if (msg.receptor_id && msg.receptor_id !== 'general') {
            htmlContent += `<div class="msg-sender" style="font-size: 0.65rem; color: #f59e0b;">🔒 Privado</div>`;
        }

        if (msg.rol_remitente === 'administrador' && msg.receptor_id) {
            htmlContent += `<div class="msg-sender">️ Soporte</div>`;
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
