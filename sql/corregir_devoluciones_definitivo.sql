-- Script SQL DEFINITIVO para corregir devoluciones existentes
-- Copia TODOS los campos faltantes desde movimientos de despacho relacionados

DO $$
DECLARE
    dev_record RECORD;
    desp_record RECORD;
BEGIN
    RAISE NOTICE 'Iniciando corrección de devoluciones...';

    -- Procesar audiovisual
    FOR dev_record IN
        SELECT id, referencia_documento, material_codigo
        FROM movimientos_bodega_audiovisual
        WHERE tipo_movimiento = 'devolucion'
    LOOP
        -- Buscar el movimiento de despacho correspondiente
        SELECT
            estado, material_nombre_base, material_nombre_numero, precio,
            fecha_compra, usuario_id, ubicacion_codigo, ubicacion_nombre
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
                precio = COALESCE(NULLIF(precio, 0), desp_record.precio, 0),
                fecha_compra = COALESCE(fecha_compra, desp_record.fecha_compra),
                usuario_id = COALESCE(usuario_id, desp_record.usuario_id),
                ubicacion_codigo = COALESCE(ubicacion_codigo, desp_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, desp_record.ubicacion_nombre)
            WHERE id = dev_record.id;

            RAISE NOTICE 'Actualizada devolución audiovisual ID: %, material: %', dev_record.id, dev_record.material_codigo;
        ELSE
            RAISE NOTICE 'No se encontró despacho para devolución audiovisual ID: %, ref: %', dev_record.id, dev_record.referencia_documento;
        END IF;
    END LOOP;

    -- Procesar hierros
    FOR dev_record IN
        SELECT id, referencia_documento, material_codigo
        FROM movimientos_bodega_hierros
        WHERE tipo_movimiento = 'devolucion'
    LOOP
        SELECT
            estado, material_nombre_base, material_nombre_numero, precio,
            fecha_compra, usuario_id, ubicacion_codigo, ubicacion_nombre
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
                precio = COALESCE(NULLIF(precio, 0), desp_record.precio, 0),
                fecha_compra = COALESCE(fecha_compra, desp_record.fecha_compra),
                usuario_id = COALESCE(usuario_id, desp_record.usuario_id),
                ubicacion_codigo = COALESCE(ubicacion_codigo, desp_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, desp_record.ubicacion_nombre)
            WHERE id = dev_record.id;

            RAISE NOTICE 'Actualizada devolución hierros ID: %, material: %', dev_record.id, dev_record.material_codigo;
        ELSE
            RAISE NOTICE 'No se encontró despacho para devolución hierros ID: %, ref: %', dev_record.id, dev_record.referencia_documento;
        END IF;
    END LOOP;

    -- Procesar consumibles
    FOR dev_record IN
        SELECT id, referencia_documento, material_codigo
        FROM movimientos_bodega_consumibles
        WHERE tipo_movimiento = 'devolucion'
    LOOP
        SELECT
            estado, material_nombre_base, material_nombre_numero, precio,
            fecha_compra, usuario_id, ubicacion_codigo, ubicacion_nombre
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
                precio = COALESCE(NULLIF(precio, 0), desp_record.precio, 0),
                fecha_compra = COALESCE(fecha_compra, desp_record.fecha_compra),
                usuario_id = COALESCE(usuario_id, desp_record.usuario_id),
                ubicacion_codigo = COALESCE(ubicacion_codigo, desp_record.ubicacion_codigo),
                ubicacion_nombre = COALESCE(ubicacion_nombre, desp_record.ubicacion_nombre)
            WHERE id = dev_record.id;

            RAISE NOTICE 'Actualizada devolución consumibles ID: %, material: %', dev_record.id, dev_record.material_codigo;
        ELSE
            RAISE NOTICE 'No se encontró despacho para devolución consumibles ID: %, ref: %', dev_record.id, dev_record.referencia_documento;
        END IF;
    END LOOP;

    RAISE NOTICE 'Corrección de devoluciones completada exitosamente';
END $$;

-- Verificación final
SELECT
    'Resumen de corrección:' as info,
    (SELECT COUNT(*) FROM movimientos_bodega_audiovisual WHERE tipo_movimiento = 'devolucion') as audiovisual_devoluciones,
    (SELECT COUNT(*) FROM movimientos_bodega_hierros WHERE tipo_movimiento = 'devolucion') as hierros_devoluciones,
    (SELECT COUNT(*) FROM movimientos_bodega_consumibles WHERE tipo_movimiento = 'devolucion') as consumibles_devoluciones;

-- Mostrar algunas devoluciones corregidas como ejemplo
SELECT
    'Ejemplos de devoluciones corregidas:' as info,
    mbh.tipo_movimiento,
    mbh.material_codigo,
    mbh.ubicacion_nombre,
    mbh.estado,
    mbh.precio,
    mbh.usuario_id
FROM movimientos_bodega_hierros mbh
WHERE tipo_movimiento = 'devolucion'
  AND ubicacion_nombre IS NOT NULL
LIMIT 3;