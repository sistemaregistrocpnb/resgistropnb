async function eliminarRegistro() {
    btnEliminar.disabled = true;
    btnEliminar.textContent = '⏳ Procesando...';
    hideMsgElim();

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const eliminadoPor = user?.email || sessionStorage.getItem('pnb_user_email') || 'usuario@sistema';

        const dataToArchive = {
            id_original: currentId,
            eliminado_por: eliminadoPor,
            tabla_origen: currentData.tabla_origen,
            registro_id: currentData.registro_id,
            identificador_principal: currentData.identificador_principal,
            tipo_delito: currentData.tipo_delito,
            observaciones: currentData.observaciones,
            datos_originales: currentData.datos_originales,
            tipo_registro: currentData.tipo_registro || 'procesado',
            estatus: currentData.estatus || 'activo',
            fecha_procesamiento: currentData.fecha_procesamiento || currentData.created_at,
            // ❌ ELIMINADO: cedula: currentData.cedula, // ← ESTA LÍNEA CAUSA EL ERROR
            // Documentos
            portada: currentData.portada, oficio_remision: currentData.oficio_remision,
            acta_denuncia: currentData.acta_denuncia, datos_filiatorios: currentData.datos_filiatorios,
            acta_policial: currentData.acta_policial, derechos_imputado: currentData.derechos_imputado,
            evaluacion_medica: currentData.evaluacion_medica, identificacion_cedula: currentData.identificacion_cedula,
            solicitud_examen_forense: currentData.solicitud_examen_forense, resultados_examen_forense: currentData.resultados_examen_forense,
            asistencia_comdepro: currentData.asistencia_comdepro, remision_estacionamiento: currentData.remision_estacionamiento,
            planilla_pvr: currentData.planilla_pvr, otros_documentos: currentData.otros_documentos,
            entrevista: currentData.entrevista, cadena_custodia: currentData.cadena_custodia,
            inspecciones_tecnicas: currentData.inspecciones_tecnicas,
            created_at_original: currentData.created_at, updated_at_original: currentData.updated_at
        };

        const { error: insErr } = await window.supabaseClient.from('eliminados_procesados').insert([dataToArchive]);
        if (insErr) throw new Error('Error archivando: ' + insErr.message);

        const { error: delErr } = await window.supabaseClient.from('registro_procesados').delete().eq('id', currentId);
        if (delErr) throw new Error('Error eliminando: ' + delErr.message);

        // ✅ REGISTRAR LOG USANDO UTILS.JS (GLOBAL)
        if (typeof window.registrarLog === 'function') {
            const orig = currentData.datos_originales || {};
            await window.registrarLog('ELIMINAR', 'PROCESADOS', {
                registro: 'Eliminado/Archivado',
                estatus: 'Eliminado',
                identificador: currentData.identificador_principal || orig.cedula || 'N/A',
                cedula: orig.cedula || currentData.cedula || 'N/A',
                nombre_completo: `${orig.primer_nombre || ''} ${orig.primer_apellido || ''}`.trim() || 'N/A',
                tipo_registro: currentData.tipo_registro || 'procesado',
                tipo_delito: currentData.tipo_delito || 'N/A',
                accion_detalle: 'Registro procesado eliminado y archivado como respaldo histórico'
            }, currentId);
        }

        showMsgElim('✅ Procesado eliminado y archivado correctamente.', 'success');
        setTimeout(() => {
            dataContainer.style.display = 'none';
            buscarInput.value = '';
            hideMsg(msgBuscar);
            hideMsgElim();
        }, 4000);
    } catch (err) {
        console.error('❌ Error eliminando:', err);
        showMsgElim('❌ Error al procesar la solicitud: ' + err.message, 'error');
    } finally {
        btnEliminar.disabled = false;
        btnEliminar.textContent = '🗑️ Eliminar Procesado del Sistema';
    }
}
