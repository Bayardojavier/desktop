// Script de prueba para verificar la corrección de logAuditoria
// Copiar y pegar en la consola del navegador

console.log('🧪 Probando corrección de logAuditoria...');

// Función para probar diferentes tipos de IDs
async function testLogAuditoriaTipos() {
    const testCases = [
        {
            name: 'UUID válido',
            params: ['INSERT', 'test_table', '550e8400-e29b-41d4-a716-446655440000', { test: 'uuid' }]
        },
        {
            name: 'ID numérico (movimiento)',
            params: ['INSERT', 'movimientos_bodega_consumibles', 123, { test: 'numeric' }]
        },
        {
            name: 'ID null',
            params: ['INSERT', 'test_table', null, { test: 'null' }]
        },
        {
            name: 'String no UUID',
            params: ['INSERT', 'test_table', 'not-a-uuid', { test: 'string' }]
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n🧪 Probando: ${testCase.name}`);
        try {
            await window.logAuditoria(...testCase.params);
            console.log(`✅ ${testCase.name}: Completado sin errores`);
        } catch (error) {
            console.error(`❌ ${testCase.name}: Error -`, error);
        }
    }
}

// Ejecutar pruebas
testLogAuditoriaTipos();