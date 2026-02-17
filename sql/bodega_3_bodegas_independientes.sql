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

-- Agregar columna created_at si no existe
alter table public.movimientos_bodega_audiovisual add column if not exists created_at timestamp with time zone default now();
alter table public.movimientos_bodega_hierros add column if not exists created_at timestamp with time zone default now();
alter table public.movimientos_bodega_consumibles add column if not exists created_at timestamp with time zone default now();

commit;

-- Vistas de stock corregidas para incluir tipo_material y color, agrupadas por bodega
create or replace view public.stock_audiovisual as
select
  movimientos_bodega_audiovisual.material_codigo,
  movimientos_bodega_audiovisual.material_nombre,
  movimientos_bodega_audiovisual.bodega_principal,
  movimientos_bodega_audiovisual.bodega_secundaria,
  sum(movimientos_bodega_audiovisual.cantidad * movimientos_bodega_audiovisual.signo::numeric) as stock_actual,
  catalogo_audiovisual.tipo_material,
  catalogo_audiovisual.color
from movimientos_bodega_audiovisual
left join catalogo_audiovisual on catalogo_audiovisual.codigo = movimientos_bodega_audiovisual.material_codigo
group by movimientos_bodega_audiovisual.material_codigo, movimientos_bodega_audiovisual.material_nombre, movimientos_bodega_audiovisual.bodega_principal, movimientos_bodega_audiovisual.bodega_secundaria, catalogo_audiovisual.tipo_material, catalogo_audiovisual.color;

create or replace view public.stock_hierros as
select
  movimientos_bodega_hierros.material_codigo,
  movimientos_bodega_hierros.material_nombre,
  movimientos_bodega_hierros.bodega_principal,
  movimientos_bodega_hierros.bodega_secundaria,
  sum(movimientos_bodega_hierros.cantidad * movimientos_bodega_hierros.signo::numeric) as stock_actual,
  catalogo_hierros.tipo_material,
  catalogo_hierros.color
from movimientos_bodega_hierros
left join catalogo_hierros on catalogo_hierros.codigo = movimientos_bodega_hierros.material_codigo
group by movimientos_bodega_hierros.material_codigo, movimientos_bodega_hierros.material_nombre, movimientos_bodega_hierros.bodega_principal, movimientos_bodega_hierros.bodega_secundaria, catalogo_hierros.tipo_material, catalogo_hierros.color;

create or replace view public.stock_consumibles as
select
  movimientos_bodega_consumibles.material_codigo,
  movimientos_bodega_consumibles.material_nombre,
  movimientos_bodega_consumibles.bodega_principal,
  movimientos_bodega_consumibles.bodega_secundaria,
  sum(movimientos_bodega_consumibles.cantidad * movimientos_bodega_consumibles.signo::numeric) as stock_actual,
  catalogo_consumibles.tipo_material,
  catalogo_consumibles.color
from movimientos_bodega_consumibles
left join catalogo_consumibles on catalogo_consumibles.codigo = movimientos_bodega_consumibles.material_codigo
group by movimientos_bodega_consumibles.material_codigo, movimientos_bodega_consumibles.material_nombre, movimientos_bodega_consumibles.bodega_principal, movimientos_bodega_consumibles.bodega_secundaria, catalogo_consumibles.tipo_material, catalogo_consumibles.color;
