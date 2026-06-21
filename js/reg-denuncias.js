if (window._regDenunciasInit) {
    console.warn('⚠️ reg-denuncias.js ya estaba inicializado. Saltando duplicado.');
} else {
    window._regDenunciasInit = true;
    window.initRegDenuncias = function() {
        console.log("⚙️ Iniciando módulo reg-denuncias.js...");

        function iniciarModulo(intentos = 0) {
            const form = document.getElementById('form-reg-denuncias');
            const btn = form?.querySelector('.btn-submit');
            const msg = document.getElementById('msg-reg-denuncias');
            const loadingOverlay = document.getElementById('loading-overlay');

            // Elementos del teléfono
            const hiddenInput = document.getElementById('d_tlf_pais');
            const displayBtn = document.getElementById('phone-display-btn');
            const optionsList = document.getElementById('phone-options-list');
            const flagImg = document.getElementById('d-tlf-flag-img');
            const codeText = document.getElementById('d-tlf-code-text');
            const countryText = document.getElementById('d-tlf-country-text');

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
            // 🔹 DROPDOWN DE BANDERAS (VERSIÓN CORREGIDA)
            // ==========================================
            const paises = [
                {codigo: "+93", nombre: "Afganistán", iso: "af"},
                {codigo: "+355", nombre: "Albania", iso: "al"},
                {codigo: "+49", nombre: "Alemania", iso: "de"},
                {codigo: "+376", nombre: "Andorra", iso: "ad"},
                {codigo: "+244", nombre: "Angola", iso: "ao"},
                {codigo: "+1268", nombre: "Antigua y Barbuda", iso: "ag"},
                {codigo: "+966", nombre: "Arabia Saudita", iso: "sa"},
                {codigo: "+213", nombre: "Argelia", iso: "dz"},
                {codigo: "+54", nombre: "Argentina", iso: "ar"},
                {codigo: "+374", nombre: "Armenia", iso: "am"},
                {codigo: "+297", nombre: "Aruba", iso: "aw"},
                {codigo: "+61", nombre: "Australia", iso: "au"},
                {codigo: "+43", nombre: "Austria", iso: "at"},
                {codigo: "+994", nombre: "Azerbaiyán", iso: "az"},
                {codigo: "+1242", nombre: "Bahamas", iso: "bs"},
                {codigo: "+973", nombre: "Baréin", iso: "bh"},
                {codigo: "+880", nombre: "Bangladés", iso: "bd"},
                {codigo: "+1246", nombre: "Barbados", iso: "bb"},
                {codigo: "+32", nombre: "Bélgica", iso: "be"},
                {codigo: "+501", nombre: "Belice", iso: "bz"},
                {codigo: "+229", nombre: "Benín", iso: "bj"},
                {codigo: "+1441", nombre: "Bermudas", iso: "bm"},
                {codigo: "+375", nombre: "Bielorrusia", iso: "by"},
                {codigo: "+95", nombre: "Birmania", iso: "mm"},
                {codigo: "+591", nombre: "Bolivia", iso: "bo"},
                {codigo: "+387", nombre: "Bosnia y Herzegovina", iso: "ba"},
                {codigo: "+267", nombre: "Botsuana", iso: "bw"},
                {codigo: "+55", nombre: "Brasil", iso: "br"},
                {codigo: "+673", nombre: "Brunéi", iso: "bn"},
                {codigo: "+359", nombre: "Bulgaria", iso: "bg"},
                {codigo: "+226", nombre: "Burkina Faso", iso: "bf"},
                {codigo: "+257", nombre: "Burundi", iso: "bi"},
                {codigo: "+975", nombre: "Bután", iso: "bt"},
                {codigo: "+238", nombre: "Cabo Verde", iso: "cv"},
                {codigo: "+855", nombre: "Camboya", iso: "kh"},
                {codigo: "+237", nombre: "Camerún", iso: "cm"},
                {codigo: "+1", nombre: "Canadá", iso: "ca"},
                {codigo: "+974", nombre: "Catar", iso: "qa"},
                {codigo: "+236", nombre: "Rep. Centroafricana", iso: "cf"},
                {codigo: "+235", nombre: "Chad", iso: "td"},
                {codigo: "+56", nombre: "Chile", iso: "cl"},
                {codigo: "+86", nombre: "China", iso: "cn"},
                {codigo: "+357", nombre: "Chipre", iso: "cy"},
                {codigo: "+57", nombre: "Colombia", iso: "co"},
                {codigo: "+269", nombre: "Comoras", iso: "km"},
                {codigo: "+242", nombre: "Congo", iso: "cg"},
                {codigo: "+850", nombre: "Corea del Norte", iso: "kp"},
                {codigo: "+82", nombre: "Corea del Sur", iso: "kr"},
                {codigo: "+225", nombre: "Costa de Marfil", iso: "ci"},
                {codigo: "+506", nombre: "Costa Rica", iso: "cr"},
                {codigo: "+385", nombre: "Croacia", iso: "hr"},
                {codigo: "+53", nombre: "Cuba", iso: "cu"},
                {codigo: "+599", nombre: "Curazao", iso: "cw"},
                {codigo: "+45", nombre: "Dinamarca", iso: "dk"},
                {codigo: "+1767", nombre: "Dominica", iso: "dm"},
                {codigo: "+593", nombre: "Ecuador", iso: "ec"},
                {codigo: "+20", nombre: "Egipto", iso: "eg"},
                {codigo: "+503", nombre: "El Salvador", iso: "sv"},
                {codigo: "+971", nombre: "Emiratos Árabes", iso: "ae"},
                {codigo: "+291", nombre: "Eritrea", iso: "er"},
                {codigo: "+421", nombre: "Eslovaquia", iso: "sk"},
                {codigo: "+386", nombre: "Eslovenia", iso: "si"},
                {codigo: "+34", nombre: "España", iso: "es"},
                {codigo: "+1", nombre: "Estados Unidos", iso: "us"},
                {codigo: "+372", nombre: "Estonia", iso: "ee"},
                {codigo: "+251", nombre: "Etiopía", iso: "et"},
                {codigo: "+63", nombre: "Filipinas", iso: "ph"},
                {codigo: "+358", nombre: "Finlandia", iso: "fi"},
                {codigo: "+679", nombre: "Fiyi", iso: "fj"},
                {codigo: "+33", nombre: "Francia", iso: "fr"},
                {codigo: "+241", nombre: "Gabón", iso: "ga"},
                {codigo: "+220", nombre: "Gambia", iso: "gm"},
                {codigo: "+995", nombre: "Georgia", iso: "ge"},
                {codigo: "+233", nombre: "Ghana", iso: "gh"},
                {codigo: "+350", nombre: "Gibraltar", iso: "gi"},
                {codigo: "+1473", nombre: "Granada", iso: "gd"},
                {codigo: "+30", nombre: "Grecia", iso: "gr"},
                {codigo: "+299", nombre: "Groenlandia", iso: "gl"},
                {codigo: "+590", nombre: "Guadalupe", iso: "gp"},
                {codigo: "+1671", nombre: "Guam", iso: "gu"},
                {codigo: "+502", nombre: "Guatemala", iso: "gt"},
                {codigo: "+594", nombre: "Guayana Francesa", iso: "gf"},
                {codigo: "+224", nombre: "Guinea", iso: "gn"},
                {codigo: "+240", nombre: "Guinea Ecuatorial", iso: "gq"},
                {codigo: "+245", nombre: "Guinea-Bisáu", iso: "gw"},
                {codigo: "+592", nombre: "Guyana", iso: "gy"},
                {codigo: "+509", nombre: "Haití", iso: "ht"},
                {codigo: "+504", nombre: "Honduras", iso: "hn"},
                {codigo: "+852", nombre: "Hong Kong", iso: "hk"},
                {codigo: "+36", nombre: "Hungría", iso: "hu"},
                {codigo: "+91", nombre: "India", iso: "in"},
                {codigo: "+62", nombre: "Indonesia", iso: "id"},
                {codigo: "+964", nombre: "Irak", iso: "iq"},
                {codigo: "+98", nombre: "Irán", iso: "ir"},
                {codigo: "+353", nombre: "Irlanda", iso: "ie"},
                {codigo: "+44", nombre: "Isla de Man", iso: "im"},
                {codigo: "+298", nombre: "Islas Feroe", iso: "fo"},
                {codigo: "+677", nombre: "Islas Salomón", iso: "sb"},
                {codigo: "+972", nombre: "Israel", iso: "il"},
                {codigo: "+39", nombre: "Italia", iso: "it"},
                {codigo: "+1876", nombre: "Jamaica", iso: "jm"},
                {codigo: "+81", nombre: "Japón", iso: "jp"},
                {codigo: "+962", nombre: "Jordania", iso: "jo"},
                {codigo: "+7", nombre: "Kazajistán", iso: "kz"},
                {codigo: "+254", nombre: "Kenia", iso: "ke"},
                {codigo: "+996", nombre: "Kirguistán", iso: "kg"},
                {codigo: "+686", nombre: "Kiribati", iso: "ki"},
                {codigo: "+965", nombre: "Kuwait", iso: "kw"},
                {codigo: "+856", nombre: "Laos", iso: "la"},
                {codigo: "+371", nombre: "Letonia", iso: "lv"},
                {codigo: "+961", nombre: "Líbano", iso: "lb"},
                {codigo: "+266", nombre: "Lesoto", iso: "ls"},
                {codigo: "+231", nombre: "Liberia", iso: "lr"},
                {codigo: "+218", nombre: "Libia", iso: "ly"},
                {codigo: "+423", nombre: "Liechtenstein", iso: "li"},
                {codigo: "+370", nombre: "Lituania", iso: "lt"},
                {codigo: "+352", nombre: "Luxemburgo", iso: "lu"},
                {codigo: "+853", nombre: "Macao", iso: "mo"},
                {codigo: "+389", nombre: "Macedonia del Norte", iso: "mk"},
                {codigo: "+261", nombre: "Madagascar", iso: "mg"},
                {codigo: "+60", nombre: "Malasia", iso: "my"},
                {codigo: "+265", nombre: "Malaui", iso: "mw"},
                {codigo: "+960", nombre: "Maldivas", iso: "mv"},
                {codigo: "+223", nombre: "Malí", iso: "ml"},
                {codigo: "+356", nombre: "Malta", iso: "mt"},
                {codigo: "+212", nombre: "Marruecos", iso: "ma"},
                {codigo: "+596", nombre: "Martinica", iso: "mq"},
                {codigo: "+230", nombre: "Mauricio", iso: "mu"},
                {codigo: "+222", nombre: "Mauritania", iso: "mr"},
                {codigo: "+262", nombre: "Mayotte", iso: "yt"},
                {codigo: "+52", nombre: "México", iso: "mx"},
                {codigo: "+691", nombre: "Micronesia", iso: "fm"},
                {codigo: "+373", nombre: "Moldavia", iso: "md"},
                {codigo: "+377", nombre: "Mónaco", iso: "mc"},
                {codigo: "+976", nombre: "Mongolia", iso: "mn"},
                {codigo: "+382", nombre: "Montenegro", iso: "me"},
                {codigo: "+1664", nombre: "Montserrat", iso: "ms"},
                {codigo: "+258", nombre: "Mozambique", iso: "mz"},
                {codigo: "+264", nombre: "Namibia", iso: "na"},
                {codigo: "+674", nombre: "Nauru", iso: "nr"},
                {codigo: "+977", nombre: "Nepal", iso: "np"},
                {codigo: "+505", nombre: "Nicaragua", iso: "ni"},
                {codigo: "+227", nombre: "Níger", iso: "ne"},
                {codigo: "+234", nombre: "Nigeria", iso: "ng"},
                {codigo: "+683", nombre: "Niue", iso: "nu"},
                {codigo: "+47", nombre: "Noruega", iso: "no"},
                {codigo: "+687", nombre: "Nueva Caledonia", iso: "nc"},
                {codigo: "+64", nombre: "Nueva Zelanda", iso: "nz"},
                {codigo: "+968", nombre: "Omán", iso: "om"},
                {codigo: "+31", nombre: "Países Bajos", iso: "nl"},
                {codigo: "+92", nombre: "Pakistán", iso: "pk"},
                {codigo: "+680", nombre: "Palaos", iso: "pw"},
                {codigo: "+970", nombre: "Palestina", iso: "ps"},
                {codigo: "+507", nombre: "Panamá", iso: "pa"},
                {codigo: "+675", nombre: "Papúa Nueva Guinea", iso: "pg"},
                {codigo: "+595", nombre: "Paraguay", iso: "py"},
                {codigo: "+51", nombre: "Perú", iso: "pe"},
                {codigo: "+689", nombre: "Polinesia Francesa", iso: "pf"},
                {codigo: "+48", nombre: "Polonia", iso: "pl"},
                {codigo: "+351", nombre: "Portugal", iso: "pt"},
                {codigo: "+1", nombre: "Puerto Rico", iso: "pr"},
                {codigo: "+420", nombre: "Rep. Checa", iso: "cz"},
                {codigo: "+262", nombre: "Reunión", iso: "re"},
                {codigo: "+250", nombre: "Ruanda", iso: "rw"},
                {codigo: "+40", nombre: "Rumania", iso: "ro"},
                {codigo: "+7", nombre: "Rusia", iso: "ru"},
                {codigo: "+685", nombre: "Samoa", iso: "ws"},
                {codigo: "+378", nombre: "San Marino", iso: "sm"},
                {codigo: "+1758", nombre: "Santa Lucía", iso: "lc"},
                {codigo: "+239", nombre: "Santo Tomé y Príncipe", iso: "st"},
                {codigo: "+1784", nombre: "San Vicente y las Granadinas", iso: "vc"},
                {codigo: "+221", nombre: "Senegal", iso: "sn"},
                {codigo: "+381", nombre: "Serbia", iso: "rs"},
                {codigo: "+248", nombre: "Seychelles", iso: "sc"},
                {codigo: "+232", nombre: "Sierra Leona", iso: "sl"},
                {codigo: "+65", nombre: "Singapur", iso: "sg"},
                {codigo: "+963", nombre: "Siria", iso: "sy"},
                {codigo: "+252", nombre: "Somalia", iso: "so"},
                {codigo: "+27", nombre: "Sudáfrica", iso: "za"},
                {codigo: "+249", nombre: "Sudán", iso: "sd"},
                {codigo: "+211", nombre: "Sudán del Sur", iso: "ss"},
                {codigo: "+46", nombre: "Suecia", iso: "se"},
                {codigo: "+41", nombre: "Suiza", iso: "ch"},
                {codigo: "+597", nombre: "Surinam", iso: "sr"},
                {codigo: "+268", nombre: "Esuatini", iso: "sz"},
                {codigo: "+992", nombre: "Tayikistán", iso: "tj"},
                {codigo: "+255", nombre: "Tanzania", iso: "tz"},
                {codigo: "+66", nombre: "Tailandia", iso: "th"},
                {codigo: "+670", nombre: "Timor Oriental", iso: "tl"},
                {codigo: "+228", nombre: "Togo", iso: "tg"},
                {codigo: "+676", nombre: "Tonga", iso: "to"},
                {codigo: "+1868", nombre: "Trinidad y Tobago", iso: "tt"},
                {codigo: "+216", nombre: "Túnez", iso: "tn"},
                {codigo: "+90", nombre: "Turquía", iso: "tr"},
                {codigo: "+993", nombre: "Turkmenistán", iso: "tm"},
                {codigo: "+688", nombre: "Tuvalu", iso: "tv"},
                {codigo: "+380", nombre: "Ucrania", iso: "ua"},
                {codigo: "+256", nombre: "Uganda", iso: "ug"},
                {codigo: "+598", nombre: "Uruguay", iso: "uy"},
                {codigo: "+998", nombre: "Uzbekistán", iso: "uz"},
                {codigo: "+678", nombre: "Vanuatu", iso: "vu"},
                {codigo: "+379", nombre: "Vaticano", iso: "va"},
                {codigo: "+58", nombre: "Venezuela", iso: "ve"},
                {codigo: "+84", nombre: "Vietnam", iso: "vn"},
                {codigo: "+681", nombre: "Wallis y Futuna", iso: "wf"},
                {codigo: "+967", nombre: "Yemen", iso: "ye"},
                {codigo: "+253", nombre: "Yibuti", iso: "dj"},
                {codigo: "+260", nombre: "Zambia", iso: "zm"},
                {codigo: "+263", nombre: "Zimbabue", iso: "zw"}
            ];

            // 🔧 Función para generar las opciones del dropdown
            function generarOpcionesDropdown() {
                if (!optionsList) {
                    console.error('❌ No se encontró #phone-options-list');
                    return;
                }
                optionsList.innerHTML = '';
                paises.forEach(pais => {
                    const div = document.createElement('div');
                    div.className = 'phone-option';
                    div.innerHTML = `
                        <img src="https://flagcdn.com/w20/${pais.iso}.png" 
                             style="width:18px;height:13px;object-fit:contain;border-radius:2px;" 
                             onerror="this.src='https://flagcdn.com/w20/xx.png'">
                        <span class="code" style="font-weight:600;min-width:30px;">${pais.codigo}</span>
                        <span class="country" style="color:#475569;font-size:0.8rem;">${pais.nombre}</span>
                    `;
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        hiddenInput.value = pais.codigo;
                        flagImg.src = `https://flagcdn.com/w20/${pais.iso}.png`;
                        codeText.textContent = pais.codigo;
                        countryText.textContent = pais.nombre;
                        optionsList.style.display = 'none';
                        console.log(`✅ País seleccionado: ${pais.nombre} (${pais.codigo})`);
                    });
                    optionsList.appendChild(div);
                });
                console.log(`✅ Dropdown generado con ${paises.length} países`);
            }

            // 🔧 Configurar click en el display - LÓGICA CORREGIDA
            if (displayBtn && optionsList) {
                generarOpcionesDropdown();

                displayBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // 🔧 Verificar el estado actual correctamente
                    const isCurrentlyHidden = optionsList.style.display === 'none' || 
                                              optionsList.style.display === '' ||
                                              window.getComputedStyle(optionsList).display === 'none';
                    
                    optionsList.style.display = isCurrentlyHidden ? 'block' : 'none';
                    console.log(`🔽 Dropdown ${isCurrentlyHidden ? 'abierto' : 'cerrado'}`);
                });

                // Cerrar al hacer click fuera
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.phone-dropdown-wrapper')) {
                        optionsList.style.display = 'none';
                    }
                });

                console.log('✅ Dropdown de banderas configurado correctamente');
            } else {
                console.error('❌ No se encontraron los elementos del dropdown');
                console.log('displayBtn:', displayBtn);
                console.log('optionsList:', optionsList);
            }

            // ✅ Configurar valores iniciales por defecto (Venezuela)
            if (hiddenInput) hiddenInput.value = '+58';
            if (flagImg) flagImg.src = 'https://flagcdn.com/w20/ve.png';
            if (codeText) codeText.textContent = '+58';
            if (countryText) countryText.textContent = 'Venezuela';

            // Cargar el próximo número al iniciar
            actualizarProximoNumero();

            // ==========================================
            // ENVÍO DEL FORMULARIO
            // ==========================================
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!form.checkValidity()) { form.reportValidity(); return; }
                if (!window.supabaseClient) { alert("❌ Error: Cliente de Supabase no inicializado."); return; }

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

                    // Recalcular número justo antes de guardar
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

                    const tlfPais = hiddenInput?.value || '+58';
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

                    const { data: insertedData, error } = await window.supabaseClient.from('denuncias').insert([data]).select('id').single();
                    if (error) throw error;

                    // ✅ REGISTRAR EN SISTEMA_LOGS
                    if (typeof window.registrarLog === 'function') {
                        const nombreDenunciante = `${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}`.trim() || 'No especificado';
                        const telefonoCompleto = tlfPais && tlfNum ? `${tlfPais} ${tlfNum}` : (tlfNum || 'N/A');
                        let totalDocs = 0;
                        Object.values(docsUnicosUrls).forEach(v => { if (v) totalDocs++; });
                        Object.values(docsMultiplesUrls).forEach(arr => { if (Array.isArray(arr)) totalDocs += arr.length; });

                        const logDetalles = {
                            registro: 'Denuncia Registrada',
                            estatus: 'Activa',
                            numero_denuncia: nuevoNumeroDenuncia,
                            estacion_policial: data.estacion_policial || 'N/A',
                            cedula_denunciante: data.cedula || 'N/A',
                            nombre_denunciante: nombreDenunciante,
                            telefono: telefonoCompleto,
                            direccion: data.direccion || 'N/A',
                            motivo: data.motivo_denuncia || 'N/A',
                            documentos_subidos: totalDocs,
                            email_registrante: user.email
                        };

                        await window.registrarLog(
                            'REGISTRAR',
                            'DENUNCIAS',
                            logDetalles,
                            insertedData?.id || null
                        );
                        console.log('✅ Log de denuncia registrado exitosamente en sistema_logs');
                    }

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
                    docsUnicos.forEach(d => toggleDocField(d.id, false));
                    docsMultiples.forEach(d => toggleDocField(d.id, false));

                    // ✅ Resetear teléfono a Venezuela por defecto
                    if (hiddenInput) hiddenInput.value = '+58';
                    if (flagImg) flagImg.src = 'https://flagcdn.com/w20/ve.png';
                    if (codeText) codeText.textContent = '+58';
                    if (countryText) countryText.textContent = 'Venezuela';

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
}
