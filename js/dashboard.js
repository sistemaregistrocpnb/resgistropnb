// 🔒 SEGURIDAD: Desactivar mensajes de depuración en producción
// Solo permite logs si estás trabajando en tu computadora local
const esEntornoLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (!esEntornoLocal) {
    console.log = function() {};
    console.warn = function() {};
    // Nota: No desactivamos console.error para poder detectar fallos reales del sistema si ocurren
}document.addEventListener('DOMContentLoaded', async () => {
  const userEmailEl = document.getElementById('user-email');
  const userRoleEl = document.getElementById('user-role');
  const btnLogout = document.getElementById('btn-logout');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const appContent = document.getElementById('app-content');

  async function initDashboard() {
    // 1. Verificar sesión
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return;
    }

    // 2. Mostrar email en el navbar
    userEmailEl.textContent = session.user.email;

    // 3. ✅ Cargar datos del perfil (Jerarquía sin prefijo, Nombre en mayúsculas)
    try {
      const { data: perfil, error } = await window.supabaseClient
        .from('perfiles_usuario')
        .select('nivel, nombre, apellido, jerarquia, foto_url') 
        .eq('user_id', session.user.id)
        .single();

      if (error || !perfil) {
        console.warn("Perfil no encontrado o faltan columnas. Usando modo de respaldo.");
        const nombreFallback = session.user.email.split('@')[0];
        
        // ✅ Nombre en mayúsculas
        document.getElementById('user-nombre-display').textContent = nombreFallback.toUpperCase();
        // ✅ Jerarquía sin la palabra "Jerarquía:"
        document.getElementById('user-jerarquia-display').textContent = 'NO ASIGNADA';
        
        document.getElementById('user-foto').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreFallback)}&background=002b5c&color=fff&size=128`;
      } else {
        const rol = (perfil.nivel || 'consultor').toLowerCase();
        sessionStorage.setItem('pnb_user_nivel', rol);
        
        // ✅ Nombre siempre en mayúsculas
        document.getElementById('user-nombre-display').textContent = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim().toUpperCase() || 'NOMBRE NO DISPONIBLE';
        
        // ✅ Mostrar Jerarquía sin la palabra "Jerarquía:" y en mayúsculas
        document.getElementById('user-jerarquia-display').textContent = perfil.jerarquia ? perfil.jerarquia.toUpperCase() : 'NO ASIGNADA';
        
        if (perfil.foto_url) {
          document.getElementById('user-foto').src = perfil.foto_url;
        } else {
          const iniciales = `${perfil.nombre || 'U'} ${perfil.apellido || 'S'}`;
          document.getElementById('user-foto').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&background=002b5c&color=fff&size=128`;
        }
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    }

    // 4. Aplicar restricciones de menú según rol
    const rolActual = (sessionStorage.getItem('pnb_user_nivel') || 'consultor').toLowerCase();
    userRoleEl.textContent = rolActual;
    aplicarPermisos(rolActual);

    // 5. Configurar eventos del menú
    configurarMenu();

    // 6. Iniciar reloj
    iniciarReloj();
  }

// 🔒 Matriz de permisos estricta
function aplicarPermisos(rol) {
    // 1. Resetear visibilidad por defecto (mostrar todo primero)
    document.querySelectorAll('.menu-item').forEach(item => item.style.display = 'block');
    document.querySelectorAll('.submenu-item').forEach(item => item.style.display = 'block');
    document.getElementById('menu-historial')?.style.removeProperty('display');
    document.getElementById('menu-gestion-usuarios')?.style.removeProperty('display');

    if (rol === 'consultor') {
        // Solo ve el menú de Consulta
        document.querySelectorAll('.menu-item').forEach(item => {
            if (!item.querySelector('[data-toggle="submenu-consulta"]')) {
                item.style.display = 'none';
            }
        });
        
    } else if (rol === 'moderador') {
        // A. Ocultar menús de alto nivel (Historial y Gestión de Usuarios)
        document.getElementById('menu-historial')?.style.setProperty('display', 'none', 'important');
        document.getElementById('menu-gestion-usuarios')?.style.setProperty('display', 'none', 'important');
        
        // B. ✅ RESTRICCIÓN ESPECÍFICA: En "Procesar" y "Denuncias", SOLO permitir "Registrar"
        const menusRestringidos = ['submenu-procesar', 'submenu-denuncias'];
        menusRestringidos.forEach(menuId => {
            const submenu = document.getElementById(menuId);
            if (submenu) {
                submenu.querySelectorAll('.submenu-item').forEach(item => {
                    const src = item.dataset.src || '';
                    // Si el archivo NO contiene 'reg-' (identificador de los módulos de registro), se oculta
                    if (!src.includes('reg-')) {
                        item.style.setProperty('display', 'none', 'important');
                    }
                });
            }
        });

        // C. ✅ RESTRICCIÓN GENERAL: Ocultar modificar y eliminar en otros módulos (Personas, Vehículos, PV)
        document.querySelectorAll('.submenu-item').forEach(item => {
            const src = item.dataset.src || '';
            if (src.includes('mod-') || src.includes('elim-') || src.includes('editar-') || src.includes('eliminar-')) {
                item.style.setProperty('display', 'none', 'important');
            }
        });

    } else if (rol === 'administrador') {
        // Ve todo (no se aplica ninguna restricción, el reset inicial ya lo mostró todo)
        
    } else {
        // Rol desconocido o sin permisos: tratar como consultor por seguridad
        document.querySelectorAll('.menu-item').forEach(item => {
            if (!item.querySelector('[data-toggle="submenu-consulta"]')) {
                item.style.display = 'none';
            }
        });
    }
}// 🔹 MOTOR DE CARGA DINÁMICA
  async function cargarModulo(htmlPath, jsPath, initFnName) {
    appContent.innerHTML = '<div class="loading">⏳ Cargando módulo...</div>';
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
      console.error(err);
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

  // ⏰ Reloj en tiempo real
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
    await window.supabaseClient.auth.signOut();
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

    // 🔹 LÓGICA DE CHAT PRIVADO Y PRESENCIA
let chatChannelPresence = null;
let chatChannelMessages = null;
let replyingToUserId = null; // Para que el admin sepa a quién responde

async function iniciarChatPrivado() {
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

    const currentUserRole = sessionStorage.getItem('pnb_user_nivel') || 'consultor';
    const currentUserName = document.getElementById('user-nombre-display').textContent;
    const currentUserId = session.user.id;

    // 1. PRESENCIA: Todos se registran, pero solo el admin ve la lista
    chatChannelPresence = window.supabaseClient.channel('sistema-presence', {
        config: { presence: { key: currentUserId } }
    });

    chatChannelPresence.on('presence', { event: 'sync' }, () => {
        const state = chatChannelPresence.presenceState();
        const usuariosEnLinea = Object.values(state);
        
        if (currentUserRole === 'administrador') {
            adminOnlinePanel.style.display = 'block';
            adminOnlineIndicator.style.display = 'block';
            onlineCountSpan.textContent = usuariosEnLinea.length;
            
            onlineUsersList.innerHTML = '';
            usuariosEnLinea.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.nombre} (${user.rol})`;
                onlineUsersList.appendChild(li);
            });
        }
    });

    await chatChannelPresence.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await chatChannelPresence.track({ nombre: currentUserName, rol: currentUserRole });
        }
    });

    // 2. TIEMPO REAL: Escuchar nuevos mensajes
    chatChannelMessages = window.supabaseClient
        .channel('chat-room-privado')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensajes' }, (payload) => {
            const nuevoMensaje = payload.new;
            
            // Solo mostrar si es para mí, si lo envié yo, o si soy admin
            const esParaMi = nuevoMensaje.receptor_id === currentUserId || nuevoMensaje.receptor_id === null;
            const esMio = nuevoMensaje.remitente_id === currentUserId;
            
            if (esParaMi || esMio || currentUserRole === 'administrador') {
                // Si la ventana está cerrada y el mensaje es nuevo para mí, notificar
                if (chatWindow.style.display === 'none' && !esMio) {
                    const badge = document.getElementById('chat-notification');
                    badge.style.display = 'flex';
                    badge.textContent = parseInt(badge.textContent || 0) + 1;
                }
                agregarMensajeAlDOM(nuevoMensaje);
            }
        })
        .subscribe();

    // 3. INTERFAZ: Abrir/Cerrar
    chatBubble.addEventListener('click', () => {
        const isVisible = chatWindow.style.display === 'flex';
        chatWindow.style.display = isVisible ? 'none' : 'flex';
        document.getElementById('chat-notification').style.display = 'none';
        document.getElementById('chat-notification').textContent = '0';
        
        if (!isVisible) {
            chatInput.focus();
            cargarMensajesRecientes();
        }
    });

    chatClose.addEventListener('click', () => { chatWindow.style.display = 'none'; });

    // 4. LÓGICA DE RESPUESTA (Solo Admin)
    cancelReplyBtn.addEventListener('click', () => {
        replyingToUserId = null;
        replyIndicator.style.display = 'none';
        chatInput.placeholder = "Escribe tu mensaje...";
    });

    window.activarRespuesta = (userId, userName) => {
        replyingToUserId = userId;
        replyToName.textContent = userName;
        replyIndicator.style.display = 'flex';
        chatInput.placeholder = `Escribe la respuesta para ${userName}...`;
        chatInput.focus();
    };

    // 5. ENVIAR MENSAJE
    async function enviarMensaje() {
        const texto = chatInput.value.trim();
        if (!texto) return;

        // UI Optimista
        const mensajeTemp = {
            remitente_id: currentUserId,
            nombre_remitente: currentUserName,
            rol_remitente: currentUserRole,
            receptor_id: replyingToUserId, // Será null si es usuario normal
            mensaje: texto,
            tipo: currentUserRole === 'administrador' ? 'admin' : 'user',
            creado_en: new Date().toISOString()
        };
        agregarMensajeAlDOM(mensajeTemp);
        chatInput.value = '';
        
        // Limpiar modo respuesta después de enviar
        if (replyingToUserId) {
            replyingToUserId = null;
            replyIndicator.style.display = 'none';
            chatInput.placeholder = "Escribe tu mensaje...";
        }

        // Guardar en Supabase
        const { error } = await window.supabaseClient
            .from('chat_mensajes')
            .insert([{ 
                remitente_id: currentUserId,
                nombre_remitente: currentUserName,
                rol_remitente: currentUserRole,
                receptor_id: replyingToUserId,
                mensaje: texto,
                tipo: currentUserRole === 'administrador' ? 'admin' : 'user'
            }]);

        if (error) console.error('Error al enviar:', error);
    }

    chatSend.addEventListener('click', enviarMensaje);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensaje(); });

    // 6. CARGAR HISTORIAL
    // 6. CARGAR HISTORIAL (Filtrado automáticamente por las reglas RLS de la base de datos)
    async function cargarMensajesRecientes() {
        chatMessages.innerHTML = '<div class="chat-message system"><p>Cargando historial...</p></div>';
        
        // Supabase aplicará automáticamente las reglas de privacidad. 
        // El admin verá todo, el usuario solo verá sus propios mensajes y respuestas.
        const { data, error } = await window.supabaseClient
            .from('chat_mensajes')
            .select('*')
            .order('creado_en', { ascending: true })
            .limit(50);

        chatMessages.innerHTML = '';

        if (error) {
            chatMessages.innerHTML = '<div class="chat-message system"><p>Error al cargar el historial.</p></div>';
            console.error("Error en chat:", error);
            return;
        }

        if (data && data.length > 0) {
            data.forEach(msg => agregarMensajeAlDOM(msg));
        } else {
            chatMessages.innerHTML = '<div class="chat-message system"><p>No hay mensajes aún. ¡Escribe tu consulta!</p></div>';
        }
    }

    // 7. RENDERIZAR MENSAJE EN PANTALLA
    function agregarMensajeAlDOM(msg) {
        const div = document.createElement('div');
        const esMio = msg.remitente_id === currentUserId;
        const tipoClase = esMio ? (currentUserRole === 'administrador' ? 'admin' : 'user') : msg.tipo;
        
        div.className = `chat-message ${tipoClase}`;
        const hora = new Date(msg.creado_en).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
        
        let htmlContent = '';
        
        // Si es admin, mostrar a quién va dirigido (si aplica)
        if (msg.rol_remitente === 'administrador' && msg.receptor_id) {
            // Necesitamos el nombre, pero como no lo tenemos en el msg, mostramos "Para usuario"
            htmlContent += `<div class="msg-sender">✉️ Respuesta de Soporte</div>`;
        } else if (!esMio) {
            htmlContent += `<div class="msg-sender">${msg.nombre_remitente}</div>`;
        }

        htmlContent += `<p>${msg.mensaje}</p><span class="msg-meta">${hora}</span>`;

        // Botón de responder (SOLO para administradores y solo en mensajes de usuarios)
        if (currentUserRole === 'administrador' && msg.rol_remitente !== 'administrador' && !esMio) {
            htmlContent += `<button class="btn-reply" onclick="activarRespuesta('${msg.remitente_id}', '${msg.nombre_remitente}')" title="Responder">↩️</button>`;
        }

        div.innerHTML = htmlContent;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
    // ... código existente ...
iniciarReloj();
iniciarChatPrivado(); // <--- AGREGA ESTA LÍNEA
  initDashboard();
});
