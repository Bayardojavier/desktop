-- Agregar columna para rastrear cantidades devueltas en items de despacho
-- Esto permite saber cuánto de cada item ha sido devuelto

-- Agregar columna cantidad_devuelta si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'items_despacho_logistica'
        AND column_name = 'cantidad_devuelta'
    ) THEN
        ALTER TABLE public.items_despacho_logistica
        ADD COLUMN cantidad_devuelta NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Agregar columna fecha_devolucion si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'items_despacho_logistica'
        AND column_name = 'fecha_devolucion'
    ) THEN
        ALTER TABLE public.items_despacho_logistica
        ADD COLUMN fecha_devolucion TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Actualizar estado basado en cantidad devuelta
UPDATE public.items_despacho_logistica
SET estado = CASE
    WHEN cantidad_devuelta >= cantidad_despachada THEN 'devuelto'
    WHEN cantidad_devuelta > 0 THEN 'parcialmente_devuelto'
    ELSE 'despachado'
END
WHERE estado IS NOT NULL;