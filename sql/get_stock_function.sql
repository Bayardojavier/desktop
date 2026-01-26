-- Función RPC para obtener stock por código de material desde todas las vistas
-- Combina stock_hierros, stock_audiovisual, y stock_consumibles

CREATE OR REPLACE FUNCTION get_material_stock(p_codigo text)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    stock_result numeric := 0;
BEGIN
    -- Buscar en stock_hierros primero
    SELECT stock_actual INTO stock_result
    FROM stock_hierros
    WHERE material_codigo = p_codigo
    LIMIT 1;

    -- Si no encontró, buscar en stock_audiovisual
    IF stock_result = 0 OR stock_result IS NULL THEN
        SELECT stock_actual INTO stock_result
        FROM stock_audiovisual
        WHERE material_codigo = p_codigo
        LIMIT 1;
    END IF;

    -- Si no encontró, buscar en stock_consumibles
    IF stock_result = 0 OR stock_result IS NULL THEN
        SELECT stock_actual INTO stock_result
        FROM stock_consumibles
        WHERE material_codigo = p_codigo
        LIMIT 1;
    END IF;

    -- Retornar 0 si no se encontró nada
    RETURN COALESCE(stock_result, 0);
END;
$$;