window.initLogsSistema = function() {
    console.log("⚙️ Iniciando módulo logs-sistema.js...");

    if (window._logsSistemaInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
        return;
    }
    window._logsSistemaInitialized = true;

    const el = (id) => document.getElementById(id);
    const tablaContainer = el('logs-table-container');
    const pagination = el('logs-pagination');
    const btnFiltrar = el('log_btn_filtrar');
    const btnReset = el('log_btn_reset');

    const ITEMS_PER_PAGE = 20;
    let currentPage = 1;
    let totalLogs = 0;
    let logsData = [];

    // Verificar permisos
    async function verificarPermisos() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return false;

            const { data: perfil } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!perfil) return false;
            return perfil.nivel === 'administrador' || perfil.nivel === 'moderador';
        } catch (err) {
            console.error('Error verificando permisos:', err);
            return false;
        }
    }

    // Cargar logs
    async function cargarLogs(page = 1) {
        if (tablaContainer) {
            tablaContainer.innerHTML = '<div class="sin-logs">Cargando logs...</div>';
        }

        try {
            let query = window.supabaseClient
                .from('sistema_logs')
                .select('*', { count: 'exact' });

            // Filtros
            const fechaDesde = el('log_fecha_desde')?.value;
            const fechaHasta = el('log_fecha_hasta')?.value;
            const accion = el('log_accion')?.value;
            const modulo = el('log_modulo')?.value;
            const buscarUsuario = el('log_buscar_usuario')?.value.trim();

            if (fechaDesde) {
                query = query.gte('created_at', new Date(fechaDesde).toISOString());
            }
            if (fechaHasta) {
                query = query.lte('created_at', new Date(fechaHasta + 'T23:59:59').toISOString());
            }
            if (accion) query = query.eq('accion', accion);
            if (modulo) query = query.eq('modulo', modulo);
            if (buscarUsuario) {
                query = query.or(`user_nombre.ilike.%${buscarUsuario}%,user_email.ilike.%${buscarUsuario}%`);
            }

            // Paginación
            const inicio = (page - 1) * ITEMS_PER_PAGE;
            const fin = inicio + ITEMS_PER_PAGE - 1;
            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(inicio, fin);

            if (error) throw error;

            logsData = data || [];
            totalLogs = count || 0;
            currentPage = page;
            renderTabla();

        } catch (err) {
            console.error('Error cargando logs:', err);
            if (tablaContainer) {
                tablaContainer.innerHTML = '<div class="sin-logs">❌ Error al cargar logs</div>';
            }
        }
    }

    // Renderizar tabla
    function renderTabla() {
        if (!tablaContainer) return;

        if (logsData.length === 0) {
            tablaContainer.innerHTML = '<div class="sin-logs">No hay registros para los filtros seleccionados</div>';
            if (pagination) pagination.style.display = 'none';
            return;
        }

        const badgeClass = (accion) => {
            const map = {
                'CREAR': 'badge-crear',
                'MODIFICAR': 'badge-modificar',
                'ELIMINAR': 'badge-eliminar',
                'LOGIN': 'badge-login',
                'LOGOUT': 'badge-logout'
            };
            return map[accion] || 'badge-otros';
        };

        let html = `
            <table class="logs-table">
                <thead>
                    <tr>
                        <th>Fecha/Hora</th>
                        <th>Usuario</th>
                        <th>Acción</th>
                        <th>Módulo</th>
                        <th>Registro</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody>
        `;

        logsData.forEach(log => {
            const fecha = new Date(log.created_at).toLocaleString('es-VE');
            const usuario = log.user_nombre || log.user_email || 'Sistema';
            const detalles = log.detalles ? JSON.stringify(log.detalles).substring(0, 50) + '...' : '-';

            html += `
                <tr>
                    <td style="white-space: nowrap;">${fecha}</td>
                    <td><strong>${usuario}</strong></td>
                    <td><span class="badge ${badgeClass(log.accion)}">${log.accion}</span></td>
                    <td><span class="modulo-badge">${log.modulo}</span></td>
                    <td>${log.registro_id || '-'}</td>
                    <td class="detalles-cell" title='${JSON.stringify(log.detalles || {})}'>${detalles}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tablaContainer.innerHTML = html;

        // Paginación
        if (pagination) {
            renderPaginacion();
        }
    }

    // Renderizar paginación
    function renderPaginacion() {
        if (!pagination) return;

        const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE);
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        let html = '';
        html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">◀ Anterior</button>`;

        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);

        if (startPage > 1) {
            html += `<button data-page="1">1</button>`;
            if (startPage > 2) html += `<span class="pagination-info">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="pagination-info">...</span>`;
            html += `<button data-page="${totalPages}">${totalPages}</button>`;
        }

        html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Siguiente ▶</button>`;
        html += `<span class="pagination-info">${totalLogs} registros</span>`;

        pagination.innerHTML = html;
        pagination.style.display = 'flex';

        pagination.querySelectorAll('button[data-page]').forEach(btn => {
            btn.onclick = () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    cargarLogs(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
        });
    }

    // Event listeners
    if (btnFiltrar) btnFiltrar.onclick = () => cargarLogs(1);
    if (btnReset) {
        btnReset.onclick = () => {
            if (el('log_fecha_desde')) el('log_fecha_desde').value = '';
            if (el('log_fecha_hasta')) el('log_fecha_hasta').value = '';
            if (el('log_accion')) el('log_accion').value = '';
            if (el('log_modulo')) el('log_modulo').value = '';
            if (el('log_buscar_usuario')) el('log_buscar_usuario').value = '';
            cargarLogs(1);
        };
    }

    // Inicializar
    async function init() {
        const tienePermiso = await verificarPermisos();
        if (!tienePermiso) {
            if (tablaContainer) {
                tablaContainer.innerHTML = '<div class="sin-logs">❌ No tiene permisos para ver los logs del sistema</div>';
            }
            return;
        }
        await cargarLogs(1);
    }

    console.log("🚀 Inicializando módulo logs-sistema...");
    init();
    console.log("✅ Módulo logs-sistema.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initLogsSistema);
} else {
    window.initLogsSistema();
}
