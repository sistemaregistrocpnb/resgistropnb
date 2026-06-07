window.initConsultaPersonas = function() {
    console.log("️ Iniciando módulo consulta-personas.js...");

    if (window._consultaPersonasInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
        return;
    }
    window._consultaPersonasInitialized = true;

    const el = (id) => document.getElementById(id);
    const buscarInput = el('cp_buscar_cedula');
    const btnBuscar = el('cp_btn_buscar');
    const msg = el('cp_msg');
    const fichaBreve = el('cp_ficha_breve');
    const incidenciasSection = el('cp_incidencias_section');
    const modalDetalles = el('cp_modal_detalles');
    const modalIncidencia = el('cp_modal_incidencia');
    const modalTitulo = el('cp_modal_titulo');
    const modalBody = el('cp_modal_body');

    let personaActual = null;
    let tipoRegistroActual = null;
    let datosProcesado = null;

    // Event listeners
    if (btnBuscar) btnBuscar.onclick = () => buscarPersona();

    if (buscarInput) {
        buscarInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar?.click();
            }
        });
    }

    if (el('cp_modal_close')) el('cp_modal_close').onclick = () => modalDetalles.classList.remove('active');
    if (el('cp_modal_cerrar')) el('cp_modal_cerrar').onclick = () => modalDetalles.classList.remove('active');
    if (el('cp_modal_inc_close')) el('cp_modal_inc_close').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cp_btn_cancelar_incidencia')) el('cp_btn_cancelar_incidencia').onclick = () => modalIncidencia.classList.remove('active');
    if (el('cp_btn_guardar_incidencia')) el('cp_btn_guardar_incidencia').onclick = () => guardarIncidencia();

    // Función para mostrar mensaje
    function mostrarMensaje(texto, tipo) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `msg ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') {
            setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
        }
    }

    // Verificar permisos del usuario
    function tienePermisosIncidencia() {
        const rol = sessionStorage.getItem('pnb_user_role') || '';
        const rolLower = rol.toLowerCase();
        return rolLower === 'administrador' || rolLower === 'moderador';
    }

    // Buscar persona
    async function buscarPersona() {
        const cedula = buscarInput?.value.trim().replace(/\D/g, '') || '';
        
        if (!cedula || cedula.length < 7) {
            mostrarMensaje('⚠️ Ingrese una cédula válida (mínimo 7 dígitos)', 'error');
            return;
        }

        mostrarMensaje('⏳ Buscando...', 'info');
        fichaBreve.style.display = 'none';
        incidenciasSection.style.display = 'none';
        personaActual = null;
        tipoRegistroActual = null;
        datosProcesado = null;

        try {
            // Buscar en registro_personas
            const { data: persona, error: errPersona } = await window.supabaseClient
                .from('registro_personas')
                .select('*')
                .eq('cedula', cedula)
                .maybeSingle();

            if (errPersona) throw errPersona;

            if (persona) {
                personaActual = persona;
                tipoRegistroActual = 'persona';
                
                // Si está procesado, buscar el tipo de delito
                const estatus = (persona.estatus || '').toLowerCase();
                if (estatus.includes('procesad')) {
                    try {
                        const { data: procData } = await window.supabaseClient
                            .from('registro_procesados')
                            .select('tipo_delito, tipo_registro')
                            .eq('cedula', cedula)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                        if (procData) datosProcesado = procData;
                    } catch (e) {
                        console.warn('No se pudo obtener datos de procesados:', e);
                    }
                }
                
                renderFichaBreve(persona, 'persona');
                await cargarIncidencias(cedula, 'persona');
                mostrarMensaje('✅ Persona encontrada', 'success');
                return;
            }

            // Buscar en registro_vinculados
            const { data: vinculado, error: errVinculado } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .eq('cedula', cedula)
                .maybeSingle();

            if (errVinculado) throw errVinculado;

            if (vinculado) {
                personaActual = vinculado;
                tipoRegistroActual = 'vinculado';
                renderFichaBreve(vinculado, 'vinculado');
                await cargarIncidencias(cedula, 'vinculado');
                mostrarMensaje('✅ Persona vinculada encontrada', 'success');
                return;
            }

            mostrarMensaje('❌ No se encontró ninguna persona con esa cédula', 'error');

        } catch (err) {
            console.error('❌ Error buscando persona:', err);
            mostrarMensaje(' Error: ' + err.message, 'error');
        }
    }

    // Renderizar ficha breve
    function renderFichaBreve(data, tipo) {
        if (!fichaBreve) return;

        const estatus = data.estatus || 'N/A';
        const estatusLower = (estatus || '').toLowerCase();
        const estatusClass = estatusLower.includes('verificaci') ? 'estatus-verificacion' : 
                            estatusLower.includes('procesad') ? 'estatus-procesado' : 'estatus-liberado';

        // Nombre completo
        let nombreCompleto = '';
        if (tipo === 'persona') {
            nombreCompleto = `${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}`.trim() || 'N/A';
        } else {
            nombreCompleto = data.propietario || data.cedula || 'N/A';
        }

        // Alertas (tipo de delito y antecedentes judiciales)
        let alertasHtml = '';
        
        // Tipo de delito (si está procesado)
        if (estatusLower.includes('procesad') && datosProcesado?.tipo_delito) {
            alertasHtml += `
                <div class="ficha-alert ficha-alert-delito">
                    ⚖️ <strong>Procesado por:</strong> ${datosProcesado.tipo_delito}
                </div>
            `;
        }
        
        // Antecedentes judiciales
        const problemaJudicial = data.problema_judicial || '';
        if (problemaJudicial && problemaJudicial.trim() !== '' && problemaJudicial.toLowerCase() !== 'no') {
            alertasHtml += `
                <div class="ficha-alert ficha-alert-judicial">
                    ⚠️ <strong>Antecedentes Judiciales:</strong> ${problemaJudicial}
                </div>
            `;
        }

        // Observaciones
        const observaciones = data.observaciones || '';
        let observacionesHtml = '';
        if (observaciones && observaciones.trim() !== '') {
            observacionesHtml = `
                <div class="ficha-breve-item full-width">
                    <div class="ficha-breve-label">📝 Observaciones</div>
                    <div class="ficha-breve-value">${observaciones}</div>
                </div>
            `;
        }

        // Botón de nueva incidencia (solo para admin/moderador)
        const tienePermisos = tienePermisosIncidencia();
        let btnIncidenciaHtml = '';
        if (tienePermisos) {
            btnIncidenciaHtml = `<button type="button" class="btn-nueva-incidencia" id="cp_btn_nueva_incidencia"> Nueva Incidencia</button>`;
        }

        let html = `
            <div class="ficha-breve">
                <div class="ficha-breve-header">
                    <h3>👤 ${nombreCompleto}</h3>
                    <span class="estatus-badge ${estatusClass}">${estatus}</span>
                </div>
                
                ${alertasHtml}
                
                <div class="ficha-breve-grid">
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Cédula</div>
                        <div class="ficha-breve-value">${data.cedula || 'N/A'}</div>
                    </div>
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Tipo de Registro</div>
                        <div class="ficha-breve-value">${tipo === 'persona' ? ' Persona' : '🔗 Vinculado'}</div>
                    </div>
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Estación de Detención</div>
                        <div class="ficha-breve-value">${data.estacion_policial || 'N/A'}</div>
                    </div>
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Fecha de Registro</div>
                        <div class="ficha-breve-value">${new Date(data.created_at || data.creado_en).toLocaleString('es-VE')}</div>
                    </div>
                    ${observacionesHtml}
                </div>
                
                <div class="ficha-breve-actions">
                    <button type="button" class="btn-ver-detalles" id="cp_btn_ver_detalles">📋 Ver Detalles Completos</button>
                    ${btnIncidenciaHtml}
                </div>
            </div>
        `;

        fichaBreve.innerHTML = html;
        fichaBreve.style.display = 'block';

        // Event listeners
        setTimeout(() => {
            const btnDetalles = el('cp_btn_ver_detalles');
            if (btnDetalles) {
                btnDetalles.onclick = () => mostrarDetallesCompletos(data, tipo);
            }
            
            const btnIncidencia = el('cp_btn_nueva_incidencia');
            if (btnIncidencia) {
                btnIncidencia.onclick = () => {
                    modalIncidencia.classList.add('active');
                    el('cp_incidencia_descripcion').value = '';
                    el('cp_incidencia_descripcion').focus();
                };
            }
        }, 100);
    }

    // Mostrar detalles completos
    function mostrarDetallesCompletos(data, tipo) {
        if (!modalBody || !modalTitulo) return;

        modalTitulo.textContent = `📋 Detalles Completos - ${tipo === 'persona' ? 'Persona' : 'Vinculado'}`;

        let html = '';

        if (tipo === 'persona') {
            // Fotos
            if (data.foto_frontal || data.foto_perfil_izq || data.foto_perfil_der) {
                html += `<div class="seccion-titulo">📸 Fotografías</div>`;
                html += `<div class="fotos-container">`;
                
                if (data.foto_frontal) {
                    html += `
                        <div class="foto-item">
                            <img src="${data.foto_frontal}" alt="Frontal" onerror="this.style.display='none'">
                            <div class="foto-item-label">Frontal</div>
                        </div>
                    `;
                }
                if (data.foto_perfil_izq) {
                    html += `
                        <div class="foto-item">
                            <img src="${data.foto_perfil_izq}" alt="Perfil Izquierdo" onerror="this.style.display='none'">
                            <div class="foto-item-label">Perfil Izquierdo</div>
                        </div>
                    `;
                }
                if (data.foto_perfil_der) {
                    html += `
                        <div class="foto-item">
                            <img src="${data.foto_perfil_der}" alt="Perfil Derecho" onerror="this.style.display='none'">
                            <div class="foto-item-label">Perfil Derecho</div>
                        </div>
                    `;
                }
                
                html += `</div>`;
            }

            // Datos personales
            html += `<div class="seccion-titulo"> Datos Personales</div>`;
            html += `<div class="ficha-completa-grid">`;
            
            const camposPersona = [
                { label: 'Primer Nombre', value: data.primer_nombre },
                { label: 'Segundo Nombre', value: data.segundo_nombre },
                { label: 'Primer Apellido', value: data.primer_apellido },
                { label: 'Segundo Apellido', value: data.segundo_apellido },
                { label: 'Cédula', value: data.cedula },
                { label: 'Fecha de Nacimiento', value: data.fecha_nacimiento },
                { label: 'Edad', value: data.edad ? `${data.edad} años` : null },
                { label: 'Nacionalidad', value: data.nacionalidad },
                { label: 'Sexo', value: data.sexo },
                { label: 'Estatura', value: data.estatura_cm ? `${data.estatura_cm} cm` : null },
                { label: 'Color de Piel', value: data.color_piel },
                { label: 'Color de Ojos', value: data.color_ojos },
                { label: 'Color de Cabello', value: data.color_cabello },
                { label: 'Complexión', value: data.complexion },
                { label: 'Teléfono', value: `${data.tlf_pais || ''} ${data.tlf_numero || ''}`.trim() || null },
                { label: 'Dirección', value: data.direccion },
                { label: 'Apodo', value: data.apodo },
                { label: 'Marca Corporal', value: data.marca_corporal },
                { label: 'Usa Lentes', value: data.usa_lentes ? 'Sí' : 'No' },
                { label: 'Detalle Lentes', value: data.detalle_lentes },
                { label: 'Perforaciones', value: data.perforaciones ? 'Sí' : 'No' },
                { label: 'Detalle Perforaciones', value: data.detalle_perforaciones },
                { label: 'Condición Médica', value: data.condicion_medica },
                { label: 'Consume Medicamento', value: data.consume_medicamento },
                { label: 'Problema Judicial', value: data.problema_judicial },
                { label: 'Estación de Detención', value: data.estacion_policial },
                { label: 'Dirección de Detención', value: data.direccion_detencion },
                { label: 'Estatus', value: data.estatus },
                { label: 'Fecha de Registro', value: new Date(data.created_at || data.creado_en).toLocaleString('es-VE') }
            ];

            camposPersona.forEach(campo => {
                if (campo.value !== null && campo.value !== undefined && campo.value !== '') {
                    const isFullWidth = ['direccion', 'direccion_detencion', 'problema_judicial', 'observaciones', 'marca_corporal'].includes(campo.label.toLowerCase().replace(/ /g, '_'));
                    html += `
                        <div class="ficha-completa-item ${isFullWidth ? 'full-width' : ''}">
                            <div class="ficha-completa-label">${campo.label}</div>
                            <div class="ficha-completa-value">${campo.value}</div>
                        </div>
                    `;
                }
            });

            // Observaciones
            if (data.observaciones) {
                html += `
                    <div class="ficha-completa-item full-width">
                        <div class="ficha-completa-label"> Observaciones</div>
                        <div class="ficha-completa-value">${data.observaciones}</div>
                    </div>
                `;
            }

            html += `</div>`;

        } else {
            // Vinculado - Vehículo
            html += `<div class="seccion-titulo">🚗 Datos del Vehículo</div>`;
            html += `<div class="ficha-completa-grid">`;
            
            const camposVinculado = [
                { label: 'Cédula', value: data.cedula },
                { label: 'Placa', value: data.placa },
                { label: 'Tipo de Vehículo', value: data.tipo_vehiculo },
                { label: 'Marca', value: data.marca },
                { label: 'Modelo', value: data.modelo },
                { label: 'Color', value: data.color },
                { label: 'Año', value: data.anio },
                { label: 'Serial Motor', value: data.serial_motor },
                { label: 'Serial Carrocería', value: data.serial_carroceria },
                { label: 'Propietario', value: data.propietario },
                { label: 'Estación de Detención', value: data.estacion_policial },
                { label: 'Estatus', value: data.estatus },
                { label: 'Fecha de Registro', value: new Date(data.created_at).toLocaleString('es-VE') }
            ];

            camposVinculado.forEach(campo => {
                if (campo.value !== null && campo.value !== undefined && campo.value !== '') {
                    html += `
                        <div class="ficha-completa-item">
                            <div class="ficha-completa-label">${campo.label}</div>
                            <div class="ficha-completa-value">${campo.value}</div>
                        </div>
                    `;
                }
            });

            if (data.observaciones) {
                html += `
                    <div class="ficha-completa-item full-width">
                        <div class="ficha-completa-label"> Observaciones</div>
                        <div class="ficha-completa-value">${data.observaciones}</div>
                    </div>
                `;
            }

            html += `</div>`;
        }

        modalBody.innerHTML = html;
        modalDetalles.classList.add('active');
    }

    // Cargar incidencias
    async function cargarIncidencias(cedula, tipo) {
        if (!incidenciasSection) return;

        try {
            const { data: incidencias, error } = await window.supabaseClient
                .from('registro_incidencias')
                .select('*')
                .eq('cedula', cedula)
                .eq('tipo_registro', tipo)
                .order('fecha_hora', { ascending: false });

            if (error) throw error;

            let html = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3>';

            if (!incidencias || incidencias.length === 0) {
                html += '<div class="sin-incidencias">No hay incidencias registradas</div>';
            } else {
                incidencias.forEach(inc => {
                    html += `
                        <div class="incidencia-item">
                            <div class="incidencia-item-header">
                                <span class="incidencia-fecha">📅 ${new Date(inc.fecha_hora).toLocaleString('es-VE')}</span>
                                <span class="incidencia-autor">Por: ${inc.email_registrante || 'N/A'}</span>
                            </div>
                            <div class="incidencia-descripcion">${inc.descripcion}</div>
                        </div>
                    `;
                });
            }

            html += '</div>';
            incidenciasSection.innerHTML = html;
            incidenciasSection.style.display = 'block';

        } catch (err) {
            console.error('❌ Error cargando incidencias:', err);
            incidenciasSection.innerHTML = '<div class="incidencias-section"><h3> Historial de Incidencias</h3><div class="sin-incidencias">Error al cargar incidencias</div></div>';
            incidenciasSection.style.display = 'block';
        }
    }

    // Guardar nueva incidencia
    async function guardarIncidencia() {
        const descripcion = el('cp_incidencia_descripcion')?.value.trim();
        
        if (!descripcion) {
            alert('️ Ingrese una descripción para la incidencia');
            return;
        }

        const btnGuardar = el('cp_btn_guardar_incidencia');
        btnGuardar.disabled = true;
        btnGuardar.textContent = '⏳ Guardando...';

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión');

            const incidencia = {
                cedula: personaActual.cedula,
                tipo_registro: tipoRegistroActual,
                descripcion: descripcion,
                fecha_hora: new Date().toISOString(),
                registrada_por: user.id,
                email_registrante: user.email
            };

            const { error } = await window.supabaseClient
                .from('registro_incidencias')
                .insert([incidencia]);

            if (error) throw error;

            modalIncidencia.classList.remove('active');
            mostrarMensaje('✅ Incidencia registrada exitosamente', 'success');
            
            // Recargar incidencias
            await cargarIncidencias(personaActual.cedula, tipoRegistroActual);

        } catch (err) {
            console.error('❌ Error guardando incidencia:', err);
            alert('❌ Error: ' + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = '💾 Guardar Incidencia';
        }
    }

    console.log("✅ Módulo consulta-personas.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initConsultaPersonas);
} else {
    window.initConsultaPersonas();
}
