window.initElimUsuario = function() {
    console.log("⚙️ Iniciando módulo elim-usuario.js...");

    if (window._elimUsuarioInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
        return;
    }
    window._elimUsuarioInitialized = true;

    const el = (id) => document.getElementById(id);
    const tablaContainer = el('eu_tabla_container');
    const msg = el('eu_msg');
    const buscarInput = el('eu_buscar');
    const btnRefresh = el('eu_btn_refresh');

    let usuariosData = [];
    let usuarioActual = null;

    // Verificar permisos (solo administrador)
    async function verificarPermisos() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                mostrarMensaje('❌ Debe iniciar sesión', 'error');
                return false;
            }

            const { data: perfil } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!perfil || perfil.nivel !== 'administrador') {
                mostrarMensaje('❌ Solo los administradores pueden eliminar usuarios', 'error');
                return false;
            }

            usuarioActual = user;
            return true;
        } catch (err) {
            console.error('Error verificando permisos:', err);
            return false;
        }
    }

    function mostrarMensaje(texto, tipo) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `msg ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') {
            setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
        }
    }

    // Cargar usuarios
    async function cargarUsuarios() {
        if (tablaContainer) {
            tablaContainer.innerHTML = '<div class="sin-usuarios">Cargando usuarios...</div>';
        }

        try {
            const { data: usuarios, error } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;

            usuariosData = usuarios || [];
            console.log("📊 Usuarios cargados:", usuariosData.length);
            renderTabla(usuariosData);

        } catch (err) {
            console.error('Error cargando usuarios:', err);
            if (tablaContainer) {
                tablaContainer.innerHTML = '<div class="sin-usuarios">❌ Error al cargar usuarios</div>';
            }
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        }
    }

    // Renderizar tabla
    function renderTabla(usuarios) {
        if (!tablaContainer) return;

        if (usuarios.length === 0) {
            tablaContainer.innerHTML = '<div class="sin-usuarios">No hay usuarios registrados</div>';
            return;
        }

        let html = `
            <table class="usuarios-table">
                <thead>
                    <tr>
                        <th>Foto</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Cédula</th>
                        <th>Nivel</th>
                        <th>Fecha Creación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        usuarios.forEach(u => {
            const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sin nombre';
            const fotoSrc = u.foto_url || 'https://ui-avatars.com/api/?name=Usuario&background=002b5c&color=fff';
            const nivelClass = `nivel-${u.nivel}`;
            const fechaCreacion = u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-VE') : 'N/A';
            
            const userIdStr = String(u.id);
            const esUsuarioActual = usuarioActual && u.user_id === usuarioActual.id;
            const disabledAttr = esUsuarioActual ? 'disabled title="No puede eliminarse a sí mismo"' : '';

            html += `
                <tr>
                    <td><img src="${fotoSrc}" alt="Foto" class="user-foto" onerror="this.src='https://ui-avatars.com/api/?name=Usuario'"></td>
                    <td><strong>${nombreCompleto}</strong>${esUsuarioActual ? ' <span style="color: #64748b; font-size: 0.75rem;">(Tú)</span>' : ''}</td>
                    <td>${u.email || 'N/A'}</td>
                    <td>${u.cedula || 'N/A'}</td>
                    <td><span class="nivel-badge ${nivelClass}">${u.nivel || 'N/A'}</span></td>
                    <td>${fechaCreacion}</td>
                    <td>
                        <button type="button" class="btn-eliminar" data-id="${userIdStr}" data-user-id="${u.user_id}" data-email="${u.email}" ${disabledAttr}>
                            🗑️ Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tablaContainer.innerHTML = html;

        agregarEventListenersTabla();
    }

    // Event delegation para botones de eliminar
    function agregarEventListenersTabla() {
        const botonesEliminar = tablaContainer.querySelectorAll('.btn-eliminar');
        botonesEliminar.forEach(btn => {
            btn.onclick = function() {
                if (this.disabled) return;
                
                const id = this.getAttribute('data-id');
                const userId = this.getAttribute('data-user-id');
                const email = this.getAttribute('data-email');
                
                console.log("🗑️ Click en eliminar, ID:", id, "Email:", email);
                confirmarEliminacion(id, userId, email);
            };
        });
    }

    // Confirmar eliminación
    function confirmarEliminacion(id, userId, email) {
        const confirmacion = confirm(
            `⚠️ ADVERTENCIA: ¿Está seguro que desea eliminar permanentemente este usuario?\n\n` +
            `Email: ${email}\n\n` +
            `Esta acción eliminará el usuario de:\n` +
            `• Tabla perfiles_usuario\n` +
            `• Tabla auth.users\n\n` +
            `Esta acción NO se puede deshacer.`
        );

        if (confirmacion) {
            eliminarUsuario(id, userId, email);
        }
    }

    // Eliminar usuario
    async function eliminarUsuario(id, userId, email) {
        try {
            mostrarMensaje('⏳ Eliminando usuario...', 'info');

            const { data, error } = await window.supabaseClient
                .rpc('eliminar_usuario_completo', {
                    p_user_id: userId,
                    p_perfil_id: id
                });

            if (error) {
                throw new Error('Error en la función SQL: ' + error.message);
            }

            if (!data.success) {
                throw new Error(data.error || 'Error al eliminar usuario');
            }

            mostrarMensaje(`✅ Usuario ${email} eliminado correctamente`, 'success');
            
            // Recargar lista
            await cargarUsuarios();

        } catch (err) {
            console.error('Error eliminando usuario:', err);
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        }
    }

    // Buscar usuarios
    if (buscarInput) {
        buscarInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderTabla(usuariosData);
                return;
            }

            const filtrados = usuariosData.filter(u => {
                const nombre = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
                const email = (u.email || '').toLowerCase();
                const cedula = (u.cedula || '').toLowerCase();
                return nombre.includes(query) || email.includes(query) || cedula.includes(query);
            });

            renderTabla(filtrados);
        });
    }

    // Refrescar
    if (btnRefresh) {
        btnRefresh.onclick = () => {
            cargarUsuarios();
            mostrarMensaje('🔄 Lista actualizada', 'info');
        };
    }

    // Inicializar
    async function init() {
        const tienePermiso = await verificarPermisos();
        if (!tienePermiso) {
            if (tablaContainer) {
                tablaContainer.innerHTML = '<div class="sin-usuarios">❌ No tiene permisos para acceder a este módulo</div>';
            }
            return;
        }
        await cargarUsuarios();
    }

    console.log("🚀 Inicializando módulo elim-usuario...");
    init();
    console.log("✅ Módulo elim-usuario.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initElimUsuario);
} else {
    window.initElimUsuario();
}
