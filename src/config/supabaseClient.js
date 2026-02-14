// src/config/supabaseClient.js
// Evita redeclaraciones cuando el archivo se incluye múltiples veces en vistas dinámicas.
(function initSupabaseClient() {
  if (window.supabaseClient) {
    return; // Ya inicializado
  }

  // ⚠️ Reemplaza estos valores con los de tu proyecto en Supabase
  const SUPABASE_URL = window.SUPABASE_URL || 'https://uquwfiepdryqmgjhstpd.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdXdmaWVwZHJ5cW1namhzdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzUzMTgsImV4cCI6MjA4MTU1MTMxOH0.XXdexL2w0di7o2xZo6TU8AQLxrkKzsMp60ozXJLsTjE';

  // Verifica que Supabase SDK ya esté cargado (debe incluirse antes en HTML)
  if (typeof supabase === 'undefined') {
    console.error('❌ El SDK de Supabase no se ha cargado. Asegúrate de incluir el script en tu HTML.');
    return;
  }

  // Creamos el cliente
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Exportamos (en entorno global, ya que no usamos módulos)
  window.supabaseClient = client;
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

  // Función global para logs de auditoría
  window.logAuditoria = async (operacion, tabla, registroId, datosNuevos) => {
    // Usuario por defecto si no hay usuario autenticado o el ID no es válido
    const usuarioPorDefecto = {
      id: 'f895c6b4-e267-4507-b554-d3f8fb66ea10', // Administrador General
      nombre: 'Administrador General'
    };

    // Función para validar UUID
    const isValidUUID = (uuid) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuid && uuidRegex.test(uuid);
    };

    // Usar usuario por defecto si no hay usuario o el ID no es válido
    const usuarioActual = (window.currentUser && isValidUUID(window.currentUser.id))
      ? window.currentUser
      : usuarioPorDefecto;

    try {
      // Convertir registro_id: si es numérico, convertir a string; si no es UUID válido, usar null
      let registroIdFinal = registroId;
      if (typeof registroId === 'number') {
        registroIdFinal = registroId.toString();
      } else if (registroId && !isValidUUID(registroId)) {
        // Si no es un UUID válido, usar null para evitar errores de FK
        registroIdFinal = null;
      }

      const logData = {
        usuario_id: usuarioActual.id,
        usuario_nombre: usuarioActual.nombre,
        tabla_afectada: tabla,
        operacion: operacion,
        registro_id: registroIdFinal, // UUID válido, string numérico, o null
        datos_nuevos: datosNuevos
      };

      console.log('📤 Enviando log de auditoría:', logData);

      const { data, error } = await client.from('logs_auditoria').insert(logData).select();

      if (error) {
        console.error('❌ Error en log de auditoría:', error);
        console.error('Datos enviados:', logData);
      } else {
        console.log('✅ Log de auditoría guardado:', data);
      }
    } catch (e) {
      console.error('❌ Error en log de auditoría:', e);
      console.error('Datos que se intentaron enviar:', {
        usuario_id: usuarioActual.id,
        usuario_nombre: usuarioActual.nombre,
        tabla_afectada: tabla,
        operacion: operacion,
        registro_id: registroId,
        datos_nuevos: datosNuevos
      });
    }
  };
})();