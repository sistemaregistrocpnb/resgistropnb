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
    
    // [Código de generación de DOM y funciones UI igual que antes...]
    // (Mantén todo el código de UI que ya tienes: toggleDocField, mostrarArchivoCargado, etc.)
    
    // ==========================================
    // ✅ ENVÍO DEL FORMULARIO - VERSIÓN FINAL CORREGIDA
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
                
                // ✅ INSERCIÓN FINAL - Solo columnas que existen
                const dataOriginal = registroSeleccionado.datos;
                
                // Preparar documentos múltiples
                const documentosMultiplesSubidos = {};
                
                // entrevista_multi NO existe en tabla, se guarda en datos_originales
                const radioEntrevistaMulti = document.querySelector(`input[name="doc_entrevista_multi"]:checked`);
                if (radioEntrevistaMulti && radioEntrevistaMulti.value === 'si' && archivosMultiples['entrevista_multi'].length > 0) {
                    documentosMultiplesSubidos['entrevista_multi'] = await subirPDFsMultiples('entrevista_multi');
                } else {
                    documentosMultiplesSubidos['entrevista_multi'] = [];
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
                        documentos_multiples_adicionales: documentosMultiplesSubidos
                    },
                    estatus: 'Procesado'
                };
                
                // Si es persona o vinculado, guardar cédula
                if (registroSeleccionado.origen === 'registro_personas' || registroSeleccionado.origen === 'registro_vinculado') {
                    dataToInsert.cedula = dataOriginal.cedula;
                }
                
                // ✅ Documentos únicos - TODOS COMO ARRAYS
                for (const doc of docsUnicos) {
                    const radio = document.querySelector(`input[name="doc_${doc.id}"]:checked`);
                    if (radio && radio.value === 'si') {
                        const url = await subirPDF(`file_${doc.id}`, doc.id);
                        dataToInsert[doc.id] = url ? [url] : []; // ✅ ARRAY
                    } else {
                        dataToInsert[doc.id] = []; // ✅ ARRAY vacío
                    }
                }
                
                // ✅ Documentos múltiples que SÍ existen en la tabla
                // cadena_custodia
                const radioCadena = document.querySelector(`input[name="doc_cadena_custodia"]:checked`);
                if (radioCadena && radioCadena.value === 'si' && archivosMultiples['cadena_custodia'].length > 0) {
                    dataToInsert.cadena_custodia = await subirPDFsMultiples('cadena_custodia');
                } else {
                    dataToInsert.cadena_custodia = [];
                }
                
                // inspecciones_tecnicas
                const radioInspeccion = document.querySelector(`input[name="doc_inspecciones_tecnicas"]:checked`);
                if (radioInspeccion && radioInspeccion.value === 'si' && archivosMultiples['inspecciones_tecnicas'].length > 0) {
                    dataToInsert.inspecciones_tecnicas = await subirPDFsMultiples('inspecciones_tecnicas');
                } else {
                    dataToInsert.inspecciones_tecnicas = [];
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
