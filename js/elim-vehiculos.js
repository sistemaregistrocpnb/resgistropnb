window.initElimVehiculos = function() {
    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-input-elim');
    const buscarBtn = document.getElementById('btn-buscar-elim');
    const msgBuscar = document.getElementById('buscar-msg-elim');
    const selectionPanel = document.getElementById('selection-panel');
    const archivedBanner = document.getElementById('archived-banner');
    const dataContainer = document.getElementById('elim-data-container');
    const btnEliminar = document.getElementById('btn-eliminar');
    const btnReintegrar = document.getElementById('btn-reintegrar');
    const msgElim = document.getElementById('msg-elim');
    const modal = document.getElementById('elim-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const btnYes = document.getElementById('btn-modal-yes');
    const btnNo = document.getElementById('btn-modal-no');

    let pendingData = { moto: null, auto: null };
    let currentData = null;
    let isArchived = false;
    let isSelectionMode = false;

    // 🔹 Helpers UI
    const showMsg = (el, txt, type) => { el.textContent = txt; el.className = `msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; };
    const setPhoto = (imgId, url) => { const img = document.getElementById(imgId); if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } };

    // 🔍 FUNCIÓN PARA BUSCAR VÍNCULOS EN LA OTRA TABLA
    // Busca si existe un registro en la tabla contraria que coincida en Placa, Serial Carrocería o Serial Motor
    async function buscarVinculado(tablaNombre, dataOrigen) {
        if (!dataOrigen) return null;
        const parts = [];
        if (dataOrigen.placa) parts.push(`placa.ilike.${dataOrigen.placa}`);
        if (dataOrigen.serial_carroceria) parts.push(`serial_carroceria.ilike.${dataOrigen.serial_carroceria}`);
        if (dataOrigen.serial_motor) parts.push(`serial_motor.ilike.${dataOrigen.serial_motor}`);
        if (parts.length === 0) return null;
        
        const { data } = await window.supabaseClient.from(tablaNombre).select('*').or(parts.join(',')).maybeSingle();
        return data;
    }

    //  BUSCADOR PRINCIPAL CON LÓGICA DE SELECCIÓN Y CRUCE
    buscarBtn.addEventListener('click', async () => {
        const val = buscarInput.value.trim().toUpperCase();
        if (val.length < 5) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');

        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        selectionPanel.classList.remove('active');
        archivedBanner.style.display = 'none';
        hideMsg(msgElim);
        pendingData = { moto: null, auto: null };
        currentData = null;
        isArchived = false;

        try {
            // 1. Búsqueda directa por el valor ingresado
            const query = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
            
            const [resMoto, resAuto] = await Promise.all([
                window.supabaseClient.from('registro_motos').select('*').or(query).maybeSingle(),
                window.supabaseClient.from('registro_automoviles').select('*').or(query).maybeSingle()
            ]);

            // 2. VERIFICACIÓN CRUZADA AUTOMÁTICA
            // Si encontramos una moto por Serial, verificamos si esa misma Moto tiene Placa registrada en Autos
            let linkedAuto = null;
            let linkedMoto = null;

            if (resMoto.data) {
                linkedAuto = await buscarVinculado('registro_automoviles', resMoto.data);
            }

            if (resAuto.data) {
                linkedMoto = await buscarVinculado('registro_motos', resAuto.data);
            }

            // 3. Consolidar datos encontrados
            if (resMoto.data) pendingData.moto = resMoto.data;
            if (resAuto.data) pendingData.auto = resAuto.data;
            
            // Si no encontramos directo, pero sí por vínculo (ej: busqué serial de moto, pero la placa está en auto)
            if (!pendingData.moto && linkedMoto) pendingData.moto = linkedMoto;
            if (!pendingData.auto && linkedAuto) pendingData.auto = linkedAuto;

            // 4. Lógica de visualización
            if (pendingData.moto && pendingData.auto) {
                // ¡Duplicidad detectada! Mostrar panel
                isSelectionMode = true;
                selectionPanel.classList.add('active');
                hideMsg(msgBuscar);
            } else if (pendingData.moto) {
                cargarDatos(pendingData.moto, 'registro_motos', 'moto');
            } else if (pendingData.auto) {
                cargarDatos(pendingData.auto, 'registro_automoviles', 'auto');
            } else {
                // 5. Si no está activo, buscar en Historial (Vehículos Eliminados)
                const resArchive = await window.supabaseClient.from('vehiculos_eliminados').select('*').or(query).maybeSingle();
                
                if (resArchive.data) {
                    cargarDatos(resArchive.data, 'archive');
                } else {
                    showMsg(msgBuscar, '❌ Vehículo no encontrado.', 'error');
                }
            }
        } catch (e) {
            console.error(e);
            showMsg(msgBuscar, '❌ Error de conexión.', 'error');
        } finally { buscarBtn.disabled = false; }
    });

    // 🔹 Función Global para seleccionar (llamada desde HTML)
    window.seleccionarRegistro = function(tipo) {
        if (tipo === 'moto' && pendingData.moto) cargarDatos(pendingData.moto, 'registro_motos', 'moto');
        else if (tipo === 'auto' && pendingData.auto) cargarDatos(pendingData.auto, 'registro_automoviles', 'auto');
        selectionPanel.classList.remove('active');
        isSelectionMode = false;
    };

    // 🔹 CARGAR DATOS EN EL FORMULARIO
    function cargarDatos(data, source) {
        currentData = data;
        isArchived = (source === 'archive');
        dataContainer.style.display = 'block';
        hideMsg(msgBuscar);
        archivedBanner.style.display = 'none';
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
        setVal('elim-tipo', source === 'moto' ? 'Motocicleta' : (source === 'auto' ? 'Automóvil' : data.tipo_vehiculo));
        setVal('elim-estacion', data.estacion_policial);
        setVal('elim-dir-det', data.direccion_detencion);
        setVal('elim-estatus', data.estatus || 'Verificación');
        setVal('elim-obs', data.observaciones);
        
        // Cilindraje solo para motos
        const esMoto = (source === 'moto') || (isArchived && data.tipo_vehiculo === 'Motocicleta');
        document.getElementById('box-cilindro').style.display = (esMoto && data.cilindraje) ? 'block' : 'none';
        if (data.cilindraje) setVal('elim-cilindraje', data.cilindraje);

        // Fotos
        setPhoto('elim-foto-frontal', data.foto_frontal);
        setPhoto('elim-foto-trasera', data.foto_trasera);
        setPhoto('elim-foto-der', data.foto_lado_derecho);
        setPhoto('elim-foto-izq', data.foto_lado_izquierdo);

        // 🔔 LÓGICA DE UI SEGÚN ESTADO
        if (isArchived) {
            // Mostrar Banner de Archivado
            archivedBanner.style.display = 'block';
            document.getElementById('archive-date').textContent = new Date(data.eliminado_en).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });
            document.getElementById('archive-user').textContent = data.eliminado_por || 'Sistema';
            
            // Ocultar Eliminar, Mostrar Reintegrar
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block';
        } else {
            // Estado Activo
            archivedBanner.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 LISTENERS
    buscarInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscarBtn.click(); } });
    
    btnYes.addEventListener('click', () => {
        if (pendingAction === 'delete') eliminarRegistro();
        else if (pendingAction === 'reintegrate') reintegrarRegistro();
        modal.style.display = 'none';
    });
    
    btnNo.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    btnEliminar.addEventListener('click', () => {
        if (isSelectionMode) return showMsg(msgElim, '⚠️ Seleccione qué registro desea eliminar.', 'error');
        modalTitle.textContent = `⚠️ Confirmar Eliminación`;
        modalText.textContent = `¿Está seguro que desea eliminar el vehículo placa ${currentData.placa}? Este registro se archivará permanentemente.`;
        btnYes.className = 'btn-modal-danger';
        btnYes.textContent = '✅ Sí, Eliminar';
        pendingAction = 'delete';
        modal.style.display = 'flex';
    });

    btnReintegrar.addEventListener('click', () => {
        if (!currentData || !isArchived) return;
        modalTitle.textContent = `♻️ Confirmar Reintegración`;
        modalText.textContent = `¿Desea devolver el vehículo placa ${currentData.placa} al sistema activo?`;
        btnYes.className = 'btn-modal-success';
        btnYes.textContent = '✅ Sí, Reintegrar';
        pendingAction = 'reintegrate';
        modal.style.display = 'flex';
    });

    // 🔹 LÓGICA DE ELIMINACIÓN
    async function eliminarRegistro() {
        btnEliminar.disabled = true; btnEliminar.textContent = '⏳ Archivando...';
        hideMsg(msgElim);

        try {
            const userId = sessionStorage.getItem('pnb_user_id') || 'user';
            // Obtener el correo real del usuario autenticado para auditoría
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const eliminadoPor = user?.email || 'usuario@sistema';

            const tipo = document.getElementById('elim-tipo').value;
            const tablaOrigen = tipo === 'Motocicleta' ? 'registro_motos' : 'registro_automoviles';

            // 1. Insertar en vehiculos_eliminados
            const registroElim = {
                id_original: currentData.id,
                tabla_origen: tablaOrigen,
                tipo_vehiculo: tipo,
                placa: currentData.placa,
                marca: currentData.marca, modelo: currentData.modelo, anio: currentData.anio, color: currentData.color,
                serial_carroceria: currentData.serial_carroceria, serial_motor: currentData.serial_motor,
                cilindraje: currentData.cilindraje || null,
                direccion_detencion: currentData.direccion_detencion || null,
                estacion_policial: currentData.estacion_policial,
                estatus: currentData.estatus, observaciones: currentData.observaciones || null,
                foto_frontal: currentData.foto_frontal, foto_trasera: currentData.foto_trasera,
                foto_lado_derecho: currentData.foto_lado_derecho, foto_lado_izquierdo: currentData.foto_lado_izquierdo,
                eliminado_por: eliminadoPor // ✅ Guarda el correo del usuario
            };

            const { error: insError } = await window.supabaseClient.from('vehiculos_eliminados').insert([registroElim]);
            if (insError) throw insError;

            // 2. Eliminar de tabla activa
            const { error: delError } = await window.supabaseClient.from(tablaOrigen).delete().eq('id', currentData.id);
            if (delError) throw delError;

            showMsg(msgElim, '✅ Vehículo eliminado y archivado correctamente.', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsg(msgElim); 
                archivedBanner.style.display = 'none';
                selectionPanel.classList.remove('active');
            }, 4000);
        } catch (err) {
            console.error('Error eliminando:', err);
            showMsg(msgElim, '❌ Error al eliminar: ' + err.message, 'error');
        } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '️ Eliminar Vehículo del Sistema';
        }
    }

    // 🔹 LÓGICA DE REINTEGRACIÓN
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true; btnReintegrar.textContent = ' Reintegrando...';
        hideMsg(msgElim);

        try {
            // Determinar tabla destino desde el registro archivado
            const tablaDestino = currentData.tabla_origen; 

            // Construir objeto limpio para la tabla activa (sin campos de auditoría de eliminación)
            const dataActiva = {
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

            // 1. Insertar en tabla activa
            const { error: insError } = await window.supabaseClient.from(tablaDestino).insert([dataActiva]);
            if (insError) throw insError;

            // 2. Eliminar del historial
            const { error: delError } = await window.supabaseClient.from('vehiculos_eliminados').delete().eq('id', currentData.id);
            if (delError) throw delError;

            showMsg(msgElim, '✅ Vehículo reintegrado al sistema activo.', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsg(msgElim); 
                archivedBanner.style.display = 'none';
            }, 4000);
        } catch (err) {
            console.error('Error reintegrando:', err);
            let msg = 'Error al reintegrar.';
            if (err.message.includes('23505')) msg = '❌ Esta placa ya existe en el sistema activo.';
            showMsg(msgElim, msg, 'error');
        } finally {
            btnReintegrar.disabled = false;
            btnReintegrar.textContent = '️ Reintegrar al Sistema Activo';
        }
    }
};
