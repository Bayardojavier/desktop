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
})();