window.initElimVinculados = function() {
  console.log("✅ Módulo elim-vinculados.js cargado correctamente.");

  // 🔹 Referencias DOM
  const buscarInput = document.getElementById('buscar-input-elim-vinc');
  const buscarBtn = document.getElementById('btn-buscar-elim-vinc');
  const msgBuscar = document.getElementById('buscar-msg-elim-vinc');
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
  let isArchived = false;
  let pendingAction = null;

  // 🔹 Helpers UI
  const showMsg = (el, txt, type) => { if(el) { el.innerHTML = txt; el.className = `search-msg ${type}`; el.style.display = 'block'; } };
  const hideMsg = (el) => { if(el) el.style.display = 'none'; };
  const showMsgElim = (txt, type) => { msgElim.innerHTML = txt; msgElim.className = `msg ${type}`; msgElim.style.display = 'block'; };
  const hideMsgElim = () => { msgElim.style.display = 'none'; };
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; };
  const setPhoto = (imgId, url) => { const img = document.getElementById(imgId); if (img) { img.src = url || ''; img.style.display = url ? 'block' : 'none'; } };

  // 🔹 Mostrar datos en el formulario
  function cargarDatos(data, source) {
    currentData = data;
    isArchived = (source === 'eliminados_vinculados');
    
    dataContainer.style.display = 'block';
    hideMsg(msgBuscar);
    selectionPanel.style.display = 'none';
    hideMsgElim();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Persona
    const nombreCompleto = `${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}`.trim();
    setVal('elim-nombre-completo', nombreCompleto || '-');
    setVal('elim-cedula', data.cedula);
    setVal('elim-edad', `${data.fecha_nacimiento || '-'} (${data.edad || '-'} años)`);
    setVal('elim-telefono', `${data.tlf_pais || ''} ${data.tlf_numero || ''}`.trim() || '-');

    // Vehículo
    setVal('elim-tipo-veh', data.tipo_vehiculo || 'Desconocido');
    setVal('elim-placa', data.placa);
    setVal('elim-serial-carro', data.serial_carroceria);
    setVal('elim-serial-motor', data.serial_motor);
    setVal('elim-marca-modelo', `${data.marca_vehiculo || ''} ${data.modelo_vehiculo || ''}`.trim() || '-');
    setVal('elim-anio-color', `${data.anio_vehiculo || '-'} / ${data.color_vehiculo || '-'}`);

    // Registro
    setVal('elim-estacion', data.estacion_policial);
    setVal('elim-dir-det', data.direccion_detencion);
    setVal('elim-obs', data.observaciones);

    // Fotos
    setPhoto('elim-foto-frontal', data.foto_frontal_vehiculo);
    setPhoto('elim-foto-trasera', data.foto_trasera_vehiculo);
    setPhoto('elim-foto-der', data.foto_lado_der_vehiculo);
    setPhoto('elim-foto-izq', data.foto_lado_izq_vehiculo);

    // Estado (Activo vs Archivado)
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
  // 🔍 BÚSQUEDA MULTI-TABLA Y DETECCIÓN CRUZADA
  // ==========================================
  function detectarCoincidencias(reg, val) {
    const campos = [];
    const v = val.trim().toUpperCase();
    if (reg.cedula && reg.cedula.toUpperCase() === v) campos.push('Cédula');
    if (reg.placa && reg.placa.toUpperCase() === v) campos.push('Placa');
    if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase() === v) campos.push('Serial Carrocería');
    if (reg.serial_motor && reg.serial_motor.toUpperCase() === v) campos.push('Serial Motor');
    return campos;
  }

  async function buscarEnTodasLasTablas(valor) {
    const resultados = [];
    const val = valor.trim().toUpperCase();
    const query = `cedula.ilike.${val},placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`;
    
    try {
      // 1. Vinculados Activos
      const { data: vinculados, error: errVinc } = await window.supabaseClient.from('registro_vinculado').select('*').or(query);
      if (!errVinc && vinculados && vinculados.length > 0) {
        vinculados.forEach(reg => resultados.push({
          origen: 'registro_vinculado', tipo: 'vinculado', icono: '🔗', color: '#002b5c', colorBg: '#eff6ff', clase: 'vinculado',
          titulo: '🔗 Vinculado Activo',
          linea1: `👤 ${reg.primer_nombre || ''} ${reg.primer_apellido || ''} | C.I: ${reg.cedula || '-'}`,
          linea2: `🚗 ${reg.tipo_vehiculo || ''} ${reg.marca_vehiculo || ''} | Placa: ${reg.placa || '-'}`,
          linea3: `🏛️ ${reg.estacion_policial || '-'}`,
          encontrado_por: detectarCoincidencias(reg, val), datos: reg, eliminado: false
        }));
      }

      // 2. Vinculados Archivados
      const { data: eliminados, error: errElim } = await window.supabaseClient.from('eliminados_vinculados').select('*').or(query);
      if (!errElim && eliminados && eliminados.length > 0) {
        eliminados.forEach(reg => {
          const fechaElim = reg.eliminado_en ? new Date(reg.eliminado_en).toLocaleDateString('es-VE') : 'Sin fecha';
          resultados.push({
            origen: 'eliminados_vinculados', tipo: 'archivado', icono: '🗄️🔗', color: '#64748b', colorBg: '#f1f5f9', clase: 'archivado',
            titulo: `🗄️ Archivado - ${fechaElim}`,
            linea1: `👤 ${reg.primer_nombre || ''} ${reg.primer_apellido || ''} | C.I: ${reg.cedula || '-'}`,
            linea2: `🚗 ${reg.tipo_vehiculo || ''} ${reg.marca_vehiculo || ''} | Placa: ${reg.placa || '-'}`,
            linea3: `Eliminado por: ${reg.eliminado_por || 'Sistema'}`,
            encontrado_por: detectarCoincidencias(reg, val), datos: reg, eliminado: true
          });
        });
      }

      return resultados;
    } catch (err) {
      console.error('Error en búsqueda:', err);
      throw err;
    }
  }

  function mostrarPanelSeleccion(resultados, valorBuscado) {
    selectionList.innerHTML = '';
    resultCount.textContent = resultados.length;
    
    // Verificar si hay datos en otras tablas para alerta cruzada
    const val = valorBuscado.trim().toUpperCase();
    const { data: motos } = await window.supabaseClient.from('registro_motos').select('id').or(`placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`).limit(1);
    const { data: autos } = await window.supabaseClient.from('registro_automoviles').select('id').or(`placa.ilike.${val},serial_carroceria.ilike.${val},serial_motor.ilike.${val}`).limit(1);
    
    if (crossWarning) {
      if ((motos && motos.length > 0) || (autos && autos.length > 0)) {
        crossWarning.innerHTML = `<strong>⚠️ ALERTA CRUZADA:</strong> El dato buscado también aparece en registros de vehículos individuales. Esto puede indicar clonación. Revise cuidadosamente.`;
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
    cargarDatos(resultado.datos, resultado.origen);
    selectionPanel.style.display = 'none';
    if (crossWarning) crossWarning.style.display = 'none';
  }

  // 🔍 LISTENER PRINCIPAL DE BÚSQUEDA
  if (buscarBtn && buscarInput) {
    buscarBtn.addEventListener('click', async () => {
      const val = buscarInput.value.trim();
      if (val.length < 5) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 5 caracteres).', 'error');
      
      showMsg(msgBuscar, '🔍 Buscando en registros vinculados...', 'success');
      buscarBtn.disabled = true;
      dataContainer.style.display = 'none';
      selectionPanel.style.display = 'none';
      if (archivedBanner) archivedBanner.style.display = 'none';
      hideMsgElim();

      try {
        const resultados = await buscarEnTodasLasTablas(val);
        if (resultados.length === 0) {
          showMsg(msgBuscar, '❌ Registro vinculado no encontrado.', 'error');
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
  // 🔹 ELIMINAR (Activa → Archivada)
  // ==========================================
  async function eliminarRegistro() {
    if (!currentData) return;
    btnEliminar.disabled = true;
    btnEliminar.textContent = '⏳ Archivando...';
    hideMsgElim();

    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      const eliminadoPor = user?.email || 'usuario@sistema';
      
      // SIEMPRE INSERTAR nuevo registro histórico
      const dataToArchive = {
        eliminado_por: eliminadoPor,
        eliminado_en: new Date().toISOString(),
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
        foto_frontal_vehiculo: currentData.foto_frontal_vehiculo,
        foto_trasera_vehiculo: currentData.foto_trasera_vehiculo,
        foto_lado_der_vehiculo: currentData.foto_lado_der_vehiculo,
        foto_lado_izq_vehiculo: currentData.foto_lado_izq_vehiculo,
        // Meta
        estatus: currentData.estatus,
        estacion_policial: currentData.estacion_policial,
        direccion_detencion: currentData.direccion_detencion,
        observaciones: currentData.observaciones
      };
      
      const res = await window.supabaseClient.from('eliminados_vinculados').insert([dataToArchive]);
      if (res.error) throw res.error;
      
      const delRes = await window.supabaseClient.from('registro_vinculado').delete().eq('id', currentData.id);
      if (delRes.error) throw delRes.error;
      
      showMsgElim('✅ Registro vinculado eliminado y archivado correctamente como respaldo histórico.', 'success');
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
      btnEliminar.textContent = '🗑️ Eliminar Registro Vinculado';
    }
  }

  // ==========================================
  // 🔹 REINTEGRAR (Archivada → Activa)
  // ==========================================
  async function reintegrarRegistro() {
    if (!currentData) return;
    btnReintegrar.disabled = true;
    btnReintegrar.textContent = '⏳ Reintegrando...';
    hideMsgElim();

    try {
      const dataToRestore = {
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
        foto_frontal_persona: currentData.foto_frontal_persona,
        foto_perfil_izq_persona: currentData.foto_perfil_izq_persona,
        foto_perfil_der_persona: currentData.foto_perfil_der_persona,
        // Vehículo
        tipo_vehiculo: currentData.tipo_vehiculo,
        placa: currentData.placa,
        serial_carroceria: currentData.serial_carroceria,
        serial_motor: currentData.serial_motor || '', // ✅ Evitar null
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
      
      const res = await window.supabaseClient.from('registro_vinculado').insert([dataToRestore]);
      if (res.error) throw res.error;
      
      // BORRAR SOLO este registro específico de eliminados
      const delRes = await window.supabaseClient.from('eliminados_vinculados').delete().eq('id', currentData.id);
      if (delRes.error) throw delRes.error;
      
      showMsgElim('✅ Registro vinculado reintegrado al sistema activo exitosamente.', 'success');
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
      if (err.message.includes('23505') || err.message.includes('unique') || err.message.includes('duplicate key')) {
        msg = '❌ <strong>No se puede reintegrar:</strong> La cédula, placa o serial ya se encuentra en uso por otro registro en el sistema activo.<br><small style="color:#64748b;">Este registro eliminado se conserva en la tabla de respaldo como historial.</small>';
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
      showModal('⚠️ Confirmar Eliminación', `¿Está seguro de eliminar este registro vinculado (C.I: ${currentData.cedula}, Placa: ${currentData.placa})? Se moverá a la tabla de respaldo histórico.`, 'delete', 'danger');
    });
  }

  if (btnReintegrar) {
    btnReintegrar.addEventListener('click', () => {
      if (!currentData) return;
      showModal('⚠️ Confirmar Reintegración', `¿Está seguro de reintegrar este registro vinculado (C.I: ${currentData.cedula}, Placa: ${currentData.placa}) al sistema activo?`, 'reintegrate', 'success');
    });
  }

  console.log("✅ Módulo elim-vinculados.js inicializado correctamente.");
};
