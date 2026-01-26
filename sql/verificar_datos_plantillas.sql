-- Verificar si existen las plantillas con esos IDs
SELECT id, nombre_plantilla, catalogos, bodega_secundaria
FROM recetas_plantillas_materiales
WHERE id IN ('dd51b987-13c3-42ea-a7bb-f257744d7a84', '97b11bc8-b524-4ffc-b58e-3a9f1006a5b8', '416a4340-572c-4df6-a6f8-615f422628e9');

-- Verificar los registros actuales en recetas_materiales
SELECT rm.material_codigo, rm.material_nombre, rm.bodega_principal, rm.bodega_secundaria
FROM recetas_materiales rm
WHERE rm.material_codigo IN ('dd51b987-13c3-42ea-a7bb-f257744d7a84', '97b11bc8-b524-4ffc-b58e-3a9f1006a5b8', '416a4340-572c-4df6-a6f8-615f422628e9');