window.initElimVehiculos = function() {
  console.log("✅ Módulo elim-vehiculos.js cargado correctamente.");

  // 🔹 Referencias DOM
  const buscarInput = document.getElementById('buscar-input-elim');
  const buscarBtn = document.getElementById('btn-buscar-elim');
  const msgBuscar = document.getElementById('buscar-msg-elim');
  const crossWarning = document.getElementById('cross-plate-warning');
  const selectionPanel = document.getElementById('selection-panel');
  const selectionList = document.getElementById('selection-list');
  const resultCount = document.getElementById('result-count');
  const btnCancelSearch = document.getElementById('btn-cancel-search');
  const archivedBanner = document.getElementById('archived-banner');
  const dataContainer = document.getElementById('elim-data-container');
  const btnEliminar = document.getElementById('btn-eliminar');
  const btnReintegrar = document.getElementById('btn-reintegrar');
  const msgElim = document.getElementById('msg-elim');
  const modal = document.getElementById('elim-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');
  const btnModalYes = document.getElementById('btn-modal-yes');
  const btnModalNo = document.getElementById('btn-modal-no');

  let currentData = null;
  let currentTable = '';
  let isArchived = false;
  let pendingAction = null;

  // 🔹 Helpers UI
  const showMsg = (el, txt, type) => { 
    el.innerHTML = txt; 
    el.className = `search-msg ${type}`; 
    el.style.display = 'block'; 
  };
  const hideMsg = (el) => { el.style.display = 'none'; };
  const showMsgElim = (txt, type) => { 
    msgElim.textContent = txt; 
    msgElim.className = `msg ${type}`; 
    msgElim.style.display = 'block'; 
  };
  const hideMsgElim = () => { msgElim.style.display = 'none'; };
  const setVal = (id, val) => { 
    const el = document.getElementById(id); 
    if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; 
  };
  const setPhoto = (imgId, url) => { 
    const img = document.getElementById(imgId); 
    if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } 
  };

  // ==========================================
  // 🔹 DETECTAR COINCIDENCIAS
  // ==========================================
  function detectarCoincidenciasVehiculo(reg, val) {
    const campos = [];
    const v = val.trim().toUpperCase();
    if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
    if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial Carrocería');
    if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial Motor');
    return campos;
  }

  // ==========================================
  // 🔹 BÚSQUEDA MULTI-TABLA (Idéntica a mod-vehiculos)
  // ==========================================
  async function buscarEnTodasLasTablas(valor) {
    const resultados = [];
    const val = valor.trim().toUpperCase();
    const query = `placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;

    try {
      // 1. Buscar en tablas activas
      const [resMoto, resAuto] = await Promise.all([
        window.supabaseClient.from('registro_motos').select('*').or(query),
        window.supabaseClient.from('registro_automoviles').select('*').or(query)
      ]);

      if (!resMoto.error && resMoto.data && resMoto.data.length > 0) {
        resMoto.data.forEach(reg => resultados.push({
          origen: 'registro_motos',
          tipo: 'moto',
          icono: '🏍️',
          color: '#dc2626',
          colorBg: '#fef2f2',
          clase: 'moto',
          titulo: '🏍️ Motocicleta (Activa)',
          linea1: `Placa: ${reg.placa || '-'}`,
          linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
          linea3: `Serial: ${reg.serial_carroceria || '-'}`,
          encontrado_por: detectarCoincidenciasVehiculo(reg, val),
          datos: reg,
          archivado: false
        }));
      }

      if (!resAuto.error && resAuto.data && resAuto.data.length > 0) {
        resAuto.data.forEach(reg => resultados.push({
          origen: 'registro_automoviles',
          tipo: 'auto',
          icono: '🚙',
          color: '#059669',
          colorBg: '#ecfdf5',
          clase: 'auto',
          titulo: '🚙 Automóvil (Activo)',
          linea1: `Placa: ${reg.placa || '-'}`,
          linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
          linea3: `Serial: ${reg.serial_carroceria || '-'}`,
          encontrado_por: detectarCoincidenciasVehiculo(reg, val),
          datos: reg,
          archivado: false
        }));
      }

      // 2. Buscar en archivo de eliminados
      const { data: resArchive, error: errArchive } = await window.supabaseClient
        .from('vehiculos_eliminados')
        .select('*')
        .or(query);

      if (!errArchive && resArchive && resArchive.length > 0) {
        resArchive.forEach(reg => {
          const esMoto = reg.tipo_vehiculo === 'Motocicleta' || reg.tabla_origen === 'registro_motos';
          resultados.push({
            origen: 'vehiculos_eliminados',
            tipo: esMoto ? 'moto' : 'auto',
            icono: esMoto ? '🏍️' : '🚙',
            color: '#d97706',
            colorBg: '#fef3c7',
            clase: 'archivado',
            titulo: esMoto ? '🏍️ Motocicleta (Archivada)' : '🚙 Automóvil (Archivado)',
            linea1: `Placa: ${reg.placa || '-'}`,
            linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
            linea3: `🗄️ Archivado: ${reg.eliminado_en ? new Date(reg.eliminado_en).toLocaleDateString('es-VE') : '-'}`,
            encontrado_por: detectarCoincidenciasVehiculo(reg, val),
            datos: reg,
            archivado: true
          });
        });
      }

      return resultados;
    } catch (err) {
      console.error('Error en búsqueda multi-tabla:', err);
      throw err;
    }
  }

  // ==========================================
  // 🔹 MOSTRAR PANEL DE SELECCIÓN (Idéntico a mod-vehiculos)
  // ==========================================
  function mostrarPanelSeleccion(resultados, valorBuscado) {
    selectionList.innerHTML = '';
    resultCount.textContent = resultados.length;

    // Detectar si hay coincidencia cruzada
    const tieneMotoActiva = resultados.some(r => r.origen === 'registro_motos');
    const tieneAutoActivo = resultados.some(r => r.origen === 'registro_automoviles');
    const tieneArchivado = resultados.some(r => r.archivado);

    if ((tieneMotoActiva && tieneAutoActivo) || (tieneArchivado && (tieneMotoActiva || tieneAutoActivo))) {
      crossWarning.innerHTML = `<strong>⚠️ ALERTA CRUZADA:</strong> El dato "<strong>${valorBuscado}</strong>" aparece en más de un tipo de registro. Esto puede indicar clonación o un reintegro pendiente. Revise cuidadosamente.`;
      crossWarning.style.display = 'block';
    } else {
      crossWarning.style.display = 'none';
    }

    resultados.forEach((res, index) => {
      const card = document.createElement('div');
      card.className = `selection-card ${res.clase}`;
      
      const btnTexto = res.archivado ? '♻️ Reintegrar' : '🗑️ Seleccionar';
      
      card.innerHTML = `
        <div class="selection-card-info">
          <div class="selection-card-title ${res.clase}">
            <span class="icon">${res.icono}</span>
            <strong>${res.titulo}</strong>
          </div>
          <div class="selection-card-line">${res.linea1}</div>
          <div class="selection-card-line">${res.linea2}</div>
          <div class="selection-card-line small">${res.linea3}</div>
          <div class="selection-card-badge">🔎 Coincidencia en: <strong>${res.encontrado_por.join(', ')}</strong></div>
        </div>
        <button class="btn-select-card" data-index="${index}">${btnTexto}</button>
      `;
      selectionList.appendChild(card);
    });

    document.querySelectorAll('.btn-select-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        cargarResultado(resultados[idx]);
      });
    });

    selectionPanel.style.display = 'block';
    dataContainer.style.display = 'none';
    hideMsg(msgBuscar);
  }

  // ==========================================
  // 🔹 CARGAR RESULTADO SELECCIONADO
  // ==========================================
  function cargarResultado(resultado) {
    selectionPanel.style.display = 'none';
    crossWarning.style.display = 'none';
    
    if (resultado.archivado) {
      cargarDatos(resultado.datos, 'archive');
    } else {
      cargarDatos(resultado.datos, resultado.origen);
    }
  }

  // ==========================================
  // 🔹 MOSTRAR DATOS + UI SEGÚN ESTADO
  // ==========================================
  function cargarDatos(data, source) {
    currentData = data;
    isArchived = (source === 'archive' || source === 'vehiculos_eliminados');
    currentTable = isArchived ? (data.tabla_origen || 'registro_motos') : source;
    
    dataContainer.style.display = 'block';
    hideMsg(msgBuscar);
    selectionPanel.style.display = 'none';
    if (archivedBanner) archivedBanner.style.display = 'none';
    hideMsgElim();
    
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
    else if (isArchived) tipoMostrar = data.tipo_vehiculo || 'Desconocido';
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

    // 🔔 LÓGICA DE UI SEGÚN ESTADO
    if (isArchived) {
      if (archivedBanner) archivedBanner.style.display = 'block';
      const dateEl = document.getElementById('archived-date');
      const byEl = document.getElementById('archived-by');
      if (dateEl && data.eliminado_en) {
        dateEl.textContent = new Date(data.eliminado_en).toLocaleDateString('es-VE', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute:'2-digit'
        });
      } else if (dateEl) {
        dateEl.textContent = '-';
      }
      if (byEl) {
        byEl.textContent = data.eliminado_por || 'Sistema';
      }
      btnEliminar.style.display = 'none';
      btnReintegrar.style.display = 'block';
    } else {
      if (archivedBanner) archivedBanner.style.display = 'none';
      btnEliminar.style.display = 'block';
      btnReintegrar.style.display = 'none';
    }
  }

  // ==========================================
  // 🔹 LISTENER PRINCIPAL DE BÚSQUEDA
  // ==========================================
  buscarBtn.addEventListener('click', async () => {
    const val = buscarInput.value.trim();
    if (val.length < 5) {
      showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');
      return;
    }

    showMsg(msgBuscar, '🔍 Buscando en todos los registros...', 'success');
    buscarBtn.disabled = true;
    dataContainer.style.display = 'none';
    selectionPanel.style.display = 'none';
    crossWarning.style.display = 'none';
    if (archivedBanner) archivedBanner.style.display = 'none';
    hideMsgElim();

    try {
      const resultados = await buscarEnTodasLasTablas(val);
      
      if (resultados.length === 0) {
        showMsg(msgBuscar, '❌ Vehículo no encontrado en ningún registro.', 'error');
      } else if (resultados.length === 1) {
        showMsg(msgBuscar, '✅ 1 registro encontrado. Cargando...', 'success');
        setTimeout(() => cargarResultado(resultados[0]), 300);
      } else {
        showMsg(msgBuscar, `🔎 Se encontraron <strong>${resultados.length} coincidencias</strong>. Seleccione cuál eliminar o reintegrar:`, 'success');
        setTimeout(() => mostrarPanelSeleccion(resultados, val), 300);
      }
    } catch (e) {
      console.error(e);
      showMsg(msgBuscar, '❌ Error de conexión: ' + e.message, 'error');
    } finally {
      buscarBtn.disabled = false;
    }
  });

  buscarInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarBtn.click();
    }
  });

  if (btnCancelSearch) {
    btnCancelSearch.addEventListener('click', () => {
      selectionPanel.style.display = 'none';
      crossWarning.style.display = 'none';
      hideMsg(msgBuscar);
      buscarInput.value = '';
      buscarInput.focus();
    });
  }

  // ==========================================
  // 🔹 MODAL DE CONFIRMACIÓN
  // ==========================================
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

  // ==========================================
  // 🔹 ELIMINAR (Activa → Archivados)
  // ==========================================
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
        if (archivedBanner) archivedBanner.style.display = 'none';
      }, 4000);
    } catch (err) {
      console.error('❌ Error eliminando:', err);
      showMsgElim('❌ ' + err.message, 'error');
    } finally {
      btnEliminar.disabled = false;
      btnEliminar.textContent = '🗑️ Eliminar Vehículo del Sistema';
    }
  }

  // ==========================================
  // 🔹 REINTEGRAR (Archivados → Activa)
  // ==========================================
  async function reintegrarRegistro() {
    btnReintegrar.disabled = true;
    btnReintegrar.textContent = '⏳ Reintegrando...';
    hideMsgElim();

    try {
      const tablaDestino = currentData.tabla_origen || currentTable;
      const esMoto = currentData.tipo_vehiculo === 'Motocicleta' || tablaDestino === 'registro_motos';

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
        foto_frontal: currentData.foto_frontal,
        foto_trasera: currentData.foto_trasera,
        foto_lado_derecho: currentData.foto_lado_derecho,
        foto_lado_izquierdo: currentData.foto_lado_izquierdo
      };

      if (esMoto) {
        dataToRestore.cilindraje = currentData.cilindraje || null;
      }

      const { error: insErr } = await window.supabaseClient.from(tablaDestino).insert([dataToRestore]);
      if (insErr) throw new Error('Error restaurando: ' + insErr.message);

      const { error: delError } = await window.supabaseClient.from('vehiculos_eliminados').delete().eq('id', currentData.id);
      if (delError) throw new Error('Error limpiando historial: ' + delError.message);

      showMsgElim('✅ Vehículo reintegrado al sistema activo.', 'success');
      setTimeout(() => {
        dataContainer.style.display = 'none';
        buscarInput.value = '';
        hideMsg(msgBuscar);
        hideMsg(msgElim);
        if (archivedBanner) archivedBanner.style.display = 'none';
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

  // ==========================================
  // 🔹 LISTENERS DE BOTONES
  // ==========================================
  btnEliminar.addEventListener('click', () => {
    if (!currentData) return;
    const tipoVeh = currentTable === 'registro_motos' ? 'Motocicleta' : 'Automóvil';
    showModal('⚠️ Confirmar Eliminación', `¿Eliminar ${tipoVeh} placa ${currentData.placa}? Se archivará.`, 'delete', 'danger');
  });

  btnReintegrar.addEventListener('click', () => {
    if (!currentData) return;
    showModal('♻️ Confirmar Reintegración', `¿Reintegrar vehículo placa ${currentData.placa}? Volverá al sistema activo.`, 'reintegrate', 'success');
  });

  btnModalYes.addEventListener('click', ejecutarAccion);
  btnModalNo.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  console.log("✅ Módulo elim-vehiculos.js inicializado correctamente");
};
