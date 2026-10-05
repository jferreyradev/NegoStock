-- ==============================================================================
-- NEGOTOCK: CONFIGURACIÓN, DESBLOQUEO Y CARGA DE EMPLEADOS EN SUPABASE
-- ==============================================================================
-- Copiá y pegá este script en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
-- ==============================================================================

-- 1. Eliminar la restricción que exigía que cada empleado estuviera en auth.users
ALTER TABLE IF EXISTS public.usuarios DROP CONSTRAINT IF EXISTS usuarios_id_fkey;

-- 2. Asegurar que id tenga generador automático UUID y agregar columna email
ALTER TABLE public.usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- 3. Actualizar la restricción CHECK de roles para incluir SUPERADMIN
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check 
    CHECK (rol IN ('SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'SELLER'));

-- 4. Desbloquear permisos RLS en la tabla usuarios para la app (anon y authenticated)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercio_usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "admin_usuarios_all" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_politica_general" ON public.usuarios;

CREATE POLICY "usuarios_politica_general" ON public.usuarios
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

GRANT ALL ON TABLE public.usuarios TO postgres, anon, authenticated, service_role;

-- 5. Insertar la plantilla de empleados del comercio en PostgreSQL
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

-- 6. Verificación de resultado
SELECT id, nombre_completo, email, rol, codigo_pin, esta_activo 
FROM public.usuarios 
WHERE comercio_id = 1;
