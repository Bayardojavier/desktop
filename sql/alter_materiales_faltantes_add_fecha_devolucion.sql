-- Agregar columna fecha_devolucion a materiales_faltantes
-- Útil si tu app ya la usa (devolución/bajas) y en la BD no existe.

ALTER TABLE IF EXISTS materiales_faltantes
ADD COLUMN IF NOT EXISTS fecha_devolucion DATE;

-- (Opcional) Index si vas a filtrar por fecha
-- CREATE INDEX IF NOT EXISTS idx_materiales_faltantes_fecha_devolucion ON materiales_faltantes(fecha_devolucion);
