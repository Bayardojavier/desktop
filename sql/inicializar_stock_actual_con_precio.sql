-- Inicializar stock_actual_con_precio con datos actuales de todas las bodegas
-- Ejecutar esto UNA VEZ después de crear la tabla y triggers, para poblar con stock existente

-- Limpiar tabla (opcional, si quieres empezar desde cero)
-- DELETE FROM public.stock_actual_con_precio;

-- Insertar desde las vistas de stock (que calculan stock actual > 0)
INSERT INTO public.stock_actual_con_precio (
  material_codigo,
  material_nombre,
  bodega_principal,
  bodega_secundaria,
  existencia,
  precio_promedio,
  updated_at
)
SELECT
  material_codigo,
  material_nombre,
  bodega_principal,
  bodega_secundaria,
  stock_actual,
  precio,
  now()
FROM (
  -- Hierros
  SELECT
    material_codigo,
    material_nombre,
    coalesce(bodega_principal, 'Principal') as bodega_principal,
    coalesce(bodega_secundaria, 'General') as bodega_secundaria,
    stock_actual,
    coalesce(precio, 0) as precio
  FROM stock_hierros
  WHERE stock_actual > 0

  UNION ALL

  -- Audiovisual
  SELECT
    material_codigo,
    material_nombre,
    coalesce(bodega_principal, 'Principal') as bodega_principal,
    coalesce(bodega_secundaria, 'General') as bodega_secundaria,
    stock_actual,
    coalesce(precio, 0) as precio
  FROM stock_audiovisual
  WHERE stock_actual > 0

  UNION ALL

  -- Consumibles
  SELECT
    material_codigo,
    material_nombre,
    coalesce(bodega_principal, 'Principal') as bodega_principal,
    coalesce(bodega_secundaria, 'General') as bodega_secundaria,
    stock_actual,
    coalesce(precio, 0) as precio
  FROM stock_consumibles
  WHERE stock_actual > 0
) AS all_stock
ON CONFLICT (material_codigo, bodega_principal, bodega_secundaria)
DO UPDATE SET
  material_nombre = EXCLUDED.material_nombre,
  existencia = EXCLUDED.existencia,
  precio_promedio = EXCLUDED.precio_promedio,
  updated_at = EXCLUDED.updated_at;

-- Verificar resultado
SELECT count(*) as total_materiales_en_cache FROM public.stock_actual_con_precio;