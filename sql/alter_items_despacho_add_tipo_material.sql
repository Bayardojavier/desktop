-- Agregar columna tipo_material a items_despacho_logistica
-- Para clasificar si el material es rentable (debe devolverse) o consumible

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'items_despacho_logistica'
        AND column_name = 'tipo_material'
    ) THEN
        ALTER TABLE public.items_despacho_logistica
        ADD COLUMN tipo_material TEXT DEFAULT 'consumible';
    END IF;
END $$;