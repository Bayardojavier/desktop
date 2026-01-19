-- =============================================================================
-- MIGRACIÓN: Bodegas dinámicas + campos personalizados (Supabase)
-- Objetivo:
-- - Poder crear Bodega Principal / Secundaria / Tercera (ubicación/lote)
-- - Asociar plantillas de campos por bodega
-- - Guardar en catalogo: ids + nombre + campos_personalizados
-- - Guardar en movimientos_bodega: también bodega_tercera (opcional)
-- =============================================================================

-- Recomendado en Supabase
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1) Tablas de bodegas (jerárquicas)
-- Nota importante (cambio de modelo):
-- - El 3er nivel ("tercera/lote") NO se crea como tabla de bodegas.
-- - Se modela como un ACTIVO/CONTENEDOR dentro de catalogo (ej: Burra, Barril, Canasta)
--   marcando `catalogo.es_contenedor = true`.
-- - La ubicación exacta se registra por movimiento en `movimientos_bodega.ubicacion_*`.
-- -----------------------------------------------------------------------------
create table if not exists public.bodegas_principales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  codigo text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.bodegas_secundarias (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid not null references public.bodegas_principales(id) on delete cascade,
  nombre text not null,
  codigo text not null,
  created_at timestamptz default now(),
  unique (principal_id, nombre),
  unique (principal_id, codigo)
);
-- Nota: En algunos entornos `bodegas_secundarias` puede existir como VIEW (compatibilidad V2).
-- No se pueden crear índices sobre VIEWS. En ese caso, indexamos la tabla real subyacente si existe.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'bodegas_secundarias'
      and c.relkind in ('r','p')
  ) then
    execute 'create index if not exists idx_bodegas_secundarias_principal on public.bodegas_secundarias(principal_id)';
  elsif to_regclass('public.inv2_bodegas_secundarias') is not null then
    execute 'create index if not exists idx_inv2_bodegas_secundarias_principal on public.inv2_bodegas_secundarias(principal_id)';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2) Plantillas de formulario por bodega
-- fields_json: array JSON de campos: [{"key":"voltaje","label":"Voltaje","type":"number"}, ...]
-- scope: por principal o por secundaria (solo uno puede ser no-null)
-- -----------------------------------------------------------------------------
create table if not exists public.bodega_form_templates (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid references public.bodegas_principales(id) on delete cascade,
  secundaria_id uuid references public.bodegas_secundarias(id) on delete cascade,
  nombre text not null,
  fields_json jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  constraint template_scope_check check (
    (principal_id is not null and secundaria_id is null)
    or (principal_id is null and secundaria_id is not null)
  )
);

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'bodega_form_templates'
      and c.relkind in ('r','p')
  ) then
    execute 'create index if not exists idx_bodega_form_templates_principal on public.bodega_form_templates(principal_id)';
    execute 'create index if not exists idx_bodega_form_templates_secundaria on public.bodega_form_templates(secundaria_id)';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3) Extender catalogo
-- IMPORTANTE (V2): en la capa de compatibilidad, `public.catalogo` puede ser VIEW.
-- No se puede hacer ALTER TABLE sobre una VIEW.
-- - Si `catalogo` es TABLA (legacy), aplicamos las columnas aquí.
-- - Si `catalogo` es VIEW (V2), las columnas viven en `inv2_items` y se exponen
--   como `catalogo.campos_personalizados` (mapeado desde `inv2_items.campos_json`).
-- -----------------------------------------------------------------------------
do $$
declare
  v_kind char;
begin
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'catalogo'
  limit 1;

  if v_kind in ('r','p') then
    execute 'alter table public.catalogo
      add column if not exists bodega_principal_id uuid,
      add column if not exists bodega_secundaria_id uuid,
      add column if not exists campos_personalizados jsonb,
      add column if not exists es_contenedor boolean not null default false';
  else
    -- VIEW (V2 compat): asegurar columnas en inv2_items (por si no corriste el SQL V2)
    if to_regclass('public.inv2_items') is not null then
      execute 'alter table public.inv2_items
        add column if not exists bodega_principal_id uuid,
        add column if not exists bodega_secundaria_id uuid,
        add column if not exists campos_json jsonb,
        add column if not exists es_contenedor boolean not null default false';
    end if;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 4) Extender movimientos_bodega
-- En V2 compat, `public.movimientos_bodega` también puede ser VIEW.
-- Si es VIEW, NO se altera; la ubicación fina existe vía `contenedor_id`.
-- -----------------------------------------------------------------------------
do $$
declare
  v_kind char;
begin
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'movimientos_bodega'
  limit 1;

  if v_kind in ('r','p') then
    execute 'alter table public.movimientos_bodega
      add column if not exists ubicacion_codigo text,
      add column if not exists ubicacion_nombre text';
  end if;
end $$;

do $$
begin
  -- Solo aplicar RLS/policies si son TABLAS (no VIEWS). En V2, las policies
  -- se manejan en las tablas `inv2_*`.
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='bodegas_principales' and c.relkind in ('r','p')
  ) then
    execute 'alter table public.bodegas_principales enable row level security';
    execute 'drop policy if exists "bodegas_principales_all" on public.bodegas_principales';
    execute 'create policy "bodegas_principales_all" on public.bodegas_principales for all using (true) with check (true)';
  end if;

  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='bodegas_secundarias' and c.relkind in ('r','p')
  ) then
    execute 'alter table public.bodegas_secundarias enable row level security';
    execute 'drop policy if exists "bodegas_secundarias_all" on public.bodegas_secundarias';
    execute 'create policy "bodegas_secundarias_all" on public.bodegas_secundarias for all using (true) with check (true)';
  end if;

  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='bodega_form_templates' and c.relkind in ('r','p')
  ) then
    execute 'alter table public.bodega_form_templates enable row level security';
    execute 'drop policy if exists "bodega_form_templates_all" on public.bodega_form_templates';
    execute 'create policy "bodega_form_templates_all" on public.bodega_form_templates for all using (true) with check (true)';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6) Datos iniciales mínimos (opcional)
-- -----------------------------------------------------------------------------
-- insert into public.bodegas_principales (nombre, codigo) values
-- ('Audiovisual', 'AUD'),
-- ('Hierro', 'HIR')
-- on conflict do nothing;
