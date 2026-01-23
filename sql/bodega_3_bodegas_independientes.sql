-- bodega_3_bodegas_con_precio.sql
-- Objetivo: 3 bodegas realmente independientes con TABLAS separadas:
--   - Bodega Audiovisual        -> public.catalogo_audiovisual / public.movimientos_bodega_audiovisual
--   - Bodega Hierros (Estruct.) -> public.catalogo_hierros     / public.movimientos_bodega_hierros
--   - Bodega Herramientas/Cons. -> public.catalogo_consumibles / public.movimientos_bodega_consumibles
--
-- Nota:
-- - Estas tablas se crean con un esquema mínimo basado en lo que usa el formulario Agregar.
-- - Si tienes más pantallas que esperan columnas extras, habrá que expandir el esquema o adaptar esas pantallas.

begin;

-- =========================
-- Catálogo (3 tablas)
-- =========================
create table if not exists public.catalogo_audiovisual (
  codigo text primary key,
  nombre text not null,
  bodega_principal text,
  bodega_secundaria text,
  tipo_uso text,
  tipo_material text,
  color text,
  unidad_medida text,
  dimensiones jsonb,
  es_hechizo boolean default false,
  marca text,
  modelo text,
  foto_url text,
  fecha_creacion timestamptz default now(),
  bodega_principal_id bigint,
  bodega_secundaria_id bigint,
  campos_personalizados jsonb,
  es_contenedor boolean default false
);

alter table public.catalogo_audiovisual add column if not exists precio numeric default 0;
alter table public.catalogo_audiovisual add column if not exists fecha_compra date;

create table if not exists public.catalogo_hierros (
  codigo text primary key,
  nombre text not null,
  bodega_principal text,
  bodega_secundaria text,
  tipo_uso text,
  tipo_material text,
  color text,
  unidad_medida text,
  dimensiones jsonb,
  es_hechizo boolean default false,
  marca text,
  modelo text,
  foto_url text,
  fecha_creacion timestamptz default now(),
  bodega_principal_id bigint,
  bodega_secundaria_id bigint,
  campos_personalizados jsonb,
  es_contenedor boolean default false
);

alter table public.catalogo_hierros add column if not exists precio numeric default 0;
alter table public.catalogo_hierros add column if not exists fecha_compra date;

create table if not exists public.catalogo_consumibles (
  codigo text primary key,
  nombre text not null,
  bodega_principal text,
  bodega_secundaria text,
  tipo_uso text,
  tipo_material text,
  color text,
  unidad_medida text,
  dimensiones jsonb,
  es_hechizo boolean default false,
  marca text,
  modelo text,
  foto_url text,
  fecha_creacion timestamptz default now(),
  bodega_principal_id bigint,
  bodega_secundaria_id bigint,
  campos_personalizados jsonb,
  es_contenedor boolean default false
);

alter table public.catalogo_consumibles add column if not exists precio numeric default 0;
alter table public.catalogo_consumibles add column if not exists fecha_compra date;

create index if not exists idx_cat_audiovisual_principal on public.catalogo_audiovisual (bodega_principal);
create index if not exists idx_cat_hierros_principal on public.catalogo_hierros (bodega_principal);
create index if not exists idx_cat_consumibles_principal on public.catalogo_consumibles (bodega_principal);

-- =========================
-- Movimientos (3 tablas)
-- =========================
create table if not exists public.movimientos_bodega_audiovisual (
  id bigserial primary key,
  material_codigo text not null,
  material_nombre text,
  bodega_principal text,
  bodega_secundaria text,
  ubicacion_codigo text,
  ubicacion_nombre text,
  tipo_movimiento text,
  cantidad numeric,
  signo int,
  referencia_documento text,
  referencia_tipo text,
  responsable text,
  fecha_movimiento date,
  observaciones text,
  estado text
);

alter table public.movimientos_bodega_audiovisual add column if not exists precio numeric default 0;
alter table public.movimientos_bodega_audiovisual add column if not exists fecha_compra date;

create table if not exists public.movimientos_bodega_hierros (
  id bigserial primary key,
  material_codigo text not null,
  material_nombre text,
  bodega_principal text,
  bodega_secundaria text,
  ubicacion_codigo text,
  ubicacion_nombre text,
  tipo_movimiento text,
  cantidad numeric,
  signo int,
  referencia_documento text,
  referencia_tipo text,
  responsable text,
  fecha_movimiento date,
  observaciones text,
  estado text
);

alter table public.movimientos_bodega_hierros add column if not exists precio numeric default 0;
alter table public.movimientos_bodega_hierros add column if not exists fecha_compra date;

create table if not exists public.movimientos_bodega_consumibles (
  id bigserial primary key,
  material_codigo text not null,
  material_nombre text,
  bodega_principal text,
  bodega_secundaria text,
  ubicacion_codigo text,
  ubicacion_nombre text,
  tipo_movimiento text,
  cantidad numeric,
  signo int,
  referencia_documento text,
  referencia_tipo text,
  responsable text,
  fecha_movimiento date,
  observaciones text,
  estado text
);

alter table public.movimientos_bodega_consumibles add column if not exists precio numeric default 0;
alter table public.movimientos_bodega_consumibles add column if not exists fecha_compra date;

create index if not exists idx_mov_audiovisual_codigo on public.movimientos_bodega_audiovisual (material_codigo);
create index if not exists idx_mov_hierros_codigo on public.movimientos_bodega_hierros (material_codigo);
create index if not exists idx_mov_consumibles_codigo on public.movimientos_bodega_consumibles (material_codigo);

commit;
