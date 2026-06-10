window.initElimPersonas = function() {
    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-cedula-elim');
    const buscarBtn = document.getElementById('btn-buscar-elim');
    const msgBuscar = document.getElementById('buscar-msg-elim');
    const archivedNotice = document.getElementById('archived-notice');
    const dataContainer = document.getElementById('elim-data-container');
    const archivedBanner = document.getElementById('archived-banner');
    const btnEliminar = document.getElementById('btn-eliminar');
    const btnReintegrar = document.getElementById('btn-reintegrar');
    const msgElim = document.getElementById('msg-elim');
    const modal = document.getElementById('elim-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const btnModalYes = document.getElementById('btn-modal-yes');
    const btnModalNo = document.getElementById('btn-modal-no');

    let currentData = null;
    let currentId = null;
    let pendingAction = null;

    const showMsg = (el, txt, type) => { el.textContent = txt; el.className = `search-msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const showMsgElim = (txt, type) => { msgElim.textContent = txt; msgElim.className = `msg ${type}`; msgElim.style.display = 'block'; };
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
// ✅ CORREGIDO: Función para registrar en la tabla sistema_logs
// Ahora consulta la tabla perfiles_usuario para obtener el nombre real
async function registrarLog(accion, modulo, detalles) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        // 🔍 Consultamos la tabla perfiles_usuario para obtener el nombre real
        let nombreUsuario = user.email || 'Sistema'; // Fallback por si falla
        try {
            const { data: perfil } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nombre, apellido')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (perfil) {
                nombreUsuario = `${perfil.nombre} ${perfil.apellido}`.trim();
            }
        } catch (err) {
            console.warn('No se pudo obtener el perfil del usuario para el log:', err);
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

        const { error } = await window.supabaseClient.from('sistema_logs').insert([logEntry]);
        if (error) console.error('Error al registrar log:', error);
    } catch (err) {
        console.error('Error en registrarLog:', err);
    }
}

    // 🔹 Mostrar datos + UI según estado
    function renderUI(data, isArchived) {
        // Fotos
        setPhoto('elim-foto-frontal', data.foto_frontal);
        setPhoto('elim-foto-izq', data.foto_perfil_izq);
        setPhoto('elim-foto-der', data.foto_perfil_der);
        
        // Campos de texto
        setVal('elim-n1', data.primer_nombre);
        setVal('elim-n2', data.segundo_nombre);
        setVal('elim-a1', data.primer_apellido);
        setVal('elim-a2', data.segundo_apellido);
        setVal('elim-cedula', data.cedula);
        setVal('elim-fnac', data.fecha_nacimiento);
        setVal('elim-edad', data.edad);
        setVal('elim-apodo', data.apodo);
        setVal('elim-marca', data.marca_corporal);
        setVal('elim-nac', data.nacionalidad);
        setVal('elim-sexo', data.sexo);
        setVal('elim-tlf-pais', data.tlf_pais);
        setVal('elim-tlf-num', data.tlf_numero);
        setVal('elim-dir', data.direccion);
        setVal('elim-dir-det', data.direccion_detencion);
        setVal('elim-est', data.estatura_cm);
        setVal('elim-piel', data.color_piel);
        setVal('elim-ojos', data.color_ojos);
        setVal('elim-cabello', data.color_cabello);
        setVal('elim-comp', data.complexion);

        setVal('elim-lentes', data.usa_lentes ? 'Sí' : 'No');
        if (data.usa_lentes && data.detalle_lentes) { showField('box-lentes-det'); setVal('elim-lentes-det', data.detalle_lentes); } 
        else { hideField('box-lentes-det'); }
        
        setVal('elim-perf', data.perforaciones ? 'Sí' : 'No');
        if (data.perforaciones && data.detalle_perforaciones) { showField('box-perf-det'); setVal('elim-perf-det', data.detalle_perforaciones); } 
        else { hideField('box-perf-det'); }
        
        setVal('elim-cond', data.condicion_medica ? 'Sí' : 'No');
        if (data.condicion_medica) { showField('box-cond-det'); setVal('elim-cond-det', data.condicion_medica); } 
        else { hideField('box-cond-det'); }
        
        setVal('elim-med', data.consume_medicamento ? 'Sí' : 'No');
        if (data.consume_medicamento) { showField('box-med-det'); setVal('elim-med-det', data.consume_medicamento); } 
        else { hideField('box-med-det'); }
        
        setVal('elim-jud', data.problema_judicial ? 'Sí' : 'No');
        if (data.problema_judicial) { showField('box-jud-det'); setVal('elim-jud-det', data.problema_judicial); } 
        else { hideField('box-jud-det'); }
        
        setVal('elim-estacion', data.estacion_policial);
        setVal('elim-obs', data.observaciones);

        if (isArchived) {
            archivedBanner.style.display = 'block';
            archivedNotice.style.display = 'block';
            document.getElementById('archived-date').textContent = data.eliminado_en ? new Date(data.eliminado_en).toLocaleString('es-VE') : '-';
            document.getElementById('archived-by').textContent = data.eliminado_por || 'Sistema';
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block';
        } else {
            archivedBanner.style.display = 'none';
            archivedNotice.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 Búsqueda principal (CORREGIDA para manejar múltiples eliminaciones)
    async function buscarPersona() {
        const cedula = buscarInput.value.trim().replace(/\D/g, '');
        if (cedula.length < 7) return showMsg(msgBuscar, '⚠️ Ingrese entre 7 y 8 dígitos', 'error');
        
        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        hideMsg(msgElim);
        archivedNotice.style.display = 'none';
        
        try {
            // 1. Buscar en activos
            let { data: activo, error: errActivo } = await window.supabaseClient
                .from('registro_personas')
                .select('*')
                .eq('cedula', cedula)
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
            
            // 2. Buscar en eliminados/archivados
            // ✅ CORRECCIÓN CLAVE: Ordenar por fecha descendente y limitar a 1 para obtener la ÚLTIMA eliminación
            let { data: archivado, error: errArch } = await window.supabaseClient
                .from('eliminados')
                .select('*')
                .eq('cedula', cedula)
                .order('eliminado_en', { ascending: false }) // La más reciente primero
                .limit(1) // Solo traemos esa
                .maybeSingle(); // maybeSingle funciona perfecto con limit(1)
                
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
            
            showMsg(msgBuscar, '❌ Persona no encontrada en el sistema.', 'error');
        } catch (err) {
            console.error('Error búsqueda:', err);
            showMsg(msgBuscar, '❌ Error de conexión: ' + err.message, 'error');
        } finally { 
            buscarBtn.disabled = false; 
        }
    }

    // 🔹 Modal
    function showModal(titulo, texto, accion, tipo) {
        pendingAction = accion;
        modalTitle.textContent = titulo;
        modalText.textContent = texto;
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

    // 🔹 Eliminar (Activa → Eliminados)
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
                estatus: currentData.estatus, 
                estacion_policial: currentData.estacion_policial, 
                direccion_detencion: currentData.direccion_detencion,
                foto_frontal: currentData.foto_frontal, 
                foto_perfil_izq: currentData.foto_perfil_izq, 
                foto_perfil_der: currentData.foto_perfil_der,
                primer_nombre: currentData.primer_nombre, 
                segundo_nombre: currentData.segundo_nombre, 
                primer_apellido: currentData.primer_apellido, 
                segundo_apellido: currentData.segundo_apellido,
                cedula: currentData.cedula, 
                fecha_nacimiento: currentData.fecha_nacimiento, 
                edad: currentData.edad,
                tlf_pais: currentData.tlf_pais, 
                tlf_numero: currentData.tlf_numero, 
                direccion: currentData.direccion,
                apodo: currentData.apodo, 
                marca_corporal: currentData.marca_corporal, 
                nacionalidad: currentData.nacionalidad, 
                sexo: currentData.sexo,
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
                observaciones: currentData.observaciones
            };
            
            const { error: insErr } = await window.supabaseClient.from('eliminados').insert([dataToArchive]);
            if (insErr) throw new Error('Error archivando: ' + insErr.message);
            
            const { data: delData, error: delErr } = await window.supabaseClient
                .from('registro_personas')
                .delete()
                .eq('id', currentData.id)
                .select('id');
                
            if (delErr) throw new Error('Error eliminando: ' + delErr.message);
            if (!delData || delData.length === 0) throw new Error('No se encontró el registro para eliminar.');
             // ✅ NUEVO: Registrar la acción en los logs
        await registrarLog(
            'ELIMINAR', 
            'PERSONAS', 
            { 
                cedula: currentData.cedula, 
                nombre: `${currentData.primer_nombre} ${currentData.primer_apellido}`,
                descripcion_eliminada: "Registro eliminado y movido a archivados."
            }
        );
            
            showMsgElim('✅ Persona eliminada y archivada correctamente.', 'success');
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
            btnEliminar.textContent = '🗑️ Eliminar Persona del Sistema'; 
        }
    }

    // 🔹 Reintegrar (Eliminados → Activa)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true; 
        btnReintegrar.textContent = '⏳ Procesando...'; 
        hideMsgElim();
        
        try {
            const dataToRestore = {
                estatus: currentData.estatus, 
                estacion_policial: currentData.estacion_policial, 
                direccion_detencion: currentData.direccion_detencion,
                foto_frontal: currentData.foto_frontal, 
                foto_perfil_izq: currentData.foto_perfil_izq, 
                foto_perfil_der: currentData.foto_perfil_der,
                primer_nombre: currentData.primer_nombre, 
                segundo_nombre: currentData.segundo_nombre, 
                primer_apellido: currentData.primer_apellido, 
                segundo_apellido: currentData.segundo_apellido,
                cedula: currentData.cedula, 
                fecha_nacimiento: currentData.fecha_nacimiento, 
                edad: currentData.edad,
                tlf_pais: currentData.tlf_pais, 
                tlf_numero: currentData.tlf_numero, 
                direccion: currentData.direccion,
                apodo: currentData.apodo, 
                marca_corporal: currentData.marca_corporal, 
                nacionalidad: currentData.nacionalidad, 
                sexo: currentData.sexo,
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
                observaciones: currentData.observaciones
            };
            
            const { error: insErr } = await window.supabaseClient.from('registro_personas').insert([dataToRestore]);
            if (insErr) throw new Error('Error restaurando: ' + insErr.message);
            
            // ✅ CORRECCIÓN CLAVE: Eliminar SOLO el registro específico por su ID único
            // Esto deja intactas las eliminaciones anteriores de la misma persona como respaldo histórico
            await window.supabaseClient
                .from('eliminados')
                .delete()
                .eq('id', currentData.id); // currentData.id es el ID de la fila en 'eliminados'
               // ✅ NUEVO: Registrar la acción en los logs
        await registrarLog(
            'REINTEGRAR', 
            'PERSONAS', 
            { 
                cedula: currentData.cedula, 
                nombre: `${currentData.primer_nombre} ${currentData.primer_apellido}`,
                estatus: "Reintegrado al sistema activo"
            }
        );
            
            showMsgElim('✅ Persona reintegrada al sistema activo.', 'success');
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
                msg = '❌ Esta cédula ya existe en el sistema activo.';
            } else {
                msg = '❌ ' + err.message;
            }
            showMsgElim(msg, 'error');
        } finally { 
            btnReintegrar.disabled = false; 
            btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo'; 
        }
    }

    // 🔹 Listeners
    buscarBtn.addEventListener('click', buscarPersona);
    buscarInput.addEventListener('keydown', e => { 
        if (e.key === 'Enter') { e.preventDefault(); buscarPersona(); } 
    });
    
    btnEliminar.addEventListener('click', () => {
        if (!currentData) return;
        showModal(
            '⚠️ Confirmar Eliminación', 
            `¿Eliminar a ${currentData.primer_nombre} ${currentData.primer_apellido} (C.I: ${currentData.cedula})? Se archivará permanentemente.`, 
            'delete', 
            'danger'
        );
    });
    
    btnReintegrar.addEventListener('click', () => {
        if (!currentData) return;
        showModal(
            '♻️ Confirmar Reintegración', 
            `¿Reintegrar a ${currentData.primer_nombre} ${currentData.primer_apellido} (C.I: ${currentData.cedula})? Volverá al sistema activo.`, 
            'reintegrate', 
            'success'
        );
    });
    
    btnModalYes.addEventListener('click', ejecutarAccion);
    btnModalNo.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
};
