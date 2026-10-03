-- ==============================================================================
-- NEGOTOCK: VACIAR SOLO LOS DATOS DE LAS TABLAS (TRUNCATE)
-- Mantiene las tablas, columnas, índices, triggers y funciones intactas.
-- Ideal para limpiar los datos de prueba y volver a correr supabase/seed.sql
-- ==============================================================================

TRUNCATE TABLE 
    price_histories,
    sale_items, 
    sales, 
    pending_order_items, 
    pending_orders, 
    stock_movements, 
    purchase_items, 
    purchases, 
    products, 
    customers, 
    suppliers, 
    categories, 
    brands, 
    units_of_measure, 
    voucher_sequences, 
    cash_shifts, 
    profiles, 
    tenants 
CASCADE;

-- Reiniciar secuencias de IDs y comprobantes
DELETE FROM voucher_sequences;
ALTER SEQUENCE IF EXISTS tenants_id_seq RESTART WITH 1;
