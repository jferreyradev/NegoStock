-- ==============================================================================
-- NEGOTOCK: HABILITAR PERMISOS DE LECTURA Y ESCRITURA PARA LA APP WEB
-- Ejecutá esto en el SQL Editor de Supabase para desbloquear el acceso 'anon'
-- ==============================================================================

-- 1. Otorgar permisos de esquema y tablas a los roles de Supabase
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 2. Habilitar políticas de lectura del catálogo para el mostrador (comercio 1 por defecto)
DROP POLICY IF EXISTS "comercio_productos_select" ON productos;
CREATE POLICY "comercio_productos_select" ON productos
    FOR SELECT USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "comercio_categorias_select" ON categorias;
CREATE POLICY "comercio_categorias_select" ON categorias
    FOR SELECT USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "comercio_marcas_select" ON marcas;
CREATE POLICY "comercio_marcas_select" ON marcas
    FOR SELECT USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "comercio_unidades_select" ON unidades_medida;
CREATE POLICY "comercio_unidades_select" ON unidades_medida
    FOR SELECT USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "cajero_ventas_insert" ON ventas;
CREATE POLICY "cajero_ventas_insert" ON ventas
    FOR INSERT WITH CHECK (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));

DROP POLICY IF EXISTS "comercio_ventas_select" ON ventas;
CREATE POLICY "comercio_ventas_select" ON ventas
    FOR SELECT USING (comercio_id = COALESCE(obtener_comercio_id_autenticado(), 1));
