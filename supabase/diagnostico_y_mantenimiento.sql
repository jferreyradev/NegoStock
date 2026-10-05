-- ==============================================================================
-- NEGOTOCK: DIAGNÓSTICO, LIMPIEZA Y MANTENIMIENTO DE TAMAÑO EN SUPABASE
-- ==============================================================================
-- Copiá y pegá estas consultas en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/aphqdlmgggglvahbhksu/sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CONSULTAR TAMAÑO TOTAL DE LA BASE DE DATOS Y DEL ESQUEMA PUBLIC
-- ------------------------------------------------------------------------------
SELECT 
    current_database() AS base_de_datos,
    pg_size_pretty(pg_database_size(current_database())) AS peso_total_servidor,
    pg_size_pretty(SUM(pg_total_relation_size(c.oid))::bigint) AS peso_tablas_negotock
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public';

-- ------------------------------------------------------------------------------
-- 2. DESGLOSE DETALLADO TABLA POR TABLA (DATOS VS ÍNDICES VS TUPLAS MUERTAS)
-- ------------------------------------------------------------------------------
-- Identifica qué tablas están ocupando más espacio y cuántas tuplas muertas
-- (bloat por UPDATEs frecuentes de stock o precios) necesitan limpieza.
SELECT
    relname AS tabla,
    n_live_tup AS filas_activas,
    n_dead_tup AS tuplas_muertas_bloat,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS peso_total,
    pg_size_pretty(pg_relation_size(c.oid)) AS peso_solo_datos,
    pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) AS peso_indices,
    CASE 
        WHEN (n_live_tup + n_dead_tup) > 0 
        THEN ROUND((n_dead_tup::numeric / (n_live_tup + n_dead_tup)::numeric) * 100, 1) || '%'
        ELSE '0%'
    END AS porcentaje_bloat
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public'
ORDER BY pg_total_relation_size(c.oid) DESC;

-- ------------------------------------------------------------------------------
-- 3. DETECTAR ÍNDICES INNECESARIOS O NUNCA USADOS
-- ------------------------------------------------------------------------------
-- Los índices ocupan hasta el 50% del almacenamiento. Si un índice tiene 0 lecturas,
-- está ocupando espacio en disco sin brindar beneficio.
SELECT
    schemaname,
    relname AS tabla,
    indexrelname AS indice,
    idx_scan AS veces_usado,
    pg_size_pretty(pg_relation_size(indexrelid)) AS tamano_indice
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- ------------------------------------------------------------------------------
-- 4. ACCIÓN DE LIMPIEZA INMEDIATA: RECLAMAR ESPACIO DE TUPLAS MUERTAS (VACUUM)
-- ------------------------------------------------------------------------------
-- Ejecutá esta instrucción para que PostgreSQL compacte las tablas y reutilice
-- los bloques liberados por modificaciones de precios y stock.
VACUUM (VERBOSE, ANALYZE);

-- ------------------------------------------------------------------------------
-- 5. RECONSTRUCCIÓN Y COMPACTACIÓN DE ÍNDICES FRAGMENTADOS
-- ------------------------------------------------------------------------------
-- Si hubo miles de ventas o actualizaciones, los índices B-Tree se fragmentan.
-- Este comando desfragmenta los índices del esquema público para que pesen menos.
REINDEX SCHEMA public;

-- ------------------------------------------------------------------------------
-- 6. PODA / ARCHIVADO DE REGISTROS HISTÓRICOS ANTIGUOS (OPCIONAL / PERIÓDICO)
-- ------------------------------------------------------------------------------
-- Si en el futuro tu base acumula años de ventas y querés bajar el tamaño:
-- (Descomentar y ajustar el intervalo cuando sea necesario)

-- A) Purgar movimientos de stock de más de 1 año (conservando solo el saldo actual):
-- DELETE FROM stock_movimientos WHERE creado_en < NOW() - INTERVAL '1 year';

-- B) Purgar histórico de cambios de precios de más de 1 año:
-- DELETE FROM precios_historial WHERE creado_en < NOW() - INTERVAL '1 year';

-- C) Luego de borrar históricos antiguos, liberar el espacio físico en disco:
-- VACUUM (FULL, ANALYZE) stock_movimientos;
-- VACUUM (FULL, ANALYZE) precios_historial;
