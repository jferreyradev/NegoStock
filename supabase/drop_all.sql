-- ==============================================================================
-- NEGOTOCK: BORRADO TOTAL DE LA BASE DE DATOS (DROP SCHEMA)
-- ¡CUIDADO! Esto elimina todas las tablas, funciones, tipos, vistas y datos.
-- Deja la base de datos de Supabase como recién creada para correr schema.sql
-- ==============================================================================

-- 1. Eliminar esquema público completo y todo su contenido
DROP SCHEMA IF EXISTS public CASCADE;

-- 2. Recrear el esquema público en blanco
CREATE SCHEMA public;

-- 3. Reasignar permisos requeridos por Supabase
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 4. Habilitar extensión UUID estándar
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
