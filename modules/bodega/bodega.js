  // desktop/modules/bodega/bodega.js
// Verificar que los elementos existen
console.log('bodega.js cargado');
window.__ACTIVE_INVENTARIO_SCOPE = 'general';
console.log('bodega-tab-panel existe:', document.getElementById('bodega-tab-panel'));
console.log('bodega-area-contenido existe:', document.querySelector('.bodega-area-contenido'));
// Delegated click handler: toggles collapsed class on menu groups even if menu was injected later
document.addEventListener('click', (e) => {
  try {
    const h3 = e.target.closest('.bodega-menu-lateral h3');
    if (!h3) return;
    const grupo = h3.nextElementSibling;
    if (grupo && grupo.classList && grupo.classList.contains('bodega-menu-grupo')) {
      grupo.classList.toggle('collapsed');
    }
  } catch (err) {
    console.warn('Error en delegado de menú lateral:', err);
  }
});

// Ensure groups are collapsed if present when script runs (harmless if not yet in DOM)
try {
  document.querySelectorAll('.bodega-menu-grupo').forEach(grupo => grupo.classList.add('collapsed'));
} catch (e) {
  /* ignore */
}
  // ─── 1. CARGA INICIAL DEL DASHBOARD ────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    window.__ACTIVE_INVENTARIO_SCOPE = 'general';
    console.log('bodega.js DOMContentLoaded');
    console.log('bodega-tab-panel existe:', document.getElementById('bodega-tab-panel'));
    console.log('bodega-area-contenido existe:', document.querySelector('.bodega-area-contenido'));

    const area = document.querySelector('.bodega-area-contenido');
    if (area && area.innerHTML.includes('Selecciona una opción del menú')) {
      // Simular clic en "Dashboard - Por Bodega"
      const eventoFake = { target: { dataset: { vista: 'dashboard-xbodega' } } };
      manejarClicVista(eventoFake);
    }
  });

  // ─── 2. FUNCIÓN ÚNICA DE MANEJO DE VISTAS ───────────────────────────────────
  async function manejarClicVista(evento) {
    const vista = evento?.target?.dataset?.vista;
    if (!vista) return;

    // Contexto para el formulario universal de alta (1 módulo, 3 bodegas principales)
    function setUniversalAgregarContext(v) {
      if (v === 'universal-agregar-electronicos' || v === 'audiovisual-agregar' || v === 'audiovisual-modificar') {
        window.__UA_CONTEXT = {
          mode: 'ELECTRONICOS',
          lockPrincipal: true,
          principalCandidates: ['Audiovisual', 'Bodega Audiovisual', 'Materiales Electrónicos', 'Materiales Electronicos'],
          tableOverrides: { catalogo: 'catalogo_audiovisual', movimientos: 'movimientos_bodega_audiovisual' }
        };
        return;
      }
      if (v === 'universal-agregar-estructuras' || v === 'hierro-agregar' || v === 'hierro-modificar') {
        window.__UA_CONTEXT = {
          mode: 'ESTRUCTURAS',
          lockPrincipal: true,
          principalCandidates: ['Hierros', 'Bodega Hierros', 'Estructuras', 'Materiales de Estructuras', 'Hierro'],
          tableOverrides: { catalogo: 'catalogo_hierros', movimientos: 'movimientos_bodega_hierros' }
        };
        return;
      }
      if (v === 'universal-agregar' || v === 'universal-agregar-consumibles' || v === 'universal-agregar-herramientas' || v === 'universal-modificar-consumibles') {
        window.__UA_CONTEXT = {
          mode: 'CONSUMIBLES',
          lockPrincipal: true,
          principalCandidates: ['Herramientas y consumibles', 'Bodega de Herramientas y consumibles', 'Consumibles', 'Herramientas', 'Ferretería', 'Ferreteria'],
          tableOverrides: { catalogo: 'catalogo_consumibles', movimientos: 'movimientos_bodega_consumibles' }
        };
        return;
      }

      // Cualquier otra vista: no forzar contexto
      window.__UA_CONTEXT = null;
    }

    setUniversalAgregarContext(vista);

    console.log('Intentando cargar vista:', vista);

    const esDashboard = vista.startsWith('dashboard-');

    // 👉 CONTENEDOR CORRECTO SEGÚN EL TIPO DE VISTA
    let contenedor;
    if (esDashboard) {
      contenedor = document.getElementById('bodega-tab-panel');
    } else {
      // Para vistas no dashboard, usar el área de contenido principal
      contenedor = document.querySelector('.bodega-area-contenido');
      // Si no existe, intentar encontrar un contenedor alternativo
      if (!contenedor) {
        contenedor = document.querySelector('.bodega-layout-tres-columnas');
      }
    }

    console.log('Contenedor encontrado:', contenedor, 'para vista:', vista);

    if (!contenedor) {
      console.warn('Contenedor no encontrado para la vista:', vista);
      return;
    }

    contenedor.innerHTML = '<p style="color: #999;">Cargando...</p>';

    try {
      let ruta = '';

      // --- VISTAS NORMALES ---
      // universal-agregar (genérico) se redirige al flujo de Consumibles
      if (vista === 'universal-agregar') ruta = './modules/bodega/universal/agregar_consumibles_v2.html';
      if (vista === 'universal-agregar-electronicos') ruta = './modules/bodega/universal/agregar_audiovisual.html';
      if (vista === 'universal-agregar-estructuras') ruta = './modules/bodega/universal/agregar_hierros.html';
      if (vista === 'universal-agregar-consumibles') ruta = './modules/bodega/universal/agregar_consumibles_v2.html';
      if (vista === 'universal-agregar-herramientas') ruta = './modules/bodega/universal/agregar_consumibles_v2.html';
      if (vista === 'universal-modificar-consumibles') ruta = './modules/bodega/universal/modificar_consumible.html';
      if (vista === 'universal-ficha-etiqueta') ruta = './modules/bodega/universal/ficha_etiqueta.html';
      if (vista === 'universal-ficha-etiqueta-bulk') ruta = './modules/bodega/universal/ficha_etiqueta_masivo.html';
      // Compat: vistas antiguas ahora usan el flujo universal
      if (vista === 'hierro-agregar') ruta = './modules/bodega/universal/agregar_hierros.html';
      if (vista === 'hierro-modificar') ruta = './modules/bodega/universal/modificar_hierro.html';
      if (vista === 'audiovisual-agregar') ruta = './modules/bodega/universal/agregar_audiovisual.html';
      if (vista === 'audiovisual-modificar') ruta = './modules/bodega/universal/modificar_audiovisual.html';
      // mobiliario se enruta a Consumibles por defecto (ajustable si quieres moverlo a Hierros)
      if (vista === 'mobiliario-agregar') ruta = './modules/bodega/universal/agregar_consumibles_v2.html';
      if (vista === 'mobiliario-modificar') ruta = './modules/bodega/universal/agregar_consumibles_v2.html';
      if (vista === 'movimientos-ingreso') ruta = './modules/bodega/movimientos/ingreso.html';
      if (vista === 'movimientos-despachobodega') ruta = './modules/bodega/movimientos/despachobodega.html';
      if (vista === 'movimientos-despacho-audiovisual') ruta = './modules/bodega/movimientos/despacho_audiovisual.html';
      if (vista === 'movimientos-devolucion') ruta = './modules/bodega/movimientos/devolucion.html';
      if (vista === 'movimientos-ventasmateriales') ruta = './modules/bodega/movimientos/ventasmateriales.html';
      if (vista === 'movimientos-fabricacion') ruta = './modules/bodega/movimientos/fabricacion.html';
      if (vista === 'movimientos-mantenimiento') ruta = './modules/bodega/movimientos/mantenimiento.html';
      if (vista === 'movimientos-bajasmateriales') ruta = './modules/bodega/movimientos/bajasmateriales.html';

      // --- DASHBOARD ---
      if (vista === 'dashboard-xbodega') ruta = './modules/bodega/dashboard/xbodega.html';
      if (vista === 'dashboard-xitem') ruta = './modules/bodega/dashboard/xitem.html';
      if (vista === 'dashboard-xevento') ruta = './modules/bodega/dashboard/xevento.html';
      if (vista === 'dashboard-xproveedor') ruta = './modules/bodega/dashboard/xproveedor.html';

      if (!ruta) {
        contenedor.innerHTML = `<p style="color: red;">Vista no reconocida: ${vista}</p>`;
        return;
      }

      // Evita ver HTML viejo por caché (especialmente en Electron)
      const rutaNoCache = `${ruta}${ruta.includes('?') ? '&' : '?'}v=${Date.now()}`;
      console.log('Cargando ruta:', rutaNoCache);

      // Intentar con fetch primero, si falla usar XMLHttpRequest
      let response;
      try {
        response = await fetch(rutaNoCache, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (fetchError) {
        console.log('Fetch falló, intentando XMLHttpRequest:', fetchError);
        response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', rutaNoCache, true);
          try { xhr.setRequestHeader('Cache-Control', 'no-cache'); } catch (e) {}
          try { xhr.setRequestHeader('Pragma', 'no-cache'); } catch (e) {}
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                resolve({ text: () => Promise.resolve(xhr.responseText) });
              } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
              }
            }
          };
          xhr.onerror = () => reject(new Error('Error de red'));
          xhr.send();
        });
      }

      const fullHtml = await response.text();
      console.log('HTML cargado, longitud:', fullHtml.length);

      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, 'text/html');

      // Extraer scripts del HTML cargado
      const scripts = doc.querySelectorAll('script');
      let scriptContent = '';
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (!src) {
          scriptContent += script.textContent + '\n';
        }
        script.remove();
      });

      // Inyectar HTML - manejar tanto documentos completos como fragmentos
      let htmlToInject;
      if (doc.body && doc.body.innerHTML.trim()) {
        // Es un documento completo con <body>
        htmlToInject = doc.body.innerHTML;
      } else {
        // Es un fragmento HTML
        htmlToInject = fullHtml;
      }

      contenedor.innerHTML = htmlToInject;

      // Cargar CSS adicional si es necesario
      if (vista === 'hierro-agregar' || vista === 'universal-agregar-estructuras' || vista === 'hierro-modificar' || vista === 'universal-agregar-electronicos' || vista === 'audiovisual-agregar' || vista === 'audiovisual-modificar') {
        const cssHref = './modules/bodega/universal/catalogo.css';
        if (!document.querySelector(`link[href="${cssHref}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = cssHref;
          document.head.appendChild(link);
          console.log('CSS cargado:', cssHref);
        }
      }
      // (Nota: estilos de Mantenimiento están inline en el HTML; no se cargan como archivo separado)

      // Ejecutar scripts encapsulados
      if (scriptContent) {
        setTimeout(() => {
          try {
            new Function(scriptContent)();
            console.log(`✅ Vista ${vista} cargada.`);
          } catch (e) {
            console.error('❌ Error en script:', e);
            contenedor.innerHTML += `
              <p style="color: red; margin-top: 10px;">
                Error en vista ${vista}: ${e.message}
              </p>
            `;
          }
        }, 50);
      }

    } catch (err) {
      console.error('Error al cargar vista:', err);
      contenedor.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
  }

  // ─── 3. DELEGACIÓN DE EVENTOS GLOBAL ───────────────────────────────────────
  document.addEventListener('click', (e) => {
    console.log('Click detectado en:', e.target);
    if (e.target.matches('[data-vista]')) {
      console.log('Data-vista encontrado:', e.target.dataset.vista);
      manejarClicVista(e);
    }
  });

// =============================================================================
// 🔹 FUNCIÓN DE EXPORTACIÓN A EXCEL PARA MÓDULO BODEGA
// =============================================================================
async function exportarBodegaAExcel() {
  try {
    // Tablas específicas del módulo Bodega
    const tablas = [
      'stock_actual_con_precio',
      'catalogo_hierros',
      'catalogo_audiovisual',
      'catalogo_consumibles',
      'movimientos_bodega_hierros',
      'movimientos_bodega_audiovisual',
      'movimientos_bodega_consumibles',
      'recetas',
      'recetas_materiales'
    ];
    
    const workbook = XLSX.utils.book_new();
    
    for (const tabla of tablas) {
      const { data, error } = await window.supabaseClient.from(tabla).select('*');
      if (error) {
        console.error(`Error al obtener datos de ${tabla}:`, error);
        continue;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, tabla.substring(0, 31));
    }
    
    // Generar y descargar el archivo
    const nombreArchivo = `exportacion_bodega_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    alert(`✅ Exportación completada: ${nombreArchivo}`);
  } catch (error) {
    console.error('Error en la exportación:', error);
    alert('❌ Error al exportar datos de Bodega.');
  }
}

// ─── EVENTOS PARA GRUPOS DESPLEGABLES ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('Registrando eventos para grupos desplegables');
  // Hacer que los h3 sean clickeables para mostrar/ocultar sus grupos
  document.querySelectorAll('.bodega-menu-lateral h3').forEach(h3 => {
    console.log('Agregando evento a h3:', h3.textContent);
    h3.addEventListener('click', () => {
      console.log('Clic en h3:', h3.textContent);
      const grupo = h3.nextElementSibling;
      console.log('Grupo encontrado:', grupo);
      if (grupo && grupo.classList.contains('bodega-menu-grupo')) {
        console.log('Toggling collapsed');
        grupo.classList.toggle('collapsed');
      }
    });
  });

  // Inicialmente, colapsar todos los grupos
  document.querySelectorAll('.bodega-menu-grupo').forEach(grupo => {
    console.log('Colapsando grupo');
    grupo.classList.add('collapsed');
  });
});
