-- Agregar columna bodega_secundaria a la tabla recetas_plantillas_materiales
-- Para permitir búsqueda también por bodega secundaria en las plantillas

ALTER TABLE public.recetas_plantillas_materiales
ADD COLUMN bodega_secundaria text[] DEFAULT array[]::text[];

-- Comentario para documentar la nueva columna
COMMENT ON COLUMN public.recetas_plantillas_materiales.bodega_secundaria IS 'Bodegas secundarias donde se puede encontrar esta plantilla/material';