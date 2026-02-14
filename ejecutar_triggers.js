// Script temporal para ejecutar los triggers y repoblar plantillas
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uquwfiepdryqmgjhstpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdXdmaWVwZHJ5cW1namhzdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzUzMTgsImV4cCI6MjA4MTU1MTMxOH0.XXdexL2w0di7o2xZo6TU8AQLxrkKzsMp60ozXJLsTjE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function recreateTriggers() {
  try {
    console.log('🔄 Recreando triggers...');

    // Para recrear triggers, necesitamos usar SQL directo
    // Como Supabase no permite ejecutar DDL directamente desde el cliente,
    // vamos a intentar crear las funciones usando la API de Supabase

    // Primero intentar eliminar triggers existentes (esto puede fallar si no existen)
    try {
      await supabase.rpc('drop_trigger_if_exists', {
        trigger_name: 'trig_copiar_plantilla_hierros',
        table_name: 'catalogo_hierros'
      });
    } catch (e) {
      console.log('Trigger hierros no existía o no se pudo eliminar');
    }

    try {
      await supabase.rpc('drop_trigger_if_exists', {
        trigger_name: 'trig_copiar_plantilla_audiovisual',
        table_name: 'catalogo_audiovisual'
      });
    } catch (e) {
      console.log('Trigger audiovisual no existía o no se pudo eliminar');
    }

    try {
      await supabase.rpc('drop_trigger_if_exists', {
        trigger_name: 'trig_copiar_plantilla_consumibles',
        table_name: 'catalogo_consumibles'
      });
    } catch (e) {
      console.log('Trigger consumibles no existía o no se pudo eliminar');
    }

    console.log('⚠️ Nota: Los triggers deben recrearse manualmente en Supabase Dashboard');
    console.log('   Ve a: https://supabase.com/dashboard/project/uquwfiepdryqmgjhstpd/sql');
    console.log('   Y ejecuta el script: sql/recrear_triggers_recetas.sql');

  } catch (error) {
    console.error('❌ Error recreando triggers:', error);
  }
}

async function repopulateTemplates() {
  try {
    console.log('🔄 Repoblando plantillas...');

    // Paso 1: Limpiar tabla existente
    console.log('🧹 Limpiando tabla recetas_plantillas_materiales...');
    // Para eliminar todos los registros, usamos una condición que siempre sea verdadera
    const { error: truncateError } = await supabase
      .from('recetas_plantillas_materiales')
      .delete()
      .not('id', 'is', null); // Eliminar todos los registros donde id no es null

    if (truncateError) {
      console.error('❌ Error limpiando tabla:', truncateError);
      return;
    }

    // Paso 2: Re-poblar desde catalogo_hierros
    console.log('📝 Re-poblando desde catalogo_hierros...');
    const { data: hierrosData, error: hierrosError } = await supabase
      .from('catalogo_hierros')
      .select('*')
      .eq('tipo_alta', 'MATERIAL')
      .or('es_contenedor.is.null,es_contenedor.eq.false');

    if (hierrosError) {
      console.error('❌ Error obteniendo datos de hierros:', hierrosError);
      return;
    }

    // Procesar e insertar datos de hierros uno por uno
    console.log(`📝 Procesando ${hierrosData.length} registros de hierros...`);
    let hierrosProcessed = 0;
    for (const h of hierrosData) {
      const dims = h.dimensiones;
      let dims_sig = null;

      if (dims) {
        dims_sig = [
          dims.ancho && dims.largo && dims.grosor ? `${dims.ancho}x${dims.largo}x${dims.grosor}` : null,
          dims.diametro && dims.largo ? `${dims.diametro}x${dims.largo}` : null,
          dims.alto && dims.ancho && dims.largo ? `${dims.alto}x${dims.ancho}x${dims.largo}` : null
        ].find(d => d);
      }

      const nombre_base = h.nombre_base || h.nombre.replace(/\s+\d+\s*$/, '');
      const nombre_plantilla = dims_sig ? `${nombre_base} ${dims_sig}` : nombre_base;

      const template = {
        nombre_plantilla: nombre_plantilla.trim(),
        tipo: 'MATERIAL',
        dimensiones: dims,
        catalogos: ['HIERROS'],
        bodega_secundaria: h.bodega_secundaria ? [h.bodega_secundaria] : [],
        descripcion: 'Re-poblado desde catálogo'
      };

      const { error: insertError } = await supabase
        .from('recetas_plantillas_materiales')
        .upsert([template], { onConflict: 'nombre_plantilla' });

      if (insertError) {
        console.error(`❌ Error procesando hierro ${h.nombre}:`, insertError.message);
      } else {
        hierrosProcessed++;
      }
    }
    console.log(`✅ Procesados ${hierrosProcessed} registros de hierros`);

    // Paso 3: Re-poblar desde catalogo_audiovisual
    console.log('📝 Re-poblando desde catalogo_audiovisual...');
    const { data: audiovisualData, error: audiovisualError } = await supabase
      .from('catalogo_audiovisual')
      .select('*')
      .eq('tipo_alta', 'MATERIAL')
      .or('es_contenedor.is.null,es_contenedor.eq.false');

    if (audiovisualError) {
      console.error('❌ Error obteniendo datos de audiovisual:', audiovisualError);
      return;
    }

    // Procesar e insertar datos de audiovisual uno por uno
    console.log(`📝 Procesando ${audiovisualData.length} registros de audiovisual...`);
    let audiovisualProcessed = 0;
    for (const a of audiovisualData) {
      const dims = a.dimensiones;
      let dims_sig = null;

      if (dims) {
        dims_sig = [
          dims.ancho && dims.largo && dims.grosor ? `${dims.ancho}x${dims.largo}x${dims.grosor}` : null,
          dims.diametro && dims.largo ? `${dims.diametro}x${dims.largo}` : null,
          dims.alto && dims.ancho && dims.largo ? `${dims.alto}x${dims.ancho}x${dims.largo}` : null
        ].find(d => d);
      }

      const nombre_base = a.nombre_base || a.nombre.replace(/\s+\d+\s*$/, '');
      const nombre_plantilla = dims_sig ? `${nombre_base} ${dims_sig}` : nombre_base;

      const template = {
        nombre_plantilla: nombre_plantilla.trim(),
        tipo: 'MATERIAL',
        dimensiones: dims,
        catalogos: ['AUDIOVISUAL'],
        bodega_secundaria: a.bodega_secundaria ? [a.bodega_secundaria] : [],
        descripcion: 'Re-poblado desde catálogo'
      };

      const { error: insertError } = await supabase
        .from('recetas_plantillas_materiales')
        .upsert([template], { onConflict: 'nombre_plantilla' });

      if (insertError) {
        console.error(`❌ Error procesando audiovisual ${a.nombre}:`, insertError.message);
      } else {
        audiovisualProcessed++;
      }
    }
    console.log(`✅ Procesados ${audiovisualProcessed} registros de audiovisual`);

    // Paso 4: Re-poblar desde catalogo_consumibles
    console.log('📝 Re-poblando desde catalogo_consumibles...');
    const { data: consumiblesData, error: consumiblesError } = await supabase
      .from('catalogo_consumibles')
      .select('*')
      .eq('tipo_alta', 'MATERIAL')
      .or('es_contenedor.is.null,es_contenedor.eq.false');

    if (consumiblesError) {
      console.error('❌ Error obteniendo datos de consumibles:', consumiblesError);
      return;
    }

    // Procesar e insertar datos de consumibles uno por uno
    console.log(`📝 Procesando ${consumiblesData.length} registros de consumibles...`);
    let consumiblesProcessed = 0;
    for (const c of consumiblesData) {
      const dims = c.dimensiones;
      let dims_sig = null;

      if (dims) {
        dims_sig = [
          dims.ancho && dims.largo && dims.grosor ? `${dims.ancho}x${dims.largo}x${dims.grosor}` : null,
          dims.diametro && dims.largo ? `${dims.diametro}x${dims.largo}` : null,
          dims.alto && dims.ancho && dims.largo ? `${dims.alto}x${dims.ancho}x${dims.largo}` : null
        ].find(d => d);
      }

      const nombre_base = c.nombre_base || c.nombre.replace(/\s+\d+\s*$/, '');
      const nombre_plantilla = dims_sig ? `${nombre_base} ${dims_sig}` : nombre_base;

      const template = {
        nombre_plantilla: nombre_plantilla.trim(),
        tipo: 'MATERIAL',
        dimensiones: dims,
        catalogos: ['CONSUMIBLES'],
        bodega_secundaria: c.bodega_secundaria ? [c.bodega_secundaria] : [],
        descripcion: 'Re-poblado desde catálogo'
      };

      const { error: insertError } = await supabase
        .from('recetas_plantillas_materiales')
        .upsert([template], { onConflict: 'nombre_plantilla' });

      if (insertError) {
        console.error(`❌ Error procesando consumible ${c.nombre}:`, insertError.message);
      } else {
        consumiblesProcessed++;
      }
    }
    console.log(`✅ Procesados ${consumiblesProcessed} registros de consumibles`);

    console.log('✅ Plantillas repobladas exitosamente');

  } catch (error) {
    console.error('❌ Error repoblando plantillas:', error);
  }
}

async function main() {
  await recreateTriggers();
  await repopulateTemplates();
  console.log('🎉 Proceso completado');
}

main();