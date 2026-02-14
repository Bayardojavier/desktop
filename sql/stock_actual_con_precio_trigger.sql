-- Mantener stock_actual_con_precio como cache derivada de movimientos_bodega
-- Objetivo: que el frontend NO haga updates directos al stock; el stock se actualiza por trigger.

create extension if not exists pgcrypto;

-- Si existe una vista con el mismo nombre, eliminarla para crear la tabla
-- (No usar DROP VIEW IF EXISTS directo porque falla si el objeto es una TABLA)
DO $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'stock_actual_con_precio'
      and c.relkind in ('v','m')
  ) then
    execute 'drop view if exists public.stock_actual_con_precio cascade';
  end if;
end $$;

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
  j jsonb;
  v_codigo text;
  v_nombre text;
  v_bodega text;
  v_bodega_missing boolean;
  v_bodega2 text;
  v_bodega2_missing boolean;
  v_qty numeric;
  v_signo numeric;
  v_signo_txt text;
  v_delta numeric;
  v_precio numeric;
begin
  j := to_jsonb(new);

  v_codigo := nullif(trim(coalesce(j->>'material_codigo','')), '');
  if v_codigo is null then
    return new;
  end if;

  v_nombre := nullif(trim(coalesce(j->>'material_nombre','')), '');

  v_bodega_missing := (nullif(trim(coalesce(j->>'bodega_principal','')), '') is null);
  v_bodega2_missing := (nullif(trim(coalesce(j->>'bodega_secundaria','')), '') is null);

  v_bodega := coalesce(nullif(trim(coalesce(j->>'bodega_principal','')), ''), 'Principal');
  v_bodega2 := coalesce(nullif(trim(coalesce(j->>'bodega_secundaria','')), ''), 'General');

  -- Si el movimiento no trae bodega_principal (histórico o inserciones antiguas),
  -- inferir una bodega coherente según la tabla origen del trigger.
  if v_bodega_missing then
    if TG_TABLE_NAME = 'movimientos_bodega_hierros' then
      v_bodega := 'Hierros';
    elsif TG_TABLE_NAME = 'movimientos_bodega_audiovisual' then
      v_bodega := 'Audiovisual';
    elsif TG_TABLE_NAME = 'movimientos_bodega_consumibles' then
      v_bodega := 'Consumibles';
    end if;
  end if;

  begin
    v_qty := coalesce(nullif(j->>'cantidad','')::numeric, 0);
  exception when others then
    v_qty := 0;
  end;

  v_signo_txt := nullif(trim(coalesce(j->>'signo','')), '');
  if v_signo_txt is null then
    v_signo := 1;
  elsif v_signo_txt in ('-','-1') then
    v_signo := -1;
  elsif v_signo_txt in ('+','1') then
    v_signo := 1;
  else
    begin
      v_signo := v_signo_txt::numeric;
    exception when others then
      v_signo := 1;
    end;
  end if;

  v_delta := v_qty * v_signo;
  -- Aceptar tanto 'precio_unitario' como 'precio' sin romper si la columna no existe
  begin
    v_precio := coalesce(nullif(j->>'precio_unitario','')::numeric, nullif(j->>'precio','')::numeric, 0);
  exception when others then
    v_precio := 0;
  end;

  insert into public.stock_actual_con_precio (material_codigo, material_nombre, bodega_principal, bodega_secundaria, existencia, precio_promedio, updated_at)
  values (
    v_codigo,
    v_nombre,
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

-- Crear triggers para tablas de movimientos (por bodega y genérica) con filtro por estado si existe
DO $$
declare
  tname text;
  tables_to_check text[] := array[
    'movimientos_bodega',
    'movimientos_bodega_hierros',
    'movimientos_bodega_audiovisual',
    'movimientos_bodega_consumibles'
  ];
  has_estado boolean;
begin
  foreach tname in array tables_to_check loop
    if exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = tname
        and c.relkind = 'r'
    ) then
      -- Asegurar columnas mínimas para bodega (si no existían en versiones anteriores)
      begin
        execute format('alter table public.%I add column if not exists bodega_principal text', tname);
      exception when others then null;
      end;
      begin
        execute format('alter table public.%I add column if not exists bodega_secundaria text', tname);
        execute format('alter table public.%I alter column bodega_principal set default ''Principal''', tname);
        execute format('alter table public.%I alter column bodega_secundaria set default ''General''', tname);
      exception when others then null;
      end;

      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = tname
          and column_name = 'estado'
      ) into has_estado;

      -- AFTER INSERT
      begin
        execute format('drop trigger if exists trg_apply_movimiento_to_stock_actual on public.%I', tname);
      exception when others then null;
      end;
      if has_estado then
        execute format(
          'create trigger trg_apply_movimiento_to_stock_actual after insert on public.%I for each row when (coalesce(new.estado, ''completado'') = ''completado'') execute function public.apply_movimiento_to_stock_actual()',
          tname
        );
      else
        execute format(
          'create trigger trg_apply_movimiento_to_stock_actual after insert on public.%I for each row execute function public.apply_movimiento_to_stock_actual()',
          tname
        );
      end if;

      -- AFTER UPDATE OF estado (si existe): cuando pase a completado
      if has_estado then
        begin
          execute format('drop trigger if exists trg_apply_movimiento_to_stock_actual_estado on public.%I', tname);
        exception when others then null;
        end;
        execute format(
          'create trigger trg_apply_movimiento_to_stock_actual_estado after update of estado on public.%I for each row when (coalesce(new.estado, ''completado'') = ''completado'' and (coalesce(old.estado, ''completado'') is distinct from ''completado'')) execute function public.apply_movimiento_to_stock_actual()',
          tname
        );
      end if;
    end if;
  end loop;
end $$;
