-- Función para extraer ubicación del código de material
-- Lee del carácter 17 al 23 donde están los patrones TIPO-XX
CREATE OR REPLACE FUNCTION extraer_ubicacion_desde_codigo(codigo TEXT)
RETURNS TEXT AS $$
DECLARE
    ubicacion TEXT;
    patron TEXT;
BEGIN
    -- Extraer la porción del código que contiene el patrón (caracteres 17-23)
    patron := substring(codigo, 17, 7);

    -- Analizar qué tipo de ubicación es
    IF patron ~* '^CASE-\d+$' THEN
        ubicacion := 'Case ' || substring(patron, 6, 2);
    ELSIF patron ~* '^ESTA-\d+$' THEN
        ubicacion := 'Estante ' || substring(patron, 6, 2);
    ELSIF patron ~* '^CAJA-\d+$' THEN
        ubicacion := 'Caja ' || substring(patron, 6, 2);
    ELSIF patron ~* '^LOTE-\d+$' THEN
        ubicacion := 'Lote ' || substring(patron, 6, 2);
    ELSE
        ubicacion := NULL;
    END IF;

    RETURN ubicacion;
END;
$$ LANGUAGE plpgsql;

-- Ejemplos de uso:
-- SELECT extraer_ubicacion_desde_codigo('00016-AUDI-PANT-CASE-02-LED-P3.9-05'); -- Retorna: Case 02
-- SELECT extraer_ubicacion_desde_codigo('00203-AUDI-BODE-ESTA-01-TOL6X4MT-6X4MT'); -- Retorna: Estante 01
-- SELECT extraer_ubicacion_desde_codigo('00895-AUDI-ESTA-CAJA-05-DE-CAJA-01'); -- Retorna: Caja 05
-- SELECT extraer_ubicacion_desde_codigo('00950-AUDI-PANT-LOTE-01-DE-LOTE-16'); -- Retorna: Lote 01

-- Para actualizar SOLO la tabla movimientos_bodega_audiovisual:
UPDATE movimientos_bodega_audiovisual
SET ubicacion_nombre = extraer_ubicacion_desde_codigo(material_codigo)
WHERE ubicacion_nombre IS NULL OR ubicacion_nombre = ''
  AND material_codigo IS NOT NULL;

-- Para verificar qué registros se van a actualizar (antes de ejecutar):
-- SELECT material_codigo, ubicacion_nombre,
--        extraer_ubicacion_desde_codigo(material_codigo) as nueva_ubicacion
-- FROM movimientos_bodega_audiovisual
-- WHERE ubicacion_nombre IS NULL OR ubicacion_nombre = ''
--   AND material_codigo IS NOT NULL
-- LIMIT 10;

-- Para contar cuántos registros se van a actualizar:
-- SELECT COUNT(*) as registros_a_actualizar
-- FROM movimientos_bodega_audiovisual
-- WHERE ubicacion_nombre IS NULL OR ubicacion_nombre = ''
--   AND material_codigo IS NOT NULL;