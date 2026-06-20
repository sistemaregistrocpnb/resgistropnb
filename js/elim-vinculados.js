// ✅ MARCA DE VERIFICACIÓN: Si ves este mensaje, el archivo se actualizó correctamente.
console.log("✅ VERSIÓN FINAL: elim-vinculado.js cargado (IDs corregidos y SIN AWAIT ERRÓNEO)");

window.initElimVinculados = function() {
    console.log("✅ Módulo initElimVinculados ejecutándose...");

    // 🔹 Referencias DOM (CORREGIDAS para coincidir con elim-vinculado.html)
    const buscarInput = document.getElementById('buscar-vinc-elim');
    const buscarBtn = document.getElementById('btn-buscar-vinc-elim');
    const msgBuscar = document.getElementById('buscar-msg-vinc');
    const archivedNotice = document.getElementById('archived-notice-vinc');
    const dataContainer = document.getElementById('vinc-data-container');
    const archivedBanner = document.getElementById('archived-banner-vinc');
    const archivedDate = document.getElementById('archived-date-vinc');
    const archivedBy = document.getElementById('archived-by-vinc');
    
    const btnEliminar = document.getElementById('btn-eliminar-vinc');
    const btnReintegrar = document.getElementById('btn-reintegrar-vinc');
    const msgElim = document.getElementById('msg-vinc');
    
    const modal = document.getElementById('vinc-modal');
    const modalTitle = document.getElementById('modal-title-vinc');
    const modalText = document.getElementById('modal-text-vinc');
    const btnModalYes = document.getElementById('btn-modal-yes-vinc');
    const btnModalNo = document.getElementById('btn-modal-no-vinc');

    let currentData = null;
    let isArchived = false;
    let pendingAction = null;

    // 🔹 Helpers UI
    const showMsg = (el, txt, type) => { 
        if(el) { 
            el.innerHTML = txt; 
            el.className = `search-msg ${type}`; 
            el.style.display = 'block'; 
        } 
    };
    const hideMsg = (el) => { if(el) el.style.display = 'none'; };
    
    const showMsgElim = (txt, type) => { 
        if(msgElim) {
            msgElim.innerHTML = txt; 
            msgElim.className = `msg ${type}`; 
            msgElim.style.display = 'block'; 
        }
    };
    const hideMsgElim = () => { if(msgElim) msgElim.style.display = 'none'; };
    
    const setVal = (id, val) => { 
        const el = document.getElementById(id); 
        if(el) el.value = (val !== null && val !== undefined && val !== '') ? val : '-'; 
    };
    
    const setPhoto = (imgId, url) => { 
        const img = document.getElementById(imgId); 
        if (img) { 
            img.src = url || ''; 
            img.style.display = url ? 'block' : 'none'; 
        } 
    };

    // 🔹 Mostrar datos en el formulario
    function cargarDatos(data, source) {
        currentData = data;
        isArchived = (source === 'eliminados_vinculados');
        
        if(dataContainer) dataContainer.style.display = 'block';
        hideMsg(msgBuscar);
        hideMsgElim();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Persona
        setVal('ev-p-n1', data.primer_nombre);
        setVal('ev-p-n2', data.segundo_nombre);
        setVal('ev-p-a1', data.primer_apellido);
        setVal('ev-p-a2', data.segundo_apellido);
        setVal('ev-p-cedula', data.cedula);
        setVal('ev-p-apodo', data.apodo);
        setVal('ev-p-fnac', data.fecha_nacimiento);
        setVal('ev-p-edad', data.edad ? `${data.edad} años` : '-');
        setVal('ev-p-marca', data.marca_corporal);
        setVal('ev-p-nac', data.nacionalidad);
        setVal('ev-p-sexo', data.sexo);
        setVal('ev-p-tlf-pais', data.tlf_pais);
        setVal('ev-p-tlf-num', data.tlf_numero);
        setVal('ev-p-dir', data.direccion);

        // Características Físicas
        setVal('ev-p-est', data.estatura_cm);
        setVal('ev-p-piel', data.color_piel);
        setVal('ev-p-ojos', data.color_ojos);
        setVal('ev-p-cabello', data.color_cabello);
        setVal('ev-p-comp', data.complexion);

        // Salud y Antecedentes (con lógica para mostrar/ocultar detalles)
        setVal('ev-p-lentes', data.usa_lentes);
        const boxLentes = document.getElementById('box-ev-lentes-det');
        if(boxLentes) boxLentes.style.display = (data.usa_lentes === 'Sí' || data.usa_lentes === 'Si') ? 'block' : 'none';
        setVal('ev-p-lentes-det', data.detalle_lentes);

        setVal('ev-p-perf', data.perforaciones);
        const boxPerf = document.getElementById('box-ev-perf-det');
        if(boxPerf) boxPerf.style.display = (data.perforaciones === 'Sí' || data.perforaciones === 'Si') ? 'block' : 'none';
        setVal('ev-p-perf-det', data.detalle_perforaciones);

        setVal('ev-p-cond', data.condicion_medica);
        const boxCond = document.getElementById('box-ev-cond-det');
        if(boxCond) boxCond.style.display = (data.condicion_medica === 'Sí' || data.condicion_medica === 'Si') ? 'block' : 'none';
        setVal('ev-p-cond-det', data.detalle_condicion_medica);

        setVal('ev-p-med', data.consume_medicamento);
        const boxMed = document.getElementById('box-ev-med-det');
        if(boxMed) boxMed.style.display = (data.consume_medicamento === 'Sí' || data.consume_medicamento === 'Si') ? 'block' : 'none';
        setVal('ev-p-med-det', data.detalle_medicamento);

        setVal('ev-p-jud', data.problema_judicial);
        const boxJud = document.getElementById('box-ev-jud-det');
        if(boxJud) boxJud.style.display = (data.problema_judicial === 'Sí' || data.problema_judicial === 'Si') ? 'block' : 'none';
        setVal('ev-p-jud-det', data.detalle_problema_judicial);

        // Fotos Persona
        setPhoto('ev-foto-p-frontal', data.foto_frontal_persona);
        setPhoto('ev-foto-p-izq', data.foto_perfil_izq_persona);
        setPhoto('ev-foto-p-der', data.foto_perfil_der_persona);

        // Vehículo
        setVal('ev-v-tipo', data.tipo_vehiculo);
        setVal('ev-v-placa', data.placa);
        setVal('ev-v-serial-carro', data.serial_carroceria);
        setVal('ev-v-serial-motor', data.serial_motor);
        setVal('ev-v-cilindraje', data.cilindraje);
        setVal('ev-v-marca', data.marca_vehiculo);
        setVal('ev-v-modelo', data.modelo_vehiculo);
        setVal('ev-v-anio', data.anio_vehiculo);
        setVal('ev-v-color', data.color_vehiculo);

        // Fotos Vehículo
        setPhoto('ev-foto-v-frontal', data.foto_frontal_vehiculo);
        setPhoto('ev-foto-v-trasera', data.foto_trasera_vehiculo);
        setPhoto('ev-foto-v-der', data.foto_lado_der_vehiculo);
        setPhoto('ev-foto-v-izq', data.foto_lado_izq_vehiculo);

        // Registro
        setVal('ev-estacion', data.estacion_policial);
        setVal('ev-dir-det', data.direccion_detencion);
        setVal('ev-obs', data.observaciones);

        // Estado (Activo vs Archivado)
        if (isArchived) {
            if (archivedNotice) archivedNotice.style.display = 'block';
            if (archivedBanner) archivedBanner.style.display = 'block';
            if (archivedDate && data.eliminado_en) {
                archivedDate.textContent = new Date(data.eliminado_en).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });
            } else if (archivedDate) {
                archivedDate.textContent = '-';
            }
            if (archivedBy) archivedBy.textContent = data.eliminado_por || 'Sistema';
            
            if (btnEliminar) btnEliminar.style.display = 'none';
            if (btnReintegrar) btnReintegrar.style.display = 'block';
        } else {
            if (archivedNotice) archivedNotice.style.display = 'none';
            if (archivedBanner) archivedBanner.style.display = 'none';
            if (btnEliminar) btnEliminar.style.display = 'block';
            if (btnReintegrar) btnReintegrar.style.display = 'none';
        }
    }

    // ==========================================
    // 🔍 BÚSQUEDA MULTI-TABLA (ASYNC)
    // ==========================================
    function detectarCoincidencias(reg, val) {
        const campos = [];
        const v = val.trim().toUpperCase();
        if (reg.cedula && reg.cedula.toUpperCase().includes(v)) campos.push('Cédula');
        if (reg.placa && reg.placa.toUpperCase().includes(v)) campos.push('Placa');
        if (reg.serial_carroceria && reg.serial_carroceria.toUpperCase().includes(v)) campos.push('Serial Carrocería');
        if (reg.serial_motor && reg.serial_motor.toUpperCase().includes(v)) campos.push('Serial Motor');
        return campos;
    }

    async function buscarEnTodasLasTablas(valor) {
        const resultados = [];
        const val = valor.trim().toUpperCase();
        // Consulta OR de Supabase para búsqueda parcial
        const query = `cedula.ilike.%${val}%,placa.ilike.%${val}%,serial_carroceria.ilike.%${val}%,serial_motor.ilike.%${val}%`;
        
        try {
            // 1. Vinculados Activos
            const { data: vinculados, error: errVinc } = await window.supabaseClient
                .from('registro_vinculado')
                .select('*')
                .or(query);
                
            if (!errVinc && vinculados && vinculados.length > 0) {
                vinculados.forEach(reg => {
                    resultados.push({
                        origen: 'registro_vinculado', 
                        datos: reg, 
                        eliminado: false,
                        encontrado_por: detectarCoincidencias(reg, val)
                    });
                });
            }

            // 2. Vinculados Archivados
            const { data: eliminados, error: errElim } = await window.supabaseClient
                .from('eliminados_vinculados')
                .select('*')
                .or(query);
                
            if (!errElim && eliminados && eliminados.length > 0) {
                eliminados.forEach(reg => {
                    resultados.push({
                        origen: 'eliminados_vinculados', 
                        datos: reg, 
                        eliminado: true,
                        encontrado_por: detectarCoincidencias(reg, val)
                    });
                });
            }
            return resultados;
        } catch (err) {
            console.error('Error en búsqueda:', err);
            throw err;
        }
    }

    // 🔍 LISTENER PRINCIPAL DE BÚSQUEDA (ASYNC)
    if (buscarBtn && buscarInput) {
        buscarBtn.addEventListener('click', async () => {
            const val = buscarInput.value.trim();
            if (val.length < 3) return showMsg(msgBuscar, '⚠️ Ingrese un dato válido (mín. 3 caracteres).', 'error');
            
            showMsg(msgBuscar, '🔍 Buscando en registros vinculados...', 'success');
            buscarBtn.disabled = true;
            if(dataContainer) dataContainer.style.display = 'none';
            if(archivedBanner) archivedBanner.style.display = 'none';
            if(archivedNotice) archivedNotice.style.display = 'none';
            hideMsgElim();

            try {
                const resultados = await buscarEnTodasLasTablas(val);
                if (resultados.length === 0) {
                    showMsg(msgBuscar, '❌ Registro vinculado no encontrado.', 'error');
                } else if (resultados.length === 1) {
                    showMsg(msgBuscar, '✅ 1 registro encontrado. Cargando...', 'success');
                    setTimeout(() => cargarDatos(resultados[0].datos, resultados[0].origen), 300);
                } else {
                    // Si hay múltiples, priorizamos mostrar el que esté activo
                    const activo = resultados.find(r => !r.eliminado) || resultados[0];
                    showMsg(msgBuscar, `🔎 Se encontraron <strong>${resultados.length} coincidencias</strong>. Mostrando la principal.`, 'success');
                    setTimeout(() => cargarDatos(activo.datos, activo.origen), 300);
                }
            } catch (err) {
                console.error('❌ Error general:', err);
                showMsg(msgBuscar, '❌ Error de conexión: ' + err.message, 'error');
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
    }

    // ==========================================
    // 🔹 MODAL DE CONFIRMACIÓN
    // ==========================================
    function showModal(titulo, texto, accion, tipo) {
        pendingAction = accion;
        if(modalTitle) modalTitle.textContent = titulo;
        if(modalText) modalText.textContent = texto;
        if(btnModalYes) {
            btnModalYes.className = tipo === 'danger' ? 'btn-modal-danger' : 'btn-modal-success';
            btnModalYes.textContent = tipo === 'danger' ? '✅ Sí, Eliminar' : '✅ Sí, Reintegrar';
        }
        if(modal) modal.style.display = 'flex';
    }

    function closeModal() {
        if(modal) modal.style.display = 'none';
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
    // 🔹 ELIMINAR (ASYNC)
    // ==========================================
    async function eliminarRegistro() {
        if (!currentData) return;
        if(btnEliminar) {
            btnEliminar.disabled = true;
            btnEliminar.textContent = '⏳ Archivando...';
        }
        hideMsgElim();

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const eliminadoPor = user?.email || 'usuario@sistema';
            
            const dataToArchive = {
                eliminado_por: eliminadoPor,
                eliminado_en: new Date().toISOString(),
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
                detalle_condicion_medica: currentData.detalle_condicion_medica,
                consume_medicamento: currentData.consume_medicamento,
                detalle_medicamento: currentData.detalle_medicamento,
                problema_judicial: currentData.problema_judicial,
                detalle_problema_judicial: currentData.detalle_problema_judicial,
                foto_frontal_persona: currentData.foto_frontal_persona,
                foto_perfil_izq_persona: currentData.foto_perfil_izq_persona,
                foto_perfil_der_persona: currentData.foto_perfil_der_persona,
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
                estatus: currentData.estatus,
                estacion_policial: currentData.estacion_policial,
                direccion_detencion: currentData.direccion_detencion,
                observaciones: currentData.observaciones
            };

            const res = await window.supabaseClient.from('eliminados_vinculados').insert([dataToArchive]);
            if (res.error) throw res.error;

            const delRes = await window.supabaseClient.from('registro_vinculado').delete().eq('id', currentData.id);
            if (delRes.error) throw delRes.error;

            showMsgElim('✅ Registro vinculado eliminado y archivado correctamente.', 'success');
            setTimeout(() => {
                if(dataContainer) dataContainer.style.display = 'none';
                if(buscarInput) buscarInput.value = '';
                hideMsg(msgBuscar);
                hideMsgElim();
                if(archivedBanner) archivedBanner.style.display = 'none';
                if(archivedNotice) archivedNotice.style.display = 'none';
            }, 4000);
        } catch (err) {
            console.error('❌ Error eliminando:', err);
            showMsgElim('❌ ' + err.message, 'error');
        } finally {
            if(btnEliminar) {
                btnEliminar.disabled = false;
                btnEliminar.textContent = '🗑️ Eliminar Registro Vinculado';
            }
        }
    }

    // ==========================================
    // 🔹 REINTEGRAR (ASYNC)
    // ==========================================
    async function reintegrarRegistro() {
        if (!currentData) return;
        if(btnReintegrar) {
            btnReintegrar.disabled = true;
            btnReintegrar.textContent = '⏳ Reintegrando...';
        }
        hideMsgElim();

        try {
            const dataToRestore = {
                estatus: currentData.estatus,
                estacion_policial: currentData.estacion_policial,
                direccion_detencion: currentData.direccion_detencion,
                observaciones: currentData.observaciones,
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
                detalle_condicion_medica: currentData.detalle_condicion_medica,
                consume_medicamento: currentData.consume_medicamento,
                detalle_medicamento: currentData.detalle_medicamento,
                problema_judicial: currentData.problema_judicial,
                detalle_problema_judicial: currentData.detalle_problema_judicial,
                foto_frontal_persona: currentData.foto_frontal_persona,
                foto_perfil_izq_persona: currentData.foto_perfil_izq_persona,
                foto_perfil_der_persona: currentData.foto_perfil_der_persona,
                tipo_vehiculo: currentData.tipo_vehiculo,
                placa: currentData.placa,
                serial_carroceria: currentData.serial_carroceria,
                serial_motor: currentData.serial_motor || '',
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

            const delRes = await window.supabaseClient.from('eliminados_vinculados').delete().eq('id', currentData.id);
            if (delRes.error) throw delRes.error;

            showMsgElim('✅ Registro vinculado reintegrado al sistema activo.', 'success');
            setTimeout(() => {
                if(dataContainer) dataContainer.style.display = 'none';
                if(buscarInput) buscarInput.value = '';
                hideMsg(msgBuscar);
                hideMsgElim();
                if(archivedBanner) archivedBanner.style.display = 'none';
                if(archivedNotice) archivedNotice.style.display = 'none';
            }, 4000);
        } catch (err) {
            console.error('Error reintegrando:', err);
            let msg = 'Error al reintegrar.';
            if (err.message.includes('23505') || err.message.includes('unique') || err.message.includes('duplicate key')) {
                msg = '❌ <strong>No se puede reintegrar:</strong> La cédula, placa o serial ya se encuentra en uso.<br><small style="color:#64748b;">Este registro se conserva como historial.</small>';
            } else {
                msg = '❌ ' + err.message;
            }
            showMsgElim(msg, 'error');
        } finally {
            if(btnReintegrar) {
                btnReintegrar.disabled = false;
                btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo';
            }
        }
    }

    // ==========================================
    // 🔹 LISTENERS DE BOTONES
    // ==========================================
    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => {
            if (!currentData) return;
            showModal('⚠️ Confirmar Eliminación', `¿Está seguro de eliminar este registro vinculado (C.I: ${currentData.cedula})?`, 'delete', 'danger');
        });
    }

    if (btnReintegrar) {
        btnReintegrar.addEventListener('click', () => {
            if (!currentData) return;
            showModal('⚠️ Confirmar Reintegración', `¿Está seguro de reintegrar este registro (C.I: ${currentData.cedula}) al sistema activo?`, 'reintegrate', 'success');
        });
    }

    console.log("✅ Módulo elim-vinculado.js inicializado correctamente.");
};
