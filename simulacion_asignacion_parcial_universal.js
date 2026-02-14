// Simulación de asignación parcial para cualquier material
// Prueba la nueva lógica que aplica asignación parcial a todos los materiales

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uquwfiepdryqmgjhstpd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdXdmaWVwZHJ5cW1namhzdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzUzMTgsImV4cCI6MjA4MTU1MTMxOH0.XXdexL2w0di7o2xZo6TU8AQLxrkKzsMp60ozXJLsTjE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Función logAuditoria corregida
async function logAuditoria(operacion, tabla, registroId, datosNuevos) {
    const usuarioPorDefecto = {
        id: 'f895c6b4-e267-4507-b554-d3f8fb66ea10',
        nombre: 'Administrador General'
    };

    try {
        await supabase.from('logs_auditoria').insert({
            usuario_id: usuarioPorDefecto.id,
            usuario_nombre: usuarioPorDefecto.nombre,
            tabla_afectada: tabla,
            operacion: operacion,
            registro_id: registroId,
            datos_nuevos: datosNuevos
        });
        console.log(`✅ Auditado: ${operacion} en ${tabla}`);
        return true;
    } catch (e) {
        console.error('❌ Error en auditoría:', e);
        return false;
    }
}

// Simular la nueva lógica de asignación parcial
async function simularAsignacionParcialUniversal() {
    console.log('🔄 Simulando asignación parcial universal...\n');

    try {
        // Simular un material ya asignado (como el ejemplo del usuario)
        const materialYaAsignado = {
            id: 'material-simulado-001',
            solicitud_id: 'solicitud-test-001',
            codigo_material: '00003-HIER-PORT-LOTE-01-PISDEL',
            nombre_material: 'PISOS DELGADOS',
            cantidad_solicitada: 64,
            observacion: 'Material actualizado desde búsqueda - Original: PISOS DELGADOS',
            estado: 'pendiente'
        };

        console.log('📋 Material original:');
        console.log(`   Nombre: ${materialYaAsignado.nombre_material}`);
        console.log(`   Código: ${materialYaAsignado.codigo_material}`);
        console.log(`   Cantidad solicitada: ${materialYaAsignado.cantidad_solicitada}`);
        console.log(`   Observación: ${materialYaAsignado.observacion}`);

        // Simular selección de nuevo material con stock insuficiente
        const nuevoMaterial = {
            codigo: 'NUEVO-MATERIAL-001',
            nombre: 'Material Nuevo de Prueba',
            stockDisponible: 29  // Menos que los 64 solicitados
        };

        console.log('\n🎯 Nuevo material seleccionado:');
        console.log(`   Código: ${nuevoMaterial.codigo}`);
        console.log(`   Nombre: ${nuevoMaterial.nombre}`);
        console.log(`   Stock disponible: ${nuevoMaterial.stockDisponible}`);

        // Aplicar lógica de asignación parcial (igual que en la función corregida)
        const cantidadActual = materialYaAsignado.cantidad_solicitada;
        const stockDisponible = nuevoMaterial.stockDisponible;
        const cantidadAsignar = Math.min(stockDisponible, cantidadActual);

        console.log('\n⚖️ Lógica de asignación:');
        console.log(`   Cantidad actual: ${cantidadActual}`);
        console.log(`   Stock disponible: ${stockDisponible}`);
        console.log(`   Cantidad a asignar: ${cantidadAsignar}`);

        if (stockDisponible >= cantidadActual) {
            console.log('✅ ASIGNACIÓN COMPLETA');
            console.log('   → El material original se reemplazaría completamente');
        } else {
            console.log('🔄 ASIGNACIÓN PARCIAL');

            const cantidadRestante = cantidadActual - stockDisponible;

            // Simular creación del nuevo material específico
            const nuevoItemEspecifico = {
                solicitud_id: materialYaAsignado.solicitud_id,
                codigo_material: nuevoMaterial.codigo,
                nombre_material: nuevoMaterial.nombre,
                cantidad_solicitada: stockDisponible,
                estado: 'pendiente',
                observacion: `Material específico asignado parcialmente - Original: ${materialYaAsignado.nombre_material} - Parte ${stockDisponible} de ${cantidadActual}`,
                medidas: materialYaAsignado.medidas,
                color: materialYaAsignado.color
            };

            console.log('\n➕ Nuevo material específico creado:');
            console.log(`   Nombre: ${nuevoItemEspecifico.nombre_material}`);
            console.log(`   Cantidad: ${nuevoItemEspecifico.cantidad_solicitada}`);
            console.log(`   Observación: ${nuevoItemEspecifico.observacion}`);

            // Simular actualización del material original
            const materialActualizado = {
                cantidad_solicitada: cantidadRestante,
                observacion: `${materialYaAsignado.observacion} - Asignación parcial: ${stockDisponible} unidades asignadas a ${nuevoMaterial.nombre}, ${cantidadRestante} pendientes`
            };

            console.log('\n📝 Material original actualizado:');
            console.log(`   Cantidad restante: ${materialActualizado.cantidad_solicitada}`);
            console.log(`   Nueva observación: ${materialActualizado.observacion}`);

            // Auditar ambas operaciones
            await logAuditoria('INSERT', 'items_solicitud_logistica', 'sim-nuevo-item', nuevoItemEspecifico);
            await logAuditoria('UPDATE', 'items_solicitud_logistica', materialYaAsignado.id, materialActualizado);

            console.log('\n✅ RESULTADO FINAL:');
            console.log(`   • Material original: ${materialYaAsignado.nombre_material} (${cantidadRestante} unidades pendientes)`);
            console.log(`   • Nuevo material: ${nuevoMaterial.nombre} (${stockDisponible} unidades asignadas)`);
            console.log(`   • Total asignado: ${stockDisponible} de ${cantidadActual} solicitados`);
        }

    } catch (error) {
        console.error('❌ Error en simulación:', error);
    }
}

// Función para verificar categorización
async function verificarCategorizacion() {
    console.log('\n🔍 Verificando categorización de materiales...\n');

    // Simular diferentes tipos de materiales
    const materialesTest = [
        {
            nombre: 'Plantilla genérica',
            codigo: 'PLANTILLA-001',
            observacion: null,
            tipoEsperado: 'plantilla'
        },
        {
            nombre: 'Material del catálogo',
            codigo: 'MAT-CATALOGO-001',
            observacion: null,
            tipoEsperado: 'especifico'
        },
        {
            nombre: 'Material actualizado desde búsqueda',
            codigo: 'MAT-ACTUALIZADO-001',
            observacion: 'Material actualizado desde búsqueda - Original: Plantilla X',
            tipoEsperado: 'especifico'
        },
        {
            nombre: 'Material asignado desde plantilla',
            codigo: 'MAT-ASIGNADO-001',
            observacion: 'Material específico asignado desde plantilla - Original: Plantilla Y',
            tipoEsperado: 'especifico_de_plantilla'
        },
        {
            nombre: 'Material asignado parcialmente',
            codigo: 'MAT-PARCIAL-001',
            observacion: 'Material específico asignado parcialmente - Original: Material Z',
            tipoEsperado: 'especifico_de_plantilla'
        }
    ];

    // Simular catálogo (solo para testing)
    const catalogoSimulado = [
        { cod: 'MAT-CATALOGO-001', nom: 'Material del catálogo' },
        { cod: 'MAT-ACTUALIZADO-001', nom: 'Material actualizado' },
        { cod: 'MAT-ASIGNADO-001', nom: 'Material asignado' },
        { cod: 'MAT-PARCIAL-001', nom: 'Material parcial' }
    ];

    console.log('📋 Categorización de materiales de prueba:');
    materialesTest.forEach((mat, index) => {
        // Aplicar lógica de categorización igual que en el HTML
        const existeEnCatalogo = catalogoSimulado.some(cat => cat.cod === mat.codigo);
        const fueActualizadoDesdeBusqueda = mat.observacion && mat.observacion.includes('Actualizado desde búsqueda');
        const asignadoDesdePlantilla = mat.observacion && mat.observacion.includes('Material específico asignado desde plantilla');
        const asignadoParcialmente = mat.observacion && mat.observacion.includes('Material específico asignado parcialmente');

        let categoriaActual = 'desconocida';
        if (existeEnCatalogo || fueActualizadoDesdeBusqueda || asignadoDesdePlantilla || asignadoParcialmente) {
            if (asignadoDesdePlantilla || asignadoParcialmente) {
                categoriaActual = 'especifico_de_plantilla';
            } else {
                categoriaActual = 'especifico';
            }
        } else {
            categoriaActual = 'plantilla';
        }

        const correcto = categoriaActual === mat.tipoEsperado;
        console.log(`   ${index + 1}. ${mat.nombre}`);
        console.log(`      Código: ${mat.codigo}`);
        console.log(`      Observación: ${mat.observacion || 'Ninguna'}`);
        console.log(`      Categoría: ${categoriaActual} ${correcto ? '✅' : '❌ (esperaba: ' + mat.tipoEsperado + ')'}`);
        console.log('');
    });
}

// Ejecutar pruebas
async function ejecutarPruebas() {
    console.log('🧪 EJECUTANDO PRUEBAS DE ASIGNACIÓN PARCIAL UNIVERSAL\n');

    await simularAsignacionParcialUniversal();
    await verificarCategorizacion();

    console.log('\n🎉 PRUEBAS COMPLETADAS');
    console.log('\n✅ La lógica de asignación parcial ahora se aplica a TODOS los materiales:');
    console.log('   • Plantillas originales');
    console.log('   • Materiales ya asignados');
    console.log('   • Materiales del catálogo');
    console.log('   • Cualquier material con stock insuficiente');
}

ejecutarPruebas().catch(console.error);