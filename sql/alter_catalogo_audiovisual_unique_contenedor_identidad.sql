begin;

-- =============================================================================
-- Identidad única de contenedores (Audiovisual)
-- Regla: NO permitir duplicados de (bodega_secundaria, nombre_base, nombre_numero)
--
-- Nota:
-- - Usamos índice UNIQUE PARCIAL para aplicar solo cuando los 3 campos están llenos.
-- - Si ya existen duplicados, este CREATE UNIQUE INDEX fallará; en ese caso hay que
--   limpiar/renombrar los duplicados antes de volver a correr.
-- =============================================================================

-- (Opcional) Chequeo rápido de duplicados (ejecutar para ver si hay conflictos):
-- select bodega_secundaria, nombre_base, nombre_numero, count(*)
-- from public.catalogo_audiovisual
-- where bodega_secundaria is not null
--   and nombre_base is not null
--   and nombre_numero is not null
-- group by 1,2,3
-- having count(*) > 1;

create unique index if not exists uq_cat_audiovisual_contenedor_identidad
  on public.catalogo_audiovisual (bodega_secundaria, nombre_base, nombre_numero)
  where bodega_secundaria is not null
    and nombre_base is not null
    and nombre_numero is not null;

commit;
