-- Script SQL para corregir devoluciones existentes con campos nulos
-- Actualiza los movimientos de devolución que no tienen los campos completos

-- Función para actualizar ubicaciones faltantes
DO $$
DECLARE
    dev_record RECORD;
    ubic_record RECORD;
BEGIN
    -- Procesar audiovisual
    FOR dev_record IN
        SELECT id, material_codigo
        FROM movimientos_bodega_audiovisual
        WHERE tipo_movimiento = 'devolucion'
          AND (ubicacion_codigo IS NULL OR ubicacion_nombre IS NULL)
    LOOP
        -- Buscar ubicación en movimientos anteriores (ingresos, altas, etc.)
        SELECT ubicacion_codigo, ubicacion_nombre
        INTO ubic_record
        FROM movimientos_bodega_audiovisual
        WHERE material_codigo = dev_record.material_codigo
          AND ubicacion_codigo IS NOT NULL
          AND ubicacion_nombre IS NOT NULL
          AND created_at < (SELECT created_at FROM movimientos_bodega_audiovisual WHERE id = dev_record.id)
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            UPDATE movimientos_bodega_audiovisual
            SET ubicacion_codigo = COALESCE(ubicacion_codigo, ubic_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, ubic_record.ubicacion_nombre)
            WHERE id = dev_record.id;
        END IF;
    END LOOP;

    -- Procesar hierros
    FOR dev_record IN
        SELECT id, material_codigo
        FROM movimientos_bodega_hierros
        WHERE tipo_movimiento = 'devolucion'
          AND (ubicacion_codigo IS NULL OR ubicacion_nombre IS NULL)
    LOOP
        SELECT ubicacion_codigo, ubicacion_nombre
        INTO ubic_record
        FROM movimientos_bodega_hierros
        WHERE material_codigo = dev_record.material_codigo
          AND ubicacion_codigo IS NOT NULL
          AND ubicacion_nombre IS NOT NULL
          AND created_at < (SELECT created_at FROM movimientos_bodega_hierros WHERE id = dev_record.id)
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            UPDATE movimientos_bodega_hierros
            SET ubicacion_codigo = COALESCE(ubicacion_codigo, ubic_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, ubic_record.ubicacion_nombre)
            WHERE id = dev_record.id;
        END IF;
    END LOOP;

    -- Procesar consumibles
    FOR dev_record IN
        SELECT id, material_codigo
        FROM movimientos_bodega_consumibles
        WHERE tipo_movimiento = 'devolucion'
          AND (ubicacion_codigo IS NULL OR ubicacion_nombre IS NULL)
    LOOP
        SELECT ubicacion_codigo, ubicacion_nombre
        INTO ubic_record
        FROM movimientos_bodega_consumibles
        WHERE material_codigo = dev_record.material_codigo
          AND ubicacion_codigo IS NOT NULL
          AND ubicacion_nombre IS NOT NULL
          AND created_at < (SELECT created_at FROM movimientos_bodega_consumibles WHERE id = dev_record.id)
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            UPDATE movimientos_bodega_consumibles
            SET ubicacion_codigo = COALESCE(ubicacion_codigo, ubic_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, ubic_record.ubicacion_nombre)
            WHERE id = dev_record.id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Corrección de ubicaciones en devoluciones completada';
END $$;

-- 1. Corregir movimientos de audiovisual (otros campos)
UPDATE movimientos_bodega_audiovisual
SET
  estado = COALESCE(estado, 'completado'),
  precio = COALESCE(precio, 0)
WHERE tipo_movimiento = 'devolucion'
  AND (estado IS NULL OR precio IS NULL OR precio = 0);

-- 2. Corregir movimientos de hierros (otros campos)
UPDATE movimientos_bodega_hierros
SET
  estado = COALESCE(estado, 'completado'),
  precio = COALESCE(precio, 0)
WHERE tipo_movimiento = 'devolucion'
  AND (estado IS NULL OR precio IS NULL OR precio = 0);

-- 3. Corregir movimientos de consumibles (otros campos)
UPDATE movimientos_bodega_consumibles
SET
  estado = COALESCE(estado, 'completado'),
  precio = COALESCE(precio, 0)
WHERE tipo_movimiento = 'devolucion'
  AND (estado IS NULL OR precio IS NULL OR precio = 0);

-- Verificación: Mostrar estadísticas de corrección
SELECT
  'movimientos_bodega_audiovisual' as tabla,
  COUNT(*) as devoluciones_corregidas,
  SUM(CASE WHEN ubicacion_nombre IS NOT NULL THEN 1 ELSE 0 END) as con_ubicacion
FROM movimientos_bodega_audiovisual
WHERE tipo_movimiento = 'devolucion'

UNION ALL

SELECT
  'movimientos_bodega_hierros' as tabla,
  COUNT(*) as devoluciones_corregidas,
  SUM(CASE WHEN ubicacion_nombre IS NOT NULL THEN 1 ELSE 0 END) as con_ubicacion
FROM movimientos_bodega_hierros
WHERE tipo_movimiento = 'devolucion'

UNION ALL

SELECT
  'movimientos_bodega_consumibles' as tabla,
  COUNT(*) as devoluciones_corregidas,
  SUM(CASE WHEN ubicacion_nombre IS NOT NULL THEN 1 ELSE 0 END) as con_ubicacion
FROM movimientos_bodega_consumibles
WHERE tipo_movimiento = 'devolucion';