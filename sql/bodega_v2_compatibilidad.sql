-- =============================================================================
-- BODEGA V2 - CAPA DE COMPATIBILIDAD (NOMBRES VIEJOS)
-- Fecha: 2026-01-07
--
-- Objetivo
-- - Mantener tus pantallas funcionando SIN reescribirlas todavía.
-- - Exponer interfaces con nombres viejos:
--     - public.catalogo
--     - public.movimientos_bodega
--     - public.stock_actual_con_precio
--     - public.stock_actual_codigo(material_codigo_input)
--   pero respaldadas por tablas V2 (inv2_*).
--
-- Requisito
-- 1) Ejecuta primero: desktop/sql/bodega_v2_desde_cero.sql
-- 2) Idealmente úsalo en un proyecto Supabase NUEVO (sin tablas viejas).
--    Si ya existen tablas/vistas con estos nombres, revisa los DROP opcionales.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 0) Modo "BD existente": si ya hay TABLAS con nombres viejos, no se puede
--     crear un INSTEAD OF trigger porque eso solo aplica a VIEWS.
--     Solución: renombrar tablas viejas a *_legacy_<timestamp> y luego crear VIEWS.
-- -----------------------------------------------------------------------------
DO $$
declare
  v_suffix text := to_char(now(), 'YYYYMMDDHH24MISS');
  v_kind char;
begin
  -- catalogo
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'catalogo'
  limit 1;

  if v_kind in ('r','p') then
    execute format('alter table public.catalogo rename to %I', 'catalogo_legacy_' || v_suffix);
  end if;

  -- movimientos_bodega
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'movimientos_bodega'
  limit 1;

  if v_kind in ('r','p') then
    execute format('alter table public.movimientos_bodega rename to %I', 'movimientos_bodega_legacy_' || v_suffix);
  end if;

  -- stock_actual_con_precio
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'stock_actual_con_precio'
  limit 1;

  if v_kind in ('r','p') then
    execute format('alter table public.stock_actual_con_precio rename to %I', 'stock_actual_con_precio_legacy_' || v_suffix);
  end if;

  -- bodegas_principales
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'bodegas_principales'
  limit 1;

  if v_kind in ('r','p') then
    execute format('alter table public.bodegas_principales rename to %I', 'bodegas_principales_legacy_' || v_suffix);
  end if;

  -- bodegas_secundarias
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'bodegas_secundarias'
  limit 1;

  if v_kind in ('r','p') then
    execute format('alter table public.bodegas_secundarias rename to %I', 'bodegas_secundarias_legacy_' || v_suffix);
  end if;

  -- bodega_form_templates
  select c.relkind into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'bodega_form_templates'
  limit 1;

  if v_kind in ('r','p') then
    execute format('alter table public.bodega_form_templates rename to %I', 'bodega_form_templates_legacy_' || v_suffix);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 0a) Re-ejecución segura: si ya existen VIEWS de compatibilidad, las dejamos
--     caer y las recreamos. Postgres no permite cambiar libremente nombres/orden
--     de columnas con CREATE OR REPLACE VIEW (error 42P16).
-- -----------------------------------------------------------------------------
drop trigger if exists trg_catalogo_insert_instead on public.catalogo;
drop view if exists public.catalogo;

drop trigger if exists trg_movimientos_bodega_insert_instead on public.movimientos_bodega;
drop view if exists public.movimientos_bodega;

drop view if exists public.stock_actual_con_precio;

drop trigger if exists trg_bodegas_principales_insert_instead on public.bodegas_principales;
drop view if exists public.bodegas_principales;

drop trigger if exists trg_bodegas_secundarias_insert_instead on public.bodegas_secundarias;
drop view if exists public.bodegas_secundarias;

drop trigger if exists trg_bodega_form_templates_insert_instead on public.bodega_form_templates;
drop view if exists public.bodega_form_templates;

-- -----------------------------------------------------------------------------
-- (OPCIONAL) Limpieza de objetos "viejos" si estás en un proyecto NUEVO.
-- ⚠️ NO ejecutes estos DROP si quieres conservar tu sistema viejo en esta misma BD.
-- -----------------------------------------------------------------------------
-- drop view if exists public.stock_actual_con_precio;
-- drop view if exists public.movimientos_bodega;
-- drop view if exists public.catalogo;
-- drop function if exists public.stock_actual_codigo(text);

-- -----------------------------------------------------------------------------
-- 0) Extensiones/columnas V2 necesarias para compatibilidad con payloads actuales
-- -----------------------------------------------------------------------------
alter table public.inv2_movimientos
  add column if not exists referencia_documento text;

alter table public.inv2_movimientos
  add column if not exists referencia_tipo text;

alter table public.inv2_movimientos
  add column if not exists proveedor text;

alter table public.inv2_movimientos
  add column if not exists numero_factura text;

alter table public.inv2_movimientos
  add column if not exists precio_unitario numeric;

alter table public.inv2_movimientos
  add column if not exists material_nombre_snapshot text;

alter table public.inv2_movimientos
  add column if not exists estado text;

-- Columnas legacy comunes en "catalogo" (para que inserts del frontend no fallen)
alter table public.inv2_items
  add column if not exists tipo_uso text;

alter table public.inv2_items
  add column if not exists tipo_material text;

alter table public.inv2_items
  add column if not exists color text;

alter table public.inv2_items
  add column if not exists unidad_medida text;

alter table public.inv2_items
  add column if not exists dimensiones jsonb;

alter table public.inv2_items
  add column if not exists es_hechizo boolean not null default false;

alter table public.inv2_items
  add column if not exists marca text;

alter table public.inv2_items
  add column if not exists modelo text;

alter table public.inv2_items
  add column if not exists fecha_creacion timestamptz;

-- -----------------------------------------------------------------------------
-- 0b) Plantillas de formulario V2 (para bodega_form_templates)
-- -----------------------------------------------------------------------------
create table if not exists public.inv2_form_templates (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid references public.inv2_bodegas_principales(id) on delete cascade,
  secundaria_id uuid references public.inv2_bodegas_secundarias(id) on delete cascade,
  fields_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Una plantilla por secundaria (si aplica)
create unique index if not exists ux_inv2_form_templates_secundaria
  on public.inv2_form_templates(secundaria_id)
  where secundaria_id is not null;

-- Una plantilla por principal cuando secundaria_id es null
create unique index if not exists ux_inv2_form_templates_principal_only
  on public.inv2_form_templates(principal_id)
  where secundaria_id is null and principal_id is not null;

alter table public.inv2_form_templates enable row level security;
drop policy if exists "inv2_form_templates_all" on public.inv2_form_templates;
create policy "inv2_form_templates_all" on public.inv2_form_templates for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 1b) Compat: bodegas_principales / bodegas_secundarias (VIEW + INSTEAD OF INSERT)
-- -----------------------------------------------------------------------------
create or replace view public.bodegas_principales as
select
  id,
  nombre,
  codigo,
  activa,
  created_at
from public.inv2_bodegas_principales;

create or replace function public.bodegas_principales_insert_instead()
returns trigger
language plpgsql
as $$
declare
  v_nombre text;
  v_codigo text;
begin
  v_nombre := nullif(trim(new.nombre), '');
  if v_nombre is null then
    raise exception 'nombre es requerido';
  end if;
  v_codigo := nullif(trim(new.codigo), '');
  if v_codigo is null then
    v_codigo := public.inv2_normalize_code(v_nombre, 6);
  end if;

  insert into public.inv2_bodegas_principales (nombre, codigo, activa)
  values (v_nombre, upper(v_codigo), coalesce(new.activa, true))
  on conflict (nombre)
  do update set codigo = excluded.codigo, activa = excluded.activa;

  return new;
end;
$$;

drop trigger if exists trg_bodegas_principales_insert_instead on public.bodegas_principales;
create trigger trg_bodegas_principales_insert_instead
instead of insert on public.bodegas_principales
for each row
execute function public.bodegas_principales_insert_instead();

create or replace view public.bodegas_secundarias as
select
  id,
  principal_id,
  nombre,
  codigo,
  activa,
  created_at
from public.inv2_bodegas_secundarias;

create or replace function public.bodegas_secundarias_insert_instead()
returns trigger
language plpgsql
as $$
declare
  v_principal uuid;
  v_nombre text;
  v_codigo text;
begin
  v_principal := new.principal_id;
  if v_principal is null then
    raise exception 'principal_id es requerido';
  end if;
  v_nombre := nullif(trim(new.nombre), '');
  if v_nombre is null then
    raise exception 'nombre es requerido';
  end if;
  v_codigo := nullif(trim(new.codigo), '');
  if v_codigo is null then
    v_codigo := public.inv2_normalize_code(v_nombre, 8);
  end if;

  insert into public.inv2_bodegas_secundarias (principal_id, nombre, codigo, activa)
  values (v_principal, v_nombre, upper(v_codigo), coalesce(new.activa, true))
  on conflict (principal_id, nombre)
  do update set codigo = excluded.codigo, activa = excluded.activa;

  return new;
end;
$$;

drop trigger if exists trg_bodegas_secundarias_insert_instead on public.bodegas_secundarias;
create trigger trg_bodegas_secundarias_insert_instead
instead of insert on public.bodegas_secundarias
for each row
execute function public.bodegas_secundarias_insert_instead();

-- -----------------------------------------------------------------------------
-- 1c) Compat: bodega_form_templates (VIEW + upsert)
-- -----------------------------------------------------------------------------
create or replace view public.bodega_form_templates as
select
  id,
  principal_id,
  secundaria_id,
  fields_json,
  created_at
from public.inv2_form_templates;

create or replace function public.bodega_form_templates_insert_instead()
returns trigger
language plpgsql
as $$
begin
  if new.secundaria_id is not null then
    insert into public.inv2_form_templates (principal_id, secundaria_id, fields_json)
    values (new.principal_id, new.secundaria_id, coalesce(new.fields_json::jsonb, '[]'::jsonb))
    on conflict (secundaria_id)
    do update set fields_json = excluded.fields_json;
  else
    insert into public.inv2_form_templates (principal_id, secundaria_id, fields_json)
    values (new.principal_id, null, coalesce(new.fields_json::jsonb, '[]'::jsonb))
    on conflict (principal_id)
    where inv2_form_templates.secundaria_id is null
    do update set fields_json = excluded.fields_json;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bodega_form_templates_insert_instead on public.bodega_form_templates;
create trigger trg_bodega_form_templates_insert_instead
instead of insert on public.bodega_form_templates
for each row
execute function public.bodega_form_templates_insert_instead();

-- -----------------------------------------------------------------------------
-- 1) Helpers: obtener o crear bodegas por nombre (dinámicas)
-- -----------------------------------------------------------------------------
create or replace function public.inv2_normalize_code(input text, maxlen int default 12)
returns text
language plpgsql
as $$
declare
  v text;
begin
  v := upper(regexp_replace(coalesce(input,''), '[^A-Za-z0-9]+', '', 'g'));
  v := left(nullif(v,''), maxlen);
  if v is null then
    v := left(upper(replace(gen_random_uuid()::text, '-', '')), maxlen);
  end if;
  return v;
end;
$$;

create or replace function public.inv2_get_or_create_bodega_principal(nombre_input text)
returns uuid
language plpgsql
as $$
declare
  v_nombre text;
  v_codigo text;
  v_id uuid;
begin
  v_nombre := nullif(trim(nombre_input), '');
  if v_nombre is null then
    -- default
    v_nombre := 'Principal';
  end if;

  select id into v_id
  from public.inv2_bodegas_principales
  where lower(nombre) = lower(v_nombre)
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  v_codigo := public.inv2_normalize_code(v_nombre, 6);

  -- intentar insertar; si hay colisión de codigo, usa sufijo aleatorio
  begin
    insert into public.inv2_bodegas_principales (nombre, codigo)
    values (v_nombre, v_codigo)
    returning id into v_id;
  exception when unique_violation then
    v_codigo := left(v_codigo, 4) || left(public.inv2_normalize_code(gen_random_uuid()::text, 6), 2);
    insert into public.inv2_bodegas_principales (nombre, codigo)
    values (v_nombre, v_codigo)
    returning id into v_id;
  end;

  return v_id;
end;
$$;

create or replace function public.inv2_get_or_create_bodega_secundaria(principal_id_input uuid, nombre_input text)
returns uuid
language plpgsql
as $$
declare
  v_nombre text;
  v_codigo text;
  v_id uuid;
  v_principal uuid;
begin
  v_principal := principal_id_input;
  if v_principal is null then
    v_principal := public.inv2_get_or_create_bodega_principal('Principal');
  end if;

  v_nombre := nullif(trim(nombre_input), '');
  if v_nombre is null then
    v_nombre := 'General';
  end if;

  select id into v_id
  from public.inv2_bodegas_secundarias
  where principal_id = v_principal
    and lower(nombre) = lower(v_nombre)
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  v_codigo := public.inv2_normalize_code(v_nombre, 8);

  begin
    insert into public.inv2_bodegas_secundarias (principal_id, nombre, codigo)
    values (v_principal, v_nombre, v_codigo)
    returning id into v_id;
  exception when unique_violation then
    v_codigo := left(v_codigo, 6) || left(public.inv2_normalize_code(gen_random_uuid()::text, 8), 2);
    insert into public.inv2_bodegas_secundarias (principal_id, nombre, codigo)
    values (v_principal, v_nombre, v_codigo)
    returning id into v_id;
  end;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1.b) Consecutivo de códigos por bodega principal (RPC)
--
-- Objetivo: entregar un número consecutivo estable por bodega principal,
-- sin depender del orden/forma del string del código en el frontend.
-- El frontend arma el código como: <NNNN>-<PARTES...> pero el orden de PARTES
-- es configurable; este RPC solo entrega el NNNN.
-- -----------------------------------------------------------------------------

create table if not exists public.inv2_codigo_consecutivos (
  principal_id uuid primary key references public.inv2_bodegas_principales(id) on delete cascade,
  next_val bigint not null default 2001,
  updated_at timestamptz not null default now()
);

alter table public.inv2_codigo_consecutivos enable row level security;
drop policy if exists "inv2_codigo_consecutivos_all" on public.inv2_codigo_consecutivos;
create policy "inv2_codigo_consecutivos_all" on public.inv2_codigo_consecutivos
  for all using (true) with check (true);

drop function if exists public.inv2_next_codigo_por_principal(text);
create or replace function public.inv2_next_codigo_por_principal(principal_nombre_input text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_principal_id uuid;
  v_seed bigint;
  v_next bigint;
begin
  v_principal_id := public.inv2_get_or_create_bodega_principal(principal_nombre_input);

  -- Seed inicial basado en el máximo prefijo numérico existente para esa bodega.
  -- Si no hay, arranca en 2001.
  select coalesce(max((split_part(i.codigo, '-', 1))::bigint), 2000) + 1
    into v_seed
  from public.inv2_items i
  where i.bodega_principal_id = v_principal_id
    and split_part(i.codigo, '-', 1) ~ '^[0-9]+$';

  -- UPSERT atómico: guarda el "next_val" ya incrementado y devuelve el valor asignado.
  with upsert as (
    insert into public.inv2_codigo_consecutivos (principal_id, next_val, updated_at)
    values (v_principal_id, v_seed + 1, now())
    on conflict (principal_id)
    do update set next_val = public.inv2_codigo_consecutivos.next_val + 1,
                 updated_at = now()
    returning next_val
  )
  select (next_val - 1) into v_next from upsert;

  return v_next;
end;
$$;

do $$
begin
  grant execute on function public.inv2_next_codigo_por_principal(text) to anon, authenticated;
exception when others then
  -- Si no existen roles (entorno no Supabase), ignora.
  null;
end $$;

-- -----------------------------------------------------------------------------
-- 2) Compat: public.catalogo (VIEW + INSTEAD OF INSERT)
-- -----------------------------------------------------------------------------
create or replace view public.catalogo as
select
  i.codigo,
  i.nombre,
  coalesce(bp.nombre, 'Principal') as bodega_principal,
  coalesce(bs.nombre, 'General') as bodega_secundaria,
  -- ids (algunas pantallas los envían)
  i.bodega_principal_id,
  i.bodega_secundaria_id,
  -- legacy
  i.tipo_uso,
  -- legacy fields (si tu UI los usa)
  coalesce(i.tipo_material, case when i.tipo_item is null then null else lower(i.tipo_item) end) as tipo_material,
  i.color,
  i.unidad_medida,
  i.dimensiones,
  i.es_hechizo,
  i.marca,
  i.modelo,
  i.foto_url,
  coalesce(i.fecha_creacion, i.created_at) as fecha_creacion,
  i.es_contenedor,
  i.campos_json as campos_personalizados,
  i.activo,
  i.created_at
from public.inv2_items i
left join public.inv2_bodegas_principales bp on bp.id = i.bodega_principal_id
left join public.inv2_bodegas_secundarias bs on bs.id = i.bodega_secundaria_id;

create or replace function public.catalogo_insert_instead()
returns trigger
language plpgsql
as $$
declare
  v_principal_id uuid;
  v_secundaria_id uuid;
begin
  v_principal_id := coalesce(new.bodega_principal_id, public.inv2_get_or_create_bodega_principal(new.bodega_principal));
  v_secundaria_id := coalesce(new.bodega_secundaria_id, public.inv2_get_or_create_bodega_secundaria(v_principal_id, new.bodega_secundaria));

  insert into public.inv2_items (
    codigo,
    nombre,
    tipo_item,
    es_contenedor,
    bodega_principal_id,
    bodega_secundaria_id,
    tipo_uso,
    tipo_material,
    color,
    unidad_medida,
    dimensiones,
    es_hechizo,
    marca,
    modelo,
    campos_json,
    foto_url,
    fecha_creacion,
    activo
  ) values (
    new.codigo,
    coalesce(new.nombre, new.codigo),
    case when coalesce(new.es_contenedor, false) then 'CONTENEDOR' else 'MATERIAL' end,
    coalesce(new.es_contenedor, false),
    v_principal_id,
    v_secundaria_id,
    nullif(trim(new.tipo_uso), ''),
    nullif(trim(new.tipo_material), ''),
    nullif(trim(new.color), ''),
    nullif(trim(new.unidad_medida), ''),
    new.dimensiones::jsonb,
    coalesce(new.es_hechizo, false),
    nullif(trim(new.marca), ''),
    nullif(trim(new.modelo), ''),
    coalesce(new.campos_personalizados::jsonb, '[]'::jsonb),
    nullif(trim(new.foto_url), ''),
    coalesce(new.fecha_creacion, now()),
    coalesce(new.activo, true)
  )
  on conflict (codigo)
  do update
  set
    nombre = excluded.nombre,
    tipo_item = excluded.tipo_item,
    es_contenedor = excluded.es_contenedor,
    bodega_principal_id = excluded.bodega_principal_id,
    bodega_secundaria_id = excluded.bodega_secundaria_id,
    tipo_uso = excluded.tipo_uso,
    tipo_material = excluded.tipo_material,
    color = excluded.color,
    unidad_medida = excluded.unidad_medida,
    dimensiones = excluded.dimensiones,
    es_hechizo = excluded.es_hechizo,
    marca = excluded.marca,
    modelo = excluded.modelo,
    campos_json = excluded.campos_json,
    foto_url = excluded.foto_url,
    fecha_creacion = excluded.fecha_creacion,
    activo = excluded.activo;

  return new;
end;
$$;

drop trigger if exists trg_catalogo_insert_instead on public.catalogo;
create trigger trg_catalogo_insert_instead
instead of insert on public.catalogo
for each row
execute function public.catalogo_insert_instead();

-- -----------------------------------------------------------------------------
-- 3) Compat: public.movimientos_bodega (VIEW + INSTEAD OF INSERT)
-- -----------------------------------------------------------------------------
create or replace view public.movimientos_bodega as
select
  m.id,
  i.codigo as material_codigo,
  coalesce(m.material_nombre_snapshot, i.nombre) as material_nombre,
  coalesce(bp.nombre, 'Principal') as bodega_principal,
  coalesce(bs.nombre, 'General') as bodega_secundaria,
  lower(m.tipo_movimiento) as tipo_movimiento,
  m.cantidad,
  m.signo,
  m.referencia_documento,
  m.referencia_tipo,
  m.responsable,
  m.fecha_movimiento,
  m.observaciones,
  m.estado,
  m.proveedor,
  m.numero_factura,
  m.precio_unitario,
  -- ubicacion fina (contenedor)
  cont.codigo as ubicacion_codigo,
  cont.nombre as ubicacion_nombre,
  m.created_at
from public.inv2_movimientos m
join public.inv2_items i on i.id = m.item_id
left join public.inv2_bodegas_principales bp on bp.id = m.bodega_principal_id
left join public.inv2_bodegas_secundarias bs on bs.id = m.bodega_secundaria_id
left join public.inv2_items cont on cont.id = m.contenedor_id;

create or replace function public.movimientos_bodega_insert_instead()
returns trigger
language plpgsql
as $$
declare
  v_item_id uuid;
  v_principal_id uuid;
  v_secundaria_id uuid;
  v_contenedor_id uuid;
  v_tipo text;
  v_codigo text;
begin
  v_codigo := nullif(trim(new.material_codigo), '');
  if v_codigo is null then
    raise exception 'material_codigo es requerido';
  end if;

  -- crear/actualizar item por codigo (compat)
  insert into public.inv2_items (codigo, nombre, tipo_item, es_contenedor)
  values (
    v_codigo,
    coalesce(nullif(trim(new.material_nombre), ''), v_codigo),
    'MATERIAL',
    false
  )
  on conflict (codigo)
  do update
  set nombre = coalesce(excluded.nombre, inv2_items.nombre)
  returning id into v_item_id;

  v_principal_id := public.inv2_get_or_create_bodega_principal(new.bodega_principal);
  v_secundaria_id := public.inv2_get_or_create_bodega_secundaria(v_principal_id, new.bodega_secundaria);

  v_contenedor_id := null;
  if nullif(trim(coalesce(new.ubicacion_codigo,'')), '') is not null then
    select id into v_contenedor_id
    from public.inv2_items
    where codigo = trim(new.ubicacion_codigo)
    limit 1;
  end if;

  v_tipo := coalesce(upper(nullif(trim(new.tipo_movimiento), '')), 'AJUSTE');

  insert into public.inv2_movimientos (
    fecha_movimiento,
    tipo_movimiento,
    signo,
    cantidad,
    item_id,
    bodega_principal_id,
    bodega_secundaria_id,
    contenedor_id,
    responsable,
    observaciones,
    estado,
    referencia_documento,
    referencia_tipo,
    proveedor,
    numero_factura,
    precio_unitario,
    material_nombre_snapshot
  ) values (
    coalesce(new.fecha_movimiento, now()),
    v_tipo,
    coalesce(new.signo, 1),
    coalesce(new.cantidad, 0),
    v_item_id,
    v_principal_id,
    v_secundaria_id,
    v_contenedor_id,
    new.responsable,
    new.observaciones,
    nullif(trim(new.estado), ''),
    new.referencia_documento,
    new.referencia_tipo,
    new.proveedor,
    new.numero_factura,
    new.precio_unitario,
    nullif(trim(new.material_nombre), '')
  );

  return new;
end;
$$;

drop trigger if exists trg_movimientos_bodega_insert_instead on public.movimientos_bodega;
create trigger trg_movimientos_bodega_insert_instead
instead of insert on public.movimientos_bodega
for each row
execute function public.movimientos_bodega_insert_instead();

-- -----------------------------------------------------------------------------
-- 4) Compat: public.stock_actual_con_precio (VIEW)
--    Stock por (material_codigo + bodega_principal + bodega_secundaria)
--    Precio promedio: ponderado por ingresos (signo=1) con precio_unitario
-- -----------------------------------------------------------------------------
create or replace view public.stock_actual_con_precio as
with stock as (
  select
    i.codigo as material_codigo,
    i.nombre as material_nombre,
    coalesce(bp.nombre, 'Principal') as bodega_principal,
    coalesce(bs.nombre, 'General') as bodega_secundaria,
    sum(m.cantidad * m.signo) as existencia
  from public.inv2_movimientos m
  join public.inv2_items i on i.id = m.item_id
  left join public.inv2_bodegas_principales bp on bp.id = m.bodega_principal_id
  left join public.inv2_bodegas_secundarias bs on bs.id = m.bodega_secundaria_id
  where coalesce(i.es_contenedor, false) = false
  group by i.codigo, i.nombre, bp.nombre, bs.nombre
), precio as (
  select
    i.codigo as material_codigo,
    coalesce(bp.nombre, 'Principal') as bodega_principal,
    coalesce(bs.nombre, 'General') as bodega_secundaria,
    case
      when sum(case when m.signo = 1 and coalesce(m.precio_unitario,0) > 0 then m.cantidad else 0 end) = 0 then 0
      else
        sum(case when m.signo = 1 and coalesce(m.precio_unitario,0) > 0 then (m.cantidad * m.precio_unitario) else 0 end)
        /
        nullif(sum(case when m.signo = 1 and coalesce(m.precio_unitario,0) > 0 then m.cantidad else 0 end), 0)
    end as precio_promedio
  from public.inv2_movimientos m
  join public.inv2_items i on i.id = m.item_id
  left join public.inv2_bodegas_principales bp on bp.id = m.bodega_principal_id
  left join public.inv2_bodegas_secundarias bs on bs.id = m.bodega_secundaria_id
  where coalesce(i.es_contenedor, false) = false
  group by i.codigo, bp.nombre, bs.nombre
)
select
  s.material_codigo,
  s.material_nombre,
  s.bodega_principal,
  s.bodega_secundaria,
  greatest(0, coalesce(s.existencia, 0)) as existencia,
  coalesce(p.precio_promedio, 0) as precio_promedio
from stock s
left join precio p
  on p.material_codigo = s.material_codigo
 and p.bodega_principal = s.bodega_principal
 and p.bodega_secundaria = s.bodega_secundaria;

-- -----------------------------------------------------------------------------
-- 5) RPC compat: stock_actual_codigo(material_codigo_input)
--    Devuelve existencia TOTAL del material (sumando bodegas/contendedores)
-- -----------------------------------------------------------------------------
drop function if exists public.stock_actual_codigo(text);

create or replace function public.stock_actual_codigo(material_codigo_input text)
returns table (existencia numeric)
language plpgsql
as $$
begin
  return query
  select
    coalesce(sum(m.cantidad * m.signo), 0) as existencia
  from public.inv2_movimientos m
  join public.inv2_items i on i.id = m.item_id
  where i.codigo = trim(material_codigo_input);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) RPC: stock actual por contenedor (para casos multi-lote)
--    Devuelve existencia por contenedor y bodega (sumatoria del ledger)
-- -----------------------------------------------------------------------------
drop function if exists public.inv2_stock_por_contenedor(text);

create or replace function public.inv2_stock_por_contenedor(material_codigo_input text)
returns table (
  ubicacion_codigo text,
  ubicacion_nombre text,
  bodega_principal text,
  bodega_secundaria text,
  existencia numeric
)
language sql
stable
as $$
  with item as (
    select id
    from public.inv2_items
    where codigo = trim(material_codigo_input)
    limit 1
  ), agg as (
    select
      m.contenedor_id,
      m.bodega_principal_id,
      m.bodega_secundaria_id,
      sum(coalesce(m.cantidad, 0) * coalesce(m.signo, 1))::numeric as existencia
    from public.inv2_movimientos m
    join item i on i.id = m.item_id
    group by m.contenedor_id, m.bodega_principal_id, m.bodega_secundaria_id
  )
  select
    cont.codigo as ubicacion_codigo,
    coalesce(cont.nombre, 'Sin contenedor') as ubicacion_nombre,
    coalesce(bp.nombre, 'Principal') as bodega_principal,
    coalesce(bs.nombre, 'General') as bodega_secundaria,
    coalesce(a.existencia, 0)::numeric as existencia
  from agg a
  left join public.inv2_items cont on cont.id = a.contenedor_id
  left join public.inv2_bodegas_principales bp on bp.id = a.bodega_principal_id
  left join public.inv2_bodegas_secundarias bs on bs.id = a.bodega_secundaria_id
  where coalesce(a.existencia, 0) <> 0
  order by ubicacion_nombre asc;
$$;

grant execute on function public.inv2_stock_por_contenedor(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7) RLS en views/funciones
-- Nota: en Supabase, las policies aplican a tablas subyacentes.
-- Ya están abiertas en bodega_v2_desde_cero.sql.
-- -----------------------------------------------------------------------------
