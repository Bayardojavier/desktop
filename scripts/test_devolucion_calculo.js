// Simulación de devoluciones parciales para verificar cálculo de pendiente restante

function procesarDevoluciones(cantidadDespachada, devoluciones) {
  let cantidadDevueltaAcumulada = 0;
  const resultados = [];

  for (const recibido of devoluciones) {
    const pendienteAntes = cantidadDespachada - cantidadDevueltaAcumulada;
    if (recibido > pendienteAntes) {
      throw new Error(`Intento de devolver más de lo pendiente: recibido=${recibido}, pendienteAntes=${pendienteAntes}`);
    }

    // Comportamiento igual al implementado: pendienteDespues = cantidadDespachada - (cantidadDevueltaActual + cantidadRecibida)
    const pendienteDespues = Math.max(0, cantidadDespachada - (cantidadDevueltaAcumulada + recibido));

    cantidadDevueltaAcumulada += recibido;

    resultados.push({ recibido, pendienteAntes, pendienteDespues, acumulado: cantidadDevueltaAcumulada });
  }

  return resultados;
}

function assertEqual(a, b, msg) {
  if (a !== b) {
    console.error('ASSERTION FAILED:', msg, a, '!==', b);
    process.exit(2);
  }
}

// Caso de prueba: despacho 12, devoluciones [4,4,4] → pendientes 8,4,0
const despacho = 12;
const devoluciones = [4,4,4];
const esperado = [8,4,0];

try {
  const res = procesarDevoluciones(despacho, devoluciones);
  console.log('Resultados de la simulación:');
  res.forEach((r, i) => console.log(`Paso ${i+1}: recibido=${r.recibido}, pendienteAntes=${r.pendienteAntes}, pendienteDespues=${r.pendienteDespues}`));

  // Verificar
  res.forEach((r, i) => assertEqual(r.pendienteDespues, esperado[i], `Paso ${i+1} pendiente`));

  console.log('\n✅ Simulación exitosa: los pendientes son', esperado.join(', '));
  console.log('\nNota: para prueba contra la BD ejecuta:');
  console.log('SUPABASE_URL=... SUPABASE_KEY=... npm run test:devolucion:db -- --itemId=<id> --devoluciones=4,4,4');
  process.exit(0);
} catch (e) {
  console.error('\n❌ Error en simulación:', e.message || e);
  process.exit(1);
}
