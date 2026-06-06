window.initHistorial = function() {
    console.log("⚙️ Iniciando módulo historial.js...");

    if (window._historialInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
        return;
    }
    window._historialInitialized = true;

    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let estacionesData = [];
    let tablasDisponibles = {};

    const el = (id) => document.getElementById(id);
    const statPersonas = el('stat-personas');
    const statVehiculos = el('stat-vehiculos');
    const statAutomoviles = el('stat-automoviles');
    const statMotos = el('stat-motos');
    const statVinculados = el('stat-vinculados');
    const statDenuncias = el('stat-denuncias');
    const statProcesados = el('stat-procesados');
    const periodoSelect = el('hist-periodo');
    const fechaDesde = el('hist-fecha-desde');
    const fechaHasta = el('hist-fecha-hasta');
    const fechasCustom = el('hist-fechas-custom');
    const fechasCustomHasta = el('hist-fechas-custom-hasta');
    const btnFiltrar = el('hist-btn-filtrar');
    const btnReset = el('hist-btn-reset');
    const msg = el('hist-msg');
    const tableContainer = el('estacion-table-container');
    const pagination = el('estacion-pagination');
    const estacionTotal = el('estacion-total');

    if (periodoSelect) {
        periodoSelect.onchange = () => {
            if (periodoSelect.value === 'custom') {
                fechasCustom.style.display = 'flex';
                fechasCustomHasta.style.display = 'flex';
            } else {
                fechasCustom.style.display = 'none';
                fechasCustomHasta.style.display = 'none';
            }
        };
    }

    if (btnFiltrar) btnFiltrar.onclick = () => cargarEstadisticas();
    if (btnReset) btnReset.onclick = () => {
        if (periodoSelect) periodoSelect.value = 'todo';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        fechasCustom.style.display = 'none';
        fechasCustomHasta.style.display = 'none';
        cargarEstadisticas();
    };

    function obtenerRangoFechas() {
        const periodo = periodoSelect?.value || 'todo';
        const hoy = new Date();
        let desde = null, hasta = null;

        if (periodo === 'dia') {
            desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
        } else if (periodo === 'semana') {
            const dia = hoy.getDay();
            const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
            desde = new Date(hoy.setDate(diff));
            desde.setHours(0, 0, 0, 0);
            hasta = new Date(hoy);
            hasta.setDate(hasta.getDate() + 6);
            hasta.setHours(23, 59, 59);
        } else if (periodo === 'mes') {
            desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
        } else if (periodo === 'anio') {
            desde = new Date(hoy.getFullYear(), 0, 1);
            hasta = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59);
        } else if (periodo === 'custom') {
            if (fechaDesde?.value) desde = new Date(fechaDesde.value);
            if (fechaHasta?.value) hasta = new Date(fechaHasta.value + 'T23:59:59');
        }
        return { desde, hasta };
    }

    // Verificar qué tablas existen (solo una vez)
    async function verificarTablasDisponibles() {
        console.log("🔍 Verificando qué tablas existen...");
        
        const tablas = [
            'registro_personas',
            'registro_automoviles',
            'registro_motos',
            'registro_vinculados',
            'registro_procesados',
            'registro_denuncias'
        ];

        for (const tabla of tablas) {
            try {
                const { error } = await window.supabaseClient
                    .from(tabla)
                    .select('id')
                    .limit(1);
                
                tablasDisponibles[tabla] = !error;
                console.log(`  ${tabla}: ${!error ? '✅' : '❌'}`);
            } catch (err) {
                tablasDisponibles[tabla] = false;
                console.log(`  ${tabla}: ❌`);
            }
        }

        // Verificar si registro_procesados tiene estacion_policial
        if (tablasDisponibles['registro_procesados']) {
            try {
                const { error } = await window.supabaseClient
                    .from('registro_procesados')
                    .select('estacion_policial')
                    .limit(1);
                tablasDisponibles['registro_procesados_estacion'] = !error;
            } catch {
                tablasDisponibles['registro_procesados_estacion'] = false;
            }
        }

        return tablasDisponibles;
    }

    // Función segura para contar registros
    async function contarSeguro(tabla, filtros = {}) {
        if (!tablasDisponibles[tabla]) {
            return 0;
        }

        try {
            let query = window.supabaseClient.from(tabla).select('*', { count: 'exact', head: true });
            
            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== undefined && filtros[key] !== null) {
                    query = query.eq(key, filtros[key]);
                }
            });

            const { desde, hasta } = obtenerRangoFechas();
            if (desde) query = query.gte('created_at', desde.toISOString());
            if (hasta) query = query.lte('created_at', hasta.toISOString());

            const { count, error } = await query;
            
            if (error) {
                console.warn(`⚠️ Error en ${tabla}:`, error.message);
                return 0;
            }
            
            return count || 0;
        } catch (err) {
            console.warn(`⚠️ Error en contarSeguro(${tabla}):`, err.message);
            return 0;
        }
    }

    // Cargar estadísticas generales
    async function cargarEstadisticas() {
        console.log("📊 Cargando estadísticas...");
        
        if (msg) {
            msg.textContent = '⏳ Cargando estadísticas...';
            msg.className = 'msg info';
            msg.style.display = 'block';
        }

        try {
            if (Object.keys(tablasDisponibles).length === 0) {
                await verificarTablasDisponibles();
            }

            // 1. Personas registradas
            const countPersonas = await contarSeguro('registro_personas');
            if (statPersonas) statPersonas.textContent = countPersonas;

            // 2. Automóviles
            const countAutos = await contarSeguro('registro_automoviles');
            if (statAutomoviles) statAutomoviles.textContent = countAutos;

            // 3. Motos
            const countMotos = await contarSeguro('registro_motos');
            if (statMotos) statMotos.textContent = countMotos;

            // 4. Vehículos totales (automóviles + motos)
            const countVehiculos = countAutos + countMotos;
            if (statVehiculos) statVehiculos.textContent = countVehiculos;

            // 5. Personas con vehículos (vinculados)
            const countVinculados = await contarSeguro('registro_vinculados');
            if (statVinculados) statVinculados.textContent = countVinculados;

            // 6. Denuncias
            const countDenuncias = await contarSeguro('registro_denuncias');
            if (statDenuncias) statDenuncias.textContent = countDenuncias;

            // 7. Procesados
            const countProcesados = await contarSeguro('registro_procesados');
            if (statProcesados) statProcesados.textContent = countProcesados;

            await cargarEstadisticasPorEstacion();

            const disponibles = Object.entries(tablasDisponibles)
                .filter(([k, v]) => v && !k.includes('_estacion'))
                .map(([k]) => k)
                .join(', ');
            
            if (msg) {
                msg.textContent = `✅ Estadísticas cargadas. Tablas: ${disponibles}`;
                msg.className = 'msg success';
                msg.style.display = 'block';
                setTimeout(() => { if (msg) msg.style.display = 'none'; }, 5000);
            }

        } catch (err) {
            console.error('❌ Error cargando estadísticas:', err);
            if (msg) {
                msg.textContent = '❌ Error: ' + err.message;
                msg.className = 'msg error';
                msg.style.display = 'block';
            }
        }
    }

    // Cargar estadísticas por estación
    async function cargarEstadisticasPorEstacion() {
        console.log("🏛️ Cargando estadísticas por estación...");
        
        if (tableContainer) {
            tableContainer.innerHTML = '<div class="loading">Cargando estadísticas por estación...</div>';
        }

        try {
            const estaciones = [
                'EPM MARACAIBO', 'EPM SAN FRANCISCO', 'EPM LA CAÑADA',
                'EPM ESTACION POLICIAL JESUS E. LOSADA', 'EPP CRISTO DE ARANZA',
                'EPP LUIS HURTADO', 'EPP DAGNINO', 'EPP OLEGARIO VILLALOBOS',
                'EPP CHIQUINQUIRA', 'EPP FRANCISCO EUGENIO', 'EPP CARACCIOLO',
                'EPP IDELFONSO', 'EPP VENANCIO PULGAR', 'EPP COQUIVACOA-ZAPARA',
                'EPP RAUL LEONI', 'EPP ANTONIO BORJAS ROMERO', 'EPP JUANA DE AVILA',
                'EPP SAN ISIDRO', 'EPP CASIQUE MARA', 'EPP BOLIVAR', 'EPP EL BAJO',
                'EPP DOMITILA', 'EPP CORTIJOS', 'EPP MARCIAL HERNANDEZ',
                'EPP POTRERITO', 'EPP ANDRES BELLO', 'EPP SANTA LUCIA'
            ];

            estacionesData = [];

            for (const estacion of estaciones) {
                const stats = {
                    estacion: estacion,
                    personas: 0,
                    vehiculos: 0,
                    vinculados: 0,
                    denuncias: 0,
                    procesados: 0,
                    total: 0
                };

                if (tablasDisponibles['registro_personas']) {
                    stats.personas = await contarSeguro('registro_personas', { estacion_policial: estacion });
                }
                
                if (tablasDisponibles['registro_automoviles']) {
                    stats.vehiculos += await contarSeguro('registro_automoviles', { estacion_policial: estacion });
                }
                
                if (tablasDisponibles['registro_motos']) {
                    stats.vehiculos += await contarSeguro('registro_motos', { estacion_policial: estacion });
                }
                
                if (tablasDisponibles['registro_vinculados']) {
                    stats.vinculados = await contarSeguro('registro_vinculados', { estacion_policial: estacion });
                }
                
                if (tablasDisponibles['registro_denuncias']) {
                    stats.denuncias = await contarSeguro('registro_denuncias', { estacion_policial: estacion });
                }
                
                if (tablasDisponibles['registro_procesados_estacion']) {
                    stats.procesados = await contarSeguro('registro_procesados', { estacion_policial: estacion });
                }

                stats.total = stats.personas + stats.vehiculos + stats.vinculados + stats.denuncias + stats.procesados;
                estacionesData.push(stats);
            }

            estacionesData.sort((a, b) => b.total - a.total);

            currentPage = 1;
            renderTablaEstaciones();

        } catch (err) {
            console.error('❌ Error cargando estadísticas por estación:', err);
            if (tableContainer) {
                tableContainer.innerHTML = `<div class="loading">❌ Error: ${err.message}</div>`;
            }
        }
    }

    function renderTablaEstaciones() {
        if (!tableContainer) return;

        if (estacionesData.length === 0) {
            tableContainer.innerHTML = '<div class="loading">No hay datos para mostrar</div>';
            if (pagination) pagination.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(estacionesData.length / ITEMS_PER_PAGE);
        const inicio = (currentPage - 1) * ITEMS_PER_PAGE;
        const fin = Math.min(inicio + ITEMS_PER_PAGE, estacionesData.length);
        const datosPagina = estacionesData.slice(inicio, fin);

        let html = `
            <table class="estacion-table">
                <thead>
                    <tr>
                        <th>Estación Policial</th>
                        <th>Personas</th>
                        <th>Vehículos</th>
                        <th>Vinculados</th>
                        <th>Denuncias</th>
                        <th>Procesados</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        datosPagina.forEach(stats => {
            html += `
                <tr>
                    <td>${stats.estacion}</td>
                    <td class="count-cell">${stats.personas}</td>
                    <td class="count-cell">${stats.vehiculos}</td>
                    <td class="count-cell">${stats.vinculados}</td>
                    <td class="count-cell">${stats.denuncias}</td>
                    <td class="count-cell">${stats.procesados}</td>
                    <td class="count-cell">${stats.total}</td>
                </tr>
            `;
        });

        const totales = { personas: 0, vehiculos: 0, vinculados: 0, denuncias: 0, procesados: 0, total: 0 };
        estacionesData.forEach(s => {
            totales.personas += s.personas;
            totales.vehiculos += s.vehiculos;
            totales.vinculados += s.vinculados;
            totales.denuncias += s.denuncias;
            totales.procesados += s.procesados;
            totales.total += s.total;
        });

        html += `
                <tr class="total-row">
                    <td><strong>TOTAL GENERAL</strong></td>
                    <td class="count-cell">${totales.personas}</td>
                    <td class="count-cell">${totales.vehiculos}</td>
                    <td class="count-cell">${totales.vinculados}</td>
                    <td class="count-cell">${totales.denuncias}</td>
                    <td class="count-cell">${totales.procesados}</td>
                    <td class="count-cell">${totales.total}</td>
                </tr>
            </tbody>
        </table>`;

        tableContainer.innerHTML = html;

        if (estacionTotal) {
            estacionTotal.textContent = `Mostrando ${inicio + 1}-${fin} de ${estacionesData.length} estaciones`;
        }

        if (totalPages > 1 && pagination) {
            renderPaginacion(totalPages);
            pagination.style.display = 'flex';
        } else if (pagination) {
            pagination.style.display = 'none';
        }
    }

    function renderPaginacion(totalPages) {
        if (!pagination) return;

        let html = '';
        html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">◀ Anterior</button>`;

        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

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
        html += `<span class="pagination-info">Página ${currentPage} de ${totalPages}</span>`;

        pagination.innerHTML = html;

        pagination.querySelectorAll('button[data-page]').forEach(btn => {
            btn.onclick = () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    currentPage = page;
                    renderTablaEstaciones();
                }
            };
        });
    }

    console.log("🚀 Cargando estadísticas iniciales...");
    cargarEstadisticas();
    console.log("✅ Módulo historial.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initHistorial);
} else {
    window.initHistorial();
}
