-- Recrear tabla recetas_materiales con información adicional del catálogo
-- Primero hacer backup de los datos existentes
CREATE TABLE IF NOT EXISTS public.recetas_materiales_backup AS
SELECT * FROM public.recetas_materiales;

-- Recrear tabla con campos adicionales
DROP TABLE IF EXISTS public.recetas_materiales CASCADE;

CREATE TABLE public.recetas_materiales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receta_id uuid NOT NULL,
  material_codigo text NOT NULL,
  material_nombre text NULL, -- Nombre del material del catálogo
  bodega_principal text NULL, -- Bodega principal del material
  bodega_secundaria text[] NULL, -- Bodegas secundarias del material
  cantidad numeric NOT NULL,
  observacion text NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recetas_materiales_pkey PRIMARY KEY (id),
  CONSTRAINT recetas_materiales_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE CASCADE,
  CONSTRAINT recetas_materiales_cantidad_check CHECK ((cantidad > (0)::numeric))
) TABLESPACE pg_default;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_recetas_materiales_receta ON public.recetas_materiales USING btree (receta_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_recetas_materiales_material ON public.recetas_materiales USING btree (material_codigo) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_recetas_materiales_creado_en ON public.recetas_materiales USING btree (creado_en) TABLESPACE pg_default;

-- Función para rellenar los datos existentes
CREATE OR REPLACE FUNCTION public.rellenar_recetas_materiales_info()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    mat RECORD;
    grupo RECORD;
BEGIN
    -- Iterar sobre todos los registros existentes en el backup
    FOR rec IN SELECT * FROM public.recetas_materiales_backup
    LOOP
        -- Buscar información del material en los catálogos
        SELECT
            c.nombre,
            c.bodega_principal,
            c.bodega_secundaria
        INTO mat
        FROM (
            SELECT nombre, bodega_principal, bodega_secundaria, codigo FROM catalogo_audiovisual
            UNION ALL
            SELECT nombre, bodega_principal, bodega_secundaria, codigo FROM catalogo_hierros
            UNION ALL
            SELECT nombre, bodega_principal, bodega_secundaria, codigo FROM catalogo_consumibles
        ) c
        WHERE c.codigo = rec.material_codigo
        LIMIT 1;

        -- Si no se encontró en catálogos normales, buscar en plantillas
        IF mat.nombre IS NULL THEN
            SELECT
                nombre_plantilla as nombre,
                catalogos as bodega_principal,
                bodega_secundaria
            INTO grupo
            FROM recetas_plantillas_materiales
            WHERE 'PLANTILLA|' || id::text = rec.material_codigo
            LIMIT 1;
        END IF;

        -- Insertar el registro con la información completa
        INSERT INTO public.recetas_materiales (
            id,
            receta_id,
            material_codigo,
            material_nombre,
            bodega_principal,
            bodega_secundaria,
            cantidad,
            observacion,
            creado_en
        ) VALUES (
            rec.id,
            rec.receta_id,
            rec.material_codigo,
            COALESCE(NULLIF(mat.nombre, ''), NULLIF(grupo.nombre, ''), rec.material_codigo),
            COALESCE(NULLIF(mat.bodega_principal, ''), NULLIF(grupo.bodega_principal, ''), ''),
            COALESCE(mat.bodega_secundaria, grupo.bodega_secundaria, ARRAY[]::text[]),
            rec.cantidad,
            rec.observacion,
            COALESCE(rec.creado_en, now())
        );
    END LOOP;

    RAISE NOTICE 'Se han rellenado % registros en recetas_materiales', (SELECT COUNT(*) FROM public.recetas_materiales);
END;
$$;

-- Ejecutar la función para rellenar los datos
SELECT public.rellenar_recetas_materiales_info();

-- Verificar que los datos se hayan copiado correctamente
SELECT COUNT(*) as total_registros FROM public.recetas_materiales;
SELECT COUNT(*) as registros_backup FROM public.recetas_materiales_backup;

-- Comentarios en la tabla
COMMENT ON TABLE public.recetas_materiales IS 'Materiales de las recetas con información completa del catálogo';
COMMENT ON COLUMN public.recetas_materiales.material_nombre IS 'Nombre descriptivo del material';
COMMENT ON COLUMN public.recetas_materiales.bodega_principal IS 'Bodega principal donde se encuentra el material';
COMMENT ON COLUMN public.recetas_materiales.bodega_secundaria IS 'Bodegas secundarias donde puede estar el material';