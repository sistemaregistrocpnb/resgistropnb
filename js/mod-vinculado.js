window.initModVinculado = function() {
    console.log("✅ Módulo mod-vinculado.js cargado correctamente.");

    // ==========================================
    // 🔹 1. MAPA DE BANDERAS
    // ==========================================
    const isoMap = {
        "Afganistán": "af", "Albania": "al", "Alemania": "de", "Andorra": "ad", "Angola": "ao",
        "Antigua y Barbuda": "ag", "Arabia Saudita": "sa", "Argelia": "dz", "Argentina": "ar",
        "Armenia": "am", "Australia": "au", "Austria": "at", "Azerbaiyán": "az", "Bahamas": "bs",
        "Baréin": "bh", "Bangladés": "bd", "Barbados": "bb", "Bélgica": "be", "Belice": "bz",
        "Benín": "bj", "Bielorrusia": "by", "Birmania": "mm", "Bolivia": "bo",
        "Bosnia y Herzegovina": "ba", "Botsuana": "bw", "Brasil": "br", "Brunéi": "bn",
        "Bulgaria": "bg", "Burkina Faso": "bf", "Burundi": "bi", "Bután": "bt", "Cabo Verde": "cv",
        "Camboya": "kh", "Camerún": "cm", "Canadá": "ca", "Catar": "qa", "Rep. Centroafricana": "cf",
        "Chad": "td", "Rep. Checa": "cz", "Chile": "cl", "China": "cn", "Chipre": "cy",
        "Colombia": "co", "Comoras": "km", "Congo (Rep.)": "cg", "Congo (R.D.)": "cd",
        "Corea del Norte": "kp", "Corea del Sur": "kr", "Costa de Marfil": "ci",
        "Costa Rica": "cr", "Croacia": "hr", "Cuba": "cu", "Dinamarca": "dk", "Dominica": "dm",
        "Ecuador": "ec", "Egipto": "eg", "El Salvador": "sv", "Emiratos Árabes Unidos": "ae",
        "Eritrea": "er", "Eslovaquia": "sk", "Eslovenia": "si", "España": "es",
        "Estados Unidos": "us", "Estonia": "ee", "Etiopía": "et", "Filipinas": "ph",
        "Finlandia": "fi", "Fiyi": "fj", "Francia": "fr", "Gabón": "ga", "Gambia": "gm",
        "Georgia": "ge", "Ghana": "gh", "Granada": "gd", "Grecia": "gr", "Guatemala": "gt",
        "Guinea": "gn", "Guinea Ecuatorial": "gq", "Guinea-Bisáu": "gw", "Guyana": "gy",
        "Haití": "ht", "Honduras": "hn", "Hungría": "hu", "India": "in", "Indonesia": "id",
        "Irak": "iq", "Irán": "ir", "Irlanda": "ie", "Islandia": "is", "Israel": "il", "Italia": "it",
        "Jamaica": "jm", "Japón": "jp", "Jordania": "jo", "Kazajistán": "kz", "Kenia": "ke",
        "Kirguistán": "kg", "Kiribati": "ki", "Kuwait": "kw", "Laos": "la", "Lesoto": "ls",
        "Letonia": "lv", "Líbano": "lb", "Liberia": "lr", "Libia": "ly", "Liechtenstein": "li",
        "Lituania": "lt", "Luxemburgo": "lu", "Macedonia del Norte": "mk", "Madagascar": "mg",
        "Malasia": "my", "Malaui": "mw", "Maldivas": "mv", "Malí": "ml", "Malta": "mt",
        "Marruecos": "ma", "Mauricio": "mu", "Mauritania": "mr", "México": "mx", "Micronesia": "fm",
        "Moldavia": "md", "Mónaco": "mc", "Mongolia": "mn", "Montenegro": "me", "Mozambique": "mz",
        "Namibia": "na", "Nauru": "nr", "Nepal": "np", "Nicaragua": "ni", "Níger": "ne",
        "Nigeria": "ng", "Noruega": "no", "Nueva Zelanda": "nz", "Omán": "om",
        "Países Bajos": "nl", "Pakistán": "pk", "Palaos": "pw", "Palestina": "ps", "Panamá": "pa",
        "Papúa Nueva Guinea": "pg", "Paraguay": "py", "Perú": "pe", "Polonia": "pl",
        "Portugal": "pt", "Puerto Rico": "pr", "Reino Unido": "gb", "Rep. Dominicana": "do",
        "Ruanda": "rw", "Rumania": "ro", "Rusia": "ru", "Samoa": "ws", "San Marino": "sm",
        "Santa Lucía": "lc", "Santo Tomé y Príncipe": "st", "San Vicente y las Granadinas": "vc",
        "Senegal": "sn", "Serbia": "rs", "Seychelles": "sc", "Sierra Leona": "sl", "Singapur": "sg",
        "Siria": "sy", "Somalia": "so", "Sudáfrica": "za", "Sudán": "sd", "Sudán del Sur": "ss",
        "Suecia": "se", "Suiza": "ch", "Surinam": "sr", "Esuatini": "sz", "Tayikistán": "tj",
        "Tanzania": "tz", "Tailandia": "th", "Timor Oriental": "tl", "Togo": "tg", "Tonga": "to",
        "Trinidad y Tobago": "tt", "Túnez": "tn", "Turquía": "tr", "Turkmenistán": "tm",
        "Tuvalu": "tv", "Ucrania": "ua", "Uganda": "ug", "Uruguay": "uy", "Uzbekistán": "uz",
        "Vanuatu": "vu", "Ciudad del Vaticano": "va", "Venezuela": "ve", "Vietnam": "vn",
        "Yemen": "ye", "Yibuti": "dj", "Zambia": "zm", "Zimbabue": "zw"
    };

    // ==========================================
    // 🔹 2. LISTAS COMPLETAS DE MARCAS/MODELOS
    // ==========================================
    const marcasModelosMoto = {
        "Empire Keeway": ["Matrix Lite", "Matrix II 150", "EK Xpress Lite", "QJ Fort", "Horse", "EK Arsen II 200", "EK Atlas", "Owen 200", "TX II 150", "TX 250GS", "V302C"],
        "Bera Motorcycles": ["Bera BWS", "Milán", "Runner", "SBR", "X1", "León", "BR200 / DT", "Cobra", "Kavak", "Carguero"],
        "Motos Toro": ["Toro Jaguar TR150cc", "Toro León TR200cc", "Toro TRX 150", "Toro TRX 250", "Toro Moka 150", "Toro REX TR150cc", "Toro R3X 250", "Toro Cyclone RX650"],
        "Yamaha": ["Yamaha YBR 125", "Yamaha FZ16", "Yamaha MT-03", "Yamaha TMAX", "Yamaha XTZ 150 Lander", "Yamaha R3"],
        "Honda": ["Honda CG 150 Titan", "Honda CB 190R", "Honda XR 150L", "Honda PCX 160", "Honda Wave 110S"],
        "Suzuki": ["Suzuki GN 125", "Suzuki AX 100", "Suzuki Gixxer 150", "Suzuki V-Strom 250"],
        "KTM": ["KTM 125 Duke", "KTM 200 Duke", "KTM 390 Duke", "KTM 250 Adventure"],
        "Murasaki Motorcycle": ["Kawi 150", "Caracal 150", "Tributo 150", "Fenix 150", "Fenix 200", "Infernus 200", "Predator X 300", "XS6 (Eléctrica)"],
        "Otra": ["Otra (Especificar en observaciones)"]
    };

    const marcasModelosAuto = {
        "Toyota": ["Yaris", "Corolla", "Hilux", "Land Cruiser", "Fortuner", "RAV4"],
        "Chevrolet": ["Aveo", "Spark", "Tracker", "Captiva", "Cruze", "Optra"],
        "Ford": ["Fiesta", "Focus", "Ranger", "Explorer", "EcoSport"],
        "Nissan": ["Versa", "Sentra", "Frontier", "Kicks", "NP300"],
        "Kia": ["Picanto", "Rio", "Seltos", "Sportage", "Sorento"],
        "Hyundai": ["Grand i10", "Accent", "Tucson", "Santa Fe", "Creta"],
        "Dongfeng": ["Glory 330S", "Glory 500", "Glory 580"],
        "JAC Motors": ["Arena", "Aventura", "Nevado", "Tepuy", "La Venezolana"],
        "Chery": ["Arrizo 5", "Tiggo 2 Pro Max", "Tiggo 4", "Tiggo 7 Pro", "Tiggo 8 Pro"],
        "Mitsubishi": ["L200", "Outlander", "ASX", "Montero"],
        "Otra": ["Otra (Especificar en observaciones)"]
    };

    const estacionesList = [
        "EPM MARACAIBO", "EPM SAN FRANCISCO", "EPM LA CAÑADA", "EPM ESTACION POLICIAL JESUS E. LOSADA",
        "EPP CRISTO DE ARANZA", "EPP LUIS HURTADO", "EPP DAGNINO", "EPP OLEGARIO VILLALOBOS",
        "EPP CHIQUINQUIRA", "EPP FRANCISCO EUGENIO", "EPP CARACCIOLO", "EPP IDELFONSO",
        "EPP VENANCIO PULGAR", "EPP COQUIVACOA-ZAPARA", "EPP RAUL LEONI", "EPP ANTONIO BORJAS ROMERO",
        "EPP JUANA DE AVILA", "EPP SAN ISIDRO", "EPP CASIQUE MARA", "EPP BOLIVAR", "EPP EL BAJO",
        "EPP DOMITILA", "EPP CORTIJOS", "EPP MARCIAL HERNANDEZ", "EPP POTRERITO", "EPP ANDRES BELLO", "EPP SANTA LUCIA"
    ];

    // ==========================================
    //  3. REFERENCIAS DOM
    // ==========================================
    const marcaSelect = document.getElementById('pv_v_marca');
    const modeloSelect = document.getElementById('pv_v_modelo');
    const anioSelect = document.getElementById('pv_v_anio');
    const form = document.getElementById('form-mod-vinculado');
    const btnBuscar = document.getElementById('btn_buscar_mod');
    const inputBusqueda = document.getElementById('mod_busqueda_input');
    const msgBox = document.getElementById('msg-mod-vinculado');
    const msgBusqueda = document.getElementById('mod_msg_busqueda');
    const crossWarning = document.getElementById('cross-plate-warning');
    const selectionPanel = document.getElementById('selection-panel');
    const selectionList = document.getElementById('selection-list');
    const resultCount = document.getElementById('result-count');
    const btnCancelSearch = document.getElementById('btn-cancelar-seleccion');

    let currentData = null;

    if (anioSelect) {
        const currentYear = new Date().getFullYear();
        anioSelect.innerHTML = '<option value="">Seleccione año...</option>';
        for (let y = currentYear; y >= 1990; y--) anioSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // ==========================================
    // 🔹 4. FUNCIONES UI GLOBALES
    // ==========================================
    window.toggleCampo = function(select, targetId) {
        const el = document.getElementById(targetId);
        const input = el?.querySelector('input');
        if (select.value === 'true') {
            if (el) el.style.display = 'block';
            if (input) input.required = true;
        } else {
            if (el) el.style.display = 'none';
            if (input) { input.value = ''; input.required = false; }
        }
    };

    window.activarCampoPerforacion = function(select) {
        const caja = document.getElementById('pv_box-lugar-perforacion');
        const input = document.getElementById('pv_txt_lugar_perforacion');
        if (!caja || !input) return;
        if (select.value === 'true') { caja.style.display = 'block'; input.required = true; }
        else { caja.style.display = 'none'; input.value = ''; input.required = false; }
    };

    window.convertirEstatura = function() {
        const inputM = document.getElementById('pv_p_estatura');
        const inputCm = document.getElementById('pv_p_estatura_cm');
        if (!inputM) return null;
        const metros = parseFloat(inputM.value);
        if (!isNaN(metros) && metros >= 0.50 && metros <= 2.30) {
            if (inputCm) inputCm.value = Math.round(metros * 100);
            return parseInt(inputCm.value);
        }
        return null;
    };

    window.cargarMarcasPV = function() {
        const tipo = document.getElementById('pv_v_tipo')?.value;
        marcaSelect.innerHTML = '<option value="">Seleccione marca...</option>';
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';
        const boxCilindro = document.getElementById('pv_box_cilindro');
        if (tipo === 'Motocicleta') {
            Object.keys(marcasModelosMoto).sort().forEach(m => marcaSelect.innerHTML += `<option value="${m}">${m}</option>`);
            if(boxCilindro) boxCilindro.style.display = 'block';
        } else if (tipo === 'Automóvil') {
            Object.keys(marcasModelosAuto).sort().forEach(m => marcaSelect.innerHTML += `<option value="${m}">${m}</option>`);
            if(boxCilindro) boxCilindro.style.display = 'none';
        }
    };

    window.cargarModelosPV = function() {
        const tipo = document.getElementById('pv_v_tipo')?.value;
        const marca = marcaSelect.value;
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';
        const lista = tipo === 'Motocicleta' ? marcasModelosMoto[marca] : marcasModelosAuto[marca];
        if (lista) lista.forEach(mod => modeloSelect.innerHTML += `<option value="${mod}">${mod}</option>`);
    };

    function mostrarMsg(el, txt, type) {
        if (el) { el.innerHTML = txt; el.className = `msg ${type}`; el.style.display = txt ? 'block' : 'none'; }
    }

    const cargarEstaciones = () => {
        const select = document.getElementById('pv_estacion');
        if (select) {
            select.innerHTML = '<option value="">Seleccione estación...</option>';
            estacionesList.forEach(est => select.innerHTML += `<option value="${est}">${est}</option>`);
        }
    };

    const cargarAnios = () => {
        if (anioSelect) {
            const currentYear = new Date().getFullYear();
            anioSelect.innerHTML = '<option value="">Seleccione año...</option>';
            for (let y = currentYear; y >= 1990; y--) anioSelect.innerHTML += `<option value="${y}">${y}</option>`;
        }
    };

    const setupEdad = () => {
        const fechaNac = document.getElementById('pv_p_fecha_nac');
        const edadInput = document.getElementById('pv_p_edad');
        if (fechaNac && edadInput) {
            fechaNac.addEventListener('change', () => {
                if (!fechaNac.value) return;
                const hoy = new Date(), nac = new Date(fechaNac.value);
                let edad = hoy.getFullYear() - nac.getFullYear();
                const m = hoy.getMonth() - nac.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
                edadInput.value = (edad >= 0 && edad <= 120) ? edad : '';
            });
        }
    };

    // ==========================================
    // 🔹 5. DROPDOWN BANDERAS
    // ==========================================
    const initPhoneDropdown = () => {
        const nativeSelect = document.getElementById('pv_p_tlf_pais');
        const displayBox = document.querySelector('.phone-display');
        const optionsBox = document.querySelector('.phone-options');
        const flagImg = document.getElementById('pv_tlf-flag-img');
        const codeText = document.getElementById('pv_tlf-code-text');
        const countryText = document.getElementById('pv_tlf-country-text');
        
        if (optionsBox && nativeSelect && displayBox) {
            optionsBox.innerHTML = '';
            Array.from(nativeSelect.options).forEach(opt => {
                if (!opt.value || opt.value === '--') return;
                const iso = isoMap[opt.text] || 'xx';
                const div = document.createElement('div');
                div.className = 'phone-option';
                div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country" style="color:#475569;font-size:0.8rem;">${opt.text}</span>`;
                div.addEventListener('click', () => {
                    nativeSelect.value = opt.value;
                    flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                    codeText.textContent = opt.value;
                    countryText.textContent = opt.text;
                    optionsBox.style.display = 'none';
                });
                optionsBox.appendChild(div);
            });
            displayBox.addEventListener('click', (e) => {
                e.stopPropagation();
                optionsBox.style.display = optionsBox.style.display === 'block' ? 'none' : 'block';
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.phone-dropdown-wrapper')) optionsBox.style.display = 'none';
            });
        }
    };

    // ==========================================
    // 🔹 6. BÚSQUEDA MULTI-TABLA CON PANEL DE SELECCIÓN
    // ==========================================
    function detectarCoincidencias(reg, val, tabla) {
        const campos = [];
        const v = val.trim().toUpperCase();
        if (tabla === 'registro_vinculado' && reg.cedula && reg.cedula.toUpperCase() === v) campos.push('Cédula');
        if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
        if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial Carrocería');
        if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial Motor');
        return campos;
    }

    async function buscarEnTodasLasTablas(valor) {
        const resultados = [];
        const val = valor.trim().toUpperCase();
        
        try {
            // 1. REGISTRO_VINCULADO
            const { data: vinculados, error: errVinc } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .or(`cedula.eq.${val},placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`);

            if (!errVinc && vinculados && vinculados.length > 0) {
                vinculados.forEach(reg => {
                    resultados.push({
                        origen: 'registro_vinculado',
                        id: reg.id,
                        tipo: '🔗 Registro Vinculado',
                        icono: '🔗',
                        color: '#002b5c',
                        colorBg: '#eff6ff',
                        clase: 'vinculado',
                        datos: reg,
                        linea1: `👤 ${reg.primer_nombre || ''} ${reg.primer_apellido || ''} | C.I: ${reg.cedula || '-'}`,
                        linea2: `🚗 ${reg.tipo_vehiculo || ''} ${reg.marca_vehiculo || ''} ${reg.modelo_vehiculo || ''} | Placa: ${reg.placa || '-'}`,
                        linea3: `🏛️ ${reg.estacion_policial || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_vinculado')
                    });
                });
            }

            // 2. REGISTRO_MOTOS
            const { data: motos, error: errMoto } = await window.supabaseClient
                .from('registro_motos')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`);

            if (!errMoto && motos && motos.length > 0) {
                motos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_motos',
                        id: reg.id,
                        tipo: '🏍️ Motocicleta',
                        icono: '🏍️',
                        color: '#dc2626',
                        colorBg: '#fef2f2',
                        clase: 'moto',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial Carrocería: ${reg.serial_carroceria || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_motos')
                    });
                });
            }

            // 3. REGISTRO_AUTOMOVILES
            const { data: autos, error: errAuto } = await window.supabaseClient
                .from('registro_automoviles')
                .select('*')
                .or(`placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`);

            if (!errAuto && autos && autos.length > 0) {
                autos.forEach(reg => {
                    resultados.push({
                        origen: 'registro_automoviles',
                        id: reg.id,
                        tipo: '🚙 Automóvil',
                        icono: '',
                        color: '#059669',
                        colorBg: '#ecfdf5',
                        clase: 'auto',
                        datos: reg,
                        linea1: `Placa: ${reg.placa || '-'}`,
                        linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
                        linea3: `Serial Carrocería: ${reg.serial_carroceria || '-'}`,
                        encontrado_por: detectarCoincidencias(reg, val, 'registro_automoviles')
                    });
                });
            }

            return resultados;
        } catch (err) {
            console.error('Error en búsqueda multi-tabla:', err);
            throw err;
        }
    }

    function mostrarPanelSeleccion(resultados, valorBuscado) {
        selectionList.innerHTML = '';
        resultCount.textContent = resultados.length;

        // ️ ALERTA CRUZADA
        const tieneMoto = resultados.some(r => r.origen === 'registro_motos');
        const tieneAuto = resultados.some(r => r.origen === 'registro_automoviles');
        const tieneVinculado = resultados.some(r => r.origen === 'registro_vinculado');

        if (crossWarning) {
            if ((tieneMoto && tieneAuto) || (tieneVinculado && (tieneMoto || tieneAuto))) {
                crossWarning.innerHTML = `<strong>⚠️ ALERTA CRUZADA DETECTADA:</strong><br>El dato "<strong>${valorBuscado}</strong>" aparece en más de un tipo de registro. Esto puede indicar un caso de clonación de placas/seriales. Revise cuidadosamente.`;
                crossWarning.style.display = 'block';
            } else {
                crossWarning.style.display = 'none';
            }
        }

        //  CREAR TARJETAS CON COLORES
        resultados.forEach((res, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: ${res.colorBg};
                border: 2px solid ${res.color};
                border-left: 6px solid ${res.color};
                border-radius: 8px;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: transform 0.2s;
                margin-bottom: 12px;
            `;
            card.onmouseover = () => card.style.transform = 'translateX(4px)';
            card.onmouseout = () => card.style.transform = 'translateX(0)';

            card.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 1.5rem;">${res.icono}</span>
                        <strong style="color: ${res.color}; font-size: 0.95rem;">${res.tipo}</strong>
                    </div>
                    <div style="font-size: 0.9rem; color: #334155; margin-bottom: 3px;">${res.linea1}</div>
                    <div style="font-size: 0.85rem; color: #475569; margin-bottom: 3px;">${res.linea2}</div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">${res.linea3}</div>
                    <div style="font-size: 0.75rem; color: #0369a1; background: #e0f2fe; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                        🔎 Coincidencia en: <strong>${res.encontrado_por.join(', ')}</strong>
                    </div>
                </div>
                <button class="btn-seleccionar" data-index="${index}" style="
                    padding: 12px 24px;
                    background: ${res.color};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 700;
                    cursor: pointer;
                    white-space: nowrap;
                ">✏️ Editar</button>
            `;
            selectionList.appendChild(card);
        });

        document.querySelectorAll('.btn-seleccionar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                cargarResultado(resultados[idx]);
            });
        });

        selectionPanel.style.display = 'block';
        form.style.display = 'none';
        msgBusqueda.style.display = 'none';
    }

    async function cargarResultado(resultado) {
        selectionPanel.style.display = 'none';
        if (crossWarning) crossWarning.style.display = 'none';
        mostrarMsg(msgBusqueda, '✅ Cargando registro...', 'success');

        try {
            if (resultado.origen === 'registro_vinculado') {
                await cargarVinculado(resultado.datos);
            } else {
                // ❌ Registro individual (moto o auto) - Redirigir
                mostrarMsg(msgBusqueda, `⚠️ Este es un <strong>registro individual</strong> (${resultado.tipo}).<br><span style="font-size:0.85rem;">Para modificarlo, use el módulo de <strong>Registro de Vehículos → Modificar</strong>.</span>`, 'error');
                setTimeout(() => {
                    msgBusqueda.style.display = 'none';
                    inputBusqueda.focus();
                }, 6000);
            }
        } catch (err) {
            console.error('Error cargando resultado:', err);
            mostrarMsg(msgBusqueda, ' Error al cargar: ' + err.message, 'error');
        }
    }

    async function cargarVinculado(data) {
        currentData = data;
        document.getElementById('mod_vinculado_id').value = data.id;
        document.getElementById('mod_estatus_badge').textContent = data.estatus || 'Verificación';

        // Persona
        document.getElementById('pv_p_nombre1').value = data.primer_nombre || '';
        document.getElementById('pv_p_nombre2').value = data.segundo_nombre || '';
        document.getElementById('pv_p_apellido1').value = data.primer_apellido || '';
        document.getElementById('pv_p_apellido2').value = data.segundo_apellido || '';
        document.getElementById('pv_p_cedula').value = data.cedula || '';
        document.getElementById('pv_p_fecha_nac').value = data.fecha_nacimiento || '';
        document.getElementById('pv_p_edad').value = data.edad || '';
        document.getElementById('pv_p_apodo').value = data.apodo || '';
        document.getElementById('pv_p_marca').value = data.marca_corporal || '';
        document.getElementById('pv_p_nacionalidad').value = data.nacionalidad || '';
        document.getElementById('pv_p_sexo').value = data.sexo || '';
        document.getElementById('pv_p_direccion').value = data.direccion || '';
        document.getElementById('pv_p_tlf_pais').value = data.tlf_pais || '';
        document.getElementById('pv_p_tlf_num').value = data.tlf_numero || '';
        document.getElementById('pv_p_fecha_nac').dispatchEvent(new Event('change'));

        // Fotos persona
        if (data.foto_frontal_persona) { const p = document.getElementById('prev_p_frontal'); p.src = data.foto_frontal_persona; p.style.display = 'block'; }
        if (data.foto_perfil_izq_persona) { const p = document.getElementById('prev_p_izq'); p.src = data.foto_perfil_izq_persona; p.style.display = 'block'; }
        if (data.foto_perfil_der_persona) { const p = document.getElementById('prev_p_der'); p.src = data.foto_perfil_der_persona; p.style.display = 'block'; }

        // Características
        document.getElementById('pv_p_estatura').value = data.estatura_cm ? (data.estatura_cm / 100).toFixed(2) : '';
        document.getElementById('pv_p_color_piel').value = data.color_piel || '';
        document.getElementById('pv_p_color_ojos').value = data.color_ojos || '';
        document.getElementById('pv_p_color_cabello').value = data.color_cabello || '';
        document.getElementById('pv_p_complexion').value = data.complexion || '';

        // Salud
        document.getElementById('pv_p_lentes').value = data.usa_lentes ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_lentes'), 'pv_det-lentes');
        document.getElementById('pv_txt_lentes').value = data.detalle_lentes || '';

        document.getElementById('pv_p_perforaciones').value = data.perforaciones ? 'true' : 'false';
        window.activarCampoPerforacion(document.getElementById('pv_p_perforaciones'));
        document.getElementById('pv_txt_lugar_perforacion').value = data.detalle_perforaciones || '';

        document.getElementById('pv_p_cond_medica').value = data.condicion_medica ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_cond_medica'), 'pv_det-cond');
        document.getElementById('pv_txt_cond').value = data.condicion_medica || '';

        document.getElementById('pv_p_medicamento').value = data.consume_medicamento ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_medicamento'), 'pv_det-med');
        document.getElementById('pv_txt_med').value = data.consume_medicamento || '';

        document.getElementById('pv_p_judicial').value = data.problema_judicial ? 'true' : 'false';
        window.toggleCampo(document.getElementById('pv_p_judicial'), 'pv_det-jud');
        document.getElementById('pv_txt_jud').value = data.problema_judicial || '';

        // Vehículo
        document.getElementById('pv_v_tipo').value = data.tipo_vehiculo || '';
        window.cargarMarcasPV();
        setTimeout(() => {
            document.getElementById('pv_v_marca').value = data.marca_vehiculo || '';
            window.cargarModelosPV();
            setTimeout(() => {
                document.getElementById('pv_v_modelo').value = data.modelo_vehiculo || '';
            }, 150);
        }, 100);

        document.getElementById('pv_v_placa').value = data.placa || '';
        document.getElementById('pv_v_serial_carro').value = data.serial_carroceria || '';
        document.getElementById('pv_v_serial_motor').value = data.serial_motor || '';
        document.getElementById('pv_v_cilindraje').value = data.cilindraje || '';
        document.getElementById('pv_v_anio').value = data.anio_vehiculo || '';
        document.getElementById('pv_v_color').value = data.color_vehiculo || '';

        // Fotos vehículo
        if (data.foto_frontal_vehiculo) { const p = document.getElementById('prev_v_frontal'); p.src = data.foto_frontal_vehiculo; p.style.display = 'block'; }
        if (data.foto_trasera_vehiculo) { const p = document.getElementById('prev_v_trasera'); p.src = data.foto_trasera_vehiculo; p.style.display = 'block'; }
        if (data.foto_lado_der_vehiculo) { const p = document.getElementById('prev_v_der'); p.src = data.foto_lado_der_vehiculo; p.style.display = 'block'; }
        if (data.foto_lado_izq_vehiculo) { const p = document.getElementById('prev_v_izq'); p.src = data.foto_lado_izq_vehiculo; p.style.display = 'block'; }

        // Registro
        document.getElementById('pv_estacion').value = data.estacion_policial || '';
        document.getElementById('pv_dir_detencion').value = data.direccion_detencion || '';
        document.getElementById('pv_observaciones').value = data.observaciones || '';

        setTimeout(() => {
            form.style.display = 'block';
            msgBusqueda.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }

    // ==========================================
    // 🔹 7. LISTENER DE BÚSQUEDA
    // ==========================================
    if (btnBuscar && inputBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const val = inputBusqueda.value.trim();
            if (val.length < 5) {
                mostrarMsg(msgBusqueda, '⚠️ Ingrese al menos 5 caracteres (cédula, placa, serial de carrocería o motor)', 'error');
                return;
            }

            mostrarMsg(msgBusqueda, '🔍 Buscando en todos los registros...', 'success');
            btnBuscar.disabled = true;
            form.style.display = 'none';
            if (selectionPanel) selectionPanel.style.display = 'none';
            if (crossWarning) crossWarning.style.display = 'none';

            try {
                const resultados = await buscarEnTodasLasTablas(val);

                if (resultados.length === 0) {
                    mostrarMsg(msgBusqueda, '❌ No se encontró ningún registro con ese dato.', 'error');
                } else if (resultados.length === 1) {
                    mostrarMsg(msgBusqueda, '✅ 1 registro encontrado. Cargando...', 'success');
                    setTimeout(() => cargarResultado(resultados[0]), 300);
                } else {
                    mostrarMsg(msgBusqueda, `🔎 Se encontraron <strong>${resultados.length} coincidencias</strong>. Seleccione cuál editar:`, 'success');
                    setTimeout(() => mostrarPanelSeleccion(resultados, val), 300);
                }
            } catch (err) {
                console.error('Error en búsqueda:', err);
                mostrarMsg(msgBusqueda, '❌ Error al buscar: ' + err.message, 'error');
            } finally {
                btnBuscar.disabled = false;
            }
        });

        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar.click();
            }
        });
    }

    if (btnCancelSearch) {
        btnCancelSearch.addEventListener('click', () => {
            if (selectionPanel) selectionPanel.style.display = 'none';
            if (crossWarning) crossWarning.style.display = 'none';
            msgBusqueda.style.display = 'none';
            inputBusqueda.value = '';
            inputBusqueda.focus();
        });
    }

    // ==========================================
    // 🔹 8. VALIDACIÓN EN TIEMPO REAL
    // ==========================================
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function checkAvailability(input, msgId, columna) {
        const val = input.value.trim().toUpperCase();
        const msgEl = document.getElementById(msgId);
        if (!val || !currentData) {
            if(msgEl) { msgEl.textContent = ''; }
            input.classList.remove('input-valid', 'input-error');
            return;
        }
        if (msgEl) { msgEl.textContent = '⏳ Verificando...'; msgEl.className = 'status-msg'; }

        try {
            let found = false;
            const { data } = await window.supabaseClient.from('registro_vinculado').select('id').ilike(columna, val).neq('id', currentData.id).maybeSingle();
            if (data) found = true;

            if (found) {
                input.classList.add('input-error'); input.classList.remove('input-valid');
                if (msgEl) { msgEl.textContent = '❌ Ya registrado'; msgEl.className = 'status-msg error'; }
            } else {
                input.classList.add('input-valid'); input.classList.remove('input-error');
                if (msgEl) { msgEl.textContent = '✅ Disponible'; msgEl.className = 'status-msg valid'; }
            }
        } catch (e) {
            if (msgEl) msgEl.textContent = '⚠️ Error de conexión';
        }
    }

    document.getElementById('pv_p_cedula')?.addEventListener('input', debounce((e) => checkAvailability(e.target, 'pv-msg-cedula', 'cedula'), 600));
    document.getElementById('pv_v_placa')?.addEventListener('input', debounce((e) => checkAvailability(e.target, 'pv-msg-placa', 'placa'), 600));
    document.getElementById('pv_v_serial_carro')?.addEventListener('input', debounce((e) => checkAvailability(e.target, 'pv-msg-carro', 'serial_carroceria'), 600));
    document.getElementById('pv_v_serial_motor')?.addEventListener('input', debounce((e) => checkAvailability(e.target, 'pv-msg-motor', 'serial_motor'), 600));

    // ==========================================
    // 🔹 9. ENVÍO DEL FORMULARIO
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentData) return mostrarMsg(msgBox, 'Primero debe buscar y seleccionar un registro.', 'error');

            let hasError = false;
            document.querySelectorAll('.registro-form input').forEach(i => { if (i.classList.contains('input-error')) hasError = true; });
            if (hasError) return mostrarMsg(msgBox, 'Por favor corrija los campos marcados en rojo.', 'error');

            const cedula = document.getElementById('pv_p_cedula').value.trim();
            if (cedula.length < 7) return mostrarMsg(msgBox, 'La cédula debe tener entre 7 y 8 dígitos.', 'error');

            const btnSubmit = form.querySelector('.btn-submit');
            btnSubmit.disabled = true; btnSubmit.textContent = '⏳ Guardando...';
            msgBox.style.display = 'none';

            try {
                const bucket = window.supabaseClient.storage.from('fotos_personas');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();

                const uploadIfNeeded = async (inputId, currentUrl, suffix) => {
                    const file = document.getElementById(inputId).files[0];
                    if (!file) return currentUrl;
                    const path = `${uid}/mod_${ts}_${suffix}.jpg`;
                    const { error } = await bucket.upload(path, file, { cacheControl: '3600' });
                    if (error) throw new Error('Error subiendo foto.');
                    return bucket.getPublicUrl(path).data.publicUrl;
                };

                const n1 = await uploadIfNeeded('pv_foto_p_frontal', currentData.foto_frontal_persona, 'p_f');
                const n2 = await uploadIfNeeded('pv_foto_p_izq', currentData.foto_perfil_izq_persona, 'p_i');
                const n3 = await uploadIfNeeded('pv_foto_p_der', currentData.foto_perfil_der_persona, 'p_d');
                const n4 = await uploadIfNeeded('pv_foto_v_frontal', currentData.foto_frontal_vehiculo, 'v_f');
                const n5 = await uploadIfNeeded('pv_foto_v_trasera', currentData.foto_trasera_vehiculo, 'v_t');
                const n6 = await uploadIfNeeded('pv_foto_v_der', currentData.foto_lado_der_vehiculo, 'v_rd');
                const n7 = await uploadIfNeeded('pv_foto_v_izq', currentData.foto_lado_izq_vehiculo, 'v_ri');

                const data = {
                    primer_nombre: document.getElementById('pv_p_nombre1').value.trim(),
                    segundo_nombre: document.getElementById('pv_p_nombre2').value.trim() || null,
                    primer_apellido: document.getElementById('pv_p_apellido1').value.trim(),
                    segundo_apellido: document.getElementById('pv_p_apellido2').value.trim() || null,
                    cedula: cedula,
                    fecha_nacimiento: document.getElementById('pv_p_fecha_nac').value,
                    edad: parseInt(document.getElementById('pv_p_edad').value) || 0,
                    apodo: document.getElementById('pv_p_apodo').value.trim() || null,
                    marca_corporal: document.getElementById('pv_p_marca').value.trim() || null,
                    nacionalidad: document.getElementById('pv_p_nacionalidad').value,
                    sexo: document.getElementById('pv_p_sexo').value,
                    direccion: document.getElementById('pv_p_direccion').value.trim() || null,
                    tlf_pais: document.getElementById('pv_p_tlf_pais').value || null,
                    tlf_numero: document.getElementById('pv_p_tlf_num').value.trim() || null,
                    estatura_cm: window.convertirEstatura(),
                    color_piel: document.getElementById('pv_p_color_piel').value,
                    color_ojos: document.getElementById('pv_p_color_ojos').value,
                    color_cabello: document.getElementById('pv_p_color_cabello').value,
                    complexion: document.getElementById('pv_p_complexion').value,
                    condicion_medica: document.getElementById('pv_p_cond_medica').value === 'true' ? document.getElementById('pv_txt_cond').value.trim() : null,
                    consume_medicamento: document.getElementById('pv_p_medicamento').value === 'true' ? document.getElementById('pv_txt_med').value.trim() : null,
                    problema_judicial: document.getElementById('pv_p_judicial').value === 'true' ? document.getElementById('pv_txt_jud').value.trim() : null,
                    usa_lentes: document.getElementById('pv_p_lentes').value === 'true',
                    detalle_lentes: document.getElementById('pv_p_lentes').value === 'true' ? document.getElementById('pv_txt_lentes').value.trim() : null,
                    perforaciones: document.getElementById('pv_p_perforaciones').value === 'true',
                    detalle_perforaciones: document.getElementById('pv_p_perforaciones').value === 'true' ? document.getElementById('pv_txt_lugar_perforacion').value.trim() : null,
                    tipo_vehiculo: document.getElementById('pv_v_tipo').value,
                    placa: document.getElementById('pv_v_placa').value.trim().toUpperCase(),
                    serial_carroceria: document.getElementById('pv_v_serial_carro').value.trim(),
                    serial_motor: document.getElementById('pv_v_serial_motor').value.trim() || null,
                    cilindraje: document.getElementById('pv_v_cilindraje').value || null,
                    color_vehiculo: document.getElementById('pv_v_color').value,
                    anio_vehiculo: parseInt(document.getElementById('pv_v_anio').value),
                    marca_vehiculo: document.getElementById('pv_v_marca').value,
                    modelo_vehiculo: document.getElementById('pv_v_modelo').value,
                    foto_frontal_persona: n1, foto_perfil_izq_persona: n2, foto_perfil_der_persona: n3,
                    foto_frontal_vehiculo: n4, foto_trasera_vehiculo: n5, foto_lado_der_vehiculo: n6, foto_lado_izq_vehiculo: n7,
                    estacion_policial: document.getElementById('pv_estacion').value,
                    direccion_detencion: document.getElementById('pv_dir_detencion').value.trim() || null,
                    observaciones: document.getElementById('pv_observaciones').value.trim() || null
                };

                const { error } = await window.supabaseClient.from('registro_vinculado').update(data).eq('id', currentData.id);
                if (error) throw error;

                mostrarMsg(msgBox, '✅ Registro actualizado correctamente.', 'success');
                setTimeout(() => {
                    form.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    msgBox.style.display = 'none';
                    crossWarning.style.display = 'none';
                    currentData = null;
                    document.querySelectorAll('.img-preview').forEach(i => i.style.display = 'none');
                    form.reset();
                }, 4000);
            } catch (err) {
                console.error('Error al guardar:', err);
                let msg = 'Error: ' + err.message;
                if (err.message.includes('23505') || err.message.includes('unique_constraint')) {
                    msg = '❌ Esa cédula o placa ya está registrada para otro registro.';
                }
                mostrarMsg(msgBox, msg, 'error');
            } finally {
                const btnSubmit = form.querySelector('.btn-submit');
                btnSubmit.disabled = false; btnSubmit.textContent = '💾 Guardar Cambios';
            }
        });
    }

    // Validación numérica teléfono
    const tlfNumInput = document.getElementById('pv_p_tlf_num');
    if (tlfNumInput) {
        tlfNumInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
    }

    // ==========================================
    // 🔹 INICIALIZACIÓN
    // ==========================================
    cargarEstaciones();
    cargarAnios();
    setupEdad();
    initPhoneDropdown();

    console.log("✅ Módulo mod-vinculado.js inicializado correctamente");
};
