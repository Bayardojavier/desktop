-- alter_catalogo_hierros_para_formulario.sql
-- Objetivo: Agregar columnas faltantes al catalogo_hierros para que coincida con el formulario agregar_hierros.html
-- Fecha: 2026-01-14

begin;

alter table if exists public.catalogo_hierros
  add column if not exists contenedor text,
  add column if not exists contenedor_tipo text,
  add column if not exists tipo_alta text,
  add column if not exists apodo text,
  add column if not exists abreviacion text,
  add column if not exists peso numeric,
  add column if not exists precio_unitario numeric,
  add column if not exists notas text,
  add column if not exists nombre_base text,
  add column if not exists nombre_numero text,
  add column if not exists ua_accesorio_largo text;

-- Opcional (rendimiento): si cargas/ordenas contenedores por nombre frecuentemente
-- create index if not exists idx_cat_hierros_contenedor on public.catalogo_hierros (contenedor);

commit;
