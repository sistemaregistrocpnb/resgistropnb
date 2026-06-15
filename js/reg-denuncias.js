window.initRegDenuncias = function() {
    // ==========================================
    // ✅ 1. FUNCIÓN PARA REGISTRAR LOGS CON NOMBRE COMPLETO
    // ==========================================
    async function registrarLog(accion, modulo, detalles) {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;
            let nombreUsuario = user.email || 'Sistema';
            
            try {
                const { data: perfil } = await window.supabaseClient
                    .from('perfiles_usuario')
                    .select('nombre, apellido, email')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (perfil) {
                    nombreUsuario = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ').trim() || nombreUsuario;
                }
            } catch (err) {
                // Silencioso por seguridad
            }

            const logEntry = {
                user_id: user.id,
                user_nombre: nombreUsuario,
                user_email: user.email || 'sistema',
                accion: accion,
                modulo: modulo,
                detalles: detalles,
                created_at: new Date().toISOString()
            };
            await window.supabaseClient.from('sistema_logs').insert([logEntry]);
        } catch (err) {
            // Silencioso por seguridad
        }
    }

    // ==========================================
    // ✅ 2. GENERADOR DE NÚMERO DE DENUNCIA
    // ==========================================
    function generarNumeroDenuncia() {
        const fecha = new Date();
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `CPNB-${yyyy}${mm}${dd}-${random}`;
    }

    // ==========================================
    // ✅ 3. LISTA COMPLETA DE PAÍSES PARA TELÉFONO
    // ==========================================
    const paisesTelefono = [
        { codigo: "+58", pais: "Venezuela" },
        { codigo: "+57", pais: "Colombia" },
        { codigo: "+54", pais: "Argentina" },
        { codigo: "+56", pais: "Chile" },
        { codigo: "+51", pais: "Perú" },
        { codigo: "+593", pais: "Ecuador" },
        { codigo: "+591", pais: "Bolivia" },
        { codigo: "+595", pais: "Paraguay" },
        { codigo: "+598", pais: "Uruguay" },
        { codigo: "+507", pais: "Panamá" },
        { codigo: "+506", pais: "Costa Rica" },
        { codigo: "+504", pais: "Honduras" },
        { codigo: "+503", pais: "El Salvador" },
        { codigo: "+502", pais: "Guatemala" },
        { codigo: "+505", pais: "Nicaragua" },
        { codigo: "+52", pais: "México" },
        { codigo: "+53", pais: "Cuba" },
        { codigo: "+1", pais: "Estados Unidos" },
        { codigo: "+1", pais: "Canadá" },
        { codigo: "+34", pais: "España" },
        { codigo: "+351", pais: "Portugal" },
        { codigo: "+39", pais: "Italia" },
        { codigo: "+33", pais: "Francia" },
        { codigo: "+49", pais: "Alemania" },
        { codigo: "+44", pais: "Reino Unido" },
        { codigo: "+86", pais: "China" },
        { codigo: "+91", pais: "India" },
        { codigo: "+81", pais: "Japón" },
        { codigo: "+55", pais: "Brasil" }
    ];

    const isoMap = {
        "Venezuela": "ve", "Colombia": "co", "Argentina": "ar", "Chile": "cl", "Perú": "pe",
        "Ecuador": "ec", "Bolivia": "bo", "Paraguay": "py", "Uruguay": "uy", "Panamá": "pa",
        "Costa Rica": "cr", "Honduras": "hn", "El Salvador": "sv", "Guatemala": "gt", "Nicaragua": "ni",
        "México": "mx", "Cuba": "cu", "Estados Unidos": "us", "Canadá": "ca", "España": "es",
        "Portugal": "pt", "Italia": "it", "Francia": "fr", "Alemania": "de", "Reino Unido": "gb",
        "China": "cn", "India": "in", "Japón": "jp", "Brasil": "br"
    };

    // ==========================================
    // 🔹 INICIALIZACIÓN DEL MÓDULO
    // ==========================================
    function iniciarModulo(intentos = 0) {
        const form = document.getElementById('form-reg-denuncias');
        const btn = form?.querySelector('.btn-submit');
        const msg = document.getElementById('msg-reg-denuncias');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        const nativeSelect = document.getElementById('d_tlf_pais');
        const displayBox = document.querySelector('.phone-display');
        const optionsBox = document.querySelector('.phone-options');
        const flagImg = document.getElementById('d-tlf-flag-img');
        const codeText = document.getElementById('d-tlf-code-text');
        const countryText = document.getElementById('d-tlf-country-text');

        if (!form || !btn) {
            if (intentos < 10) {
                setTimeout(() => iniciarModulo(intentos + 1), 100);
                return;
            }
            return;
        }

        // Configurar fecha y hora actual
        const fechaInput = document.getElementById('d_fecha_hora');
        if (fechaInput) {
            const ahora = new Date();
            fechaInput.value = ahora.toLocaleString('es-VE', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }

        // ==========================================
        // ✅ POBLAR DROPDOWN DE PAÍSES AUTOMÁTICAMENTE
        // ==========================================
        if (nativeSelect) {
            nativeSelect.innerHTML = '<option value="">Seleccione país...</option>';
            paisesTelefono.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.codigo;
                opt.textContent = `${p.pais} (${p.codigo})`;
                nativeSelect.appendChild(opt);
            });
        }

        // Documentos únicos
        const docsUnicos = [
            { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
            { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
            { id: 'medida_proteccion', label: '🛡️ Medida de Protección' }
        ];

        // Documentos múltiples
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

        // Limpiar contenedores
        const contenedorUnicos = document.getElementById('docs-unicos-container');
        const contenedorMultiples = document.getElementById('docs-multiples-container');
        if (contenedorUnicos) contenedorUnicos.innerHTML = '';
        if (contenedorMultiples) contenedorMultiples.innerHTML = '';

        // Generar documentos únicos en DOM
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
                </div>
                `;
                contenedorUnicos.appendChild(div);
            });
        }

        // Generar documentos múltiples en DOM
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
                </div>
                `;
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
                archivosUnicos[docId] = input.files[0];
                statusDiv.innerHTML = `
                <div class="file-loaded">
                    <span>✅</span>
                    <span class="file-name">${input.files[0].name}</span>
                    <button type="button" class="btn-remove" onclick="quitarDocUnico('${docId}')">❌ Quitar</button>
                </div>
                `;
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
                alert(`Máximo ${max} archivos permitidos`);
                return;
            }
            let agregados = 0;
            for (const file of input.files) {
                if (agregados >= disponibles) break;
                if (file.type === 'application/pdf') {
                    archivosMultiples[docId].push(file);
                    agregados++;
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
                </div>
                `;
                listDiv.appendChild(item);
            });
            countDiv.textContent = `${archivosMultiples[docId].length} de ${max} archivos`;
        }

        window.quitarMultiple = function(docId, index, max) {
            archivosMultiples[docId].splice(index, 1);
            actualizarListaMultiples(docId, max);
        };

        // ==========================================
        // 🔹 DROPDOWN DE BANDERAS (ACTUALIZADO)
        // ==========================================
        if (nativeSelect && displayBox && optionsBox) {
            optionsBox.innerHTML = '';
            Array.from(nativeSelect.options).forEach(opt => {
                if (!opt.value) return;
                const iso = isoMap[opt.textContent.split('(')[0].trim()] || opt.value.replace('+','').toLowerCase();
                const div = document.createElement('div');
                div.className = 'phone-option';
                div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country" style="color:#475569;font-size:0.8rem;">${opt.textContent.split('(')[0].trim()}</span>`;
                div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:0.15s;';
                div.onmouseenter = () => div.style.background = '#f8fafc';
                div.onmouseleave = () => div.style.background = '';
                div.addEventListener('click', () => {
                    nativeSelect.value = opt.value;
                    flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                    codeText.textContent = opt.value;
                    countryText.textContent = opt.textContent.split('(')[0].trim();
                    optionsBox.style.display = 'none';
                });
                optionsBox.appendChild(div);
            });
            
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

        // ==========================================
        // ENVÍO DEL FORMULARIO
        // ==========================================
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Validar documentos únicos marcados como Sí
            for (const doc of docsUnicos) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    if (!archivosUnicos[doc.id]) {
                        if (msg) {
                            msg.textContent = `⚠️ Debe subir un PDF para: ${doc.label}`;
                            msg.className = 'msg error';
                            msg.style.display = 'block';
                        }
                        return;
                    }
                }
            }

            // Validar documentos múltiples marcados como Sí
            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    if (!archivosMultiples[doc.id] || archivosMultiples[doc.id].length === 0) {
                        if (msg) {
                            msg.textContent = `⚠️ Debe subir al menos un PDF para: ${doc.label}`;
                            msg.className = 'msg error';
                            msg.style.display = 'block';
                        }
                        return;
                    }
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

                // Preparar datos
                const tlfPais = document.getElementById('d_tlf_pais')?.value;
                const tlfNum = document.getElementById('d_tlf_num')?.value.trim().replace(/\D/g, '');
                
                const data = {
                    numero_denuncia: generarNumeroDenuncia(), // ✅ NUEVO: Genera el número automáticamente
                    estacion_policial: document.getElementById('d_estacion')?.value,
                    primer_nombre: document.getElementById('d_nombre1')?.value.trim(),
                    segundo_nombre: document.getElementById('d_nombre2')?.value.trim() || null,
                    primer_apellido: document.getElementById('d_apellido1')?.value.trim(),
                    segundo_apellido: document.getElementById('d_apellido2')?.value.trim() || null,
                    tlf_pais: tlfPais || null,
                    tlf_numero: tlfNum || null,
                    direccion: document.getElementById('d_direccion')?.value.trim() || null,
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

                // ✅ REGISTRAR LOG DE CREACIÓN DE DENUNCIA
                await registrarLog('CREAR', 'DENUNCIAS', {
                    numero_denuncia: data.numero_denuncia,
                    nombre_completo: `${data.primer_nombre || ''} ${data.primer_apellido || ''}`.trim() || 'N/A',
                    estacion_policial: data.estacion_policial || 'N/A',
                    accion_detalle: 'Nueva denuncia registrada en el sistema'
                });

                if (msg) {
                    msg.textContent = `✅ Denuncia registrada exitosamente. N° ${data.numero_denuncia}`;
                    msg.className = 'msg success';
                    msg.style.display = 'block';
                    setTimeout(() => msg.style.display = 'none', 5000);
                }

                // Resetear formulario
                form.reset();
                const fechaInputReset = document.getElementById('d_fecha_hora');
                if (fechaInputReset) {
                    const ahora = new Date();
                    fechaInputReset.value = ahora.toLocaleString('es-VE', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                }

                // Resetear documentos
                docsUnicos.forEach(d => {
                    archivosUnicos[d.id] = null;
                    const status = document.getElementById(`status-${d.id}`);
                    if (status) status.innerHTML = '';
                });
                docsMultiples.forEach(d => {
                    archivosMultiples[d.id] = [];
                    actualizarListaMultiples(d.id, d.max);
                });

                // Resetear teléfono
                if (nativeSelect) nativeSelect.value = '';
                if (flagImg) flagImg.src = 'https://flagcdn.com/w20/xx.png';
                if (codeText) codeText.textContent = '+XX';
                if (countryText) countryText.textContent = 'País';

            } catch (err) {
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
    }

    // 🔹 INICIAR EL MÓDULO
    iniciarModulo();
};

// Auto-inicialización de respaldo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initRegDenuncias);
} else {
    window.initRegDenuncias();
}
