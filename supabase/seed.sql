-- SEED DATA GENERADO AUTOMÁTICAMENTE PARA NEGOTOCK (100% EN ESPAÑOL)
-- Comercio por defecto: Ferretería Central (comercio_id = 1)
INSERT INTO comercios (id, nombre, razon_social, cuit)
VALUES (1, 'Ferretería Central', 'Ferretería Central S.R.L.', '30-71234567-9')
ON CONFLICT (id) DO NOTHING;

-- Unidades de Medida
INSERT INTO unidades_medida (comercio_id, nombre, abreviatura, permite_decimales) VALUES
(1, 'Unidad', 'u', false),
(1, 'Metro', 'm', true),
(1, 'Rollo', 'rollo', false),
(1, 'Bolsa', 'bolsa', false),
(1, 'Kilo', 'kg', true),
(1, 'Litro', 'lt', true)
ON CONFLICT DO NOTHING;

-- Categorías
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'HERRAMIENTAS') ON CONFLICT DO NOTHING;
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'SEGURIDAD') ON CONFLICT DO NOTHING;
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'BULONERIA') ON CONFLICT DO NOTHING;
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'GENERAL') ON CONFLICT DO NOTHING;
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'PINTURERIA') ON CONFLICT DO NOTHING;
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'ELECTRICIDAD') ON CONFLICT DO NOTHING;
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'ALBAÑIL') ON CONFLICT DO NOTHING;
INSERT INTO categorias (comercio_id, nombre) VALUES (1, 'MANGUERAS') ON CONFLICT DO NOTHING;

-- Marcas detectadas
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'UCU') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'RAPTOR') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'PIM') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'AWE') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'SAYLENS') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'TACSA') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'MOTA') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'CANOR') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'SICA') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'GORYL') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'GKA') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'GKS') ON CONFLICT DO NOTHING;
INSERT INTO marcas (comercio_id, nombre) VALUES (1, 'GENÉRICO') ON CONFLICT DO NOTHING;

-- Clientes iniciales para mostrador y gremio
INSERT INTO clientes (comercio_id, nombre, tipo_documento, numero_documento, condicion_iva) VALUES
(1, 'Consumidor Final', 'CF', '0', 'CONSUMIDOR_FINAL'),
(1, 'Constructora del Valle', 'CUIT', '30-65432109-8', 'RESPONSABLE_INSCRIPTO')
ON CONFLICT DO NOTHING;

-- Inserción de Productos
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2030',
    'ALICATE ABRIR ARANDELAS RECTO 180 MM Q807',
    17530.00,
    34800.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2013',
    'ALICATE PUNTA SEMI REDONDA 160 MM Q306',
    13700.00,
    27400.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2014',
    'ALICATE PUNTA SEMI REDONDA 180 MM',
    17900.00,
    35800.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12004',
    'ANTEOJOS DE SEGURIDAD UCU',
    1400.00,
    2800.00,
    0.00,
    72.0000,
    20.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'UCU' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8034',
    'ARANDELAS (B) 1/4 CHAPISTA ZINCADO',
    40.00,
    80.00,
    0.00,
    185.0000,
    80.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8007',
    'ARANDELAS (D) 3/8 CHAPISTA ZINCADO',
    70.00,
    150.00,
    0.00,
    112.0000,
    30.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8006',
    'ARANDELAS (F) 1/2 CHAPISTA ZINCADO',
    238.00,
    500.00,
    0.00,
    93.0000,
    20.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '6',
    'ARCO DE SIERRA PROFESIONAL CL',
    16850.00,
    33700.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8028',
    'AUTOP PARA MADERA (Z) 10X2 NEGROS RAPTOR',
    64.00,
    130.00,
    0.00,
    200.0000,
    50.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'RAPTOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8027',
    'AUTOP PVC AGUJA 4X25',
    26.00,
    50.00,
    0.00,
    2000.0000,
    500.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8026',
    'AUTOP T1 MECHA (H) 10X1',
    45.00,
    100.00,
    0.00,
    2885.0000,
    500.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8025',
    'AUTOP T1 MECHA (I) 10X1.1/2',
    68.00,
    135.00,
    0.00,
    3000.0000,
    500.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2015',
    'AlLICATE PRESION DE 5 1/2 Q505',
    10424.00,
    20000.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2016',
    'Alicate Universal Q701 120mm',
    10143.00,
    20280.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10019',
    'BANDEJAS PLANAS',
    3028.00,
    5800.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12000',
    'BARBIJO KN95',
    1735.00,
    1000.00,
    0.00,
    60.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '30',
    'BROCA DIAMANTADA P/ AMOLADORA 35 MM',
    21050.00,
    41100.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '27',
    'BROCA ESCALONADA ACERO RAPIDO 4 A 12MM RAPTOR',
    13380.00,
    26300.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'RAPTOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '25',
    'BROCA ESCALONADA ACERO RAPIDO 6 A 18MM RAPTOR',
    21396.00,
    42000.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'RAPTOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14015',
    'CABLE TIPO TALLER CU PVC 3X1,5MM2 500V METRO PIM',
    1600.00,
    3200.00,
    0.00,
    300.0000,
    70.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'PIM' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14007',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X1,5 MM2 MARRON 750V METRO',
    403.00,
    850.00,
    0.00,
    200.0000,
    50.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14008',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X1,5 MM2 ROJO 750V METRO AWE',
    403.00,
    810.00,
    0.00,
    100.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'AWE' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14009',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X1,5 MM2 V/A 750V METRO AWE',
    403.00,
    810.00,
    0.00,
    100.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'AWE' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14000',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X1,5MM2 CELESTE 750V METRO AWE',
    403.00,
    800.00,
    0.00,
    200.0000,
    30.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'AWE' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14011',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X2,5 MM2 CELESTE 750V METRO AWE',
    650.00,
    1300.00,
    0.00,
    200.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'AWE' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14010',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X2,5 MM2 CELESTE 750V METRO AWE',
    650.00,
    1300.00,
    0.00,
    200.0000,
    50.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'AWE' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14012',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X2,5 MM2 MARRON 750V METRO AWE',
    650.00,
    1300.00,
    0.00,
    200.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'AWE' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14013',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X2,5MM2 ROJO 750V METRO AWE',
    650.00,
    1300.00,
    0.00,
    100.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'AWE' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14014',
    'CABLE UNIPOLAR FLEXIBLE CU PVC 1X2,5MM2 V/A 750V METRO',
    650.00,
    1300.00,
    0.00,
    100.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12013',
    'CASCOS DE SEGURIDAD SAYLENS',
    6400.00,
    12800.00,
    0.00,
    10.0000,
    4.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'SAYLENS' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8',
    'CEPILLO BRONCEADO F116A CABO ROJO',
    4070.00,
    8140.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12002',
    'CHALECO REFLECTIVO ECONOMICO',
    1900.00,
    3800.00,
    0.00,
    20.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14016',
    'CINTA AISLADORA PVC NEGRA 19MM X 20 MTS TACSA',
    1200.00,
    2400.00,
    0.00,
    100.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'TACSA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '48',
    'CINTA DE PAPEL ENMASCARAR 18MM MOTA',
    1800.00,
    3600.00,
    0.00,
    24.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '49',
    'CINTA DE PAPEL ENMASCARAR 36MM CP4036 MOTA',
    3500.00,
    7000.00,
    0.00,
    24.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12001',
    'CINTA DEMARCATORIA X ROLLO 200 MTS',
    4545.00,
    9000.00,
    0.00,
    6.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '40002',
    'CUCHARA DE ALBAÑIL SOLDADA 8 HH108',
    6700.00,
    13400.00,
    0.00,
    5.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ALBAÑIL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '11',
    'CUTTER PLASTICO HOJA 9MM TR C109',
    3900.00,
    7800.00,
    0.00,
    6.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12010',
    'DELANTAL SOLDADOR CUERO AMARILLO',
    12300.00,
    24600.00,
    0.00,
    3.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2017',
    'DESTORNILLADOR AISLADO RECTO 4MM DIR4',
    4900.00,
    9800.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2018',
    'DESTORNILLADOR AISLADO RECTO 6MM DIR6',
    6600.00,
    13200.00,
    0.00,
    5.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2019',
    'DESTORNILLADOR PHILLIPS 2X300',
    6200.00,
    12400.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2020',
    'DESTORNILLADOR PHILLIPS 3X150',
    5800.00,
    11600.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '22',
    'DISCO CARBURO DE TUNGSTENO P/ MADERA 230MM RAPTOR',
    30800.00,
    59500.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'RAPTOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '23',
    'DISCO DE CORTE 115 X 1 MM RAPTOR',
    625.00,
    650.00,
    0.00,
    50.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'RAPTOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '20',
    'DISCO DE CORTE 115X 6 DESBASTE RAPTOR',
    8700.00,
    3400.00,
    0.00,
    10.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'RAPTOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '19',
    'DISCO DIAMANTADO LISO 115 MM SW115 CONTINUO 4 1/2',
    7300.00,
    14600.00,
    0.00,
    5.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '18',
    'DISCO DIAMANTADO MULTITURBO DE SL 115 4 1/2',
    5600.00,
    11200.00,
    0.00,
    6.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '21',
    'DISCO DIAMANTADO TURBO 115 MM X 8 MM RAPTOR',
    18900.00,
    9400.00,
    9000.00,
    4.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'RAPTOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2029',
    'ENGRAMPADORA CLAVADORA METALICA MOTA GE32',
    42100.00,
    58800.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '60',
    'ESPATULA ACERO INOX 1 1/2 HE15',
    3750.00,
    7500.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10000',
    'ESPATULA ACERO INOX 6 HE60',
    6180.00,
    12360.00,
    0.00,
    4.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '64',
    'ESPUMA PU 1/300 - 520806',
    15349.00,
    30500.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8011',
    'GANCHO PARA TEJIDO 5/16 X 150',
    793.00,
    1400.00,
    0.00,
    200.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8012',
    'GANCHO PARA TEJIDO 5/16 X 200',
    925.00,
    1700.00,
    0.00,
    100.0000,
    50.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '29',
    'GRAMPAS N° DE 6 MM X MIL UNIDADES GG306 (MOTA)',
    3300.00,
    6600.00,
    0.00,
    10.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '36',
    'GRAMPAS N° DE 8MM X 1000 UNIDADES GG308',
    3800.00,
    7600.00,
    0.00,
    7.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '37',
    'GRAMPAS N°3 12MM X 1000 UNIDADES GG312',
    4900.00,
    9800.00,
    9500.00,
    22.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12007',
    'GUANTE NEGRO POLIESTER PU DP',
    909.00,
    1800.00,
    0.00,
    108.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12008',
    'GUANTE NITRILO',
    3300.00,
    6600.00,
    0.00,
    5.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12009',
    'GUANTE VAGUETA P/C CANOR',
    4800.00,
    9600.00,
    0.00,
    30.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'CANOR' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12003',
    'GUANTES MOTEADOS',
    750.00,
    1500.00,
    0.00,
    100.0000,
    30.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12011',
    'GUANTES NITRILO DESCARTABLES',
    165.00,
    350.00,
    0.00,
    100.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '62',
    'HACHA LEÑADORA 4.5 LB CABO FIBRA 90 CM MHT',
    69630.00,
    145000.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '63',
    'HACHITA TIPO AUSTRIACA PULIDA MHF MOTA',
    25620.00,
    51000.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '7',
    'HOJA DE SIERRA BIMETALICA 12 32 DIENTES',
    32580.00,
    32580.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14005',
    'INTERRUPTOR DIFERENCIAL 2X25 30MA SICA',
    24374.00,
    48746.00,
    0.00,
    3.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'SICA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14006',
    'INTERRUPTOR DIFERENCIAL 2X40A 30MA - SICA',
    26437.00,
    52800.00,
    0.00,
    3.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'SICA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14001',
    'INTERRUPTOR TERMOMAGNECTICO 1X15A CURVA C 3KA/4,5KA SICA',
    2642.00,
    5300.00,
    0.00,
    5.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'SICA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14002',
    'INTERRUPTOR TERMOMAGNETICO 1X10A CURVA 3KA/4,5 SICA',
    2540.00,
    6100.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'SICA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14003',
    'INTERRUPTOR TERMOMAGNETICO 1X20A CURVA C 3KA/4,5KA SICA',
    2640.00,
    5300.00,
    0.00,
    5.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'SICA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '14004',
    'INTERRUPTOR TERMOMAGNETICO 1X25A CURVA C 3KA/4,5KA SICA',
    2642.00,
    5300.00,
    0.00,
    5.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ELECTRICIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'SICA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2021',
    'JUEGO 6 DETORNILLADORES PRECISION',
    18600.00,
    37200.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '24',
    'JUEGO DE PUNTAS TORX 1/4 X 50MM',
    8630.00,
    17260.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2022',
    'JUEGOS DE DESTORNILLADORES DJ3P 3 PLANOS',
    10470.00,
    20900.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '51',
    'LAPIZ CARPINTERO DE 180MM LP18 MOTA',
    739.00,
    1470.00,
    0.00,
    50.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '55',
    'LIJA AL AGUA (I) 280 GR AX3280',
    700.00,
    1400.00,
    1350.00,
    100.0000,
    20.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '56',
    'LIJA AL AGUA (J) 320 AX3320',
    700.00,
    1400.00,
    1350.00,
    75.0000,
    20.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '44',
    'LIJA TELA ESMERIL (E) 80GR AX2080',
    1105.00,
    2200.00,
    0.00,
    50.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '45',
    'LIJA TELA ESMERIL (F) 100 GR AX2100',
    1105.00,
    2100.00,
    0.00,
    50.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '46',
    'LIJA TELA ESMERIL (L)280GR AX2280',
    1105.00,
    2100.00,
    0.00,
    50.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '47',
    'LIJA TELA ESMERIL (M) 320GR AX2320',
    1105.00,
    2100.00,
    0.00,
    100.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '52',
    'LIMPIA CONTACTOS 216 ML LC02',
    7700.00,
    15400.00,
    0.00,
    12.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '41',
    'LLANA DENTADA 6X6 MOTA HLD06 DE 280X120MM',
    15500.00,
    31000.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '42',
    'LLANA DENTADA 8X8 MOTA HLDO8 280X120MM',
    15500.00,
    31000.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'MOTA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2028',
    'LLAVE AJUSTABLE LLC12 - LLP12',
    38040.00,
    68.04,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2027',
    'LLAVE AJUSTABLE LLCO6',
    13830.00,
    27660.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2000',
    'LLAVE COMBINADA DE 10MM',
    5200.00,
    10300.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2001',
    'LLAVE COMBINADA DE 12 MM',
    6100.00,
    12200.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2002',
    'LLAVE COMBINADA DE 13 MM',
    6600.00,
    13200.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2003',
    'LLAVE COMBINADA DE 16MM',
    8500.00,
    16700.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2004',
    'LLAVE COMBINADA DE 19MM',
    10200.00,
    20350.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2005',
    'LLAVE COMBINADA ES10 3/8',
    5625.00,
    11250.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2006',
    'LLAVE COMBINADA ES11 7/16',
    6825.00,
    13600.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2007',
    'LLAVE COMBINADA ES13 1/2',
    6900.00,
    13800.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2008',
    'LLAVE COMBINADA ES16 5/8',
    9050.00,
    18100.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2009',
    'LLAVE COMBINADA ESO6 1/4',
    4800.00,
    9600.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2010',
    'LLAVE COMBINADA ESO8 5/16',
    4870.00,
    9740.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2011',
    'LLAVE COMBINADAS DE 9MM',
    4900.00,
    9800.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2012',
    'LLAVE COMBINADFA DE 11 MM',
    5900.00,
    11800.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12014',
    'MAMELUCO DESCARTABLES 47 GR',
    4200.00,
    8400.00,
    0.00,
    15.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '6000',
    'MANGUERA CRISTAL 3/4 X METRO',
    36700.00,
    3000.00,
    0.00,
    75.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'MANGUERAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'METRO%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '6001',
    'MANGUERA TRENZADA 3/4 X 25 10 BAR',
    58740.00,
    117485.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'MANGUERAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2024',
    'MAZA ALBAÑIL FORJADA 1500 GR 15F',
    24290.00,
    48580.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2026',
    'MAZA DE GOMA 700GR CABO DE FIBRA MG07',
    18500.00,
    37000.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2025',
    'MAZA DE GOMA 500GR CABO DE FIBRA MG05',
    13340.00,
    26680.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '26',
    'MECHA DE WIDIA WHS 6 - 614606',
    3080.00,
    6100.00,
    0.00,
    15.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '28',
    'MECHA DE WIDIA WHS 8 - 614608',
    4300.00,
    8600.00,
    0.00,
    15.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2031',
    'MINI PINZA C.V. 1/2 CAÑA 130 MM Q703',
    10280.00,
    20400.00,
    0.00,
    1.0000,
    0.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '57',
    'PAPEL DE LIJA (C) 60 GR AX046 MADERA, PINTURA MASILLA',
    480.00,
    970.00,
    0.00,
    75.0000,
    20.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '59',
    'PAPEL DE LIJA (E) 100 GR AX031 MADERA, PINTURA MASILLA',
    480.00,
    1000.00,
    970.00,
    75.0000,
    20.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '58',
    'PAPEL DE LIJA (G) 150 GR AX025 MADERA, PINTURA MASILLA',
    440.00,
    900.00,
    880.00,
    75.0000,
    20.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10002',
    'PINCELES VIROLA 1 N° 10 GORYL AZUL',
    2228.00,
    4500.00,
    0.00,
    36.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GORYL' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10004',
    'PINCELES VIROLA 1 N° 20 GORYL AZUL',
    3555.00,
    6900.00,
    0.00,
    30.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GORYL' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10003',
    'PINCELES VIROLA 1 N°15 GORYL AZUL',
    3932.00,
    7800.00,
    0.00,
    30.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GORYL' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10005',
    'PINCELES VIROLA 1 N°25 GORYL AZUL',
    4980.00,
    9960.00,
    0.00,
    24.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GORYL' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10006',
    'PINCELES VIROLA 1 N°30 GORYL AZUL',
    5900.00,
    11800.00,
    0.00,
    19.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GORYL' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10001',
    'PINCELES VIROLA 1 N°7 GORYL AZUL',
    2100.00,
    4200.00,
    0.00,
    24.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GORYL' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10007',
    'PINCELES VIROLA 2 N° 10 BLANCO',
    3600.00,
    7200.00,
    0.00,
    24.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10008',
    'PINCELES VIROLA 2 N°15 BLANCO',
    5300.00,
    10600.00,
    0.00,
    18.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10009',
    'PINCELES VIROLA 2 N°20 BLANCO',
    6700.00,
    13400.00,
    0.00,
    12.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10010',
    'PINCELES VIROLA 2 N°25 BLANCO',
    8900.00,
    17800.00,
    0.00,
    12.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10011',
    'PINCELES VIROLA 2 N°30 BLANCO',
    10800.00,
    21600.00,
    0.00,
    13.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10012',
    'PINCELETA VIROLA 4 N°40',
    7450.00,
    14900.00,
    0.00,
    12.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '39',
    'PIQUETA DE SOLDAR 300 GR CABO MS30',
    12350.00,
    24700.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '50',
    'PRECINTO BLANCO 4.8 X 300 MM',
    85.00,
    200.00,
    170.00,
    300.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '53',
    'PRECINTO NEGRO 4.8 X 200MM',
    60.00,
    150.00,
    120.00,
    600.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '54',
    'PRECINTO NEGRO 4.8 X 250 MM',
    70.00,
    150.00,
    140.00,
    600.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12005',
    'PROTECTOR AUDITIVO (TAPON)',
    750.00,
    1500.00,
    0.00,
    100.0000,
    40.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '12006',
    'PROTECTOR AUDITIVO COPA',
    9920.00,
    19800.00,
    0.00,
    10.0000,
    4.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'SEGURIDAD' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8013',
    'REMACHE TUBULAR LINEA FRENOS ACERO C - PLANA 4 X 20 ZINCADO DORADO',
    11.00,
    22.00,
    0.00,
    1000.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10013',
    'RODILLO ANTIGOTA N°17',
    8300.00,
    16600.00,
    0.00,
    24.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10014',
    'RODILLO ANTIGOTA N°22',
    9350.00,
    18700.00,
    0.00,
    24.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10015',
    'RODILLO ARTE FOAM N°07',
    4200.00,
    8400.00,
    0.00,
    23.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10016',
    'RODILLO ARTE FOAM N°11',
    5300.00,
    10300.00,
    0.00,
    30.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10017',
    'RODILLO ARTE FOAM N°16',
    6700.00,
    13400.00,
    0.00,
    8.0000,
    4.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '10018',
    'RODILLO ELEFANTE N° 22 LANA DORADA',
    14500.00,
    28400.00,
    0.00,
    44.0000,
    10.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'PINTURERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '9',
    'RULETA CINTA METRICA CLASSIC C/FRENO 5MTROS X 19MM',
    19890.00,
    39780.00,
    0.00,
    4.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '4',
    'Ruleta Cinta Metrica Premiun C/ Freno 5 Mtros',
    23308.00,
    46600.00,
    0.00,
    6.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '32',
    'SELLADOR ACRILICO PREMIUN 545072',
    9200.00,
    18300.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '4000',
    'SEPARADOR CRUZ 1.5 MM BOLSA X 250 UNIDADES',
    3700.00,
    7400.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ALBAÑIL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'BOLSA%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '4001',
    'SEPARADOR CRUZ 5.5 MM BOLSA X 150 UNIDADES',
    4750.00,
    9400.00,
    0.00,
    2.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'ALBAÑIL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'BOLSA%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '35',
    'SILICONA ACETICA MINIT TRANSPARENTE 100 ML 630615',
    6300.00,
    12600.00,
    0.00,
    6.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '33',
    'SILICONA NEUTRA 260ML 600692 NEGRA NUEVO PACK',
    9900.00,
    19700.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8030',
    'TACO GKA S AUTO - ROSCANTE + TORNILLO 608526',
    239.00,
    480.00,
    0.00,
    250.0000,
    70.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GKA' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8029',
    'TACO GKS + TORNILLO 608525',
    340.00,
    680.00,
    0.00,
    250.0000,
    70.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GKS' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '43',
    'TANZA TIRA LINEA CHOCLA',
    18170.00,
    36340.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'GENERAL' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8005',
    'TARUGO DE NYLON S 14 608984',
    270.00,
    540.00,
    0.00,
    200.0000,
    70.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8032',
    'TARUGO S 10 608010',
    102.00,
    200.00,
    0.00,
    100.0000,
    30.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8033',
    'TARUGO S 6 608006',
    37.00,
    70.00,
    0.00,
    200.0000,
    70.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8031',
    'TARUGO S 8 608008',
    50.00,
    100.00,
    0.00,
    200.0000,
    70.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8004',
    'TARUGO SA 10 CON ARANDELA 608210',
    122.00,
    300.00,
    0.00,
    500.0000,
    200.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8003',
    'TARUGO SA 12 CON ARANDELA 608242',
    183.00,
    360.00,
    0.00,
    500.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8002',
    'TARUGO SA CON ARANDELA 608236',
    23.00,
    70.00,
    0.00,
    3000.0000,
    300.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8000',
    'TARUGOS N° 5',
    11.00,
    50.00,
    0.00,
    3000.0000,
    300.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8001',
    'TARUGOS TRES CORTES N° 10 TC10G',
    105.00,
    300.00,
    0.00,
    1500.0000,
    500.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '2023',
    'TENASA ARMADOR DE 12 CORTE ENTERO TA230',
    27180.00,
    47500.00,
    0.00,
    3.0000,
    1.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'HERRAMIENTAS' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8010',
    'TIRAFONDO (D) 3/16 X 1.3/4',
    55.00,
    110.00,
    0.00,
    300.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8008',
    'TIRAFONDO ZINCADO (B) 3/16 X 1.1/4',
    50.00,
    100.00,
    0.00,
    300.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8009',
    'TIRAFONDO ZINCADO (C) 3/16 X 1.1/2',
    52.00,
    104.00,
    0.00,
    300.0000,
    100.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8018',
    'VARILLA ROSCADA ZINCADA (B) 3/16',
    1037.00,
    2050.00,
    0.00,
    10.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8014',
    'VARILLA ROSCADA ZINCADA (C) 1/4',
    1049.00,
    2100.00,
    0.00,
    30.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8015',
    'VARILLA ROSCADA ZINCADA (D) 5/16',
    1650.00,
    3300.00,
    0.00,
    20.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8016',
    'VARILLA ROSCADA ZINCADA (E) 3/8',
    2335.00,
    4700.00,
    0.00,
    20.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8019',
    'VARILLA ROSCADA ZINCADA (F) 7/16',
    3510.00,
    8200.00,
    0.00,
    15.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8017',
    'VARILLA ROSCADA ZINCADA (G) 1/2',
    4950.00,
    9900.00,
    0.00,
    15.0000,
    5.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8024',
    'VARILLA ROSCADA ZINCADA (H) X 9/16',
    5700.00,
    11400.00,
    0.00,
    10.0000,
    4.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8022',
    'VARILLA ROSCADA ZINCADA (I) X 5/8',
    7175.00,
    14200.00,
    0.00,
    10.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8021',
    'VARILLA ROSCADA ZINCADA (J) X 3/4',
    10470.00,
    20940.00,
    0.00,
    10.0000,
    3.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8023',
    'VARILLA ROSCADA ZINCADA (K) 7/8',
    17550.00,
    35100.00,
    0.00,
    5.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    1,
    '8020',
    'VARILLA ROSCADA ZINCADA (L) X1',
    23237.00,
    46400.00,
    0.00,
    6.0000,
    2.0000,
    (SELECT id FROM categorias WHERE comercio_id = 1 AND nombre = 'BULONERIA' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = 1 AND nombre = 'GENÉRICO' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = 1 AND nombre ILIKE 'UNIDAD%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;

-- Empleados iniciales del comercio
INSERT INTO usuarios (id, comercio_id, nombre_completo, email, rol, codigo_pin, esta_activo)
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

