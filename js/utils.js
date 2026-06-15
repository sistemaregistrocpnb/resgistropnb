// js/utils.js - Funciones utilitarias para el sistema

/**
 * Registra una acción en el sistema de logs
 * @param {string} accion - Tipo de acción (CREAR, MODIFICAR, ELIMINAR, CONSULTA_PERSONA, etc.)
 * @param {string} modulo - Módulo donde ocurre la acción (PERSONAS, VEHICULOS, etc.)
 * @param {object} detalles - Objeto con detalles de la acción
 * @param {string} registroId - ID del registro afectado (opcional)
 */
window.registrarLog = async function(accion, modulo, detalles = {}, registroId = null) {
    const userId = sessionStorage.getItem('pnb_user_id');
    const userEmail = sessionStorage.getItem('pnb_user_email');
    const userNombre = document.getElementById('user-nombre-display')?.textContent || 'Desconocido';
    
    if (!userId) return;
    
    try {
        await window.supabaseClient
            .from('sistema_logs')
            .insert([{
                user_id: userId,
                user_nombre: userNombre,
                user_email: userEmail,
                accion: accion,
                modulo: modulo,
                detalles: detalles,
                registro_id: registroId
            }]);
    } catch (err) {
        console.error('Error al registrar log:', err);
    }
};
