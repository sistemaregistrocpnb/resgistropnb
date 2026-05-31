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

    let currentData = null;
    let isArchived = false;

    // 🔹 Helpers UI
    const showMsg = (el, txt, type) => { el.textContent = txt; el.className = `msg ${type}`; el.style.display = 'block'; };
    const hideMsg = (el) => { el.style.display = 'none'; };
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; };
    const setPhoto = (imgId, url) => { const img = document.getElementById(imgId); if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } };

    // 🔍 FUNCIÓN DE BÚSQUEDA (Activa -> Historial)
    async function buscarVehiculo() {
        const val = buscarInput.value.trim().toUpperCase();
        if (val.length < 5) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');

        showMsg(msgBuscar, '🔍 Buscando...', 'success');
        buscarBtn.disabled = true;
        dataContainer.style.display = 'none';
        archivedBanner.style.display = 'none';
        hideMsg(msgElim);
        currentData = null;
        isArchived = false;

        try {
            // 1. Buscar en Tablas Activas (Motos y Autos)
            const query = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
            
            const [resMoto, resAuto] = await Promise.all([
                window.supabaseClient.from('registro_motos').select('*').or(query).maybeSingle(),
                window.supabaseClient.from('registro_automoviles').select('*').or(query).maybeSingle()
            ]);

            if (resMoto.data) {
                cargarDatos(resMoto.data, 'moto');
            } else if (resAuto.data) {
                cargarDatos(resAuto.data, 'auto');
            } else {
                // 2. Si no está activo, buscar en Historial (Vehículos Eliminados)
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
    }

    // 🔹 CARGAR DATOS EN EL FORMULARIO
    function cargarDatos(data, source) {
        currentData = data;
        isArchived = (source === 'archive');
        dataContainer.style.display = 'block';
        hideMsg(msgBuscar);
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
    buscarBtn.addEventListener('click', buscarVehiculo);
    buscarInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscarVehiculo(); } });

    // 🔹 ACCIÓN: ELIMINAR
    btnEliminar.addEventListener('click', () => {
        if (!currentData) return;
        // Aquí podrías agregar un modal de confirmación si lo deseas
        eliminarRegistro();
    });

    // 🔹 ACCIÓN: REINTEGRAR
    btnReintegrar.addEventListener('click', () => {
        if (!currentData || !isArchived) return;
        reintegrarRegistro();
    });

    // 🔹 LÓGICA DE ELIMINACIÓN
    async function eliminarRegistro() {
        btnEliminar.disabled = true; btnEliminar.textContent = '⏳ Archivando...';
        hideMsg(msgElim);

        try {
            const userId = sessionStorage.getItem('pnb_user_id') || 'user';
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
                eliminado_por: userId
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
            }, 4000);
        } catch (err) {
            console.error('Error eliminando:', err);
            showMsg(msgElim, '❌ Error al eliminar: ' + err.message, 'error');
        } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '🗑️ Eliminar Vehículo del Sistema';
        }
    }

    // 🔹 LÓGICA DE REINTEGRACIÓN
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true; btnReintegrar.textContent = '⏳ Reintegrando...';
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
            btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo';
        }
    }
};
