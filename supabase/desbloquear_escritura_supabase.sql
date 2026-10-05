-- ==============================================================================
-- NEGOTOCK: DESBLOQUEO TOTAL DE ESCRITURA Y RLS EN SUPABASE
-- ==============================================================================
-- Copiá y pegá TODO este script en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
--
-- ¿Por qué es necesario este script?
-- Por seguridad, PostgreSQL tenía activas políticas RLS que exigían un usuario
-- con sesión activa de Supabase Auth (auth.uid()). Al operar desde la app
-- con la clave 'anon' o empleados con PIN, PostgreSQL bloqueaba los INSERT y UPDATE,
-- impidiendo que se guarden los cambios en la base de datos en la nube.
-- ==============================================================================

-- 1. Actualizar funciones auxiliares para que reconozcan el comercio 1 por defecto
CREATE OR REPLACE FUNCTION obtener_comercio_id_autenticado()
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

CREATE OR REPLACE FUNCTION obtener_rol_autenticado()
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

-- 2. Permisos globales de esquema a anon y authenticated
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 3. PRODUCTOS: Habilitar SELECT, INSERT, UPDATE, DELETE para el comercio
DROP POLICY IF EXISTS "comercio_productos_select" ON productos;
DROP POLICY IF EXISTS "manager_productos_modify" ON productos;
DROP POLICY IF EXISTS "productos_politica_general" ON productos;

CREATE POLICY "productos_politica_general" ON productos
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- 4. CATEGORÍAS, MARCAS Y UNIDADES DE MEDIDA: Habilitar lectura y creación automática
DROP POLICY IF EXISTS "comercio_categorias_select" ON categorias;
DROP POLICY IF EXISTS "categorias_politica_general" ON categorias;
CREATE POLICY "categorias_politica_general" ON categorias
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "comercio_marcas_select" ON marcas;
DROP POLICY IF EXISTS "marcas_politica_general" ON marcas;
CREATE POLICY "marcas_politica_general" ON marcas
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "comercio_unidades_select" ON unidades_medida;
DROP POLICY IF EXISTS "unidades_politica_general" ON unidades_medida;
CREATE POLICY "unidades_politica_general" ON unidades_medida
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- 5. HISTORIAL DE PRECIOS: Permitir lectura e inserción de auditoría
DROP POLICY IF EXISTS "comercio_precios_historial_select" ON precios_historial;
DROP POLICY IF EXISTS "precios_historial_general" ON precios_historial;
CREATE POLICY "precios_historial_general" ON precios_historial
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- 6. KARDEX / MOVIMIENTOS DE STOCK: Permitir lectura e inserción de movimientos
DROP POLICY IF EXISTS "comercio_stock_movimientos_select" ON stock_movimientos;
DROP POLICY IF EXISTS "stock_movimientos_general" ON stock_movimientos;
CREATE POLICY "stock_movimientos_general" ON stock_movimientos
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- 7. VENTAS Y DETALLES: Permitir facturación y registro
DROP POLICY IF EXISTS "cajero_ventas_insert" ON ventas;
DROP POLICY IF EXISTS "comercio_ventas_select" ON ventas;
DROP POLICY IF EXISTS "ventas_politica_general" ON ventas;
CREATE POLICY "ventas_politica_general" ON ventas
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "ventas_detalles_general" ON ventas_detalles;
CREATE POLICY "ventas_detalles_general" ON ventas_detalles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 8. PREVENTAS: Permitir pedidos de mostrador y caja
DROP POLICY IF EXISTS "comercio_pedidos_preventa_all" ON pedidos_preventa;
CREATE POLICY "comercio_pedidos_preventa_all" ON pedidos_preventa
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "comercio_pedidos_detalles_all" ON pedidos_preventa_detalles;
CREATE POLICY "comercio_pedidos_detalles_all" ON pedidos_preventa_detalles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 9. USUARIOS Y PERFILES
DROP POLICY IF EXISTS "comercio_usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "admin_usuarios_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_politica_general" ON usuarios;
CREATE POLICY "usuarios_politica_general" ON usuarios
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- 10. CLIENTES Y PROVEEDORES
DROP POLICY IF EXISTS "clientes_politica_general" ON clientes;
CREATE POLICY "clientes_politica_general" ON clientes
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- 11. SECUENCIAS DE COMPROBANTES
DROP POLICY IF EXISTS "secuencias_politica_general" ON comprobantes_secuencias;
CREATE POLICY "secuencias_politica_general" ON comprobantes_secuencias
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

-- 12. COMERCIOS (Configuración e Identidad del Negocio)
DROP POLICY IF EXISTS "comercios_politica_general" ON comercios;
DROP POLICY IF EXISTS "usuarios_comercio_select" ON comercios;
DROP POLICY IF EXISTS "admin_comercio_update" ON comercios;
CREATE POLICY "comercios_politica_general" ON comercios
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Insertar o actualizar el comercio principal (id = 1)
INSERT INTO comercios (id, nombre, razon_social, cuit, iibb, condicion_iva, direccion, telefono, email, esta_activo)
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

-- 13. USUARIOS Y PERFILES (Empleados de mostrador y administración)
ALTER TABLE IF EXISTS public.usuarios DROP CONSTRAINT IF EXISTS usuarios_id_fkey;
ALTER TABLE public.usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check 
    CHECK (rol IN ('SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'SELLER'));

DROP POLICY IF EXISTS "comercio_usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "admin_usuarios_all" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_politica_general" ON public.usuarios;

CREATE POLICY "usuarios_politica_general" ON public.usuarios
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

GRANT ALL ON TABLE public.usuarios TO postgres, anon, authenticated, service_role;

-- Cargar empleados iniciales del comercio
INSERT INTO public.usuarios (id, comercio_id, nombre_completo, email, rol, codigo_pin, esta_activo)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 1, 'Superusuario (SaaS Master)', 'superadmin@negostock.com', 'SUPERADMIN', '9999', true),
    ('a0000000-0000-0000-0000-000000000002', 1, 'Juan Pérez (Propietario)', 'admin@ferreteria.com', 'ADMIN', '1234', true),
    ('a0000000-0000-0000-0000-000000000003', 1, 'Martín Gómez (Encargado)', 'encargado@ferreteria.com', 'MANAGER', '2222', true),
    ('a0000000-0000-0000-0000-000000000004', 1, 'Ana López (Cajera Turno Mañana)', 'ana@ferreteria.com', 'CASHIER', '3333', true),
    ('a0000000-0000-0000-0000-000000000005', 1, 'Carlos Ruiz (Vendedor Mostrador)', 'carlos@ferreteria.com', 'SELLER', '4444', true)
ON CONFLICT (id) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol,
    codigo_pin = EXCLUDED.codigo_pin,
    esta_activo = EXCLUDED.esta_activo;

-- ==============================================================================
-- FIN DEL SCRIPT: Notificación de confirmación
-- ==============================================================================
SELECT '✅ Politicas RLS actualizadas con éxito. Ahora la app puede leer, crear, modificar y auditar artículos, comercios y empleados en Supabase sin bloqueos.' AS resultado;
