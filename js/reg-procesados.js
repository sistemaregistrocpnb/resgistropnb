form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. ✅ VALIDAR QUE HAYA AL MENOS 1 FOTO
    const fotoFrontal = el('foto_frontal').files[0];
    const fotoIzq = el('foto_perfil_izq').files[0];
    const fotoDer = el('foto_perfil_der').files[0];
    
    if (!fotoFrontal && !fotoIzq && !fotoDer) {
        mostrarMensaje('⚠️ Debe subir al menos una (1) fotografía', 'error');
        return;
    }

    const btnSubmit = form.querySelector('.btn-submit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Registrando...';

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Debe iniciar sesión');

        const cedula = el('p_cedula').value.trim();
        const nombre1 = el('p_nombre1').value.trim();
        const apellido1 = el('p_apellido1').value.trim();
        const nombreCompleto = `${nombre1} ${el('p_nombre2').value.trim()} ${apellido1} ${el('p_apellido2').value.trim()}`.trim();
        const estatusActual = el('p_estatus').value || 'Verificación';

        // 2. SUBIR FOTOS (Solo las que el usuario seleccionó)
        const bucket = 'fotos_personas';
        const folder = user.id;
        let urlFrontal = null, urlIzq = null, urlDer = null;

        if (fotoFrontal) {
            const fileName = `${Date.now()}_pp_f.jpg`;
            const { error: errUp1 } = await window.supabaseClient.storage.from(bucket).upload(`${folder}/${fileName}`, fotoFrontal);
            if (errUp1) throw errUp1;
            const { data: { publicUrl } } = window.supabaseClient.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
            urlFrontal = publicUrl;
        }
        if (fotoIzq) {
            const fileName = `${Date.now()}_pp_i.jpg`;
            const { error: errUp2 } = await window.supabaseClient.storage.from(bucket).upload(`${folder}/${fileName}`, fotoIzq);
            if (errUp2) throw errUp2;
            const { data: { publicUrl } } = window.supabaseClient.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
            urlIzq = publicUrl;
        }
        if (fotoDer) {
            const fileName = `${Date.now()}_pp_d.jpg`;
            const { error: errUp3 } = await window.supabaseClient.storage.from(bucket).upload(`${folder}/${fileName}`, fotoDer);
            if (errUp3) throw errUp3;
            const { data: { publicUrl } } = window.supabaseClient.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
            urlDer = publicUrl;
        }

        // 3. PREPARAR DATOS PARA LA BASE DE DATOS
        const personaData = {
            primer_nombre: nombre1,
            segundo_nombre: el('p_nombre2').value.trim(),
            primer_apellido: apellido1,
            segundo_apellido: el('p_apellido2').value.trim(),
            cedula: cedula,
            fecha_nacimiento: el('p_fecha_nac').value,
            edad: parseInt(el('p_edad').value) || null,
            apodo: el('p_apodo').value.trim(),
            nacionalidad: el('p_nacionalidad').value,
            sexo: el('p_sexo').value,
            direccion: el('p_direccion').value.trim(),
            tlf_pais: el('p_tlf_pais').value,
            tlf_numero: el('p_tlf_num').value.trim(),
            estatura_cm: el('p_estatura').value ? parseFloat(el('p_estatura').value) * 100 : null,
            color_piel: el('p_color_piel').value,
            color_ojos: el('p_color_ojos').value,
            color_cabello: el('p_color_cabello').value,
            complexion: el('p_complexion').value,
            usa_lentes: el('p_lentes').value === 'true',
            detalle_lentes: el('p_lentes').value === 'true' ? el('txt_lentes').value.trim() : null,
            perforaciones: el('p_perforaciones').value === 'true',
            detalle_perforaciones: el('p_perforaciones').value === 'true' ? el('txt_lugar_perforacion').value.trim() : null,
            condicion_medica: el('p_cond_medica').value === 'true',
            consume_medicamento: el('p_medicamento').value === 'true',
            problema_judicial: el('p_judicial').value === 'true' ? el('txt_jud').value.trim() : 'No',
            foto_frontal: urlFrontal,
            foto_perfil_izq: urlIzq,
            foto_perfil_der: urlDer,
            estacion_policial: el('p_estacion').value,
            direccion_detencion: el('p_direccion_detencion').value.trim(),
            observaciones: el('p_observaciones').value.trim(),
            estatus: estatusActual,
            registrado_por: user.id
        };

        // 4. INSERTAR EN LA BASE DE DATOS
        const { data: nuevaPersona, error: dbError } = await window.supabaseClient
            .from('registro_personas')
            .insert([personaData])
            .select('id, cedula')
            .single();

        if (dbError) throw dbError;

        // 5. ✅ REGISTRAR EN EL LOG DEL SISTEMA
        if (typeof registrarLog === 'function') {
            await registrarLog('CREAR_PERSONA', 'Registro de Personas', nuevaPersona.id, {
                cedula: nuevaPersona.cedula,
                nombre: nombreCompleto,
                estatus: estatusActual
            });
        }

        mostrarMensaje('✅ Persona registrada exitosamente', 'success');
        form.reset();
        
        // Limpiar vistas previas
        if(el('prev_frontal')) el('prev_frontal').style.display = 'none';
        if(el('prev_izq')) el('prev_izq').style.display = 'none';
        if(el('prev_der')) el('prev_der').style.display = 'none';

    } catch (err) {
        console.error('Error al registrar:', err);
        mostrarMensaje('❌ Error: ' + err.message, 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '✅ Registrar Persona';
    }
});
