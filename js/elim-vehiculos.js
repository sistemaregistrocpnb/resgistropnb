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
    // 🔹 Helpers UI (CORREGIDO: innerHTML permite que funcione el <strong>)
  const showMsg = (el, txt, type) => { if(el) { el.innerHTML = txt; el.className = `search-msg ${type}`; el.style.display = 'block'; } };
  const hideMsg = (el) => { if(el) el.style.display = 'none'; };
  const showMsgElim = (txt, type) => { msgElim.innerHTML = txt; msgElim.className = `msg ${type}`; msgElim.style.display = 'block'; };
  const hideMsgElim = () => { msgElim.style.display = 'none'; };
  // 🔹 Mostrar datos + UI según estado
  function cargarDatos(data, source) {
    currentData = data;
    isArchived = (source === 'archive');
    currentTable = isArchived ? (data.tabla_origen || 'registro_motos') : source;
    
    dataContainer.style.display = 'block';
    hideMsg(msgBuscar);
    selectionPanel.style.display = 'none';
    hideMsgElim();
    window.scrollTo({ top: 0, behavior: 'smooth' });

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

    let tipoMostrar = 'Desconocido';
    if (source === 'registro_motos') tipoMostrar = 'Motocicleta';
    else if (source === 'registro_automoviles') tipoMostrar = 'Automóvil';
    else if (isArchived) tipoMostrar = data.tipo_vehiculo || 'Desconocido';
    setVal('elim-tipo', tipoMostrar);

    const esMoto = (source === 'registro_motos') || (isArchived && data.tipo_vehiculo === 'Motocicleta');
    const boxCilindro = document.getElementById('box-cilindro');
    if (boxCilindro) {
      boxCilindro.style.display = (esMoto && data.cilindraje) ? 'block' : 'none';
      if (data.cilindraje) setVal('elim-cilindraje', data.cilindraje);
    }

    setPhoto('elim-foto-frontal', data.foto_frontal);
    setPhoto('elim-foto-trasera', data.foto_trasera);
    setPhoto('elim-foto-der', data.foto_lado_derecho);
    setPhoto('elim-foto-izq', data.foto_lado_izquierdo);

    if (isArchived) {
      if (archivedBanner) archivedBanner.style.display = 'block';
      const dateEl = document.getElementById('archived-date');
      const byEl = document.getElementById('archived-by');
      if (dateEl && data.eliminado_en) {
        dateEl.textContent = new Date(data.eliminado_en).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });
      } else if (dateEl) {
        dateEl.textContent = '-';
      }
      if (byEl) byEl.textContent = data.eliminado_por || 'Sistema';
      btnEliminar.style.display = 'none';
      btnReintegrar.style.display = 'block';
    } else {
      if (archivedBanner) archivedBanner.style.display = 'none';
      btnEliminar.style.display = 'block';
      btnReintegrar.style.display = 'none';
    }
  }

  // ==========================================
  // 🔍 BÚSQUEDA MULTI-TABLA CON DETECCIÓN CRUZADA
  // ==========================================
  function detectarCoincidenciasVehiculo(reg, val) {
    const campos = [];
    const v = val.trim().toUpperCase();
    if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
    if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial de Carrocería');
    if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial de Motor');
    if (reg.cedula && reg.cedula.toUpperCase() === v) campos.push('Cédula');
    return campos;
  }

  async function buscarEnTodasLasTablas(valor) {
    const resultados = [];
    const val = valor.trim().toUpperCase();
    try {
      // 1. Buscar en Motos Activas
      const { data: motos, error: errMoto } = await window.supabaseClient
        .from('registro_motos')
        .select('*')
        .or(`placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`);
      if (!errMoto && motos && motos.length > 0) {
        motos.forEach(reg => resultados.push({
          origen: 'registro_motos', tipo: 'moto', icono: '🏍️', color: '#dc2626', colorBg: '#fef2f2', clase: 'moto',
          titulo: '🏍️ Motocicleta Activa',
          linea1: `Placa: ${reg.placa || '-'}`,
          linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
          linea3: `Serial: ${reg.serial_carroceria || '-'}`,
          encontrado_por: detectarCoincidenciasVehiculo(reg, val),
          datos: reg, eliminado: false
        }));
      }

      // 2. Buscar en Automóviles Activos
      const { data: autos, error: errAuto } = await window.supabaseClient
        .from('registro_automoviles')
        .select('*')
        .or(`placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`);
      if (!errAuto && autos && autos.length > 0) {
        autos.forEach(reg => resultados.push({
          origen: 'registro_automoviles', tipo: 'auto', icono: '🚙', color: '#059669', colorBg: '#ecfdf5', clase: 'auto',
          titulo: '🚙 Automóvil Activo',
          linea1: `Placa: ${reg.placa || '-'}`,
          linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
          linea3: `Serial: ${reg.serial_carroceria || '-'}`,
          encontrado_por: detectarCoincidenciasVehiculo(reg, val),
          datos: reg, eliminado: false
        }));
      }

      // 3. Buscar en Vinculados Activos
      const { data: vinculados, error: errVinc } = await window.supabaseClient
        .from('registro_vinculado')
        .select('*')
        .or(`cedula.ilike.${val},placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`);
      if (!errVinc && vinculados && vinculados.length > 0) {
        vinculados.forEach(reg => resultados.push({
          origen: 'registro_vinculado', tipo: 'vinculado', icono: '🔗', color: '#002b5c', colorBg: '#eff6ff', clase: 'vinculado',
          titulo: '🔗 Vinculado Activo (Persona + Vehículo)',
          linea1: `👤 ${reg.primer_nombre || ''} ${reg.primer_apellido || ''} | C.I: ${reg.cedula || '-'}`,
          linea2: `🚗 ${reg.tipo_vehiculo || ''} ${reg.marca_vehiculo || ''} | Placa: ${reg.placa || '-'}`,
          linea3: `🏛️ ${reg.estacion_policial || '-'}`,
          encontrado_por: detectarCoincidenciasVehiculo(reg, val),
          datos: reg, eliminado: false
        }));
      }

      // 4. Buscar en Vehículos Eliminados (Archivados)
      const { data: eliminados, error: errElim } = await window.supabaseClient
        .from('vehiculos_eliminados')
        .select('*')
        .or(`placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`);
      if (!errElim && eliminados && eliminados.length > 0) {
        eliminados.forEach(reg => {
          const esMoto = reg.tipo_vehiculo === 'Motocicleta';
          resultados.push({
            origen: 'vehiculos_eliminados', tipo: esMoto ? 'moto' : 'auto',
            icono: esMoto ? '🗄️🏍️' : '🗄️🚙', color: '#64748b', colorBg: '#f1f5f9', clase: 'archivado',
            titulo: `🗄️ Archivado (${reg.tipo_vehiculo || 'Vehículo'})`,
            linea1: `Placa: ${reg.placa || '-'}`,
            linea2: `${reg.marca || ''} ${reg.modelo || ''} ${reg.anio || ''}`,
            linea3: `Eliminado por: ${reg.eliminado_por || 'Sistema'}`,
            encontrado_por: detectarCoincidenciasVehiculo(reg, val),
            datos: reg, eliminado: true
          });
        });
      }

      return resultados;
    } catch (err) {
      console.error('Error en búsqueda multi-tabla:', err);
      throw err;
    }
  }

  function mostrarPanelSeleccion(resultados, valorBuscado) {
    selectionList.innerHTML = '';
    resultCount.textContent = resultados.length;
    
    const tieneMoto = resultados.some(r => r.origen === 'registro_motos' || (r.origen === 'vehiculos_eliminados' && r.tipo === 'moto'));
    const tieneAuto = resultados.some(r => r.origen === 'registro_automoviles' || (r.origen === 'vehiculos_eliminados' && r.tipo === 'auto'));
    const tieneVinculado = resultados.some(r => r.origen === 'registro_vinculado');

    if (crossWarning) {
      if ((tieneMoto && tieneAuto) || (tieneVinculado && (tieneMoto || tieneAuto))) {
        crossWarning.innerHTML = `<strong>⚠️ ALERTA CRUZADA:</strong> El dato buscado o sus seriales asociados aparecen en más de un tipo de registro. Esto puede indicar clonación. Revise cuidadosamente.`;
        crossWarning.style.display = 'block';
      } else {
        crossWarning.style.display = 'none';
      }
    }

    resultados.forEach((res, index) => {
      const card = document.createElement('div');
      card.className = `selection-card ${res.clase}`;
      card.style.cssText = `background: ${res.colorBg}; border: 2px solid ${res.color}; border-left: 6px solid ${res.color}; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; margin-bottom: 12px;`;
      card.onmouseover = () => card.style.transform = 'translateX(4px)';
      card.onmouseout = () => card.style.transform = 'translateX(0)';
      
      card.innerHTML = `
        <div class="selection-card-info">
          <div class="selection-card-title ${res.clase}">
            <span style="font-size: 1.5rem;">${res.icono}</span>
            <strong>${res.titulo}</strong>
          </div>
          <div class="selection-card-line">${res.linea1}</div>
          <div class="selection-card-line">${res.linea2}</div>
          <div class="selection-card-line small">${res.linea3}</div>
          <div style="font-size: 0.75rem; color: #0369a1; background: #e0f2fe; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 6px;">
            🔎 Coincidencia en: <strong>${res.encontrado_por.join(', ')}</strong>
          </div>
        </div>
        <button class="btn-select-card" data-index="${index}" style="padding: 12px 24px; background: ${res.color}; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; white-space: nowrap;">
          ${res.eliminado ? '♻️ Reintegrar' : '🗑️ Gestionar'}
        </button>
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

  async function cargarResultado(resultado) {
    const source = resultado.eliminado ? 'archive' : resultado.origen;
    cargarDatos(resultado.datos, source);
    selectionPanel.style.display = 'none';
    if (crossWarning) crossWarning.style.display = 'none';
  }

  // 🔍 LISTENER PRINCIPAL DE BÚSQUEDA
  if (buscarBtn && buscarInput) {
    buscarBtn.addEventListener('click', async () => {
      const val = buscarInput.value.trim();
      if (val.length < 5) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');
      
      showMsg(msgBuscar, '🔍 Buscando en todos los registros...', 'success');
      buscarBtn.disabled = true;
      dataContainer.style.display = 'none';
      selectionPanel.style.display = 'none';
      if (archivedBanner) archivedBanner.style.display = 'none';
      hideMsgElim();

      try {
        const resultados = await buscarEnTodasLasTablas(val);
        
        if (resultados.length === 0) {
          showMsg(msgBuscar, '❌ Vehículo o registro no encontrado.', 'error');
        } else if (resultados.length === 1) {
          showMsg(msgBuscar, '✅ 1 registro encontrado. Cargando...', 'success');
          setTimeout(() => cargarResultado(resultados[0]), 300);
        } else {
          showMsg(msgBuscar, `🔎 Se encontraron <strong>${resultados.length} coincidencias</strong>. Seleccione cuál gestionar:`, 'success');
          setTimeout(() => mostrarPanelSeleccion(resultados, val), 300);
        }
      } catch (err) {
        console.error('❌ Error general:', err);
        showMsg(msgBuscar, '❌ Error de conexión: ' + err.message, 'error');
      } finally {
        buscarBtn.disabled = false;
      }
    });

    buscarInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); buscarBtn.click(); }
    });
  }

  // Listener para cancelar búsqueda
  const btnCancelSearch = document.getElementById('btn-cancel-search');
  if (btnCancelSearch) {
    btnCancelSearch.addEventListener('click', () => {
      selectionPanel.style.display = 'none';
      if (crossWarning) crossWarning.style.display = 'none';
      msgBuscar.style.display = 'none';
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

  if (btnModalNo) btnModalNo.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  if (btnModalYes) btnModalYes.addEventListener('click', ejecutarAccion);

  // ==========================================
  // 🔹 ELIMINAR (Activa → Eliminados)
  // ==========================================
  async function eliminarRegistro() {
    if (!currentData) return;
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
        selectionPanel.style.display = 'none';
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
  // 🔹 REINTEGRAR (Eliminados → Activa)
  // ==========================================
  async function reintegrarRegistro() {
    if (!currentData) return;
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
        serial_motor: currentData.serial_motor || '', // ✅ Evitar null
        foto_frontal: currentData.foto_frontal,
        foto_trasera: currentData.foto_trasera,
        foto_lado_derecho: currentData.foto_lado_derecho,
        foto_lado_izquierdo: currentData.foto_lado_izquierdo
      };
      
      if (esMoto) dataToRestore.cilindraje = currentData.cilindraje || null;

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
  // 🔹 LISTENERS DE BOTONES DE ACCIÓN
  // ==========================================
  if (btnEliminar) {
    btnEliminar.addEventListener('click', () => {
      if (!currentData) return;
      showModal('⚠️ Confirmar Eliminación', `¿Está seguro de eliminar el vehículo con placa ${currentData.placa}? Esta acción lo moverá al archivo de eliminados.`, 'delete', 'danger');
    });
  }

  if (btnReintegrar) {
    btnReintegrar.addEventListener('click', () => {
      if (!currentData) return;
      showModal('⚠️ Confirmar Reintegración', `¿Está seguro de reintegrar el vehículo con placa ${currentData.placa} al sistema activo?`, 'reintegrate', 'success');
    });
  }

  console.log("✅ Módulo elim-vehiculos.js inicializado correctamente.");
};
