-- Tablas para el módulo de solicitudes de logística

-- Tabla principal de solicitudes
CREATE TABLE IF NOT EXISTS public.solicitudes_logistica (
  id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  estado TEXT NOT NULL,
  evento TEXT NOT NULL,
  encargado_evento TEXT,
  prioridad TEXT DEFAULT 'Normal',
  modo_ingreso TEXT DEFAULT 'receta',
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_procesamiento TIMESTAMP WITH TIME ZONE,
  procesado_por TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT solicitudes_logistica_pkey PRIMARY KEY (id),
  CONSTRAINT solicitudes_logistica_estado_check CHECK (
    estado IN ('pendiente_bodega', 'en_proceso', 'completada', 'rechazada')
  ),
  CONSTRAINT solicitudes_logistica_tipo_check CHECK (
    tipo IN ('despacho', 'devolucion', 'mantenimiento')
  )
);

-- Tabla de items de solicitudes
CREATE TABLE IF NOT EXISTS public.items_solicitud_logistica (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id TEXT NOT NULL REFERENCES public.solicitudes_logistica(id) ON DELETE CASCADE,
  codigo_material TEXT NOT NULL,
  nombre_material TEXT NOT NULL,
  cantidad_solicitada NUMERIC(10,2) NOT NULL,
  cantidad_despachada NUMERIC(10,2) DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  observacion TEXT,
  medidas TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT items_solicitud_logistica_cantidad_check CHECK (cantidad_solicitada > 0),
  CONSTRAINT items_solicitud_logistica_estado_check CHECK (
    estado IN ('pendiente', 'parcial', 'completado', 'rechazado')
  )
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_solicitudes_logistica_estado ON public.solicitudes_logistica(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_logistica_evento ON public.solicitudes_logistica(evento);
CREATE INDEX IF NOT EXISTS idx_solicitudes_logistica_fecha ON public.solicitudes_logistica(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_items_solicitud_solicitud_id ON public.items_solicitud_logistica(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_items_solicitud_codigo ON public.items_solicitud_logistica(codigo_material);
CREATE INDEX IF NOT EXISTS idx_items_solicitud_estado ON public.items_solicitud_logistica(estado);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.solicitudes_logistica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_solicitud_logistica ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitudes_logistica
DROP POLICY IF EXISTS "solicitudes_logistica_select" ON public.solicitudes_logistica;
DROP POLICY IF EXISTS "solicitudes_logistica_insert" ON public.solicitudes_logistica;
DROP POLICY IF EXISTS "solicitudes_logistica_update" ON public.solicitudes_logistica;

CREATE POLICY "solicitudes_logistica_select" ON public.solicitudes_logistica
  FOR SELECT USING (true);

CREATE POLICY "solicitudes_logistica_insert" ON public.solicitudes_logistica
  FOR INSERT WITH CHECK (true);

CREATE POLICY "solicitudes_logistica_update" ON public.solicitudes_logistica
  FOR UPDATE USING (true);

-- Políticas para items_solicitud_logistica
DROP POLICY IF EXISTS "items_solicitud_logistica_select" ON public.items_solicitud_logistica;
DROP POLICY IF EXISTS "items_solicitud_logistica_insert" ON public.items_solicitud_logistica;
DROP POLICY IF EXISTS "items_solicitud_logistica_update" ON public.items_solicitud_logistica;

CREATE POLICY "items_solicitud_logistica_select" ON public.items_solicitud_logistica
  FOR SELECT USING (true);

CREATE POLICY "items_solicitud_logistica_insert" ON public.items_solicitud_logistica
  FOR INSERT WITH CHECK (true);

CREATE POLICY "items_solicitud_logistica_update" ON public.items_solicitud_logistica
  FOR UPDATE USING (true);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_solicitudes_logistica_updated_at ON public.solicitudes_logistica;
DROP TRIGGER IF EXISTS update_items_solicitud_logistica_updated_at ON public.items_solicitud_logistica;

CREATE TRIGGER update_solicitudes_logistica_updated_at
  BEFORE UPDATE ON public.solicitudes_logistica
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_solicitud_logistica_updated_at
  BEFORE UPDATE ON public.items_solicitud_logistica
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();