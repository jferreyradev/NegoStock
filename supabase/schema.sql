-- ==============================================================================
-- NEGOTOCK - ESQUEMA RELACIONAL SUPABASE / POSTGRESQL (SAAS FERRETERÍA)
-- 100% EN ESPAÑOL: Tablas, Campos, Funciones, Triggers y Políticas RLS
-- Multi-inquilino con ID entero simple: comercio_id = 1, 2, 3...
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. COMERCIOS (Inquilinos del SaaS: 1 = Central, 2 = Sucursal 2, etc.)
CREATE TABLE IF NOT EXISTS comercios (
    id SERIAL PRIMARY KEY,                                      -- ID simple: 1, 2, 3...
    nombre TEXT NOT NULL,                                       -- Nombre de fantasía
    razon_social TEXT,                                          -- Razón Social legal
    cuit TEXT,                                                  -- CUIT (Argentina)
    iibb TEXT,                                                  -- Ingresos Brutos
    condicion_iva TEXT DEFAULT 'RESPONSABLE_INSCRIPTO',
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    logo_url TEXT,
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USUARIOS Y PERFILES (Vinculado a Supabase Auth o Empleados de mostrador)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'SELLER' CHECK (rol IN ('ADMIN', 'MANAGER', 'CASHIER', 'SELLER')),
    codigo_pin TEXT DEFAULT '1111',
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UNIDADES DE MEDIDA (u, m, kg, lt, bolsa, rollo)
CREATE TABLE IF NOT EXISTS unidades_medida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,                                       -- Unidad, Metro, Kilo, etc.
    abreviatura TEXT NOT NULL,                                  -- u, m, kg, lt, etc.
    permite_decimales BOOLEAN DEFAULT false,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_comercio_unidad UNIQUE (comercio_id, nombre)
);

-- 5. CATEGORÍAS (Rubros / Departamentos)
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    categoria_padre_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_comercio_categoria UNIQUE (comercio_id, nombre)
);

-- 6. MARCAS
CREATE TABLE IF NOT EXISTS marcas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_comercio_marca UNIQUE (comercio_id, nombre)
);

-- 7. PRODUCTOS Y PRECIOS
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    codigo_sku TEXT NOT NULL,                                   -- Código interno de ferretería
    codigo_barras TEXT,                                         -- Código EAN-13
    nombre TEXT NOT NULL,                                       -- Descripción comercial
    descripcion TEXT,                                           -- Detalles técnicos
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    marca_id UUID REFERENCES marcas(id) ON DELETE SET NULL,
    unidad_id UUID REFERENCES unidades_medida(id) ON DELETE SET NULL,
    
    -- Precios y Márgenes
    precio_costo NUMERIC(14, 2) NOT NULL DEFAULT 0.00,          -- Costo de reposición
    margen_ganancia NUMERIC(6, 2) DEFAULT 100.00,               -- Margen estimado %
    precio_venta NUMERIC(14, 2) NOT NULL DEFAULT 0.00,          -- Precio Mostrador / Minorista
    precio_mayoreo NUMERIC(14, 2) DEFAULT 0.00,                 -- Precio Mayorista / Gremio
    alicuota_iva NUMERIC(5, 2) NOT NULL DEFAULT 21.00,          -- 21%, 10.5%, 0%
    
    -- Stock
    stock_actual NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    stock_minimo NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    stock_maximo NUMERIC(12, 4) DEFAULT NULL,
    permite_stock_negativo BOOLEAN DEFAULT false,
    
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_comercio_sku UNIQUE (comercio_id, codigo_sku)
);

CREATE INDEX IF NOT EXISTS idx_productos_comercio_busqueda ON productos(comercio_id, nombre text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(comercio_id, codigo_sku);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(comercio_id, codigo_barras);

-- 8. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo_documento TEXT DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI', 'CUIT', 'CUIL', 'PASAPORTE', 'CF')),
    numero_documento TEXT,
    condicion_iva TEXT DEFAULT 'CONSUMIDOR_FINAL' CHECK (condicion_iva IN ('CONSUMIDOR_FINAL', 'RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO')),
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    ciudad TEXT,
    limite_credito NUMERIC(14, 2) DEFAULT 0.00,
    saldo_cuenta_corriente NUMERIC(14, 2) DEFAULT 0.00,
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PROVEEDORES
CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    cuit TEXT,
    contacto_nombre TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    saldo_cuenta_corriente NUMERIC(14, 2) DEFAULT 0.00,
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COMPRAS
CREATE TABLE IF NOT EXISTS compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE RESTRICT,
    numero_factura TEXT,
    fecha_factura DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_iva NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    estado_pago TEXT DEFAULT 'PAGADA' CHECK (estado_pago IN ('PENDIENTE', 'PAGADA', 'PARCIAL', 'ANULADA')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 4) NOT NULL,
    costo_unitario NUMERIC(14, 2) NOT NULL,
    alicuota_iva NUMERIC(5, 2) DEFAULT 21.00,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- 11. SECUENCIAS CORRELATIVAS DE COMPROBANTES
CREATE TABLE IF NOT EXISTS comprobantes_secuencias (
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    punto_venta INTEGER NOT NULL DEFAULT 1,
    tipo_comprobante TEXT NOT NULL,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (comercio_id, punto_venta, tipo_comprobante)
);

-- 12. VENTAS Y COMPROBANTES
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
    
    tipo_comprobante TEXT NOT NULL DEFAULT 'TICKET_X' CHECK (tipo_comprobante IN ('TICKET_X', 'PRESUPUESTO', 'REMITO', 'FACTURA_A', 'FACTURA_B', 'FACTURA_C')),
    punto_venta INTEGER NOT NULL DEFAULT 1,
    numero_secuencia INTEGER NOT NULL,
    numero_comprobante TEXT NOT NULL,                           -- Ej: 0001-00000042
    
    estado TEXT NOT NULL DEFAULT 'PAGADA' CHECK (estado IN ('PENDIENTE', 'PAGADA', 'ANULADA')),
    medio_pago TEXT NOT NULL CHECK (medio_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'MERCADOPAGO', 'CTA_CTE', 'MIXTO')),
    modalidad_precio TEXT NOT NULL DEFAULT 'selling' CHECK (modalidad_precio IN ('selling', 'wholesale')),
    
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_iva NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    id_offline_cliente TEXT,
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_comercio_comprobante UNIQUE (comercio_id, punto_venta, tipo_comprobante, numero_secuencia)
);

CREATE TABLE IF NOT EXISTS ventas_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 4) NOT NULL,
    precio_unitario NUMERIC(14, 2) NOT NULL,
    precio_costo NUMERIC(14, 2) NOT NULL,
    alicuota_iva NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- 13. MOVIMIENTOS DE STOCK (Kardex Inmutable)
CREATE TABLE IF NOT EXISTS stock_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('VENTA', 'COMPRA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'ROTURA', 'INICIAL')),
    cantidad NUMERIC(12, 4) NOT NULL,
    saldo_posterior NUMERIC(12, 4) NOT NULL,
    costo_unitario NUMERIC(14, 2),
    referencia_id UUID,
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movimientos_prod ON stock_movimientos(producto_id, creado_en DESC);

-- 14. PREVENTA: PEDIDOS PENDIENTES (Mostrador -> Caja -> Despacho)
CREATE TABLE IF NOT EXISTS pedidos_preventa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    numero_pedido TEXT NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    modalidad_precio TEXT DEFAULT 'selling',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'COBRADO', 'CANCELADO')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos_preventa_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos_preventa(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 4) NOT NULL,
    precio_unitario NUMERIC(14, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- 15. AUDITORÍA HISTÓRICA DE PRECIOS
CREATE TABLE IF NOT EXISTS precios_historial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    costo_anterior NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    costo_nuevo NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    venta_anterior NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    venta_nueva NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    mayoreo_anterior NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    mayoreo_nuevo NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    motivo_cambio TEXT NOT NULL DEFAULT 'MANUAL' CHECK (motivo_cambio IN ('MANUAL', 'AUMENTO_MASIVO', 'IMPORTACION_EXCEL', 'RECEPCION_COMPRA')),
    usuario_nombre TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_precios_historial_prod ON precios_historial(producto_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_precios_historial_comercio ON precios_historial(comercio_id, creado_en DESC);

-- 16. CAJA Y ARQUEO DIARIO
CREATE TABLE IF NOT EXISTS cajas_turnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    usuario_id UUID,
    apertura_en TIMESTAMPTZ DEFAULT NOW(),
    cierre_en TIMESTAMPTZ,
    saldo_inicial NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    saldo_final NUMERIC(14, 2),
    efectivo_real NUMERIC(14, 2),
    diferencia NUMERIC(14, 2),
    estado TEXT DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

-- ==============================================================================
-- FUNCIONES TRANSACCIONALES ACID (EN ESPAÑOL)
-- ==============================================================================

-- Trigger: Registro automático de historial de precios
CREATE OR REPLACE FUNCTION trg_registrar_historial_precio()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.precio_costo IS DISTINCT FROM NEW.precio_costo OR
        OLD.precio_venta IS DISTINCT FROM NEW.precio_venta OR
        OLD.precio_mayoreo IS DISTINCT FROM NEW.precio_mayoreo) THEN
        
        INSERT INTO precios_historial (
            comercio_id, producto_id,
            costo_anterior, costo_nuevo,
            venta_anterior, venta_nueva,
            mayoreo_anterior, mayoreo_nuevo,
            motivo_cambio, usuario_nombre, creado_en
        ) VALUES (
            NEW.comercio_id, NEW.id,
            COALESCE(OLD.precio_costo, 0.00), COALESCE(NEW.precio_costo, 0.00),
            COALESCE(OLD.precio_venta, 0.00), COALESCE(NEW.precio_venta, 0.00),
            COALESCE(OLD.precio_mayoreo, 0.00), COALESCE(NEW.precio_mayoreo, 0.00),
            'MANUAL', current_user, NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_despues_cambio_precio_producto
AFTER UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION trg_registrar_historial_precio();

-- RPC: PROCESAR VENTA MOSTRADOR ATÓMICAMENTE
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

    -- Procesar cada ítem del payload
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

    INSERT INTO ventas (
        id, comercio_id, cliente_id, tipo_comprobante, punto_venta, numero_secuencia,
        numero_comprobante, estado, medio_pago, modalidad_precio, subtotal, descuento, total_iva,
        total, id_offline_cliente, notas
    ) VALUES (
        v_venta_id, p_comercio_id, p_cliente_id, p_tipo_comprobante, p_punto_venta, v_secuencia,
        v_numero_comprobante, 'PAGADA', p_medio_pago, p_modalidad_precio, v_calc_subtotal,
        COALESCE(p_descuento, 0.00), v_calc_iva, v_calc_total, p_offline_id, p_notas
    );

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

-- RPC: ACTUALIZACIÓN MASIVA DE PRECIOS POR INFLACIÓN
CREATE OR REPLACE FUNCTION actualizar_precios_masivo(
    p_comercio_id INT,
    p_categoria_nombre TEXT DEFAULT NULL,
    p_marca_nombre TEXT DEFAULT NULL,
    p_porcentaje NUMERIC DEFAULT 0.00,
    p_criterio TEXT DEFAULT 'selling',
    p_redondeo NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_factor NUMERIC;
    v_cantidad INTEGER := 0;
BEGIN
    v_factor := 1.0 + (p_porcentaje / 100.0);

    IF p_criterio = 'cost_and_selling' THEN
        UPDATE productos p
        SET precio_costo = CASE 
                WHEN p_redondeo > 0 THEN CEIL((precio_costo * v_factor) / p_redondeo) * p_redondeo
                ELSE ROUND(precio_costo * v_factor, 2)
            END,
            precio_venta = CASE
                WHEN p_redondeo > 0 THEN CEIL((precio_venta * v_factor) / p_redondeo) * p_redondeo
                ELSE ROUND(precio_venta * v_factor, 2)
            END,
            precio_mayoreo = CASE
                WHEN precio_mayoreo > 0 AND p_redondeo > 0 THEN CEIL((precio_mayoreo * v_factor) / p_redondeo) * p_redondeo
                WHEN precio_mayoreo > 0 THEN ROUND(precio_mayoreo * v_factor, 2)
                ELSE precio_mayoreo
            END,
            actualizado_en = NOW()
        FROM categorias c, marcas b
        WHERE p.comercio_id = p_comercio_id
          AND p.categoria_id = c.id
          AND p.marca_id = b.id
          AND (p_categoria_nombre IS NULL OR c.nombre = p_categoria_nombre)
          AND (p_marca_nombre IS NULL OR b.nombre = p_marca_nombre);

    ELSIF p_criterio = 'selling' THEN
        UPDATE productos p
        SET precio_venta = CASE
                WHEN p_redondeo > 0 THEN CEIL((precio_venta * v_factor) / p_redondeo) * p_redondeo
                ELSE ROUND(precio_venta * v_factor, 2)
            END,
            precio_mayoreo = CASE
                WHEN precio_mayoreo > 0 AND p_redondeo > 0 THEN CEIL((precio_mayoreo * v_factor) / p_redondeo) * p_redondeo
                WHEN precio_mayoreo > 0 THEN ROUND(precio_mayoreo * v_factor, 2)
                ELSE precio_mayoreo
            END,
            actualizado_en = NOW()
        FROM categorias c, marcas b
        WHERE p.comercio_id = p_comercio_id
          AND p.categoria_id = c.id
          AND p.marca_id = b.id
          AND (p_categoria_nombre IS NULL OR c.nombre = p_categoria_nombre)
          AND (p_marca_nombre IS NULL OR b.nombre = p_marca_nombre);

    ELSIF p_criterio = 'cost_only' THEN
        UPDATE productos p
        SET precio_costo = CASE
                WHEN p_redondeo > 0 THEN CEIL((precio_costo * v_factor) / p_redondeo) * p_redondeo
                ELSE ROUND(precio_costo * v_factor, 2)
            END,
            actualizado_en = NOW()
        FROM categorias c, marcas b
        WHERE p.comercio_id = p_comercio_id
          AND p.categoria_id = c.id
          AND p.marca_id = b.id
          AND (p_categoria_nombre IS NULL OR c.nombre = p_categoria_nombre)
          AND (p_marca_nombre IS NULL OR b.nombre = p_marca_nombre);
    END IF;

    GET DIAGNOSTICS v_cantidad = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'affected_count', v_cantidad,
        'percentage', p_porcentaje
    );
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION obtener_comercio_id_autenticado()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT comercio_id FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION obtener_rol_autenticado()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT rol FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$;

ALTER TABLE comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_preventa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_preventa_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comercio_usuarios_select" ON usuarios
    FOR SELECT USING (comercio_id = obtener_comercio_id_autenticado() OR auth.uid() = id);

CREATE POLICY "admin_usuarios_all" ON usuarios
    FOR ALL USING (comercio_id = obtener_comercio_id_autenticado() AND obtener_rol_autenticado() = 'ADMIN');

CREATE POLICY "comercio_productos_select" ON productos
    FOR SELECT USING (comercio_id = obtener_comercio_id_autenticado());

CREATE POLICY "manager_productos_modify" ON productos
    FOR ALL USING (comercio_id = obtener_comercio_id_autenticado() AND obtener_rol_autenticado() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "comercio_ventas_select" ON ventas
    FOR SELECT USING (comercio_id = obtener_comercio_id_autenticado());

CREATE POLICY "cajero_ventas_insert" ON ventas
    FOR INSERT WITH CHECK (comercio_id = obtener_comercio_id_autenticado() AND obtener_rol_autenticado() IN ('ADMIN', 'MANAGER', 'CASHIER'));

CREATE POLICY "comercio_pedidos_preventa_all" ON pedidos_preventa
    FOR ALL USING (comercio_id = obtener_comercio_id_autenticado());

CREATE POLICY "comercio_pedidos_detalles_all" ON pedidos_preventa_detalles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pedidos_preventa pp 
            WHERE pp.id = pedidos_preventa_detalles.pedido_id 
              AND pp.comercio_id = obtener_comercio_id_autenticado()
        )
    );

CREATE POLICY "comercio_stock_movimientos_select" ON stock_movimientos
    FOR SELECT USING (comercio_id = obtener_comercio_id_autenticado());

CREATE POLICY "comercio_precios_historial_select" ON precios_historial
    FOR SELECT USING (comercio_id = obtener_comercio_id_autenticado());

-- TRIGGER: Auto-crear usuario en usuarios al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.manejar_nuevo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, comercio_id, nombre_completo, rol)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'comercio_id')::INT, 1),
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'SELLER')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER en_auth_usuario_creado
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.manejar_nuevo_usuario();
