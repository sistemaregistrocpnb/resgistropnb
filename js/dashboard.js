document.addEventListener('DOMContentLoaded', async () => {
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

    // 3. ✅ Cargar datos del perfil (incluyendo jerarquía)
    try {
      const { data: perfil, error } = await window.supabaseClient
        .from('perfiles_usuario')
        .select('nivel, nombre, apellido, jerarquia, foto_url') // ✅ Cambiado a jerarquia
        .eq('user_id', session.user.id)
        .single();

      if (error || !perfil) {
        console.warn("Perfil no encontrado o faltan columnas. Usando modo de respaldo.");
        const nombreFallback = session.user.email.split('@')[0];
        document.getElementById('user-nivel-display').textContent = sessionStorage.getItem('pnb_user_nivel') || 'Consultor';
        document.getElementById('user-nombre-display').textContent = nombreFallback.charAt(0).toUpperCase() + nombreFallback.slice(1);
        document.getElementById('user-jerarquia-display').textContent = 'Jerarquía: No asignada';
        document.getElementById('user-foto').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreFallback)}&background=002b5c&color=fff&size=128`;
      } else {
        const rol = (perfil.nivel || 'consultor').toLowerCase();
        sessionStorage.setItem('pnb_user_nivel', rol);
        
        document.getElementById('user-nivel-display').textContent = rol;
        document.getElementById('user-nombre-display').textContent = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() || 'Nombre no disponible';
        
        // ✅ Mostrar Jerarquía
        document.getElementById('user-jerarquia-display').textContent = perfil.jerarquia ? `Jerarquía: ${perfil.jerarquia}` : 'Jerarquía: No asignada';
        
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
    document.querySelectorAll('.menu-item').forEach(item => item.style.display = 'block');
    document.querySelectorAll('.submenu-item').forEach(item => item.style.display = 'block');
    document.getElementById('menu-historial')?.style.removeProperty('display');
    document.getElementById('menu-gestion-usuarios')?.style.removeProperty('display');

    if (rol === 'consultor') {
      document.querySelectorAll('.menu-item').forEach(item => {
        if (!item.querySelector('[data-toggle="submenu-consulta"]')) {
          item.style.display = 'none';
        }
      });
    } else if (rol === 'moderador') {
      document.getElementById('menu-historial')?.style.setProperty('display', 'none', 'important');
      document.getElementById('menu-gestion-usuarios')?.style.setProperty('display', 'none', 'important');
      document.querySelectorAll('.submenu-item').forEach(item => {
        const src = item.dataset.src || '';
        if (src.includes('mod-') || src.includes('elim-')) {
          item.style.setProperty('display', 'none', 'important');
        }
      });
    } else if (rol === 'administrador') {
      // Ve todo
    } else {
      document.querySelectorAll('.menu-item').forEach(item => {
        if (!item.querySelector('[data-toggle="submenu-consulta"]')) {
          item.style.display = 'none';
        }
      });
    }
  }

  // 🔹 MOTOR DE CARGA DINÁMICA
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

  initDashboard();
});
