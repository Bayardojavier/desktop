-- Crear tabla para materiales dañados
CREATE TABLE IF NOT EXISTS materiales_danados (
    id SERIAL PRIMARY KEY,
    material_codigo TEXT NOT NULL,
    material_nombre TEXT,
    cantidad INTEGER NOT NULL,
    bodega_principal TEXT,
    bodega_secundaria TEXT,
    ubicacion_codigo TEXT,
    ubicacion_nombre TEXT,
    numero_despacho TEXT,
    evento TEXT,
    encargado_evento TEXT,
    fecha_despacho DATE,
    fecha_devolucion DATE,
    responsable_devolucion TEXT,
    observacion TEXT,
    observacion_detalle TEXT,
    estado_proceso TEXT DEFAULT 'pendiente_reparacion',
    fecha_proceso DATE,
    notas_proceso TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para materiales faltantes
CREATE TABLE IF NOT EXISTS materiales_faltantes (
    id SERIAL PRIMARY KEY,
    material_codigo TEXT NOT NULL,
    material_nombre TEXT,
    cantidad_faltante INTEGER NOT NULL,
    cantidad_despachada INTEGER NOT NULL,
    bodega_principal TEXT,
    bodega_secundaria TEXT,
    ubicacion_codigo TEXT,
    ubicacion_nombre TEXT,
    numero_despacho TEXT,
    evento TEXT,
    encargado_evento TEXT,
    fecha_despacho DATE,
    fecha_devolucion DATE,
    responsable_devolucion TEXT,
    observacion TEXT,
    observacion_detalle TEXT,
    estado_proceso TEXT DEFAULT 'pendiente_investigacion',
    fecha_proceso DATE,
    notas_proceso TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_materiales_danados_codigo ON materiales_danados(material_codigo);
CREATE INDEX IF NOT EXISTS idx_materiales_danados_despacho ON materiales_danados(numero_despacho);
CREATE INDEX IF NOT EXISTS idx_materiales_faltantes_codigo ON materiales_faltantes(material_codigo);
CREATE INDEX IF NOT EXISTS idx_materiales_faltantes_despacho ON materiales_faltantes(numero_despacho);