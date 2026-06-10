window.initRegProcesados = function() {
    console.log("✅ Módulo reg-procesados.js cargado correctamente.");
    
    // ==========================================
    // LISTAS DE DOCUMENTOS
    // ==========================================
    const docsUnicos = [
        { id: 'portada', label: '📑 Portada' },
        { id: 'oficio_remision', label: '📨 Oficio de Remisión' },
        { id: 'acta_denuncia', label: '📝 Acta de Denuncia' },
        { id: 'entrevista', label: '🎤 Entrevista' },
        { id: 'datos_filiatorios', label: '📋 Datos Filiatorios' },
        { id: 'acta_policial', label: '📋 Acta Policial' },
        { id: 'derechos_imputado', label: '⚖️ Derechos del Imputado' },
        { id: 'evaluacion_medica', label: '🏥 Evaluación Médica' },
        { id: 'identificacion_cedula', label: '🆔 Identificación (Cédula)' },
        { id: 'solicitud_examen_forense', label: '🔬 Solicitud de Examen Forense' },
        { id: 'resultados_examen_forense', label: '🔬 Resultados del Examen Forense' },
        { id: 'asistencia_comdepro', label: '🤝 Asistencia de Comdepro' },
        { id: 'remision_estacionamiento', label: '🚗 Remisión a Estacionamiento' },
        { id: 'planilla_pvr', label: '🚙 Planilla de Revisión de Vehículo (PVR)' },
        { id: 'otros_documentos', label: '📎 Otros Documentos' }
    ];
    
    const docsMultiples = [
        { id: 'entrevista_multi', label: '🎤 Entrevistas (Múltiples)', max: 10, min: 1 },
        { id: 'cadena_custodia', label: '🔗 Cadena de Custodia', max: 10, min: 1 },
        { id: 'inspecciones_tecnicas', label: '🔍 Inspecciones Técnicas', max: 10, min: 1 }
    ];
    
    const archivosMultiples = {};
    docsMultiples.forEach(d => archivosMultiples[d.id] = []);
    
    // [El resto del código de generación de DOM y funciones UI permanece igual...]
    
    // ==========================================
    // ✅ ENVÍO DEL FORMULARIO CON OVERLAY
    // ==========================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!registroSeleccionado) {
                return mostrarMsg(msgForm, '❌ Debe buscar y seleccionar un registro primero.', 'error');
            }
            
            const tipoDelito = document.getElementById('proc_tipo_delito').value.trim();
            if (!tipoDelito) {
                return mostrarMsg(msgForm, '⚠️ El tipo de delito es obligatorio.', 'error');
            }
            
            // Validar documentos únicos
            for (const doc of docsUnicos) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    const fileInput = document.getElementById(`file_${doc.id}`);
                    if (!fileInput.files || fileInput.files.length === 0) {
                        return mostrarMsg(msgForm, `⚠️ Debe subir un PDF para: ${doc.label}`, 'error');
                    }
                }
            }
            
            // Validar documentos múltiples
            for (const doc of docsMultiples) {
                const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                if (radio && radio.value === 'si') {
                    if (archivosMultiples[doc.id].length < doc.min) {
                        return mostrarMsg(msgForm, `❌ Debe subir al menos ${doc.min} PDF para: ${doc.label}`, 'error');
                    }
                }
            }
            
            // ✅ MOSTRAR OVERLAY DE CARGA
            mostrarOverlay('⏳ Procesando y subiendo archivos...');
            
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                const procesadoPor = user?.email || 'usuario@sistema';
                const bucket = window.supabaseClient.storage.from('procesados_documentos');
                const uid = sessionStorage.getItem('pnb_user_id') || 'user';
                const ts = Date.now();
                
                // Subir PDF único
                const subirPDF = async (fileInputId, suffix) => {
                    const fileInput = document.getElementById(fileInputId);
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                        const file = fileInput.files[0];
                        const path = `${uid}/${ts}_${suffix}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${suffix}: ${error.message}`);
                        return bucket.getPublicUrl(path).data.publicUrl;
                    }
                    return null;
                };
                
                // Subir PDFs múltiples
                const subirPDFsMultiples = async (campo) => {
                    const urls = [];
                    for (let i = 0; i < archivosMultiples[campo].length; i++) {
                        const file = archivosMultiples[campo][i];
                        const path = `${uid}/${ts}_${campo}_${i}.pdf`;
                        const { error } = await bucket.upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });
                        if (error) throw new Error(`Error subiendo ${campo}[${i}]: ${error.message}`);
                        urls.push(bucket.getPublicUrl(path).data.publicUrl);
                    }
                    return urls;
                };
                
                // ✅ INSERCIÓN CORREGIDA - Solo campos que existen en la tabla
                const dataOriginal = registroSeleccionado.datos;
                
                // Preparar objeto con documentos múltiples (se guardará en datos_originales)
                const documentosMultiplesSubidos = {};
                for (const doc of docsMultiples) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si' && archivosMultiples[doc.id].length > 0) {
                        documentosMultiplesSubidos[doc.id] = await subirPDFsMultiples(doc.id);
                    } else {
                        documentosMultiplesSubidos[doc.id] = [];
                    }
                }
                
                const dataToInsert = {
                    tabla_origen: registroSeleccionado.origen,
                    registro_id: registroSeleccionado.id,
                    tipo_registro: registroSeleccionado.tipoRegistro || '',
                    identificador_principal: document.getElementById('proc_identificador').value,
                    tipo_delito: tipoDelito,
                    procesado_por: procesadoPor,
                    observaciones: document.getElementById('proc_observaciones').value.trim() || null,
                    datos_originales: {
                        ...dataOriginal,
                        documentos_multiples: documentosMultiplesSubidos
                    },
                    estatus: 'Procesado'
                };
                
                // Documentos únicos (estas columnas SÍ existen)
                for (const doc of docsUnicos) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si') {
                        dataToInsert[doc.id] = await subirPDF(`file_${doc.id}`, doc.id);
                    } else {
                        dataToInsert[doc.id] = null;
                    }
                }
                
                // 1. Insertar en registro_procesados
                const { error: insErr } = await window.supabaseClient
                    .from('registro_procesados')
                    .insert([dataToInsert]);
                
                if (insErr) throw new Error(`Error al registrar procesado: ${insErr.message}`);
                
                // 2. Cambiar estatus del registro original
                const { error: updErr } = await window.supabaseClient
                    .from(registroSeleccionado.origen)
                    .update({ estatus: 'Procesado' })
                    .eq('id', registroSeleccionado.id);
                
                if (updErr) throw new Error(`Error al cambiar estatus: ${updErr.message}`);
                
                // ✅ OCULTAR OVERLAY - ÉXITO
                ocultarOverlay();
                
                mostrarMsg(msgForm, '✅ Procesado registrado exitosamente. El estatus del registro original cambió a "Procesado".', 'success');
                
                setTimeout(() => {
                    form.style.display = 'none';
                    datosPanel.style.display = 'none';
                    inputBusqueda.value = '';
                    msgBusqueda.style.display = 'none';
                    registroSeleccionado = null;
                    form.reset();
                    
                    docsMultiples.forEach(d => {
                        archivosMultiples[d.id] = [];
                        actualizarListaArchivos(d.id, d.max);
                    });
                    
                    document.querySelectorAll('.doc-upload-area').forEach(area => area.classList.remove('active'));
                    document.querySelectorAll('.file-status-container').forEach(c => c.innerHTML = '');
                    
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 5000);
                
            } catch (err) {
                console.error('Error al procesar:', err);
                // ✅ OCULTAR OVERLAY - ERROR
                ocultarOverlay();
                mostrarMsg(msgForm, '❌ Error: ' + err.message, 'error');
            }
        });
    }
    
    console.log("✅ Módulo reg-procesados.js inicializado correctamente");
};
