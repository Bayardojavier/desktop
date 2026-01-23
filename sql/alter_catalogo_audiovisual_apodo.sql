-- alter_catalogo_audiovisual_apodo.sql
-- Objetivo: Agregar columna apodo (display) para contenedores.
-- Fecha: 2026-01-13

begin;

alter table if exists public.catalogo_audiovisual
  add column if not exists apodo text;

commit;
