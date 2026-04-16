-- Ajusta las vistas de stock para que los traslados internos a kits,
-- registrados como tipo_movimiento = 'baja', descuenten existencias
-- igual que ya ocurre en stock_consumibles.

create or replace view public.stock_hierros as
select
  movimientos_bodega_hierros.material_codigo,
  movimientos_bodega_hierros.material_nombre,
  coalesce(p.precio, 0::numeric) as precio,
  movimientos_bodega_hierros.bodega_principal,
  movimientos_bodega_hierros.bodega_secundaria,
  p.ubicacion_codigo,
  sum(
    case
      when lower(movimientos_bodega_hierros.tipo_movimiento) = 'ingreso'::text then movimientos_bodega_hierros.cantidad
      else 0::numeric
    end
  ) - sum(
    case
      when lower(movimientos_bodega_hierros.tipo_movimiento) = 'despacho'::text then movimientos_bodega_hierros.cantidad
      else 0::numeric
    end
  ) + sum(
    case
      when lower(movimientos_bodega_hierros.tipo_movimiento) = 'devolucion'::text then movimientos_bodega_hierros.cantidad
      else 0::numeric
    end
  ) - sum(
    case
      when lower(movimientos_bodega_hierros.tipo_movimiento) = 'baja'::text then movimientos_bodega_hierros.cantidad
      else 0::numeric
    end
  ) as stock_actual,
  e.existencia,
  sum(
    case
      when lower(movimientos_bodega_hierros.tipo_movimiento) = 'despacho'::text then movimientos_bodega_hierros.cantidad
      else 0::numeric
    end
  ) - sum(
    case
      when lower(movimientos_bodega_hierros.tipo_movimiento) = 'devolucion'::text then movimientos_bodega_hierros.cantidad
      else 0::numeric
    end
  ) as fuera,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra,
  catalogo_hierros.tipo_material,
  catalogo_hierros.color,
  sum(
    case
      when lower(movimientos_bodega_hierros.tipo_movimiento) = 'baja'::text then movimientos_bodega_hierros.cantidad
      else 0::numeric
    end
  ) as total_bajas
from
  movimientos_bodega_hierros
  left join catalogo_hierros on catalogo_hierros.codigo = movimientos_bodega_hierros.material_codigo
  left join (
    select
      t.material_codigo,
      coalesce(t.ubicacion_codigo, 'Sin Contenedor'::text) as ubicacion_codigo,
      t.precio,
      t.ubicacion_nombre,
      t.fecha_compra
    from
      (
        select
          movimientos_bodega_hierros_1.material_codigo,
          movimientos_bodega_hierros_1.ubicacion_codigo,
          movimientos_bodega_hierros_1.precio,
          movimientos_bodega_hierros_1.ubicacion_nombre,
          movimientos_bodega_hierros_1.fecha_compra,
          movimientos_bodega_hierros_1.id,
          row_number() over (
            partition by movimientos_bodega_hierros_1.material_codigo
            order by
              (
                case
                  when coalesce(movimientos_bodega_hierros_1.ubicacion_codigo, 'Sin Contenedor'::text) = 'Sin Contenedor'::text then 1
                  else 0
                end
              ),
              movimientos_bodega_hierros_1.id desc
          ) as rn
        from movimientos_bodega_hierros movimientos_bodega_hierros_1
      ) t
    where t.rn = 1
  ) p on movimientos_bodega_hierros.material_codigo = p.material_codigo
  left join (
    select
      movimientos_bodega_hierros_1.material_codigo,
      sum(
        case
          when lower(movimientos_bodega_hierros_1.tipo_movimiento) = 'ingreso'::text then movimientos_bodega_hierros_1.cantidad
          else 0::numeric
        end
      ) - sum(
        case
          when lower(movimientos_bodega_hierros_1.tipo_movimiento) = 'baja'::text then movimientos_bodega_hierros_1.cantidad
          else 0::numeric
        end
      ) as existencia
    from movimientos_bodega_hierros movimientos_bodega_hierros_1
    group by movimientos_bodega_hierros_1.material_codigo
  ) e on movimientos_bodega_hierros.material_codigo = e.material_codigo
group by
  movimientos_bodega_hierros.material_codigo,
  movimientos_bodega_hierros.material_nombre,
  movimientos_bodega_hierros.bodega_principal,
  movimientos_bodega_hierros.bodega_secundaria,
  p.ubicacion_codigo,
  p.precio,
  p.ubicacion_nombre,
  p.fecha_compra,
  catalogo_hierros.tipo_material,
  catalogo_hierros.color,
  e.existencia;


create or replace view public.stock_audiovisual as
select
  movimientos_bodega_audiovisual.material_codigo,
  movimientos_bodega_audiovisual.material_nombre,
  coalesce(p.precio, 0::numeric) as precio,
  movimientos_bodega_audiovisual.bodega_principal,
  movimientos_bodega_audiovisual.bodega_secundaria,
  p.ubicacion_codigo,
  sum(
    case
      when lower(movimientos_bodega_audiovisual.tipo_movimiento) = 'ingreso'::text then movimientos_bodega_audiovisual.cantidad
      else 0::numeric
    end
  ) - sum(
    case
      when lower(movimientos_bodega_audiovisual.tipo_movimiento) = 'despacho'::text then movimientos_bodega_audiovisual.cantidad
      else 0::numeric
    end
  ) + sum(
    case
      when lower(movimientos_bodega_audiovisual.tipo_movimiento) = 'devolucion'::text then movimientos_bodega_audiovisual.cantidad
      else 0::numeric
    end
  ) - sum(
    case
      when lower(movimientos_bodega_audiovisual.tipo_movimiento) = 'baja'::text then movimientos_bodega_audiovisual.cantidad
      else 0::numeric
    end
  ) as stock_actual,
  e.existencia,
  sum(
    case
      when lower(movimientos_bodega_audiovisual.tipo_movimiento) = 'despacho'::text then movimientos_bodega_audiovisual.cantidad
      else 0::numeric
    end
  ) - sum(
    case
      when lower(movimientos_bodega_audiovisual.tipo_movimiento) = 'devolucion'::text then movimientos_bodega_audiovisual.cantidad
      else 0::numeric
    end
  ) as fuera,
  p.ubicacion_codigo as contenedor,
  p.ubicacion_nombre,
  p.fecha_compra,
  catalogo_audiovisual.tipo_material,
  catalogo_audiovisual.color,
  sum(
    case
      when lower(movimientos_bodega_audiovisual.tipo_movimiento) = 'baja'::text then movimientos_bodega_audiovisual.cantidad
      else 0::numeric
    end
  ) as total_bajas
from
  movimientos_bodega_audiovisual
  left join catalogo_audiovisual on catalogo_audiovisual.codigo = movimientos_bodega_audiovisual.material_codigo
  left join (
    select
      t.material_codigo,
      coalesce(t.ubicacion_codigo, 'Sin Contenedor'::text) as ubicacion_codigo,
      t.precio,
      t.ubicacion_nombre,
      t.fecha_compra
    from
      (
        select
          movimientos_bodega_audiovisual_1.material_codigo,
          movimientos_bodega_audiovisual_1.ubicacion_codigo,
          movimientos_bodega_audiovisual_1.precio,
          movimientos_bodega_audiovisual_1.ubicacion_nombre,
          movimientos_bodega_audiovisual_1.fecha_compra,
          movimientos_bodega_audiovisual_1.id,
          row_number() over (
            partition by movimientos_bodega_audiovisual_1.material_codigo
            order by
              (
                case
                  when coalesce(movimientos_bodega_audiovisual_1.ubicacion_codigo, 'Sin Contenedor'::text) = 'Sin Contenedor'::text then 1
                  else 0
                end
              ),
              movimientos_bodega_audiovisual_1.id desc
          ) as rn
        from movimientos_bodega_audiovisual movimientos_bodega_audiovisual_1
      ) t
    where t.rn = 1
  ) p on movimientos_bodega_audiovisual.material_codigo = p.material_codigo
  left join (
    select
      movimientos_bodega_audiovisual_1.material_codigo,
      sum(
        case
          when lower(movimientos_bodega_audiovisual_1.tipo_movimiento) = 'ingreso'::text then movimientos_bodega_audiovisual_1.cantidad
          else 0::numeric
        end
      ) - sum(
        case
          when lower(movimientos_bodega_audiovisual_1.tipo_movimiento) = 'baja'::text then movimientos_bodega_audiovisual_1.cantidad
          else 0::numeric
        end
      ) as existencia
    from movimientos_bodega_audiovisual movimientos_bodega_audiovisual_1
    group by movimientos_bodega_audiovisual_1.material_codigo
  ) e on movimientos_bodega_audiovisual.material_codigo = e.material_codigo
group by
  movimientos_bodega_audiovisual.material_codigo,
  movimientos_bodega_audiovisual.material_nombre,
  movimientos_bodega_audiovisual.bodega_principal,
  movimientos_bodega_audiovisual.bodega_secundaria,
  p.ubicacion_codigo,
  p.precio,
  p.ubicacion_nombre,
  p.fecha_compra,
  catalogo_audiovisual.tipo_material,
  catalogo_audiovisual.color,
  e.existencia;