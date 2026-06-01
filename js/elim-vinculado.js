window.initElimVinculado = function() {
    console.log("✅ Módulo elim-vinculado.js cargado.");

    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-vinc-elim');
    const buscarBtn = document.getElementById('btn-buscar-vinc-elim');
    const msgBuscar = document.getElementById('buscar-msg-vinc');
    const archivedNotice = document.getElementById('archived-notice-vinc');
    const dataContainer = document.getElementById('vinc-data-container');
    const archivedBanner = document.getElementById('archived-banner-vinc');
    const btnEliminar = document.getElementById('btn-eliminar-vinc');
    const btnReintegrar = document.getElementById('btn-reintegrar-vinc');
    const msgElim = document.getElementById('msg-vinc');
    const modal = document.getElementById('vinc-modal');
    const modalTitle = document.getElementById('modal-title-vinc');
    const modalText = document.getElementById('modal-text-vinc');
    const btnModalYes = document.getElementById('btn-modal-yes-vinc');
    const btnModalNo = document.getElementById('btn-modal-no-vinc');

    let currentData = null;
    let currentId = null;
    let pendingAction = null;

    // 🔹 Funciones utilitarias
    const showMsg = (el, txt, type) => { 
        el.textContent = txt; 
        el.className = `search-msg ${type}`; 
        el.style.display = 'block'; 
    };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const showMsgElim = (txt, type) => { 
        msgElim.innerHTML = txt; 
        msgElim.className = `msg ${type}`; 
        msgElim.style.display = 'block'; 
    };
    const hideMsgElim = () => { msgElim.style.display = 'none'; };
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-';
    };
    
    const showField = (id) => { const el = document.getElementById(id); if(el) el.style.display = 'block'; };
    const hideField = (id) => { const el = document.getElementById(id); if(el) el.style.display = 'none'; };
    
    const setPhoto = (imgId, url) => {
        const img = document.getElementById(imgId);
        if (!img) return;
        img.src = url || '';
        img.style.display = url ? 'block' : 'none';
    };

    // 🔹 Renderizar UI con los datos
    function renderUI(data, isArchived) {
        // ===== FOTOS PERSONA =====
        setPhoto('ev-foto-p-frontal', data.foto_frontal_persona);
        setPhoto('ev-foto-p-izq', data.foto_perfil_izq_persona);
        setPhoto('ev-foto-p-der', data.foto_perfil_der_persona);
        
        // ===== DATOS PERSONA =====
        setVal('ev-p-n1', data.primer_nombre);
        setVal('ev-p-n2', data.segundo_nombre);
        setVal('ev-p-a1', data.primer_apellido);
        setVal('ev-p-a2', data.segundo_apellido);
        setVal('ev-p-cedula', data.cedula);
        setVal('ev-p-apodo', data.apodo);
        setVal('ev-p-fnac', data.fecha_nacimiento);
        setVal('ev-p-edad', data.edad);
        setVal('ev-p-marca', data.marca_corporal);
        setVal('ev-p-nac', data.nacionalidad);
        setVal('ev-p-sexo', data.sexo);
        setVal('ev-p-tlf-pais', data.tlf_pais);
        setVal('ev-p-tlf-num', data.tlf_numero);
        setVal('ev-p-dir', data.direccion);
        
        // Características físicas
        setVal('ev-p-est', data.estatura_cm);
        setVal('ev-p-piel', data.color_piel);
        setVal('ev-p-ojos', data.color_ojos);
        setVal('ev-p-cabello', data.color_cabello);
        setVal('ev-p-comp', data.complexion);
        
        // Salud
        setVal('ev-p-lentes', data.usa_lentes ? 'Sí' : 'No');
        if (data.usa_lentes && data.detalle_lentes) { 
            showField('box-ev-lentes-det'); setVal('ev-p-lentes-det', data.detalle_lentes); 
        } else { hideField('box-ev-lentes-det'); }
        
        setVal('ev-p-perf', data.perforaciones ? 'Sí' : 'No');
        if (data.perforaciones && data.detalle_perforaciones) { 
            showField('box-ev-perf-det'); setVal('ev-p-perf-det', data.detalle_perforaciones); 
        } else { hideField('box-ev-perf-det'); }
        
        setVal('ev-p-cond', data.condicion_medica ? 'Sí' : 'No');
        if (data.condicion_medica) { 
            showField('box-ev-cond-det'); setVal('ev-p-cond-det', data.condicion_medica); 
        } else { hideField('box-ev-cond-det'); }
        
        setVal('ev-p-med', data.consume_medicamento ? 'Sí' : 'No');
        if (data.consume_medicamento) { 
            showField('box-ev-med-det'); setVal('ev-p-med-det', data.consume_medicamento); 
        } else { hideField('box-ev-med-det'); }
        
        setVal('ev-p-jud', data.problema_judicial ? 'Sí' : 'No');
        if (data.problema_judicial) { 
            showField('box-ev-jud-det'); setVal('ev-p-jud-det', data.problema_judicial); 
        } else { hideField('box-ev-jud-det'); }

        // ===== FOTOS VEHÍCULO =====
        setPhoto('ev-foto-v-frontal', data.foto_frontal_vehiculo);
        setPhoto('ev-foto-v-trasera', data.foto_trasera_vehiculo);
        setPhoto('ev-foto-v-der', data.foto_lado_der_vehiculo);
        setPhoto('ev-foto-v-izq', data.foto_lado_izq_vehiculo);

        // ===== DATOS VEHÍCULO =====
        setVal('ev-v-tipo', data.tipo_vehiculo);
        setVal('ev-v-placa', data.placa);
        setVal('ev-v-serial-carro', data.serial_carroceria);
        setVal('ev-v-serial-motor', data.serial_motor);
        setVal('ev-v-cilindraje', data.cilindraje);
        setVal('ev-v-marca', data.marca_vehiculo);
        setVal('ev-v-modelo', data.modelo_vehiculo);
        setVal('ev-v-anio', data.anio_vehiculo);
        setVal('ev-v-color', data.color_vehiculo);

        // ===== DATOS REGISTRO =====
        setVal('ev-estacion', data.estacion_policial);
        setVal('ev-dir-det', data.direccion_detencion);
        setVal('ev-obs', data.observaciones);

        // ===== UI DINÁMICA (activo vs archivado) =====
        if (isArchived) {
            archivedBanner.style.display = 'block';
            archivedNotice.style.display = 'block';
            document.getElementById('archived-date-vinc').textContent = data.eliminado_en 
                ? new Date(data.eliminado_en).toLocaleString('es-VE') 
                : '-';
            document.getElementById('archived-by-vinc').textContent = data.eliminado_por || 'Sistema';
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block';
        } else {
            archivedBanner.style.display = 'none';
            archivedNotice.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 BÚSQUEDA PRINCIPAL (busca por cédula O placa)
    async function buscarRegistro() {
        const val = buscarInput.value.trim().toUpperCase();
        if (val.length < 5) {
            return showMsg(msgBuscar, '⚠️ Ingrese al menos 5 caracteres (cédula o placa)', 'error');
        }
        
        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        hideMsg(msgElim);
        archivedNotice.style.display = 'none';
        
        try {
            // 1. Buscar en tabla activa (por cédula O placa)
            const queryActivo = `cedula.eq.${val},placa.eq.${val}`;
            let { data: activo, error: errActivo } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .or(queryActivo)
                .maybeSingle();
                
            if (errActivo) throw errActivo;

            if (activo) {
                currentData = activo; 
                currentId = activo.id;
                renderUI(activo, false);
                dataContainer.style.display = 'block'; 
                hideMsg(msgBuscar);
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                return;
            }
            
            // 2. Buscar en archivados
            const queryArchivado = `cedula.eq.${val},placa.eq.${val}`;
            let { data: archivado, error: errArch } = await window.supabaseClient
                .from('eliminados_vinculados')
                .select('*')
                .or(queryArchivado)
                .maybeSingle();
                
            if (errArch) throw errArch;

            if (archivado) {
                currentData = archivado; 
                currentId = archivado.id_original || archivado.id;
                renderUI(archivado, true);
                dataContainer.style.display = 'block'; 
                hideMsg(msgBuscar);
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                return;
            }
            
            showMsg(msgBuscar, '❌ No se encontró ningún registro vinculado con ese dato.', 'error');
        } catch (err) {
            console.error('Error búsqueda:', err);
            showMsg(msgBuscar, '❌ Error de conexión: ' + err.message, 'error');
        } finally { 
            buscarBtn.disabled = false; 
        }
    }

    // 🔹 MODAL
    function showModal(titulo, texto, accion, tipo) {
        pendingAction = accion;
        modalTitle.textContent = titulo;
        modalText.innerHTML = texto;
        btnModalYes.className = tipo === 'danger' ? 'btn-modal-danger' : 'btn-modal-success';
        btnModalYes.textContent = tipo === 'danger' ? '✅ Sí, Eliminar' : '✅ Sí, Reintegrar';
        modal.style.display = 'flex';
    }

    function closeModal() { 
        modal.style.display = 'none'; 
        pendingAction = null; 
    }

    async function ejecutarAccion() {
        if (pendingAction === 'delete') await eliminarRegistro();
        else if (pendingAction === 'reintegrate') await reintegrarRegistro();
        closeModal();
    }

    // 🔹 ELIMINAR (Activo → Archivado)
    async function eliminarRegistro() {
        btnEliminar.disabled = true; 
        btnEliminar.textContent = '⏳ Procesando...'; 
        hideMsgElim();
        
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const eliminadoPor = user?.email || 'usuario@sistema';
            
            const dataToArchive = {
                id_original: currentId, 
                eliminado_por: eliminadoPor,
                // Generales
                estatus: currentData.estatus, 
                estacion_policial: currentData.estacion_policial, 
                direccion_detencion: currentData.direccion_detencion,
                observaciones: currentData.observaciones,
                
                // Persona
                primer_nombre: currentData.primer_nombre, 
                segundo_nombre: currentData.segundo_nombre, 
                primer_apellido: currentData.primer_apellido, 
                segundo_apellido: currentData.segundo_apellido,
                cedula: currentData.cedula, 
                fecha_nacimiento: currentData.fecha_nacimiento, 
                edad: currentData.edad,
                apodo: currentData.apodo,
                marca_corporal: currentData.marca_corporal,
                nacionalidad: currentData.nacionalidad,
                sexo: currentData.sexo,
                direccion: currentData.direccion,
                tlf_pais: currentData.tlf_pais,
                tlf_numero: currentData.tlf_numero,
                estatura_cm: currentData.estatura_cm,
                color_piel: currentData.color_piel,
                color_ojos: currentData.color_ojos,
                color_cabello: currentData.color_cabello,
                complexion: currentData.complexion,
                usa_lentes: currentData.usa_lentes,
                detalle_lentes: currentData.detalle_lentes,
                perforaciones: currentData.perforaciones,
                detalle_perforaciones: currentData.detalle_perforaciones,
                condicion_medica: currentData.condicion_medica,
                consume_medicamento: currentData.consume_medicamento,
                problema_judicial: currentData.problema_judicial,
                
                // Fotos Persona
                foto_frontal_persona: currentData.foto_frontal_persona,
                foto_perfil_izq_persona: currentData.foto_perfil_izq_persona,
                foto_perfil_der_persona: currentData.foto_perfil_der_persona,
                
                // Vehículo
                tipo_vehiculo: currentData.tipo_vehiculo,
                placa: currentData.placa,
                serial_carroceria: currentData.serial_carroceria,
                serial_motor: currentData.serial_motor,
                cilindraje: currentData.cilindraje,
                color_vehiculo: currentData.color_vehiculo,
                anio_vehiculo: currentData.anio_vehiculo,
                marca_vehiculo: currentData.marca_vehiculo,
                modelo_vehiculo: currentData.modelo_vehiculo,
                
                // Fotos Vehículo
                foto_frontal_vehiculo: currentData.foto_frontal_vehiculo,
                foto_trasera_vehiculo: currentData.foto_trasera_vehiculo,
                foto_lado_der_vehiculo: currentData.foto_lado_der_vehiculo,
                foto_lado_izq_vehiculo: currentData.foto_lado_izq_vehiculo
            };
            
            const { error: insErr } = await window.supabaseClient.from('eliminados_vinculados').insert([dataToArchive]);
            if (insErr) throw new Error('Error archivando: ' + insErr.message);
            
            const { data: delData, error: delErr } = await window.supabaseClient
                .from('registro_vinculado')
                .delete()
                .eq('id', currentData.id)
                .select('id');
                
            if (delErr) throw new Error('Error eliminando: ' + delErr.message);
            if (!delData || delData.length === 0) throw new Error('No se encontró el registro para eliminar.');
            
            showMsgElim('✅ <strong>Registro eliminado y archivado correctamente.</strong>', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsgElim(); 
                archivedNotice.style.display = 'none'; 
            }, 4000);
            
        } catch (err) {
            console.error('Error eliminando:', err);
            showMsgElim('❌ ' + err.message, 'error');
        } finally { 
            btnEliminar.disabled = false; 
            btnEliminar.textContent = '🗑️ Eliminar Registro Vinculado'; 
        }
    }

    // 🔹 REINTEGRAR (Archivado → Activo)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true; 
        btnReintegrar.textContent = '⏳ Procesando...'; 
        hideMsgElim();
        
        try {
            const dataToRestore = {
                estatus: currentData.estatus, 
                estacion_policial: currentData.estacion_policial, 
                direccion_detencion: currentData.direccion_detencion,
                observaciones: currentData.observaciones,
                
                primer_nombre: currentData.primer_nombre, 
                segundo_nombre: currentData.segundo_nombre, 
                primer_apellido: currentData.primer_apellido, 
                segundo_apellido: currentData.segundo_apellido,
                cedula: currentData.cedula, 
                fecha_nacimiento: currentData.fecha_nacimiento, 
                edad: currentData.edad,
                apodo: currentData.apodo,
                marca_corporal: currentData.marca_corporal,
                nacionalidad: currentData.nacionalidad,
                sexo: currentData.sexo,
                direccion: currentData.direccion,
                tlf_pais: currentData.tlf_pais,
                tlf_numero: currentData.tlf_numero,
                estatura_cm: currentData.estatura_cm,
                color_piel: currentData.color_piel,
                color_ojos: currentData.color_ojos,
                color_cabello: currentData.color_cabello,
                complexion: currentData.complexion,
                usa_lentes: currentData.usa_lentes,
                detalle_lentes: currentData.detalle_lentes,
                perforaciones: currentData.perforaciones,
                detalle_perforaciones: currentData.detalle_perforaciones,
                condicion_medica: currentData.condicion_medica,
                consume_medicamento: currentData.consume_medicamento,
                problema_judicial: currentData.problema_judicial,
                
                foto_frontal_persona: currentData.foto_frontal_persona,
                foto_perfil_izq_persona: currentData.foto_perfil_izq_persona,
                foto_perfil_der_persona: currentData.foto_perfil_der_persona,
                
                tipo_vehiculo: currentData.tipo_vehiculo,
                placa: currentData.placa,
                serial_carroceria: currentData.serial_carroceria,
                serial_motor: currentData.serial_motor,
                cilindraje: currentData.cilindraje,
                color_vehiculo: currentData.color_vehiculo,
                anio_vehiculo: currentData.anio_vehiculo,
                marca_vehiculo: currentData.marca_vehiculo,
                modelo_vehiculo: currentData.modelo_vehiculo,
                
                foto_frontal_vehiculo: currentData.foto_frontal_vehiculo,
                foto_trasera_vehiculo: currentData.foto_trasera_vehiculo,
                foto_lado_der_vehiculo: currentData.foto_lado_der_vehiculo,
                foto_lado_izq_vehiculo: currentData.foto_lado_izq_vehiculo
            };
            
            const { error: insErr } = await window.supabaseClient.from('registro_vinculado').insert([dataToRestore]);
            if (insErr) throw new Error('Error restaurando: ' + insErr.message);
            
            await window.supabaseClient.from('eliminados_vinculados').delete().eq('id', currentData.id);
            
            showMsgElim('✅ <strong>Registro reintegrado al sistema activo.</strong>', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsgElim(); 
                archivedNotice.style.display = 'none'; 
            }, 4000);
            
        } catch (err) {
            console.error('Error reintegrando:', err);
            let msg = 'Error al reintegrar.';
            if (err.message.includes('23505') || err.message.includes('unique')) {
                msg = '❌ Esta cédula o placa ya existe en el sistema activo.';
            } else {
                msg = '❌ ' + err.message;
            }
            showMsgElim(msg, 'error');
        } finally { 
            btnReintegrar.disabled = false; 
            btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo'; 
        }
    }

    // 🔹 LISTENERS
    buscarBtn.addEventListener('click', buscarRegistro);
    buscarInput.addEventListener('keydown', e => { 
        if (e.key === 'Enter') { e.preventDefault(); buscarRegistro(); } 
    });
    
    btnEliminar.addEventListener('click', () => {
        if (!currentData) return;
        const nombreCompleto = `${currentData.primer_nombre || ''} ${currentData.primer_apellido || ''}`.trim() || 'Sin nombre';
        showModal(
            '⚠️ Confirmar Eliminación', 
            `¿Eliminar el registro vinculado de <strong>${nombreCompleto}</strong> (C.I: ${currentData.cedula || '-'}) con ${currentData.tipo_vehiculo || 'vehículo'} placa <strong>${currentData.placa || '-'}</strong>?<br><br>Se archivará permanentemente y podrá reintegrarse después si es necesario.`, 
            'delete', 
            'danger'
        );
    });
    
    btnReintegrar.addEventListener('click', () => {
        if (!currentData) return;
        const nombreCompleto = `${currentData.primer_nombre || ''} ${currentData.primer_apellido || ''}`.trim() || 'Sin nombre';
        showModal(
            '♻️ Confirmar Reintegración', 
            `¿Reintegrar al sistema activo el registro de <strong>${nombreCompleto}</strong> (C.I: ${currentData.cedula || '-'}) con ${currentData.tipo_vehiculo || 'vehículo'} placa <strong>${currentData.placa || '-'}</strong>?`, 
            'reintegrate', 
            'success'
        );
    });
    
    btnModalYes.addEventListener('click', ejecutarAccion);
    btnModalNo.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
};
