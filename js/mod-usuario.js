window.initModUsuario = function() {
    console.log("⚙️ Iniciando módulo mod-usuario.js...");

    if (window._modUsuarioInitialized) {
        console.log("⚠️ Módulo ya inicializado, omitiendo...");
        return;
    }
    window._modUsuarioInitialized = true;

    const el = (id) => document.getElementById(id);
    const tablaContainer = el('mu_tabla_container');
    const msg = el('mu_msg');
    const buscarInput = el('mu_buscar');
    const btnRefresh = el('mu_btn_refresh');
    const modalEditar = el('mu_modal_editar');
    const infoBloqueo = el('mu_info_bloqueo');
    const cambiarPasswordCheck = el('mu_cambiar_password_check');
    const passwordFields = el('mu_password_fields');

    let usuariosData = [];
    let esAdministrador = false;
    let fotoUrlActual = null;
    let usuarioActualEditando = null;

    // Verificar permisos
    async function verificarPermisos() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return false;

            const { data: perfil } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('nivel')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!perfil) return false;
            
            esAdministrador = perfil.nivel === 'administrador';
            console.log("🔐 Es administrador:", esAdministrador);
            return true;
        } catch (err) {
            console.error('Error verificando permisos:', err);
            return false;
        }
    }

    function mostrarMensaje(texto, tipo) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `msg ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') {
            setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
        }
    }

    // Cargar usuarios
    async function cargarUsuarios() {
        if (tablaContainer) {
            tablaContainer.innerHTML = '<div class="sin-usuarios">Cargando usuarios...</div>';
        }

        try {
            const { data: usuarios, error } = await window.supabaseClient
                .from('perfiles_usuario')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;

            usuariosData = usuarios || [];
            console.log("📊 Usuarios cargados:", usuariosData.length);
            renderTabla(usuariosData);

        } catch (err) {
            console.error('Error cargando usuarios:', err);
            if (tablaContainer) {
                tablaContainer.innerHTML = '<div class="sin-usuarios">❌ Error al cargar usuarios</div>';
            }
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        }
    }

    // Renderizar tabla
    function renderTabla(usuarios) {
        if (!tablaContainer) return;

        if (usuarios.length === 0) {
            tablaContainer.innerHTML = '<div class="sin-usuarios">No hay usuarios registrados</div>';
            return;
        }

        let html = `
            <table class="usuarios-table">
                <thead>
                    <tr>
                        <th>Foto</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Cédula</th>
                        <th>Jerarquía</th>
                        <th>Nivel</th>
                        <th>Bloqueado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        usuarios.forEach(u => {
            const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sin nombre';
            const fotoSrc = u.foto_url || 'https://ui-avatars.com/api/?name=Usuario&background=002b5c&color=fff';
            const nivelClass = `nivel-${u.nivel}`;
            const bloqueadoClass = u.bloqueado ? 'bloqueado-si' : 'bloqueado-no';
            const bloqueadoText = u.bloqueado ? 'Sí' : 'No';

            const userIdStr = String(u.id);

            html += `
                <tr>
                    <td><img src="${fotoSrc}" alt="Foto" class="user-foto" onerror="this.src='https://ui-avatars.com/api/?name=Usuario'"></td>
                    <td><strong>${nombreCompleto}</strong></td>
                    <td>${u.email || 'N/A'}</td>
                    <td>${u.cedula || 'N/A'}</td>
                    <td>${u.jerarquia || 'N/A'}</td>
                    <td><span class="nivel-badge ${nivelClass}">${u.nivel || 'N/A'}</span></td>
                    <td><span class="bloqueado-badge ${bloqueadoClass}">${bloqueadoText}</span></td>
                    <td>
                        <div class="action-btns">
                            <button type="button" class="btn-editar" data-action="editar" data-id="${userIdStr}">✏️ Editar</button>
                            ${esAdministrador && u.bloqueado ? `<button type="button" class="btn-desbloquear" data-action="desbloquear" data-id="${userIdStr}" data-email="${u.email}">🔓 Desbloquear</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tablaContainer.innerHTML = html;

        agregarEventListenersTabla();
    }

    // Event delegation
    function agregarEventListenersTabla() {
        const botonesEditar = tablaContainer.querySelectorAll('.btn-editar');
        botonesEditar.forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                console.log("️ Click en editar, ID:", id);
                abrirEditarUsuario(id);
            };
        });

        const botonesDesbloquear = tablaContainer.querySelectorAll('.btn-desbloquear');
        botonesDesbloquear.forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                const email = this.getAttribute('data-email');
                console.log("🔓 Click en desbloquear, ID:", id, "Email:", email);
                desbloquearUsuario(id, email);
            };
        });
    }

    // Abrir modal de edición
    function abrirEditarUsuario(id) {
        console.log("🔍 Buscando usuario con ID:", id);
        
        const usuario = usuariosData.find(u => String(u.id) === String(id));
        
        if (!usuario) {
            console.error(" Usuario no encontrado. ID buscado:", id);
            console.error("📋 IDs disponibles:", usuariosData.map(u => String(u.id)));
            mostrarMensaje('❌ Usuario no encontrado', 'error');
            return;
        }

        console.log("✅ Usuario encontrado:", usuario);
        usuarioActualEditando = usuario;

        // Llenar formulario
        el('mu_edit_id').value = usuario.id;
        el('mu_edit_user_id').value = usuario.user_id;
        el('mu_edit_email').value = usuario.email || '';
        el('mu_edit_nombre').value = usuario.nombre || '';
        el('mu_edit_apellido').value = usuario.apellido || '';
        el('mu_edit_cedula').value = usuario.cedula || '';
        el('mu_edit_jerarquia').value = usuario.jerarquia || '';
        el('mu_edit_nivel').value = usuario.nivel || 'consultor';

        // Resetear sección de contraseña
        if (cambiarPasswordCheck) cambiarPasswordCheck.checked = false;
        if (passwordFields) passwordFields.classList.remove('show');
        if (el('mu_nueva_password')) el('mu_nueva_password').value = '';
        if (el('mu_confirmar_password')) el('mu_confirmar_password').value = '';

        // Foto
        fotoUrlActual = usuario.foto_url || null;
        const preview = el('mu_edit_foto_preview');
        if (preview) {
            preview.src = usuario.foto_url || 'https://ui-avatars.com/api/?name=Usuario&background=002b5c&color=fff';
        }

        // Info de bloqueo
        if (usuario.bloqueado) {
            infoBloqueo.style.display = 'block';
            infoBloqueo.innerHTML = `
                ⚠️ <strong>Usuario bloqueado</strong><br>
                Intentos fallidos: ${usuario.intentos_fallidos || 0}<br>
                Fecha de bloqueo: ${usuario.fecha_bloqueo ? new Date(usuario.fecha_bloqueo).toLocaleString('es-VE') : 'N/A'}
            `;
        } else {
            infoBloqueo.style.display = 'none';
        }

        modalEditar.classList.add('active');
        console.log("✅ Modal abierto");
    }

    // Toggle de cambio de contraseña
    if (cambiarPasswordCheck) {
        cambiarPasswordCheck.addEventListener('change', function() {
            if (this.checked) {
                passwordFields.classList.add('show');
            } else {
                passwordFields.classList.remove('show');
                if (el('mu_nueva_password')) el('mu_nueva_password').value = '';
                if (el('mu_confirmar_password')) el('mu_confirmar_password').value = '';
            }
        });
    }

    // Cerrar modal
    if (el('mu_modal_close')) {
        el('mu_modal_close').onclick = () => modalEditar.classList.remove('active');
    }
    if (el('mu_btn_cancelar')) {
        el('mu_btn_cancelar').onclick = () => modalEditar.classList.remove('active');
    }

    // Quitar foto
    if (el('mu_edit_foto_quitar')) {
        el('mu_edit_foto_quitar').onclick = () => {
            fotoUrlActual = null;
            const preview = el('mu_edit_foto_preview');
            if (preview) preview.src = 'https://ui-avatars.com/api/?name=Usuario&background=002b5c&color=fff';
            if (el('mu_edit_foto')) el('mu_edit_foto').value = '';
        };
    }

    // Cambiar foto (botón separado)
    if (el('mu_edit_foto_cambiar')) {
        el('mu_edit_foto_cambiar').onclick = () => {
            if (el('mu_edit_foto')) el('mu_edit_foto').click();
        };
    }

    // Subir foto
    if (el('mu_edit_foto')) {
        el('mu_edit_foto').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                mostrarMensaje('❌ Solo se permiten imágenes', 'error');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                mostrarMensaje('❌ La imagen no debe superar 2MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = el('mu_edit_foto_preview');
                if (preview) preview.src = e.target.result;
            };
            reader.readAsDataURL(file);

            try {
                mostrarMensaje('⏳ Subiendo foto...', 'info');
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                const fileName = `fotos_perfiles/${user.id}/${Date.now()}_${file.name}`;
                
                const { error } = await window.supabaseClient.storage
                    .from('fotos_perfiles')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (error) throw error;

                const { data: { publicUrl } } = window.supabaseClient.storage
                    .from('fotos_perfiles')
                    .getPublicUrl(fileName);

                fotoUrlActual = publicUrl;
                mostrarMensaje('✅ Foto subida', 'success');
            } catch (err) {
                console.error('Error subiendo foto:', err);
                mostrarMensaje('❌ Error al subir: ' + err.message, 'error');
            }
        });
    }

    // Desbloquear usuario
    async function desbloquearUsuario(id, email) {
        if (!confirm(`¿Está seguro de desbloquear al usuario ${email}?`)) return;

        try {
            const { error } = await window.supabaseClient
                .from('perfiles_usuario')
                .update({
                    bloqueado: false,
                    intentos_fallidos: 0,
                    fecha_bloqueo: null
                })
                .eq('id', id);

            if (error) throw error;

            mostrarMensaje(`✅ Usuario ${email} desbloqueado correctamente`, 'success');
            await cargarUsuarios();

        } catch (err) {
            console.error('Error desbloqueando usuario:', err);
            mostrarMensaje('❌ Error: ' + err.message, 'error');
        }
    }

    // Guardar cambios
    if (el('mu_btn_guardar')) {
        el('mu_btn_guardar').onclick = async () => {
            const id = el('mu_edit_id').value;
            const userId = el('mu_edit_user_id').value;
            const nombre = el('mu_edit_nombre').value.trim();
            const apellido = el('mu_edit_apellido').value.trim();
            const cedula = el('mu_edit_cedula').value.trim();
            const jerarquia = el('mu_edit_jerarquia').value;
            const nivel = el('mu_edit_nivel').value;

            if (!nombre || !apellido || !cedula || !jerarquia || !nivel) {
                mostrarMensaje('️ Todos los campos son obligatorios', 'error');
                return;
            }

            // Validar contraseña si se marcó el checkbox
            const cambiarPassword = cambiarPasswordCheck?.checked || false;
            const nuevaPassword = el('mu_nueva_password')?.value || '';
            const confirmarPassword = el('mu_confirmar_password')?.value || '';

            if (cambiarPassword) {
                if (!nuevaPassword || nuevaPassword.length < 6) {
                    mostrarMensaje('❌ La nueva contraseña debe tener al menos 6 caracteres', 'error');
                    return;
                }
                if (nuevaPassword !== confirmarPassword) {
                    mostrarMensaje('❌ Las contraseñas no coinciden', 'error');
                    return;
                }
            }

            const btnGuardar = el('mu_btn_guardar');
            btnGuardar.disabled = true;
            btnGuardar.textContent = '⏳ Guardando...';

            try {
                // 1. Actualizar perfil en perfiles_usuario
                const { error } = await window.supabaseClient
                    .from('perfiles_usuario')
                    .update({
                        nombre: nombre,
                        apellido: apellido,
                        cedula: cedula,
                        jerarquia: jerarquia,
                        nivel: nivel,
                        foto_url: fotoUrlActual
                    })
                    .eq('id', id);

                if (error) throw error;

                // 2. Si se marcó cambiar contraseña, llamar a la Edge Function
                if (cambiarPassword) {
                    mostrarMensaje('⏳ Actualizando contraseña...', 'info');
                    
                    const response = await fetch(`${window.supabaseUrl}/functions/v1/cambiar-password-usuario`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.supabaseKey}`
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            nueva_password: nuevaPassword
                        })
                    });

                    const result = await response.json();

                    if (!result.success) {
                        throw new Error(result.error || 'Error al cambiar contraseña');
                    }
                }

                mostrarMensaje('✅ Usuario actualizado correctamente' + (cambiarPassword ? ' (contraseña cambiada)' : ''), 'success');
                modalEditar.classList.remove('active');
                await cargarUsuarios();

            } catch (err) {
                console.error('Error actualizando usuario:', err);
                mostrarMensaje('❌ Error: ' + err.message, 'error');
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.textContent = '💾 Guardar Cambios';
            }
        };
    }

    // Buscar usuarios
    if (buscarInput) {
        buscarInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderTabla(usuariosData);
                return;
            }

            const filtrados = usuariosData.filter(u => {
                const nombre = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
                const email = (u.email || '').toLowerCase();
                const cedula = (u.cedula || '').toLowerCase();
                return nombre.includes(query) || email.includes(query) || cedula.includes(query);
            });

            renderTabla(filtrados);
        });
    }

    // Refrescar
    if (btnRefresh) {
        btnRefresh.onclick = () => {
            cargarUsuarios();
            mostrarMensaje('🔄 Lista actualizada', 'info');
        };
    }

    // Inicializar
    async function init() {
        const tienePermiso = await verificarPermisos();
        if (!tienePermiso) {
            mostrarMensaje('❌ No tiene permisos para acceder a este módulo', 'error');
            return;
        }
        await cargarUsuarios();
    }

    console.log("🚀 Inicializando módulo mod-usuario...");
    init();
    console.log("✅ Módulo mod-usuario.js inicializado");
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initModUsuario);
} else {
    window.initModUsuario();
}
