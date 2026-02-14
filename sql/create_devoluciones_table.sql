-- Crear tabla para registrar devoluciones de logística
DROP TABLE IF EXISTS public.devoluciones;

CREATE TABLE IF NOT EXISTS public.devoluciones (
    id TEXT PRIMARY KEY, -- Formato: DEV-XXXX
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encargado_ingreso TEXT,
    numero_despacho TEXT, -- Puede ser un número o 'VARIOS' para eventos
    evento TEXT,
    estado TEXT DEFAULT 'completada',
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de items devueltos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
DROP INDEX IF EXISTS idx_devoluciones_fecha;
DROP INDEX IF EXISTS idx_devoluciones_numero_despacho;
DROP INDEX IF EXISTS idx_devoluciones_evento;
DROP INDEX IF EXISTS idx_devoluciones_estado;

CREATE INDEX IF NOT EXISTS idx_devoluciones_fecha ON public.devoluciones USING BTREE (fecha);
CREATE INDEX IF NOT EXISTS idx_devoluciones_numero_despacho ON public.devoluciones USING BTREE (numero_despacho);
CREATE INDEX IF NOT EXISTS idx_devoluciones_evento ON public.devoluciones USING BTREE (evento);
CREATE INDEX IF NOT EXISTS idx_devoluciones_estado ON public.devoluciones USING BTREE (estado);

-- Trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_devoluciones_updated_at ON devoluciones;
DROP FUNCTION IF EXISTS update_devoluciones_updated_at();

CREATE OR REPLACE FUNCTION update_devoluciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_devoluciones_updated_at
    BEFORE UPDATE ON devoluciones
    FOR EACH ROW
    EXECUTE FUNCTION update_devoluciones_updated_at();