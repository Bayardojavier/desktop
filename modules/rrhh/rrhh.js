// desktop/modules/rrhh/rrhh.js - SOLUCIÓN DEFINITIVA DE TIEMPOS

document.querySelectorAll('.rrhh-submenu-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const vista = e.target.dataset.vista;
        const area = document.querySelector('.rrhh-area-dinamica');
        area.innerHTML = '<p style="color: #999;">Cargando...</p>';

        try {
            let ruta = '';
            // Lógica para definir la ruta (sin cambios)
            if (vista.startsWith('personal-')) {
                ruta = `./modules/rrhh/personal/${vista.split('-')[1]}.html`;
            } else if (vista.startsWith('asistencia-')) {
                ruta = `./modules/rrhh/asistencia/${vista.split('-')[1]}.html`;
            } else if (vista.startsWith('reportes-')) {
                ruta = `./modules/rrhh/reportes/${vista.split('-')[1]}.html`;
            }

            const response = await fetch(ruta);
            const fullHtml = await response.text();

            // 1. Parsear el contenido para separar HTML y Scripts
            const parser = new DOMParser();
            const doc = parser.parseFromString(fullHtml, 'text/html');

            // 2. Encontrar y extraer el código JS
            const scripts = doc.querySelectorAll('script');
            let scriptContent = '';
            scripts.forEach(script => {
                scriptContent += script.textContent + '\n';
                script.remove(); // Limpiamos el HTML para no inyectar la etiqueta <script>
            });
            
            // 3. Inyectar SOLAMENTE el HTML (estructura del formulario)
            area.innerHTML = doc.body.innerHTML; 

            // 4. Ejecutar el código JS manualmente (¡LA CLAVE DE LA SOLUCIÓN!)
            if (scriptContent) {
                // Usamos setTimeout(..., 50) para forzar una espera segura, 
                // asegurando que los elementos del DOM existan.
                setTimeout(() => {
                    try {
                        // new Function() ejecuta el código JS extraído como una cadena.
                        new Function(scriptContent)(); 
                        console.log(`✅ Lógica de la vista ${vista} ejecutada correctamente.`);
                    } catch(e) {
                        // Esto capturará errores en el script inyectado (como initCrearEmpleado())
                        console.error('❌ Error al ejecutar script inyectado:', e);
                    }
                }, 50); // 50ms de retraso
            }
            
            console.log(`✅ Vista ${vista} y script cargados correctamente.`);

        } catch (err) {
            area.innerHTML = `<p style="color: red;">Error al cargar módulo: ${err.message}</p>`;
        }
    });
});

// =============================================================================
// 🔹 FUNCIÓN DE EXPORTACIÓN A EXCEL PARA MÓDULO RRHH
// =============================================================================
async function exportarRRHHAExcel() {
  try {
    // Tablas específicas del módulo RRHH
    const tablas = ['empleados'];
    
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
    const nombreArchivo = `exportacion_rrhh_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    alert(`✅ Exportación completada: ${nombreArchivo}`);
  } catch (error) {
    console.error('Error en la exportación:', error);
    alert('❌ Error al exportar datos de RRHH.');
  }
}