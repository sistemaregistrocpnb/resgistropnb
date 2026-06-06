window.initConTabla = function() {
    console.log("⚙️ Iniciando módulo con-tabla.js...");

    if (window._conTablaInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
        return;
    }
    window._conTablaInitialized = true;

    const ITEMS_PER_PAGE = 15;
    let currentPage = 1;
    let currentData = [];
    
    // Sistema de versión: cada clic incrementa la versión
    // Solo la consulta con la versión más reciente puede actualizar la UI
    let currentVersion = 0;

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
        if (window.html2pdf) return true;

        return new Promise((resolve, reject) => {
            const cdns = [
                'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
                'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
            ];

            let intentos = 0;
            function intentarCargar() {
                if (intentos >= cdns.length) {
                    reject(new Error('No se pudo cargar html2pdf.'));
                    return;
                }
                const script = document.createElement('script');
                script.src = cdns[intentos];
                script.onload = () => {
                    if (window.html2pdf) resolve(true);
                    else { intentos++; intentarCargar(); }
                };
                script.onerror = () => { intentos++; intentarCargar(); };
                document.head.appendChild(script);
            }
            intentarCargar();
        });
    }

    // Función para mostrar mensaje
    function mostrarMensaje(texto, tipo) {
        if (msg) {
            msg.textContent = texto;
            msg.className = `msg ${tipo}`;
            msg.style.display = 'block';
            if (tipo === 'success') {
                setTimeout(() => {
                    if (msg.style.display === 'block') msg.style.display = 'none';
                }, 3000);
            }
        }
    }

    // Función para mostrar estado de carga
    function mostrarCargando(texto) {
        if (tableContent) {
            tableContent.innerHTML = `<div class="con-loading">${texto}</div>`;
        }
    }

    // Función para mostrar error con botón de reintentar
    function mostrarErrorConReintento(errorMsg) {
        if (tableContent) {
            tableContent.innerHTML = `
                <div class="con-empty">
                    ❌ ${errorMsg}<br>
                    <button id="btn-reintentar" style="margin-top: 15px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">🔄 Reintentar</button>
                </div>
            `;
            
            // Agregar event listener al botón de reintentar
            setTimeout(() => {
                const btnReintentar = document.getElementById('btn-reintentar');
                if (btnReintentar) {
                    btnReintentar.addEventListener('click', () => {
                        console.log("🔄 Botón reintentar clickeado");
                        cargarUltimas();
                    });
                }
            }, 100);
        }
    }

    if (cedulaInput) {
        cedulaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar?.click();
            }
        });
    }

    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => {
            console.log("🔍 Clic en buscar, versión:", currentVersion + 1);
            buscarPorCedula();
        });
    }
    
    if (btnUltimas) {
        btnUltimas.addEventListener('click', () => {
            console.log("📋 Clic en últimas, versión:", currentVersion + 1);
            cargarUltimas();
        });
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', () => cerrarModal());
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) cerrarModal();
        });
    }
    
    if (btnPrint) {
        btnPrint.addEventListener('click', () => window.print());
    }
    
    if (btnPdf) {
        btnPdf.addEventListener('click', () => exportarPDF());
    }

    async function cargarUltimas() {
        // Incrementar versión: esta consulta será la "válida"
        currentVersion++;
        const miVersion = currentVersion;
        console.log(`📋 Iniciando carga de últimas (versión ${miVersion})`);

        mostrarMensaje('⏳ Cargando últimas denuncias...', 'info');
        mostrarCargando('⏳ Cargando...');
        if (tableTitle) tableTitle.textContent = '📋 Últimas Denuncias Registradas';
        if (pagination) pagination.style.display = 'none';

        try {
            // Crear un timeout de 15 segundos
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: la consulta tardó más de 15 segundos')), 15000);
            });

            // Ejecutar la consulta real
            const consultaPromise = window.supabaseClient
                .from('denuncias')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(0, ITEMS_PER_PAGE - 1);

            // Esperar la primera que termine (consulta o timeout)
            const result = await Promise.race([consultaPromise, timeoutPromise]);

            // Verificar si esta versión sigue siendo la más reciente
            if (miVersion !== currentVersion) {
                console.log(`⚠️ Versión ${miVersion} obsoleta, ignorando resultado`);
                return;
            }

            if (result.error) {
                console.error("❌ Error de Supabase:", result.error);
                throw result.error;
            }

            const { data, count } = result;
            console.log("✅ Datos recibidos:", data?.length || 0, "registros");

            currentData = data || [];
            currentPage = 1;

            if (tableCount) tableCount.textContent = `Total: ${count || 0} denuncia(s)`;
            
            if (currentData.length === 0) {
                if (tableContent) tableContent.innerHTML = '<div class="con-empty">📭 No hay denuncias registradas aún.</div>';
                mostrarMensaje('No hay denuncias registradas.', 'error');
            } else {
                renderTabla(currentData);
                if (count > ITEMS_PER_PAGE && pagination) {
                    renderPaginacion(count);
                } else if (pagination) {
                    pagination.style.display = 'none';
                }
                mostrarMensaje(`✅ Mostrando ${currentData.length} denuncia(s).`, 'success');
            }

        } catch (err) {
            // Solo mostrar error si esta versión sigue siendo la más reciente
            if (miVersion === currentVersion) {
                console.error('❌ Error en cargarUltimas:', err);
                mostrarErrorConReintento(err.message || 'Error desconocido');
                mostrarMensaje('❌ ' + (err.message || 'Error desconocido'), 'error');
            }
        }
    }

    async function buscarPorCedula() {
        const cedulaRaw = cedulaInput?.value.trim().toUpperCase().replace(/\s/g, '') || '';
        const incluirEliminadas = checkIncluirEliminadas?.checked || false;
        const cedulaRegex = /^[VE]-\d{6,9}$/;

        if (!cedulaRaw) {
            mostrarMensaje('️ Ingrese una cédula para buscar.', 'error');
            return;
        }

        if (!cedulaRegex.test(cedulaRaw)) {
            mostrarMensaje('⚠️ Formato incorrecto. Use V- o E- seguido del número.', 'error');
            return;
        }

        // Incrementar versión
        currentVersion++;
        const miVersion = currentVersion;
        console.log(`🔍 Iniciando búsqueda de cédula ${cedulaRaw} (versión ${miVersion})`);

        mostrarMensaje('⏳ Buscando denuncias...', 'info');
        mostrarCargando('⏳ Buscando...');
        if (tableTitle) tableTitle.textContent = `🔍 Resultados para: ${cedulaRaw}`;
        if (pagination) pagination.style.display = 'none';

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: la búsqueda tardó más de 15 segundos')), 15000);
            });

            let todasLasDenuncias = [];

            // Buscar en denuncias activas
            const consultaActivas = window.supabaseClient
                .from('denuncias')
                .select('*')
                .eq('cedula', cedulaRaw)
                .order('created_at', { ascending: false });

            const resultActivas = await Promise.race([consultaActivas, timeoutPromise]);

            if (miVersion !== currentVersion) return;

            if (resultActivas.error) throw resultActivas.error;
            if (resultActivas.data) {
                todasLasDenuncias = todasLasDenuncias.concat(resultActivas.data.map(d => ({ ...d, estado: 'activa' })));
            }

            // Buscar en denuncias eliminadas si está marcado
            if (incluirEliminadas) {
                const consultaEliminadas = window.supabaseClient
                    .from('denuncias_eliminadas')
                    .select('*')
                    .eq('cedula', cedulaRaw)
                    .order('fecha_eliminacion', { ascending: false });

                const resultEliminadas = await Promise.race([consultaEliminadas, timeoutPromise]);

                if (miVersion !== currentVersion) return;

                if (resultEliminadas.error) {
                    console.warn('No se pudieron cargar las eliminadas:', resultEliminadas.error);
                } else if (resultEliminadas.data) {
                    todasLasDenuncias = todasLasDenuncias.concat(resultEliminadas.data.map(d => ({ ...d, estado: 'eliminada' })));
                }
            }

            // Ordenar por fecha
            todasLasDenuncias.sort((a, b) => {
                const fechaA = new Date(a.created_at || a.fecha_hora_original);
                const fechaB = new Date(b.created_at || b.fecha_hora_original);
                return fechaB - fechaA;
            });

            currentData = todasLasDenuncias;
            currentPage = 1;

            if (tableCount) tableCount.textContent = `Total: ${currentData.length} denuncia(s)`;

            if (currentData.length === 0) {
                if (tableContent) tableContent.innerHTML = '<div class="con-empty">📭 No se encontraron denuncias con esa cédula.</div>';
                mostrarMensaje('⚠️ No se encontraron denuncias.', 'error');
            } else {
                const inicio = 0;
                const fin = Math.min(ITEMS_PER_PAGE, currentData.length);
                renderTabla(currentData.slice(inicio, fin));

                if (currentData.length > ITEMS_PER_PAGE && pagination) {
                    renderPaginacion(currentData.length);
                } else if (pagination) {
                    pagination.style.display = 'none';
                }

                const countEliminadas = todasLasDenuncias.filter(d => d.estado === 'eliminada').length;
                let mensajeExito = `✅ Se encontraron ${currentData.length} denuncia(s).`;
                if (countEliminadas > 0) {
                    mensajeExito += ` (${countEliminadas} eliminada${countEliminadas > 1 ? 's' : ''})`;
                }
                mostrarMensaje(mensajeExito, 'success');
            }

        } catch (err) {
            if (miVersion === currentVersion) {
                console.error('❌ Error en buscarPorCedula:', err);
                mostrarErrorConReintento(err.message || 'Error desconocido');
                mostrarMensaje('❌ ' + (err.message || 'Error desconocido'), 'error');
            }
        }
    }

    function renderTabla(datos) {
        if (!datos || datos.length === 0) {
            if (tableContent) tableContent.innerHTML = '<div class="con-empty">📭 Sin resultados.</div>';
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
        if (tableContent) tableContent.innerHTML = html;

        // Re-adjuntar event listeners
        if (tableContent) {
            tableContent.querySelectorAll('.con-btn-ver').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
                    const denuncia = currentData[offset + index];
                    if (denuncia) mostrarFicha(denuncia);
                });
            });
        }
    }

    function renderPaginacion(totalItems) {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
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

        if (pagination) {
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
    }

    function cambiarPagina() {
        const inicio = (currentPage - 1) * ITEMS_PER_PAGE;
        const fin = Math.min(inicio + ITEMS_PER_PAGE, currentData.length);
        const datosPagina = currentData.slice(inicio, fin);
        renderTabla(datosPagina);
        if (currentData.length > ITEMS_PER_PAGE) {
            renderPaginacion(currentData.length);
        }
        if (tableContent) tableContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function mostrarFicha(denuncia) {
        const esEliminada = denuncia.estado === 'eliminada';
        const numero = denuncia.numero_denuncia || 'N/A';
        const fechaOriginal = denuncia.fecha_hora_original || denuncia.created_at;
        const fecha = fechaOriginal ? new Date(fechaOriginal).toLocaleString('es-VE') : 'N/A';

        if (modalTitle) modalTitle.textContent = `📄 Ficha: ${numero}`;

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
                docsUnicosHtml += `<li>✅ ${doc.label}: <a href="${url}" target="_blank">Ver PDF</a></li>`;
            }
        });
        if (!hayDocsUnicos) docsUnicosHtml += '<li style="color: #94a3b8;">Sin documentos</li>';
        docsUnicosHtml += '</ul>';

        let docsMultiplesHtml = '<ul class="ficha-docs-list">';
        let hayDocsMultiples = false;
        docsMultiples.forEach(doc => {
            const urls = denuncia[doc.id];
            if (Array.isArray(urls) && urls.length > 0) {
                hayDocsMultiples = true;
                urls.forEach((url, i) => {
                    docsMultiplesHtml += `<li>✅ ${doc.label} (${i + 1}): <a href="${url}" target="_blank">Ver PDF</a></li>`;
                });
            }
        });
        if (!hayDocsMultiples) docsMultiplesHtml += '<li style="color: #94a3b8;">Sin documentos</li>';
        docsMultiplesHtml += '</ul>';

        const logoUrl = './img/logo-cpnb.png';

        if (fichaContent) {
            fichaContent.innerHTML = `
                ${avisoEliminada}
                <div class="ficha-header">
                    <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                        <img src="${logoUrl}" alt="Logo CPNB" style="max-width: 120px; max-height: 120px; object-fit: contain;" onerror="this.style.display='none'">
                    </div>
                    <h1>CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h1>
                    <h2>FICHA DE DENUNCIA</h2>
                    <div class="numero-grande">${numero}</div>
                </div>
                <div class="ficha-section">
                    <div class="ficha-section-title">📅 Información General</div>
                    <div class="ficha-grid">
                        <div class="ficha-field"><div class="ficha-label">Fecha y Hora</div><div class="ficha-value">${fecha}</div></div>
                        <div class="ficha-field"><div class="ficha-label">Estación Policial</div><div class="ficha-value">${denuncia.estacion_policial || 'N/A'}</div></div>
                        <div class="ficha-field full"><div class="ficha-label">Registrado por</div><div class="ficha-value">${denuncia.email_registrante || 'N/A'}</div></div>
                    </div>
                </div>
                <div class="ficha-section">
                    <div class="ficha-section-title">👤 Datos del Denunciante</div>
                    <div class="ficha-grid">
                        <div class="ficha-field"><div class="ficha-label">Cédula</div><div class="ficha-value">${denuncia.cedula || 'N/A'}</div></div>
                        <div class="ficha-field"><div class="ficha-label">Teléfono</div><div class="ficha-value">${denuncia.tlf_pais || ''} ${denuncia.tlf_numero || 'N/A'}</div></div>
                        <div class="ficha-field"><div class="ficha-label">Primer Nombre</div><div class="ficha-value">${denuncia.primer_nombre || 'N/A'}</div></div>
                        <div class="ficha-field"><div class="ficha-label">Segundo Nombre</div><div class="ficha-value">${denuncia.segundo_nombre || 'N/A'}</div></div>
                        <div class="ficha-field"><div class="ficha-label">Primer Apellido</div><div class="ficha-value">${denuncia.primer_apellido || 'N/A'}</div></div>
                        <div class="ficha-field"><div class="ficha-label">Segundo Apellido</div><div class="ficha-value">${denuncia.segundo_apellido || 'N/A'}</div></div>
                        <div class="ficha-field full"><div class="ficha-label">Dirección</div><div class="ficha-value">${denuncia.direccion || 'N/A'}</div></div>
                    </div>
                </div>
                <div class="ficha-section">
                    <div class="ficha-section-title"> Motivo</div>
                    <div class="ficha-field full"><div class="ficha-value" style="white-space: pre-wrap;">${denuncia.motivo_denuncia || 'No especificado'}</div></div>
                </div>
                <div class="ficha-section">
                    <div class="ficha-section-title">📝 Observaciones</div>
                    <div class="ficha-field full"><div class="ficha-value" style="white-space: pre-wrap;">${denuncia.observaciones || 'Sin observaciones'}</div></div>
                </div>
                <div class="ficha-section">
                    <div class="ficha-section-title"> Documentos Únicos</div>
                    ${docsUnicosHtml}
                </div>
                <div class="ficha-section">
                    <div class="ficha-section-title">📁 Documentos Múltiples</div>
                    ${docsMultiplesHtml}
                </div>
            `;
        }

        if (modalOverlay) modalOverlay.classList.add('active');
    }

    function cerrarModal() {
        if (modalOverlay) modalOverlay.classList.remove('active');
    }

    async function exportarPDF() {
        const numero = modalTitle?.textContent.replace('📄 Ficha: ', '').trim() || 'denuncia';
        
        if (btnPdf) {
            btnPdf.disabled = true;
            btnPdf.textContent = '⏳ Generando...';
        }

        try {
            await cargarHtml2Pdf();
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Denuncia_${numero}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
            };
            await window.html2pdf().set(opt).from(fichaContent).save();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        } finally {
            if (btnPdf) {
                btnPdf.disabled = false;
                btnPdf.textContent = '📥 Exportar PDF';
            }
        }
    }

    // Inicializar cargando las últimas denuncias
    console.log("🚀 Llamando a cargarUltimas() por primera vez...");
    cargarUltimas();
    console.log("✅ Módulo con-tabla.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConTabla);
} else {
    window.initConTabla();
}
