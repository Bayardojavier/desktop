-- Insertar movimientos de ingreso para todos los códigos del catálogo audiovisual
-- Cantidad: 1 para cada material
INSERT INTO movimientos_bodega_audiovisual (
  material_codigo,
  material_nombre,
  bodega_principal,
  bodega_secundaria,
  ubicacion_codigo,
  ubicacion_nombre,
  tipo_movimiento,
  cantidad,
  signo,
  referencia_documento,
  referencia_tipo,
  responsable,
  fecha_movimiento,
  observaciones,
  estado,
  material_nombre_base,
  material_nombre_numero,
  catalogo_id,
  precio,
  fecha_compra
)
SELECT
  c.codigo as material_codigo,
  c.nombre as material_nombre,
  c.bodega_principal,
  c.bodega_secundaria,
  c.contenedor as ubicacion_codigo,
  c.contenedor as ubicacion_nombre,
  'ingreso' as tipo_movimiento,
  1 as cantidad,
  1 as signo,
  'INGRESO INICIAL LUCES LED' as referencia_documento,
  'INVENTARIO' as referencia_tipo,
  'SISTEMA' as responsable,
  CURRENT_DATE as fecha_movimiento,
  'Ingreso inicial de materiales de iluminación LED' as observaciones,
  'completado' as estado,
  c.nombre_base as material_nombre_base,
  c.nombre_numero as material_nombre_numero,
  c.id as catalogo_id,
  COALESCE(c.precio, 0) as precio,
  c.fecha_compra
FROM catalogo_audiovisual c
WHERE c.codigo IN (
  '00485-AUDI-LUCE-ESTA-01',
  '00486-AUDI-LUCE-ESTA-01-LED-LLP-01',
  '00487-AUDI-LUCE-ESTA-01-LED-LLP-02',
  '00488-AUDI-LUCE-ESTA-01-LED-LLP-03',
  '00489-AUDI-LUCE-ESTA-01-LED-LLP-04',
  '00490-AUDI-LUCE-ESTA-01-LED-LLP-05',
  '00491-AUDI-LUCE-ESTA-01-LED-LLP-06',
  '00492-AUDI-LUCE-ESTA-01-LED-LLP-07',
  '00493-AUDI-LUCE-ESTA-01-LED-LLP-08',
  '00494-AUDI-LUCE-ESTA-01-LED-LLP-09',
  '00495-AUDI-LUCE-ESTA-01-LED-LLP-10',
  '00496-AUDI-LUCE-ESTA-01-LED-LLP-11',
  '00497-AUDI-LUCE-ESTA-01-LED-LLP-12',
  '00498-AUDI-LUCE-ESTA-01-LED-LLP-13',
  '00499-AUDI-LUCE-ESTA-01-LED-LLP-14',
  '00500-AUDI-LUCE-ESTA-01-LED-LLP-15',
  '00501-AUDI-LUCE-ESTA-01-LED-LLP-16',
  '00502-AUDI-LUCE-ESTA-01-LED-LLP-17',
  '00503-AUDI-LUCE-ESTA-01-LED-LLP-18',
  '00504-AUDI-LUCE-ESTA-01-LED-LLP-19',
  '00505-AUDI-LUCE-ESTA-01-LED-LLP-20',
  '00506-AUDI-LUCE-ESTA-01-LED-LLP-21',
  '00507-AUDI-LUCE-ESTA-01-LED-LLP-22',
  '00508-AUDI-LUCE-ESTA-01-LED-LLP-23',
  '00509-AUDI-LUCE-ESTA-01-LED-LLG-01'
);

-- Verificar que se insertaron correctamente
SELECT COUNT(*) as movimientos_insertados
FROM movimientos_bodega_audiovisual
WHERE referencia_documento = 'INGRESO INICIAL LUCES LED'
  AND tipo_movimiento = 'ingreso'
  AND fecha_movimiento = CURRENT_DATE;