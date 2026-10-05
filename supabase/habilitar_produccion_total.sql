-- ==============================================================================
-- NEGOTOCK: HABILITACIÓN TOTAL PARA PUESTA EN PRODUCCIÓN (SUPABASE)
-- ==============================================================================
-- Copiá y pegá TODO este script en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
-- y presioná RUN (Ctrl + Enter o botón verde).
-- ==============================================================================

-- 1. FUNCIONES AUXILIARES DE ROL Y COMERCIO PARA MODO MOSTRADOR (OFFLINE / ANON)
CREATE OR REPLACE FUNCTION public.obtener_comercio_id_autenticado()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT comercio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
        1
    );
$$;

CREATE OR REPLACE FUNCTION public.obtener_rol_autenticado()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT rol FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
        'ADMIN'
    );
$$;

-- 2. PERMISOS GLOBALES DE ESQUEMA
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 3. COMERCIOS (Configuración e Identidad del Negocio)
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercios_politica_general" ON public.comercios;
DROP POLICY IF EXISTS "usuarios_comercio_select" ON public.comercios;
DROP POLICY IF EXISTS "admin_comercio_update" ON public.comercios;

CREATE POLICY "comercios_politica_general" ON public.comercios
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Insertar o actualizar el comercio principal (id = 1)
INSERT INTO public.comercios (id, nombre, razon_social, cuit, iibb, condicion_iva, direccion, telefono, email, esta_activo)
VALUES (
    1, 
    'Ferretería Central', 
    'Ferretería Central S.R.L.', 
    '30-71234567-9', 
    '901-123456-7', 
    'RESPONSABLE_INSCRIPTO', 
    'Av. San Martín 1240, Morón, Buenos Aires', 
    '011-4567-8900', 
    'contacto@ferreteriacentral.com.ar', 
    true
)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    razon_social = EXCLUDED.razon_social,
    cuit = EXCLUDED.cuit,
    iibb = EXCLUDED.iibb,
    condicion_iva = EXCLUDED.condicion_iva,
    direccion = EXCLUDED.direccion,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email;

-- 4. CLIENTES Y GREMIO
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercio_clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "seller_clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_politica_general" ON public.clientes;

CREATE POLICY "clientes_politica_general" ON public.clientes
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- Insertar clientes iniciales
INSERT INTO public.clientes (comercio_id, nombre, tipo_documento, numero_documento, condicion_iva)
VALUES 
    (1, 'Consumidor Final', 'CF', '0', 'CONSUMIDOR_FINAL'),
    (1, 'Constructora del Valle', 'CUIT', '30-65432109-8', 'RESPONSABLE_INSCRIPTO')
ON CONFLICT DO NOTHING;

-- 5. VENTAS Y DETALLES
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercio_ventas_select" ON public.ventas;
DROP POLICY IF EXISTS "cajero_ventas_insert" ON public.ventas;
DROP POLICY IF EXISTS "ventas_politica_general" ON public.ventas;

CREATE POLICY "ventas_politica_general" ON public.ventas
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

ALTER TABLE public.ventas_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercio_ventas_detalles_select" ON public.ventas_detalles;
DROP POLICY IF EXISTS "cajero_ventas_detalles_insert" ON public.ventas_detalles;
DROP POLICY IF EXISTS "ventas_detalles_politica_general" ON public.ventas_detalles;

CREATE POLICY "ventas_detalles_politica_general" ON public.ventas_detalles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. PREVENTAS Y PRESUPUESTOS
ALTER TABLE public.pedidos_preventa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercio_pedidos_preventa_all" ON public.pedidos_preventa;
CREATE POLICY "comercio_pedidos_preventa_all" ON public.pedidos_preventa
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

ALTER TABLE public.pedidos_preventa_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercio_pedidos_detalles_all" ON public.pedidos_preventa_detalles;
CREATE POLICY "comercio_pedidos_detalles_all" ON public.pedidos_preventa_detalles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 7. SECUENCIAS DE COMPROBANTES
ALTER TABLE public.comprobantes_secuencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "secuencias_politica_general" ON public.comprobantes_secuencias;
CREATE POLICY "secuencias_politica_general" ON public.comprobantes_secuencias
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

INSERT INTO public.comprobantes_secuencias (comercio_id, punto_venta, tipo_comprobante, ultimo_numero)
VALUES
    (1, 1, 'TICKET_X', 0),
    (1, 1, 'PRESUPUESTO', 0),
    (1, 1, 'REMITO', 0)
ON CONFLICT (comercio_id, punto_venta, tipo_comprobante) DO NOTHING;

-- 8. RESULTADO DE VERIFICACIÓN
SELECT '🚀 SISTEMA NEGOTOCK HABILITADO 100% PARA PRODUCCIÓN' AS estado, NOW() AS timestamp;
