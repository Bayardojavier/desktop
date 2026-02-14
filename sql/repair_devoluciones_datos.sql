-- Script para reparar movimientos de devolución con datos incorrectos (General/NULL)
-- IMPORTANTE: en los movimientos de devolución, referencia_documento = ID de la devolución (tabla devoluciones)
-- Por eso NO se puede extraer el despacho desde referencia_documento; se obtiene desde devoluciones.numero_despacho.

-- Regla de negocio:
-- - bodega_secundaria: viene del movimiento de despacho (si existe) o del catálogo (c.bodega_secundaria)
-- - ubicacion_nombre/ubicacion_codigo: viene del movimiento de despacho (si existe) o del catálogo (c.contenedor)

-- =========================
-- Audiovisual
-- =========================
WITH base AS (
    SELECT
        d.id,
        d.material_codigo,
        d.bodega_secundaria,
        d.ubicacion_codigo,
        d.ubicacion_nombre,
        COALESCE(
            dev.numero_despacho,
            substring(d.observaciones FROM 'Despacho\s*:?\s*([^\s\)]+)'),
            substring(d.referencia_documento FROM 'Despacho\s*:?\s*([^\s\)]+)')
        ) AS numero_despacho
    FROM movimientos_bodega_audiovisual d
    LEFT JOIN devoluciones dev
        ON dev.id::text = d.referencia_documento::text
        OR (
            d.referencia_documento ~ '^[0-9]+$'
            AND dev.id::text = regexp_replace(d.referencia_documento::text, '^0+', '')
        )
    WHERE d.tipo_movimiento = 'devolucion'
        AND (
            d.bodega_secundaria IS NULL OR trim(d.bodega_secundaria) ILIKE 'general'
            OR d.ubicacion_nombre IS NULL OR d.ubicacion_codigo IS NULL
        )
), fix AS (
    SELECT
        b.id,
        COALESCE(
            NULLIF(trim(m.bodega_secundaria), 'General'),
            c.bodega_secundaria,
            b.bodega_secundaria
        ) AS new_bodega_secundaria,
        COALESCE(m.ubicacion_codigo, c.contenedor, b.ubicacion_codigo) AS new_ubicacion_codigo,
        COALESCE(m.ubicacion_nombre, c.contenedor, b.ubicacion_nombre) AS new_ubicacion_nombre
    FROM base b
    LEFT JOIN movimientos_bodega_audiovisual m
        ON m.tipo_movimiento = 'despacho'
     AND m.material_codigo = b.material_codigo
     AND b.numero_despacho IS NOT NULL
     AND m.referencia_documento = b.numero_despacho
    LEFT JOIN catalogo_audiovisual c
        ON c.codigo = b.material_codigo
)
UPDATE movimientos_bodega_audiovisual d
SET
    bodega_secundaria = fix.new_bodega_secundaria,
    ubicacion_codigo = fix.new_ubicacion_codigo,
    ubicacion_nombre = fix.new_ubicacion_nombre
FROM fix
WHERE d.id = fix.id
    AND (
        d.bodega_secundaria IS DISTINCT FROM fix.new_bodega_secundaria
        OR d.ubicacion_codigo IS DISTINCT FROM fix.new_ubicacion_codigo
        OR d.ubicacion_nombre IS DISTINCT FROM fix.new_ubicacion_nombre
    );

-- =========================
-- Hierros
-- =========================
WITH base AS (
    SELECT
        d.id,
        d.material_codigo,
        d.bodega_secundaria,
        d.ubicacion_codigo,
        d.ubicacion_nombre,
        COALESCE(
            dev.numero_despacho,
            substring(d.observaciones FROM 'Despacho\s*:?\s*([^\s\)]+)'),
            substring(d.referencia_documento FROM 'Despacho\s*:?\s*([^\s\)]+)')
        ) AS numero_despacho
    FROM movimientos_bodega_hierros d
    LEFT JOIN devoluciones dev
        ON dev.id::text = d.referencia_documento::text
        OR (
            d.referencia_documento ~ '^[0-9]+$'
            AND dev.id::text = regexp_replace(d.referencia_documento::text, '^0+', '')
        )
    WHERE d.tipo_movimiento = 'devolucion'
        AND (
            d.bodega_secundaria IS NULL OR trim(d.bodega_secundaria) ILIKE 'general'
            OR d.ubicacion_nombre IS NULL OR d.ubicacion_codigo IS NULL
        )
), fix AS (
    SELECT
        b.id,
        COALESCE(
            NULLIF(trim(m.bodega_secundaria), 'General'),
            c.bodega_secundaria,
            b.bodega_secundaria
        ) AS new_bodega_secundaria,
        COALESCE(m.ubicacion_codigo, c.contenedor, b.ubicacion_codigo) AS new_ubicacion_codigo,
        COALESCE(m.ubicacion_nombre, c.contenedor, b.ubicacion_nombre) AS new_ubicacion_nombre
    FROM base b
    LEFT JOIN movimientos_bodega_hierros m
        ON m.tipo_movimiento = 'despacho'
     AND m.material_codigo = b.material_codigo
     AND b.numero_despacho IS NOT NULL
     AND m.referencia_documento = b.numero_despacho
    LEFT JOIN catalogo_hierros c
        ON c.codigo = b.material_codigo
)
UPDATE movimientos_bodega_hierros d
SET
    bodega_secundaria = fix.new_bodega_secundaria,
    ubicacion_codigo = fix.new_ubicacion_codigo,
    ubicacion_nombre = fix.new_ubicacion_nombre
FROM fix
WHERE d.id = fix.id
    AND (
        d.bodega_secundaria IS DISTINCT FROM fix.new_bodega_secundaria
        OR d.ubicacion_codigo IS DISTINCT FROM fix.new_ubicacion_codigo
        OR d.ubicacion_nombre IS DISTINCT FROM fix.new_ubicacion_nombre
    );

-- =========================
-- Consumibles
-- =========================
WITH base AS (
    SELECT
        d.id,
        d.material_codigo,
        d.bodega_secundaria,
        d.ubicacion_codigo,
        d.ubicacion_nombre,
        COALESCE(
            dev.numero_despacho,
            substring(d.observaciones FROM 'Despacho\s*:?\s*([^\s\)]+)'),
            substring(d.referencia_documento FROM 'Despacho\s*:?\s*([^\s\)]+)')
        ) AS numero_despacho
    FROM movimientos_bodega_consumibles d
    LEFT JOIN devoluciones dev
        ON dev.id::text = d.referencia_documento::text
        OR (
            d.referencia_documento ~ '^[0-9]+$'
            AND dev.id::text = regexp_replace(d.referencia_documento::text, '^0+', '')
        )
    WHERE d.tipo_movimiento = 'devolucion'
        AND (
            d.bodega_secundaria IS NULL OR trim(d.bodega_secundaria) ILIKE 'general'
            OR d.ubicacion_nombre IS NULL OR d.ubicacion_codigo IS NULL
        )
), fix AS (
    SELECT
        b.id,
        COALESCE(
            NULLIF(trim(m.bodega_secundaria), 'General'),
            c.bodega_secundaria,
            b.bodega_secundaria
        ) AS new_bodega_secundaria,
        COALESCE(m.ubicacion_codigo, c.contenedor, b.ubicacion_codigo) AS new_ubicacion_codigo,
        COALESCE(m.ubicacion_nombre, c.contenedor, b.ubicacion_nombre) AS new_ubicacion_nombre
    FROM base b
    LEFT JOIN movimientos_bodega_consumibles m
        ON m.tipo_movimiento = 'despacho'
     AND m.material_codigo = b.material_codigo
     AND b.numero_despacho IS NOT NULL
     AND m.referencia_documento = b.numero_despacho
    LEFT JOIN catalogo_consumibles c
        ON c.codigo = b.material_codigo
)
UPDATE movimientos_bodega_consumibles d
SET
    bodega_secundaria = fix.new_bodega_secundaria,
    ubicacion_codigo = fix.new_ubicacion_codigo,
    ubicacion_nombre = fix.new_ubicacion_nombre
FROM fix
WHERE d.id = fix.id
    AND (
        d.bodega_secundaria IS DISTINCT FROM fix.new_bodega_secundaria
        OR d.ubicacion_codigo IS DISTINCT FROM fix.new_ubicacion_codigo
        OR d.ubicacion_nombre IS DISTINCT FROM fix.new_ubicacion_nombre
    );

-- =====================================================================
-- REPARACIÓN TIPO "BUSCARV" (CATÁLOGO -> MOVIMIENTOS)
-- Objetivo: corregir datos existentes aunque no se encuentre el despacho.
-- - bodega_secundaria en movimientos = catalogo.bodega_secundaria (por codigo)
-- - ubicacion_* en movimientos = catalogo.contenedor (por codigo)
-- Solo toca devoluciones con datos erróneos (General/NULL o ubicación NULL).
-- =====================================================================

-- Audiovisual
UPDATE movimientos_bodega_audiovisual d
SET bodega_secundaria = c.bodega_secundaria
FROM catalogo_audiovisual c
WHERE d.tipo_movimiento = 'devolucion'
    AND c.codigo = d.material_codigo
    AND c.bodega_secundaria IS NOT NULL
    AND trim(c.bodega_secundaria) <> ''
    AND (d.bodega_secundaria IS NULL OR trim(d.bodega_secundaria) ILIKE 'general');

UPDATE movimientos_bodega_audiovisual d
SET
    ubicacion_codigo = COALESCE(d.ubicacion_codigo, c.contenedor),
    ubicacion_nombre = COALESCE(d.ubicacion_nombre, c.contenedor)
FROM catalogo_audiovisual c
WHERE d.tipo_movimiento = 'devolucion'
    AND c.codigo = d.material_codigo
    AND c.contenedor IS NOT NULL
    AND trim(c.contenedor) <> ''
    AND (d.ubicacion_codigo IS NULL OR d.ubicacion_nombre IS NULL);

-- Hierros
UPDATE movimientos_bodega_hierros d
SET bodega_secundaria = c.bodega_secundaria
FROM catalogo_hierros c
WHERE d.tipo_movimiento = 'devolucion'
    AND c.codigo = d.material_codigo
    AND c.bodega_secundaria IS NOT NULL
    AND trim(c.bodega_secundaria) <> ''
    AND (d.bodega_secundaria IS NULL OR trim(d.bodega_secundaria) ILIKE 'general');

UPDATE movimientos_bodega_hierros d
SET
    ubicacion_codigo = COALESCE(d.ubicacion_codigo, c.contenedor),
    ubicacion_nombre = COALESCE(d.ubicacion_nombre, c.contenedor)
FROM catalogo_hierros c
WHERE d.tipo_movimiento = 'devolucion'
    AND c.codigo = d.material_codigo
    AND c.contenedor IS NOT NULL
    AND trim(c.contenedor) <> ''
    AND (d.ubicacion_codigo IS NULL OR d.ubicacion_nombre IS NULL);

-- Consumibles
UPDATE movimientos_bodega_consumibles d
SET bodega_secundaria = c.bodega_secundaria
FROM catalogo_consumibles c
WHERE d.tipo_movimiento = 'devolucion'
    AND c.codigo = d.material_codigo
    AND c.bodega_secundaria IS NOT NULL
    AND trim(c.bodega_secundaria) <> ''
    AND (d.bodega_secundaria IS NULL OR trim(d.bodega_secundaria) ILIKE 'general');

UPDATE movimientos_bodega_consumibles d
SET
    ubicacion_codigo = COALESCE(d.ubicacion_codigo, c.contenedor),
    ubicacion_nombre = COALESCE(d.ubicacion_nombre, c.contenedor)
FROM catalogo_consumibles c
WHERE d.tipo_movimiento = 'devolucion'
    AND c.codigo = d.material_codigo
    AND c.contenedor IS NOT NULL
    AND trim(c.contenedor) <> ''
    AND (d.ubicacion_codigo IS NULL OR d.ubicacion_nombre IS NULL);