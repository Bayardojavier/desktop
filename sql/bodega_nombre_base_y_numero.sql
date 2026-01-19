-- bodega_nombre_base_y_numero.sql
-- Objetivo:
--   Separar el nombre en 2 columnas (base + número) para NO perder control,
--   pero mantener compatibilidad con el flujo actual.
--
-- Diseño propuesto:
--   Catálogo:   nombre (display) + nombre_base + nombre_numero
--   Movimientos: material_nombre (para sumar/agrupación) + material_nombre_numero
--               (y opcional material_nombre_base si lo quieres explícito)
--
-- Notas:
-- - Este script es seguro (IF NOT EXISTS).
-- - Incluye backfill para movimientos de alta de Case si ya existen.

begin;

-- =====================
-- 1) ALTER: Catálogo
-- =====================
alter table if exists public.catalogo_audiovisual
  add column if not exists nombre_base text,
  add column if not exists nombre_numero text;

alter table if exists public.catalogo_hierros
  add column if not exists nombre_base text,
  add column if not exists nombre_numero text;

alter table if exists public.catalogo_consumibles
  add column if not exists nombre_base text,
  add column if not exists nombre_numero text;

-- =====================
-- 2) ALTER: Movimientos
-- =====================
alter table if exists public.movimientos_bodega_audiovisual
  add column if not exists material_nombre_base text,
  add column if not exists material_nombre_numero text;

alter table if exists public.movimientos_bodega_hierros
  add column if not exists material_nombre_base text,
  add column if not exists material_nombre_numero text;

alter table if exists public.movimientos_bodega_consumibles
  add column if not exists material_nombre_base text,
  add column if not exists material_nombre_numero text;

-- =====================
-- 3) BACKFILL (Movimientos existentes de Case)
--    - base: quita " - 01" al final
--    - numero: extrae "01" al final
-- =====================
-- Audiovisual
update public.movimientos_bodega_audiovisual
set
  material_nombre_base = regexp_replace(material_nombre, '\\s-\\s\\d{2}$', '', 'i'),
  material_nombre_numero = substring(material_nombre from '(?i)\\s-\\s(\\d{2})$')
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

-- Hierros
update public.movimientos_bodega_hierros
set
  material_nombre_base = regexp_replace(material_nombre, '\\s-\\s\\d{2}$', '', 'i'),
  material_nombre_numero = substring(material_nombre from '(?i)\\s-\\s(\\d{2})$')
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

-- Consumibles
update public.movimientos_bodega_consumibles
set
  material_nombre_base = regexp_replace(material_nombre, '\\s-\\s\\d{2}$', '', 'i'),
  material_nombre_numero = substring(material_nombre from '(?i)\\s-\\s(\\d{2})$')
where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
  and material_nombre ~* '\\s-\\s\\d{2}$';

-- =====================
-- 4) OPCIONAL: normalizar material_nombre para sumar
--    Si quieres que el campo material_nombre quede como el BASE (sin -01)
--    para que SUME automáticamente por nombre en reportes simples,
--    descomenta este bloque.
-- =====================
-- update public.movimientos_bodega_audiovisual
-- set material_nombre = material_nombre_base
-- where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
--   and material_nombre_base is not null;
--
-- update public.movimientos_bodega_hierros
-- set material_nombre = material_nombre_base
-- where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
--   and material_nombre_base is not null;
--
-- update public.movimientos_bodega_consumibles
-- set material_nombre = material_nombre_base
-- where referencia_tipo in ('alta_unidad_case', 'alta_modulo_case')
--   and material_nombre_base is not null;

commit;
