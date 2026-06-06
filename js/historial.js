window.initHistorial = function() {
    console.log("️ Iniciando módulo historial.js...");

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

    // BARRA DE PROGRESO
    const progressContainer = el('hist-progress-container');
    const progressLabel = el('hist-progress-label');
    const progressPercent = el('hist-progress-percent');
    const progressFill = el('hist-progress-fill');
    const progressDetail = el('hist-progress-detail');

    if (!tableContainer || !btnFiltrar) {
        console.warn("⚠️ Elementos del historial no encontrados");
        return;
    }

    function actualizarProgreso(porcentaje, label, detalle) {
        if (!progressContainer) return;
        progressContainer.style.display = 'block';
        progressFill.style.width = `${porcentaje}%`;
        progressPercent.textContent = `${Math.round(porcentaje)}%`;
        if (label) progressLabel.textContent = label;
        if (detalle) progressDetail.textContent = detalle;
    }

    function ocultarProgreso() {
        if (progressContainer) progressContainer.style.display = 'none';
    }

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

    // Verificar tablas
    async function verificarTablasDisponibles() {
        console.log("🔍 Verificando qué tablas existen...");
        
        const tablas = [
            'registro_personas',
            'registro_automoviles',
            'registro_motos',
            'registro_vinculado',
            'registro_procesados',
            'denuncias'
        ];

        for (let i = 0; i < tablas.length; i++) {
            const tabla = tablas[i];
            try {
                const { error } = await window.supabaseClient
                    .from(tabla)
                    .select('*')
                    .limit(1);
                tablasDisponibles[tabla] = !error;
                console.log(`  ${tabla}: ${!error ? '✅' : '❌'}`);
            } catch {
                tablasDisponibles[tabla] = false;
            }
            
            const progreso = ((i + 1) / tablas.length) * 15;
            actualizarProgreso(progreso, '🔍 Verificando estructura...', `Comprobando: ${tabla}`);
        }
    }

    // ✅ FUNCIÓN DE CONTEO MEJORADA
    async function contarSeguro(tabla, filtros = {}) {
        if (!tablasDisponibles[tabla]) {
            return 0;
        }

        try {
            let query = window.supabaseClient.from(tabla).select('*', { count: 'exact', head: true });
            
            // Aplicar filtros
            for (const [key, value] of Object.entries(filtros)) {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            }

            // Aplicar rango de fechas
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
            console.warn(`⚠️ Excepción en contarSeguro(${tabla}):`, err.message);
            return 0;
        }
    }

    // ✅ CARGAR ESTADÍSTICAS GENERALES
    async function cargarEstadisticasGenerales() {
        const estadisticas = [
            { tabla: 'registro_personas', stat: statPersonas, label: 'Personas', filtros: {} },
            { tabla: 'registro_automoviles', stat: statAutomoviles, label: 'Automóviles', filtros: {} },
            { tabla: 'registro_motos', stat: statMotos, label: 'Motos', filtros: {} },
            { tabla: 'registro_vinculado', stat: statVinculados, label: 'Vinculados', filtros: {} },
            { tabla: 'denuncias', stat: statDenuncias, label: 'Denuncias', filtros: {} },
            // ✅ NUEVO: Procesados viene de registro_personas con estatus='Procesado'
            { tabla: 'registro_personas', stat: statProcesados, label: 'Procesados', filtros: { estatus: 'Procesado' } }
        ];

        let countAutos = 0, countMotos = 0;

        for (let i = 0; i < estadisticas.length; i++) {
            const { tabla, stat, label, filtros } = estadisticas[i];
            
            console.log(`🔎 Consultando ${tabla}...`, filtros);
            
            const count = await contarSeguro(tabla, filtros);
            
            console.log(`✅ ${label}: ${count} registros`);
            
            if (stat) stat.textContent = count;
            
            if (tabla === 'registro_automoviles') countAutos = count;
            if (tabla === 'registro_motos') countMotos = count;

            const progreso = 15 + ((i + 1) / estadisticas.length) * 15;
            actualizarProgreso(
                progreso,
                '📊 Cargando estadísticas generales...',
                `${label}: ${count} registros`
            );
        }

        if (statVehiculos) statVehiculos.textContent = countAutos + countMotos;
    }

    // ✅ CARGAR ESTADÍSTICAS POR ESTACIÓN
    async function cargarEstadisticasPorEstacion() {
        if (tableContainer) {
            tableContainer.innerHTML = '<div class="loading">Cargando estadísticas por estación...</div>';
        }

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
        const totalEstaciones = estaciones.length;

        for (let i = 0; i < totalEstaciones; i++) {
            const estacion = estaciones[i];
            const stats = {
                estacion: estacion,
                personas: 0,
                vehiculos: 0,
                vinculados: 0,
                denuncias: 0,
                procesados: 0,
                total: 0
            };

            const progresoBase = 30 + ((i / totalEstaciones) * 65);
            actualizarProgreso(
                progresoBase,
                '🏛️ Analizando estaciones...',
                `${i + 1}/${totalEstaciones}: ${estacion}`
            );

            // ✅ Personas totales de la estación
            if (tablasDisponibles['registro_personas']) {
                stats.personas = await contarSeguro('registro_personas', { estacion_policial: estacion });
            }
            
            // ✅ Automóviles de la estación
            if (tablasDisponibles['registro_automoviles']) {
                stats.vehiculos += await contarSeguro('registro_automoviles', { estacion_policial: estacion });
            }
            
            // ✅ Motos de la estación
            if (tablasDisponibles['registro_motos']) {
                stats.vehiculos += await contarSeguro('registro_motos', { estacion_policial: estacion });
            }
            
            // ✅ Vinculados de la estación
            if (tablasDisponibles['registro_vinculado']) {
                stats.vinculados = await contarSeguro('registro_vinculado', { estacion_policial: estacion });
            }
            
            // ✅ Denuncias de la estación
            if (tablasDisponibles['denuncias']) {
                stats.denuncias = await contarSeguro('denuncias', { estacion_policial: estacion });
            }
            
            // ✅ PROCESADOS: Ahora viene de registro_personas con estacion + estatus='Procesado'
            if (tablasDisponibles['registro_personas']) {
                stats.procesados = await contarSeguro('registro_personas', { 
                    estacion_policial: estacion,
                    estatus: 'Procesado'
                });
            }

            stats.total = stats.personas + stats.vehiculos + stats.vinculados + stats.denuncias + stats.procesados;
            estacionesData.push(stats);
        }

        estacionesData.sort((a, b) => b.total - a.total);
        currentPage = 1;
        renderTablaEstaciones();
    }

    // ✅ FUNCIÓN PRINCIPAL
    async function cargarEstadisticas() {
        if (msg) msg.style.display = 'none';
        
        actualizarProgreso(0, '⏳ Iniciando carga...', 'Preparando consultas...');

        try {
            if (Object.keys(tablasDisponibles).length === 0) {
                await verificarTablasDisponibles();
            }

            await cargarEstadisticasGenerales();
            await cargarEstadisticasPorEstacion();

            actualizarProgreso(100, '✅ ¡Carga completada!', 'Todas las estadísticas están listas');

            setTimeout(() => {
                ocultarProgreso();
                if (msg) {
                    msg.textContent = '✅ Estadísticas actualizadas correctamente';
                    msg.className = 'msg success';
                    msg.style.display = 'block';
                    setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
                }
            }, 1500);

        } catch (err) {
            console.error(' Error cargando estadísticas:', err);
            ocultarProgreso();
            if (msg) {
                msg.textContent = '❌ Error: ' + err.message;
                msg.className = 'msg error';
                msg.style.display = 'block';
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
        html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"> Anterior</button>`;

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

    console.log(" Cargando estadísticas iniciales...");
    cargarEstadisticas();
    console.log("✅ Módulo historial.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initHistorial);
} else {
    window.initHistorial();
}
