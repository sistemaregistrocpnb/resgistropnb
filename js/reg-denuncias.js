window.initRegDenuncias = function() {
    console.log("⚙️ Iniciando módulo reg-denuncias.js...");

    // Configurar fecha y hora actual
    const fechaInput = document.getElementById('d_fecha_hora');
    if (fechaInput) {
        const ahora = new Date();
        fechaInput.value = ahora.toLocaleString('es-VE', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
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

    // Generar documentos únicos
    const contenedorUnicos = document.getElementById('docs-unicos-container');
    if (contenedorUnicos) {
        docsUnicos.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label}</label>
                    <div class="doc-toggle">
                        <label>¿Cargar?</label>
                        <input type="checkbox" id="toggle_${doc.id}" onchange="toggleDocUnico('${doc.id}')">
                    </div>
                </div>
                <div class="doc-upload-area" id="upload_${doc.id}">
                    <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" onchange="cargarDocUnico('${doc.id}', this)">
                    <div id="status_${doc.id}"></div>
                </div>
            `;
            contenedorUnicos.appendChild(div);
        });
    }

    // Generar documentos múltiples
    const contenedorMultiples = document.getElementById('docs-multiples-container');
    if (contenedorMultiples) {
        docsMultiples.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-header">
                    <label>${doc.label} <span style="font-size:0.75rem; color:#64748b;">(Máximo ${doc.max})</span></label>
                </div>
                <input type="file" id="file_${doc.id}" accept=".pdf,application/pdf" multiple>
                <button type="button" class="btn-add-file" onclick="agregarMultiples('${doc.id}', ${doc.max})">➕ Agregar archivos</button>
                <div class="file-count" id="count_${doc.id}">0 archivos cargados</div>
                <div id="list_${doc.id}" style="margin-top: 8px;"></div>
            `;
            contenedorMultiples.appendChild(div);
        });
    }

    // Funciones globales
    window.toggleDocUnico = function(docId) {
        const checkbox = document.getElementById(`toggle_${docId}`);
        const uploadArea = document.getElementById(`upload_${docId}`);
        if (checkbox.checked) {
            uploadArea.classList.add('active');
        } else {
            uploadArea.classList.remove('active');
            archivosUnicos[docId] = null;
            document.getElementById(`status_${docId}`).innerHTML = '';
            document.getElementById(`file_${docId}`).value = '';
        }
    };

    window.cargarDocUnico = function(docId, input) {
        const statusDiv = document.getElementById(`status_${docId}`);
        if (input.files && input.files[0]) {
            archivosUnicos[docId] = input.files[0];
            statusDiv.innerHTML = `
                <div class="file-loaded">
                    <span>📄</span>
                    <span class="file-name">${input.files[0].name}</span>
                    <button type="button" class="btn-remove" onclick="quitarDocUnico('${docId}')">❌</button>
                </div>
            `;
        }
    };

    window.quitarDocUnico = function(docId) {
        archivosUnicos[docId] = null;
        document.getElementById(`status_${docId}`).innerHTML = '';
        document.getElementById(`file_${docId}`).value = '';
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
        const listDiv = document.getElementById(`list_${docId}`);
        const countDiv = document.getElementById(`count_${docId}`);
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

        countDiv.textContent = `${archivosMultiples[docId].length} archivos cargados`;
    }

    window.quitarMultiple = function(docId, index, max) {
        archivosMultiples[docId].splice(index, 1);
        actualizarListaMultiples(docId, max);
    };

    // Dropdown de banderas
    const nativeSelect = document.getElementById('d_tlf_pais');
    const displayBox = document.querySelector('.phone-display');
    const optionsBox = document.querySelector('.phone-options');
    const flagImg = document.getElementById('d-tlf-flag-img');
    const codeText = document.getElementById('d-tlf-code-text');
    const countryText = document.getElementById('d-tlf-country-text');

    const isoMap = { "Venezuela":"ve", "Estados Unidos":"us", "Colombia":"co", "México":"mx", "España":"es" };

    if (optionsBox && nativeSelect && displayBox) {
        optionsBox.innerHTML = '';
        Array.from(nativeSelect.options).forEach(opt => {
            if (!opt.value) return;
            const iso = isoMap[opt.text] || 'xx';
            const div = document.createElement('div');
            div.className = 'phone-option';
            div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png"><span class="code">${opt.value}</span><span class="country">${opt.text}</span>`;
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
            if (!e.target.closest('.phone-dropdown-wrapper')) {
                optionsBox.style.display = 'none';
            }
        });
    }

    // Envío del formulario
    const form = document.getElementById('form-reg-denuncias');
    const btn = form?.querySelector('.btn-submit');
    const msg = document.getElementById('msg-reg-denuncias');
    const loadingOverlay = document.getElementById('loading-overlay');

    if (!form || !btn) {
        console.error('❌ Formulario no encontrado');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
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
                if (archivosUnicos[doc.id]) {
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
                const urls = [];
                for (let i = 0; i < archivosMultiples[doc.id].length; i++) {
                    const path = `${uid}/${ts}_${doc.id}_${i}.pdf`;
                    const { error } = await bucket.upload(path, archivosMultiples[doc.id][i], { contentType: 'application/pdf' });
                    if (error) throw new Error(`Error subiendo ${doc.label}[${i}]: ${error.message}`);
                    urls.push(bucket.getPublicUrl(path).data.publicUrl);
                }
                docsMultiplesUrls[doc.id] = urls.length > 0 ? urls : null;
            }

            // Preparar datos
            const tlfPais = document.getElementById('d_tlf_pais')?.value;
            const tlfNum = document.getElementById('d_tlf_num')?.value.trim().replace(/\D/g, '');

            const data = {
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

            if (msg) {
                msg.textContent = '✅ Denuncia registrada exitosamente.';
                msg.className = 'msg success';
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 4000);
            }

            form.reset();
            
            // Resetear fecha
            if (fechaInput) {
                const ahora = new Date();
                fechaInput.value = ahora.toLocaleString('es-VE', { 
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            }

            // Resetear documentos
            docsUnicos.forEach(d => {
                archivosUnicos[d.id] = null;
                document.getElementById(`toggle_${d.id}`).checked = false;
                document.getElementById(`upload_${d.id}`).classList.remove('active');
                document.getElementById(`status_${d.id}`).innerHTML = '';
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
};

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initRegDenuncias);
} else {
    window.initRegDenuncias();
}
