-- alter_catalogo_audiovisual_para_formulario.sql
-- Objetivo: Agregar columnas faltantes al catalogo_audiovisual para que coincida con el formulario agregar_audiovisual.html
-- Fecha: 2026-01-13

begin;

-- Agregar columnas faltantes
alter table if exists public.catalogo_audiovisual
  add column if not exists contenedor text,
  add column if not exists contenedor_tipo text,
  add column if not exists tipo_alta text,
  add column if not exists abreviacion text,
  add column if not exists peso numeric,
  add column if not exists precio_unitario numeric,
  add column if not exists notas text;

-- Nota: dimensiones ya es jsonb, ancho/largo/grosor se insertarán ahí.
-- campos_personalizados ya existe para campos_extra.
-- es_contenedor ya existe, pero tipo_alta puede usarse para eso.

commit;