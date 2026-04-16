-- ============================================
-- CORRECCIÓN TABLA materiales_producidos_fabricacion
-- Agrega columnas de contenedor que faltan
-- ============================================

-- Agregar columna contenedor si no existe
ALTER TABLE materiales_producidos_fabricacion 
ADD COLUMN IF NOT EXISTS contenedor TEXT;

-- Agregar columna contenedor_tipo si no existe
ALTER TABLE materiales_producidos_fabricacion 
ADD COLUMN IF NOT EXISTS contenedor_tipo TEXT;

-- Verificar estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'materiales_producidos_fabricacion'
ORDER BY ordinal_position;
