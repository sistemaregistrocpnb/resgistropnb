// ==========================================
// 🔧 UTILS.JS - Funciones Utilitarias del Sistema
// ==========================================

/**
 * Registra una acción en el sistema de logs
 * @param {string} accion - Tipo de acción (LOGIN, LOGOUT, CREAR, MODIFICAR, ELIMINAR, etc.)
 * @param {string} modulo - Módulo donde ocurre la acción (AUTENTICACION, PERSONAS, VEHICULOS, etc.)
 * @param {object} detalles - Objeto con detalles de la acción
 * @param {string} registroId - ID del registro afectado (opcional)
 */
window.registrarLog = async function(accion, modulo, detalles = {}, registroId = null) {
    const userId = sessionStorage.getItem('pnb_user_id');
    const userEmail = sessionStorage.getItem('pnb_user_email') || 'sistema@pnb.gob.ve';
    const userNombre = document.getElementById('user-nombre-display')?.textContent || 'Sistema';
    
    if (!userId) {
        console.warn('⚠️ No se puede registrar log: usuario no autenticado');
        return;
    }
    
    try {
        // ✅ Convertir detalles a string JSON (compatible con columnas text)
        const detallesString = typeof detalles === 'string' ? detalles : JSON.stringify(detalles);
        
        const { error } = await window.supabaseClient
            .from('sistema_logs')
            .insert([{
                user_id: userId,
                user_nombre: userNombre,
                user_email: userEmail,
                accion: accion,
                modulo: modulo,
                detalles: detallesString,  // ✅ Ahora es string JSON
                registro_id: registroId
            }]);
        
        if (error) {
            console.error('❌ Error al registrar log:', error);
        } else {
            console.log('✅ Log registrado exitosamente:', { accion, modulo, registroId });
        }
    } catch (err) {
        console.error('❌ Excepción al registrar log:', err);
    }
};

/**
 * Registra el inicio de sesión
 * @param {string} userNombre - Nombre completo del usuario
 * @param {string} userEmail - Email del usuario
 * @param {string} userId - ID del usuario
 * @param {string} nivel - Nivel de acceso (administrador, moderador, consultor)
 */
window.registrarLogin = async function(userNombre, userEmail, userId, nivel) {
    const horaInicio = Date.now();
    sessionStorage.setItem('pnb_login_time', horaInicio.toString());
    
    try {
        const detallesString = JSON.stringify({
            nivel: nivel,
            ip: window.location.hostname,
            user_agent: navigator.userAgent.substring(0, 100),
            hora_inicio: new Date().toISOString()
        });
        
        const { error } = await window.supabaseClient
            .from('sistema_logs')
            .insert([{
                user_id: userId,
                user_nombre: userNombre,
                user_email: userEmail || 'sistema@pnb.gob.ve',
                accion: 'LOGIN',
                modulo: 'AUTENTICACION',
                detalles: detallesString,  // ✅ String JSON
                registro_id: null
            }]);
        
        if (error) {
            console.error('❌ Error al registrar login:', error);
        } else {
            console.log('✅ Login registrado exitosamente');
        }
    } catch (err) {
        console.error('❌ Excepción al registrar login:', err);
    }
};

/**
 * Registra el cierre de sesión y calcula la duración
 */
window.registrarLogout = async function() {
    const userId = sessionStorage.getItem('pnb_user_id');
    const userEmail = sessionStorage.getItem('pnb_user_email') || 'sistema@pnb.gob.ve';
    const userNombre = document.getElementById('user-nombre-display')?.textContent || 'Sistema';
    const loginTime = sessionStorage.getItem('pnb_login_time');
    
    if (!userId) return;
    
    // Calcular duración de la sesión
    let duracionTexto = 'No registrada';
    let duracionSegundos = 0;
    
    if (loginTime) {
        const inicio = parseInt(loginTime);
        const fin = Date.now();
        duracionSegundos = Math.floor((fin - inicio) / 1000);
        
        const horas = Math.floor(duracionSegundos / 3600);
        const minutos = Math.floor((duracionSegundos % 3600) / 60);
        const segundos = duracionSegundos % 60;
        
        if (horas > 0) {
            duracionTexto = `${horas}h ${minutos}m ${segundos}s`;
        } else if (minutos > 0) {
            duracionTexto = `${minutos}m ${segundos}s`;
        } else {
            duracionTexto = `${segundos}s`;
        }
    }
    
    try {
        const detallesString = JSON.stringify({
            sesion_duracion: duracionTexto,
            sesion_duracion_segundos: duracionSegundos,
            ip: window.location.hostname,
            hora_cierre: new Date().toISOString()
        });
        
        const { error } = await window.supabaseClient
            .from('sistema_logs')
            .insert([{
                user_id: userId,
                user_nombre: userNombre,
                user_email: userEmail,
                accion: 'LOGOUT',
                modulo: 'AUTENTICACION',
                detalles: detallesString,  // ✅ String JSON
                registro_id: null
            }]);
        
        if (error) {
            console.error('❌ Error al registrar logout:', error);
        } else {
            console.log('✅ Logout registrado exitosamente');
        }
    } catch (err) {
        console.error('❌ Excepción al registrar logout:', err);
    }
};

/**
 * Formatea la duración en segundos a texto legible
 * @param {number} segundos - Duración en segundos
 * @returns {string} Duración formateada (ej: "2h 15m 30s")
 */
window.formatearDuracion = function(segundos) {
    if (!segundos || segundos < 0) return 'No registrada';
    
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
        return `${horas}h ${minutos}m ${segs}s`;
    } else if (minutos > 0) {
        return `${minutos}m ${segs}s`;
    } else {
        return `${segs}s`;
    }
};
