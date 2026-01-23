begin;

-- =============================================================================
-- Audiovisual: ID estable en catálogo + FK desde movimientos
-- Objetivo: poder cambiar codigo/nombre/datos del material sin afectar movimientos.
--
-- 1) Agrega public.catalogo_audiovisual.id (bigserial) y asegura unicidad (PK o UNIQUE).
-- 2) Agrega public.movimientos_bodega_audiovisual.catalogo_id (bigint).
-- 3) Backfill de catalogo_id usando match por material_codigo = catalogo.codigo.
-- 4) Crea FK (ON DELETE SET NULL) para conservar historial si borran el material.
-- =============================================================================

-- 1) Catálogo: columna id + PK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalogo_audiovisual'
      AND column_name = 'id'
  ) THEN
    ALTER TABLE public.catalogo_audiovisual
      ADD COLUMN id bigserial;
  END IF;
END $$;

-- Asegurar que exista secuencia/default y que filas existentes tengan id
DO $$
DECLARE
  seq_name text;
BEGIN
  seq_name := pg_get_serial_sequence('public.catalogo_audiovisual', 'id');

  IF seq_name IS NULL THEN
    -- Si la columna ya existía sin ser serial, creamos secuencia y default.
    seq_name := 'public.catalogo_audiovisual_id_seq';
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS public.catalogo_audiovisual_id_seq';
    EXECUTE 'ALTER TABLE public.catalogo_audiovisual ALTER COLUMN id SET DEFAULT nextval(''public.catalogo_audiovisual_id_seq'')';
  END IF;

  EXECUTE format(
    'UPDATE public.catalogo_audiovisual SET id = nextval(%L) WHERE id IS NULL',
    seq_name
  );
END $$;

ALTER TABLE public.catalogo_audiovisual
  ALTER COLUMN id SET NOT NULL;

-- Si la tabla ya tiene otro PK (ej: por codigo), no podremos cambiarlo aquí.
-- Para que la FK funcione, id debe ser UNIQUE o PK.
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalogo_audiovisual_id
  ON public.catalogo_audiovisual (id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.catalogo_audiovisual'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.catalogo_audiovisual
      ADD CONSTRAINT catalogo_audiovisual_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- 2) Movimientos: columna catalogo_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movimientos_bodega_audiovisual'
      AND column_name = 'catalogo_id'
  ) THEN
    ALTER TABLE public.movimientos_bodega_audiovisual
      ADD COLUMN catalogo_id bigint;
  END IF;
END $$;

-- 3) Backfill catalogo_id con match por codigo
UPDATE public.movimientos_bodega_audiovisual m
SET catalogo_id = c.id
FROM public.catalogo_audiovisual c
WHERE m.catalogo_id IS NULL
  AND m.material_codigo IS NOT NULL
  AND c.codigo = m.material_codigo;

CREATE INDEX IF NOT EXISTS idx_mov_audiovisual_catalogo_id
  ON public.movimientos_bodega_audiovisual (catalogo_id);

-- 4) FK (best practice: si borran el material, no se borra el movimiento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mov_audiovisual_catalogo_id_fkey'
  ) THEN
    ALTER TABLE public.movimientos_bodega_audiovisual
      ADD CONSTRAINT mov_audiovisual_catalogo_id_fkey
      FOREIGN KEY (catalogo_id)
      REFERENCES public.catalogo_audiovisual(id)
      ON UPDATE RESTRICT
      ON DELETE SET NULL;
  END IF;
END $$;

commit;
