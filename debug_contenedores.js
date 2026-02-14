// Debug script para contenedores audiovisual
// Copia y pega esto en la consola del navegador cuando estés en la página de agregar audiovisual

console.log('=== DEBUG CONTENEDORES AUDIOVISUAL ===');

// 1. Verificar estado actual
console.log('Estado actual:', {
  secundariaId: window.state?.secundariaId,
  secundariaNombre: window.state?.secundariaNombre,
  contenedorTipo: window.state?.contenedorTipo,
  contenedorCodigo: window.state?.contenedorCodigo
});

// 2. Verificar qué contenedores existen en BD
(async () => {
  try {
    const TABLE_CATALOGO = 'catalogo_audiovisual';
    const { data: contenedores, error } = await window.supa
      .from(TABLE_CATALOGO)
      .select('id, codigo, contenedor, contenedor_tipo, bodega_secundaria, es_contenedor, tipo_alta, campos_personalizados')
      .not('contenedor', 'is', null)
      .neq('contenedor', '');

    if (error) {
      console.error('Error cargando contenedores:', error);
      return;
    }

    console.log('Contenedores en BD:', contenedores);

    // 3. Simular el filtro aplicado
    const state = window.state || {};
    const filtered = (contenedores || []).filter(c => {
      console.log('Evaluando contenedor:', c.codigo, {
        contenedor: c.contenedor,
        es_contenedor: c.es_contenedor,
        tipo_alta: c.tipo_alta,
        bodega_secundaria: c.bodega_secundaria,
        secundariaNombre: state.secundariaNombre
      });

      if (!c || !c.contenedor) {
        console.log('❌ Rechazado: no tiene contenedor');
        return false;
      }

      const esCont = (c.es_contenedor === true) || (String(c.tipo_alta || '').toUpperCase() === 'CONTENEDOR');
      if (!esCont) {
        console.log('❌ Rechazado: no es contenedor');
        return false;
      }

      if (!state.secundariaNombre) {
        console.log('✅ Aceptado: no hay secundaria seleccionada');
        return true;
      }

      const match = String(c.bodega_secundaria || '') === String(state.secundariaNombre);
      if (match) {
        console.log('✅ Aceptado: secundaria coincide');
      } else {
        console.log('❌ Rechazado: secundaria no coincide', {
          db: String(c.bodega_secundaria || ''),
          state: String(state.secundariaNombre)
        });
      }
      return match;
    });

    console.log('Contenedores filtrados:', filtered.map(c => ({ codigo: c.codigo, contenedor: c.contenedor })));

  } catch (err) {
    console.error('Error en debug:', err);
  }
})();