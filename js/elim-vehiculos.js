window.initElimVehiculos = function() {
    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-input-elim');
    const buscarBtn = document.getElementById('btn-buscar-elim');
    const msgBuscar = document.getElementById('buscar-msg-elim');
    const crossWarning = document.getElementById('cross-warning');
    const selectionPanel = document.getElementById('selection-panel');
    const dataContainer = document.getElementById('elim-data-container');
    const btnEliminar = document.getElementById('btn-eliminar');
    const msgElim = document.getElementById('msg-elim');
    const modal = document.getElementById('elim-modal');
    const modalText = document.getElementById('modal-text');
    const btnSi = document.getElementById('btn-confirm-si');
    const btnNo = document.getElementById('btn-confirm-no');

    let pendingData = { moto: null, auto: null };
    let currentData = null;
    let currentTable = '';
    let isSelectionMode = false;

    // 🔹 Helpers UI
    const showMsg = (el, txt, type) => { el.textContent = txt; el.className = `msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; };
    const setPhoto = (imgId, url) => { const img = document.getElementById(imgId); if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } };

    // 🔍 FUNCIÓN PARA BUSCAR VÍNCULOS EN LA OTRA TABLA
    // Busca si existe un registro que coincida en Placa, Serial Carrocería o Serial Motor
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

    // 🔍 BUSCADOR PRINCIPAL CON LÓGICA DE SELECCIÓN Y CRUCE
    buscarBtn.addEventListener('click', async () => {
        const val = buscarInput.value.trim().toUpperCase();
        if (val.length < 5) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');

        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        selectionPanel.classList.remove('active');
        crossWarning.style.display = 'none';
        pendingData = { moto: null, auto: null };
        currentData = null;

        try {
            // 1. Búsqueda directa por el valor ingresado
            const query = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
            
            const [resMoto, resAuto] = await Promise.all([
                window.supabaseClient.from('registro_motos').select('*').or(query).maybeSingle(),
                window.supabaseClient.from('registro_automoviles').select('*').or(query).maybeSingle()
            ]);

            // 2. VERIFICACIÓN CRUZADA AUTOMÁTICA
            let linkedAuto = null;
            let linkedMoto = null;

            if (resMoto.data) linkedAuto = await buscarVinculado('registro_automoviles', resMoto.data);
            if (resAuto.data) linkedMoto = await buscarVinculado('registro_motos', resAuto.data);

            // 3. Consolidar datos encontrados
            if (resMoto.data) pendingData.moto = resMoto.data;
            if (resAuto.data) pendingData.auto = resAuto.data;
            if (!pendingData.moto && linkedMoto) pendingData.moto = linkedMoto;
            if (!pendingData.auto && linkedAuto) pendingData.auto = linkedAuto;

            // 4. Lógica de visualización
            if (pendingData.moto && pendingData.auto) {
                isSelectionMode = true;
                selectionPanel.classList.add('active');
                hideMsg(msgBuscar);
            } else if (pendingData.moto) {
                cargarDatos(pendingData.moto, 'registro_motos', 'moto');
            } else if (pendingData.auto) {
                cargarDatos(pendingData.auto, 'registro_automoviles', 'auto');
            } else {
                showMsg(msgBuscar, '❌ Vehículo no encontrado.', 'error');
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

    // 🔹 Cargar Datos en el Formulario
    function cargarDatos(data, tabla, tipo) {
        currentData = data;
        currentTable = tabla;
        dataContainer.style.display = 'block';
        hideMsg(msgBuscar);
        crossWarning.style.display = 'none';
        hideMsg(msgElim);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Fotos
        setPhoto('elim-foto-frontal', data.foto_frontal);
        setPhoto('elim-foto-trasera', data.foto_trasera);
        setPhoto('elim-foto-der', data.foto_lado_derecho);
        setPhoto('elim-foto-izq', data.foto_lado_izquierdo);

        // Campos
        setVal('elim-placa', data.placa);
        setVal('elim-serial-carro', data.serial_carroceria);
        setVal('elim-serial-motor', data.serial_motor);
        setVal('elim-color', data.color);
        setVal('elim-marca', data.marca);
        setVal('elim-modelo', data.modelo);
        setVal('elim-anio', data.anio);
        setVal('elim-tipo', tipo === 'moto' ? 'Motocicleta' : 'Automóvil');
        setVal('elim-estacion', data.estacion_policial);
        setVal('elim-dir-det', data.direccion_detencion);
        setVal('elim-estatus', data.estatus || 'Verificación');
        setVal('elim-obs', data.observaciones);
        
        document.getElementById('box-cilindro').style.display = (tipo === 'moto' && data.cilindraje) ? 'block' : 'none';
        if (data.cilindraje) setVal('elim-cilindraje', data.cilindraje);

        // Verificar advertencia cruzada
        verificarAdvertenciaCruzada(data, tabla);
    }

    // 🔔 Verificar si la placa existe en la otra tabla para mostrar advertencia
    async function verificarAdvertenciaCruzada(data, tablaActual) {
        if (!data.placa) return;
        const tablaContraria = tablaActual === 'registro_motos' ? 'registro_automoviles' : 'registro_motos';
        const { data: match } = await window.supabaseClient.from(tablaContraria).select('id').ilike('placa', data.placa).maybeSingle();
        if (match) {
            const tipoNombre = tablaContraria === 'registro_motos' ? 'Motocicleta' : 'Automóvil';
            crossWarning.innerHTML = `⚠️ <strong>Nota:</strong> Esta placa también está registrada en <strong>${tipoNombre}</strong>. Verifique antes de eliminar.`;
            crossWarning.style.display = 'block';
        }
    }

    // 🔹 Listeners
    buscarInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscarBtn.click(); } });
    btnNo.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    btnEliminar.addEventListener('click', () => {
        if (isSelectionMode) return showMsg(msgElim, '⚠️ Seleccione qué registro desea eliminar.', 'error');
        modalText.textContent = `¿Eliminar permanentemente la placa ${currentData.placa}? Se moverá al historial de eliminados.`;
        modal.style.display = 'flex';
    });

    // 🔹 Lógica de eliminación
    btnSi.addEventListener('click', async () => {
        modal.style.display = 'none';
        btnEliminar.disabled = true; btnEliminar.textContent = ' Archivando y eliminando...';
        hideMsg(msgElim);

        try {
            const userId = sessionStorage.getItem('pnb_user_id') || 'user';
            
            // 1. Insertar en vehiculos_eliminados
            const registroElim = {
                id_original: currentData.id,
                tabla_origen: currentTable,
                tipo_vehiculo: document.getElementById('elim-tipo').value,
                placa: currentData.placa,
                marca: currentData.marca, modelo: currentData.modelo, anio: currentData.anio, color: currentData.color,
                serial_carroceria: currentData.serial_carroceria, serial_motor: currentData.serial_motor,
                cilindraje: currentData.cilindraje || null,
                direccion_detencion: currentData.direccion_detencion || null,
                estacion_policial: currentData.estacion_policial,
                estatus: currentData.estatus, observaciones: currentData.observaciones || null,
                foto_frontal: currentData.foto_frontal, foto_trasera: currentData.foto_trasera,
                foto_lado_derecho: currentData.foto_lado_derecho, foto_lado_izquierdo: currentData.foto_lado_izquierdo,
                eliminado_por: userId
            };

            const { error: insError } = await window.supabaseClient.from('vehiculos_eliminados').insert([registroElim]);
            if (insError) throw insError;

            // 2. Eliminar de tabla original
            const { error: delError } = await window.supabaseClient.from(currentTable).delete().eq('id', currentData.id);
            if (delError) throw delError;

            showMsg(msgElim, '✅ Vehículo eliminado y archivado correctamente.', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsg(msgElim); 
                crossWarning.style.display = 'none';
            }, 4000);
        } catch (err) {
            console.error('Error eliminando:', err);
            let msg = 'Error al eliminar. Intente nuevamente.';
            if (err.message.includes('PGRST')) msg = 'Error de conexión con la base de datos.';
            showMsg(msgElim, '❌ ' + msg, 'error');
        } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '🗑️ Eliminar Vehículo del Sistema';
        }
    });
};
