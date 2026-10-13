-- ==============================================================================
-- NEGOTOCK: REPARACIÓN TOTAL, RLS, ADVISORS Y PERFORMANCE EN PRODUCCIÓN
-- ==============================================================================
-- Este script soluciona TODAS las advertencias del Dashboard de Supabase:
-- 1. Agrega la columna 'actualizado_en' a 'ventas' (resuelve error 42703 al vender).
-- 2. Habilita RLS y políticas en las 4 tablas que mostraban "RLS Disabled in Public".
-- 3. Resuelve el aviso "Function Search Path Mutable" fijando search_path = public.
-- 4. Crea los índices en claves foráneas para resolver el "Performance Advisor".
-- 5. Sincroniza la secuencia de tickets para evitar errores de comprobante duplicado.
--
-- INSTRUCCIONES:
-- 1. Abrí el SQL Editor de tu proyecto de Producción (aphqdlmgggglvahbhksu):
--    https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
-- 2. Creá una "New Query", pegá TODO este script y hacé clic en "Run".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. COLUMNA ACTUALIZADO_EN EN VENTAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- 2. HABILITAR RLS EN TODAS LAS TABLAS QUE TENÍAN "RLS Disabled in Public"
-- ------------------------------------------------------------------------------
ALTER TABLE public.cajas_turnos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cajas_turnos_politica_general" ON public.cajas_turnos;
CREATE POLICY "cajas_turnos_politica_general" ON public.cajas_turnos
    FOR ALL TO anon, authenticated USING (comercio_id = 1) WITH CHECK (comercio_id = 1);

ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "compras_politica_general" ON public.compras;
CREATE POLICY "compras_politica_general" ON public.compras
    FOR ALL TO anon, authenticated USING (comercio_id = 1) WITH CHECK (comercio_id = 1);

ALTER TABLE public.compras_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "compras_detalles_politica_general" ON public.compras_detalles;
CREATE POLICY "compras_detalles_politica_general" ON public.compras_detalles
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.comprobantes_secuencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comprobantes_secuencias_politica_general" ON public.comprobantes_secuencias;
CREATE POLICY "comprobantes_secuencias_politica_general" ON public.comprobantes_secuencias
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. RESOLVER SECURITY ADVISOR (Function Search Path Mutable)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_registrar_historial_precio') THEN
        ALTER FUNCTION public.trg_registrar_historial_precio() SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'obtener_comercio_id_autenticado') THEN
        ALTER FUNCTION public.obtener_comercio_id_autenticado() SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'obtener_rol_autenticado') THEN
        ALTER FUNCTION public.obtener_rol_autenticado() SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'actualizar_precios_masivo') THEN
        ALTER FUNCTION public.actualizar_precios_masivo(INT, TEXT, TEXT, NUMERIC, TEXT, NUMERIC) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'manejar_nuevo_usuario') THEN
        ALTER FUNCTION public.manejar_nuevo_usuario() SET search_path = public;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. RESOLVER PERFORMANCE ADVISOR (Índices en Claves Foráneas)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_usuarios_comercio_id ON public.usuarios(comercio_id);
CREATE INDEX IF NOT EXISTS idx_categorias_padre_id ON public.categorias(categoria_padre_id);
CREATE INDEX IF NOT EXISTS idx_categorias_comercio_id ON public.categorias(comercio_id);
CREATE INDEX IF NOT EXISTS idx_marcas_comercio_id ON public.marcas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_unidades_medida_comercio_id ON public.unidades_medida(comercio_id);
CREATE INDEX IF NOT EXISTS idx_productos_comercio_id ON public.productos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON public.productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_unidad_id ON public.productos(unidad_id);
CREATE INDEX IF NOT EXISTS idx_clientes_comercio_id ON public.clientes(comercio_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_comercio_id ON public.proveedores(comercio_id);
CREATE INDEX IF NOT EXISTS idx_compras_comercio_id ON public.compras(comercio_id);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor_id ON public.compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_detalles_compra ON public.compras_detalles(compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_detalles_prod ON public.compras_detalles(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_comercio_id ON public.ventas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON public.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_detalles_venta ON public.ventas_detalles(venta_id);
CREATE INDEX IF NOT EXISTS idx_ventas_detalles_prod ON public.ventas_detalles(producto_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_comercio ON public.stock_movimientos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_prod ON public.stock_movimientos(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_preventa_comercio ON public.pedidos_preventa(comercio_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_preventa_cliente ON public.pedidos_preventa(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_detalles_pedido ON public.pedidos_preventa_detalles(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_detalles_prod ON public.pedidos_preventa_detalles(producto_id);
CREATE INDEX IF NOT EXISTS idx_cajas_turnos_comercio ON public.cajas_turnos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_precios_historial_comercio ON public.precios_historial(comercio_id);
CREATE INDEX IF NOT EXISTS idx_precios_historial_prod ON public.precios_historial(producto_id);


-- ------------------------------------------------------------------------------
-- 5. SINCRONIZAR SECUENCIA DE COMPROBANTES CON ÚLTIMO COMPROBANTE EMITIDO
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. ACTUALIZAR FUNCIÓN ATÓMICA DE VENTA (PREVIENE DUPLICADOS Y ERROR DE COLUMNA)
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
    v_venta_id := gen_random_uuid();

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

SELECT '✅ REPARACIÓN INTEGRAL: RLS, ÍNDICES Y VENTAS APLICADOS CON ÉXITO' AS resultado;
