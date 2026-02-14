-- Script SQL simple para corregir bodegas "Principal" por valores correctos
-- Versión simplificada sin verificaciones

-- 1. Actualizar movimientos de audiovisual
UPDATE movimientos_bodega_audiovisual
SET bodega_principal = 'Audiovisual'
WHERE bodega_principal = 'Principal';

-- 2. Actualizar movimientos de hierros
UPDATE movimientos_bodega_hierros
SET bodega_principal = 'Hierros'
WHERE bodega_principal = 'Principal';

-- 3. Actualizar movimientos de consumibles
UPDATE movimientos_bodega_consumibles
SET bodega_principal = 'Consumibles'
WHERE bodega_principal = 'Principal';