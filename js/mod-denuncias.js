window.initModDenuncias = function() {
    console.log("⚙️ Iniciando módulo mod-denuncias.js...");
    if (window._modDenunciasInitialized) return;
    window._modDenunciasInitialized = true;

    // 🔹 FUNCIÓN AUXILIAR PARA LOGS
    async function logModDenuncias(accion, detalles, registroId = null) {
        if (typeof window.registrarLog !== 'function') {
            console.warn('⚠️ utils.js no disponible para registrar log');
            return;
        }
        try {
            await window.registrarLog(accion, 'MOD_DENUNCIAS', detalles, registroId);
        } catch (e) {
            console.warn('⚠️ Error registrando log:', e);
        }
    }

    const docsUnicos = [
        { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
        { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
        { id: 'medida_proteccion', label: '🛡️ Medida de Protección' }
    ];
    const docsMultiples = [
        { id: 'acta_entrevista', label: '🎤 Acta de Entrevista', max: 10 },
        { id: 'datos_filiatorios', label: '👤 Datos Filiatorios', max: 10 },
        { id: 'evidencias', label: '🔍 Evidencias', max: 10 },
        { id: 'solicitud_senamecf', label: '🏥 Solicitud SENAMECF', max: 10 }
    ];
    const modEstadoDocs = { unicos: {}, multiples: {} };

    function inicializarContenedores() {
        const contUnicos = document.getElementById('mod_docs_unicos_container');
        const contMultiples = document.getElementById('mod_docs_multiples_container');
        if (contUnicos) contUnicos.innerHTML = '';
        if (contMultiples) contMultiples.innerHTML = '';

        docsUnicos.forEach(doc => {
            modEstadoDocs.unicos[doc.id] = { urlOriginal: null, toDelete: false, newFile: null };
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label}</label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="mod_doc_${doc.id}" value="no" checked onchange="window.mod_toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="mod_doc_${doc.id}" value="si" onchange="window.mod_toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="mod_upload_${doc.id}">
                    <div id="mod_status_${doc.id}"></div>
                    <input type="file" id="mod_file_${doc.id}" accept=".pdf,application/pdf" onchange="window.mod_cargarDocUnico('${doc.id}', this)" style="margin-top: 8px;">
                </div>
            `;
            if (contUnicos) contUnicos.appendChild(div);
        });

        docsMultiples.forEach(doc => {
            modEstadoDocs.multiples[doc.id] = { urlsOriginales: [], indicesToDelete: [], newFiles: [] };
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Máximo ${doc.max})</span></label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="mod_doc_${doc.id}" value="no" checked onchange="window.mod_toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="mod_doc_${doc.id}" value="si" onchange="window.mod_toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="mod_upload_${doc.id}">
                    <div id="mod_list_${doc.id}" style="margin-bottom: 8px;"></div>
                    <input type="file" id="mod_file_${doc.id}" accept=".pdf,application/pdf" multiple style="margin-bottom: 8px;">
                    <button type="button" class="btn-add-file" onclick="window.mod_agregarMultiples('${doc.id}', ${doc.max})">➕ Agregar archivos</button>
                    <div class="file-count" id="mod_count_${doc.id}">0 archivos</div>
                </div>
            `;
            if (contMultiples) contMultiples.appendChild(div);
        });
    }

    // ==========================================
    // FUNCIONES GLOBALES DE UI (Documentos)
    // ==========================================
    window.mod_toggleDocField = function(campo, mostrar) {
        const area = document.getElementById(`mod_upload_${campo}`);
        if (area) area.style.display = mostrar ? 'block' : 'none';
    };

    window.mod_cargarDocUnico = function(docId, input) {
        if (input.files && input.files[0]) {
            modEstadoDocs.unicos[docId].newFile = input.files[0];
            modEstadoDocs.unicos[docId].toDelete = false;
            const statusDiv = document.getElementById(`mod_status_${docId}`);
            statusDiv.innerHTML = `<div class="file-loaded" style="background: #dcfce7; border-color: #86efac; color: #15803d;"><span>🔄 Nuevo:</span><span class="file-name">${input.files[0].name}</span></div>`;
        }
    };

    window.mod_quitarDocUnico = function(docId) {
        modEstadoDocs.unicos[docId].toDelete = true;
        modEstadoDocs.unicos[docId].newFile = null;
        const statusDiv = document.getElementById(`mod_status_${docId}`);
        statusDiv.innerHTML = `<div class="file-loaded" style="background: #fde2e2; border-color: #fca5a5; color: #b91c1c;"><span>❌ Marcado para eliminar</span></div>`;
        const fileInput = document.getElementById(`mod_file_${docId}`);
        if (fileInput) fileInput.value = '';
    };

    window.mod_agregarMultiples = function(docId, max) {
        const input = document.getElementById(`mod_file_${docId}`);
        if (!input || !input.files || input.files.length === 0) return;
        const estado = modEstadoDocs.multiples[docId];
        const totalActual = estado.urlsOriginales.length - estado.indicesToDelete.length + estado.newFiles.length;
        const disponibles = max - totalActual;
        if (disponibles <= 0) { alert(`Máximo ${max} archivos permitidos`); return; }
        let agregados = 0;
        for (const file of input.files) {
            if (agregados >= disponibles) break;
            if (file.type === 'application/pdf') { estado.newFiles.push(file); agregados++; }
        }
        window.mod_actualizarListaMultiples(docId, max);
        input.value = '';
    };

    window.mod_quitarMultipleExistente = function(docId, indexOriginal) {
        modEstadoDocs.multiples[docId].indicesToDelete.push(indexOriginal);
        window.mod_actualizarListaMultiples(docId, docsMultiples.find(d => d.id === docId).max);
    };

    window.mod_quitarMultipleNuevo = function(docId, indexNuevo) {
        modEstadoDocs.multiples[docId].newFiles.splice(indexNuevo, 1);
        window.mod_actualizarListaMultiples(docId, docsMultiples.find(d => d.id === docId).max);
    };

    window.mod_actualizarListaMultiples = function(docId, max) {
        const listDiv = document.getElementById(`mod_list_${docId}`);
        const countDiv = document.getElementById(`mod_count_${docId}`);
        if (!listDiv || !countDiv) return;
        const estado = modEstadoDocs.multiples[docId];
        listDiv.innerHTML = '';
        let contador = 0;
        estado.urlsOriginales.forEach((url, idx) => {
            if (!estado.indicesToDelete.includes(idx)) {
                contador++;
                const nombre = url.split('/').pop() || 'Archivo';
                const item = document.createElement('div');
                item.className = 'file-item-multiple';
                item.innerHTML = `<span>📄 ${nombre} (Actual)</span><button type="button" onclick="window.mod_quitarMultipleExistente('${docId}', ${idx})">❌ Quitar</button>`;
                listDiv.appendChild(item);
            }
        });
        estado.newFiles.forEach((file, idx) => {
            contador++;
            const item = document.createElement('div');
            item.className = 'file-item-multiple';
            item.style.background = '#dcfce7'; item.style.borderColor = '#86efac';
            item.innerHTML = `<span>🆕 ${file.name} (Nuevo)</span><button type="button" onclick="window.mod_quitarMultipleNuevo('${docId}', ${idx})">❌ Quitar</button>`;
            listDiv.appendChild(item);
        });
        countDiv.textContent = `${contador} de ${max} archivos`;
    };

    // ==========================================
    // 🔹 DROPDOWN DE TELÉFONO CON BUSCADOR
    // ==========================================
    const nativeSelect = document.getElementById('mod_tlf_pais');
    const displayBox = document.querySelector('.phone-display');
    const optionsBox = document.querySelector('.phone-options');
    const flagImg = document.getElementById('mod-tlf-flag-img');
    const codeText = document.getElementById('mod-tlf-code-text');
    const countryText = document.getElementById('mod-tlf-country-text');

    const isoMap = {
        "Venezuela":"ve","Colombia":"co","Estados Unidos":"us","España":"es","Argentina":"ar","Chile":"cl","Perú":"pe","México":"mx",
        "Afganistán":"af","Albania":"al","Alemania":"de","Andorra":"ad","Angola":"ao","Antigua y Barbuda":"ag","Arabia Saudita":"sa","Argelia":"dz","Armenia":"am","Australia":"au","Austria":"at","Azerbaiyán":"az","Bahamas":"bs","Baréin":"bh","Bangladés":"bd","Barbados":"bb","Bélgica":"be","Belice":"bz","Benín":"bj","Bielorrusia":"by","Birmania":"mm","Bolivia":"bo","Bosnia y Herzegovina":"ba","Botsuana":"bw","Brasil":"br","Brunéi":"bn","Bulgaria":"bg","Burkina Faso":"bf","Burundi":"bi","Bután":"bt","Cabo Verde":"cv","Camboya":"kh","Camerún":"cm","Canadá":"ca","Catar":"qa","Rep. Centroafricana":"cf","Chad":"td","Rep. Checa":"cz","China":"cn","Chipre":"cy","Comoras":"km","Corea del Norte":"kp","Corea del Sur":"kr","Costa de Marfil":"ci","Costa Rica":"cr","Croacia":"hr","Cuba":"cu","Dinamarca":"dk","Dominica":"dm","Ecuador":"ec","Egipto":"eg","El Salvador":"sv","Emiratos Árabes":"ae","Eritrea":"er","Eslovaquia":"sk","Eslovenia":"si","Estonia":"ee","Etiopía":"et","Filipinas":"ph","Finlandia":"fi","Fiyi":"fj","Francia":"fr","Gabón":"ga","Gambia":"gm","Georgia":"ge","Ghana":"gh","Granada":"gd","Grecia":"gr","Guatemala":"gt","Guinea":"gn","Guinea Ecuatorial":"gq","Guinea-Bisáu":"gw","Guyana":"gy","Haití":"ht","Honduras":"hn","Hungría":"hu","India":"in","Indonesia":"id","Irak":"iq","Irán":"ir","Irlanda":"ie","Islandia":"is","Israel":"il","Italia":"it","Jamaica":"jm","Japón":"jp","Jordania":"jo","Kazajistán":"kz","Kenia":"ke","Kirguistán":"kg","Kiribati":"ki","Kuwait":"kw","Laos":"la","Lesoto":"ls","Letonia":"lv","Líbano":"lb","Liberia":"lr","Libia":"ly","Liechtenstein":"li","Lituania":"lt","Luxemburgo":"lu","Macedonia del Norte":"mk","Madagascar":"mg","Malasia":"my","Malaui":"mw","Maldivas":"mv","Malí":"ml","Malta":"mt","Marruecos":"ma","Mauricio":"mu","Mauritania":"mr","Micronesia":"fm","Moldavia":"md","Mónaco":"mc","Mongolia":"mn","Montenegro":"me","Mozambique":"mz","Namibia":"na","Nauru":"nr","Nepal":"np","Nicaragua":"ni","Níger":"ne","Nigeria":"ng","Nueva Zelanda":"nz","Noruega":"no","Omán":"om","Países Bajos":"nl","Pakistán":"pk","Palaos":"pw","Palestina":"ps","Panamá":"pa","Papúa Nueva Guinea":"pg","Paraguay":"py","Polonia":"pl","Portugal":"pt","Reino Unido":"gb","Puerto Rico":"pr","Ruanda":"rw","Rumania":"ro","Rusia":"ru","Samoa":"ws","San Marino":"sm","Santa Lucía":"lc","Santo Tomé y Príncipe":"st","San Vicente y las Granadinas":"vc","Senegal":"sn","Serbia":"rs","Seychelles":"sc","Sierra Leona":"sl","Singapur":"sg","Siria":"sy","Somalia":"so","Sudáfrica":"za","Sudán":"sd","Sudán del Sur":"ss","Suecia":"se","Suiza":"ch","Surinam":"sr","Esuatini":"sz","Tayikistán":"tj","Tanzania":"tz","Tailandia":"th","Timor Oriental":"tl","Togo":"tg","Tonga":"to","Trinidad y Tobago":"tt","Túnez":"tn","Turquía":"tr","Turkmenistán":"tm","Tuvalu":"tv","Ucrania":"ua","Uganda":"ug","Uruguay":"uy","Uzbekistán":"uz","Vanuatu":"vu","Vaticano":"va","Vietnam":"vn","Yemen":"ye","Yibuti":"dj","Zambia":"zm","Zimbabue":"zw"
    };

    if (nativeSelect && displayBox && optionsBox) {
        optionsBox.innerHTML = '';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'phone-search-input';
        searchInput.placeholder = '🔍 Buscar país o código...';
        searchInput.addEventListener('click', (e) => e.stopPropagation());
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            optionsBox.querySelectorAll('.phone-option').forEach(opt => {
                opt.style.display = opt.textContent.toLowerCase().includes(term) ? 'flex' : 'none';
            });
        });
        optionsBox.appendChild(searchInput);

        Array.from(nativeSelect.options).forEach(opt => {
            if (!opt.value) return;
            const iso = isoMap[opt.text] || opt.value.replace('+','').toLowerCase();
            const div = document.createElement('div');
            div.className = 'phone-option';
            div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country" style="color:#475569;font-size:0.8rem;">${opt.text}</span>`;
            div.addEventListener('click', () => {
                nativeSelect.value = opt.value;
                flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                codeText.textContent = opt.value;
                countryText.textContent = opt.text;
                optionsBox.style.display = 'none';
                searchInput.value = '';
            });
            optionsBox.appendChild(div);
        });

        displayBox.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsBox.style.display = optionsBox.style.display === 'block' ? 'none' : 'block';
            if (optionsBox.style.display === 'block') searchInput.focus();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.phone-dropdown-wrapper')) optionsBox.style.display = 'none';
        });
    }

    // ==========================================
    // LÓGICA DE BÚSQUEDA (CON LISTA DE DENUNCIAS)
    // ==========================================
    const cedulaInput = document.getElementById('mod_buscar_cedula');
    const btnBuscar = document.getElementById('mod_btn_buscar');

    if (cedulaInput && btnBuscar) {
        cedulaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar.click();
            }
        });
    }

btnBuscar?.addEventListener('click', async () => {
    const cedulaInputValue = cedulaInput?.value.trim().toUpperCase().replace(/\s/g, '') || '';
    const msgBusqueda = document.getElementById('mod_msg_busqueda');
    const formContainer = document.getElementById('mod_form_container');
    const listaContainer = document.getElementById('mod_denuncias_lista');
    
    // ✅ VALIDACIÓN MEJORADA - Acepta con o sin prefijo V- o E-
    const cedulaRegex = /^([VE]-)?\d{6,9}$/;
    
    if (!cedulaInputValue) {
        if (msgBusqueda) { msgBusqueda.textContent = '⚠️ El campo de cédula no puede estar vacío.'; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
        return;
    }
    if (!cedulaRegex.test(cedulaInputValue)) {
        if (msgBusqueda) { msgBusqueda.textContent = '⚠️ Formato incorrecto. Use: V-12345678, E-12345678, o solo 12345678'; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
        return;
    }
    
    // ✅ NORMALIZAR: Extraer solo los números para la búsqueda
    const cedulaNumeros = cedulaInputValue.replace(/^[VE]-/, '');
    
    console.log('🔍 Buscando cédula:', cedulaInputValue, '→ Números:', cedulaNumeros);
    if (!cedulaRegex.test(cedulaRaw)) {
        if (msgBusqueda) { msgBusqueda.textContent = '⚠️ Formato incorrecto. Use: V-12345678 o E-12345678 (6-8 dígitos)'; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
        console.error('❌ Cédula no válida:', cedulaRaw);
        return;
    }

    if (msgBusqueda) { msgBusqueda.textContent = '⏳ Buscando...'; msgBusqueda.className = 'msg'; msgBusqueda.style.display = 'block'; }
    if (formContainer) formContainer.style.display = 'none';
    if (listaContainer) listaContainer.style.display = 'none';

  try {
    // ✅ BUSCAR TANTO CON COMO SIN PREFIJO
    const { data, error } = await window.supabaseClient
        .from('denuncias')
        .select('*')
        .or(`cedula.eq.${cedulaNumeros},cedula.eq.V-${cedulaNumeros},cedula.eq.E-${cedulaNumeros}`)
        .order('created_at', { ascending: false });
    
    console.log('📊 Resultado:', { encontrados: data ? data.length : 0, error });
            cedula_buscada: cedulaRaw, 
            encontrados: data ? data.length : 0, 
            error: error 
        });

        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw error;
        }

        // ✅ LOG DE BÚSQUEDA
        if (typeof window.registrarLog === 'function') {
            await window.registrarLog('BUSCAR', 'MOD_DENUNCIAS', {
                cedula_buscada: cedulaRaw,
                resultados_encontrados: data ? data.length : 0
            });
        }

        if (!data || data.length === 0) {
            if (msgBusqueda) { 
                msgBusqueda.textContent = `❌ No se encontró ninguna denuncia con cédula ${cedulaRaw}. Verifique que la cédula esté bien escrita.`; 
                msgBusqueda.className = 'msg error'; 
                msgBusqueda.style.display = 'block'; 
            }
            console.warn('⚠️ No se encontraron resultados para:', cedulaRaw);
            return;
        }

        // Mostrar lista de denuncias
        if (msgBusqueda) { msgBusqueda.textContent = `✅ Se encontraron ${data.length} denuncia(s). Seleccione una para editar.`; msgBusqueda.className = 'msg success'; msgBusqueda.style.display = 'block'; }
        
        if (listaContainer) {
            listaContainer.innerHTML = `<div class="denuncias-lista-header">📋 Denuncias encontradas (${data.length})</div>`;
            data.forEach((denuncia, index) => {
                const fecha = new Date(denuncia.created_at).toLocaleString('es-VE', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });
                const item = document.createElement('div');
                item.className = 'denuncia-item';
                item.innerHTML = `
                    <div class="denuncia-item-info">
                        <div class="denuncia-item-numero">${denuncia.numero_denuncia || 'N/A'}</div>
                        <div class="denuncia-item-detalles">
                            <strong>Estación:</strong> ${denuncia.estacion_policial || 'N/A'} |
                            <strong>Motivo:</strong> ${denuncia.motivo_denuncia ? denuncia.motivo_denuncia.substring(0, 80) + (denuncia.motivo_denuncia.length > 80 ? '...' : '') : 'N/A'}
                        </div>
                    </div>
                    <div class="denuncia-item-fecha">${fecha}</div>
                    <button type="button" class="denuncia-item-btn" data-index="${index}">✏️ Editar</button>
                `;
                item.querySelector('.denuncia-item-btn').addEventListener('click', () => {
                    cargarDenunciaEnFormulario(denuncia);
                });
                listaContainer.appendChild(item);
            });
            listaContainer.style.display = 'block';
        }
    } catch (err) {
        console.error('❌ Error en búsqueda:', err);
        if (msgBusqueda) { msgBusqueda.textContent = '❌ Error al buscar: ' + err.message; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
        
        // ✅ LOG DE ERROR
        if (typeof window.registrarLog === 'function') {
            await window.registrarLog('ERROR', 'MOD_DENUNCIAS', {
                accion: 'BUSCAR',
                error: err.message,
                cedula_buscada: cedulaRaw
            });
        }
    }
});
    // ==========================================
    // CARGAR DENUNCIA SELECCIONADA EN EL FORMULARIO
    // ==========================================
    async function cargarDenunciaEnFormulario(data) {
        const formContainer = document.getElementById('mod_form_container');
        const listaContainer = document.getElementById('mod_denuncias_lista');
        const msgBusqueda = document.getElementById('mod_msg_busqueda');

        // Cargar datos básicos
        document.getElementById('mod_denuncia_id').value = data.id;
        document.getElementById('mod_numero_denuncia').value = data.numero_denuncia || 'N/A';
        document.getElementById('mod_fecha_hora').value = data.fecha_hora || '';
        document.getElementById('mod_cedula').value = data.cedula;
        document.getElementById('mod_estacion').value = data.estacion_policial || '';
        document.getElementById('mod_nombre1').value = data.primer_nombre || '';
        document.getElementById('mod_nombre2').value = data.segundo_nombre || '';
        document.getElementById('mod_apellido1').value = data.primer_apellido || '';
        document.getElementById('mod_apellido2').value = data.segundo_apellido || '';
        document.getElementById('mod_tlf_pais').value = data.tlf_pais || '+58';
        document.getElementById('mod_tlf_num').value = data.tlf_numero || '';
        document.getElementById('mod_direccion').value = data.direccion || '';
        document.getElementById('mod_motivo').value = data.motivo_denuncia || '';
        document.getElementById('mod_observaciones').value = data.observaciones || '';

        // Actualizar visualización del teléfono
        if (data.tlf_pais) {
            const opt = Array.from(nativeSelect.options).find(o => o.value === data.tlf_pais);
            if (opt) {
                const iso = isoMap[opt.text] || data.tlf_pais.replace('+','').toLowerCase();
                flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                codeText.textContent = data.tlf_pais;
                countryText.textContent = opt.text;
            }
        }

        inicializarContenedores();

        // Cargar documentos únicos
        docsUnicos.forEach(doc => {
            const url = data[doc.id];
            if (url) {
                modEstadoDocs.unicos[doc.id].urlOriginal = url;
                const statusDiv = document.getElementById(`mod_status_${doc.id}`);
                const nombre = url.split('/').pop() || 'Archivo';
                statusDiv.innerHTML = `<div class="file-loaded"><span>📄 Actual:</span><span class="file-name">${nombre}</span><button type="button" class="btn-remove" onclick="window.mod_quitarDocUnico('${doc.id}')">❌ Quitar</button></div>`;
                const radioSi = document.querySelector(`input[name="mod_doc_${doc.id}"][value="si"]`);
                if (radioSi) { radioSi.checked = true; window.mod_toggleDocField(doc.id, true); }
            }
        });

        // Cargar documentos múltiples
        docsMultiples.forEach(doc => {
            const urls = data[doc.id];
            if (Array.isArray(urls) && urls.length > 0) {
                modEstadoDocs.multiples[doc.id].urlsOriginales = urls;
                const radioSi = document.querySelector(`input[name="mod_doc_${doc.id}"][value="si"]`);
                if (radioSi) { radioSi.checked = true; window.mod_toggleDocField(doc.id, true); }
                window.mod_actualizarListaMultiples(doc.id, doc.max);
            }
        });

        if (msgBusqueda) { msgBusqueda.textContent = `✅ Editando denuncia ${data.numero_denuncia}`; msgBusqueda.className = 'msg success'; msgBusqueda.style.display = 'block'; }
        if (listaContainer) listaContainer.style.display = 'none';
        if (formContainer) formContainer.style.display = 'block';

        // ✅ LOG DE CARGA DE DENUNCIA
        await logModDenuncias('CARGAR', {
            numero_denuncia: data.numero_denuncia,
            denuncia_id: data.id,
            cedula: data.cedula
        }, data.id);
    }

    // ==========================================
    // ENVÍO DEL FORMULARIO DE EDICIÓN
    // ==========================================
    document.getElementById('form-mod-denuncias')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const btn = form.querySelector('.btn-submit');
        const msg = document.getElementById('mod_msg_form');
        const loading = document.getElementById('mod_loading_overlay');
        const denunciaId = document.getElementById('mod_denuncia_id').value;

        btn.disabled = true; btn.textContent = '⏳ Guardando cambios...';
        if (msg) msg.style.display = 'none';
        loading.classList.add('active');

        try {
            const bucket = window.supabaseClient.storage.from('denuncias_documentos');
            const updateData = {};

            // Procesar documentos únicos
            for (const doc of docsUnicos) {
                const radio = document.querySelector(`input[name="mod_doc_${doc.id}"]:checked`);
                const estado = modEstadoDocs.unicos[doc.id];
                if (radio && radio.value === 'si') {
                    if (estado.newFile) {
                        const ts = Date.now(); const path = `mod_${ts}_${doc.id}.pdf`;
                        const { error: uploadError } = await bucket.upload(path, estado.newFile, { contentType: 'application/pdf' });
                        if (uploadError) throw new Error(`Error subiendo ${doc.label}: ${uploadError.message}`);
                        updateData[doc.id] = bucket.getPublicUrl(path).data.publicUrl;
                        if (estado.urlOriginal) { const oldPath = estado.urlOriginal.split('/denuncias_documentos/')[1]; if (oldPath) await bucket.remove([oldPath]).catch(() => {}); }
                    } else if (estado.toDelete) {
                        updateData[doc.id] = null;
                        if (estado.urlOriginal) { const oldPath = estado.urlOriginal.split('/denuncias_documentos/')[1]; if (oldPath) await bucket.remove([oldPath]).catch(() => {}); }
                    } else { updateData[doc.id] = estado.urlOriginal; }
                } else { updateData[doc.id] = null; }
            }

            // Procesar documentos múltiples
            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="mod_doc_${doc.id}"]:checked`);
                const estado = modEstadoDocs.multiples[doc.id];
                if (radio && radio.value === 'si') {
                    const urlsFinales = [];
                    estado.urlsOriginales.forEach((url, idx) => {
                        if (!estado.indicesToDelete.includes(idx)) urlsFinales.push(url);
                        else { const oldPath = url.split('/denuncias_documentos/')[1]; if (oldPath) bucket.remove([oldPath]).catch(() => {}); }
                    });
                    for (const file of estado.newFiles) {
                        const ts = Date.now() + Math.random(); const path = `mod_${ts}_${doc.id}.pdf`;
                        const { error: uploadError } = await bucket.upload(path, file, { contentType: 'application/pdf' });
                        if (uploadError) throw new Error(`Error subiendo ${doc.label}: ${uploadError.message}`);
                        urlsFinales.push(bucket.getPublicUrl(path).data.publicUrl);
                    }
                    updateData[doc.id] = urlsFinales.length > 0 ? urlsFinales : null;
                } else {
                    updateData[doc.id] = null;
                    estado.urlsOriginales.forEach(url => { const oldPath = url.split('/denuncias_documentos/')[1]; if (oldPath) bucket.remove([oldPath]).catch(() => {}); });
                }
            }

            // Campos a actualizar
            updateData.estacion_policial = document.getElementById('mod_estacion').value;
            updateData.primer_nombre = document.getElementById('mod_nombre1').value.trim();
            updateData.segundo_nombre = document.getElementById('mod_nombre2').value.trim() || null;
            updateData.primer_apellido = document.getElementById('mod_apellido1').value.trim();
            updateData.segundo_apellido = document.getElementById('mod_apellido2').value.trim() || null;
            updateData.tlf_pais = document.getElementById('mod_tlf_pais').value || null;
            updateData.tlf_numero = document.getElementById('mod_tlf_num').value.trim().replace(/\D/g, '') || null;
            updateData.direccion = document.getElementById('mod_direccion').value.trim() || null;
            updateData.motivo_denuncia = document.getElementById('mod_motivo').value.trim() || null;
            updateData.observaciones = document.getElementById('mod_observaciones').value.trim() || null;

            const { error: dbError } = await window.supabaseClient.from('denuncias').update(updateData).eq('id', denunciaId);
            if (dbError) throw dbError;

            if (msg) { msg.textContent = '✅ Denuncia actualizada exitosamente.'; msg.className = 'msg success'; msg.style.display = 'block'; }

            // ✅ LOG DE ACTUALIZACIÓN
            await logModDenuncias('ACTUALIZAR', {
                denuncia_id: denunciaId,
                campos_actualizados: Object.keys(updateData),
                estacion: updateData.estacion_policial
            }, denunciaId);

            setTimeout(() => {
                if (msg) msg.style.display = 'none';
                document.getElementById('mod_form_container').style.display = 'none';
                if (cedulaInput) cedulaInput.value = '';
            }, 3000);

        } catch (err) {
            console.error('Error al actualizar:', err);
            if (msg) { msg.textContent = '❌ ' + err.message; msg.className = 'msg error'; msg.style.display = 'block'; }
            
            // ✅ LOG DE ERROR EN ACTUALIZACIÓN
            await logModDenuncias('ERROR', {
                accion: 'ACTUALIZAR',
                error: err.message,
                denuncia_id: denunciaId
            });
        } finally {
            btn.disabled = false; btn.textContent = '💾 Guardar Cambios';
            loading.classList.remove('active');
        }
    });

    inicializarContenedores();
    
    // ✅ LOG DE INICIO DE MÓDULO
    logModDenuncias('INICIAR', {
        mensaje: 'Usuario abrió el módulo de modificación de denuncias'
    });
    
    console.log("✅ Módulo mod-denuncias.js inicializado correctamente");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initModDenuncias);
} else {
    window.initModDenuncias();
}
