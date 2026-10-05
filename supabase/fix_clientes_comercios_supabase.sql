-- ==============================================================================
-- NEGOTOCK: DESBLOQUEO DE COMERCIO Y CLIENTES EN SUPABASE
-- ==============================================================================
-- Copiá y pegá este script en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
-- ==============================================================================

-- 1. Actualizar las funciones auxiliares para que reconozcan comercio 1 en modo mostrador
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

-- 2. Desbloquear políticas RLS para CLIENTES
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercio_clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "seller_clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_politica_general" ON public.clientes;

CREATE POLICY "clientes_politica_general" ON public.clientes
    FOR ALL
    TO anon, authenticated
    USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1))
    WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

GRANT ALL ON TABLE public.clientes TO postgres, anon, authenticated, service_role;

-- 3. Desbloquear políticas RLS para COMERCIOS
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comercios_politica_general" ON public.comercios;
DROP POLICY IF EXISTS "usuarios_comercio_select" ON public.comercios;
DROP POLICY IF EXISTS "admin_comercio_update" ON public.comercios;

CREATE POLICY "comercios_politica_general" ON public.comercios
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON TABLE public.comercios TO postgres, anon, authenticated, service_role;

-- 4. Insertar o actualizar el comercio principal (id = 1)
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
    cuit = EXCLUDED.cuit;

-- 5. Insertar clientes iniciales (Consumidor Final y Cuenta Gremio)
INSERT INTO public.clientes (comercio_id, nombre, tipo_documento, numero_documento, condicion_iva)
VALUES 
    (1, 'Consumidor Final', 'CF', '0', 'CONSUMIDOR_FINAL'),
    (1, 'Constructora del Valle', 'CUIT', '30-65432109-8', 'RESPONSABLE_INSCRIPTO')
ON CONFLICT DO NOTHING;

-- 6. Verificación
SELECT '✅ Comercios y Clientes habilitados con éxito' AS resultado;
