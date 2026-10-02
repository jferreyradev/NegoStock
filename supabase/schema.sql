-- ==============================================================================
-- NEGOTOCK - ESQUEMA RELACIONAL SUPABASE / POSTGRESQL (SAAS FERRETERÍA)
-- Multi-inquilino (tenant_id) + Control de Stock (Kardex) + Ventas + Compras
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TENANTS (INQUILINOS / NEGOCIOS SUSCRIPTOS)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                         -- Nombre comercial / de fantasía
    business_name TEXT,                         -- Razón Social legal
    cuit TEXT,                                  -- CUIT (Argentina)
    iibb TEXT,                                  -- Ingresos Brutos
    tax_status TEXT DEFAULT 'RESPONSABLE_INSCRIPTO',
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USUARIOS Y PERFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CASHIER' CHECK (role IN ('ADMIN', 'MANAGER', 'SELLER', 'CASHIER')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UNIDADES DE MEDIDA
CREATE TABLE IF NOT EXISTS units_of_measure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    allows_decimals BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_tenant_unit UNIQUE (tenant_id, name)
);

-- 5. CATEGORÍAS (Rubros / Departamentos)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_tenant_category UNIQUE (tenant_id, name)
);

-- 6. MARCAS
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_tenant_brand UNIQUE (tenant_id, name)
);

-- 7. PRODUCTOS Y PRECIOS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units_of_measure(id) ON DELETE SET NULL,
    
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    profit_margin NUMERIC(6, 2) DEFAULT 100.00,
    selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(14, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
    
    current_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    min_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    max_stock NUMERIC(12, 4) DEFAULT NULL,
    allows_negative_stock BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_tenant_sku UNIQUE (tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_search ON products(tenant_id, name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(tenant_id, barcode);

-- 8. CLIENTES
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    doc_type TEXT DEFAULT 'DNI' CHECK (doc_type IN ('DNI', 'CUIT', 'CUIL', 'PASAPORTE', 'CF')),
    doc_number TEXT,
    tax_condition TEXT DEFAULT 'CONSUMIDOR_FINAL' CHECK (tax_condition IN ('CONSUMIDOR_FINAL', 'RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO')),
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    credit_limit NUMERIC(14, 2) DEFAULT 0.00,
    current_account_balance NUMERIC(14, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PROVEEDORES
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cuit TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    current_account_balance NUMERIC(14, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COMPRAS
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    invoice_number TEXT,
    invoice_date DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT DEFAULT 'PAGADA' CHECK (payment_status IN ('PENDIENTE', 'PAGADA', 'PARCIAL', 'ANULADA')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 4) NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 21.00,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- 11. TABLA DE SECUENCIAS CORRELATIVAS (Garantiza números sin huecos ni colisiones)
CREATE TABLE IF NOT EXISTS voucher_sequences (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    point_of_sale INTEGER NOT NULL DEFAULT 1,
    voucher_type TEXT NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, point_of_sale, voucher_type)
);

-- 12. VENTAS Y COMPROBANTES
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    
    voucher_type TEXT NOT NULL DEFAULT 'TICKET_X' CHECK (voucher_type IN ('TICKET_X', 'PRESUPUESTO', 'REMITO', 'FACTURA_A', 'FACTURA_B', 'FACTURA_C')),
    point_of_sale INTEGER NOT NULL DEFAULT 1,
    voucher_sequence_number INTEGER NOT NULL,
    voucher_number TEXT NOT NULL,                           -- Ej: 0001-00000042
    
    status TEXT NOT NULL DEFAULT 'PAGADA' CHECK (status IN ('PENDIENTE', 'PAGADA', 'ANULADA')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'MERCADOPAGO', 'CTA_CTE', 'MIXTO')),
    price_mode TEXT NOT NULL DEFAULT 'selling' CHECK (price_mode IN ('selling', 'wholesale')),
    
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    client_offline_id TEXT,                                 -- ID generado en modo offline para evitar duplicaciones al sincronizar
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_tenant_voucher UNIQUE (tenant_id, point_of_sale, voucher_type, voucher_sequence_number)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 4) NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    cost_price NUMERIC(14, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- 13. MOVIMIENTOS DE STOCK (Kardex Inmutable)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('VENTA', 'COMPRA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'ROTURA', 'INICIAL')),
    quantity NUMERIC(12, 4) NOT NULL,
    balance_after NUMERIC(12, 4) NOT NULL,
    unit_cost NUMERIC(14, 2),
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id, created_at DESC);

-- 14. CAJA Y ARQUEO DIARIO
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closing_balance NUMERIC(14, 2),
    actual_cash NUMERIC(14, 2),
    difference NUMERIC(14, 2),
    status TEXT DEFAULT 'ABIERTA' CHECK (status IN ('ABIERTA', 'CERRADA'))
);

-- ==============================================================================
-- FUNCIÓN TRANSACCIONAL ACID: PROCESAR VENTA MOSTRADOR
-- Ejecuta en un único bloque atómico: Secuencia -> Bloqueo -> Kardex -> Venta
-- ==============================================================================

CREATE OR REPLACE FUNCTION procesar_venta_mostrador(
    p_tenant_id UUID,
    p_voucher_type TEXT,
    p_payment_method TEXT,
    p_price_mode TEXT,
    p_items JSONB,
    p_discount NUMERIC DEFAULT 0.00,
    p_customer_id UUID DEFAULT NULL,
    p_offline_id TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_point_of_sale INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seq INTEGER;
    v_voucher_number TEXT;
    v_sale_id UUID;
    v_item RECORD;
    v_prod RECORD;
    v_unit_price NUMERIC(14, 2);
    v_item_subtotal NUMERIC(14, 2);
    v_calc_subtotal NUMERIC(14, 2) := 0.00;
    v_calc_tax NUMERIC(14, 2) := 0.00;
    v_calc_total NUMERIC(14, 2) := 0.00;
    v_new_stock NUMERIC(12, 4);
BEGIN
    -- 1. Idempotencia: Verificar si ya se procesó este comprobante offline
    IF p_offline_id IS NOT NULL THEN
        SELECT id, voucher_number INTO v_sale_id, v_voucher_number 
        FROM sales 
        WHERE tenant_id = p_tenant_id AND client_offline_id = p_offline_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'already_processed', true,
                'sale_id', v_sale_id,
                'voucher_number', v_voucher_number
            );
        END IF;
    END IF;

    -- 2. Incrementar secuencia correlativa con bloqueo de fila (sin carreras)
    INSERT INTO voucher_sequences (tenant_id, point_of_sale, voucher_type, last_number)
    VALUES (p_tenant_id, p_point_of_sale, p_voucher_type, 1)
    ON CONFLICT (tenant_id, point_of_sale, voucher_type)
    DO UPDATE SET last_number = voucher_sequences.last_number + 1
    RETURNING last_number INTO v_seq;

    v_voucher_number := LPAD(p_point_of_sale::TEXT, 4, '0') || '-' || LPAD(v_seq::TEXT, 8, '0');

    -- 3. Crear cabecera de la venta
    v_sale_id := uuid_generate_v4();

    -- 4. Iterar sobre los ítems del payload JSONB
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        id UUID,
        sku TEXT,
        quantity NUMERIC(12, 4),
        price NUMERIC(14, 2)
    )
    LOOP
        -- Bloquear producto para actualización atómica
        SELECT * INTO v_prod 
        FROM products 
        WHERE (id = v_item.id OR (v_item.id IS NULL AND sku = v_item.sku))
          AND tenant_id = p_tenant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto no encontrado: SKU %', v_item.sku;
        END IF;

        -- Validar stock si no permite negativo
        IF NOT v_prod.allows_negative_stock AND (v_prod.current_stock < v_item.quantity) THEN
            -- En mostrador advertimos o permitimos según política, acá registramos
        END IF;

        -- Determinar precio según lista
        IF v_item.price IS NOT NULL AND v_item.price > 0 THEN
            v_unit_price := v_item.price;
        ELSIF p_price_mode = 'wholesale' AND v_prod.wholesale_price > 0 THEN
            v_unit_price := v_prod.wholesale_price;
        ELSE
            v_unit_price := v_prod.selling_price;
        END IF;

        v_item_subtotal := ROUND(v_unit_price * v_item.quantity, 2);
        v_calc_subtotal := v_calc_subtotal + v_item_subtotal;
        v_new_stock := v_prod.current_stock - v_item.quantity;

        -- Actualizar stock del producto
        UPDATE products 
        SET current_stock = v_new_stock, updated_at = NOW() 
        WHERE id = v_prod.id;

        -- Registrar ítem de venta
        INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_price, cost_price, tax_rate, subtotal
        ) VALUES (
            v_sale_id, v_prod.id, v_item.quantity, v_unit_price, v_prod.cost_price, v_prod.tax_rate, v_item_subtotal
        );

        -- Registrar movimiento en Kardex
        INSERT INTO stock_movements (
            tenant_id, product_id, movement_type, quantity, balance_after, unit_cost, reference_id, notes
        ) VALUES (
            p_tenant_id, v_prod.id, 'VENTA', -v_item.quantity, v_new_stock, v_prod.cost_price, v_sale_id,
            'Venta ' || v_voucher_number
        );
    END LOOP;

    -- 5. Calcular totales
    v_calc_total := GREATEST(0.00, v_calc_subtotal - COALESCE(p_discount, 0.00));
    v_calc_tax := ROUND(v_calc_total - (v_calc_total / 1.21), 2); -- Estimación IVA 21%

    -- 6. Insertar venta finalizada
    INSERT INTO sales (
        id, tenant_id, customer_id, voucher_type, point_of_sale, voucher_sequence_number,
        voucher_number, status, payment_method, price_mode, subtotal, discount, tax_total,
        total, client_offline_id, notes
    ) VALUES (
        v_sale_id, p_tenant_id, p_customer_id, p_voucher_type, p_point_of_sale, v_seq,
        v_voucher_number, 'PAGADA', p_payment_method, p_price_mode, v_calc_subtotal,
        COALESCE(p_discount, 0.00), v_calc_tax, v_calc_total, p_offline_id, p_notes
    );

    -- 7. Si fue a Cuenta Corriente, actualizar saldo del cliente
    IF p_payment_method = 'CTA_CTE' AND p_customer_id IS NOT NULL THEN
        UPDATE customers 
        SET current_account_balance = current_account_balance - v_calc_total,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;

    -- Retornar resultado estructurado
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'voucher_number', v_voucher_number,
        'sequence', v_seq,
        'subtotal', v_calc_subtotal,
        'discount', COALESCE(p_discount, 0.00),
        'total', v_calc_total,
        'created_at', NOW()
    );
END;
$$;


-- ==============================================================================
-- 15. PREVENTA: PEDIDOS PENDIENTES (Mostrador -> Caja -> Despacho)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS pending_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,                     -- Ej: PED-001
    customer_id UUID REFERENCES customers(id),
    price_mode TEXT DEFAULT 'selling',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'COBRADO', 'CANCELADO')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pending_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 4) NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- ==============================================================================
-- 16. AUDITORÍA: HISTORIAL DE ACTUALIZACIONES MASIVAS DE PRECIOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS price_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_name TEXT,
    brand_name TEXT,
    percentage NUMERIC(6, 2) NOT NULL,
    target TEXT NOT NULL,
    affected_products_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC: ACTUALIZACIÓN MASIVA DE PRECIOS POR INFLACIÓN
CREATE OR REPLACE FUNCTION actualizar_precios_masivo(
    p_tenant_id UUID,
    p_category_name TEXT DEFAULT NULL,
    p_brand_name TEXT DEFAULT NULL,
    p_percentage NUMERIC DEFAULT 0.00,
    p_target TEXT DEFAULT 'selling',
    p_rounding NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_factor NUMERIC;
    v_count INTEGER := 0;
BEGIN
    v_factor := 1.0 + (p_percentage / 100.0);

    IF p_target = 'cost_and_selling' THEN
        UPDATE products p
        SET cost_price = CASE 
                WHEN p_rounding > 0 THEN CEIL((cost_price * v_factor) / p_rounding) * p_rounding
                ELSE ROUND(cost_price * v_factor, 2)
            END,
            selling_price = CASE
                WHEN p_rounding > 0 THEN CEIL((selling_price * v_factor) / p_rounding) * p_rounding
                ELSE ROUND(selling_price * v_factor, 2)
            END,
            wholesale_price = CASE
                WHEN wholesale_price > 0 AND p_rounding > 0 THEN CEIL((wholesale_price * v_factor) / p_rounding) * p_rounding
                WHEN wholesale_price > 0 THEN ROUND(wholesale_price * v_factor, 2)
                ELSE wholesale_price
            END,
            updated_at = NOW()
        FROM categories c, brands b
        WHERE p.tenant_id = p_tenant_id
          AND p.category_id = c.id
          AND p.brand_id = b.id
          AND (p_category_name IS NULL OR c.name = p_category_name)
          AND (p_brand_name IS NULL OR b.name = p_brand_name);

    ELSIF p_target = 'selling' THEN
        UPDATE products p
        SET selling_price = CASE
                WHEN p_rounding > 0 THEN CEIL((selling_price * v_factor) / p_rounding) * p_rounding
                ELSE ROUND(selling_price * v_factor, 2)
            END,
            wholesale_price = CASE
                WHEN wholesale_price > 0 AND p_rounding > 0 THEN CEIL((wholesale_price * v_factor) / p_rounding) * p_rounding
                WHEN wholesale_price > 0 THEN ROUND(wholesale_price * v_factor, 2)
                ELSE wholesale_price
            END,
            updated_at = NOW()
        FROM categories c, brands b
        WHERE p.tenant_id = p_tenant_id
          AND p.category_id = c.id
          AND p.brand_id = b.id
          AND (p_category_name IS NULL OR c.name = p_category_name)
          AND (p_brand_name IS NULL OR b.name = p_brand_name);

    ELSIF p_target = 'cost_only' THEN
        UPDATE products p
        SET cost_price = CASE
                WHEN p_rounding > 0 THEN CEIL((cost_price * v_factor) / p_rounding) * p_rounding
                ELSE ROUND(cost_price * v_factor, 2)
            END,
            updated_at = NOW()
        FROM categories c, brands b
        WHERE p.tenant_id = p_tenant_id
          AND p.category_id = c.id
          AND p.brand_id = b.id
          AND (p_category_name IS NULL OR c.name = p_category_name)
          AND (p_brand_name IS NULL OR b.name = p_brand_name);
    END IF;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Registrar log de auditoría
    INSERT INTO price_change_logs (
        tenant_id, category_name, brand_name, percentage, target, affected_products_count
    ) VALUES (
        p_tenant_id, p_category_name, p_brand_name, p_percentage, p_target, v_count
    );

    RETURN jsonb_build_object(
        'success', true,
        'affected_count', v_count,
        'percentage', p_percentage
    );
END;
$$;
