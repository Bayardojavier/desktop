-- Script seguro para actualizar tabla recetas_materiales
-- Versión simplificada y más robusta

-- Paso 1: Crear backup
CREATE TABLE IF NOT EXISTS public.recetas_materiales_backup AS
SELECT * FROM public.recetas_materiales;

-- Paso 2: Agregar nuevas columnas a la tabla existente (si no existen)
ALTER TABLE public.recetas_materiales
ADD COLUMN IF NOT EXISTS material_nombre text,
ADD COLUMN IF NOT EXISTS bodega_principal text,
ADD COLUMN IF NOT EXISTS bodega_secundaria text[],
ADD COLUMN IF NOT EXISTS creado_en timestamptz DEFAULT now();

-- Paso 3: Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_recetas_materiales_receta ON public.recetas_materiales USING btree (receta_id);
CREATE INDEX IF NOT EXISTS idx_recetas_materiales_material ON public.recetas_materiales USING btree (material_codigo);
CREATE INDEX IF NOT EXISTS idx_recetas_materiales_creado_en ON public.recetas_materiales USING btree (creado_en);

-- Paso 4: Función para actualizar información de materiales
CREATE OR REPLACE FUNCTION public.actualizar_materiales_info()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count integer := 0;
    mat_record record;
BEGIN
    -- Actualizar materiales del catálogo audiovisual
    UPDATE public.recetas_materiales rm
    SET
        material_nombre = ca.nombre,
        bodega_principal = ca.bodega_principal,
        bodega_secundaria = CASE
            WHEN ca.bodega_secundaria IS NOT NULL AND ca.bodega_secundaria != ''
            THEN string_to_array(ca.bodega_secundaria, ',')
            ELSE ARRAY[]::text[]
        END
    FROM catalogo_audiovisual ca
    WHERE rm.material_codigo = ca.codigo
    AND (rm.material_nombre IS NULL OR rm.material_nombre = rm.material_codigo);

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Actualizar materiales del catálogo de hierros
    UPDATE public.recetas_materiales rm
    SET
        material_nombre = ch.nombre,
        bodega_principal = ch.bodega_principal,
        bodega_secundaria = CASE
            WHEN ch.bodega_secundaria IS NOT NULL AND ch.bodega_secundaria != ''
            THEN string_to_array(ch.bodega_secundaria, ',')
            ELSE ARRAY[]::text[]
        END
    FROM catalogo_hierros ch
    WHERE rm.material_codigo = ch.codigo
    AND (rm.material_nombre IS NULL OR rm.material_nombre = rm.material_codigo);

    -- Actualizar materiales del catálogo de consumibles
    UPDATE public.recetas_materiales rm
    SET
        material_nombre = cc.nombre,
        bodega_principal = cc.bodega_principal,
        bodega_secundaria = CASE
            WHEN cc.bodega_secundaria IS NOT NULL AND cc.bodega_secundaria != ''
            THEN string_to_array(cc.bodega_secundaria, ',')
            ELSE ARRAY[]::text[]
        END
    FROM catalogo_consumibles cc
    WHERE rm.material_codigo = cc.codigo
    AND (rm.material_nombre IS NULL OR rm.material_nombre = rm.material_codigo);

    -- Actualizar plantillas (buscar por ID ya que material_codigo contiene el ID de la plantilla)
    UPDATE public.recetas_materiales rm
    SET
        material_nombre = rpm.nombre_plantilla,
        bodega_principal = CASE
            WHEN array_length(rpm.catalogos, 1) > 0
            THEN rpm.catalogos[1]  -- Tomar primera bodega del array catalogos
            ELSE ''
        END,
        bodega_secundaria = COALESCE(rpm.bodega_secundaria, ARRAY[]::text[])
    FROM recetas_plantillas_materiales rpm
    WHERE rpm.id::text = rm.material_codigo
    AND (rm.material_nombre IS NULL OR rm.material_nombre = rm.material_codigo OR rm.material_nombre LIKE 'PLANTILLA_%');

    -- Para los que aún no tienen nombre, usar el código como nombre
    UPDATE public.recetas_materiales
    SET material_nombre = material_codigo
    WHERE material_nombre IS NULL;

    RETURN updated_count;
END;
$$;

-- Paso 5: Ejecutar la actualización
SELECT public.actualizar_materiales_info() as registros_actualizados;

-- Paso 6: Verificar resultados
SELECT
    COUNT(*) as total_materiales,
    COUNT(CASE WHEN material_nombre IS NOT NULL AND material_nombre != material_codigo THEN 1 END) as con_info_completa,
    COUNT(CASE WHEN material_nombre IS NULL OR material_nombre = material_codigo THEN 1 END) as sin_info_completa
FROM public.recetas_materiales;

-- Paso 7: Comentarios
COMMENT ON TABLE public.recetas_materiales IS 'Materiales de las recetas con información completa del catálogo';
COMMENT ON COLUMN public.recetas_materiales.material_nombre IS 'Nombre descriptivo del material';
COMMENT ON COLUMN public.recetas_materiales.bodega_principal IS 'Bodega principal donde se encuentra el material';
COMMENT ON COLUMN public.recetas_materiales.bodega_secundaria IS 'Bodegas secundarias donde puede estar el material';