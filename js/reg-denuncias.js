// ==========================================
// 🔹 DROPDOWN DE BANDERAS (COPIA EXACTA DE REG-PERSONAS CON IDs ÚNICOS)
// ==========================================
const nativeSelect = document.getElementById('d_tlf_pais');
const displayBox = document.getElementById('d-phone-display'); // ID ÚNICO
const optionsBox = document.getElementById('d-phone-options'); // ID ÚNICO
const flagImg = document.getElementById('d-tlf-flag-img');
const codeText = document.getElementById('d-tlf-code-text');
const countryText = document.getElementById('d-tlf-country-text');

const isoMap = {
    "Afganistán":"af","Albania":"al","Alemania":"de","Andorra":"ad","Angola":"ao",
    "Antigua y Barbuda":"ag","Arabia Saudita":"sa","Argelia":"dz","Argentina":"ar",
    "Armenia":"am","Australia":"au","Austria":"at","Azerbaiyán":"az","Bahamas":"bs",
    "Baréin":"bh","Bangladés":"bd","Barbados":"bb","Bélgica":"be","Belice":"bz",
    "Benín":"bj","Bielorrusia":"by","Birmania":"mm","Bolivia":"bo","Bosnia y Herzegovina":"ba",
    "Botsuana":"bw","Brasil":"br","Brunéi":"bn","Bulgaria":"bg","Burkina Faso":"bf",
    "Burundi":"bi","Bután":"bt","Cabo Verde":"cv","Camboya":"kh","Camerún":"cm",
    "Canadá":"ca","Catar":"qa","Rep. Centroafricana":"cf","Chad":"td","Rep. Checa":"cz",
    "Chile":"cl","China":"cn","Chipre":"cy","Colombia":"co","Comoras":"km",
    "Congo (Rep.)":"cg","Congo (R.D.)":"cd","Corea del Norte":"kp","Corea del Sur":"kr",
    "Costa de Marfil":"ci","Costa Rica":"cr","Croacia":"hr","Cuba":"cu","Dinamarca":"dk",
    "Dominica":"dm","Ecuador":"ec","Egipto":"eg","El Salvador":"sv",
    "Emiratos Árabes":"ae","Eritrea":"er","Eslovaquia":"sk","Eslovenia":"si","España":"es",
    "Estados Unidos":"us","Estonia":"ee","Etiopía":"et","Filipinas":"ph","Finlandia":"fi",
    "Fiyi":"fj","Francia":"fr","Gabón":"ga","Gambia":"gm","Georgia":"ge","Ghana":"gh",
    "Granada":"gd","Grecia":"gr","Guatemala":"gt","Guinea":"gn","Guinea Ecuatorial":"gq",
    "Guinea-Bisáu":"gw","Guyana":"gy","Haití":"ht","Honduras":"hn","Hungría":"hu",
    "India":"in","Indonesia":"id","Irak":"iq","Irán":"ir","Irlanda":"ie","Islandia":"is",
    "Israel":"il","Italia":"it","Jamaica":"jm","Japón":"jp","Jordania":"jo",
    "Kazajistán":"kz","Kenia":"ke","Kirguistán":"kg","Kiribati":"ki","Kuwait":"kw",
    "Laos":"la","Lesoto":"ls","Letonia":"lv","Líbano":"lb","Liberia":"lr","Libia":"ly",
    "Liechtenstein":"li","Lituania":"lt","Luxemburgo":"lu","Macedonia del Norte":"mk",
    "Madagascar":"mg","Malasia":"my","Malaui":"mw","Maldivas":"mv","Malí":"ml","Malta":"mt",
    "Marruecos":"ma","Mauricio":"mu","Mauritania":"mr","México":"mx","Micronesia":"fm",
    "Moldavia":"md","Mónaco":"mc","Mongolia":"mn","Montenegro":"me","Mozambique":"mz",
    "Namibia":"na","Nauru":"nr","Nepal":"np","Nicaragua":"ni","Níger":"ne","Nigeria":"ng",
    "Nueva Zelanda":"nz","Noruega":"no","Omán":"om","Países Bajos":"nl","Pakistán":"pk",
    "Palaos":"pw","Palestina":"ps","Panamá":"pa","Papúa Nueva Guinea":"pg","Paraguay":"py",
    "Perú":"pe","Polonia":"pl","Portugal":"pt","Reino Unido":"gb","Puerto Rico":"pr",
    "Ruanda":"rw","Rumania":"ro","Rusia":"ru","Samoa":"ws","San Marino":"sm",
    "Santa Lucía":"lc","Santo Tomé y Príncipe":"st","San Vicente y las Granadinas":"vc",
    "Senegal":"sn","Serbia":"rs","Seychelles":"sc","Sierra Leona":"sl","Singapur":"sg",
    "Siria":"sy","Somalia":"so","Sudáfrica":"za","Sudán":"sd","Sudán del Sur":"ss",
    "Suecia":"se","Suiza":"ch","Surinam":"sr","Esuatini":"sz","Tayikistán":"tj",
    "Tanzania":"tz","Tailandia":"th","Timor Oriental":"tl","Togo":"tg","Tonga":"to",
    "Trinidad y Tobago":"tt","Túnez":"tn","Turquía":"tr","Turkmenistán":"tm","Tuvalu":"tv",
    "Ucrania":"ua","Uganda":"ug","Uruguay":"uy","Uzbekistán":"uz","Vanuatu":"vu",
    "Vaticano":"va","Venezuela":"ve","Vietnam":"vn","Yemen":"ye","Yibuti":"dj",
    "Zambia":"zm","Zimbabue":"zw"
};

if (optionsBox && nativeSelect && displayBox) {
    optionsBox.innerHTML = '';
    Array.from(nativeSelect.options).forEach(opt => {
        if (!opt.value) return;
        const iso = isoMap[opt.text] || opt.value.replace('+','').toLowerCase();
        const div = document.createElement('div');
        div.className = 'phone-option';
        div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country" style="color:#475569;font-size:0.8rem;">${opt.text}</span>`;
        div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;';
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
    });
    
    // EVENTO CLICK USANDO ID ÚNICO
    displayBox.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        optionsBox.style.display = optionsBox.style.display === 'block' ? 'none' : 'block'; 
    });
    
    // CERRAR AL HACER CLICK FUERA (USANDO IDs ÚNICOS PARA NO CHOCAR CON REG-PERSONAS)
    document.addEventListener('click', (e) => { 
        if (!e.target.closest('#d-phone-display') && !e.target.closest('#d-phone-options')) {
            optionsBox.style.display = 'none'; 
        }
    });
}

// Valores iniciales por defecto (Venezuela)
if (nativeSelect) nativeSelect.value = '+58';
if (flagImg) flagImg.src = 'https://flagcdn.com/w20/ve.png';
if (codeText) codeText.textContent = '+58';
if (countryText) countryText.textContent = 'Venezuela';
