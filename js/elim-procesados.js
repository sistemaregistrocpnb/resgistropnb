    // 🔹 Eliminar (Activa → Eliminados)
    async function eliminarRegistro() {
        btnEliminar.disabled = true;
        btnEliminar.textContent = '⏳ Procesando...';
        hideMsgElim();

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const eliminadoPor = user?.email || sessionStorage.getItem('pnb_user_email') || 'usuario@sistema';
            
            // ✅ MAPEO COMPLETO: Incluye TODOS los campos de registro_procesados
            const dataToArchive = {
                id_original: currentId,
                eliminado_por: eliminadoPor,
                
                // Campos base obligatorios
                tabla_origen: currentData.tabla_origen,
                registro_id: currentData.registro_id,
                identificador_principal: currentData.identificador_principal,
                tipo_delito: currentData.tipo_delito,
                observaciones: currentData.observaciones,
                datos_originales: currentData.datos_originales,
                
                // ✅ CAMPOS ADICIONALES QUE PUEDEN SER OBLIGATORIOS
                tipo_registro: currentData.tipo_registro || 'procesado', // Valor por defecto si no existe
                estatus: currentData.estatus || 'activo',
                fecha_procesamiento: currentData.fecha_procesamiento || currentData.created_at,
                usuario_registro: currentData.usuario_registro || eliminadoPor,
                
                // Documentos únicos
                portada: currentData.portada,
                oficio_remision: currentData.oficio_remision,
                acta_denuncia: currentData.acta_denuncia,
                datos_filiatorios: currentData.datos_filiatorios,
                acta_policial: currentData.acta_policial,
                derechos_imputado: currentData.derechos_imputado,
                evaluacion_medica: currentData.evaluacion_medica,
                identificacion_cedula: currentData.identificacion_cedula,
                solicitud_examen_forense: currentData.solicitud_examen_forense,
                resultados_examen_forense: currentData.resultados_examen_forense,
                asistencia_comdepro: currentData.asistencia_comdepro,
                remision_estacionamiento: currentData.remision_estacionamiento,
                planilla_pvr: currentData.planilla_pvr,
                otros_documentos: currentData.otros_documentos,
                
                // Documentos múltiples
                entrevista: currentData.entrevista,
                cadena_custodia: currentData.cadena_custodia,
                inspecciones_tecnicas: currentData.inspecciones_tecnicas,
                
                // Timestamps originales
                created_at_original: currentData.created_at,
                updated_at_original: currentData.updated_at
            };

            const { error: insErr } = await window.supabaseClient.from('eliminados_procesados').insert([dataToArchive]);
            if (insErr) throw new Error('Error archivando: ' + insErr.message);
            console.log("✅ Respaldo guardado en eliminados_procesados");

            const { data: delData, error: delErr } = await window.supabaseClient
                .from('registro_procesados')
                .delete()
                .eq('id', currentId)
                .select('id');

            if (delErr) {
                console.warn("⚠️ Error al eliminar de tabla activa:", delErr.message);
                showMsgElim('⚠️ El respaldo se guardó, pero no se pudo eliminar de la tabla activa.', 'error');
                return;
            }
            
            if (!delData || delData.length === 0) {
                console.warn("⚠️ El DELETE no devolvió filas, pero el respaldo se guardó.");
            }

            showMsgElim('✅ Procesado eliminado y archivado correctamente.', 'success');
            setTimeout(() => {
                dataContainer.style.display = 'none';
                buscarInput.value = '';
                hideMsg(msgBuscar);
                hideMsgElim();
            }, 4000);
            
        } catch (err) {
            console.error('💥 Error crítico:', err);
            showMsgElim('❌ ' + err.message, 'error');
        } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '🗑️ Eliminar Procesado del Sistema';
        }
    }

    // 🔹 Reintegrar (Eliminados → Activa)
    async function reintegrarRegistro() {
        btnReintegrar.disabled = true;
        btnReintegrar.textContent = '⏳ Procesando...';
        hideMsgElim();

        try {
            // ✅ MAPEO COMPLETO: Incluye TODOS los campos necesarios para registro_procesados
            const dataToRestore = {
                // Campos base
                tabla_origen: currentData.tabla_origen,
                registro_id: currentData.registro_id,
                identificador_principal: currentData.identificador_principal,
                tipo_delito: currentData.tipo_delito,
                observaciones: currentData.observaciones,
                datos_originales: currentData.datos_originales,
                
                // ✅ CAMPOS OBLIGATORIOS QUE FALTABAN
                tipo_registro: currentData.tipo_registro || 'procesado',
                estatus: currentData.estatus || 'activo',
                fecha_procesamiento: currentData.fecha_procesamiento || currentData.created_at_original || new Date().toISOString(),
                usuario_registro: currentData.usuario_registro || 'sistema',
                
                // Documentos únicos
                portada: currentData.portada,
                oficio_remision: currentData.oficio_remision,
                acta_denuncia: currentData.acta_denuncia,
                datos_filiatorios: currentData.datos_filiatorios,
                acta_policial: currentData.acta_policial,
                derechos_imputado: currentData.derechos_imputado,
                evaluacion_medica: currentData.evaluacion_medica,
                identificacion_cedula: currentData.identificacion_cedula,
                solicitud_examen_forense: currentData.solicitud_examen_forense,
                resultados_examen_forense: currentData.resultados_examen_forense,
                asistencia_comdepro: currentData.asistencia_comdepro,
                remision_estacionamiento: currentData.remision_estacionamiento,
                planilla_pvr: currentData.planilla_pvr,
                otros_documentos: currentData.otros_documentos,
                
                // Documentos múltiples
                entrevista: currentData.entrevista,
                cadena_custodia: currentData.cadena_custodia,
                inspecciones_tecnicas: currentData.inspecciones_tecnicas
            };

            const { error: insErr } = await window.supabaseClient.from('registro_procesados').insert([dataToRestore]);
            if (insErr) throw new Error('Error restaurando: ' + insErr.message);

            // NO eliminamos el registro de eliminados_procesados (mantenemos el respaldo histórico)
            console.log("✅ Registro reintegrado. Respaldo histórico mantenido en eliminados_procesados.");

            showMsgElim('✅ Procesado reintegrado al sistema activo. El respaldo histórico se mantiene.', 'success');
            setTimeout(() => {
                dataContainer.style.display = 'none';
                buscarInput.value = '';
                hideMsg(msgBuscar);
                hideMsgElim();
            }, 4000);
            
        } catch (err) {
            console.error('Error reintegrando:', err);
            let msg = err.message.includes('23505') || err.message.includes('unique') 
                ? '❌ Ya existe un registro activo con este ID/Identificador.' 
                : '❌ ' + err.message;
            showMsgElim(msg, 'error');
        } finally {
            btnReintegrar.disabled = false;
            btnReintegrar.textContent = '♻️ Reintegrar al Sistema Activo';
        }
    }
