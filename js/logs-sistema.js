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
return perfil.nivel === 'administrador';
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

function formatearDetalles(detalles) {
    if (!detalles) return '-';
    let d = typeof detalles === 'string' ? JSON.parse(detalles) : detalles;


    if (d.nivel && d.hora_inicio) {
        return `Nivel: <strong style="color:#7e22ce;">${d.nivel.toUpperCase()}</strong><br>
                IP: ${d.ip || 'No registrada'}<br>
                Hora: ${new Date(d.hora_inicio).toLocaleString('es-VE')}`;
    }

    if (d.sesion_duracion || d.sesion_duracion_segundos !== undefined) {
        let duracion = d.sesion_duracion;
        if (!duracion && d.sesion_duracion_segundos) {
            duracion = window.formatearDuracion ? window.formatearDuracion(d.sesion_duracion_segundos) : d.sesion_duracion_segundos + 's';
        }
        return `Duración de sesión: <strong style="color:var(--primary); font-size:1.1rem;">${duracion || 'No registrada'}</strong><br>
                IP: ${d.ip || 'No registrada'}<br>
                Cierre: ${d.hora_cierre ? new Date(d.hora_cierre).toLocaleString('es-VE') : 'No registrado'}`;
    }


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
    return `Reintegró a la persona con C.I. <strong>${d.cedula}</strong> (${d.nombre_completo || 'Nombre no disponible'}) al sistema activo.`;
}
    }
 if (d.cedula && d.descripcion_eliminada) {
    return `Eliminó a la persona con C.I. <strong>${d.cedula}</strong> (${d.nombre_completo || 'Nombre no disponible'}).<br><em>"${d.descripcion_eliminada}"</em>`;
}

    return Object.entries(d)
        .filter(([key]) => key !== 'estatus')
        .map(([key, value]) => {
            const keyLimpia = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<strong>${keyLimpia}:</strong> ${value}`;
        })
        .join('<br>');
}

function obtenerValorRegistro(log) {
    // ✅ LOGIN: Mostrar "Sesión iniciada" con el nivel
    if (log.accion === 'LOGIN') {
        let nivelTexto = 'Usuario';
        if (log.detalles) {
            let d = typeof log.detalles === 'string' ? JSON.parse(log.detalles) : log.detalles;
            if (d.nivel) nivelTexto = d.nivel.toUpperCase();
        }
        return `<span class="badge badge-login">✅ Sesión iniciada</span><br><small style="color:#7e22ce; font-weight:700;">Nivel: ${nivelTexto}</small>`;
    }
    
    // ✅ LOGOUT: Mostrar "Sesión cerrada"
    if (log.accion === 'LOGOUT') {
        return `<span class="badge badge-logout">❌ Sesión cerrada</span>`;
    }
    
    // ✅ INCIDENCIAS: Mostrar badges específicos sin cédula
    if (log.accion === 'ELIMINAR_INCIDENCIA_PERSONA') {
        return `<span class="badge badge-eliminar">ELIMINADO</span>`;
    }
    if (log.accion === 'ELIMINAR_INCIDENCIA_VEHICULO') {
        return `<span class="badge badge-eliminar">ELIMINADO</span>`;
    }
    if (log.accion === 'CREAR_INCIDENCIA_PERSONA') {
        return `<span class="badge badge-crear">CREADO</span>`;
    }
    if (log.accion === 'CREAR_INCIDENCIA_VEHICULO') {
        return `<span class="badge badge-crear">CREADO</span>`;
    }
    
    // ✅ Procesar detalles para CREAR, MODIFICAR, ELIMINAR, etc.
    if (log.detalles) {
        let d = typeof log.detalles === 'string' ? JSON.parse(log.detalles) : log.detalles;
        
        // 🔹 PRIORIDAD 1: Si hay estatus, mostrarlo como badge
        if (d.estatus) {
            const estatusLower = d.estatus.toLowerCase();
            let badgeClass = 'badge-crear'; // por defecto verde
            
            if (estatusLower.includes('eliminad') || estatusLower.includes('procesad')) {
                badgeClass = 'badge-eliminar'; // rojo
            } else if (estatusLower.includes('verificaci')) {
                badgeClass = 'badge-otros'; // amarillo/naranja
            } else if (estatusLower.includes('modificad') || estatusLower.includes('reintegrad')) {
                badgeClass = 'badge-modificar'; // azul
            }
            
            return `<span class="badge ${badgeClass}">${d.estatus}</span>`;
        }
        
        // 🔹 PRIORIDAD 2: Para VEHICULOS (tanto CREAR como MODIFICAR)
        if (log.modulo === 'VEHICULOS') {
            if (d.placa) {
                const badgeClass = log.accion === 'MODIFICAR' ? 'badge-modificar' : 'badge-crear';
                return `<span class="badge ${badgeClass}">${d.placa}</span>`;
            } else {
                return `<span class="badge badge-otros">VERIFICACIÓN</span>`;
            }
        }
        
        // 🔹 PRIORIDAD 3: Para PERSONAS (eliminar/reintegrar)
        if (log.modulo === 'PERSONAS') {
            if (log.accion === 'ELIMINAR') return `<span class="badge badge-eliminar">ELIMINADO</span>`;
            if (log.accion === 'REINTEGRAR') return `<span class="badge badge-crear">REINTEGRADO</span>`;
        }
        
        // 🔹 PRIORIDAD 4: Para consultas
        if (d.valor_buscado) return d.valor_buscado;
        if (d.identificador) return d.identificador;
        if (d.cedula) return d.cedula;
    }
    
    // 🔹 Último recurso: mostrar registro_id truncado
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

const usuario = log.user_nombre || 'Sistema';
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
if (tablaContainer) tablaContainer.innerHTML = '<div class="sin-logs"> No tiene permisos para ver los logs del sistema</div>';
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
