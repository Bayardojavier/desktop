// Script para explorar el esquema de la tabla stock_audiovisual
// Ejecutar en la consola del navegador

async function explorarEsquema() {
  try {
    console.log('🔍 Explorando esquema de stock_audiovisual...');

    let supabaseInstance = null;
    if (typeof window.supabaseClient !== 'undefined') {
      supabaseInstance = window.supabaseClient;
    }

    if (!supabaseInstance) {
      console.error('❌ No se pudo encontrar Supabase');
      return;
    }

    // Método 1: Intentar consultar con * para ver todas las columnas
    console.log('\n📋 Método 1: Consulta con * (todas las columnas)');
    try {
      const { data, error } = await supabaseInstance
        .from('stock_audiovisual')
        .select('*')
        .limit(1);

      if (error) {
        console.log('❌ Error:', error.message);
      } else if (data && data.length > 0) {
        console.log('✅ Columnas encontradas:', Object.keys(data[0]));
        console.log('📊 Primer registro:', data[0]);
      } else {
        console.log('📭 Tabla vacía');
      }
    } catch (e) {
      console.log('❌ Error en consulta *:', e.message);
    }

    // Método 2: Buscar contenedores sin filtrar columnas específicas
    console.log('\n📋 Método 2: Buscar contenedores con "LOTE"');
    try {
      // Primero obtener un registro para ver las columnas
      const { data: sample, error: sampleError } = await supabaseInstance
        .from('stock_audiovisual')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Error obteniendo muestra:', sampleError.message);
        return;
      }

      if (!sample || sample.length === 0) {
        console.log('📭 Tabla stock_audiovisual está vacía');
        return;
      }

      const columnasDisponibles = Object.keys(sample[0]);
      console.log('📊 Columnas disponibles:', columnasDisponibles);

      // Buscar contenedores usando las columnas disponibles
      const columnasBasicas = columnasDisponibles.filter(col =>
        ['contenedor', 'bodega_secundaria'].includes(col)
      );

      if (columnasBasicas.length === 0) {
        console.log('❌ No se encontraron columnas contenedor o bodega_secundaria');
        return;
      }

      const selectColumns = columnasBasicas.join(', ');
      console.log(`🔍 Buscando con columnas: ${selectColumns}`);

      const { data: lotes, error: lotesError } = await supabaseInstance
        .from('stock_audiovisual')
        .select(selectColumns)
        .like('contenedor', '%LOTE%')
        .limit(20);

      if (lotesError) {
        console.log('❌ Error buscando LOTE:', lotesError.message);
      } else if (lotes && lotes.length > 0) {
        console.log(`✅ Encontrados ${lotes.length} registros con "LOTE":`);
        lotes.forEach((item, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(item)}`);
        });
      } else {
        console.log('📭 No se encontraron registros con "LOTE"');
      }

      // Buscar específicamente LOTE-02, LOTE-03, LOTE-04
      console.log('\n🔍 Buscando específicamente LOTE-02, LOTE-03, LOTE-04:');
      const { data: especificos, error: especificosError } = await supabaseInstance
        .from('stock_audiovisual')
        .select(selectColumns)
        .in('contenedor', ['LOTE-02', 'LOTE-03', 'LOTE-04']);

      if (especificosError) {
        console.log('❌ Error:', especificosError.message);
      } else if (especificos && especificos.length > 0) {
        console.log(`✅ Encontrados ${especificos.length} registros:`);
        especificos.forEach(item => {
          console.log(`   🔎 ${JSON.stringify(item)}`);
        });
      } else {
        console.log('📭 No se encontraron LOTE-02, LOTE-03, LOTE-04');
      }

    } catch (e) {
      console.log('❌ Error en búsqueda:', e.message);
    }

  } catch (e) {
    console.error('❌ Error general:', e);
  }
}

explorarEsquema();