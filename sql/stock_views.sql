-- Vistas para stock actual de cada catálogo, incluyendo precio y detalles adicionales
-- Calcula stock basado en movimientos_bodega_* (sum(cantidad * signo))
-- Agrupado por material_codigo, con info del último movimiento

-- Stock para Hierros
drop view if exists stock_hierros;
create or replace view stock_hierros as
select
  s.material_codigo,
  s.material_nombre,
  coalesce(p.precio, 0) as precio,
  s.stock_actual,
  p.bodega_principal,
  p.bodega_secundaria,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra
from (
  select
    material_codigo,
    material_nombre,
    sum(cantidad * signo) as stock_actual
  from public.movimientos_bodega_hierros
  group by material_codigo, material_nombre
) s
left join (
  select distinct on (material_codigo) material_codigo, precio, bodega_principal, bodega_secundaria, ubicacion_codigo, ubicacion_nombre, fecha_compra
  from public.movimientos_bodega_hierros
  order by material_codigo, id desc
) p on s.material_codigo = p.material_codigo;

-- Stock para Audiovisual
drop view if exists stock_audiovisual;
create or replace view stock_audiovisual as
select
  s.material_codigo,
  s.material_nombre,
  coalesce(p.precio, 0) as precio,
  s.stock_actual,
  p.bodega_principal,
  p.bodega_secundaria,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra
from (
  select
    material_codigo,
    material_nombre,
    sum(cantidad * signo) as stock_actual
  from public.movimientos_bodega_audiovisual
  group by material_codigo, material_nombre
) s
left join (
  select distinct on (material_codigo) material_codigo, precio, bodega_principal, bodega_secundaria, ubicacion_codigo, ubicacion_nombre, fecha_compra
  from public.movimientos_bodega_audiovisual
  order by material_codigo, id desc
) p on s.material_codigo = p.material_codigo;

-- Stock para Consumibles
drop view if exists stock_consumibles;
create or replace view stock_consumibles as
select
  s.material_codigo,
  s.material_nombre,
  coalesce(p.precio, 0) as precio,
  s.stock_actual,
  p.bodega_principal,
  p.bodega_secundaria,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra
from (
  select
    material_codigo,
    material_nombre,
    sum(cantidad * signo) as stock_actual
  from public.movimientos_bodega_consumibles
  group by material_codigo, material_nombre
) s
left join (
  select distinct on (material_codigo) material_codigo, precio, bodega_principal, bodega_secundaria, ubicacion_codigo, ubicacion_nombre, fecha_compra
  from public.movimientos_bodega_consumibles
  order by material_codigo, id desc
) p on s.material_codigo = p.material_codigo;