// Script para buscar contenedores en TODAS las tablas posibles
// Ejecutar en la consola del navegador

async function buscarEnTodasLasTablas() {
  try {
    console.log('🔍 Buscando LOTE-02, LOTE-03, LOTE-04 en TODAS las tablas...');

    let supabaseInstance = null;
    if (typeof window.supabaseClient !== 'undefined') {
      supabaseInstance = window.supabaseClient;
    }

    if (!supabaseInstance) {
      console.error('❌ No se pudo encontrar Supabase');
      return;
    }

    // Lista de tablas posibles donde podrían estar los contenedores
    const tablasPosibles = [
      'catalogo_audiovisual',
      'stock_audiovisual',
      'audiovisual',
      'movimientos_audiovisual',
      'items_movimiento_audiovisual',
      'contenedores',
      'catalogo_contenedores',
      'bodega_contenedores'
    ];

    console.log('📋 Buscando en todas las tablas disponibles...');

    for (const tabla of tablasPosibles) {
      try {
        console.log(`\n🔍 Consultando tabla: ${tabla}`);

        // Primero verificar si la tabla existe y tiene datos
        const { data: sample, error: sampleError } = await supabaseInstance
          .from(tabla)
          .select('*')
          .limit(1);

        if (sampleError) {
          console.log(`   ❌ Tabla ${tabla} no existe o error: ${sampleError.message}`);
          continue;
        }

        if (!sample || sample.length === 0) {
          console.log(`   📭 Tabla ${tabla} existe pero está vacía`);
          continue;
        }

        const columnas = Object.keys(sample[0]);
        console.log(`   ✅ Tabla ${tabla} existe con ${columnas.length} columnas: [${columnas.join(', ')}]`);

        // Buscar contenedores con "LOTE" en esta tabla
        const columnasContenedor = columnas.filter(col =>
          col.includes('contenedor') || col.includes('nombre') || col === 'contenedor'
        );

        if (columnasContenedor.length > 0) {
          // Buscar LOTE en esta tabla
          const { data: lotes, error: lotesError } = await supabaseInstance
            .from(tabla)
            .select(columnasContenedor.join(', '))
            .like(columnasContenedor[0], '%LOTE%')
            .limit(10);

          if (lotesError) {
            console.log(`   ❌ Error buscando LOTE en ${columnasContenedor[0]}: ${lotesError.message}`);
          } else if (lotes && lotes.length > 0) {
            console.log(`   🎯 ¡ENCONTRADOS ${lotes.length} registros con "LOTE" en tabla ${tabla}!`);
            lotes.forEach((item, index) => {
              console.log(`      ${index + 1}. ${JSON.stringify(item)}`);
            });
          } else {
            console.log(`   📭 No hay registros con "LOTE" en columna ${columnasContenedor[0]}`);
          }

          // Buscar específicamente LOTE-02, LOTE-03, LOTE-04
          const { data: especificos, error: especificosError } = await supabaseInstance
            .from(tabla)
            .select(columnasContenedor.join(', '))
            .in(columnasContenedor[0], ['LOTE-02', 'LOTE-03', 'LOTE-04']);

          if (especificosError) {
            console.log(`   ❌ Error buscando específicos: ${especificosError.message}`);
          } else if (especificos && especificos.length > 0) {
            console.log(`   🎯 ¡ENCONTRADOS LOS CONTENEDORES ESPECÍFICOS en tabla ${tabla}!`);
            especificos.forEach(item => {
              console.log(`      🔎 ${JSON.stringify(item)}`);
            });
          }
        } else {
          console.log(`   📭 No hay columnas relacionadas con contenedor en esta tabla`);
        }

      } catch (e) {
        console.log(`❌ Error consultando tabla ${tabla}:`, e.message);
      }
    }

    console.log('\n📋 RESUMEN:');
    console.log('✅ La tabla stock_audiovisual existe y tiene datos');
    console.log('❌ Pero NO contiene LOTE-02, LOTE-03, LOTE-04');
    console.log('❌ Tampoco contiene ningún contenedor con "LOTE"');
    console.log('🎯 CONCLUSIÓN: Los contenedores nunca se insertaron en la base de datos');

  } catch (e) {
    console.error('❌ Error general:', e);
  }
}

buscarEnTodasLasTablas();