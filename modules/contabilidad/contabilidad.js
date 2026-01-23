// desktop/modules/contabilidad/contabilidad.js

document.addEventListener('DOMContentLoaded', () => {
    const area = document.querySelector('.con-area-dinamica');
    if (area && (area.innerHTML.includes('Cargando') || area.innerHTML.trim() === "")) {
        const eventoFake = { target: { dataset: { vista: 'con-dashboard' } } };
        manejarClicVistaContabilidad(eventoFake);
    }
});

async function manejarClicVistaContabilidad(evento) {
    const vista = evento?.target?.dataset?.vista;
    if (!vista) return;

    const esTab = vista.startsWith('con-tab-');
    const contenedor = esTab 
        ? document.getElementById('con-tab-panel') 
        : document.querySelector('.con-area-dinamica');

    if (!contenedor) return;

    contenedor.innerHTML = '<p style="color: #999; padding: 20px;">Cargando registros contables...</p>';

    try {
        let ruta = '';

        // --- RUTAS DE CONTABILIDAD ---
        if (vista === 'con-dashboard')    ruta = './modules/contabilidad/dashboard/resumen.html';
        if (vista === 'con-facturacion')  ruta = './modules/contabilidad/facturas/lista.html';
        if (vista === 'con-pagos')        ruta = './modules/contabilidad/pagos/control.html';

        // --- RUTAS DE COMPRAS ---
        if (vista === 'com-solicitudes')  ruta = './modules/contabilidad/compras/solicitudes.html';
        if (vista === 'com-ordenes')      ruta = './modules/contabilidad/compras/ordencompras.html';
        if (vista === 'com-proveedores')  ruta = './modules/contabilidad/compras/proveedores.html';
        if (vista === 'com-bajas')        ruta = './modules/contabilidad/bajas/bajas.html';
        if (vista === 'com-manufacturados') ruta = './modules/contabilidad/compras/manufacturados.html';

        // --- RUTAS DE REPORTES ---
        if (vista === 'con-tab-reporte')  ruta = './modules/contabilidad/reportes/reporte.html';
        // --- VISTAS DE DASHBOARD / TABS ---
        if (vista === 'con-tab-resumen')  ruta = './modules/contabilidad/dashboard/tab-resumen.html';
        if (vista === 'con-tab-pendientes') ruta = './modules/contabilidad/dashboard/tab-pendientes.html';

        if (!ruta) {
            contenedor.innerHTML = `<p style="color: red; padding: 20px;">Vista no encontrada: ${vista}</p>`;
            return;
        }

        const response = await fetch(ruta);
        const html = await response.text();

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // EXTRAER Y INYECTAR HOJAS DE ESTILO (si existen) en <head>
                try {
                    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
                    for (const l of links) {
                        try {
                            const hrefAttr = l.getAttribute('href');
                            if (!hrefAttr) continue;
                            const resolved = new URL(hrefAttr, response.url).href;
                            const exists = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
                                .some(h => h.href === resolved || h.getAttribute('href') === hrefAttr || h.href.endsWith(hrefAttr));
                            if (!exists) {
                                const linkTag = document.createElement('link');
                                linkTag.rel = 'stylesheet';
                                linkTag.href = resolved;
                                document.head.appendChild(linkTag);
                                await new Promise(r => {
                                    let settled = false;
                                    linkTag.onload = () => { if (!settled) { settled = true; r(); } };
                                    setTimeout(() => { if (!settled) { settled = true; r(); } }, 300);
                                });
                            }
                        } catch (innerErr) { console.warn('inject css inner', innerErr); }
                    }
                } catch (errCss) { console.warn('no se procesaron estilos de la vista:', errCss); }

                // ✅ EXTRAER EL CONTENIDO DEL BODY
                const bodyContent = doc.body.innerHTML;

                // ✅ EXTRAER LOS SCRIPTS
                const scripts = Array.from(doc.querySelectorAll('script'));

                // ✅ 1. INSERTAR EL HTML EN EL DOM
                contenedor.innerHTML = bodyContent;

                // ✅ 2. INYECTAR LOS SCRIPTS EN EL DOM (FORMA CORRECTA)
                scripts.forEach(script => {
                        const scriptTag = document.createElement('script');
            
                        // Copiar atributos (si los hay)
                        if (script.src) {
                                // resolver src relativo a la respuesta
                                try {
                                    const srcAttr = script.getAttribute('src');
                                    scriptTag.src = srcAttr ? new URL(srcAttr, response.url).href : script.src;
                                } catch(e) {
                                    scriptTag.src = script.src;
                                }
                        } else {
                                scriptTag.textContent = script.textContent;
                        }
            
                        // Añadir el script al contenedor
                        contenedor.appendChild(scriptTag);
                });

    } catch (err) {
        contenedor.innerHTML = `<p style="color: red; padding: 20px;">Error: ${err.message}</p>`;
    }
}

document.addEventListener('click', (e) => {
    if (e.target.matches('[data-vista]')) {
        const vista = e.target.dataset.vista;
        if (vista.startsWith('con-') || vista.startsWith('com-')) {
            manejarClicVistaContabilidad(e);
        }
    }
});

// =============================================================================
// 🔹 FUNCIÓN DE EXPORTACIÓN A EXCEL PARA MÓDULO CONTABILIDAD
// =============================================================================
async function exportarContabilidadAExcel() {
  try {
    // Tablas específicas del módulo Contabilidad
    const tablas = ['ordenes_compra', 'proveedores', 'bajas_logistica'];
    
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
    const nombreArchivo = `exportacion_contabilidad_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    alert(`✅ Exportación completada: ${nombreArchivo}`);
  } catch (error) {
    console.error('Error en la exportación:', error);
    alert('❌ Error al exportar datos de Contabilidad.');
  }
}