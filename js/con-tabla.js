window.initConTabla = function() {
    console.log("⚙️ Iniciando módulo con-tabla.js...");

    // 🧹 LIMPIEZA PREVIA: Si ya existe una instancia, la cancelamos
    if (window._conTablaAbort) window._conTablaAbort.abort();
    if (window._conTablaTimer) clearTimeout(window._conTablaTimer);
    
    // 📦 ESTADO DEL MÓDULO
    let isLoading = false;
    let currentPage = 1;
    let currentData = [];
    const ITEMS_PER_PAGE = 15;
    const abortController = new AbortController();
    window._conTablaAbort = abortController;

    // 🔍 REFERENCIAS DOM (con protección contra nulos)
    const el = (id) => document.getElementById(id);
    const cedulaInput = el('con_buscar_cedula');
    const btnBuscar = el('con_btn_buscar');
    const btnUltimas = el('con_btn_ultimas');
    const checkIncluirEliminadas = el('con_incluir_eliminadas');
    const msg = el('con_msg');
    const tableContent = el('con_table_content');
    const tableTitle = el('con_table_title');
    const tableCount = el('con_table_count');
    const pagination = el('con_pagination');
    const modalOverlay = el('con_modal_overlay');
    const modalClose = el('con_modal_close');
    const fichaContent = el('con_ficha_content');
    const modalTitle = el('con_modal_title');
    const btnPrint = el('con_btn_print');
    const btnPdf = el('con_btn_pdf');

    // 🔒 SISTEMA DE BLOQUEO SEGURO
    function setLock(locked, loadingText = '⏳ Procesando...') {
        isLoading = locked;
        if (btnBuscar) { btnBuscar.disabled = locked; btnBuscar.textContent = locked ? '⏳ Buscando...' : '🔍 Buscar'; }
        if (btnUltimas) { btnUltimas.disabled = locked; btnUltimas.textContent = locked ? '⏳ Cargando...' : ' Últimas 15'; }
        if (cedulaInput) cedulaInput.disabled = locked;
        if (checkIncluirEliminadas) checkIncluirEliminadas.disabled = locked;
        
        if (msg) {
            msg.textContent = loadingText;
            msg.className = locked ? 'msg info' : 'msg success';
            msg.style.display = locked ? 'block' : 'none';
        }
        if (tableContent && locked) {
            tableContent.innerHTML = '<div class="con-loading">⏳ Cargando datos del servidor...</div>';
        }
    }

    function showMessage(text, type = 'info', autoHide = 3000) {
        if (!msg) return;
        msg.textContent = text;
        msg.className = `msg ${type}`;
        msg.style.display = 'block';
        if (autoHide && type === 'success') {
            window._conTablaTimer = setTimeout(() => { if (msg) msg.style.display = 'none'; }, autoHide);
        }
    }

    //  CONSULTA A SUPABASE CON CANCELACIÓN
    async function querySupabase(params) {
        // Cancelar petición anterior si existe
        if (window._conTablaAbort) window._conTablaAbort.abort();
        window._conTablaAbort = new AbortController();
        const signal = window._conTablaAbort.signal;

        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('TIMEOUT')), 12000)
            );

            const supabasePromise = (async () => {
                let results = [];
                
                // 1. Denuncias activas
                const { data: activas, error: errA } = await window.supabaseClient
                    .from('denuncias')
                    .select('*', { count: params.count })
                    .eq('cedula', params.cedula || undefined)
                    .order('created_at', { ascending: false })
                    .range(params.rangeStart, params.rangeEnd)
                    .abortSignal(signal);

                if (errA) throw errA;
                if (activas) results = activas.map(d => ({ ...d, estado: 'activa' }));

                // 2. Denuncias eliminadas (opcional)
                if (params.includeDeleted) {
                    const { data: elim, error: errE } = await window.supabaseClient
                        .from('denuncias_eliminadas')
                        .select('*')
                        .eq('cedula', params.cedula || undefined)
                        .order('fecha_eliminacion', { ascending: false })
                        .abortSignal(signal);
                    
                    if (!errE && elim) results = results.concat(elim.map(d => ({ ...d, estado: 'eliminada' })));
                }

                // Ordenar por fecha más reciente
                return results.sort((a, b) => 
                    new Date(b.created_at || b.fecha_hora_original) - new Date(a.created_at || a.fecha_hora_original)
                );
            })();

            // Esperar la primera que termine (supabase o timeout)
            return await Promise.race([supabasePromise, timeoutPromise]);

        } catch (err) {
            if (err.name === 'AbortError' || err.message === 'TIMEOUT') {
                throw new Error('CANCELLED');
            }
            throw err;
        }
    }

    //  LÓGICA PRINCIPAL DE BÚSQUEDA
    async function ejecutarConsulta(tipo) {
        if (isLoading) return; // 🔒 Debounce automático
        
        try {
            setLock(true);
            if (pagination) pagination.style.display = 'none';

            const cedulaRaw = cedulaInput?.value.trim().toUpperCase().replace(/\s/g, '') || '';
            const incluirEliminadas = checkIncluirEliminadas?.checked || false;

            if (tipo === 'cedula' && !/^[VE]-\d{6,9}$/.test(cedulaRaw)) {
                throw new Error('Formato inválido. Use V- o E- seguido de 6 a 9 dígitos.');
            }

            const data = await querySupabase({
                cedula: tipo === 'cedula' ? cedulaRaw : undefined,
                includeDeleted: incluirEliminadas,
                count: tipo === 'ultimas' ? 'exact' : undefined,
                rangeStart: 0,
                rangeEnd: ITEMS_PER_PAGE - 1
            });

            // Si la consulta fue cancelada por un clic más reciente, ignoramos resultado
            if (data === 'CANCELLED') return;

            currentData = data || [];
            currentPage = 1;

            // Actualizar UI de forma segura
            if (tableTitle) tableTitle.textContent = tipo === 'cedula' ? `🔍 Resultados: ${cedulaRaw}` : '📋 Últimas Denuncias Registradas';
            if (tableCount) tableCount.textContent = `Total: ${currentData.length} denuncia(s)`;
            
            renderTabla(currentData);
            if (currentData.length > ITEMS_PER_PAGE && pagination) {
                renderPaginacion(currentData.length);
            } else if (pagination) {
                pagination.style.display = 'none';
            }

            showMessage(`✅ ${currentData.length} denuncia(s) encontrada(s).`, 'success');

        } catch (err) {
            if (err.message === 'CANCELLED') return; // Ignorar si fue sobrescrita
            console.error('❌ Error en consulta:', err);
            showMessage('❌ ' + (err.message || 'Error de conexión'), 'error', 5000);
            if (tableContent) {
                tableContent.innerHTML = `
                    <div class="con-empty">
                        ❌ ${err.message || 'Error desconocido'}<br>
                        <button onclick="window.initConTabla()" style="margin-top:10px;padding:8px 16px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;font-weight:600;">🔄 Reintentar</button>
                    </div>
                `;
            }
        } finally {
            setLock(false); // 🔓 SIEMPRE liberar el bloqueo
        }
    }

    // 🎧 EVENT LISTENERS
    if (btnBuscar) btnBuscar.addEventListener('click', () => ejecutarConsulta('cedula'));
    if (btnUltimas) btnUltimas.addEventListener('click', () => ejecutarConsulta('ultimas'));
    if (cedulaInput) cedulaInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnBuscar?.click(); });
    if (modalClose) modalClose.addEventListener('click', () => modalOverlay?.classList.remove('active'));
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());
    if (btnPdf) btnPdf.addEventListener('click', exportarPDF);

    // 📊 RENDERIZADO DE TABLA
    function renderTabla(datos) {
        if (!tableContent) return;
        if (!datos || datos.length === 0) {
            tableContent.innerHTML = '<div class="con-empty">📭 Sin resultados para mostrar.</div>';
            return;
        }

        let html = `<table class="con-table"><thead><tr>
            <th>N° Denuncia</th><th>Cédula</th><th>Denunciante</th>
            <th>Estación</th><th>Fecha</th><th>Estado</th><th>Acción</th>
        </tr></thead><tbody>`;

        datos.forEach((d, i) => {
            const nombre = `${d.primer_nombre || ''} ${d.primer_apellido || ''}`.trim() || 'N/A';
            const fecha = new Date(d.created_at || d.fecha_hora_original).toLocaleString('es-VE', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
            const badge = d.estado === 'eliminada' ? '<span class="badge-eliminado">️ ELIMINADA</span>' : '<span class="badge-activo">✅ ACTIVA</span>';
            
            html += `<tr>
                <td class="numero-denuncia">${d.numero_denuncia || 'N/A'}</td>
                <td>${d.cedula || 'N/A'}</td>
                <td>${nombre}</td>
                <td>${d.estacion_policial || 'N/A'}</td>
                <td>${fecha}</td>
                <td>${badge}</td>
                <td><button class="con-btn-ver" data-idx="${i}">👁️ Ver Ficha</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        tableContent.innerHTML = html;

        // Re-adjuntar listeners de forma segura
        tableContent.querySelectorAll('.con-btn-ver').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const offset = (currentPage - 1) * ITEMS_PER_PAGE;
                if (currentData[offset + idx]) mostrarFicha(currentData[offset + idx]);
            });
        });
    }

    // 📄 PAGINACIÓN
    function renderPaginacion(total) {
        if (!pagination) return;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        let html = `<button ${currentPage===1?'disabled':''} data-p="${currentPage-1}">◀ Anterior</button>`;
        
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);

        if (start > 1) html += `<button data-p="1">1</button>`;
        if (start > 2) html += `<span class="con-pagination-info">...</span>`;
        for (let i = start; i <= end; i++) {
            html += `<button class="${i===currentPage?'active':''}" data-p="${i}">${i}</button>`;
        }
        if (end < totalPages - 1) html += `<span class="con-pagination-info">...</span>`;
        if (end < totalPages) html += `<button data-p="${totalPages}">${totalPages}</button>`;
        
        html += `<button ${currentPage===totalPages?'disabled':''} data-p="${currentPage+1}">Siguiente ▶</button>`;
        html += `<span class="con-pagination-info">Pág ${currentPage}/${totalPages}</span>`;
        
        pagination.innerHTML = html;
        pagination.style.display = 'flex';

        pagination.querySelectorAll('button[data-p]').forEach(b => {
            b.addEventListener('click', () => {
                const p = parseInt(b.dataset.p);
                if (p >= 1 && p <= totalPages && !isLoading) {
                    currentPage = p;
                    renderTabla(currentData.slice((p-1)*ITEMS_PER_PAGE, p*ITEMS_PER_PAGE));
                    renderPaginacion(total);
                    tableContent?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }

    // 🖼️ MODAL DE FICHA
    function mostrarFicha(d) {
        if (!fichaContent || !modalOverlay) return;
        const num = d.numero_denuncia || 'N/A';
        const fecha = new Date(d.created_at || d.fecha_hora_original).toLocaleString('es-VE');
        if (modalTitle) modalTitle.textContent = ` Ficha: ${num}`;

        let aviso = '';
        if (d.estado === 'eliminada') {
            const fElim = d.fecha_eliminacion ? new Date(d.fecha_eliminacion).toLocaleString('es-VE') : 'N/A';
            aviso = `<div class="ficha-eliminado-aviso"><strong>⚠️ ELIMINADA</strong><br>Fecha: ${fElim}<br>Por: ${d.email_eliminador||'N/A'}<br>Motivo: ${d.motivo_eliminacion||'No especificado'}</div>`;
        }

        // Documentos
        const generarListaDocs = (ids, labels) => {
            let html = '<ul class="ficha-docs-list">';
            let hay = false;
            ids.forEach((id, i) => {
                const val = d[id];
                if (Array.isArray(val)) {
                    val.forEach((url, j) => { hay=true; html+=`<li>✅ ${labels[i]} (${j+1}): <a href="${url}" target="_blank">Ver PDF</a></li>`; });
                } else if (val) { hay=true; html+=`<li>✅ ${labels[i]}: <a href="${val}" target="_blank">Ver PDF</a></li>`; }
            });
            return html + (hay ? '' : '<li style="color:#94a3b8">Sin documentos</li>') + '</ul>';
        };

        fichaContent.innerHTML = `
            ${aviso}
            <div class="ficha-header">
                <img src="./img/logo-cpnb.png" alt="CPNB" style="max-width:100px;margin-bottom:10px" onerror="this.style.display='none'">
                <h1>CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h1>
                <h2>FICHA DE DENUNCIA</h2>
                <div class="numero-grande">${num}</div>
            </div>
            <div class="ficha-section"><div class="ficha-section-title">📅 General</div>
                <div class="ficha-grid">
                    <div class="ficha-field"><div class="ficha-label">Fecha</div><div class="ficha-value">${fecha}</div></div>
                    <div class="ficha-field"><div class="ficha-label">Estación</div><div class="ficha-value">${d.estacion_policial||'N/A'}</div></div>
                    <div class="ficha-field full"><div class="ficha-label">Registrado por</div><div class="ficha-value">${d.email_registrante||'N/A'}</div></div>
                </div>
            </div>
            <div class="ficha-section"><div class="ficha-section-title">👤 Denunciante</div>
                <div class="ficha-grid">
                    <div class="ficha-field"><div class="ficha-label">Cédula</div><div class="ficha-value">${d.cedula||'N/A'}</div></div>
                    <div class="ficha-field"><div class="ficha-label">Teléfono</div><div class="ficha-value">${d.tlf_pais||''} ${d.tlf_numero||'N/A'}</div></div>
                    <div class="ficha-field"><div class="ficha-label">Nombres</div><div class="ficha-value">${d.primer_nombre||''} ${d.segundo_nombre||''}</div></div>
                    <div class="ficha-field"><div class="ficha-label">Apellidos</div><div class="ficha-value">${d.primer_apellido||''} ${d.segundo_apellido||''}</div></div>
                    <div class="ficha-field full"><div class="ficha-label">Dirección</div><div class="ficha-value">${d.direccion||'N/A'}</div></div>
                </div>
            </div>
            <div class="ficha-section"><div class="ficha-section-title">📌 Motivo</div><div class="ficha-field full"><div class="ficha-value" style="white-space:pre-wrap">${d.motivo_denuncia||'N/A'}</div></div></div>
            <div class="ficha-section"><div class="ficha-section-title">📝 Observaciones</div><div class="ficha-field full"><div class="ficha-value" style="white-space:pre-wrap">${d.observaciones||'Sin observaciones'}</div></div></div>
            <div class="ficha-section"><div class="ficha-section-title">📄 Docs Únicos</div>${generarListaDocs(['oficio_remision','acta_denuncia','medida_proteccion'],['Oficio','Acta','Medida'])}</div>
            <div class="ficha-section"><div class="ficha-section-title">📁 Docs Múltiples</div>${generarListaDocs(['acta_entrevista','datos_filiatorios','evidencias','solicitud_senamecf'],['Entrevista','Filiatorios','Evidencias','SENAMECF'])}</div>
        `;
        modalOverlay.classList.add('active');
    }

    //  EXPORTAR PDF
    async function exportarPDF() {
        if (!btnPdf || !fichaContent) return;
        btnPdf.disabled = true; btnPdf.textContent = '⏳ Generando...';
        try {
            if (!window.html2pdf) {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                document.head.appendChild(s);
                await new Promise(r => s.onload = r);
            }
            const num = (modalTitle?.textContent || 'denuncia').replace('📄 Ficha: ','').trim();
            await window.html2pdf().set({
                margin: 10, filename: `Denuncia_${num}.pdf`,
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
            }).from(fichaContent).save();
        } catch(e) { alert('❌ Error PDF: ' + e.message); }
        finally { btnPdf.disabled = false; btnPdf.textContent = '📥 Exportar PDF'; }
    }

    // 🚀 INICIALIZAR
    console.log("✅ Módulo listo. Ejecutando carga inicial...");
    ejecutarConsulta('ultimas');
};

// Auto-inicialización segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConTabla);
} else {
    window.initConTabla();
}
