-- Script SQL avanzado para corregir devoluciones existentes
-- Copia los campos faltantes desde los movimientos de despacho originales

-- Función temporal para actualizar devoluciones basadas en despachos
DO $$
DECLARE
    dev_record RECORD;
    desp_record RECORD;
BEGIN
    -- Procesar audiovisual
    FOR dev_record IN
        SELECT id, referencia_documento, material_codigo
        FROM movimientos_bodega_audiovisual
        WHERE tipo_movimiento = 'devolucion'
          AND (estado IS NULL OR material_nombre_base IS NULL OR material_nombre_numero IS NULL OR precio IS NULL OR fecha_compra IS NULL OR usuario_id IS NULL)
    LOOP
        -- Buscar el movimiento de despacho correspondiente
        SELECT estado, material_nombre_base, material_nombre_numero, precio, fecha_compra, usuario_id
        INTO desp_record
        FROM movimientos_bodega_audiovisual
        WHERE referencia_documento = dev_record.referencia_documento
          AND material_codigo = dev_record.material_codigo
          AND tipo_movimiento = 'despacho'
        LIMIT 1;

        -- Actualizar la devolución si se encontró el despacho
        IF FOUND THEN
            UPDATE movimientos_bodega_audiovisual
            SET
                estado = COALESCE(estado, desp_record.estado, 'completado'),
                material_nombre_base = COALESCE(material_nombre_base, desp_record.material_nombre_base),
                material_nombre_numero = COALESCE(material_nombre_numero, desp_record.material_nombre_numero),
                precio = COALESCE(precio, desp_record.precio, 0),
                fecha_compra = COALESCE(fecha_compra, desp_record.fecha_compra),
                usuario_id = COALESCE(usuario_id, desp_record.usuario_id),
                ubicacion_codigo = COALESCE(ubicacion_codigo, desp_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, desp_record.ubicacion_nombre)
            WHERE id = dev_record.id;
        END IF;
    END LOOP;

    -- Procesar hierros
    FOR dev_record IN
        SELECT id, referencia_documento, material_codigo
        FROM movimientos_bodega_hierros
        WHERE tipo_movimiento = 'devolucion'
          AND (estado IS NULL OR material_nombre_base IS NULL OR material_nombre_numero IS NULL OR precio IS NULL OR fecha_compra IS NULL OR usuario_id IS NULL)
    LOOP
        SELECT estado, material_nombre_base, material_nombre_numero, precio, fecha_compra, usuario_id
        INTO desp_record
        FROM movimientos_bodega_hierros
        WHERE referencia_documento = dev_record.referencia_documento
          AND material_codigo = dev_record.material_codigo
          AND tipo_movimiento = 'despacho'
        LIMIT 1;

        IF FOUND THEN
            UPDATE movimientos_bodega_hierros
            SET
                estado = COALESCE(estado, desp_record.estado, 'completado'),
                material_nombre_base = COALESCE(material_nombre_base, desp_record.material_nombre_base),
                material_nombre_numero = COALESCE(material_nombre_numero, desp_record.material_nombre_numero),
                precio = COALESCE(precio, desp_record.precio, 0),
                fecha_compra = COALESCE(fecha_compra, desp_record.fecha_compra),
                usuario_id = COALESCE(usuario_id, desp_record.usuario_id),
                ubicacion_codigo = COALESCE(ubicacion_codigo, desp_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, desp_record.ubicacion_nombre)
            WHERE id = dev_record.id;
        END IF;
    END LOOP;

    -- Procesar consumibles
    FOR dev_record IN
        SELECT id, referencia_documento, material_codigo
        FROM movimientos_bodega_consumibles
        WHERE tipo_movimiento = 'devolucion'
          AND (estado IS NULL OR material_nombre_base IS NULL OR material_nombre_numero IS NULL OR precio IS NULL OR fecha_compra IS NULL OR usuario_id IS NULL)
    LOOP
        SELECT estado, material_nombre_base, material_nombre_numero, precio, fecha_compra, usuario_id
        INTO desp_record
        FROM movimientos_bodega_consumibles
        WHERE referencia_documento = dev_record.referencia_documento
          AND material_codigo = dev_record.material_codigo
          AND tipo_movimiento = 'despacho'
        LIMIT 1;

        IF FOUND THEN
            UPDATE movimientos_bodega_consumibles
            SET
                estado = COALESCE(estado, desp_record.estado, 'completado'),
                material_nombre_base = COALESCE(material_nombre_base, desp_record.material_nombre_base),
                material_nombre_numero = COALESCE(material_nombre_numero, desp_record.material_nombre_numero),
                precio = COALESCE(precio, desp_record.precio, 0),
                fecha_compra = COALESCE(fecha_compra, desp_record.fecha_compra),
                usuario_id = COALESCE(usuario_id, desp_record.usuario_id),
                ubicacion_codigo = COALESCE(ubicacion_codigo, desp_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, desp_record.ubicacion_nombre)
            WHERE id = dev_record.id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Corrección de devoluciones completada';
END $$;

-- Verificación final
SELECT
  'movimientos_bodega_audiovisual' as tabla,
  COUNT(*) as total_devoluciones,
  SUM(CASE WHEN estado IS NOT NULL THEN 1 ELSE 0 END) as con_estado,
  SUM(CASE WHEN precio IS NOT NULL THEN 1 ELSE 0 END) as con_precio,
  SUM(CASE WHEN ubicacion_nombre IS NOT NULL THEN 1 ELSE 0 END) as con_ubicacion
FROM movimientos_bodega_audiovisual
WHERE tipo_movimiento = 'devolucion'

UNION ALL

SELECT
  'movimientos_bodega_hierros' as tabla,
  COUNT(*) as total_devoluciones,
  SUM(CASE WHEN estado IS NOT NULL THEN 1 ELSE 0 END) as con_estado,
  SUM(CASE WHEN precio IS NOT NULL THEN 1 ELSE 0 END) as con_precio,
  SUM(CASE WHEN ubicacion_nombre IS NOT NULL THEN 1 ELSE 0 END) as con_ubicacion
FROM movimientos_bodega_hierros
WHERE tipo_movimiento = 'devolucion'

UNION ALL

SELECT
  'movimientos_bodega_consumibles' as tabla,
  COUNT(*) as total_devoluciones,
  SUM(CASE WHEN estado IS NOT NULL THEN 1 ELSE 0 END) as con_estado,
  SUM(CASE WHEN precio IS NOT NULL THEN 1 ELSE 0 END) as con_precio,
  SUM(CASE WHEN ubicacion_nombre IS NOT NULL THEN 1 ELSE 0 END) as con_ubicacion
FROM movimientos_bodega_consumibles
WHERE tipo_movimiento = 'devolucion';