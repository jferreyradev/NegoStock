-- ==============================================================================
-- NEGOTOCK: ACTUALIZACIÓN RPC VENTAS Y SOPORTE DE ÍTEM COMODÍN (VAR)
-- ==============================================================================
-- 1. Asegura la existencia del producto comodín 'VAR' para servicios y varios.
-- 2. Permite que cualquier ítem personalizado o flete se guarde sin fallar.
-- 3. No descuenta stock físico cuando se vende el ítem comodín 'VAR'.
-- ==============================================================================

-- 1. ÍTEM COMODÍN GENÉRICO
INSERT INTO public.productos (
    comercio_id, codigo_sku, nombre, descripcion, precio_costo, margen_ganancia,
    precio_venta, precio_mayoreo, alicuota_iva, stock_actual, stock_minimo, esta_activo
) VALUES (
    1, 'VAR', 'ARTÍCULOS VARIOS / SERVICIOS',
    'Ítem comodín para artículos libres, fletes, servicios y cortes en mostrador',
    0.00, 100.00, 0.00, 0.00, 21.00, 999999.00, 0.00, true
)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET esta_activo = true;

-- 2. ACTUALIZAR FUNCIÓN ATÓMICA DE VENTA
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
SET search_path = public, extensions
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
    v_modalidad TEXT;
BEGIN
    -- Validar modalidad de precio
    v_modalidad := CASE WHEN p_modalidad_precio = 'wholesale' THEN 'wholesale' ELSE 'selling' END;

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
    v_venta_id := gen_random_uuid();

    -- 1. Insertar encabezado de venta
    INSERT INTO ventas (
        id, comercio_id, cliente_id, tipo_comprobante, punto_venta, numero_secuencia,
        numero_comprobante, estado, medio_pago, modalidad_precio, subtotal, descuento, total_iva,
        total, id_offline_cliente, notas, creado_en, actualizado_en
    ) VALUES (
        v_venta_id, p_comercio_id, p_cliente_id, p_tipo_comprobante, p_punto_venta, v_secuencia,
        v_numero_comprobante, 'PAGADA', p_medio_pago, v_modalidad, 0.00,
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
            -- Fallback a comodín 'VAR'
            SELECT * INTO v_prod 
            FROM productos 
            WHERE codigo_sku = 'VAR' AND comercio_id = p_comercio_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Producto no encontrado: SKU %', v_item.sku;
            END IF;
        END IF;

        IF v_item.price IS NOT NULL AND v_item.price > 0 THEN
            v_precio_unitario := v_item.price;
        ELSIF v_modalidad = 'wholesale' AND v_prod.precio_mayoreo > 0 THEN
            v_precio_unitario := v_prod.precio_mayoreo;
        ELSE
            v_precio_unitario := v_prod.precio_venta;
        END IF;

        v_item_subtotal := ROUND(v_precio_unitario * v_item.quantity, 2);
        v_calc_subtotal := v_calc_subtotal + v_item_subtotal;

        IF v_prod.codigo_sku = 'VAR' THEN
            v_nuevo_stock := v_prod.stock_actual;
        ELSE
            v_nuevo_stock := v_prod.stock_actual - v_item.quantity;
            UPDATE productos 
            SET stock_actual = v_nuevo_stock, actualizado_en = NOW() 
            WHERE id = v_prod.id;
        END IF;

        INSERT INTO ventas_detalles (
            venta_id, producto_id, cantidad, precio_unitario, precio_costo, alicuota_iva, subtotal
        ) VALUES (
            v_venta_id, v_prod.id, v_item.quantity, v_precio_unitario, v_prod.precio_costo, v_prod.alicuota_iva, v_item_subtotal
        );

        IF v_prod.codigo_sku <> 'VAR' THEN
            INSERT INTO stock_movimientos (
                comercio_id, producto_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia_id, notas
            ) VALUES (
                p_comercio_id, v_prod.id, 'VENTA', -v_item.quantity, v_nuevo_stock, v_prod.precio_costo, v_venta_id,
                'Venta ' || v_numero_comprobante
            );
        END IF;
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

SELECT '✅ RPC DE VENTA ACTUALIZADO CON SOPORTE COMPLETO PARA ÍTEMS COMODÍN' AS resultado;
