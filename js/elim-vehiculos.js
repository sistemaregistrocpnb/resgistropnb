window.initElimVehiculos = function() {
    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-input-elim');
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
    let currentTable = '';
    let pendingAction = null;

    // 🔹 Helpers UI
    const showMsg = (el, txt, type) => { el.textContent = txt; el.className = `search-msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const showMsgElim = (txt, type) => { msgElim.textContent = txt; msgElim.className = `msg ${type}`; msgElim.style.display = 'block'; };
    const hideMsgElim = () => { msgElim.style.display = 'none'; };
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; };
    const setPhoto = (imgId, url) => { const img = document.getElementById(imgId); if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } };

    // 🔹 Mostrar datos + UI según estado
    function renderUI(data, isArchived) {
        // Fotos
        setPhoto('elim-foto-frontal', data.foto_frontal);
        setPhoto('elim-foto-trasera', data.foto_trasera);
        setPhoto('elim-foto-der', data.foto_lado_derecho);
        setPhoto('elim-foto-izq', data.foto_lado_izquierdo);

        // Campos básicos
        setVal('elim-placa', data.placa);
        setVal('elim-serial-carro', data.serial_carroceria);
        setVal('elim-serial-motor', data.serial_motor);
        setVal('elim-color', data.color);
        setVal('elim-marca', data.marca);
        setVal('elim-modelo', data.modelo);
        setVal('elim-anio', data.anio);
        setVal('elim-tipo', isArchived ? data.tipo_vehiculo : (currentTable === 'registro_motos' ? 'Motocicleta' : 'Automóvil'));
        setVal('elim-estacion', data.estacion_policial);
        setVal('elim-dir-det', data.direccion_detencion);
        setVal('elim-estatus', data.estatus || 'Verificación');
        setVal('elim-obs', data.observaciones);
        
        // Cilindraje (solo motos)
        const boxCilindro = document.getElementById('box-cilindro');
        if (boxCilindro) {
            const esMoto = (isArchived && data.tipo_vehiculo === 'Motocicleta') || (!isArchived && currentTable === 'registro_motos');
            boxCilindro.style.display = (esMoto && data.cilindraje) ? 'block' : 'none';
            if (data.cilindraje) setVal('elim-cilindraje', data.cilindraje);
        }

        // 🔔 LÓGICA DE UI SEGÚN ESTADO
        if (isArchived) {
            archivedBanner.style.display = 'block';
            if (archivedNotice) archivedNotice.style.display = 'block';
            document.getElementById('archive-date').textContent = data.eliminado_en ? new Date(data.eliminado_en).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-';
            document.getElementById('archive-by').textContent = data.eliminado_por || 'Sistema';
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block';
        } else {
            archivedBanner.style.display = 'none';
            if (archivedNotice) archivedNotice.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 Búsqueda principal
    async function buscarVehiculo() {
        const val = buscarInput.value.trim().toUpperCase();
        console.log('🔍 Iniciando búsqueda para:', val);
        
        if (val.length < 5) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');

        showMsg(msgBuscar, ' Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        hideMsg(msgElim);
        if (archivedNotice) archivedNotice.style.display = 'none';
        archivedBanner.style.display = 'none';
        currentData = null;
        currentTable = '';

        try {
            // 1. Buscar en tablas activas
            const queryActivo = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
            console.log('📝 Query Activos:', queryActivo);
            
            const [resMoto, resAuto] = await Promise.all([
                window.supabaseClient.from('registro_motos').select('*').or(queryActivo).maybeSingle(),
                window.supabaseClient.from('registro_automoviles').select('*').or(queryActivo).maybeSingle()
            ]);

            if (resMoto.data) {
                console.log('✅ ENCONTRADO EN MOTOS:', resMoto.data.placa);
                currentData = resMoto.data;
                currentId = resMoto.data.id;
                currentTable = 'registro_motos';
                renderUI(resMoto.data, false);
                dataContainer.style.display = 'block';
                hideMsg(msgBuscar);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            
            if (resAuto.data) {
                console.log('✅ ENCONTRADO EN AUTOS:', resAuto.data.placa);
                currentData = resAuto.data;
                currentId = resAuto.data.id;
                currentTable = 'registro_automoviles';
                renderUI(resAuto.data, false);
                dataContainer.style.display = 'block';
                hideMsg(msgBuscar);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // 2. Si no está activo, buscar en historial
            console.log('📁 Buscando en vehiculos_eliminados...');
            const queryArchive = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
            
            // ✅ FIX: Usamos .limit(1) para evitar el error PGRST116 cuando hay múltiples registros iguales en el historial
            const { data: resArchiveArray, error: errArchive } = await window.supabaseClient.from('vehiculos_eliminados').select('*').or(queryArchive).limit(1);
            
            if (errArchive) {
                console.error('❌ Error Supabase en historial:', errArchive);
                throw errArchive;
            }

            const resArchive = resArchiveArray?.[0] || null;
            console.log('📊 Resultado Historial:', resArchive);
            
            if (resArchive) {
                console.log('✅ ENCONTRADO EN HISTORIAL:', resArchive.placa);
                currentData = resArchive;
                currentId = resArchive.id_original || resArchive.id;
                currentTable = resArchive.tabla_origen || 'registro_motos';
                renderUI(resArchive, true);
                dataContainer.style.display = 'block';
                hideMsg(msgBuscar);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            console.log(' NO ENCONTRADO EN NINGUNA TABLA');
            showMsg(msgBuscar, ' Vehículo no encontrado.', 'error');
        } catch (err) {
            console.error('❌ Error general:', err);
            showMsg(msgBuscar, ' Error: ' + err.message, 'error');
        } finally { 
            buscarBtn.disabled = false; 
        }
    }

    //  Modal
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
        btnEliminar.textContent = '⏳ Archivando...'; 
        hideMsgElim();
        
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const eliminadoPor = user?.email || 'usuario@sistema';

            const dataToArchive = {
                id_original: currentId,
                tabla_origen: currentTable,
                tipo_vehiculo: currentTable === 'registro_motos' ? 'Motocicleta' : 'Automóvil',
                eliminado_por: eliminadoPor,
                eliminado_en: new Date().toISOString(),
                placa: currentData.placa,
                marca: currentData.marca,
                modelo: currentData.modelo,
                anio: currentData.anio,
                color: currentData.color,
                serial_carroceria: currentData.serial_carroceria,
                serial_motor: currentData.serial_motor,
                cilindraje: currentData.cilindraje || null,
                estacion_policial: currentData.estacion_policial,
                direccion_detencion: currentData.direccion_detencion,
                estatus: currentData.estatus,
                observaciones: currentData.observaciones,
                foto_frontal: currentData.foto_frontal,
                foto_trasera: currentData.foto_trasera,
                foto_lado_derecho: currentData.foto_lado_derecho,
                foto_lado_izquierdo: currentData.foto_lado_izquierdo
            };

            console.log('📦 Archivando:', dataToArchive);
            const { error: insErr } = await window.supabaseClient.from('vehiculos_eliminados').insert([dataToArchive]);
            if (insErr) throw new Error('Error archivando: ' + insErr.message);

            console.log('🗑️ Eliminando de:', currentTable, 'ID:', currentData.id);
            const { error: delErr } = await window.supabaseClient.from(currentTable).delete().eq('id', currentData.id);
            if (delErr) throw new Error('Error eliminando: ' + delErr.message);

            showMsgElim('✅ Vehículo eliminado y archivado correctamente.', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsg(msgElim); 
                if (archivedNotice) archivedNotice.style.display = 'none';
                archivedBanner.style.display = 'none';
            }, 4000);
        } catch (err) {
            console.error('Error eliminando:', err);
            showMsgElim('❌ ' + err.message, 'error');
        } finally { 
            btnEliminar.disabled = false; 
            btnEliminar.textContent = '️ Eliminar Vehículo del Sistema'; 
        }
    }

    // 🔹 Reintegrar (Eliminados → Activa)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true; 
        btnReintegrar.textContent = ' Reintegrando...'; 
        hideMsgElim();
        
        try {
            const tablaDestino = currentData.tabla_origen || currentTable;

            const dataToRestore = {
                estatus: currentData.estatus,
                estacion_policial: currentData.estacion_policial,
                direccion_detencion: currentData.direccion_detencion,
                observaciones: currentData.observaciones,
                placa: currentData.placa,
                marca: currentData.marca,
                modelo: currentData.modelo,
                anio: currentData.anio,
                color: currentData.color,
                serial_carroceria: currentData.serial_carroceria,
                serial_motor: currentData.serial_motor,
                cilindraje: currentData.cilindraje || null,
                foto_frontal: currentData.foto_frontal,
                foto_trasera: currentData.foto_trasera,
                foto_lado_derecho: currentData.foto_lado_derecho,
                foto_lado_izquierdo: currentData.foto_lado_izquierdo
            };

            console.log('️ Reintegrando a tabla:', tablaDestino);
            const { error: insErr } = await window.supabaseClient.from(tablaDestino).insert([dataToRestore]);
            if (insErr) throw new Error('Error restaurando: ' + insErr.message);

            console.log('🗑️ Eliminando del historial ID:', currentData.id);
            const { error: delError } = await window.supabaseClient.from('vehiculos_eliminados').delete().eq('id', currentData.id);
            if (delError) throw new Error('Error limpiando historial: ' + delError.message);

            console.log('✅ Eliminación del historial exitosa');
            showMsgElim('✅ Vehículo reintegrado al sistema activo.', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsg(msgElim); 
                if (archivedNotice) archivedNotice.style.display = 'none';
                archivedBanner.style.display = 'none';
            }, 4000);
        } catch (err) {
            console.error('Error reintegrando:', err);
            let msg = 'Error al reintegrar.';
            if (err.message.includes('23505') || err.message.includes('unique')) {
                msg = '❌ Esta placa ya existe en el sistema activo.';
            } else {
                msg = '❌ ' + err.message;
            }
            showMsgElim(msg, 'error');
        } finally { 
            btnReintegrar.disabled = false; 
            btnReintegrar.textContent = '️ Reintegrar al Sistema Activo'; 
        }
    }

    // 🔹 Listeners
    buscarBtn.addEventListener('click', buscarVehiculo);
    buscarInput.addEventListener('keydown', e => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            buscarVehiculo(); 
        } 
    });
    
    btnEliminar.addEventListener('click', () => {
        if (!currentData) return;
        const tipoVeh = currentTable === 'registro_motos' ? 'Motocicleta' : 'Automóvil';
        showModal('⚠️ Confirmar Eliminación', `¿Eliminar ${tipoVeh} placa ${currentData.placa}? Se archivará permanentemente.`, 'delete', 'danger');
    });
    
    btnReintegrar.addEventListener('click', () => {
        if (!currentData) return;
        showModal('♻️ Confirmar Reintegración', `¿Reintegrar vehículo placa ${currentData.placa}? Volverá al sistema activo.`, 'reintegrate', 'success');
    });
    
    btnModalYes.addEventListener('click', ejecutarAccion);
    btnModalNo.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
};
