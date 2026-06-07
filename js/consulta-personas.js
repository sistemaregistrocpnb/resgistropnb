window.initConsultaPersonas = function() {
    console.log("⚙️ Iniciando módulo consulta-personas.js...");

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
    const btnNuevaIncidencia = el('cp_btn_nueva_incidencia');

    let personaActual = null;
    let tipoRegistroActual = null; // 'persona' o 'vinculado'

    // Event listeners
    if (btnBuscar) {
        btnBuscar.onclick = () => buscarPersona();
    }

    if (buscarInput) {
        buscarInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar?.click();
            }
        });
    }

    if (el('cp_modal_close')) {
        el('cp_modal_close').onclick = () => modalDetalles.classList.remove('active');
    }

    if (el('cp_modal_cerrar')) {
        el('cp_modal_cerrar').onclick = () => modalDetalles.classList.remove('active');
    }

    if (el('cp_modal_inc_close')) {
        el('cp_modal_inc_close').onclick = () => modalIncidencia.classList.remove('active');
    }

    if (el('cp_btn_cancelar_incidencia')) {
        el('cp_btn_cancelar_incidencia').onclick = () => modalIncidencia.classList.remove('active');
    }

    if (btnNuevaIncidencia) {
        btnNuevaIncidencia.onclick = () => {
            modalIncidencia.classList.add('active');
            el('cp_incidencia_descripcion').value = '';
            el('cp_incidencia_descripcion').focus();
        };
    }

    if (el('cp_btn_guardar_incidencia')) {
        el('cp_btn_guardar_incidencia').onclick = () => guardarIncidencia();
    }

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
                renderFichaBreve(persona, 'persona');
                await cargarIncidencias(cedula, 'persona');
                mostrarMensaje('✅ Persona encontrada', 'success');
                return;
            }

            // Buscar en registro_vinculados
            const { data: vinculado, error: errVinculado } = await window.supabaseClient
                .from('registro_vinculados')
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
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        }
    }

    // Renderizar ficha breve
    function renderFichaBreve(data, tipo) {
        if (!fichaBreve) return;

        const estatus = data.estatus || 'N/A';
        const estatusClass = estatus.toLowerCase().includes('verificación') ? 'estatus-verificacion' : 
                            estatus.toLowerCase().includes('procesado') ? 'estatus-procesado' : 'estatus-liberado';

        let html = `
            <div class="ficha-breve">
                <div class="ficha-breve-header">
                    <h3>👤 ${data.primer_nombre || ''} ${data.segundo_nombre || ''} ${data.primer_apellido || ''} ${data.segundo_apellido || ''}</h3>
                    <span class="estatus-badge ${estatusClass}">${estatus}</span>
                </div>
                <div class="ficha-breve-grid">
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Cédula</div>
                        <div class="ficha-breve-value">${data.cedula || 'N/A'}</div>
                    </div>
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Tipo de Registro</div>
                        <div class="ficha-breve-value">${tipo === 'persona' ? '👤 Persona' : '🔗 Vinculado'}</div>
                    </div>
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Estación Policial</div>
                        <div class="ficha-breve-value">${data.estacion_policial || 'N/A'}</div>
                    </div>
                    <div class="ficha-breve-item">
                        <div class="ficha-breve-label">Fecha de Registro</div>
                        <div class="ficha-breve-value">${new Date(data.created_at || data.creado_en).toLocaleString('es-VE')}</div>
                    </div>
                </div>
                <button type="button" class="btn-ver-detalles" id="cp_btn_ver_detalles">📋 Ver Detalles Completos</button>
            </div>
        `;

        fichaBreve.innerHTML = html;
        fichaBreve.style.display = 'block';

        // Event listener para ver detalles
        setTimeout(() => {
            const btnDetalles = el('cp_btn_ver_detalles');
            if (btnDetalles) {
                btnDetalles.onclick = () => mostrarDetallesCompletos(data, tipo);
            }
        }, 100);
    }

    // Mostrar detalles completos
    function mostrarDetallesCompletos(data, tipo) {
        if (!modalBody || !modalTitulo) return;

        modalTitulo.textContent = ` Detalles Completos - ${tipo === 'persona' ? 'Persona' : 'Vinculado'}`;

        let html = '<div class="ficha-completa-grid">';

        if (tipo === 'persona') {
            const campos = [
                { label: 'Primer Nombre', value: data.primer_nombre },
                { label: 'Segundo Nombre', value: data.segundo_nombre },
                { label: 'Primer Apellido', value: data.primer_apellido },
                { label: 'Segundo Apellido', value: data.segundo_apellido },
                { label: 'Cédula', value: data.cedula },
                { label: 'Fecha de Nacimiento', value: data.fecha_nacimiento },
                { label: 'Edad', value: data.edad },
                { label: 'Nacionalidad', value: data.nacionalidad },
                { label: 'Sexo', value: data.sexo },
                { label: 'Estatura (cm)', value: data.estatura_cm },
                { label: 'Color de Piel', value: data.color_piel },
                { label: 'Color de Ojos', value: data.color_ojos },
                { label: 'Color de Cabello', value: data.color_cabello },
                { label: 'Complexión', value: data.complexion },
                { label: 'Teléfono', value: `${data.tlf_pais || ''} ${data.tlf_numero || ''}` },
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
                { label: 'Estación Policial', value: data.estacion_policial },
                { label: 'Dirección de Detención', value: data.direccion_detencion },
                { label: 'Estatus', value: data.estatus },
                { label: 'Observaciones', value: data.observaciones },
                { label: 'Fecha de Registro', value: new Date(data.created_at || data.creado_en).toLocaleString('es-VE') }
            ];

            campos.forEach(campo => {
                if (campo.value !== null && campo.value !== undefined && campo.value !== '') {
                    html += `
                        <div class="ficha-completa-item">
                            <div class="ficha-completa-label">${campo.label}</div>
                            <div class="ficha-completa-value">${campo.value}</div>
                        </div>
                    `;
                }
            });
        } else {
            // Campos para vinculado
            const campos = [
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
                { label: 'Estación Policial', value: data.estacion_policial },
                { label: 'Estatus', value: data.estatus },
                { label: 'Observaciones', value: data.observaciones },
                { label: 'Fecha de Registro', value: new Date(data.created_at).toLocaleString('es-VE') }
            ];

            campos.forEach(campo => {
                if (campo.value !== null && campo.value !== undefined && campo.value !== '') {
                    html += `
                        <div class="ficha-completa-item">
                            <div class="ficha-completa-label">${campo.label}</div>
                            <div class="ficha-completa-value">${campo.value}</div>
                        </div>
                    `;
                }
            });
        }

        html += '</div>';
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
            incidenciasSection.innerHTML = '<div class="incidencias-section"><h3>📜 Historial de Incidencias</h3><div class="sin-incidencias">Error al cargar incidencias</div></div>';
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
            console.error(' Error guardando incidencia:', err);
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
