-- ==============================================================================
-- NEGOTOCK: HABILITAR PERMISOS DE LECTURA Y ESCRITURA EN COMERCIOS (SUPABASE)
-- ==============================================================================
-- Si actualizaste los datos o dirección del comercio desde la app y al recargar
-- o abrir en otro dispositivo no se reflejaron, es porque PostgreSQL bloqueó el
-- guardado en Supabase con el error RLS 42501 (permiso denegado para el rol anon).
--
-- INSTRUCCIONES:
-- 1. Abrí tu panel de Supabase: https://supabase.com/dashboard
-- 2. Entrá en tu proyecto -> SQL Editor -> New Query.
-- 3. Pegá y ejecutá este script con el botón "Run".
-- ==============================================================================

-- 1. Activar RLS en la tabla comercios
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas previas que pudieran bloquear
DROP POLICY IF EXISTS "comercios_politica_general" ON public.comercios;
DROP POLICY IF EXISTS "usuarios_comercio_select" ON public.comercios;
DROP POLICY IF EXISTS "admin_comercio_update" ON public.comercios;

-- 3. Crear política permisiva para que la aplicación POS (clave anon o autenticada)
--    pueda consultar y actualizar los datos fiscales y la dirección del comercio
CREATE POLICY "comercios_politica_general" ON public.comercios
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Asegurar privilegios para los roles anon y authenticated
GRANT ALL ON TABLE public.comercios TO postgres, anon, authenticated, service_role;

-- 5. Insertar o sincronizar el registro base del comercio 1 si estuviera vacío
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
ON CONFLICT (id) DO NOTHING;

SELECT '✅ Permisos de la tabla comercios habilitados correctamente en Supabase.' AS resultado;
