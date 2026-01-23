// desktop/modules/logistica/logistica.js

document.addEventListener('DOMContentLoaded', () => {
    const area = document.querySelector('.log-area-dinamica');
    // Carga inicial por defecto si está vacío
    if (area && area.innerHTML.includes('Cargando')) {
        const eventoFake = { target: { dataset: { vista: 'log-dashboard' } } };
        manejarClicVistaLogistica(eventoFake);
    }
});

async function manejarClicVistaLogistica(evento) {
    const vista = evento?.target?.dataset?.vista;
    if (!vista) return;

    // Diferenciar si se carga en el panel de tabs o en el área principal
    const esTab = vista.startsWith('tab-');
    const contenedor = esTab 
        ? document.getElementById('log-tab-panel') 
        : document.querySelector('.log-area-dinamica');

    if (!contenedor) return;

    contenedor.innerHTML = '<p style="color: #999; padding: 20px;">Cargando módulo...</p>';

    try {
        let ruta = '';

        // --- RUTAS DE LOGÍSTICA ---
        if (vista === 'log-solicitud') ruta = './modules/logistica/bodega/solicitudmateriales.html';
        if (vista === 'log-seguimiento') ruta = './modules/logistica/bodega/missolicitudescontent.html';
        if (vista === 'log-recetas') ruta = './modules/logistica/recetas.html';
        
        // --- VISTAS DE DASHBOARD ---
        if (vista === 'log-dashboard') ruta = './modules/logistica/dashboard/principal.html';
        if (vista === 'tab-pendientes') ruta = './modules/logistica/dashboard/pendientes.html';

        if (!ruta) {
            contenedor.innerHTML = `<p style="color: red;">Vista no encontrada: ${vista}</p>`;
            return;
        }

        const response = await fetch(ruta);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extraer y agregar estilos del head
        const links = doc.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !document.querySelector(`link[href="${href}"]`)) {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = href;
                document.head.appendChild(newLink);
            }
        });

        // Extraer y ejecutar scripts
        const scripts = doc.querySelectorAll('script');
        let scriptContent = '';
        scripts.forEach(s => {
            scriptContent += s.textContent + '\n';
            s.remove();
        });

        contenedor.innerHTML = doc.body.innerHTML;

        if (scriptContent) {
            setTimeout(() => {
                try {
                    new Function(scriptContent)();
                    console.log(`✅ Logística: ${vista} cargada.`);
                } catch (e) {
                    console.error('❌ Error en script de logística:', e);
                }
            }, 50);
        }
    } catch (err) {
        contenedor.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
}

// Delegación de eventos para el menú
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-vista]')) {
        // Solo actuar si el data-vista pertenece a logistica (prefijo log- o tab-)
        if (e.target.dataset.vista.startsWith('log-') || e.target.dataset.vista.startsWith('tab-')) {
            manejarClicVistaLogistica(e);
        }
    }
});

// =============================================================================
// 🔹 FUNCIÓN DE EXPORTACIÓN A EXCEL PARA MÓDULO LOGÍSTICA
// =============================================================================
async function exportarLogisticaAExcel() {
  try {
    // Tablas específicas del módulo Logística
    const tablas = ['solicitudes_logistica', 'items_solicitud_logistica', 'despachos_logistica', 'bajas_logistica', 'items_baja_logistica'];
    
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
    const nombreArchivo = `exportacion_logistica_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    alert(`✅ Exportación completada: ${nombreArchivo}`);
  } catch (error) {
    console.error('Error en la exportación:', error);
    alert('❌ Error al exportar datos de Logística.');
  }
}