-- ==============================================================================
-- NEGOTOCK: REPARACIÓN RÁPIDA DE COMPROBANTES Y VENTAS EN PRODUCCIÓN
-- ==============================================================================
-- Este script soluciona dos advertencias críticas encontradas en Producción:
-- 1. Agrega la columna 'actualizado_en' a la tabla 'ventas' (evita error 42703).
-- 2. Actualiza la función 'procesar_venta_mostrador' para sincronizar secuencias
--    y evitar error de clave duplicada en 'uk_comercio_comprobante'.
--
-- INSTRUCCIONES:
-- 1. Abrí el SQL Editor de tu proyecto de Producción (aphqdlmgggglvahbhksu):
--    https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
-- 2. Creá una "New Query", pegá este script y hacé clic en "Run".
-- ==============================================================================

-- 1. Agregar columna faltante actualizado_en en ventas
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

-- 2. Sincronizar el puntero de secuencias con el último comprobante emitido
INSERT INTO public.comprobantes_secuencias (comercio_id, punto_venta, tipo_comprobante, ultimo_numero)
VALUES (
    1,
    1,
    'TICKET_X',
    COALESCE((SELECT MAX(numero_secuencia) FROM public.ventas WHERE comercio_id = 1 AND punto_venta = 1 AND tipo_comprobante = 'TICKET_X'), 0)
)
ON CONFLICT (comercio_id, punto_venta, tipo_comprobante)
DO UPDATE SET ultimo_numero = GREATEST(
    comprobantes_secuencias.ultimo_numero,
    COALESCE((SELECT MAX(numero_secuencia) FROM public.ventas WHERE comercio_id = EXCLUDED.comercio_id AND punto_venta = EXCLUDED.punto_venta AND tipo_comprobante = EXCLUDED.tipo_comprobante), 0)
);

-- 3. Actualizar la función procesar_venta_mostrador con prevención de colisiones
CREATE OR REPLACE FUNCTION procesar_venta_mostrador(
    p_comercio_id INT,
    p_tipo_comprobante TEXT,
    p_medio_pago TEXT,
    p_modalidad_precio TEXT,
    p_items JSONB,
    p_descuento NUMERIC DEFAULT 0.00,
    p_cliente_id UUID DEFAULT NULL,
    p_offline_id TEXT DEFAULT NULL,
    p_notas TEXT DEFAULT NULL,
    p_punto_venta INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_secuencia INTEGER;
    v_numero_comprobante TEXT;
    v_venta_id UUID;
    v_item RECORD;
    v_prod RECORD;
    v_precio_unitario NUMERIC(14, 2);
    v_item_subtotal NUMERIC(14, 2);
    v_calc_subtotal NUMERIC(14, 2) := 0.00;
    v_calc_iva NUMERIC(14, 2) := 0.00;
    v_calc_total NUMERIC(14, 2) := 0.00;
    v_nuevo_stock NUMERIC(12, 4);
BEGIN
    -- Idempotencia: Verificar si ya se procesó este comprobante offline
    IF p_offline_id IS NOT NULL THEN
        SELECT id, numero_comprobante INTO v_venta_id, v_numero_comprobante 
        FROM ventas 
        WHERE comercio_id = p_comercio_id AND id_offline_cliente = p_offline_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'already_processed', true,
                'sale_id', v_venta_id,
                'voucher_number', v_numero_comprobante
            );
        END IF;
    END IF;

    -- Incrementar secuencia correlativa con bloqueo de fila y prevención de colisión
    INSERT INTO comprobantes_secuencias (comercio_id, punto_venta, tipo_comprobante, ultimo_numero)
    VALUES (
        p_comercio_id,
        p_punto_venta,
        p_tipo_comprobante,
        COALESCE((
            SELECT MAX(numero_secuencia)
            FROM ventas
            WHERE comercio_id = p_comercio_id
              AND punto_venta = p_punto_venta
              AND tipo_comprobante = p_tipo_comprobante
        ), 0) + 1
    )
    ON CONFLICT (comercio_id, punto_venta, tipo_comprobante)
    DO UPDATE SET ultimo_numero = GREATEST(
        comprobantes_secuencias.ultimo_numero + 1,
        COALESCE((
            SELECT MAX(numero_secuencia)
            FROM ventas
            WHERE comercio_id = EXCLUDED.comercio_id
              AND punto_venta = EXCLUDED.punto_venta
              AND tipo_comprobante = EXCLUDED.tipo_comprobante
        ), 0) + 1
    )
    RETURNING ultimo_numero INTO v_secuencia;

    v_numero_comprobante := LPAD(p_punto_venta::TEXT, 4, '0') || '-' || LPAD(v_secuencia::TEXT, 8, '0');
    v_venta_id := uuid_generate_v4();

    -- 1. Insertar primero el encabezado de venta (Requerido por la FK de ventas_detalles)
    INSERT INTO ventas (
        id, comercio_id, cliente_id, tipo_comprobante, punto_venta, numero_secuencia,
        numero_comprobante, estado, medio_pago, modalidad_precio, subtotal, descuento, total_iva,
        total, id_offline_cliente, notas, creado_en, actualizado_en
    ) VALUES (
        v_venta_id, p_comercio_id, p_cliente_id, p_tipo_comprobante, p_punto_venta, v_secuencia,
        v_numero_comprobante, 'PAGADA', p_medio_pago, p_modalidad_precio, 0.00,
        COALESCE(p_descuento, 0.00), 0.00, 0.00, p_offline_id, p_notas, NOW(), NOW()
    );

    -- 2. Procesar cada ítem del payload
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        id UUID,
        sku TEXT,
        quantity NUMERIC(12, 4),
        price NUMERIC(14, 2)
    )
    LOOP
        SELECT * INTO v_prod 
        FROM productos 
        WHERE (id = v_item.id OR (v_item.id IS NULL AND codigo_sku = v_item.sku))
          AND comercio_id = p_comercio_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto no encontrado: SKU %', v_item.sku;
        END IF;

        IF v_item.price IS NOT NULL AND v_item.price > 0 THEN
            v_precio_unitario := v_item.price;
        ELSIF p_modalidad_precio = 'wholesale' AND v_prod.precio_mayoreo > 0 THEN
            v_precio_unitario := v_prod.precio_mayoreo;
        ELSE
            v_precio_unitario := v_prod.precio_venta;
        END IF;

        v_item_subtotal := ROUND(v_precio_unitario * v_item.quantity, 2);
        v_calc_subtotal := v_calc_subtotal + v_item_subtotal;
        v_nuevo_stock := v_prod.stock_actual - v_item.quantity;

        UPDATE productos 
        SET stock_actual = v_nuevo_stock, actualizado_en = NOW() 
        WHERE id = v_prod.id;

        INSERT INTO ventas_detalles (
            venta_id, producto_id, cantidad, precio_unitario, precio_costo, alicuota_iva, subtotal
        ) VALUES (
            v_venta_id, v_prod.id, v_item.quantity, v_precio_unitario, v_prod.precio_costo, v_prod.alicuota_iva, v_item_subtotal
        );

        INSERT INTO stock_movimientos (
            comercio_id, producto_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia_id, notas
        ) VALUES (
            p_comercio_id, v_prod.id, 'VENTA', -v_item.quantity, v_nuevo_stock, v_prod.precio_costo, v_venta_id,
            'Venta ' || v_numero_comprobante
        );
    END LOOP;

    v_calc_total := GREATEST(0.00, v_calc_subtotal - COALESCE(p_descuento, 0.00));
    v_calc_iva := ROUND(v_calc_total - (v_calc_total / 1.21), 2);

    -- 3. Actualizar totales calculados finales en ventas
    UPDATE ventas 
    SET subtotal = v_calc_subtotal,
        total_iva = v_calc_iva,
        total = v_calc_total,
        actualizado_en = NOW()
    WHERE id = v_venta_id;

    IF p_medio_pago = 'CTA_CTE' AND p_cliente_id IS NOT NULL THEN
        UPDATE clientes 
        SET saldo_cuenta_corriente = saldo_cuenta_corriente - v_calc_total,
            actualizado_en = NOW()
        WHERE id = p_cliente_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_venta_id,
        'voucher_number', v_numero_comprobante,
        'sequence', v_secuencia,
        'subtotal', v_calc_subtotal,
        'discount', COALESCE(p_descuento, 0.00),
        'total', v_calc_total,
        'created_at', NOW()
    );
END;
$$;

SELECT '✅ REPARACIÓN DE PRODUCCIÓN EXITOSA' AS resultado;
