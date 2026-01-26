-- Función para mantener actualizada la información de materiales en recetas_materiales
-- Esta función se puede llamar periódicamente o después de cambios en el catálogo

CREATE OR REPLACE FUNCTION public.actualizar_info_recetas_materiales()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    mat_record RECORD;
BEGIN
    -- Actualizar información para materiales normales del catálogo
    FOR mat_record IN
        SELECT DISTINCT rm.material_codigo
        FROM public.recetas_materiales rm
        WHERE rm.material_nombre IS NULL OR rm.material_nombre = rm.material_codigo
    LOOP
        -- Buscar en catálogos
        UPDATE public.recetas_materiales
        SET
            material_nombre = c.nombre,
            bodega_principal = c.bodega_principal,
            bodega_secundaria = CASE
                WHEN c.bodega_secundaria IS NOT NULL AND c.bodega_secundaria != ''
                THEN string_to_array(c.bodega_secundaria, ',')
                ELSE ARRAY[]::text[]
            END
        FROM (
            SELECT nombre, bodega_principal, bodega_secundaria, codigo
            FROM catalogo_audiovisual
            UNION ALL
            SELECT nombre, bodega_principal, bodega_secundaria, codigo
            FROM catalogo_hierros
            UNION ALL
            SELECT nombre, bodega_principal, bodega_secundaria, codigo
            FROM catalogo_consumibles
        ) c
        WHERE recetas_materiales.material_codigo = c.codigo
        AND recetas_materiales.material_codigo = mat_record.material_codigo
        AND (recetas_materiales.material_nombre IS NULL OR recetas_materiales.material_nombre = recetas_materiales.material_codigo);

        -- Buscar en plantillas si no se encontró en catálogos
        UPDATE public.recetas_materiales
        SET
            material_nombre = rpm.nombre_plantilla,
            bodega_principal = CASE
                WHEN array_length(rpm.catalogos, 1) > 0
                THEN rpm.catalogos[1]  -- Tomar primera bodega del array catalogos
                ELSE ''
            END,
            bodega_secundaria = COALESCE(rpm.bodega_secundaria, ARRAY[]::text[])
        FROM recetas_plantillas_materiales rpm
        WHERE rpm.id::text = recetas_materiales.material_codigo
        AND recetas_materiales.material_codigo = mat_record.material_codigo
        AND (recetas_materiales.material_nombre IS NULL OR recetas_materiales.material_nombre = recetas_materiales.material_codigo OR recetas_materiales.material_nombre LIKE 'PLANTILLA_%');
    END LOOP;

    RAISE NOTICE 'Información de materiales actualizada en recetas_materiales';
END;
$$;

-- Crear un trigger para actualizar automáticamente cuando se inserten nuevos materiales
CREATE OR REPLACE FUNCTION public.trigger_actualizar_material_info()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Buscar información del material recién insertado
    UPDATE public.recetas_materiales
    SET
        material_nombre = c.nombre,
        bodega_principal = c.bodega_principal,
        bodega_secundaria = CASE
            WHEN c.bodega_secundaria IS NOT NULL AND c.bodega_secundaria != ''
            THEN string_to_array(c.bodega_secundaria, ',')
            ELSE ARRAY[]::text[]
        END
    FROM (
        SELECT nombre, bodega_principal, bodega_secundaria, codigo
        FROM catalogo_audiovisual
        UNION ALL
        SELECT nombre, bodega_principal, bodega_secundaria, codigo
        FROM catalogo_hierros
        UNION ALL
        SELECT nombre, bodega_principal, bodega_secundaria, codigo
        FROM catalogo_consumibles
    ) c
    WHERE recetas_materiales.material_codigo = c.codigo
    AND recetas_materiales.id = NEW.id
    AND (recetas_materiales.material_nombre IS NULL OR recetas_materiales.material_nombre = recetas_materiales.material_codigo);

    -- Si no se encontró en catálogos, buscar en plantillas
    IF NOT FOUND THEN
        UPDATE public.recetas_materiales
        SET
            material_nombre = rpm.nombre_plantilla,
            bodega_principal = CASE
                WHEN array_length(rpm.catalogos, 1) > 0
                THEN rpm.catalogos[1]  -- Tomar primera bodega del array catalogos
                ELSE ''
            END,
            bodega_secundaria = COALESCE(rpm.bodega_secundaria, ARRAY[]::text[])
        FROM recetas_plantillas_materiales rpm
        WHERE rpm.id::text = recetas_materiales.material_codigo
        AND recetas_materiales.id = NEW.id
        AND (recetas_materiales.material_nombre IS NULL OR recetas_materiales.material_nombre = recetas_materiales.material_codigo OR recetas_materiales.material_nombre LIKE 'PLANTILLA_%');
    END IF;

    RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_material_info ON public.recetas_materiales;
CREATE TRIGGER trigger_actualizar_material_info
    AFTER INSERT ON public.recetas_materiales
    FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_material_info();

-- Ejecutar la función de actualización inicial
SELECT public.actualizar_info_recetas_materiales();

-- Verificar resultados
SELECT
    COUNT(*) as total_materiales,
    COUNT(CASE WHEN material_nombre IS NOT NULL AND material_nombre != material_codigo THEN 1 END) as con_nombre_completo,
    COUNT(CASE WHEN bodega_principal IS NOT NULL AND bodega_principal != '' THEN 1 END) as con_bodega
FROM public.recetas_materiales;