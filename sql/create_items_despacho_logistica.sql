-- Crear tabla para items de despachos de logística
DROP TABLE IF EXISTS public.items_despacho_logistica;

CREATE TABLE IF NOT EXISTS public.items_despacho_logistica (
    id BIGSERIAL PRIMARY KEY,
    despacho_id UUID NOT NULL REFERENCES despachos_logistica(id) ON DELETE CASCADE,
    codigo_material TEXT NOT NULL,
    nombre_material TEXT,
    cantidad_despachada NUMERIC NOT NULL DEFAULT 0,
    estado TEXT DEFAULT 'despachado',
    observacion TEXT,
    medidas TEXT,
    color TEXT,
    bodega_principal TEXT,
    bodega_secundaria TEXT,
    precio NUMERIC DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
DROP INDEX IF EXISTS idx_items_despacho_despacho_id;
DROP INDEX IF EXISTS idx_items_despacho_codigo;
DROP INDEX IF EXISTS idx_items_despacho_estado;

CREATE INDEX IF NOT EXISTS idx_items_despacho_despacho_id ON public.items_despacho_logistica USING BTREE (despacho_id);
CREATE INDEX IF NOT EXISTS idx_items_despacho_codigo ON public.items_despacho_logistica USING BTREE (codigo_material);
CREATE INDEX IF NOT EXISTS idx_items_despacho_estado ON public.items_despacho_logistica USING BTREE (estado);

-- Trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_items_despacho_logistica_updated_at ON items_despacho_logistica;
DROP FUNCTION IF EXISTS update_items_despacho_logistica_updated_at();

CREATE OR REPLACE FUNCTION update_items_despacho_logistica_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_items_despacho_logistica_updated_at
    BEFORE UPDATE ON items_despacho_logistica
    FOR EACH ROW
    EXECUTE FUNCTION update_items_despacho_logistica_updated_at();