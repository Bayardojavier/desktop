/**
 * Script de verificación contra Supabase (solo lectura)
 * Uso:
 *  SUPABASE_URL=... SUPABASE_KEY=... node scripts/test_devolucion_db.js --despacho=12 --itemId=123 --devoluciones=4,4,4
 *
 * El script consulta el item en `items_despacho_logistica` por `id` y muestra pendientes
 */

const { createClient } = require('@supabase/supabase-js');
const argv = require('minimist')(process.argv.slice(2));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Debes exportar SUPABASE_URL y SUPABASE_KEY en el entorno.');
  console.error('Ejemplo: SUPABASE_URL=... SUPABASE_KEY=... node scripts/test_devolucion_db.js --despacho=12 --itemId=123 --devoluciones=4,4,4');
  process.exit(2);
}

if (!argv.itemId) {
  console.error('ERROR: Debes pasar --itemId con el id del item en items_despacho_logistica a verificar.');
  process.exit(2);
}

const itemId = argv.itemId;
const devoluciones = (argv.devoluciones || '4,4,4').split(',').map(v => parseInt(v, 10));

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchItem(id) {
  const { data, error } = await supabase
    .from('items_despacho_logistica')
    .select('id, cantidad_despachada, cantidad_devuelta, codigo_material')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

(async () => {
  try {
    console.log('Consultando item id=', itemId);
    const item = await fetchItem(itemId);
    if (!item) {
      console.error('Item no encontrado:', itemId);
      process.exit(1);
    }

    console.log('Estado inicial:', item);
    let acumulado = item.cantidad_devuelta || 0;
    const despachada = item.cantidad_despachada || 0;

    devoluciones.forEach((r, i) => {
      const pendienteAntes = despachada - acumulado;
      if (r > pendienteAntes) {
        console.warn(`Paso ${i+1}: intento devolver ${r} pero pendienteAntes=${pendienteAntes} -> ABORTAR (simulación)`);
      }
      const pendienteDespues = Math.max(0, despachada - (acumulado + r));
      acumulado += r;
      console.log(`Paso ${i+1}: recibido=${r}, pendienteAntes=${pendienteAntes}, pendienteDespues=${pendienteDespues}, acumuladoDevuelto=${acumulado}`);
    });

    // También consultar estado final en BD (lectura actual)
    const final = await fetchItem(itemId);
    console.log('Estado en BD tras simulación (lectura actual):', final);
    const pendienteFinalBD = Math.max(0, (final.cantidad_despachada || 0) - (final.cantidad_devuelta || 0));
    console.log('Pendiente según BD:', pendienteFinalBD);

    process.exit(0);
  } catch (e) {
    console.error('Error durante verificación DB:', e.message || e);
    process.exit(1);
  }
})();
