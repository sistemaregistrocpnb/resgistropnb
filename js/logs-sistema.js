window.initLogsSistema = function() {
    const el = (id) => document.getElementById(id);
    const tablaContainer = el('logs-table-container');
    const pagination = el('logs-pagination');
    const btnFiltrar = el('log_btn_filtrar');
    const btnReset = el('log_btn_reset');
    const ITEMS_PER_PAGE = 20;
    
    let currentPage = 1;
    let totalLogs = 0;
    let logsData = [];

    async function verificarPermisos() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return false;
            const { data: perfil } = await window.supabaseClient
                .from('perfiles_usuario').select('nivel').eq('user_id', user.id).maybeSingle();
            if (!perfil) return false;
            return perfil.nivel === 'administrador' || perfil.nivel === 'moderador';
        } catch (err) {
            return false;
        }
    }

    async function cargarLogs(page = 1) {
        if (tablaContainer) tablaContainer.innerHTML = '<div class="sin-logs">Cargando logs...</div>';
        try {
            let query = window.supabaseClient.from('sistema_logs').select('*', { count: 'exact' });

            const fechaDesde = el('log_fecha_desde')?.value;
            const fechaHasta = el('log_fecha_hasta')?.value;
            const accion = el('log_accion')?.value;
            const modulo = el('log_modulo')?.value;
            const buscarUsuario = el('log_buscar_usuario')?.value.trim();

            if (fechaDesde) query = query.gte('created_at', new Date(fechaDesde).toISOString());
            if (fechaHasta) query = query.lte('created_at', new Date(fechaHasta + 'T23:59:59').toISOString());
            if (accion) query = query.eq('accion', accion);
            if (modulo) query = query.eq('modulo', modulo);
            if (buscarUsuario) query = query.or(`user_nombre.ilike.%${buscarUsuario}%,user_email.ilike.%${buscarUsuario}%`);

            const inicio = (page - 1) * ITEMS_PER_PAGE;
            const fin = inicio + ITEMS_PER_PAGE - 1;
            const { data, count, error } = await query.order('created_at', { ascending: false }).range(inicio, fin);

            if (error) throw error;

            logsData = data || [];
            totalLogs = count || 0;
            currentPage = page;
            renderTabla();
        } catch (err) {
            console.error('Error cargando logs:', err);
            if (tablaContainer) tablaContainer.innerHTML = '<div class="sin-logs">❌ Error al cargar logs</div>';
        }
    }

    // ✅ FUNCIÓN PARA FORMATEAR LOS DETALLES DE FORMA LEGIBLE
    function formatearDetalles(detalles) {
        if (!detalles) return '-';
        let d = typeof detalles === 'string' ? JSON.parse(detalles) : detalles;
        
        if (d.tipo_busqueda && d.valor_buscado) {
            const tipoFormateado = d.tipo_busqueda === 'placa' ? 'Placa' : 
                                   d.tipo_busqueda === 'serial_carroceria' ? 'Serial de Carrocería' : 'Serial de Motor';
            return `Consultó <strong>${tipoFormateado}</strong>: <span style="color:var(--primary); font-weight:700; font-size:1.1rem;">${d.valor_buscado}</span>`;
        }

        if (d.valor_buscado && !d.tipo_busqueda) {
            const tipoTexto = d.tipo === 'Vinculado' ? ' (Vinculado)' : '';
            return `Consultó Cédula${tipoTexto}: <span style="color:var(--primary); font-weight:700; font-size:1.1rem;">${d.valor_buscado}</span>`;
        }

        if (d.placa && d.marca && d.modelo) {
            const tipoTexto = d.tipo === 'Motocicleta' ? '🏍️ Motocicleta' : '🚙 Automóvil';
            return `Registró ${tipoTexto}: <strong style="color:var(--primary); font-size:1.1rem;">${d.placa}</strong><br>
            <span style="color:#64748b;">${d.marca} ${d.modelo} (${d.anio}) - ${d.color}</span>`;
        }

        if (d.identificador && d.descripcion_eliminada) {
            return `Eliminó incidencia del vehículo <strong>${d.identificador}</strong>.<br><em>"${d.descripcion_eliminada}"</em>`;
        }

        if (d.cedula && d.estatus && d.estatus.includes('Reintegrado')) {
            return `Reintegró a la persona con C.I. <strong>${d.cedula}</strong> (${d.nombre || 'Nombre no disponible'}) al sistema activo.`;
        }
        
        if (d.cedula && d.descripcion_eliminada) {
            return `Eliminó a la persona con C.I. <strong>${d.cedula}</strong> (${d.nombre || 'Nombre no disponible'}).<br><em>"${d.descripcion_eliminada}"</em>`;
        }

        return Object.entries(d)
            .filter(([key]) => key !== 'estatus')
            .map(([key, value]) => {
                const keyLimpia = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return `<strong>${keyLimpia}:</strong> ${value}`;
            })
            .join('<br>');
    }

    // ✅ FUNCIÓN PARA OBTENER EL VALOR PRINCIPAL DE LA COLUMNA "REGISTRO"
    function obtenerValorRegistro(log) {
        if (log.detalles) {
            let d = typeof log.detalles === 'string' ? JSON.parse(log.detalles) : log.detalles;

            // ✅ 1. PRIMERO: Si hay un estatus, lo mostramos como badge (PRIORIDAD ALTA)
            if (d.estatus) {
                const badgeClass = d.estatus.toLowerCase().includes('procesad') ? 'badge-eliminar' :
                    d.estatus.toLowerCase().includes('verificaci') ? 'badge-otros' : 'badge-crear';
                return `<span class="badge ${badgeClass}">${d.estatus}</span>`;
            }

            // 🚗 2. DESPUÉS: Si es creación de vehículo, mostrar la placa
            if (log.modulo === 'VEHICULOS' && log.accion === 'CREAR' && d.placa) {
                return `<span class="badge badge-crear">${d.placa}</span>`;
            }

            // 🆕 3. Eliminación o reintegración de persona
            if (log.modulo === 'PERSONAS') {
                if (log.accion === 'ELIMINAR') return `<span class="badge badge-eliminar">ELIMINADO</span>`;
                if (log.accion === 'REINTEGRAR') return `<span class="badge badge-crear">REINTEGRADO</span>`;
            }
            
            // 4. Identificadores principales
            if (d.valor_buscado) return d.valor_buscado;
            if (d.identificador) return d.identificador;
            if (d.cedula) return d.cedula;
        }
        // 5. Fallback al registro_id recortado
        if (log.registro_id) {
            return `<span style="font-family: monospace; font-size: 0.8rem; color: #64748b;">${log.registro_id.substring(0, 8)}...</span>`;
        }
        return '-';
    }

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
                'REINTEGRAR': 'badge-crear',
                'LOGIN': 'badge-login',
                'LOGOUT': 'badge-logout',
                'CONSULTA_VEHICULO': 'badge-modificar',
                'CONSULTA_PERSONA': 'badge-modificar',
                'CREAR_INCIDENCIA_VEHICULO': 'badge-crear',
                'CREAR_INCIDENCIA_PERSONA': 'badge-crear',
                'ELIMINAR_INCIDENCIA_VEHICULO': 'badge-eliminar',
                'ELIMINAR_INCIDENCIA_PERSONA': 'badge-eliminar'
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
                    <th>Registro / Estatus</th>
                    <th>Detalles</th>
                </tr>
            </thead>
            <tbody>
        `;

        logsData.forEach(log => {
            const fecha = new Date(log.created_at).toLocaleString('es-VE');
            const usuario = log.user_nombre || log.user_email || 'Sistema';
            const registroDisplay = obtenerValorRegistro(log);
            const detallesDisplay = formatearDetalles(log.detalles);

            html += `
            <tr>
                <td style="white-space: nowrap;">${fecha}</td>
                <td><strong>${usuario}</strong></td>
                <td><span class="badge ${badgeClass(log.accion)}">${log.accion}</span></td>
                <td><span class="modulo-badge">${log.modulo}</span></td>
                <td>${registroDisplay}</td>
                <td class="detalles-cell" style="white-space: normal; line-height: 1.4;">${detallesDisplay}</td>
            </tr>
            `;
        });

        html += '</tbody></table>';
        tablaContainer.innerHTML = html;

        if (pagination) renderPaginacion();
    }

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

    async function init() {
        const tienePermiso = await verificarPermisos();
        if (!tienePermiso) {
            if (tablaContainer) tablaContainer.innerHTML = '<div class="sin-logs">❌ No tiene permisos para ver los logs del sistema</div>';
            return;
        }
        await cargarLogs(1);
    }

    init();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initLogsSistema);
} else {
    window.initLogsSistema();
}
