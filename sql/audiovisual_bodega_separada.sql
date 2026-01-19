-- Separación lógica de Audiovisual (endpoints tipo “tablas”)
--
-- Objetivo:
-- - Exponer endpoints independientes para Audiovisual:
--     public.av_catalogo
--     public.av_movimientos_bodega
--     public.av_stock_actual_con_precio
-- - Mantener compatibilidad con el core (catalogo/movimientos_bodega/stock_actual_con_precio)
-- - Forzar bodega_principal='Audiovisual' en inserciones hechas desde el módulo AV.
--
-- Nota:
-- - Estas son VIEWS para mantener el ledger/compat existente.
-- - Para Supabase/PostgREST se consumen igual que tablas.

begin;

-- 1) Catálogo Audiovisual

do $$
begin
  if to_regclass('public.av_catalogo') is not null then
    execute 'drop trigger if exists trg_av_catalogo_insert_instead on public.av_catalogo';
  end if;
end$$;
drop function if exists public.trg_av_catalogo_insert_instead();
drop view if exists public.av_catalogo;

create or replace view public.av_catalogo as
select *
from public.catalogo
where coalesce(bodega_principal,'') = 'Audiovisual';

create or replace function public.trg_av_catalogo_insert_instead()
returns trigger
language plpgsql
as $$
begin
  -- Forzar el scope Audiovisual
  new.bodega_principal := 'Audiovisual';

  -- Insertar hacia catalogo (puede ser tabla o VIEW con INSTEAD OF)
  insert into public.catalogo(
    codigo,
    nombre,
    bodega_principal,
    bodega_secundaria,
    tipo_uso,
    tipo_material,
    color,
    dimensiones,
    precio_unitario,
    existencia,
    foto_url,
    es_contenedor,
    capacidad,
    campos_personalizados,
    creado_en,
    actualizado_en
  ) values (
    new.codigo,
    new.nombre,
    new.bodega_principal,
    new.bodega_secundaria,
    new.tipo_uso,
    new.tipo_material,
    new.color,
    new.dimensiones,
    new.precio_unitario,
    new.existencia,
    new.foto_url,
    new.es_contenedor,
    new.capacidad,
    new.campos_personalizados,
    coalesce(new.creado_en, now()),
    coalesce(new.actualizado_en, now())
  );

  return null;
end;
$$;

create trigger trg_av_catalogo_insert_instead
instead of insert on public.av_catalogo
for each row
execute function public.trg_av_catalogo_insert_instead();


-- 2) Movimientos Audiovisual

do $$
begin
  if to_regclass('public.av_movimientos_bodega') is not null then
    execute 'drop trigger if exists trg_av_movimientos_insert_instead on public.av_movimientos_bodega';
  end if;
end$$;
drop function if exists public.trg_av_movimientos_insert_instead();
drop view if exists public.av_movimientos_bodega;

create or replace view public.av_movimientos_bodega as
select *
from public.movimientos_bodega
where coalesce(bodega_principal,'') = 'Audiovisual';

create or replace function public.trg_av_movimientos_insert_instead()
returns trigger
language plpgsql
as $$
begin
  -- Forzar el scope Audiovisual
  new.bodega_principal := 'Audiovisual';

  insert into public.movimientos_bodega(
    material_codigo,
    material_nombre,
    bodega_principal,
    bodega_secundaria,
    tipo_movimiento,
    cantidad,
    signo,
    referencia_documento,
    referencia_tipo,
    responsable,
    fecha_movimiento,
    observaciones,
    estado,
    ubicacion_codigo,
    ubicacion_nombre,
    precio_unitario
  ) values (
    new.material_codigo,
    new.material_nombre,
    new.bodega_principal,
    new.bodega_secundaria,
    new.tipo_movimiento,
    new.cantidad,
    new.signo,
    new.referencia_documento,
    new.referencia_tipo,
    new.responsable,
    coalesce(new.fecha_movimiento, now()),
    new.observaciones,
    coalesce(new.estado, 'completado'),
    new.ubicacion_codigo,
    new.ubicacion_nombre,
    coalesce(new.precio_unitario, 0)
  );

  return null;
end;
$$;

create trigger trg_av_movimientos_insert_instead
instead of insert on public.av_movimientos_bodega
for each row
execute function public.trg_av_movimientos_insert_instead();


-- 3) Stock cache Audiovisual

drop view if exists public.av_stock_actual_con_precio;
create or replace view public.av_stock_actual_con_precio as
select *
from public.stock_actual_con_precio
where coalesce(bodega_principal,'') = 'Audiovisual';

commit;
