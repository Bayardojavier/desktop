# Instrucciones para actualizar la tabla recetas_materiales

## ⚠️ IMPORTANTE: Usa la opción segura

### Opción 1: Actualización Segura (RECOMENDADA) ✅
Ejecuta el archivo `sql/recetas_materiales_actualizacion_segura.sql` en tu base de datos Supabase.

**Características:**
- ✅ No elimina datos existentes
- ✅ Agrega columnas nuevas sin perder información
- ✅ Corrige problemas de tipos de datos (conversión text → text[])
- ✅ Actualiza datos existentes automáticamente
- ✅ Más segura y reversible

**Qué hace:**
- Agrega columnas: `material_nombre`, `bodega_principal`, `bodega_secundaria` (tipo array), `creado_en`
- Convierte correctamente los datos de bodega_secundaria de text a text[] usando `string_to_array()`
- Actualiza todos los registros existentes con información del catálogo
- Crea índices necesarios
- Agrega comentarios descriptivos

### Opción 2: Recreación Completa (NO RECOMENDADA - Problemas de tipos de datos)
Si insistes en usar `sql/recetas_materiales_con_info_catalogo.sql`, primero corrige manualmente los tipos de datos.

## Después de ejecutar:

1. **Verifica los resultados:**
   ```sql
   SELECT
       COUNT(*) as total_materiales,
       COUNT(CASE WHEN material_nombre IS NOT NULL AND material_nombre != material_codigo THEN 1 END) as con_info_completa
   FROM public.recetas_materiales;
   ```

2. **Reinicia la aplicación Electron**

3. **Prueba el modal de ver receta** - ahora debería mostrar:
   - ✅ Nombre completo del material
   - ✅ Bodega donde se encuentra
   - ✅ Cantidad requerida

## Correcciones realizadas:
- ✅ Eliminados errores de sintaxis (`</content>`)
- ✅ Corregida función UUID (`gen_random_uuid()`)
- ✅ Convertido tipos de datos (`text` → `text[]` usando `string_to_array()`)
- ✅ **Corregida identificación de plantillas**: Ahora `material_codigo` = `nombre_plantilla` (no "PLANTILLA|id")
- ✅ **Corregida extracción de datos de plantillas**: Conversión array `catalogos` → texto `bodega_principal`
- ✅ Mejorada lógica de COALESCE para valores nulos