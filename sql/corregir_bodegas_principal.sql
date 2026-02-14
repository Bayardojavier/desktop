-- Script SQL para corregir bodegas "Principal" por valores correctos basados en tipo de material
-- Este script actualiza los movimientos de devolución que se crearon con bodega_principal = 'Principal'

-- 1. Actualizar movimientos de audiovisual
UPDATE movimientos_bodega_audiovisual
SET bodega_principal = 'Audiovisual'
WHERE bodega_principal = 'Principal'
  AND UPPER(material_codigo) LIKE 'AUDI-%';

-- 2. Actualizar movimientos de hierros
UPDATE movimientos_bodega_hierros
SET bodega_principal = 'Hierros'
WHERE bodega_principal = 'Principal'
  AND UPPER(material_codigo) LIKE 'HIER-%';

-- 3. Actualizar movimientos de consumibles (todos los demás)
UPDATE movimientos_bodega_consumibles
SET bodega_principal = 'Consumibles'
WHERE bodega_principal = 'Principal'
  AND UPPER(material_codigo) NOT LIKE 'AUDI-%'
  AND UPPER(material_codigo) NOT LIKE 'HIER-%';

-- Verificación: Mostrar cuántos registros se actualizaron
SELECT
  'movimientos_bodega_audiovisual' as tabla,
  COUNT(*) as registros_actualizados
FROM movimientos_bodega_audiovisual
WHERE bodega_principal IN ('Audiovisual', 'Hierros', 'Consumibles')
  AND tipo_movimiento = 'devolucion'

UNION ALL

SELECT
  'movimientos_bodega_hierros' as tabla,
  COUNT(*) as registros_actualizados
FROM movimientos_bodega_hierros
WHERE bodega_principal IN ('Audiovisual', 'Hierros', 'Consumibles')
  AND tipo_movimiento = 'devolucion'

UNION ALL

SELECT
  'movimientos_bodega_consumibles' as tabla,
  COUNT(*) as registros_actualizados
FROM movimientos_bodega_consumibles
WHERE bodega_principal IN ('Audiovisual', 'Hierros', 'Consumibles')
  AND tipo_movimiento = 'devolucion'

UNION ALL

-- Verificar que ya no queden registros con 'Principal'
SELECT
  'REGISTROS_CON_PRINCIPAL_RESTANTES' as tabla,
  COUNT(*) as registros_actualizados
FROM (
  SELECT id FROM movimientos_bodega_audiovisual WHERE bodega_principal = 'Principal'
  UNION ALL
  SELECT id FROM movimientos_bodega_hierros WHERE bodega_principal = 'Principal'
  UNION ALL
  SELECT id FROM movimientos_bodega_consumibles WHERE bodega_principal = 'Principal'
) as restantes;

-- Mostrar algunos ejemplos de los cambios realizados
SELECT
  'EJEMPLOS DE CAMBIOS' as tipo,
  tabla,
  material_codigo,
  bodega_principal,
  tipo_movimiento,
  fecha_movimiento
FROM (
  SELECT
    'movimientos_bodega_audiovisual' as tabla,
    material_codigo,
    bodega_principal,
    tipo_movimiento,
    fecha_movimiento
  FROM movimientos_bodega_audiovisual
  WHERE bodega_principal IN ('Audiovisual', 'Hierros', 'Consumibles')
    AND tipo_movimiento = 'devolucion'

  UNION ALL

  SELECT
    'movimientos_bodega_hierros' as tabla,
    material_codigo,
    bodega_principal,
    tipo_movimiento,
    fecha_movimiento
  FROM movimientos_bodega_hierros
  WHERE bodega_principal IN ('Audiovisual', 'Hierros', 'Consumibles')
    AND tipo_movimiento = 'devolucion'

  UNION ALL

  SELECT
    'movimientos_bodega_consumibles' as tabla,
    material_codigo,
    bodega_principal,
    tipo_movimiento,
    fecha_movimiento
  FROM movimientos_bodega_consumibles
  WHERE bodega_principal IN ('Audiovisual', 'Hierros', 'Consumibles')
    AND tipo_movimiento = 'devolucion'
) as ejemplos
ORDER BY fecha_movimiento DESC
LIMIT 10;