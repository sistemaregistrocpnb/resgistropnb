window.initEliDenuncias = function() {
    console.log("⚙️ Iniciando módulo eli-denuncias.js...");

    if (window._eliDenunciasInitialized) return;
    window._eliDenunciasInitialized = true;

    // ==========================================
    // LÓGICA DE BÚSQUEDA
    // ==========================================
    const cedulaInput = document.getElementById('eli_buscar_cedula');
    const btnBuscar = document.getElementById('eli_btn_buscar');

    if (cedulaInput && btnBuscar) {
        cedulaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnBuscar.click();
            }
        });
    }

    btnBuscar?.addEventListener('click', async () => {
        const cedulaRaw = cedulaInput?.value.trim().toUpperCase().replace(/\s/g, '') || '';
        const msgBusqueda = document.getElementById('eli_msg_busqueda');
        const previewContainer = document.getElementById('eli_preview_container');
        const listaContainer = document.getElementById('eli_denuncias_lista');
        const cedulaRegex = /^[VE]-\d{6,9}$/;

        if (!cedulaRaw) {
            if (msgBusqueda) { msgBusqueda.textContent = '⚠️ El campo de cédula no puede estar vacío.'; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
            return;
        }

        if (!cedulaRegex.test(cedulaRaw)) {
            if (msgBusqueda) { msgBusqueda.textContent = '⚠️ Formato incorrecto. Debe colocar V- o E- seguido del número (Ej: V-12345678).'; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
            return;
        }

        if (msgBusqueda) { msgBusqueda.textContent = '⏳ Buscando...'; msgBusqueda.className = 'msg'; msgBusqueda.style.display = 'block'; }
        if (previewContainer) previewContainer.style.display = 'none';
        if (listaContainer) listaContainer.style.display = 'none';

        try {
            const { data, error } = await window.supabaseClient
                .from('denuncias')
                .select('*')
                .eq('cedula', cedulaRaw)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                if (msgBusqueda) { msgBusqueda.textContent = '❌ No se encontró ninguna denuncia registrada con esa cédula.'; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
                return;
            }

            // Mostrar lista de denuncias
            if (msgBusqueda) { msgBusqueda.textContent = `✅ Se encontraron ${data.length} denuncia(s). Seleccione una para eliminar.`; msgBusqueda.className = 'msg success'; msgBusqueda.style.display = 'block'; }
            
            if (listaContainer) {
                listaContainer.innerHTML = `
                    <div class="denuncias-lista-header">📋 Denuncias encontradas (${data.length})</div>
                `;
                
                data.forEach((denuncia, index) => {
                    const fecha = new Date(denuncia.created_at).toLocaleString('es-VE', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    });
                    
                    const item = document.createElement('div');
                    item.className = 'denuncia-item';
                    item.innerHTML = `
                        <div class="denuncia-item-info">
                            <div class="denuncia-item-numero">${denuncia.numero_denuncia || 'N/A'}</div>
                            <div class="denuncia-item-detalles">
                                <strong>Estación:</strong> ${denuncia.estacion_policial || 'N/A'} | 
                                <strong>Motivo:</strong> ${denuncia.motivo_denuncia ? denuncia.motivo_denuncia.substring(0, 80) + (denuncia.motivo_denuncia.length > 80 ? '...' : '') : 'N/A'}
                            </div>
                        </div>
                        <div class="denuncia-item-fecha">${fecha}</div>
                        <button type="button" class="denuncia-item-btn" data-index="${index}">🗑️ Eliminar</button>
                    `;
                    
                    item.querySelector('.denuncia-item-btn').addEventListener('click', () => {
                        mostrarVistaPrevia(denuncia);
                    });
                    
                    listaContainer.appendChild(item);
                });
                
                listaContainer.style.display = 'block';
            }

        } catch (err) {
            console.error('Error en búsqueda:', err);
            if (msgBusqueda) { msgBusqueda.textContent = '❌ Error al buscar: ' + err.message; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
        }
    });

    // ==========================================
    // MOSTRAR VISTA PREVIA DE ELIMINACIÓN
    // ==========================================
    function mostrarVistaPrevia(denuncia) {
        const previewContainer = document.getElementById('eli_preview_container');
        const listaContainer = document.getElementById('eli_denuncias_lista');
        const msgBusqueda = document.getElementById('eli_msg_busqueda');

        const fecha = denuncia.fecha_hora || new Date(denuncia.created_at).toLocaleString('es-VE');

        previewContainer.innerHTML = `
            <div class="eli-preview-header">⚠️ Confirmar Eliminación de Denuncia</div>
            
            <div class="eli-preview-grid">
                <div class="eli-preview-item">
                    <div class="eli-preview-label">Número de Denuncia</div>
                    <div class="eli-preview-value">${denuncia.numero_denuncia || 'N/A'}</div>
                </div>
                <div class="eli-preview-item">
                    <div class="eli-preview-label">Cédula</div>
                    <div class="eli-preview-value">${denuncia.cedula || 'N/A'}</div>
                </div>
                <div class="eli-preview-item">
                    <div class="eli-preview-label">Fecha y Hora</div>
                    <div class="eli-preview-value">${fecha}</div>
                </div>
                <div class="eli-preview-item">
                    <div class="eli-preview-label">Estación Policial</div>
                    <div class="eli-preview-value">${denuncia.estacion_policial || 'N/A'}</div>
                </div>
                <div class="eli-preview-item" style="grid-column: span 2;">
                    <div class="eli-preview-label">Denunciante</div>
                    <div class="eli-preview-value">${denuncia.primer_nombre || ''} ${denuncia.segundo_nombre || ''} ${denuncia.primer_apellido || ''} ${denuncia.segundo_apellido || ''}</div>
                </div>
                <div class="eli-preview-item" style="grid-column: span 2;">
                    <div class="eli-preview-label">Motivo de la Denuncia</div>
                    <div class="eli-preview-value">${denuncia.motivo_denuncia || 'N/A'}</div>
                </div>
            </div>

            <div class="eli-motivo-container">
                <label>Motivo de Eliminación <span style="color: #ef4444;">*</span></label>
                <textarea id="eli_motivo_eliminacion" placeholder="Explique por qué se está eliminando esta denuncia..." required></textarea>
            </div>

            <div class="eli-actions">
                <button type="button" class="eli-btn-cancel" id="eli_btn_cancelar">❌ Cancelar</button>
                <button type="button" class="eli-btn-confirm" id="eli_btn_confirmar">🗑️ Confirmar Eliminación</button>
            </div>
        `;

        previewContainer.style.display = 'block';
        if (listaContainer) listaContainer.style.display = 'none';
        if (msgBusqueda) { msgBusqueda.textContent = `⚠️ Vista previa de eliminación: ${denuncia.numero_denuncia}`; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }

        // Event listeners
        document.getElementById('eli_btn_cancelar').addEventListener('click', () => {
            previewContainer.style.display = 'none';
            if (listaContainer) listaContainer.style.display = 'block';
            if (msgBusqueda) { msgBusqueda.textContent = '❌ Eliminación cancelada.'; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
        });

        document.getElementById('eli_btn_confirmar').addEventListener('click', () => {
            eliminarDenuncia(denuncia);
        });
    }

    // ==========================================
    // ELIMINAR DENUNCIA
    // ==========================================
    async function eliminarDenuncia(denuncia) {
        const motivoEliminacion = document.getElementById('eli_motivo_eliminacion')?.value.trim();
        const msgBusqueda = document.getElementById('eli_msg_busqueda');
        const previewContainer = document.getElementById('eli_preview_container');
        const loading = document.getElementById('eli_loading_overlay');
        const btnConfirmar = document.getElementById('eli_btn_confirmar');

        if (!motivoEliminacion) {
            alert('⚠️ Debe proporcionar un motivo para eliminar la denuncia.');
            return;
        }

        btnConfirmar.disabled = true;
        btnConfirmar.textContent = '⏳ Eliminando...';
        if (loading) loading.classList.add('active');

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Debe iniciar sesión para eliminar una denuncia.');

            // 1. Mover la denuncia a la tabla de eliminadas
            const denunciaEliminada = {
                denuncia_original_id: denuncia.id,
                numero_denuncia: denuncia.numero_denuncia,
                cedula: denuncia.cedula,
                motivo_denuncia: denuncia.motivo_denuncia,
                estacion_policial: denuncia.estacion_policial,
                primer_nombre: denuncia.primer_nombre,
                segundo_nombre: denuncia.segundo_nombre,
                primer_apellido: denuncia.primer_apellido,
                segundo_apellido: denuncia.segundo_apellido,
                tlf_pais: denuncia.tlf_pais,
                tlf_numero: denuncia.tlf_numero,
                direccion: denuncia.direccion,
                oficio_remision: denuncia.oficio_remision,
                acta_denuncia: denuncia.acta_denuncia,
                medida_proteccion: denuncia.medida_proteccion,
                acta_entrevista: denuncia.acta_entrevista,
                datos_filiatorios: denuncia.datos_filiatorios,
                evidencias: denuncia.evidencias,
                solicitud_senamecf: denuncia.solicitud_senamecf,
                observaciones: denuncia.observaciones,
                registrado_por: denuncia.registrado_por,
                email_registrante: denuncia.email_registrante,
                fecha_hora_original: denuncia.created_at,
                eliminado_por: user.id,
                email_eliminador: user.email,
                motivo_eliminacion: motivoEliminacion
            };

            const { error: insertError } = await window.supabaseClient
                .from('denuncias_eliminadas')
                .insert([denunciaEliminada]);

            if (insertError) throw new Error(`Error al crear respaldo: ${insertError.message}`);

            // 2. Eliminar la denuncia de la tabla principal
            const { error: deleteError } = await window.supabaseClient
                .from('denuncias')
                .delete()
                .eq('id', denuncia.id);

            if (deleteError) throw new Error(`Error al eliminar: ${deleteError.message}`);

            // Éxito
            if (msgBusqueda) { msgBusqueda.textContent = `✅ Denuncia ${denuncia.numero_denuncia} eliminada exitosamente y movida a respaldo.`; msgBusqueda.className = 'msg success'; msgBusqueda.style.display = 'block'; }
            if (previewContainer) previewContainer.style.display = 'none';
            
            // Limpiar búsqueda
            if (cedulaInput) cedulaInput.value = '';

            setTimeout(() => {
                if (msgBusqueda) msgBusqueda.style.display = 'none';
            }, 5000);

        } catch (err) {
            console.error('Error al eliminar:', err);
            if (msgBusqueda) { msgBusqueda.textContent = '❌ ' + err.message; msgBusqueda.className = 'msg error'; msgBusqueda.style.display = 'block'; }
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = '🗑️ Confirmar Eliminación';
        } finally {
            if (loading) loading.classList.remove('active');
        }
    }

    console.log("✅ Módulo eli-denuncias.js inicializado correctamente");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initEliDenuncias);
} else {
    window.initEliDenuncias();
}
