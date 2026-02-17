-- Vistas para stock actual de cada catálogo, incluyendo precio, tipo_material y color
-- Calcula stock basado en movimientos_bodega_* (sum(cantidad * signo))
-- Agrupado por material_codigo, bodega_principal, bodega_secundaria

-- Stock para Hierros
drop view if exists stock_hierros;
create or replace view stock_hierros as
select
  movimientos_bodega_hierros.material_codigo,
  movimientos_bodega_hierros.material_nombre,
  coalesce(p.precio, 0) as precio,
  movimientos_bodega_hierros.bodega_principal,
  movimientos_bodega_hierros.bodega_secundaria,
  p.ubicacion_codigo as ubicacion_codigo,
  (sum(case when lower(tipo_movimiento) = 'ingreso' then cantidad else 0 end) - sum(case when lower(tipo_movimiento) = 'despacho' then cantidad else 0 end) + sum(case when lower(tipo_movimiento) = 'devolucion' then cantidad else 0 end)) as stock_actual,
  e.existencia,
  (sum(case when lower(tipo_movimiento) = 'despacho' then cantidad else 0 end) - sum(case when lower(tipo_movimiento) = 'devolucion' then cantidad else 0 end)) as fuera,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra,
  catalogo_hierros.tipo_material,
  catalogo_hierros.color
from movimientos_bodega_hierros
left join catalogo_hierros on catalogo_hierros.codigo = movimientos_bodega_hierros.material_codigo
left join (
  select material_codigo, coalesce(ubicacion_codigo, 'Sin Contenedor') as ubicacion_codigo, precio, ubicacion_nombre, fecha_compra
  from (
    select material_codigo, ubicacion_codigo, precio, ubicacion_nombre, fecha_compra, id,
    row_number() over (partition by material_codigo order by case when coalesce(ubicacion_codigo, 'Sin Contenedor') = 'Sin Contenedor' then 1 else 0 end, id desc) as rn
    from public.movimientos_bodega_hierros
  ) t
  where rn = 1
) p on movimientos_bodega_hierros.material_codigo = p.material_codigo
left join (
  select material_codigo, sum(case when lower(tipo_movimiento) = 'ingreso' then cantidad else 0 end) as existencia
  from movimientos_bodega_hierros
  group by material_codigo
) e on movimientos_bodega_hierros.material_codigo = e.material_codigo
group by movimientos_bodega_hierros.material_codigo, movimientos_bodega_hierros.material_nombre, movimientos_bodega_hierros.bodega_principal, movimientos_bodega_hierros.bodega_secundaria, p.ubicacion_codigo, p.precio, p.ubicacion_codigo, p.ubicacion_nombre, p.fecha_compra, catalogo_hierros.tipo_material, catalogo_hierros.color, e.existencia;

-- Stock para Audiovisual
drop view if exists stock_audiovisual;
create or replace view stock_audiovisual as
select
  movimientos_bodega_audiovisual.material_codigo,
  movimientos_bodega_audiovisual.material_nombre,
  coalesce(p.precio, 0) as precio,
  movimientos_bodega_audiovisual.bodega_principal,
  movimientos_bodega_audiovisual.bodega_secundaria,
  p.ubicacion_codigo as ubicacion_codigo,
  (sum(case when lower(tipo_movimiento) = 'ingreso' then cantidad else 0 end) - sum(case when lower(tipo_movimiento) = 'despacho' then cantidad else 0 end) + sum(case when lower(tipo_movimiento) = 'devolucion' then cantidad else 0 end)) as stock_actual,
  e.existencia,
  (sum(case when lower(tipo_movimiento) = 'despacho' then cantidad else 0 end) - sum(case when lower(tipo_movimiento) = 'devolucion' then cantidad else 0 end)) as fuera,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra,
  catalogo_audiovisual.tipo_material,
  catalogo_audiovisual.color
from movimientos_bodega_audiovisual
left join catalogo_audiovisual on catalogo_audiovisual.codigo = movimientos_bodega_audiovisual.material_codigo
left join (
  select material_codigo, coalesce(ubicacion_codigo, 'Sin Contenedor') as ubicacion_codigo, precio, ubicacion_nombre, fecha_compra
  from (
    select material_codigo, ubicacion_codigo, precio, ubicacion_nombre, fecha_compra, id,
    row_number() over (partition by material_codigo order by case when coalesce(ubicacion_codigo, 'Sin Contenedor') = 'Sin Contenedor' then 1 else 0 end, id desc) as rn
    from public.movimientos_bodega_audiovisual
  ) t
  where rn = 1
) p on movimientos_bodega_audiovisual.material_codigo = p.material_codigo
left join (
  select material_codigo, sum(case when lower(tipo_movimiento) = 'ingreso' then cantidad else 0 end) as existencia
  from movimientos_bodega_audiovisual
  group by material_codigo
) e on movimientos_bodega_audiovisual.material_codigo = e.material_codigo
group by movimientos_bodega_audiovisual.material_codigo, movimientos_bodega_audiovisual.material_nombre, movimientos_bodega_audiovisual.bodega_principal, movimientos_bodega_audiovisual.bodega_secundaria, p.ubicacion_codigo, p.precio, p.ubicacion_codigo, p.ubicacion_nombre, p.fecha_compra, catalogo_audiovisual.tipo_material, catalogo_audiovisual.color, e.existencia;

-- Stock para Consumibles
drop view if exists stock_consumibles;
create or replace view stock_consumibles as
select
  movimientos_bodega_consumibles.material_codigo,
  movimientos_bodega_consumibles.material_nombre,
  coalesce(p.precio, 0) as precio,
  movimientos_bodega_consumibles.bodega_principal,
  movimientos_bodega_consumibles.bodega_secundaria,
  p.ubicacion_codigo as ubicacion_codigo,
  (sum(case when lower(tipo_movimiento) = 'ingreso' then cantidad else 0 end) - sum(case when lower(tipo_movimiento) = 'despacho' then cantidad else 0 end) + sum(case when lower(tipo_movimiento) = 'devolucion' then cantidad else 0 end)) as stock_actual,
  e.existencia,
  (sum(case when lower(tipo_movimiento) = 'despacho' then cantidad else 0 end) - sum(case when lower(tipo_movimiento) = 'devolucion' then cantidad else 0 end)) as fuera,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra,
  catalogo_consumibles.tipo_material,
  catalogo_consumibles.color
from movimientos_bodega_consumibles
left join catalogo_consumibles on catalogo_consumibles.codigo = movimientos_bodega_consumibles.material_codigo
left join (
  select material_codigo, coalesce(ubicacion_codigo, 'Sin Contenedor') as ubicacion_codigo, precio, ubicacion_nombre, fecha_compra
  from (
    select material_codigo, ubicacion_codigo, precio, ubicacion_nombre, fecha_compra, id,
    row_number() over (partition by material_codigo order by case when coalesce(ubicacion_codigo, 'Sin Contenedor') = 'Sin Contenedor' then 1 else 0 end, id desc) as rn
    from public.movimientos_bodega_consumibles
  ) t
  where rn = 1
) p on movimientos_bodega_consumibles.material_codigo = p.material_codigo
left join (
  select material_codigo, sum(case when lower(tipo_movimiento) = 'ingreso' then cantidad else 0 end) as existencia
  from movimientos_bodega_consumibles
  group by material_codigo
) e on movimientos_bodega_consumibles.material_codigo = e.material_codigo
group by movimientos_bodega_consumibles.material_codigo, movimientos_bodega_consumibles.material_nombre, movimientos_bodega_consumibles.bodega_principal, movimientos_bodega_consumibles.bodega_secundaria, p.ubicacion_codigo, p.precio, p.ubicacion_codigo, p.ubicacion_nombre, p.fecha_compra, catalogo_consumibles.tipo_material, catalogo_consumibles.color, e.existencia;

-- Vista unificada de stock para todas las bodegas
-- Importante: si ya existe la TABLA cache public.stock_actual_con_precio, no crear una vista con el mismo nombre.
DO $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'stock_actual_con_precio'
      and c.relkind = 'r'
  ) then
    execute 'drop view if exists public.stock_actual_con_precio cascade';
    execute $v$
      create or replace view public.stock_actual_con_precio as
      select
        material_codigo,
        material_nombre,
        precio,
        stock_actual,
        existencia,
        fuera,
        bodega_principal,
        bodega_secundaria,
        contenedor,
        ubicacion_nombre,
        fecha_compra,
        ''hierros'' as tabla_origen
      from stock_hierros
      where stock_actual > 0

      union all

      select
        material_codigo,
        material_nombre,
        precio,
        stock_actual,
        existencia,
        fuera,
        bodega_principal,
        bodega_secundaria,
        contenedor,
        ubicacion_nombre,
        fecha_compra,
        ''audiovisual'' as tabla_origen
      from stock_audiovisual
      where stock_actual > 0

      union all

      select
        material_codigo,
        material_nombre,
        precio,
        stock_actual,
        existencia,
        fuera,
        bodega_principal,
        bodega_secundaria,
        contenedor,
        ubicacion_nombre,
        fecha_compra,
        ''consumibles'' as tabla_origen
      from stock_consumibles
      where stock_actual > 0
    $v$;
  end if;
end $$;