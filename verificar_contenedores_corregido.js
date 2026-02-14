// Script corregido para verificar contenedores LOTE-02, LOTE-03, LOTE-04
// Ejecutar en la consola del navegador cuando estés en la página de agregar audiovisual

async function verificarContenedores() {
  try {
    console.log('🔍 Verificando contenedores LOTE-02, LOTE-03, LOTE-04...');

    // Buscar instancia de Supabase
    let supabaseInstance = null;
    if (typeof window.supabaseClient !== 'undefined') {
      supabaseInstance = window.supabaseClient;
      console.log('✅ Usando window.supabaseClient');
    }

    if (!supabaseInstance) {
      console.error('❌ No se pudo encontrar Supabase');
      return;
    }

    console.log('✅ Instancia de Supabase encontrada correctamente');

    // PRIMERO: Buscar en stock_audiovisual (la tabla que funciona)
    console.log('\n🔍 Buscando en stock_audiovisual...');

    try {
      // Probar diferentes combinaciones de columnas
      const columnasPosibles = [
        'codigo, contenedor, contenedor_tipo, bodega_secundaria, es_contenedor, tipo_alta, campos_personalizados',
        'contenedor, contenedor_tipo, bodega_secundaria, es_contenedor, tipo_alta, campos_personalizados',
        'codigo, contenedor, bodega_secundaria, es_contenedor, tipo_alta'
      ];

      for (const columnas of columnasPosibles) {
        try {
          console.log(`   Probando columnas: ${columnas}`);

          const { data: contenedores, error } = await supabaseInstance
            .from('stock_audiovisual')
            .select(columnas)
            .in('contenedor', ['LOTE-02', 'LOTE-03', 'LOTE-04']);

          if (error) {
            console.log(`     ❌ Error:`, error.message);
            continue;
          }

          if (contenedores && contenedores.length > 0) {
            console.log(`     ✅ ¡ENCONTRADOS! ${contenedores.length} registros`);

            contenedores.forEach(c => {
              console.log(`       🔎 ${c.contenedor}: secundaria="${c.bodega_secundaria}", es_contenedor=${c.es_contenedor}, tipo_alta="${c.tipo_alta}"`);
            });

            // Verificar filtros
            console.log('\n       📊 Verificación de filtros:');
            contenedores.forEach(c => {
              const tieneContenedor = c.contenedor ? true : false;
              const esCont = (c.es_contenedor === true) || (String(c.tipo_alta || '').toUpperCase() === 'CONTENEDOR');

              let secundariaSeleccionada = '';
              if (typeof state !== 'undefined' && state.secundariaNombre) {
                secundariaSeleccionada = state.secundariaNombre;
              }

              const secundariaMatch = !secundariaSeleccionada ||
                (String(c.bodega_secundaria || '').trim().toLowerCase() === String(secundariaSeleccionada).trim().toLowerCase());

              console.log(`         ${c.contenedor}: ✅ contenedor=${tieneContenedor}, ✅ es_contenedor=${esCont}, ✅ secundaria_match=${secundariaMatch} → 🎯 Debería aparecer: ${tieneContenedor && esCont && secundariaMatch}`);
            });

            break;
          } else {
            console.log(`     📭 No encontrados con estas columnas`);
          }
        } catch (e) {
          console.log(`     ❌ Error:`, e.message);
        }
      }
    } catch (e) {
      console.log('❌ Error consultando stock_audiovisual:', e.message);
    }

    // SEGUNDO: Buscar todos los LOTE disponibles
    console.log('\n🔍 Buscando TODOS los contenedores con "LOTE"...');

    try {
      const { data: todosLotes, error } = await supabaseInstance
        .from('stock_audiovisual')
        .select('contenedor, bodega_secundaria, es_contenedor, tipo_alta')
        .like('contenedor', '%LOTE%')
        .limit(50);

      if (error) {
        console.log('❌ Error:', error.message);
      } else if (todosLotes && todosLotes.length > 0) {
        console.log(`📋 ${todosLotes.length} contenedores con "LOTE":`);
        todosLotes.forEach(c => {
          console.log(`   🔎 ${c.contenedor}: secundaria="${c.bodega_secundaria}", es_contenedor=${c.es_contenedor}`);
        });
      } else {
        console.log('📭 No se encontraron contenedores con "LOTE"');
      }
    } catch (e) {
      console.log('❌ Error:', e.message);
    }

    // ESTADO ACTUAL
    console.log('\n📋 Estado actual:');
    if (typeof state !== 'undefined') {
      console.log(`   Secundaria: "${state.secundariaNombre || 'NINGUNA'}"`);
    } else {
      console.log('   ❌ Variable state no encontrada');
    }

  } catch (e) {
    console.error('❌ Error:', e);
  }
}

verificarContenedores();