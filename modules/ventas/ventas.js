// desktop/modules/ventas/ventas.js
document.querySelectorAll('.ventas-submenu-btn:not(:disabled)').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const vista = e.currentTarget.dataset.vista;
    const area = document.querySelector('.ventas-area-dinamica');
    area.innerHTML = '<p style="color: #999;">Cargando...</p>';

    try {
      let ruta = '';
      if (vista.startsWith('clientes-')) {
        ruta = `./modules/ventas/clientes/${vista.split('-')[1]}.html`;
      } else if (vista.startsWith('cotizaciones-')) {
        ruta = `./modules/ventas/cotizaciones/${vista.split('-')[1]}.html`;
      } else if (vista.startsWith('servicios-')) {
        ruta = `./modules/ventas/servicios/${vista.split('-')[1]}.html`;
      } else if (vista === 'ventasactivo-ventasactivo') {
        ruta = `./modules/ventas/ventasactivo/ventasactivo.html`;
      } else if (vista === 'eventos-creareventos') {
        ruta = `./modules/ventas/eventos/creareventos.html`;
      } else if (vista === 'eventos-listareventos') {
        ruta = `./modules/ventas/eventos/listareventos.html`;
      }

      const response = await fetch(ruta);
      const fullHtml = await response.text();

      // Parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, 'text/html');

      // ✅ EXTRAER EL CONTENIDO DEL BODY, LINKS Y SCRIPTS
      const bodyContent = doc.body.innerHTML;
      const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
      const scripts = Array.from(doc.querySelectorAll('script'));

      // Limpiar el área antes de inyectar
      area.innerHTML = '';

      // Inyectar estilos en document.head (resolver rutas relativas respecto a response.url)
      try {
        const added = [];
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (!href) return;
          const resolved = new URL(href, response.url).href;
          const exists = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
            .some(l => l.href === resolved);
          if (!exists) {
            const linkTag = document.createElement('link');
            linkTag.rel = 'stylesheet';
            linkTag.href = resolved;
            document.head.appendChild(linkTag);
            added.push(linkTag);
          }
        });

        if (added.length > 0) {
          const loadPromises = added.map(lt => new Promise(res => {
            lt.onload = () => res();
            lt.onerror = () => res();
          }));
          // Esperar a que carguen o 300ms como fallback
          await Promise.race([Promise.all(loadPromises), new Promise(res => setTimeout(res, 300))]);
        }
      } catch (e) {
        console.warn('No se pudieron inyectar estilos de la vista:', e);
      }

      // Inyectar el contenido del body
      area.innerHTML = bodyContent;

      // Inyectar y ejecutar scripts (resolver src relativo respecto a response.url)
      scripts.forEach(script => {
        const scriptTag = document.createElement('script');
        const src = script.getAttribute('src');
        if (src) {
          try {
            scriptTag.src = new URL(src, response.url).href;
          } catch (e) {
            scriptTag.src = src;
          }
        } else {
          scriptTag.textContent = script.textContent;
        }
        area.appendChild(scriptTag);
      });

      console.log(`✅ Vista ${vista} cargada correctamente.`);

    } catch (err) {
      area.innerHTML = `<p style="color: red;">Error al cargar: ${err.message}</p>`;
    }
  });
});

// =============================================================================
// 🔹 FUNCIÓN DE EXPORTACIÓN A EXCEL PARA MÓDULO VENTAS
// =============================================================================
async function exportarVentasAExcel() {
  try {
    // Tablas específicas del módulo Ventas
    const tablas = ['clientes', 'cotizaciones', 'eventos', 'servicios', 'ventas_activas', 'items_venta_activa', 'despachos_ventas_activas', 'items_despacho_venta_activa'];
    
    const workbook = XLSX.utils.book_new();
    
    for (const tabla of tablas) {
      const { data, error } = await window.supabaseClient.from(tabla).select('*');
      if (error) {
        console.error(`Error al obtener datos de ${tabla}:`, error);
        continue;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, tabla.substring(0, 31)); // Excel limita nombres a 31 chars
    }
    
    // Generar y descargar el archivo
    const nombreArchivo = `exportacion_ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    alert(`✅ Exportación completada: ${nombreArchivo}`);
  } catch (error) {
    console.error('Error en la exportación:', error);
    alert('❌ Error al exportar datos de Ventas.');
  }
}