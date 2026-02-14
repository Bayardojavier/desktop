-- fix_items_orden_compra_fk.sql
-- Eliminar la FK restrictiva ya que no podemos apuntar a una vista
-- La validación se maneja en el código de la aplicación

-- Eliminar la FK existente que apunta a la tabla legacy
ALTER TABLE public.items_orden_compra DROP CONSTRAINT IF EXISTS items_orden_compra_material_codigo_fkey;

-- Nota: No añadimos nueva FK porque las vistas no pueden ser referenciadas en FK.
-- La validación de que el material_codigo existe se hace en el código de ordencompras.html