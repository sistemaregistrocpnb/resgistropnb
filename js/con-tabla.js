window.initConTabla = function() {
    console.log("⚙️ Iniciando módulo con-tabla.js...");

    if (window._conTablaInitialized) return;
    window._conTablaInitialized = true;

    const ITEMS_PER_PAGE = 15;
    let currentPage = 1;
    let currentData = [];
    let currentSearchMode = 'ultimas';

    const cedulaInput = document.getElementById('con_buscar_cedula');
    const btnBuscar = document.getElementById('con_btn_buscar');
    const btnUltimas = document.getElementById('con_btn_ultimas');
    const checkIncluirEliminadas = document.getElementById('con_incluir_eliminadas');
    const msg = document.getElementById('con_msg');
    const tableContent = document.getElementById('con_table_content');
    const tableTitle = document.getElementById('con_table_title');
    const tableCount = document.getElementById('con_table_count');
    const pagination = document.getElementById('con_pagination');
    const modalOverlay = document.getElementById('con_modal_overlay');
    const modalClose = document.getElementById('con_modal_close');
    const fichaContent = document.getElementById('con_ficha_content');
    const modalTitle = document.getElementById('con_modal_title');
    const btnPrint = document.getElementById('con_btn_print');
    const btnPdf = document.getElementById('con_btn_pdf');

    async function cargarHtml2Pdf() {
        if (window.html2pdf) {
            console.log("✅ html2pdf ya está cargado");
            return true;
        }

        console.log("⏳ Cargando librería html2pdf dinámicamente...");
        
        return new Promise((resolve, reject) => {
            const cdns = [
                'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
                'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
                'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
            ];

            let intentos = 0;

            function intentarCargar() {
                if (intentos >= cdns.length) {
                    reject(new Error('No se pudo cargar html2pdf desde ningún CDN.'));
                    return;
                }

                const script = document.createElement('script');
                script.src = cdns[intentos];
                script.onload = () => {
                    if (window.html2pdf) {
                        console.log(`✅ html2pdf cargado desde: ${cdns[intentos]}`);
                        resolve(true);
                    } else {
                        intentos++;
                        intentarCargar();
                    }
                };
                script.onerror = () => {
                    console.warn(`⚠️ CDN ${cdns[intentos]} falló.`);
                    intentos++;
                    intentarCargar();
                };
                document.head.appendChild(script);
            }

            intentarCargar();
        });
    }

    if (cedulaInput) {
        cedulaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar.click();
            }
        });
    }

    btnBuscar?.addEventListener('click', () => buscarPorCedula());
    btnUltimas?.addEventListener('click', () => cargarUltimas());
    modalClose?.addEventListener('click', () => cerrarModal());
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });
    btnPrint?.addEventListener('click', () => window.print());
    btnPdf?.addEventListener('click', () => exportarPDF());

    async function cargarUltimas() {
        currentSearchMode = 'ultimas';
        currentPage = 1;
        currentData = [];
        
        if (msg) { msg.textContent = '⏳ Cargando últimas denuncias...'; msg.className = 'msg info'; msg.style.display = 'block'; }
        tableContent.innerHTML = '<div class="con-loading">⏳ Cargando...</div>';
        tableTitle.textContent = '📋 Últimas Denuncias Registradas';

        try {
            const { data, error, count } = await window.supabaseClient
                .from('denuncias')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(0, ITEMS_PER_PAGE - 1);

            if (error) throw error;

            currentData = data || [];
            tableCount.textContent = `Total: ${count || 0} denuncia(s)`;
            
            if (currentData.length === 0) {
                tableContent.innerHTML = '<div class="con-empty">📭 No hay denuncias registradas aún.</div>';
                pagination.style.display = 'none';
                if (msg) msg.style.display = 'none';
                return;
            }

            renderTabla(currentData);
            
            if (count > ITEMS_PER_PAGE) {
                renderPaginacion(count);
            } else {
                pagination.style.display = 'none';
            }

            if (msg) {
                msg.textContent = `✅ Mostrando las últimas ${currentData.length} denuncia(s).`;
                msg.className = 'msg success';
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 3000);
            }

        } catch (err) {
            console.error('Error:', err);
            tableContent.innerHTML = `<div class="con-empty">❌ Error al cargar: ${err.message}</div>`;
            if (msg) { msg.textContent = '❌ ' + err.message; msg.className = 'msg error'; msg.style.display = 'block'; }
        }
    }

    async function buscarPorCedula() {
        const cedulaRaw = cedulaInput?.value.trim().toUpperCase().replace(/\s/g, '') || '';
        const incluirEliminadas = checkIncluirEliminadas?.checked || false;
        const cedulaRegex = /^[VE]-\d{6,9}$/;

        if (!cedulaRaw) {
            if (msg) { msg.textContent = '⚠️ Ingrese una cédula para buscar o presione "Mostrar últimas".'; msg.className = 'msg error'; msg.style.display = 'block'; }
            return;
        }

        if (!cedulaRegex.test(cedulaRaw)) {
            if (msg) { msg.textContent = '⚠️ Formato incorrecto. Debe ser V- o E- seguido del número (Ej: V-12345678).'; msg.className = 'msg error'; msg.style.display = 'block'; }
            return;
        }

        currentSearchMode = 'cedula';
        currentPage = 1;
        currentData = [];

        if (msg) { msg.textContent = ' Buscando denuncias...'; msg.className = 'msg info'; msg.style.display = 'block'; }
        tableContent.innerHTML = '<div class="con-loading">⏳ Buscando...</div>';
        tableTitle.textContent = `🔍 Resultados para cédula: ${cedulaRaw}`;

        try {
            let todasLasDenuncias = [];

            const { data: activas, error: errorActivas } = await window.supabaseClient
                .from('denuncias')
                .select('*')
                .eq('cedula', cedulaRaw)
                .order('created_at', { ascending: false });

            if (errorActivas) throw errorActivas;
            if (activas) {
                todasLasDenuncias = todasLasDenuncias.concat(activas.map(d => ({ ...d, estado: 'activa' })));
            }

            if (incluirEliminadas) {
                const { data: eliminadas, error: errorEliminadas } = await window.supabaseClient
                    .from('denuncias_eliminadas')
                    .select('*')
                    .eq('cedula', cedulaRaw)
                    .order('fecha_eliminacion', { ascending: false });

                if (errorEliminadas) {
                    console.warn('No se pudieron cargar las eliminadas:', errorEliminadas);
                } else if (eliminadas) {
                    todasLasDenuncias = todasLasDenuncias.concat(eliminadas.map(d => ({ ...d, estado: 'eliminada' })));
                }
            }

            todasLasDenuncias.sort((a, b) => {
                const fechaA = new Date(a.created_at || a.fecha_hora_original);
                const fechaB = new Date(b.created_at || b.fecha_hora_original);
                return fechaB - fechaA;
            });

            currentData = todasLasDenuncias;
            tableCount.textContent = `Total: ${currentData.length} denuncia(s)`;

            if (currentData.length === 0) {
                tableContent.innerHTML = '<div class="con-empty">📭 No se encontraron denuncias con esa cédula.</div>';
                pagination.style.display = 'none';
                if (msg) { msg.textContent = '⚠️ No se encontraron denuncias.'; msg.className = 'msg error'; msg.style.display = 'block'; }
                return;
            }

            const inicio = 0;
            const fin = Math.min(ITEMS_PER_PAGE, currentData.length);
            renderTabla(currentData.slice(inicio, fin));

            if (currentData.length > ITEMS_PER_PAGE) {
                renderPaginacion(currentData.length);
            } else {
                pagination.style.display = 'none';
            }

            const countEliminadas = todasLasDenuncias.filter(d => d.estado === 'eliminada').length;
            let mensajeExito = `✅ Se encontraron ${currentData.length} denuncia(s).`;
            if (countEliminadas > 0) {
                mensajeExito += ` (${countEliminadas} eliminada${countEliminadas > 1 ? 's' : ''})`;
            }
            if (msg) { msg.textContent = mensajeExito; msg.className = 'msg success'; msg.style.display = 'block'; }

        } catch (err) {
            console.error('Error:', err);
            tableContent.innerHTML = `<div class="con-empty">❌ Error: ${err.message}</div>`;
            if (msg) { msg.textContent = '❌ ' + err.message; msg.className = 'msg error'; msg.style.display = 'block'; }
        }
    }

    function renderTabla(datos) {
        if (!datos || datos.length === 0) {
            tableContent.innerHTML = '<div class="con-empty">📭 Sin resultados.</div>';
            return;
        }

        let html = `
            <table class="con-table">
                <thead>
                    <tr>
                        <th>N° Denuncia</th>
                        <th>Cédula</th>
                        <th>Denunciante</th>
                        <th>Estación</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
        `;

        datos.forEach((denuncia, index) => {
            const nombreCompleto = `${denuncia.primer_nombre || ''} ${denuncia.primer_apellido || ''}`.trim() || 'N/A';
            const fecha = new Date(denuncia.created_at || denuncia.fecha_hora_original).toLocaleString('es-VE', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
            const estado = denuncia.estado === 'eliminada' 
                ? '<span class="badge-eliminado">🗑️ ELIMINADA</span>' 
                : '<span class="badge-activo">✅ ACTIVA</span>';

            html += `
                <tr>
                    <td class="numero-denuncia">${denuncia.numero_denuncia || 'N/A'}</td>
                    <td>${denuncia.cedula || 'N/A'}</td>
                    <td>${nombreCompleto}</td>
                    <td>${denuncia.estacion_policial || 'N/A'}</td>
                    <td>${fecha}</td>
                    <td>${estado}</td>
                    <td><button class="con-btn-ver" data-index="${index}">👁️ Ver Ficha</button></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tableContent.innerHTML = html;

        tableContent.querySelectorAll('.con-btn-ver').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                const offset = (currentPage - 1) * ITEMS_PER_PAGE;
                const denuncia = currentData[offset + index];
                if (denuncia) mostrarFicha(denuncia);
            });
        });
    }

    function renderPaginacion(totalItems) {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
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
            if (startPage > 2) html += `<span class="con-pagination-info">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="con-pagination-info">...</span>`;
            html += `<button data-page="${totalPages}">${totalPages}</button>`;
        }

        html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Siguiente ▶</button>`;
        html += `<span class="con-pagination-info">Página ${currentPage} de ${totalPages}</span>`;

        pagination.innerHTML = html;
        pagination.style.display = 'flex';

        pagination.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    currentPage = page;
                    cambiarPagina();
                }
            });
        });
    }

    function cambiarPagina() {
        const inicio = (currentPage - 1) * ITEMS_PER_PAGE;
        const fin = Math.min(inicio + ITEMS_PER_PAGE, currentData.length);
        const datosPagina = currentData.slice(inicio, fin);
        renderTabla(datosPagina);

        const totalItems = currentData.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        renderPaginacion(totalItems);

        tableContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function mostrarFicha(denuncia) {
        const esEliminada = denuncia.estado === 'eliminada';
        const numero = denuncia.numero_denuncia || 'N/A';
        const fechaOriginal = denuncia.fecha_hora_original || denuncia.created_at;
        const fecha = fechaOriginal ? new Date(fechaOriginal).toLocaleString('es-VE') : 'N/A';

        modalTitle.textContent = `📄 Ficha: ${numero}`;

        let avisoEliminada = '';
        if (esEliminada) {
            const fechaElim = denuncia.fecha_eliminacion ? new Date(denuncia.fecha_eliminacion).toLocaleString('es-VE') : 'N/A';
            avisoEliminada = `
                <div class="ficha-eliminado-aviso">
                    <strong>⚠️ DENUNCIA ELIMINADA</strong><br>
                    Eliminada el: ${fechaElim}<br>
                    Por: ${denuncia.email_eliminador || 'N/A'}<br>
                    Motivo: ${denuncia.motivo_eliminacion || 'No especificado'}
                </div>
            `;
        }

        const docsUnicos = [
            { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
            { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
            { id: 'medida_proteccion', label: '🛡️ Medida de Protección' }
        ];
        const docsMultiples = [
            { id: 'acta_entrevista', label: '🎤 Acta de Entrevista' },
            { id: 'datos_filiatorios', label: '👤 Datos Filiatorios' },
            { id: 'evidencias', label: '🔍 Evidencias' },
            { id: 'solicitud_senamecf', label: '🏥 Solicitud SENAMECF' }
        ];

        let docsUnicosHtml = '<ul class="ficha-docs-list">';
        let hayDocsUnicos = false;
        docsUnicos.forEach(doc => {
            const url = denuncia[doc.id];
            if (url) {
                hayDocsUnicos = true;
                docsUnicosHtml += `<li>✅ ${doc.label}: <a href="${url}" target="_blank">Ver/Descargar PDF</a></li>`;
            }
        });
        if (!hayDocsUnicos) docsUnicosHtml += '<li style="color: #94a3b8;">Sin documentos cargados</li>';
        docsUnicosHtml += '</ul>';

        let docsMultiplesHtml = '<ul class="ficha-docs-list">';
        let hayDocsMultiples = false;
        docsMultiples.forEach(doc => {
            const urls = denuncia[doc.id];
            if (Array.isArray(urls) && urls.length > 0) {
                hayDocsMultiples = true;
                urls.forEach((url, i) => {
                    docsMultiplesHtml += `<li>✅ ${doc.label} (${i + 1}): <a href="${url}" target="_blank">Ver/Descargar PDF</a></li>`;
                });
            }
        });
        if (!hayDocsMultiples) docsMultiplesHtml += '<li style="color: #94a3b8;">Sin documentos cargados</li>';
        docsMultiplesHtml += '</ul>';

        const logoUrl = './img/LOGO-PNB.png';

        fichaContent.innerHTML = `
            ${avisoEliminada}
            
            <div class="ficha-header">
                <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                    <img src="${logoUrl}" alt="Logo CPNB" style="max-width: 120px; max-height: 120px; object-fit: contain;" 
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzAwMmI1YyIvPjx0ZXh0IHg9IjYwIiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q1BOQjwvdGV4dD48L3N2Zz4='; this.style.maxWidth='80px'; this.style.maxHeight='80px';">
                </div>
                <h1>CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h1>
                <h2>FICHA DE DENUNCIA</h2>
                <div class="numero-grande">${numero}</div>
            </div>

            <div class="ficha-section">
                <div class="ficha-section-title">📅 Información General</div>
                <div class="ficha-grid">
                    <div class="ficha-field">
                        <div class="ficha-label">Fecha y Hora</div>
                        <div class="ficha-value">${fecha}</div>
                    </div>
                    <div class="ficha-field">
                        <div class="ficha-label">Estación Policial</div>
                        <div class="ficha-value">${denuncia.estacion_policial || 'N/A'}</div>
                    </div>
                    <div class="ficha-field full">
                        <div class="ficha-label">Registrado por</div>
                        <div class="ficha-value">${denuncia.email_registrante || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="ficha-section">
                <div class="ficha-section-title">👤 Datos del Denunciante</div>
                <div class="ficha-grid">
                    <div class="ficha-field">
                        <div class="ficha-label">Cédula de Identidad</div>
                        <div class="ficha-value">${denuncia.cedula || 'N/A'}</div>
                    </div>
                    <div class="ficha-field">
                        <div class="ficha-label">Teléfono</div>
                        <div class="ficha-value">${denuncia.tlf_pais || ''} ${denuncia.tlf_numero || 'N/A'}</div>
                    </div>
                    <div class="ficha-field">
                        <div class="ficha-label">Primer Nombre</div>
                        <div class="ficha-value">${denuncia.primer_nombre || 'N/A'}</div>
                    </div>
                    <div class="ficha-field">
                        <div class="ficha-label">Segundo Nombre</div>
                        <div class="ficha-value">${denuncia.segundo_nombre || 'N/A'}</div>
                    </div>
                    <div class="ficha-field">
                        <div class="ficha-label">Primer Apellido</div>
                        <div class="ficha-value">${denuncia.primer_apellido || 'N/A'}</div>
                    </div>
                    <div class="ficha-field">
                        <div class="ficha-label">Segundo Apellido</div>
                        <div class="ficha-value">${denuncia.segundo_apellido || 'N/A'}</div>
                    </div>
                    <div class="ficha-field full">
                        <div class="ficha-label">Dirección</div>
                        <div class="ficha-value">${denuncia.direccion || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="ficha-section">
                <div class="ficha-section-title">📌 Motivo de la Denuncia</div>
                <div class="ficha-field full">
                    <div class="ficha-value" style="white-space: pre-wrap;">${denuncia.motivo_denuncia || 'No especificado'}</div>
                </div>
            </div>

            <div class="ficha-section">
                <div class="ficha-section-title">📝 Observaciones</div>
                <div class="ficha-field full">
                    <div class="ficha-value" style="white-space: pre-wrap;">${denuncia.observaciones || 'Sin observaciones'}</div>
                </div>
            </div>

            <div class="ficha-section">
                <div class="ficha-section-title">📄 Documentos Únicos</div>
                ${docsUnicosHtml}
            </div>

            <div class="ficha-section">
                <div class="ficha-section-title">📁 Documentos Múltiples</div>
                ${docsMultiplesHtml}
            </div>
        `;

        modalOverlay.classList.add('active');
    }

    function cerrarModal() {
        modalOverlay.classList.remove('active');
    }

    async function exportarPDF() {
        const numero = modalTitle.textContent.replace('📄 Ficha: ', '').trim();
        const element = fichaContent;
        
        btnPdf.disabled = true;
        btnPdf.textContent = '⏳ Cargando librería...';

        try {
            await cargarHtml2Pdf();

            btnPdf.textContent = '⏳ Generando PDF...';

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Denuncia_${numero}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await window.html2pdf().set(opt).from(element).save();
            
            btnPdf.disabled = false;
            btnPdf.textContent = ' Exportar PDF';

        } catch (err) {
            console.error('Error al generar PDF:', err);
            alert('❌ Error al generar el PDF: ' + err.message);
            btnPdf.disabled = false;
            btnPdf.textContent = ' Exportar PDF';
        }
    }

    cargarUltimas();
    console.log("✅ Módulo con-tabla.js inicializado correctamente");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConTabla);
} else {
    window.initConTabla();
}
