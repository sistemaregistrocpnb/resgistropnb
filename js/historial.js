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

    // Referencias DOM
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

    // Mostrar/ocultar fechas personalizadas
    if (periodoSelect) {
        periodoSelect.addEventListener('change', () => {
            if (periodoSelect.value === 'custom') {
                fechasCustom.style.display = 'flex';
                fechasCustomHasta.style.display = 'flex';
            } else {
                fechasCustom.style.display = 'none';
                fechasCustomHasta.style.display = 'none';
            }
        });
    }

    // Event listeners
    if (btnFiltrar) btnFiltrar.onclick = () => cargarEstadisticas();
    if (btnReset) btnReset.onclick = () => {
        if (periodoSelect) periodoSelect.value = 'todo';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        fechasCustom.style.display = 'none';
        fechasCustomHasta.style.display = 'none';
        cargarEstadisticas();
    };

    // Función para obtener rango de fechas según período
    function obtenerRangoFechas() {
        const periodo = periodoSelect?.value || 'todo';
        const hoy = new Date();
        let desde = null;
        let hasta = null;

        if (periodo === 'dia') {
            desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
        } else if (periodo === 'semana') {
            const diaSemana = hoy.getDay();
            const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
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

    // Función para construir filtro de fecha para Supabase
    function construirFiltroFecha(query, campoFecha = 'created_at') {
        const { desde, hasta } = obtenerRangoFechas();
        if (desde) query = query.gte(campoFecha, desde.toISOString());
        if (hasta) query = query.lte(campoFecha, hasta.toISOString());
        return query;
    }

    // Cargar todas las estadísticas
    async function cargarEstadisticas() {
        console.log("📊 Cargando estadísticas...");
        
        if (msg) {
            msg.textContent = '⏳ Cargando estadísticas...';
            msg.className = 'msg info';
            msg.style.display = 'block';
        }

        try {
            // 1. Personas registradas
            let queryPersonas = window.supabaseClient.from('registro_personas').select('*', { count: 'exact', head: true });
            queryPersonas = construirFiltroFecha(queryPersonas, 'created_at');
            const { count: countPersonas, error: errPersonas } = await queryPersonas;
            if (errPersonas) throw errPersonas;
            if (statPersonas) statPersonas.textContent = countPersonas || 0;

            // 2. Vehículos totales
            let queryVehiculos = window.supabaseClient.from('registro_vehiculos').select('*', { count: 'exact', head: true });
            queryVehiculos = construirFiltroFecha(queryVehiculos, 'created_at');
            const { count: countVehiculos, error: errVehiculos } = await queryVehiculos;
            if (errVehiculos) throw errVehiculos;
            if (statVehiculos) statVehiculos.textContent = countVehiculos || 0;

            // 3. Automóviles
            let queryAutos = window.supabaseClient.from('registro_vehiculos').select('*', { count: 'exact', head: true }).eq('tipo_vehiculo', 'Automóvil');
            queryAutos = construirFiltroFecha(queryAutos, 'created_at');
            const { count: countAutos, error: errAutos } = await queryAutos;
            if (errAutos) throw errAutos;
            if (statAutomoviles) statAutomoviles.textContent = countAutos || 0;

            // 4. Motos
            let queryMotos = window.supabaseClient.from('registro_vehiculos').select('*', { count: 'exact', head: true }).eq('tipo_vehiculo', 'Moto');
            queryMotos = construirFiltroFecha(queryMotos, 'created_at');
            const { count: countMotos, error: errMotos } = await queryMotos;
            if (errMotos) throw errMotos;
            if (statMotos) statMotos.textContent = countMotos || 0;

            // 5. Personas con vehículos (vinculados)
            let queryVinculados = window.supabaseClient.from('registro_vinculados').select('*', { count: 'exact', head: true });
            queryVinculados = construirFiltroFecha(queryVinculados, 'created_at');
            const { count: countVinculados, error: errVinculados } = await queryVinculados;
            if (errVinculados) throw errVinculados;
            if (statVinculados) statVinculados.textContent = countVinculados || 0;

            // 6. Denuncias
            let queryDenuncias = window.supabaseClient.from('denuncias').select('*', { count: 'exact', head: true });
            queryDenuncias = construirFiltroFecha(queryDenuncias, 'created_at');
            const { count: countDenuncias, error: errDenuncias } = await queryDenuncias;
            if (errDenuncias) throw errDenuncias;
            if (statDenuncias) statDenuncias.textContent = countDenuncias || 0;

            // 7. Procesados
            let queryProcesados = window.supabaseClient.from('registro_procesados').select('*', { count: 'exact', head: true });
            queryProcesados = construirFiltroFecha(queryProcesados, 'created_at');
            const { count: countProcesados, error: errProcesados } = await queryProcesados;
            if (errProcesados) throw errProcesados;
            if (statProcesados) statProcesados.textContent = countProcesados || 0;

            // Cargar estadísticas por estación
            await cargarEstadisticasPorEstacion();

            if (msg) {
                msg.textContent = '✅ Estadísticas actualizadas correctamente';
                msg.className = 'msg success';
                msg.style.display = 'block';
                setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
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

                // Personas
                let qP = window.supabaseClient.from('registro_personas').select('*', { count: 'exact', head: true }).eq('estacion_policial', estacion);
                qP = construirFiltroFecha(qP, 'created_at');
                const { count: cP } = await qP;
                stats.personas = cP || 0;

                // Vehículos
                let qV = window.supabaseClient.from('registro_vehiculos').select('*', { count: 'exact', head: true }).eq('estacion_policial', estacion);
                qV = construirFiltroFecha(qV, 'created_at');
                const { count: cV } = await qV;
                stats.vehiculos = cV || 0;

                // Vinculados
                let qVi = window.supabaseClient.from('registro_vinculados').select('*', { count: 'exact', head: true }).eq('estacion_policial', estacion);
                qVi = construirFiltroFecha(qVi, 'created_at');
                const { count: cVi } = await qVi;
                stats.vinculados = cVi || 0;

                // Denuncias
                let qD = window.supabaseClient.from('denuncias').select('*', { count: 'exact', head: true }).eq('estacion_policial', estacion);
                qD = construirFiltroFecha(qD, 'created_at');
                const { count: cD } = await qD;
                stats.denuncias = cD || 0;

                // Procesados
                let qPr = window.supabaseClient.from('registro_procesados').select('*', { count: 'exact', head: true }).eq('estacion_policial', estacion);
                qPr = construirFiltroFecha(qPr, 'created_at');
                const { count: cPr } = await qPr;
                stats.procesados = cPr || 0;

                stats.total = stats.personas + stats.vehiculos + stats.vinculados + stats.denuncias + stats.procesados;
                estacionesData.push(stats);
            }

            // Ordenar por total descendente
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

    // Renderizar tabla de estaciones
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

        // Fila de totales
        const totales = {
            personas: 0, vehiculos: 0, vinculados: 0, denuncias: 0, procesados: 0, total: 0
        };
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

        // Paginación
        if (totalPages > 1 && pagination) {
            renderPaginacion(totalPages);
            pagination.style.display = 'flex';
        } else if (pagination) {
            pagination.style.display = 'none';
        }
    }

    // Renderizar paginación
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

    // Cargar estadísticas al iniciar
    console.log("🚀 Cargando estadísticas iniciales...");
    cargarEstadisticas();
    console.log("✅ Módulo historial.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initHistorial);
} else {
    window.initHistorial();
}
