window.initRegDenuncias = function() {
    console.log("⚙️ Iniciando módulo reg-denuncias.js...");
    
    function iniciarModulo(intentos = 0) {
        const form = document.getElementById('form-reg-denuncias');
        const btn = form?.querySelector('.btn-submit');
        const msg = document.getElementById('msg-reg-denuncias');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        // Elementos del teléfono
        const nativeSelect = document.getElementById('d_tlf_pais');
        const displayBox = document.querySelector('.phone-display');
        const optionsBox = document.querySelector('.phone-options');
        
        if (!form || !btn) {
            if (intentos < 10) {
                setTimeout(() => iniciarModulo(intentos + 1), 100);
                return;
            } else {
                console.error("❌ ERROR CRÍTICO: No se encontró el formulario.");
                return;
            }
        }
        console.log("✅ Formulario encontrado. Configurando módulo...");
        
        // Configurar fecha actual
        const fechaInput = document.getElementById('d_fecha_hora');
        if (fechaInput) {
            const ahora = new Date();
            fechaInput.value = ahora.toLocaleString('es-VE', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }

        // Función para calcular el próximo número de denuncia
        async function actualizarProximoNumero() {
            const inputNum = document.getElementById('d_numero_denuncia');
            if (!inputNum || !window.supabaseClient) return;
            inputNum.value = 'Calculando...';
            
            try {
                const { data: ultimaDenuncia } = await window.supabaseClient
                    .from('denuncias')
                    .select('numero_denuncia')
                    .order('numero_denuncia', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                let proximo = 'CPNB-00000001';
                if (ultimaDenuncia && ultimaDenuncia.numero_denuncia) {
                    const partes = ultimaDenuncia.numero_denuncia.split('-');
                    if (partes.length === 2) {
                        const num = parseInt(partes[1], 10) + 1;
                        proximo = `CPNB-${num.toString().padStart(8, '0')}`;
                    }
                }
                inputNum.value = proximo;
            } catch (e) {
                console.error("Error calculando número:", e);
                inputNum.value = 'Error';
            }
        }

        // Configuración de documentos
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
        
        const archivosUnicos = {};
        const archivosMultiples = {};
        docsUnicos.forEach(d => archivosUnicos[d.id] = null);
        docsMultiples.forEach(d => archivosMultiples[d.id] = []);
        
        // Limpiar contenedores antes de generar
        const contenedorUnicos = document.getElementById('docs-unicos-container');
        const contenedorMultiples = document.getElementById('docs-multiples-container');
        if (contenedorUnicos) contenedorUnicos.innerHTML = '';
        if (contenedorMultiples) contenedorMultiples.innerHTML = '';
        
        // Generar UI Documentos Únicos
        if (contenedorUnicos) {
            docsUnicos.forEach(doc => {
                const div = document.createElement('div');
                div.className = 'doc-item';
                div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label}</label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="doc_${doc.id}" value="no" checked onchange="toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="doc_${doc.id}" value="si" onchange="toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="upload-${doc.id}">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" onchange="cargarDocUnico('${doc.id}', this)">
                    <div id="status-${doc.id}"></div>
                </div>`;
                contenedorUnicos.appendChild(div);
            });
        }
        
        // Generar UI Documentos Múltiples
        if (contenedorMultiples) {
            docsMultiples.forEach(doc => {
                const div = document.createElement('div');
                div.className = 'doc-item';
                div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Máximo ${doc.max})</span></label>
                    <div class="doc-si-no">
                        <label><input type="radio" name="doc_${doc.id}" value="no" checked onchange="toggleDocField('${doc.id}', false)"><span>No</span></label>
                        <label><input type="radio" name="doc_${doc.id}" value="si" onchange="toggleDocField('${doc.id}', true)"><span>Sí</span></label>
                    </div>
                </div>
                <div class="doc-upload-area" id="upload-${doc.id}">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" multiple>
                    <button type="button" class="btn-add-file" onclick="agregarMultiples('${doc.id}', ${doc.max})">➕ Agregar archivos</button>
                    <div class="file-count" id="count-${doc.id}">0 archivos cargados</div>
                    <div id="list-${doc.id}" style="margin-top: 8px;"></div>
                </div>`;
                contenedorMultiples.appendChild(div);
            });
        }

        // ==========================================
        // FUNCIONES GLOBALES DE UI
        // ==========================================
        window.toggleDocField = function(campo, mostrar) {
            const area = document.getElementById(`upload-${campo}`);
            if (area) {
                if (mostrar) {
                    area.classList.add('active');
                } else {
                    area.classList.remove('active');
                    // Limpiar datos si se oculta
                    if (archivosUnicos[campo] !== undefined) {
                        archivosUnicos[campo] = null;
                        const status = document.getElementById(`status-${campo}`);
                        if (status) status.innerHTML = '';
                        const fileInput = document.getElementById(`file_${campo}`);
                        if (fileInput) fileInput.value = '';
                    }
                    if (archivosMultiples[campo] !== undefined) {
                        archivosMultiples[campo] = [];
                        const docMax = docsMultiples.find(d => d.id === campo)?.max || 10;
                        actualizarListaMultiples(campo, docMax);
                    }
                }
            }
        };

        window.cargarDocUnico = function(docId, input) {
            const statusDiv = document.getElementById(`status-${docId}`);
            if (input.files && input.files[0]) {
                const file = input.files[0];
                // Validación robusta de PDF
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    archivosUnicos[docId] = file;
                    statusDiv.innerHTML = `
                    <div class="file-loaded">
                        <span>✅</span>
                        <span class="file-name">${file.name}</span>
                        <button type="button" class="btn-remove" onclick="quitarDocUnico('${docId}')">❌ Quitar</button>
                    </div>`;
                } else {
                    alert('⚠️ Por favor, seleccione un archivo con extensión .PDF válido.');
                    input.value = '';
                }
            }
        };

        window.quitarDocUnico = function(docId) {
            archivosUnicos[docId] = null;
            const statusDiv = document.getElementById(`status-${docId}`);
            if (statusDiv) statusDiv.innerHTML = '';
            const fileInput = document.getElementById(`file_${docId}`);
            if (fileInput) fileInput.value = '';
        };

        window.agregarMultiples = function(docId, max) {
            const input = document.getElementById(`file_${docId}`);
            if (!input || !input.files || input.files.length === 0) return;
            
            const actuales = archivosMultiples[docId].length;
            const disponibles = max - actuales;
            
            if (disponibles <= 0) {
                alert(`⚠️ Ya has alcanzado el máximo de ${max} archivos permitidos.`);
                return;
            }
            
            let agregados = 0;
            for (const file of input.files) {
                if (agregados >= disponibles) {
                    alert(`⚠️ Se omitieron archivos excedentes. Máximo ${max} permitidos.`);
                    break;
                }
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    archivosMultiples[docId].push(file);
                    agregados++;
                } else {
                    alert(`⚠️ El archivo "${file.name}" no es un PDF válido y fue omitido.`);
                }
            }
            actualizarListaMultiples(docId, max);
            input.value = '';
        };

        function actualizarListaMultiples(docId, max) {
            const listDiv = document.getElementById(`list-${docId}`);
            const countDiv = document.getElementById(`count-${docId}`);
            if (!listDiv || !countDiv) return;
            
            listDiv.innerHTML = '';
            archivosMultiples[docId].forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-item-multiple';
                item.innerHTML = `
                <span>📄 ${file.name}</span>
                <div class="file-actions">
                    <button type="button" onclick="quitarMultiple('${docId}', ${index}, ${max})">❌</button>
                </div>`;
                listDiv.appendChild(item);
            });
            countDiv.textContent = `${archivosMultiples[docId].length} de ${max} archivos`;
        }

        window.quitarMultiple = function(docId, index, max) {
            archivosMultiples[docId].splice(index, 1);
            actualizarListaMultiples(docId, max);
        };

        // ==========================================
        // 🔹 DROPDOWN DE BANDERAS (COMPLETO Y CORREGIDO)
        // ==========================================
        const flagImg = document.getElementById('d-tlf-flag-img');
        const codeText = document.getElementById('d-tlf-code-text');
        const countryText = document.getElementById('d-tlf-country-text');
        
        // ✅ MAPEO COMPLETO DE TODOS LOS PAÍSES DEL HTML
        const isoMap = {
            "Afganistán":"af","Albania":"al","Alemania":"de","Andorra":"ad","Angola":"ao",
            "Antigua y Barbuda":"ag","Arabia Saudita":"sa","Argelia":"dz","Argentina":"ar",
            "Armenia":"am","Aruba":"aw","Australia":"au","Austria":"at","Azerbaiyán":"az",
            "Bahamas":"bs","Baréin":"bh","Bangladés":"bd","Barbados":"bb","Bélgica":"be",
            "Belice":"bz","Benín":"bj","Bermudas":"bm","Bielorrusia":"by","Birmania":"mm",
            "Bolivia":"bo","Bosnia y Herzegovina":"ba","Botsuana":"bw","Brasil":"br",
            "Brunéi":"bn","Bulgaria":"bg","Burkina Faso":"bf","Burundi":"bi","Bután":"bt",
            "Cabo Verde":"cv","Camboya":"kh","Camerún":"cm","Canadá":"ca","Catar":"qa",
            "Rep. Centroafricana":"cf","Chad":"td","Chile":"cl","China":"cn","Chipre":"cy",
            "Colombia":"co","Comoras":"km","Congo":"cg","Corea del Norte":"kp",
            "Corea del Sur":"kr","Costa de Marfil":"ci","Costa Rica":"cr","Croacia":"hr",
            "Cuba":"cu","Curazao":"cw","Dinamarca":"dk","Dominica":"dm","Ecuador":"ec",
            "Egipto":"eg","El Salvador":"sv","Emiratos Árabes":"ae","Eritrea":"er",
            "Eslovaquia":"sk","Eslovenia":"si","España":"es","Estados Unidos":"us",
            "Estonia":"ee","Etiopía":"et","Filipinas":"ph","Finlandia":"fi","Fiyi":"fj",
            "Francia":"fr","Gabón":"ga","Gambia":"gm","Georgia":"ge","Ghana":"gh",
            "Gibraltar":"gi","Granada":"gd","Grecia":"gr","Groenlandia":"gl",
            "Guadalupe":"gp","Guam":"gu","Guatemala":"gt","Guayana Francesa":"gf",
            "Guinea":"gn","Guinea Ecuatorial":"gq","Guinea-Bisáu":"gw","Guyana":"gy",
            "Haití":"ht","Honduras":"hn","Hong Kong":"hk","Hungría":"hu","India":"in",
            "Indonesia":"id","Irak":"iq","Irán":"ir","Irlanda":"ie","Isla de Man":"im",
            "Islas Feroe":"fo","Islas Salomón":"sb","Israel":"il","Italia":"it",
            "Jamaica":"jm","Japón":"jp","Jordania":"jo","Kazajistán":"kz","Kenia":"ke",
            "Kirguistán":"kg","Kiribati":"ki","Kuwait":"kw","Laos":"la","Letonia":"lv",
            "Líbano":"lb","Lesoto":"ls","Liberia":"lr","Libia":"ly","Liechtenstein":"li",
            "Lituania":"lt","Luxemburgo":"lu","Macao":"mo","Macedonia del Norte":"mk",
            "Madagascar":"mg","Malasia":"my","Malaui":"mw","Maldivas":"mv","Malí":"ml",
            "Malta":"mt","Marruecos":"ma","Martinica":"mq","Mauricio":"mu",
            "Mauritania":"mr","Mayotte":"yt","México":"mx","Micronesia":"fm",
            "Moldavia":"md","Mónaco":"mc","Mongolia":"mn","Montenegro":"me",
            "Montserrat":"ms","Mozambique":"mz","Namibia":"na","Nauru":"nr","Nepal":"np",
            "Nicaragua":"ni","Níger":"ne","Nigeria":"ng","Niue":"nu","Noruega":"no",
            "Nueva Caledonia":"nc","Nueva Zelanda":"nz","Omán":"om","Países Bajos":"nl",
            "Pakistán":"pk","Palaos":"pw","Palestina":"ps","Panamá":"pa",
            "Papúa Nueva Guinea":"pg","Paraguay":"py","Perú":"pe","Polinesia Francesa":"pf",
            "Polonia":"pl","Portugal":"pt","Reino Unido":"gb","Puerto Rico":"pr",
            "Rep. Checa":"cz","Reunión":"re","Ruanda":"rw","Rumania":"ro","Rusia":"ru",
            "Samoa":"ws","San Marino":"sm","Santa Lucía":"lc","Santo Tomé y Príncipe":"st",
            "San Vicente y las Granadinas":"vc","Senegal":"sn","Serbia":"rs",
            "Seychelles":"sc","Sierra Leona":"sl","Singapur":"sg","Siria":"sy",
            "Somalia":"so","Sudáfrica":"za","Sudán":"sd","Sudán del Sur":"ss",
            "Suecia":"se","Suiza":"ch","Surinam":"sr","Esuatini":"sz","Tayikistán":"tj",
            "Tanzania":"tz","Tailandia":"th","Timor Oriental":"tl","Togo":"tg",
            "Tonga":"to","Trinidad y Tobago":"tt","Túnez":"tn","Turquía":"tr",
            "Turkmenistán":"tm","Tuvalu":"tv","Ucrania":"ua","Uganda":"ug","Uruguay":"uy",
            "Uzbekistán":"uz","Vanuatu":"vu","Vaticano":"va","Venezuela":"ve",
            "Vietnam":"vn","Wallis y Futuna":"wf","Yemen":"ye","Yibuti":"dj",
            "Zambia":"zm","Zimbabue":"zw"
        };

        if (nativeSelect && displayBox && optionsBox) {
            console.log("✅ Generando dropdown de banderas...");
            optionsBox.innerHTML = '';
            let opcionesGeneradas = 0;
            
            Array.from(nativeSelect.options).forEach(opt => {
                if (!opt.value) return;
                
                // Buscar ISO en el mapa completo
                let iso = isoMap[opt.text] || 'xx';
                
                const div = document.createElement('div');
                div.className = 'phone-option';
                
                // ✅ onerror garantiza que NUNCA se vea un icono de imagen rota
                div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;" onerror="this.src='https://flagcdn.com/w20/xx.png'"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country" style="color:#475569;font-size:0.85rem;">${opt.text}</span>`;
                
                div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:0.15s;';
                div.onmouseenter = () => div.style.background = '#f8fafc';
                div.onmouseleave = () => div.style.background = '';
                
                div.addEventListener('click', () => {
                    nativeSelect.value = opt.value;
                    flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                    codeText.textContent = opt.value;
                    countryText.textContent = opt.text;
                    optionsBox.style.display = 'none';
                });
                optionsBox.appendChild(div);
                opcionesGeneradas++;
            });
            console.log(`✅ Lista generada con ${opcionesGeneradas} países/territorios.`);
            
            displayBox.addEventListener('click', (e) => {
                e.stopPropagation();
                optionsBox.style.display = optionsBox.style.display === 'block' ? 'none' : 'block';
            });
            
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.phone-dropdown-wrapper')) {
                    optionsBox.style.display = 'none';
                }
            });
        }

        // Cargar el próximo número al iniciar
        actualizarProximoNumero();

        // ==========================================
        // ENVÍO DEL FORMULARIO
        // ==========================================
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            if (!window.supabaseClient) {
                alert("❌ Error: Cliente de Supabase no inicializado.");
                return;
            }

            // Validar documentos únicos
            for (const doc of docsUnicos) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si' && !archivosUnicos[doc.id]) {
                    if (msg) { msg.textContent = `⚠️ Debe subir un PDF para: ${doc.label}`; msg.className = 'msg error'; msg.style.display = 'block'; }
                    return;
                }
            }
            // Validar documentos múltiples
            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si' && (!archivosMultiples[doc.id] || archivosMultiples[doc.id].length === 0)) {
                    if (msg) { msg.textContent = `⚠️ Debe subir al menos un PDF para: ${doc.label}`; msg.className = 'msg error'; msg.style.display = 'block'; }
                    return;
                }
            }

            btn.disabled = true;
            btn.textContent = '⏳ Registrando...';
            if (msg) msg.style.display = 'none';
            if (loadingOverlay) loadingOverlay.classList.add('active');

            try {
                const bucket = window.supabaseClient.storage.from('denuncias_documentos');
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (!user) throw new Error('Debe iniciar sesión para registrar una denuncia.');
                
                const uid = user.id;
                const ts = Date.now();
                
                // Recalcular número justo antes de guardar para evitar duplicados
                const { data: ultimaDenuncia } = await window.supabaseClient
                    .from('denuncias')
                    .select('numero_denuncia')
                    .order('numero_denuncia', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let nuevoNumeroDenuncia = 'CPNB-00000001';
                if (ultimaDenuncia && ultimaDenuncia.numero_denuncia) {
                    const partes = ultimaDenuncia.numero_denuncia.split('-');
                    if (partes.length === 2) {
                        const num = parseInt(partes[1], 10) + 1;
                        nuevoNumeroDenuncia = `CPNB-${num.toString().padStart(8, '0')}`;
                    }
                }

                // Subir documentos únicos
                const docsUnicosUrls = {};
                for (const doc of docsUnicos) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si' && archivosUnicos[doc.id]) {
                        const path = `${uid}/${ts}_${doc.id}.pdf`;
                        const { error } = await bucket.upload(path, archivosUnicos[doc.id], { contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${doc.label}: ${error.message}`);
                        docsUnicosUrls[doc.id] = bucket.getPublicUrl(path).data.publicUrl;
                    } else {
                        docsUnicosUrls[doc.id] = null;
                    }
                }

                // Subir documentos múltiples
                const docsMultiplesUrls = {};
                for (const doc of docsMultiples) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si' && archivosMultiples[doc.id] && archivosMultiples[doc.id].length > 0) {
                        const urls = [];
                        for (let i = 0; i < archivosMultiples[doc.id].length; i++) {
                            const path = `${uid}/${ts}_${doc.id}_${i}.pdf`;
                            const { error } = await bucket.upload(path, archivosMultiples[doc.id][i], { contentType: 'application/pdf' });
                            if (error) throw new Error(`Error subiendo ${doc.label}[${i}]: ${error.message}`);
                            urls.push(bucket.getPublicUrl(path).data.publicUrl);
                        }
                        docsMultiplesUrls[doc.id] = urls;
                    } else {
                        docsMultiplesUrls[doc.id] = null;
                    }
                }

                const tlfPais = document.getElementById('d_tlf_pais')?.value;
                const tlfNum = document.getElementById('d_tlf_num')?.value.trim().replace(/\D/g, '');
                
                // Preparar datos completos
                const data = {
                    numero_denuncia: nuevoNumeroDenuncia,
                    estacion_policial: document.getElementById('d_estacion')?.value,
                    primer_nombre: document.getElementById('d_nombre1')?.value.trim(),
                    segundo_nombre: document.getElementById('d_nombre2')?.value.trim() || null,
                    primer_apellido: document.getElementById('d_apellido1')?.value.trim(),
                    segundo_apellido: document.getElementById('d_apellido2')?.value.trim() || null,
                    cedula: document.getElementById('d_cedula')?.value.trim() || null,
                    tlf_pais: tlfPais || null,
                    tlf_numero: tlfNum || null,
                    direccion: document.getElementById('d_direccion')?.value.trim() || null,
                    motivo_denuncia: document.getElementById('d_motivo')?.value.trim() || null,
                    oficio_remision: docsUnicosUrls.oficio_remision,
                    acta_denuncia: docsUnicosUrls.acta_denuncia,
                    medida_proteccion: docsUnicosUrls.medida_proteccion,
                    acta_entrevista: docsMultiplesUrls.acta_entrevista,
                    datos_filiatorios: docsMultiplesUrls.datos_filiatorios,
                    evidencias: docsMultiplesUrls.evidencias,
                    solicitud_senamecf: docsMultiplesUrls.solicitud_senamecf,
                    observaciones: document.getElementById('d_observaciones')?.value.trim() || null,
                    registrado_por: uid,
                    email_registrante: user.email
                };

                const { error } = await window.supabaseClient.from('denuncias').insert([data]);
                if (error) throw error;

                if (msg) {
                    msg.textContent = `✅ Denuncia registrada exitosamente. N°: ${nuevoNumeroDenuncia}`;
                    msg.className = 'msg success';
                    msg.style.display = 'block';
                    setTimeout(() => msg.style.display = 'none', 5000);
                }

                // Resetear formulario y UI
                form.reset();
                if (fechaInput) {
                    const ahora = new Date();
                    fechaInput.value = ahora.toLocaleString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
                
                // Forzar reset de UI de documentos
                docsUnicos.forEach(d => toggleDocField(d.id, false));
                docsMultiples.forEach(d => toggleDocField(d.id, false));
                
                // Resetear teléfono
                if (nativeSelect) nativeSelect.value = '';
                if (flagImg) flagImg.src = 'https://flagcdn.com/w20/xx.png';
                if (codeText) codeText.textContent = '+XX';
                if (countryText) countryText.textContent = 'País';
                
                // Actualizar el próximo número para el siguiente registro
                actualizarProximoNumero();

            } catch (err) {
                console.error('Error:', err);
                if (msg) {
                    msg.textContent = '❌ ' + err.message;
                    msg.className = 'msg error';
                    msg.style.display = 'block';
                }
            } finally {
                btn.disabled = false;
                btn.textContent = '✅ Registrar Denuncia';
                if (loadingOverlay) loadingOverlay.classList.remove('active');
            }
        });
        
        console.log("✅ Módulo reg-denuncias.js inicializado correctamente");
    }
    
    iniciarModulo();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initRegDenuncias);
} else {
    window.initRegDenuncias();
}
