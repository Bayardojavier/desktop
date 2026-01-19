-- normalizar_movimientos_case_nombre.sql
-- Objetivo:
--   En movimientos, dejar el material_nombre SIN sufijo "- 01", "- 02", etc.
--   para items creados como hijos de un Case (referencia_tipo alta_unidad_case/alta_modulo_case).
--
-- Qué hace:
--   "Modulo P3.9 - 01"  -> "Modulo P3.9"
--   "Pantalla - 12"     -> "Pantalla" (solo si es movimiento de alta de Case)
--
-- Seguridad:
-- - SOLO afecta filas con referencia_tipo en ('alta_unidad_case','alta_modulo_case').
-- - SOLO recorta si el sufijo final cumple el patrón: espacio-guion-espacio + 2 dígitos.
-- - Recomendado: ejecutar primero los SELECT de preview.

begin;

-- =====================
-- PREVIEW (conteos)
-- =====================
-- Audiovisual
select
  'audiovisual' as tabla,
  count(*) as filas_a_tocar
from public.movimientos_bodega_audiovisual
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

-- Hierros
select
  'hierros' as tabla,
  count(*) as filas_a_tocar
from public.movimientos_bodega_hierros
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

-- Consumibles
select
  'consumibles' as tabla,
  count(*) as filas_a_tocar
from public.movimientos_bodega_consumibles
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

-- =====================
-- UPDATE
-- =====================
update public.movimientos_bodega_audiovisual
set material_nombre = regexp_replace(material_nombre, '\\s-\\s\\d{2}$', '', 'i')
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

update public.movimientos_bodega_hierros
set material_nombre = regexp_replace(material_nombre, '\\s-\\s\\d{2}$', '', 'i')
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

update public.movimientos_bodega_consumibles
set material_nombre = regexp_replace(material_nombre, '\\s-\\s\\d{2}$', '', 'i')
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

-- =====================
-- POSTVIEW (muestras)
-- =====================
-- Muestra algunos ejemplos para verificar
select id, material_codigo, material_nombre, referencia_tipo, fecha_movimiento
from public.movimientos_bodega_audiovisual
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
order by id desc
limit 20;

commit;
