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
        if (vista === 'log-solicitud-kits') ruta = './modules/logistica/bodega/solicitudkits.html';
        if (vista === 'log-seguimiento') ruta = './modules/logistica/bodega/missolicitudescontent.html';
        if (vista === 'log-recetas') ruta = './modules/logistica/recetas.html';
        if (vista === 'log-despacho-audiovisual') ruta = './modules/logistica/bodega/despacho_audiovisual.html';
        
        // --- VISTAS DE DASHBOARD ---
        if (vista === 'log-dashboard') ruta = './modules/logistica/dashboard/principal.html';
        if (vista === 'tab-pendientes') ruta = './modules/logistica/dashboard/pendientes.html';

        if (!ruta) {
            contenedor.innerHTML = `<p style="color: red;">Vista no encontrada: ${vista}</p>`;
            return;
        }

        // Add cache-busting parameter for development
        const cacheBust = Date.now();
        const separator = ruta.includes('?') ? '&' : '?';
        const rutaConCacheBust = ruta + separator + '_cb=' + cacheBust;
        
        console.log(`🔄 Loading module: ${ruta} with cache-bust: ${cacheBust}`);

        const response = await fetch(rutaConCacheBust);
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

// Helper para que otros módulos (p.ej. audiovisual) creen una solicitud + items
// Uso: await window.createSolicitudFromExternal(solicitudData, itemsArray)
async function notifyDesktopDispatchRequestCreated(numeroSolicitud, area, tipo) {
    try {
        await window.supabaseClient.functions.invoke('send-push-notification', {
            body: {
                title: tipo === 'despacho_audiovisual' ? 'Nuevo despacho audiovisual' : 'Nueva solicitud de despacho',
                body: `${window.currentUser?.nombre || window.currentUser?.usuario || 'Usuario'} creó ${tipo === 'despacho_audiovisual' ? 'el despacho audiovisual' : 'la solicitud'} ${numeroSolicitud} para ${area}`,
                data: {
                    type: tipo,
                    numeroSolicitud,
                    area,
                    usuario: window.currentUser?.nombre || window.currentUser?.usuario || 'Usuario',
                    timestamp: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.warn('No se pudo enviar notificación push de logística:', error);
    }
}

async function generarIdSolicitudLogistica() {
    try {
        const { data: existingData, error: existingError } = await window.supabaseClient
            .from('solicitudes_logistica')
            .select('id')
            .like('id', 'SOL-%')
            .order('id', { ascending: false })
            .limit(1);

        let startNumber = 1;
        if (!existingError && existingData && existingData.length > 0) {
            const lastId = existingData[0].id;
            const match = /^SOL-(\d+)$/.exec(lastId);
            if (match) {
                startNumber = parseInt(match[1], 10) + 1;
            }
        }

        for (let attempt = 0; attempt < 100; attempt++) {
            const candidateId = `SOL-${String(startNumber + attempt).padStart(5, '0')}`;
            const { data: checkData, error: checkError } = await window.supabaseClient
                .from('solicitudes_logistica')
                .select('id')
                .eq('id', candidateId)
                .limit(1);

            if (checkError) continue;
            if (!checkData || checkData.length === 0) {
                return candidateId;
            }
        }

        return `SOL-${Date.now().toString().slice(-5)}`;
    } catch (error) {
        console.error('Error generando ID de solicitud logística:', error);
        return `SOL-${Date.now().toString().slice(-5)}`;
    }
}

window.generarIdSolicitudLogistica = generarIdSolicitudLogistica;

window.createSolicitudFromExternal = async function(solicitudData = {}, items = []) {
    try {
        if (!window.supabaseClient) throw new Error('supabaseClient no disponible');

        const idProvisto = Boolean(solicitudData.id);
        let id = solicitudData.id || null;
        let inserted = false;
        let lastError = null;

        for (let attempt = 0; attempt < 5; attempt++) {
            if (!id) {
                id = await generarIdSolicitudLogistica();
            }

            const payload = {
                id,
                tipo: solicitudData.tipo || 'despacho',
                estado: solicitudData.estado || 'pendiente_bodega',
                evento: solicitudData.evento || null,
                encargado_evento: solicitudData.encargado_evento || null,
                prioridad: solicitudData.prioridad || 'Normal',
                modo_ingreso: solicitudData.modo_ingreso || null,
                observaciones: solicitudData.observaciones || solicitudData.observacion || null,
                fecha_solicitud: solicitudData.fecha_solicitud || new Date().toISOString(),
                usuario_id: window.currentUser?.id || null
            };

            const { data: solInsert, error: solErr } = await window.supabaseClient
                .from('solicitudes_logistica')
                .insert(payload)
                .select('id')
                .single();

            if (!solErr) {
                id = solInsert?.id || id;
                inserted = true;
                break;
            }

            lastError = solErr;
            const duplicateKey = solErr.code === '23505' && /duplicate key value/i.test(solErr.message || '');
            if (duplicateKey && !idProvisto) {
                id = null;
                continue;
            }

            throw solErr;
        }

        if (!inserted) {
            throw lastError || new Error('No se pudo crear la solicitud logística.');
        }

        // Preparar items para insertar en items_solicitud_logistica
        const itemsParaInsertar = (items || []).map(it => ({
            solicitud_id: id,
            codigo_material: it.codigo || it.cod || it.code,
            nombre_material: it.nombre || it.nombre_material || it.name || null,
            cantidad_solicitada: Number(it.cantidad_solicitada || it.cantidad || it.qty || it.cant || 0) || 0,
            estado: it.estado || 'pendiente',
            observacion: it.observacion || it.observaciones || (it.__tipo === 'audiovisual' ? 'Audiovisual' : 'Consumibles'),
            medidas: it.medidas || it.dimensiones || null,
            color: it.color || null,
            usuario_id: window.currentUser?.id || null
        }));

        if (itemsParaInsertar.length > 0) {
            const { error: errItems } = await window.supabaseClient
                .from('items_solicitud_logistica')
                .insert(itemsParaInsertar);
            if (errItems) {
                // Intentar rollback: eliminar la solicitud recién creada (si la creamos)
                try {
                    await window.supabaseClient.from('solicitudes_logistica').delete().eq('id', id);
                } catch (e) {}
                throw errItems;
            }

            // Auditoría si existe la función
            try {
                if (window.logAuditoria) {
                    window.logAuditoria('INSERT', 'items_solicitud_logistica', null, itemsParaInsertar);
                }
            } catch (_) {}
        }

        await notifyDesktopDispatchRequestCreated(
            id,
            solicitudData.area || solicitudData.evento || 'Logistica',
            solicitudData.modo_ingreso === 'despacho_audiovisual' ? 'despacho_audiovisual' : 'solicitud_despacho'
        );

        return { success: true, solicitudId: id };
    } catch (err) {
        console.error('createSolicitudFromExternal error:', err);
        return { success: false, error: err };
    }
};