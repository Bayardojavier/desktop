-- =============================================================================
-- BODEGA V2 (DESDE CERO) - Esquema nuevo, sin modificar tablas viejas
-- Fecha: 2026-01-07
--
-- Objetivo
-- - Rehacer Catálogo + Movimientos + Ubicaciones/Contenedores con un modelo limpio.
-- - Mantener el sistema viejo intacto mientras migras la app.
--
-- Importante
-- - Este archivo CREA tablas nuevas con prefijo inv2_.
-- - No borra catalogo/movimientos_bodega existentes.
-- - Cuando ya esté todo migrado, puedes eliminar el sistema viejo.
-- =============================================================================

-- Recomendado en Supabase
create extension if not exists "pgcrypto";

-- =============================================================================
-- 0) (OPCIONAL) DROP de V2 si estás rehaciendo v2
-- =============================================================================
-- ⚠️ Descomenta solo si quieres borrar el esquema V2 (no toca tablas viejas)
-- drop view if exists public.inv2_stock_actual;
-- drop table if exists public.inv2_documento_lineas;
-- drop table if exists public.inv2_documentos;
-- drop table if exists public.inv2_movimientos;
-- drop table if exists public.inv2_items;
-- drop table if exists public.inv2_bodegas_secundarias;
-- drop table if exists public.inv2_bodegas_principales;

-- =============================================================================
-- 1) Ubicaciones (Bodega Principal / Secundaria)
-- =============================================================================
create table if not exists public.inv2_bodegas_principales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  codigo text not null unique,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inv2_bodegas_secundarias (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid not null references public.inv2_bodegas_principales(id) on delete cascade,
  nombre text not null,
  codigo text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (principal_id, nombre),
  unique (principal_id, codigo)
);

create index if not exists idx_inv2_secundarias_principal on public.inv2_bodegas_secundarias(principal_id);

-- =============================================================================
-- 2) Catálogo V2
-- =============================================================================
-- Notas
-- - Un contenedor (Burra/Canasta/Barril) ES un item del catálogo.
-- - Se marca con es_contenedor=true y se asocia a una ubicación (principal/secundaria).
-- - Campos extra y plantilla: usar campos_json (JSONB).
--
-- tipo_item sugerido: 'MATERIAL' | 'SERVICIO' | 'CONTENEDOR' | 'HERRAMIENTA' | 'OTRO'
create table if not exists public.inv2_items (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,

  tipo_item text not null default 'MATERIAL',
  es_contenedor boolean not null default false,

  bodega_principal_id uuid references public.inv2_bodegas_principales(id) on delete set null,
  bodega_secundaria_id uuid references public.inv2_bodegas_secundarias(id) on delete set null,

  foto_url text,

  -- campos flexibles (plantilla + personalizados)
  campos_json jsonb not null default '[]'::jsonb,

  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_inv2_items_ubicacion on public.inv2_items(bodega_principal_id, bodega_secundaria_id);
create index if not exists idx_inv2_items_tipo on public.inv2_items(tipo_item);

-- =============================================================================
-- 3) Documentos (para flujo limpio: ingreso / despacho / devolución / ajuste)
-- =============================================================================
-- Ventaja: el usuario no inventa facturas; usa 'documentos' con tipo y líneas.
-- El stock se deriva de inv2_movimientos (ledger).
create table if not exists public.inv2_documentos (
  id uuid primary key default gen_random_uuid(),
  tipo_documento text not null, -- 'INGRESO'|'DESPACHO'|'DEVOLUCION'|'AJUSTE'|'TRASLADO'
  fecha timestamptz not null default now(),
  estado text not null default 'COMPLETADO',
  responsable text,
  referencia text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_inv2_documentos_tipo_fecha on public.inv2_documentos(tipo_documento, fecha);

create table if not exists public.inv2_documento_lineas (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.inv2_documentos(id) on delete cascade,

  item_id uuid not null references public.inv2_items(id) on delete restrict,

  bodega_principal_id uuid references public.inv2_bodegas_principales(id) on delete set null,
  bodega_secundaria_id uuid references public.inv2_bodegas_secundarias(id) on delete set null,

  -- Contenedor/ubicación fina (Burra/Canasta/etc): referencia a inv2_items (es_contenedor=true)
  contenedor_id uuid references public.inv2_items(id) on delete set null,

  cantidad numeric not null,
  observaciones text,

  created_at timestamptz not null default now()
);

create index if not exists idx_inv2_lineas_documento on public.inv2_documento_lineas(documento_id);
create index if not exists idx_inv2_lineas_item on public.inv2_documento_lineas(item_id);

-- =============================================================================
-- 4) Movimientos (ledger)
-- =============================================================================
-- Aquí vive la verdad del stock: suma(cantidad * signo).
create table if not exists public.inv2_movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha_movimiento timestamptz not null default now(),

  documento_id uuid references public.inv2_documentos(id) on delete set null,
  documento_linea_id uuid references public.inv2_documento_lineas(id) on delete set null,

  tipo_movimiento text not null, -- 'INGRESO'|'SALIDA'|'AJUSTE_ENTRADA'|'AJUSTE_SALIDA'|'TRASLADO_ENTRADA'|'TRASLADO_SALIDA'
  signo int not null check (signo in (-1, 1)),
  cantidad numeric not null,

  item_id uuid not null references public.inv2_items(id) on delete restrict,

  bodega_principal_id uuid references public.inv2_bodegas_principales(id) on delete set null,
  bodega_secundaria_id uuid references public.inv2_bodegas_secundarias(id) on delete set null,

  contenedor_id uuid references public.inv2_items(id) on delete set null,

  responsable text,
  observaciones text,

  created_at timestamptz not null default now()
);

create index if not exists idx_inv2_mov_item on public.inv2_movimientos(item_id);
create index if not exists idx_inv2_mov_ubicacion on public.inv2_movimientos(bodega_principal_id, bodega_secundaria_id, contenedor_id);
create index if not exists idx_inv2_mov_fecha on public.inv2_movimientos(fecha_movimiento);

-- =============================================================================
-- 5) Vista de stock actual (por item + ubicación + contenedor)
-- =============================================================================
create or replace view public.inv2_stock_actual as
select
  m.item_id,
  i.codigo as item_codigo,
  i.nombre as item_nombre,
  m.bodega_principal_id,
  m.bodega_secundaria_id,
  m.contenedor_id,
  sum(m.cantidad * m.signo) as stock
from public.inv2_movimientos m
join public.inv2_items i on i.id = m.item_id
group by m.item_id, i.codigo, i.nombre, m.bodega_principal_id, m.bodega_secundaria_id, m.contenedor_id;

-- =============================================================================
-- 6) RLS (abierto por ahora, igual que tu enfoque actual)
-- =============================================================================
alter table public.inv2_bodegas_principales enable row level security;
alter table public.inv2_bodegas_secundarias enable row level security;
alter table public.inv2_items enable row level security;
alter table public.inv2_documentos enable row level security;
alter table public.inv2_documento_lineas enable row level security;
alter table public.inv2_movimientos enable row level security;

drop policy if exists "inv2_principales_all" on public.inv2_bodegas_principales;
create policy "inv2_principales_all" on public.inv2_bodegas_principales for all using (true) with check (true);

drop policy if exists "inv2_secundarias_all" on public.inv2_bodegas_secundarias;
create policy "inv2_secundarias_all" on public.inv2_bodegas_secundarias for all using (true) with check (true);

drop policy if exists "inv2_items_all" on public.inv2_items;
create policy "inv2_items_all" on public.inv2_items for all using (true) with check (true);

drop policy if exists "inv2_documentos_all" on public.inv2_documentos;
create policy "inv2_documentos_all" on public.inv2_documentos for all using (true) with check (true);

drop policy if exists "inv2_documento_lineas_all" on public.inv2_documento_lineas;
create policy "inv2_documento_lineas_all" on public.inv2_documento_lineas for all using (true) with check (true);

drop policy if exists "inv2_movimientos_all" on public.inv2_movimientos;
create policy "inv2_movimientos_all" on public.inv2_movimientos for all using (true) with check (true);

-- =============================================================================
-- 7) (OPCIONAL) Semilla mínima (ejemplo)
-- =============================================================================
-- insert into public.inv2_bodegas_principales (nombre, codigo) values
-- ('Hierro', 'HIR'),
-- ('Audiovisual', 'AUD')
-- on conflict do nothing;

-- =============================================================================
-- 8) (OPCIONAL) Migración de datos desde sistema viejo
-- =============================================================================
-- Esto NO está automatizado aquí porque depende de tu data real.
-- Si decides migrar datos, lo más seguro es:
-- 1) Crear bodegas inv2_ a partir de distinct catalogo.bodega_principal/bodega_secundaria
-- 2) Crear inv2_items a partir de catalogo
-- 3) Crear inv2_movimientos a partir de movimientos_bodega (mapeando tipos/signos)
--
-- Yo te puedo preparar el script exacto cuando confirmes:
-- - si conservamos los codigos actuales o generamos nuevos
-- - si hay materiales duplicados por codigo/nombre
-- - qué campos del viejo catalogo quieres preservar en campos_json
