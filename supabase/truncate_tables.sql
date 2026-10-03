-- ==============================================================================
-- NEGOTOCK: VACIAR SOLO LOS DATOS DE LAS TABLAS (100% EN ESPAÑOL)
-- Mantiene intactas las tablas, columnas, funciones, triggers y políticas RLS.
-- Ideal para limpiar los datos de prueba y volver a correr supabase/seed.sql
-- ==============================================================================

TRUNCATE TABLE 
    precios_historial,
    ventas_detalles, 
    ventas, 
    pedidos_preventa_detalles, 
    pedidos_preventa, 
    stock_movimientos, 
    compras_detalles, 
    compras, 
    productos, 
    clientes, 
    proveedores, 
    categorias, 
    marcas, 
    unidades_medida, 
    comprobantes_secuencias, 
    cajas_turnos, 
    usuarios, 
    comercios 
CASCADE;

-- Reiniciar secuencias de comprobantes y comercios
DELETE FROM comprobantes_secuencias;
ALTER SEQUENCE IF EXISTS comercios_id_seq RESTART WITH 1;
