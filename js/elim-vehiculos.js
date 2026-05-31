window.initElimVehiculos = function() {
    // 🔹 Referencias DOM
    const buscarInput = document.getElementById('buscar-input-elim');
    const buscarBtn = document.getElementById('btn-buscar-elim');
    const msgBuscar = document.getElementById('buscar-msg-elim');
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

    let currentData = null;
    let currentTable = ''; // 'registro_motos' o 'registro_automoviles'
    let pendingAction = null;

    //  Helpers UI
    const showMsg = (el, txt, type) => { el.textContent = txt; el.className = `msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const setVal = (id, val) => { 
        const el = document.getElementById(id); 
        if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; 
    };
    const setPhoto = (imgId, url) => { 
        const img = document.getElementById(imgId); 
        if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } 
    };

    // 🔍 BÚSQUEDA SECUENCIAL (Activos -> Historial)
    async function buscarVehiculo() {
        const val = buscarInput.value.trim().toUpperCase();
        if (val.length < 5) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');

        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        archivedBanner.style.display = 'none';
        hideMsg(msgElim);
        currentData = null;

        try {
            const query = `placa.eq.${val},serial_carroceria.eq.${val},serial_motor.eq.${val}`;
            
            // 1. Buscar en tablas activas
            const [resMoto, resAuto] = await Promise.all([
                window.supabaseClient.from('registro_motos').select('*').or(query).maybeSingle(),
                window.supabaseClient.from('registro_automoviles').select('*').or(query).maybeSingle()
            ]);

            if (resMoto.data) {
                renderUI(resMoto.data, 'registro_motos', false);
            } else if (resAuto.data) {
                renderUI(resAuto.data, 'registro_automoviles', false);
            } else {
                // 2. Si no está activo, buscar en historial
                const resArchive = await window.supabaseClient.from('vehiculos_eliminados').select('*').or(query).maybeSingle();
                if (resArchive.data) {
                    renderUI(resArchive.data, resArchive.data.tabla_origen || 'registro_motos', true);
                } else {
                    showMsg(msgBuscar, '❌ Vehículo no encontrado.', 'error');
                }
            }
        } catch (e) {
            console.error(e);
            showMsg(msgBuscar, '❌ Error de conexión.', 'error');
        } finally { 
            buscarBtn.disabled = false; 
        }
    }

    // 🔹 RENDERIZAR UI (Activo vs Archivado)
    function renderUI(data, tablaOrigen, isArchived) {
        currentData = data;
        currentTable = tablaOrigen;
        dataContainer.style.display = 'block';
        hideMsg(msgBuscar);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Llenar campos
        setVal('elim-placa', data.placa);
        setVal('elim-serial-carro', data.serial_carroceria);
        setVal('elim-serial-motor', data.serial_motor);
        setVal('elim-color', data.color);
        setVal('elim-marca', data.marca);
        setVal('elim-modelo', data.modelo);
        setVal('elim-anio', data.anio);
        setVal('elim-tipo', isArchived ? data.tipo_vehiculo : (tablaOrigen === 'registro_motos' ? 'Motocicleta' : 'Automóvil'));
        setVal('elim-estacion', data.estacion_policial);
        setVal('elim-dir-det', data.direccion_detencion);
        setVal('elim-estatus', data.estatus || 'Verificación');
        setVal('elim-obs', data.observaciones);
        
        const esMoto = (tablaOrigen === 'registro_motos') || (isArchived && data.tipo_vehiculo === 'Motocicleta');
        document.getElementById('box-cilindro').style.display = (esMoto && data.cilindraje) ? 'block' : 'none';
        if (data.cilindraje) setVal('elim-cilindraje', data.cilindraje);

        // Fotos
        setPhoto('elim-foto-frontal', data.foto_frontal);
        setPhoto('elim-foto-trasera', data.foto_trasera);
        setPhoto('elim-foto-der', data.foto_lado_derecho);
        setPhoto('elim-foto-izq', data.foto_lado_izquierdo);

        // 🔔 UI según estado
        if (isArchived) {
            archivedBanner.style.display = 'block';
            document.getElementById('archive-date').textContent = new Date(data.eliminado_en).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });
            document.getElementById('archive-user').textContent = data.eliminado_por || 'Sistema';
            btnEliminar.style.display = 'none';
            btnReintegrar.style.display = 'block';
        } else {
            archivedBanner.style.display = 'none';
            btnEliminar.style.display = 'block';
            btnReintegrar.style.display = 'none';
        }
    }

    // 🔹 Listeners
    buscarBtn.addEventListener('click', buscarVehiculo);
    buscarInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscarVehiculo(); } });
    btnNo.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    btnYes.addEventListener('click', () => {
        if (pendingAction === 'delete') eliminarRegistro();
        else if (pendingAction === 'reintegrate') reintegrarRegistro();
        modal.style.display = 'none';
    });

    btnEliminar.addEventListener('click', () => {
        modalTitle.textContent = `⚠️ Confirmar Eliminación`;
        modalText.textContent = `¿Eliminar permanentemente la placa ${currentData.placa}? Se moverá al historial.`;
        btnYes.className = 'btn-modal-danger';
        btnYes.textContent = '✅ Sí, Eliminar';
        pendingAction = 'delete';
        modal.style.display = 'flex';
    });

    btnReintegrar.addEventListener('click', () => {
        modalTitle.textContent = `♻️ Confirmar Reintegración`;
        modalText.textContent = `¿Desea devolver el vehículo placa ${currentData.placa} al sistema activo?`;
        btnYes.className = 'btn-modal-success';
        btnYes.textContent = '✅ Sí, Reintegrar';
        pendingAction = 'reintegrate';
        modal.style.display = 'flex';
    });

    // 🔹 ELIMINAR (Activo -> Historial)
    async function eliminarRegistro() {
        btnEliminar.disabled = true; btnEliminar.textContent = ' Archivando...';
        hideMsg(msgElim);

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const eliminadoPor = user?.email || 'usuario@sistema';

            const registroElim = {
                id_original: currentData.id,
                tabla_origen: currentTable, // ✅ CLAVE: Guarda de qué tabla viene
                tipo_vehiculo: document.getElementById('elim-tipo').value,
                placa: currentData.placa, marca: currentData.marca, modelo: currentData.modelo, anio: currentData.anio, color: currentData.color,
                serial_carroceria: currentData.serial_carroceria, serial_motor: currentData.serial_motor,
                cilindraje: currentData.cilindraje || null, direccion_detencion: currentData.direccion_detencion || null,
                estacion_policial: currentData.estacion_policial, estatus: currentData.estatus, 
                observaciones: currentData.observaciones || null,
                foto_frontal: currentData.foto_frontal, foto_trasera: currentData.foto_trasera,
                foto_lado_derecho: currentData.foto_lado_derecho, foto_lado_izquierdo: currentData.foto_lado_izquierdo,
                eliminado_por: eliminadoPor
            };

            const { error: insError } = await window.supabaseClient.from('vehiculos_eliminados').insert([registroElim]);
            if (insError) throw insError;

            const { error: delError } = await window.supabaseClient.from(currentTable).delete().eq('id', currentData.id);
            if (delError) throw delError;

            showMsg(msgElim, '✅ Vehículo eliminado y archivado correctamente.', 'success');
            setTimeout(() => { 
                dataContainer.style.display = 'none'; 
                buscarInput.value = ''; 
                hideMsg(msgBuscar); 
                hideMsg(msgElim); 
                archivedBanner.style.display = 'none';
            }, 4000);
        } catch (err) {
            console.error('Error eliminando:', err);
            showMsg(msgElim, '❌ Error: ' + err.message, 'error');
        } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '️ Eliminar Vehículo del Sistema';
        }
    }

    // 🔹 REINTEGRAR (Historial -> Activo)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true; btnReintegrar.textContent = '⏳ Reintegrando...';
        hideMsg(msgElim);

        try {
            const tablaDestino = currentData.tabla_origen; // ✅ Lee la tabla original guardada

            const dataActiva = {
                estatus: currentData.estatus, estacion_policial: currentData.estacion_policial,
                direccion_detencion: currentData.direccion_detencion, observaciones: currentData.observaciones,
                placa: currentData.placa, marca: currentData.marca, modelo: currentData.modelo,
                anio: currentData.anio, color: currentData.color, serial_carroceria: currentData.serial_carroceria,
                serial_motor: currentData.serial_motor, cilindraje: currentData.cilindraje || null,
                foto_frontal: currentData.foto_frontal, foto_trasera: currentData.foto_trasera,
                foto_lado_derecho: currentData.foto_lado_derecho, foto_lado_izquierdo: currentData.foto_lado_izquierdo
            };

            const { error: insError } = await window.supabaseClient.from(tablaDestino).insert([dataActiva]);
            if (insError) throw insError;

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
            btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo';
        }
    }
};
