// Script para verificar los datos de los contenedores LOTE-02, LOTE-03, LOTE-04
// Ejecutar en la consola del navegador cuando estés en la página de agregar audiovisual

async function verificarContenedores() {
  try {
    console.log('🔍 Verificando contenedores LOTE-02, LOTE-03, LOTE-04...');

    // Intentar diferentes formas de acceder a Supabase
    let supabaseInstance = null;

    // Primero buscar la instancia específica de la aplicación
    if (typeof window.supabaseClient !== 'undefined') {
      supabaseInstance = window.supabaseClient;
      console.log('✅ Usando window.supabaseClient');
    } else if (typeof supa !== 'undefined') {
      supabaseInstance = supa;
      console.log('✅ Usando variable global: supa');
    } else if (typeof window.supa !== 'undefined') {
      supabaseInstance = window.supa;
      console.log('✅ Usando window.supa');
    } else if (typeof window.supabase !== 'undefined') {
      supabaseInstance = window.supabase;
      console.log('✅ Usando window.supabase');
    } else {
      // Buscar en el contexto global cualquier objeto que tenga método from
      for (let key in window) {
        if (window[key] && typeof window[key].from === 'function' && typeof window[key].select === 'function') {
          supabaseInstance = window[key];
          console.log(`✅ Encontrado en window.${key}`);
          break;
        }
      }
    }

    if (!supabaseInstance) {
      console.error('❌ No se pudo encontrar la instancia de Supabase. Variables disponibles:');
      console.log('Globales relacionadas:', Object.keys(window).filter(k =>
        k.includes('supa') || k.includes('base') || k.includes('Supa') || k.includes('Base')
      ));
      console.log('Todas las globales:', Object.keys(window));
      return;
    }

    // Verificar que sea realmente una instancia de Supabase
    if (typeof supabaseInstance.from !== 'function') {
      console.error('❌ El objeto encontrado no es una instancia válida de Supabase');
      console.log('Tipo del objeto:', typeof supabaseInstance);
      console.log('Propiedades:', Object.keys(supabaseInstance));
      return;
    }

    console.log('✅ Instancia de Supabase encontrada correctamente');

    // Lista de tablas posibles donde podrían estar los contenedores
    const tablasPosibles = [
      'catalogo_audiovisual',
      'stock_audiovisual',
      'audiovisual',
      'movimientos_audiovisual',
      'items_movimiento_audiovisual'
    ];

    console.log('🔍 Buscando contenedores en diferentes tablas...');

    for (const tabla of tablasPosibles) {
      try {
        console.log(`\n📋 Consultando tabla: ${tabla}`);

        const { data: contenedores, error } = await supabaseInstance
          .from(tabla)
          .select('id, codigo, contenedor, contenedor_tipo, bodega_secundaria, es_contenedor, tipo_alta, campos_personalizados')
          .in('contenedor', ['LOTE-02', 'LOTE-03', 'LOTE-04']);

        if (error) {
          console.log(`   ❌ Error en tabla ${tabla}:`, error.message);
          continue;
        }

        if (contenedores && contenedores.length > 0) {
          console.log(`   ✅ ENCONTRADOS en tabla ${tabla}:`, contenedores.length, 'registros');

          // Mostrar detalles de cada contenedor encontrado
          contenedores.forEach(c => {
            console.log(`   🔎 ${c.contenedor}: ID=${c.id}, secundaria="${c.bodega_secundaria}", es_contenedor=${c.es_contenedor}, tipo_alta="${c.tipo_alta}"`);
          });
        } else {
          console.log(`   📭 No encontrados en tabla ${tabla}`);
        }
      } catch (e) {
        console.log(`   ❌ Error consultando tabla ${tabla}:`, e.message);
      }
    }

    // También buscar contenedores que contengan "LOTE" para ver qué hay disponible
    console.log('\n🔍 Buscando todos los contenedores que contienen "LOTE"...');

    try {
      const { data: todosLotes, error } = await supabaseInstance
        .from('catalogo_audiovisual')
        .select('contenedor, bodega_secundaria, es_contenedor, tipo_alta')
        .like('contenedor', '%LOTE%')
        .limit(20);

      if (error) {
        console.log('❌ Error buscando LOTE:', error.message);
      } else if (todosLotes && todosLotes.length > 0) {
        console.log('📋 Contenedores con "LOTE" encontrados:', todosLotes);
      } else {
        console.log('📭 No se encontraron contenedores con "LOTE"');
      }
    } catch (e) {
      console.log('❌ Error en búsqueda de LOTE:', e.message);
    }

    // Verificar estado actual
    console.log('\n📋 Estado actual de la aplicación:');
    if (typeof state !== 'undefined') {
      console.log(`   Secundaria seleccionada: "${state.secundariaNombre || 'NINGUNA'}"`);
      console.log(`   Estado completo:`, state);
    } else {
      console.log('   ❌ Variable state no encontrada');
    }

  } catch (e) {
    console.error('❌ Error en verificación:', e);
  }
}

// Ejecutar automáticamente
verificarContenedores();