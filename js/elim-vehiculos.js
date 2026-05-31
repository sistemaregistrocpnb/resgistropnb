window.initElimVehiculos = function() {
    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-input-elim');
    const buscarBtn = document.getElementById('btn-buscar-elim');
    const msgBuscar = document.getElementById('buscar-msg-elim');
    const archivedNotice = document.getElementById('archived-notice'); // Aviso amarillo pequeño
    const dataContainer = document.getElementById('elim-data-container');
    const archivedBanner = document.getElementById('archived-banner'); // Banner grande
    const selectionPanel = document.getElementById('selection-panel'); // Panel de selección para duplicados
    const btnEliminar = document.getElementById('btn-eliminar');
    const btnReintegrar = document.getElementById('btn-reintegrar');
    const msgElim = document.getElementById('msg-elim');
    const modal = document.getElementById('elim-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const btnModalYes = document.getElementById('btn-modal-yes');
    const btnModalNo = document.getElementById('btn-modal-no');

    let pendingData = { moto: null, auto: null };
    let currentData = null;
    let currentTable = '';
    let isArchived = false;
    let isSelectionMode = false;
    let pendingAction = null;

    // 🔹 Helpers UI
    const showMsg = (el, txt, type) => { el.textContent = txt; el.className = `search-msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const showMsgElim = (txt, type) => { msgElim.textContent = txt; msgElim.className = `msg ${type}`; msgElim.style.display = 'block'; };
    const hideMsgElim = () => { msgElim.style.display = 'none'; };
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; };
    const setPhoto = (imgId, url) => { const img = document.getElementById(imgId); if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } };

    // 🔹 Mostrar datos + UI según estado (IDÉNTICO A ELIM-PERSONAS)
    function renderUI(data, source) {
        currentData = data;
        isArchived = (source === 'archive');
        
        // Determinar tabla de origen para reintegrar
        currentTable = isArchived ? (data.tabla_origen || 'registro_motos') : source;
        
        dataContainer.style.display = 'block';
        hideMsg(msgBuscar);
        selectionPanel.classList.remove('active');
        hideMsg(msgElim);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Llenar Campos
        setVal('elim-placa', data.placa);
        setVal('elim-serial-carro', data.serial_carroceria);
        setVal('elim-serial-motor', data.serial_motor);
        setVal('elim-color', data.color);
        setVal('elim-marca', data.marca);
        setVal('elim-modelo', data.modelo);
        setVal('elim-anio', data.anio);
        setVal('elim-estacion', data.estacion_policial);
        setVal('elim-dir-det', data.direccion_detencion);
        setVal('elim-estatus', data.estatus || 'Verificación');
        setVal('elim-obs', data.observaciones);
        
        // Determinar tipo para mostrar
        let tipoMostrar = 'Desconocido';
        if (source === 'registro_motos') tipoMostrar = 'Motocicleta';
        else if (source === 'registro_automoviles') tipoMostrar = 'Automóvil';
        else if (source === 'archive') tipoMostrar = data.tipo_vehiculo || 'Desconocido';
        setVal('elim-tipo', tipoMostrar);
        
        // Cilindraje
        const esMoto = (source === 'registro_motos') || (isArchived && data.tipo_vehiculo === 'Motocicleta');
        const boxCilindro = document.getElementById('box-cilindro');
        if (boxCilindro) {
            boxCilindro.style.display = (esMoto && data.cilindraje) ? 'block' : 'none';
            if (data.cilindraje) setVal('elim-cilindraje', data.cilindraje);
        }

        // Fotos
        setPhoto('elim-foto-frontal', data.foto_frontal);
        setPhoto('elim-foto-trasera', data.foto_trasera);
        setPhoto('elim-foto-der', data.foto_lado_derecho);
        setPhoto('elim-foto-izq', data.foto_lado_izquierdo);

        // 🔔 LÓGICA DE UI SEGÚN ESTADO (IDÉNTICA A ELIM-PERSONAS)
        if (isArchived) {
            // Mostrar Banners
            archivedBanner.style.display = 'block';
            if (archivedNotice) archivedNotice.style.display = 'block';
            
            // Fecha y Usuario
            document.getElementById('archived-date').textContent = data.eliminado_en ? new Date(data.eliminado_en).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-';
            document.getElementById('archived-by').textContent = data.eliminado_por || 'Sistema';
            
            // Botones
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block';
        } else {
            // Estado Activo
            archivedBanner.style.display = 'none';
            if (archivedNotice) archivedNotice.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 Función Global para seleccionar (llamada desde HTML)
    window.seleccionarRegistro = function(tipo) {
        if (tipo === 'moto' && pendingData.moto) cargarDatos(pendingData.moto, 'registro_motos');
        else if (tipo === 'auto' && pendingData.auto) cargarDatos(pendingData.auto, 'registro_automoviles');
        selectionPanel.classList.remove('active');
        isSelectionMode = false;
    };

    // 🔍 BUSCADOR PRINCIPAL CON LÓGICA DE SELECCIÓN Y ARCHIVO
    buscarBtn.addEventListener('click', async () => {
        const val = buscarInput.value.trim().toUpperCase();
        if (val.length < 5) return showMsg(msgBuscar, '️ Ingrese un dato válido (mín. 5 caracteres).', 'error');

        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        selectionPanel.classList.remove('active');
        archivedBanner.style.display = 'none';
        if (archivedNotice) archivedNotice.style.display = 'none';
        hideMsg(msgElim);
        pendingData = { moto: null, auto: null };
        currentData = null;
        isArchived = false;

        try {
            // 1. Búsqueda en tablas activas (Motos y Autos)
            const query = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
            
            const [resMoto, resAuto] = await Promise.all([
                window.supabaseClient.from('registro_motos').select('*').or(query).maybeSingle(),
                window.supabaseClient.from('registro_automoviles').select('*').or(query).maybeSingle()
            ]);

            // 2. Consolidar datos encontrados en activos
            if (resMoto.data) pendingData.moto = resMoto.data;
            if (resAuto.data) pendingData.auto = resAuto.data;

            // 3. Lógica de visualización
            if (pendingData.moto && pendingData.auto) {
                // ¡Duplicidad detectada! Mostrar panel
                isSelectionMode = true;
                selectionPanel.classList.add('active');
                hideMsg(msgBuscar);
            } else if (pendingData.moto) {
                cargarDatos(pendingData.moto, 'registro_motos');
            } else if (pendingData.auto) {
                cargarDatos(pendingData.auto, 'registro_automoviles');
            } else {
                // 4. Si no está activo, buscar en Historial (Independiente de tipo)
                const queryArchive = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
                const resArchive = await window.supabaseClient.from('vehiculos_eliminados').select('*').or(queryArchive).maybeSingle();
                
                if (resArchive.data) {
                    cargarDatos(resArchive.data, 'archive');
                } else {
                    showMsg(msgBuscar, '❌ Vehículo no encontrado.', 'error');
                }
            }
        } catch (err) {
            console.error('Error búsqueda:', err);
            showMsg(msgBuscar, '❌ Error de conexión.', 'error');
        } finally { 
            buscarBtn.disabled = false; 
        }
    });

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
                id_original: currentData.id,
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

            const { error: insErr } = await window.supabaseClient.from('vehiculos_eliminados').insert([dataToArchive]);
            if (insErr) throw new Error('Error archivando: ' + insErr.message);

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
                selectionPanel.classList.remove('active');
            }, 4000);
        } catch (err) {
            console.error('Error eliminando:', err);
            showMsgElim('❌ ' + err.message, 'error');
        } finally { 
            btnEliminar.disabled = false; 
            btnEliminar.textContent = '🗑️ Eliminar Vehículo del Sistema'; 
        }
    }

    // 🔹 Reintegrar (Eliminados → Activa)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true; 
        btnReintegrar.textContent = '⏳ Reintegrando...'; 
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

            const { error: insErr } = await window.supabaseClient.from(tablaDestino).insert([dataToRestore]);
            if (insErr) throw new Error('Error restaurando: ' + insErr.message);

            await window.supabaseClient.from('vehiculos_eliminados').delete().eq('id', currentData.id);

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
            btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo'; 
        }
    }

    // 🔹 Listeners
    buscarInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscarBtn.click(); } });
    btnModalNo.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    btnEliminar.addEventListener('click', () => {
        if (isSelectionMode) return showMsg(msgElim, '⚠️ Seleccione qué registro desea eliminar.', 'error');
        if (!currentData) return;
        const tipoVeh = currentTable === 'registro_motos' ? 'Motocicleta' : 'Automóvil';
        showModal('⚠️ Confirmar Eliminación', `¿Eliminar ${tipoVeh} placa ${currentData.placa}? Se archivará permanentemente.`, 'delete', 'danger');
    });
    
    btnReintegrar.addEventListener('click', () => {
        if (!currentData) return;
        showModal('♻️ Confirmar Reintegración', `¿Reintegrar vehículo placa ${currentData.placa}? Volverá al sistema activo.`, 'reintegrate', 'success');
    });
    
    btnModalYes.addEventListener('click', ejecutarAccion);
};
