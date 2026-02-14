-- Crear tabla para solicitudes de mantenimiento
CREATE TABLE IF NOT EXISTS solicitudes_mantenimiento (
    id SERIAL PRIMARY KEY,
    numero_solicitud VARCHAR(50) UNIQUE NOT NULL,
    responsable VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para materiales consumidos en mantenimiento (con esquema completo de movimientos)
CREATE TABLE IF NOT EXISTS materiales_consumidos_mantenimiento (
    id bigserial not null,
    solicitud_id INTEGER REFERENCES solicitudes_mantenimiento(id) ON DELETE CASCADE,
    material_codigo text not null,
    material_nombre text null,
    bodega_principal text null default 'Principal'::text,
    bodega_secundaria text null default 'General'::text,
    ubicacion_codigo text null,
    ubicacion_nombre text null,
    tipo_movimiento text null,
    cantidad numeric null,
    signo integer null,
    referencia_documento text null,
    referencia_tipo text null,
    responsable text null,
    fecha_movimiento date null,
    observaciones text null,
    estado text null,
    material_nombre_base text null,
    material_nombre_numero text null,
    catalogo_id bigint null,
    precio numeric null default 0,
    fecha_compra date null,
    created_at timestamp with time zone null default now(),
    usuario_id uuid null,
    constraint materiales_consumidos_mantenimiento_pkey primary key (id)
);

-- Crear tabla para materiales en mantenimiento (el material a reparar, con esquema completo de movimientos)
CREATE TABLE IF NOT EXISTS materiales_mantenimiento (
    id bigserial not null,
    solicitud_id INTEGER REFERENCES solicitudes_mantenimiento(id) ON DELETE CASCADE,
    material_codigo text not null,
    material_nombre text null,
    bodega_principal text null default 'Principal'::text,
    bodega_secundaria text null default 'General'::text,
    ubicacion_codigo text null,
    ubicacion_nombre text null,
    tipo_movimiento text null,
    cantidad numeric null,
    signo integer null,
    referencia_documento text null,
    referencia_tipo text null,
    responsable text null,
    fecha_movimiento date null,
    observaciones text null,
    estado text null,
    material_nombre_base text null,
    material_nombre_numero text null,
    catalogo_id bigint null,
    precio numeric null default 0,
    fecha_compra date null,
    mano_obra numeric null default 0,
    created_at timestamp with time zone null default now(),
    usuario_id uuid null,
    constraint materiales_mantenimiento_pkey primary key (id)
);