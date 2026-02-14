-- Limpiar y re-poblar recetas_plantillas_materiales desde cero
-- Ejecutar después de recrear los triggers

-- Paso 1: Limpiar tabla existente
TRUNCATE TABLE public.recetas_plantillas_materiales RESTART IDENTITY;

-- Paso 2: Re-poblar desde catalogo_hierros
INSERT INTO public.recetas_plantillas_materiales
  (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
SELECT
  TRIM(COALESCE(h.nombre_base, REGEXP_REPLACE(h.nombre, '\s+\d+\s*$', '')) ||
       CASE WHEN h.dimensiones IS NOT NULL THEN ' ' ||
         COALESCE(
           NULLIF(CONCAT_WS('x', h.dimensiones->>'ancho', h.dimensiones->>'largo', h.dimensiones->>'grosor'), ''),
           NULLIF(CONCAT_WS('x', h.dimensiones->>'diametro', h.dimensiones->>'largo'), ''),
           NULLIF(CONCAT_WS('x', h.dimensiones->>'alto', h.dimensiones->>'ancho', h.dimensiones->>'largo'), '')
         )
       ELSE '' END),
  'MATERIAL',
  h.dimensiones,
  ARRAY['HIERROS'],
  CASE WHEN h.bodega_secundaria IS NOT NULL THEN ARRAY[h.bodega_secundaria] ELSE ARRAY[]::TEXT[] END,
  'Re-poblado desde catálogo'
FROM public.catalogo_hierros h
WHERE h.tipo_alta = 'MATERIAL'
  AND (h.es_contenedor IS FALSE OR h.es_contenedor IS NULL)
  AND h.activo = TRUE;

-- Paso 3: Re-poblar desde catalogo_audiovisual
INSERT INTO public.recetas_plantillas_materiales
  (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
SELECT
  TRIM(COALESCE(a.nombre_base, REGEXP_REPLACE(a.nombre, '\s+\d+\s*$', '')) ||
       CASE WHEN a.dimensiones IS NOT NULL THEN ' ' ||
         COALESCE(
           NULLIF(CONCAT_WS('x', a.dimensiones->>'ancho', a.dimensiones->>'largo', a.dimensiones->>'grosor'), ''),
           NULLIF(CONCAT_WS('x', a.dimensiones->>'diametro', a.dimensiones->>'largo'), ''),
           NULLIF(CONCAT_WS('x', a.dimensiones->>'alto', a.dimensiones->>'ancho', a.dimensiones->>'largo'), '')
         )
       ELSE '' END),
  'MATERIAL',
  a.dimensiones,
  ARRAY['AUDIOVISUAL'],
  CASE WHEN a.bodega_secundaria IS NOT NULL THEN ARRAY[a.bodega_secundaria] ELSE ARRAY[]::TEXT[] END,
  'Re-poblado desde catálogo'
FROM public.catalogo_audiovisual a
WHERE a.tipo_alta = 'MATERIAL'
  AND (a.es_contenedor IS FALSE OR a.es_contenedor IS NULL)
  AND a.activo = TRUE;

-- Paso 4: Re-poblar desde catalogo_consumibles
INSERT INTO public.recetas_plantillas_materiales
  (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
SELECT
  TRIM(COALESCE(c.nombre_base, REGEXP_REPLACE(c.nombre, '\s+\d+\s*$', '')) ||
       CASE WHEN c.dimensiones IS NOT NULL THEN ' ' ||
         COALESCE(
           NULLIF(CONCAT_WS('x', c.dimensiones->>'ancho', c.dimensiones->>'largo', c.dimensiones->>'grosor'), ''),
           NULLIF(CONCAT_WS('x', c.dimensiones->>'diametro', c.dimensiones->>'largo'), ''),
           NULLIF(CONCAT_WS('x', c.dimensiones->>'alto', c.dimensiones->>'ancho', c.dimensiones->>'largo'), '')
         )
       ELSE '' END),
  'MATERIAL',
  c.dimensiones,
  ARRAY['CONSUMIBLES'],
  CASE WHEN c.bodega_secundaria IS NOT NULL THEN ARRAY[c.bodega_secundaria] ELSE ARRAY[]::TEXT[] END,
  'Re-poblado desde catálogo'
FROM public.catalogo_consumibles c
WHERE COALESCE(
  NULLIF(TRIM(c.campos_personalizados->>'tipo_alta'), ''),
  NULLIF(TRIM(c.campos_personalizados->>'Tipo de alta'), ''),
  NULLIF(TRIM(c.campos_personalizados->>'Tipo Alta'), ''),
  NULLIF(TRIM(c.campos_personalizados->>'Tipo de Alta'), '')
) = 'MATERIAL'
  AND (c.es_contenedor IS FALSE OR c.es_contenedor IS NULL)
  AND c.activo = TRUE;

-- Verificar resultados
SELECT
  COUNT(*) as total_plantillas,
  COUNT(CASE WHEN catalogos = ARRAY['HIERROS'] THEN 1 END) as hierros,
  COUNT(CASE WHEN catalogos = ARRAY['AUDIOVISUAL'] THEN 1 END) as audiovisual,
  COUNT(CASE WHEN catalogos = ARRAY['CONSUMIBLES'] THEN 1 END) as consumibles
FROM public.recetas_plantillas_materiales;

-- Mostrar algunas plantillas de ejemplo
SELECT nombre_plantilla, catalogos, bodega_secundaria
FROM public.recetas_plantillas_materiales
ORDER BY creado_en DESC
LIMIT 10;