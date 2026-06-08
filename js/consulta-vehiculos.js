async function mostrarDetallesCompletos(data, tipo) {
  console.log("📋 Abriendo detalles completos - Tipo:", tipo);
  
  // ✅ OBTENER ELEMENTOS DEL DOM AQUÍ, NO AL INICIO
  const modalBody = document.getElementById('cv_modal_body');
  const modalTitulo = document.getElementById('cv_modal_titulo');
  const modalDetalles = document.getElementById('cv_modal_detalles');
  
  if (!modalBody || !modalTitulo || !modalDetalles) {
    console.error("❌ No se encontraron los elementos del modal:", {
      modalBody: !!modalBody,
      modalTitulo: !!modalTitulo,
      modalDetalles: !!modalDetalles
    });
    alert('Error: No se pudo abrir el modal. Recarga la página con Ctrl+F5');
    return;
  }
  
  modalTitulo.textContent = `📋 Detalles - ${tipo === 'automovil' ? 'Automóvil' : tipo === 'moto' ? 'Motocicleta' : 'Vehículo Vinculado'}`;
  modalBody.innerHTML = '<div class="loading">⏳ Generando reporte...</div>';
  modalDetalles.classList.add('active');
  
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) throw new Error('Debe iniciar sesión');
    
    const fechaHoy = new Date();
    const fechaStr = fechaHoy.getFullYear().toString() + String(fechaHoy.getMonth() + 1).padStart(2, '0') + String(fechaHoy.getDate()).padStart(2, '0');
    const identificador = data.placa || data.serial_carroceria || data.serial_motor;
    
    const [nuevoReporte, datosProcesadosCompletos] = await Promise.all([
      window.supabaseClient.from('reportes_generados').insert([{
        fecha_texto: fechaStr,
        cedula_consultada: identificador,
        tipo_registro: tipo,
        user_id: user.id,
        user_email: user.email
      }]).select('consecutivo_global').single(),
      
      (data.estatus || '').toLowerCase().includes('procesad')
        ? window.supabaseClient.from('registro_procesados').select('*').eq('cedula', data.cedula || identificador).order('created_at', { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve({ data: null })
    ]);
    
    if (nuevoReporte.error) throw nuevoReporte.error;
    
    const consecutivoFormateado = String(nuevoReporte.data.consecutivo_global).padStart(8, '0');
    const numeroReporte = `REPORTE-CPNB-${fechaStr}-N° ${consecutivoFormateado}`;
    const datosProcesados = datosProcesadosCompletos.data;
    
    let html = `<div class="reporte-header-print" style="text-align: center; margin-bottom: 20px; border-bottom: 3px double var(--primary); padding-bottom: 15px;">
      <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 10px;">
        <img src="img/LOGO-PNB.png" alt="Logo PNB" style="max-height: 90px; width: auto;" onerror="this.style.display='none'">
      </div>
      <h2 style="color: var(--primary); margin: 0; font-family: 'Playfair Display', serif; font-size: 1.5rem;">CUERPO DE POLICÍA NACIONAL BOLIVARIANA</h2>
      <h3 style="color: var(--secondary); margin: 5px 0; font-size: 1rem;">CENTRO DE COORDINACIÓN POLICIAL ESTADAL (CCPE) ZULIA</h3>
      <p style="font-size: 0.95rem; color: #334155; margin-top: 15px; font-weight: 600;">
        N° de Reporte: <span style="color: var(--primary); font-size: 1.1rem;">${numeroReporte}</span>
      </p>
      <p style="font-size: 0.85rem; color: #64748b; margin: 5px 0;"><strong>Fecha de Consulta:</strong> ${fechaHoy.toLocaleString('es-VE')}</p>
      <p style="font-size: 0.85rem; color: #64748b; margin: 5px 0;"><strong>Generado por:</strong> ${user.email}</p>
    </div>`;
    
    if (datosProcesados?.tipo_delito) {
      html += `<div class="ficha-alert ficha-alert-delito" style="page-break-inside: avoid; margin: 15px 0; padding: 12px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 6px;">⚖️ <strong>Procesado por:</strong> ${datosProcesados.tipo_delito}</div>`;
    }
    
    const problemaJudicial = data.problema_judicial || '';
    if (problemaJudicial && problemaJudicial.trim() !== '' && problemaJudicial.toLowerCase() !== 'no') {
      html += `<div class="ficha-alert ficha-alert-judicial" style="page-break-inside: avoid; margin: 15px 0; padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; border-radius: 6px;">⚠️ <strong>Antecedentes:</strong> ${problemaJudicial}</div>`;
    }

    if (tipo === 'automovil' || tipo === 'moto') {
      if (data.foto_frontal || data.foto_trasera || data.foto_lado_derecho || data.foto_lado_izquierdo) {
        html += `<div class="seccion-titulo">📸 Fotografías del Vehículo</div><div class="fotos-container">`;
        if (data.foto_frontal) html += `<div class="foto-item"><img src="${data.foto_frontal}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
        if (data.foto_trasera) html += `<div class="foto-item"><img src="${data.foto_trasera}" onerror="this.style.display='none'"><div class="foto-item-label">Trasera</div></div>`;
        if (data.foto_lado_derecho) html += `<div class="foto-item"><img src="${data.foto_lado_derecho}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Der.</div></div>`;
        if (data.foto_lado_izquierdo) html += `<div class="foto-item"><img src="${data.foto_lado_izquierdo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Izq.</div></div>`;
        html += `</div>`;
      }
    } else if (tipo === 'vinculado') {
      if (data.foto_frontal_persona || data.foto_perfil_izq_persona || data.foto_perfil_der_persona) {
        html += `<div class="seccion-titulo">📸 Fotografías de la Persona</div><div class="fotos-container">`;
        if (data.foto_frontal_persona) html += `<div class="foto-item"><img src="${data.foto_frontal_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
        if (data.foto_perfil_izq_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_izq_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Izq.</div></div>`;
        if (data.foto_perfil_der_persona) html += `<div class="foto-item"><img src="${data.foto_perfil_der_persona}" onerror="this.style.display='none'"><div class="foto-item-label">Perfil Der.</div></div>`;
        html += `</div>`;
      }
      if (data.foto_frontal_vehiculo || data.foto_trasera_vehiculo || data.foto_lado_der_vehiculo || data.foto_lado_izq_vehiculo) {
        html += `<div class="seccion-titulo">📸 Fotografías del Vehículo</div><div class="fotos-container">`;
        if (data.foto_frontal_vehiculo) html += `<div class="foto-item"><img src="${data.foto_frontal_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Frontal</div></div>`;
        if (data.foto_trasera_vehiculo) html += `<div class="foto-item"><img src="${data.foto_trasera_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Trasera</div></div>`;
        if (data.foto_lado_der_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_der_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Der.</div></div>`;
        if (data.foto_lado_izq_vehiculo) html += `<div class="foto-item"><img src="${data.foto_lado_izq_vehiculo}" onerror="this.style.display='none'"><div class="foto-item-label">Lado Izq.</div></div>`;
        html += `</div>`;
      }
    }

    html += `<div class="seccion-titulo">🚗 Datos del Vehículo</div><div class="ficha-completa-grid">`;
    if (tipo === 'automovil' || tipo === 'moto') {
      const campos = [
        { label: 'Placa', value: data.placa, highlight: true },
        { label: 'Marca', value: data.marca },
        { label: 'Modelo', value: data.modelo },
        { label: 'Año', value: data.anio },
        { label: 'Color', value: data.color },
        { label: 'Serial Motor', value: data.serial_motor },
        { label: 'Serial Carroc.', value: data.serial_carroceria },
        { label: 'Cilindraje', value: data.cilindraje },
        { label: 'Tipo Carrocería', value: data.tipo_carroceria },
        { label: 'Cédula Propietario', value: data.cedula_propietario },
        { label: 'Estación', value: data.estacion_policial },
        { label: 'Estatus', value: data.estatus }
      ];
      campos.forEach(c => {
        if (c.value !== null && c.value !== undefined && c.value !== '') {
          const style = c.highlight ? 'font-weight:800; color:var(--primary); font-size:1.1rem;' : '';
          html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value" style="${style}">${c.value}</div></div>`;
        }
      });
      if (data.observaciones) html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Observaciones</div><div class="ficha-completa-value">${data.observaciones}</div></div>`;
      if (data.direccion_detencion) html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Dirección de Detención</div><div class="ficha-completa-value">${data.direccion_detencion}</div></div>`;
    } else if (tipo === 'vinculado') {
      const campos = [
        { label: 'Placa', value: data.placa, highlight: true },
        { label: 'Tipo Vehículo', value: data.tipo_vehiculo },
        { label: 'Marca', value: data.marca_vehiculo },
        { label: 'Modelo', value: data.modelo_vehiculo },
        { label: 'Año', value: data.anio_vehiculo },
        { label: 'Color', value: data.color_vehiculo },
        { label: 'Serial Motor', value: data.serial_motor },
        { label: 'Serial Carroc.', value: data.serial_carroceria },
        { label: 'Cilindraje', value: data.cilindraje },
        { label: 'Marca Corporal', value: data.marca_corporal },
        { label: 'Estación', value: data.estacion_policial },
        { label: 'Estatus', value: data.estatus }
      ];
      campos.forEach(c => {
        if (c.value !== null && c.value !== undefined && c.value !== '') {
          const style = c.highlight ? 'font-weight:800; color:var(--primary); font-size:1.1rem;' : '';
          html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value" style="${style}">${c.value}</div></div>`;
        }
      });
      if (data.observaciones) html += `<div class="ficha-completa-item full-width"><div class="ficha-completa-label">Observaciones</div><div class="ficha-completa-value">${data.observaciones}</div></div>`;
    }
    html += `</div>`;

    if (tipo === 'vinculado' && data.primer_nombre) {
      html += `<div class="seccion-titulo">👤 Datos de la Persona</div><div class="ficha-completa-grid">`;
      const campos = [
        { label: 'Primer Nombre', value: data.primer_nombre },
        { label: 'Segundo Nombre', value: data.segundo_nombre },
        { label: 'Primer Apellido', value: data.primer_apellido },
        { label: 'Segundo Apellido', value: data.segundo_apellido },
        { label: 'Cédula', value: data.cedula },
        { label: 'Fecha Nac.', value: data.fecha_nacimiento },
        { label: 'Edad', value: data.edad ? `${data.edad} años` : null },
        { label: 'Apodo', value: data.apodo },
        { label: 'Nacionalidad', value: data.nacionalidad },
        { label: 'Sexo', value: data.sexo },
        { label: 'Estatura', value: data.estatura_cm ? `${data.estatura_cm} cm` : null },
        { label: 'Color Piel', value: data.color_piel },
        { label: 'Color Ojos', value: data.color_ojos },
        { label: 'Color Cabello', value: data.color_cabello },
        { label: 'Complexión', value: data.complexion },
        { label: 'Teléfono', value: `${data.tlf_pais || ''} ${data.tlf_numero || ''}`.trim() || null },
        { label: 'Dirección', value: data.direccion },
        { label: 'Lentes', value: data.usa_lentes !== undefined ? (data.usa_lentes ? 'Sí' : 'No') : null },
        { label: 'Detalle Lentes', value: data.detalle_lentes },
        { label: 'Perforaciones', value: data.perforaciones !== undefined ? (data.perforaciones ? 'Sí' : 'No') : null },
        { label: 'Detalle Perfor.', value: data.detalle_perforaciones },
        { label: 'Cond. Médica', value: data.condicion_medica },
        { label: 'Medicamento', value: data.consume_medicamento },
        { label: 'Prob. Judicial', value: data.problema_judicial }
      ];
      campos.forEach(c => {
        if (c.value !== null && c.value !== undefined && c.value !== '') {
          html += `<div class="ficha-completa-item"><div class="ficha-completa-label">${c.label}</div><div class="ficha-completa-value">${c.value}</div></div>`;
        }
      });
      html += `</div>`;
    }

    html += `<div class="seccion-titulo" style="margin-top: 30px;">📜 Historial de Incidencias</div>`;
    try {
      const { data: incidencias } = await window.supabaseClient.from('registro_incidencias').select('*').eq('cedula', identificador).eq('tipo_registro', tipo).order('fecha_hora', { ascending: false });
      if (incidencias && incidencias.length > 0) {
        html += `<div class="incidencias-print-container">`;
        incidencias.forEach(inc => {
          html += `<div class="incidencia-item-print" style="border: 1px solid #e2e8f0; padding: 10px; margin-bottom: 10px; border-left: 4px solid var(--secondary); border-radius: 4px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; margin-bottom: 5px;">
              <span>🕒 ${new Date(inc.fecha_hora).toLocaleString('es-VE')}</span>
              <span>Por: ${inc.email_registrante || 'N/A'}</span>
            </div>
            <div style="font-size: 0.9rem; color: #1e293b; line-height: 1.5;">${inc.descripcion}</div>
          </div>`;
        });
        html += `</div>`;
      } else {
        html += `<div style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic; border: 1px dashed #cbd5e1; border-radius: 5px;">No hay incidencias registradas para este expediente.</div>`;
      }
    } catch (err) { /* Silencioso */ }
    
    html += `<div class="reporte-footer-print" style="margin-top: 40px; text-align: center; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
      <p>Documento generado electrónicamente por el Sistema de Verificación y Registro Policial.</p>
      <p>Este reporte es de carácter informativo y confidencial. Uso exclusivo del CPNB.</p>
    </div>`;
    
    modalBody.innerHTML = html;
    console.log("✅ Detalles completos generados correctamente");
  } catch (err) {
    console.error('❌ Error generando reporte:', err);
    modalBody.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger);">
      <h3>❌ Error al generar el reporte</h3>
      <p>${err.message}</p>
    </div>`;
  }
}
