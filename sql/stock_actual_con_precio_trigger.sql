-- Mantener stock_actual_con_precio como cache derivada de movimientos_bodega
-- Objetivo: que el frontend NO haga updates directos al stock; el stock se actualiza por trigger.

create extension if not exists pgcrypto;

-- Tabla cache (si ya existe, solo asegura columnas/PK)
create table if not exists public.stock_actual_con_precio (
  material_codigo text not null,
  material_nombre text,
  bodega_principal text not null default 'Principal',
  bodega_secundaria text not null default 'General',
  existencia numeric not null default 0,
  precio_promedio numeric not null default 0,
  updated_at timestamptz not null default now(),
  constraint stock_actual_con_precio_pk primary key (material_codigo, bodega_principal, bodega_secundaria)
);

alter table public.stock_actual_con_precio
  add column if not exists material_nombre text;

alter table public.stock_actual_con_precio
  add column if not exists bodega_principal text;

alter table public.stock_actual_con_precio
  add column if not exists bodega_secundaria text;

alter table public.stock_actual_con_precio
  add column if not exists existencia numeric;

alter table public.stock_actual_con_precio
  add column if not exists precio_promedio numeric;

alter table public.stock_actual_con_precio
  add column if not exists updated_at timestamptz;

-- Asegurar PK compuesta por (material_codigo, bodega_principal, bodega_secundaria)
DO $$
declare
  v_pk_name text;
  v_pk_cols text[];
begin
  -- defaults por compatibilidad
  execute 'alter table public.stock_actual_con_precio alter column bodega_principal set default ''Principal''';
  execute 'alter table public.stock_actual_con_precio alter column bodega_secundaria set default ''General''';

  -- backfill nulos si venía de versiones anteriores
  execute 'update public.stock_actual_con_precio set bodega_principal = coalesce(nullif(trim(bodega_principal), ''''), ''Principal'') where bodega_principal is null or trim(bodega_principal) = ''''';
  execute 'update public.stock_actual_con_precio set bodega_secundaria = coalesce(nullif(trim(bodega_secundaria), ''''), ''General'') where bodega_secundaria is null or trim(bodega_secundaria) = ''''';

  -- detectar PK actual (si existe) y sus columnas
  select c.conname
    into v_pk_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'stock_actual_con_precio'
    and c.contype = 'p'
  limit 1;

  if v_pk_name is not null then
    select array_agg(a.attname order by u.ord)
      into v_pk_cols
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join unnest(c.conkey) with ordinality as u(attnum, ord) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = u.attnum
    where n.nspname = 'public'
      and t.relname = 'stock_actual_con_precio'
      and c.contype = 'p'
      and c.conname = v_pk_name;

    -- si el PK ya es el deseado, no hacemos nada
    if v_pk_cols = array['material_codigo','bodega_principal','bodega_secundaria'] then
      return;
    end if;

    -- si hay PK pero es otro, lo eliminamos (sin importar el nombre)
    execute format('alter table public.stock_actual_con_precio drop constraint %I', v_pk_name);
  end if;

  -- crear PK correcto (si todavía no existe)
  begin
    execute 'alter table public.stock_actual_con_precio add constraint stock_actual_con_precio_pk primary key (material_codigo, bodega_principal, bodega_secundaria)';
  exception when duplicate_object then
    null;
  end;
end $$;

-- Trigger function: aplica un movimiento al stock y actualiza precio_promedio (promedio móvil en ingresos)
create or replace function public.apply_movimiento_to_stock_actual()
returns trigger
language plpgsql
as $$
declare
  v_codigo text;
  v_bodega text;
  v_bodega2 text;
  v_qty numeric;
  v_signo numeric;
  v_delta numeric;
  v_precio numeric;
begin
  v_codigo := nullif(trim(new.material_codigo), '');
  if v_codigo is null then
    return new;
  end if;

  v_bodega := coalesce(nullif(trim(new.bodega_principal), ''), 'Principal');
  v_bodega2 := coalesce(nullif(trim(new.bodega_secundaria), ''), 'General');
  v_qty := coalesce(new.cantidad, 0);
  v_signo := coalesce(new.signo, 1);
  v_delta := v_qty * v_signo;
  v_precio := coalesce(new.precio_unitario, 0);

  insert into public.stock_actual_con_precio (material_codigo, material_nombre, bodega_principal, bodega_secundaria, existencia, precio_promedio, updated_at)
  values (
    v_codigo,
    nullif(trim(new.material_nombre), ''),
    v_bodega,
    v_bodega2,
    greatest(0, v_delta),
    case when v_signo = 1 and v_precio > 0 then v_precio else 0 end,
    now()
  )
  on conflict (material_codigo, bodega_principal, bodega_secundaria)
  do update
  set
    material_nombre = coalesce(nullif(trim(excluded.material_nombre), ''), stock_actual_con_precio.material_nombre),
    existencia = greatest(0, coalesce(stock_actual_con_precio.existencia, 0) + v_delta),
    precio_promedio = case
      when v_signo = 1 and v_precio > 0 then
        (
          (coalesce(stock_actual_con_precio.existencia, 0) * coalesce(stock_actual_con_precio.precio_promedio, 0))
          + (v_qty * v_precio)
        )
        / nullif(coalesce(stock_actual_con_precio.existencia, 0) + v_qty, 0)
      else
        coalesce(stock_actual_con_precio.precio_promedio, 0)
    end,
    updated_at = now();

  return new;
end;
$$;

-- Trigger en movimientos_bodega
-- Nota: requiere que exista public.movimientos_bodega con columnas usadas (material_codigo, material_nombre, bodega_principal, cantidad, signo, precio_unitario)
DO $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'movimientos_bodega'
      and c.relkind = 'r'
  ) then
    -- Asegurar columnas mínimas para el doble filtro
    begin
      execute 'alter table public.movimientos_bodega add column if not exists bodega_principal text';
    exception when others then
      null;
    end;
    begin
      execute 'alter table public.movimientos_bodega add column if not exists bodega_secundaria text';
      execute 'alter table public.movimientos_bodega alter column bodega_principal set default ''Principal''';
      execute 'alter table public.movimientos_bodega alter column bodega_secundaria set default ''General''';
    exception when others then
      null;
    end;

    if not exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'movimientos_bodega'
        and t.tgname = 'trg_apply_movimiento_to_stock_actual'
    ) then
      execute 'create trigger trg_apply_movimiento_to_stock_actual
        after insert on public.movimientos_bodega
        for each row
        execute function public.apply_movimiento_to_stock_actual()';
    end if;
  end if;
end $$;
