-- Recrear triggers para recetas_plantillas_materiales
-- Ejecutar después de borrar y re-alimentar datos del catálogo

-- Primero, eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS trig_copiar_plantilla_hierros ON public.catalogo_hierros;
DROP TRIGGER IF EXISTS trig_copiar_plantilla_audiovisual ON public.catalogo_audiovisual;
DROP TRIGGER IF EXISTS trig_copiar_plantilla_consumibles ON public.catalogo_consumibles;

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS public.fn_copiar_plantilla_hierros();
DROP FUNCTION IF EXISTS public.fn_copiar_plantilla_audiovisual();
DROP FUNCTION IF EXISTS public.fn_copiar_plantilla_consumibles();

-- Recrear función para Hierros
CREATE OR REPLACE FUNCTION public.fn_copiar_plantilla_hierros()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  plantilla_nombre TEXT;
  dims_sig TEXT;
BEGIN
  -- Solo para MATERIAL (no contenedores)
  IF NEW.tipo_alta = 'MATERIAL' AND (NEW.es_contenedor IS FALSE OR NEW.es_contenedor IS NULL) THEN
    -- Calcular nombre de plantilla: nombre_base + dimensiones
    dims_sig := NULLIF(
      COALESCE(
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'ancho',''), NULLIF(NEW.dimensiones->>'largo',''), NULLIF(NEW.dimensiones->>'grosor','')), ''),
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'diametro',''), NULLIF(NEW.dimensiones->>'largo','')), ''),
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'alto',''), NULLIF(NEW.dimensiones->>'ancho',''), NULLIF(NEW.dimensiones->>'largo','')), '')
      ),
      ''
    );

    plantilla_nombre := TRIM(COALESCE(NEW.nombre_base, REGEXP_REPLACE(NEW.nombre, '\s+\d+\s*$', '')) ||
                           CASE WHEN dims_sig IS NOT NULL THEN ' ' || dims_sig ELSE '' END);

    -- Insertar si no existe
    INSERT INTO public.recetas_plantillas_materiales
      (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
    VALUES
      (plantilla_nombre, 'MATERIAL', NEW.dimensiones, ARRAY['HIERROS'],
       CASE WHEN NEW.bodega_secundaria IS NOT NULL THEN ARRAY[NEW.bodega_secundaria] ELSE ARRAY[]::TEXT[] END,
       'Auto-copiado de catálogo')
    ON CONFLICT (nombre_plantilla) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recrear función para Audiovisual
CREATE OR REPLACE FUNCTION public.fn_copiar_plantilla_audiovisual()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  plantilla_nombre TEXT;
  dims_sig TEXT;
BEGIN
  -- Solo para MATERIAL
  IF NEW.tipo_alta = 'MATERIAL' AND (NEW.es_contenedor IS FALSE OR NEW.es_contenedor IS NULL) THEN
    -- Calcular nombre de plantilla: nombre_base + dimensiones
    dims_sig := NULLIF(
      COALESCE(
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'ancho',''), NULLIF(NEW.dimensiones->>'largo',''), NULLIF(NEW.dimensiones->>'grosor','')), ''),
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'diametro',''), NULLIF(NEW.dimensiones->>'largo','')), ''),
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'alto',''), NULLIF(NEW.dimensiones->>'ancho',''), NULLIF(NEW.dimensiones->>'largo','')), '')
      ),
      ''
    );

    plantilla_nombre := TRIM(COALESCE(NEW.nombre_base, REGEXP_REPLACE(NEW.nombre, '\s+\d+\s*$', '')) ||
                           CASE WHEN dims_sig IS NOT NULL THEN ' ' || dims_sig ELSE '' END);

    -- Insertar si no existe
    INSERT INTO public.recetas_plantillas_materiales
      (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
    VALUES
      (plantilla_nombre, 'MATERIAL', NEW.dimensiones, ARRAY['AUDIOVISUAL'],
       CASE WHEN NEW.bodega_secundaria IS NOT NULL THEN ARRAY[NEW.bodega_secundaria] ELSE ARRAY[]::TEXT[] END,
       'Auto-copiado de catálogo')
    ON CONFLICT (nombre_plantilla) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recrear función para Consumibles
CREATE OR REPLACE FUNCTION public.fn_copiar_plantilla_consumibles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  plantilla_nombre TEXT;
  dims_sig TEXT;
  tipo_alta_val TEXT;
BEGIN
  -- Leer tipo_alta de campos_personalizados
  tipo_alta_val := COALESCE(
    NULLIF(TRIM(NEW.campos_personalizados->>'tipo_alta'), ''),
    NULLIF(TRIM(NEW.campos_personalizados->>'Tipo de alta'), ''),
    NULLIF(TRIM(NEW.campos_personalizados->>'Tipo Alta'), ''),
    NULLIF(TRIM(NEW.campos_personalizados->>'Tipo de Alta'), '')
  );

  -- Solo para MATERIAL
  IF tipo_alta_val = 'MATERIAL' AND (NEW.es_contenedor IS FALSE OR NEW.es_contenedor IS NULL) THEN
    -- Calcular nombre de plantilla: nombre_base + dimensiones
    dims_sig := NULLIF(
      COALESCE(
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'ancho',''), NULLIF(NEW.dimensiones->>'largo',''), NULLIF(NEW.dimensiones->>'grosor','')), ''),
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'diametro',''), NULLIF(NEW.dimensiones->>'largo','')), ''),
        NULLIF(CONCAT_WS('x', NULLIF(NEW.dimensiones->>'alto',''), NULLIF(NEW.dimensiones->>'ancho',''), NULLIF(NEW.dimensiones->>'largo','')), '')
      ),
      ''
    );

    plantilla_nombre := TRIM(COALESCE(NEW.nombre_base, REGEXP_REPLACE(NEW.nombre, '\s+\d+\s*$', '')) ||
                           CASE WHEN dims_sig IS NOT NULL THEN ' ' || dims_sig ELSE '' END);

    -- Insertar si no existe
    INSERT INTO public.recetas_plantillas_materiales
      (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
    VALUES
      (plantilla_nombre, 'MATERIAL', NEW.dimensiones, ARRAY['CONSUMIBLES'],
       CASE WHEN NEW.bodega_secundaria IS NOT NULL THEN ARRAY[NEW.bodega_secundaria] ELSE ARRAY[]::TEXT[] END,
       'Auto-copiado de catálogo')
    ON CONFLICT (nombre_plantilla) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recrear triggers
CREATE TRIGGER trig_copiar_plantilla_hierros
  AFTER INSERT ON public.catalogo_hierros
  FOR EACH ROW EXECUTE FUNCTION public.fn_copiar_plantilla_hierros();

CREATE TRIGGER trig_copiar_plantilla_audiovisual
  AFTER INSERT ON public.catalogo_audiovisual
  FOR EACH ROW EXECUTE FUNCTION public.fn_copiar_plantilla_audiovisual();

CREATE TRIGGER trig_copiar_plantilla_consumibles
  AFTER INSERT ON public.catalogo_consumibles
  FOR EACH ROW EXECUTE FUNCTION public.fn_copiar_plantilla_consumibles();

-- Verificar que los triggers están activos
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trig_copiar_plantilla%'
ORDER BY trigger_name;