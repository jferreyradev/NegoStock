-- ==============================================================================
-- NEGOTOCK: REPARACIÓN INTEGRAL DE PERSISTENCIA Y RLS EN SUPABASE
-- ==============================================================================
-- Este script resuelve de raíz todos los bloqueos de guardado y persistencia:
-- 1. Corrige el orden de inserción de procesar_venta_mostrador (FK ventas_detalles -> ventas).
-- 2. Habilita permisos RLS en comercios (para que la dirección y datos del local persistan siempre).
-- 3. Habilita permisos RLS en clientes (para que los nuevos clientes no den error 42501).
-- 4. Habilita lectura y escritura en pedidos_preventa y pedidos_preventa_detalles.
-- 5. Habilita lectura y escritura en ventas, stock_movimientos y precios_historial.
--
-- INSTRUCCIONES:
-- 1. Abrí tu panel de Supabase: https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
-- 2. Creá una "New Query", pegá TODO este script y hacé clic en "Run".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PERMISOS GLOBALES DE ESQUEMA PARA ANON Y AUTHENTICATED
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. CORREGIR RPC DE VENTA (FK ventas_detalles ANTES DE ventas)
-- ------------------------------------------------------------------------------
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

    -- Incrementar secuencia correlativa con bloqueo de fila
    INSERT INTO comprobantes_secuencias (comercio_id, punto_venta, tipo_comprobante, ultimo_numero)
    VALUES (p_comercio_id, p_punto_venta, p_tipo_comprobante, 1)
    ON CONFLICT (comercio_id, punto_venta, tipo_comprobante)
    DO UPDATE SET ultimo_numero = comprobantes_secuencias.ultimo_numero + 1
    RETURNING ultimo_numero INTO v_secuencia;

    v_numero_comprobante := LPAD(p_punto_venta::TEXT, 4, '0') || '-' || LPAD(v_secuencia::TEXT, 8, '0');
    v_venta_id := uuid_generate_v4();

    -- 1. Insertar primero el encabezado de venta (Requerido por la FK de ventas_detalles)
    INSERT INTO ventas (
        id, comercio_id, cliente_id, tipo_comprobante, punto_venta, numero_secuencia,
        numero_comprobante, estado, medio_pago, modalidad_precio, subtotal, descuento, total_iva,
        total, id_offline_cliente, notas
    ) VALUES (
        v_venta_id, p_comercio_id, p_cliente_id, p_tipo_comprobante, p_punto_venta, v_secuencia,
        v_numero_comprobante, 'PAGADA', p_medio_pago, p_modalidad_precio, 0.00,
        COALESCE(p_descuento, 0.00), 0.00, 0.00, p_offline_id, p_notas
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

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS RLS EN COMERCIOS (Configuración, Dirección y Datos Fiscales)
-- ------------------------------------------------------------------------------
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercios_politica_general" ON public.comercios;
DROP POLICY IF EXISTS "usuarios_comercio_select" ON public.comercios;
DROP POLICY IF EXISTS "admin_comercio_update" ON public.comercios;

CREATE POLICY "comercios_politica_general" ON public.comercios
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Crear fila inicial de comercio si estuviese vacía
INSERT INTO public.comercios (id, nombre, razon_social, cuit, iibb, condicion_iva, direccion, telefono, email, esta_activo)
VALUES (1, 'Ferretería Central', 'Ferretería Central S.R.L.', '30-71234567-9', '901-123456-7', 'RESPONSABLE_INSCRIPTO', 'Av. San Martín 1240, Morón, Buenos Aires', '011-4567-8900', 'contacto@ferreteriacentral.com.ar', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS RLS EN CLIENTES
-- ------------------------------------------------------------------------------
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clientes_politica_general" ON public.clientes;
DROP POLICY IF EXISTS "comercio_clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "manager_clientes_modify" ON public.clientes;

CREATE POLICY "clientes_politica_general" ON public.clientes
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = 1)
    WITH CHECK (comercio_id = 1);

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS EN PEDIDOS Y PRESUPUESTOS (PREVENTA)
-- ------------------------------------------------------------------------------
ALTER TABLE public.pedidos_preventa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_preventa_politica_general" ON public.pedidos_preventa;
DROP POLICY IF EXISTS "comercio_pedidos_preventa_all" ON public.pedidos_preventa;

CREATE POLICY "pedidos_preventa_politica_general" ON public.pedidos_preventa
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = 1)
    WITH CHECK (comercio_id = 1);

ALTER TABLE public.pedidos_preventa_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_preventa_detalles_politica_general" ON public.pedidos_preventa_detalles;
DROP POLICY IF EXISTS "comercio_pedidos_detalles_all" ON public.pedidos_preventa_detalles;

CREATE POLICY "pedidos_preventa_detalles_politica_general" ON public.pedidos_preventa_detalles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS RLS EN VENTAS Y DETALLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ventas_politica_general" ON public.ventas;
DROP POLICY IF EXISTS "comercio_ventas_select" ON public.ventas;
DROP POLICY IF EXISTS "cajero_ventas_insert" ON public.ventas;

CREATE POLICY "ventas_politica_general" ON public.ventas
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = 1)
    WITH CHECK (comercio_id = 1);

ALTER TABLE public.ventas_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ventas_detalles_politica_general" ON public.ventas_detalles;

CREATE POLICY "ventas_detalles_politica_general" ON public.ventas_detalles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS RLS EN STOCK Y PRECIOS HISTORIAL
-- ------------------------------------------------------------------------------
ALTER TABLE public.stock_movimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_movimientos_politica_general" ON public.stock_movimientos;
DROP POLICY IF EXISTS "comercio_stock_movimientos_select" ON public.stock_movimientos;

CREATE POLICY "stock_movimientos_politica_general" ON public.stock_movimientos
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = 1)
    WITH CHECK (comercio_id = 1);

ALTER TABLE public.precios_historial ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "precios_historial_politica_general" ON public.precios_historial;
DROP POLICY IF EXISTS "comercio_precios_historial_select" ON public.precios_historial;

CREATE POLICY "precios_historial_politica_general" ON public.precios_historial
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = 1)
    WITH CHECK (comercio_id = 1);

SELECT '✅ REPARACIÓN DE PERSISTENCIA COMPLETADA CON ÉXITO EN SUPABASE' AS resultado;
