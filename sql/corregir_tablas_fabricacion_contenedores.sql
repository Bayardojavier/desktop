-- ============================================
-- CORRECCIÓN TABLA materiales_producidos_fabricacion
-- Agrega columnas de contenedor que faltan
-- ============================================

-- Verificar si la columna 'contenedor' existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiales_producidos_fabricacion' 
    AND column_name = 'contenedor'
  ) THEN
    ALTER TABLE materiales_producidos_fabricacion 
    ADD COLUMN contenedor TEXT;
    RAISE NOTICE 'Columna contenedor agregada a materiales_producidos_fabricacion';
  ELSE
    RAISE NOTICE 'La columna contenedor ya existe en materiales_producidos_fabricacion';
  END IF;
END $$;

-- Verificar si la columna 'contenedor_tipo' existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiales_producidos_fabricacion' 
    AND column_name = 'contenedor_tipo'
  ) THEN
    ALTER TABLE materiales_producidos_fabricacion 
    ADD COLUMN contenedor_tipo TEXT;
    RAISE NOTICE 'Columna contenedor_tipo agregada a materiales_producidos_fabricacion';
  ELSE
    RAISE NOTICE 'La columna contenedor_tipo ya existe en materiales_producidos_fabricacion';
  END IF;
END $$;

-- ============================================
-- CORRECCIÓN TABLA materiales_consumidos_fabricacion
-- Por si acaso también le faltan las columnas
-- ============================================

-- Verificar si la columna 'contenedor' existe en consumidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiales_consumidos_fabricacion' 
    AND column_name = 'contenedor'
  ) THEN
    ALTER TABLE materiales_consumidos_fabricacion 
    ADD COLUMN contenedor TEXT;
    RAISE NOTICE 'Columna contenedor agregada a materiales_consumidos_fabricacion';
  ELSE
    RAISE NOTICE 'La columna contenedor ya existe en materiales_consumidos_fabricacion';
  END IF;
END $$;

-- Verificar si la columna 'contenedor_tipo' existe en consumidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiales_consumidos_fabricacion' 
    AND column_name = 'contenedor_tipo'
  ) THEN
    ALTER TABLE materiales_consumidos_fabricacion 
    ADD COLUMN contenedor_tipo TEXT;
    RAISE NOTICE 'Columna contenedor_tipo agregada a materiales_consumidos_fabricacion';
  ELSE
    RAISE NOTICE 'La columna contenedor_tipo ya existe en materiales_consumidos_fabricacion';
  END IF;
END $$;

-- ============================================
-- Verificar estructura final
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('materiales_producidos_fabricacion', 'materiales_consumidos_fabricacion')
ORDER BY table_name, ordinal_position;
