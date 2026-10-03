const fs = require('fs');
const path = require('path');

const tsvPath = path.join(__dirname, '../data/productos_iniciales.tsv');
const raw = fs.readFileSync(tsvPath, 'utf8');

const lines = raw.trim().split('\n');
const headers = lines[0].split('\t').map(h => h.trim());

const cleanNumber = (val) => {
    if (!val) return 0;
    const cleaned = val.replace(/[$\s]/g, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

// Marcas conocidas
const KNOWN_BRANDS = [
    'MOTA', 'RAPTOR', 'SICA', 'TACSA', 'GORYL', 'SAYLENS', 'CANOR', 
    'AWE', 'PIM', 'UCU', 'GKA', 'GKS'
];

const categoriesSet = new Set();
const brandsSet = new Set();
const unitsSet = new Set(['UNIDAD', 'METRO', 'ROLLO', 'BOLSA']);

const products = [];
const anomalies = [];

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim());
    if (cols.length < 2) continue;

    const sku = cols[0];
    const name = cols[1];
    const costPrice = cleanNumber(cols[2]);
    const sellingPrice = cleanNumber(cols[3]);
    const wholesalePrice = cleanNumber(cols[4]);
    const stock = cleanNumber(cols[5]);
    const minStock = cleanNumber(cols[6]);
    let dept = cols[7] || 'GENERAL';
    if (dept === '- Sin Departamento -' || !dept) dept = 'GENERAL';

    categoriesSet.add(dept);

    let detectedBrand = 'GENÉRICO';
    for (const b of KNOWN_BRANDS) {
        const regex = new RegExp(`\\b${b}\\b`, 'i');
        if (regex.test(name)) {
            detectedBrand = b;
            brandsSet.add(b);
            break;
        }
    }

    let unit = 'UNIDAD';
    if (/\bMETRO\b|\bMTS\b/i.test(name)) unit = 'METRO';
    else if (/\bROLLO\b/i.test(name)) unit = 'ROLLO';
    else if (/\bBOLSA\b/i.test(name)) unit = 'BOLSA';

    if (sellingPrice > 0 && costPrice > sellingPrice) {
        anomalies.push({
            sku,
            name,
            costPrice,
            sellingPrice,
            issue: 'Costo mayor que precio de venta'
        });
    }

    products.push({
        sku,
        name,
        costPrice,
        sellingPrice,
        wholesalePrice,
        stock,
        minStock,
        dept,
        brand: detectedBrand,
        unit
    });
}

console.log(`Procesados: ${products.length} productos`);

// Generar SQL Seed File en Español con comercio_id = 1
const defaultComercioId = 1;

let sql = `-- SEED DATA GENERADO AUTOMÁTICAMENTE PARA NEGOTOCK (100% EN ESPAÑOL)
-- Comercio por defecto: Ferretería Central (comercio_id = 1)
INSERT INTO comercios (id, nombre, razon_social, cuit)
VALUES (${defaultComercioId}, 'Ferretería Central', 'Ferretería Central S.R.L.', '30-71234567-9')
ON CONFLICT (id) DO NOTHING;

-- Unidades de Medida
INSERT INTO unidades_medida (comercio_id, nombre, abreviatura, permite_decimales) VALUES
(${defaultComercioId}, 'Unidad', 'u', false),
(${defaultComercioId}, 'Metro', 'm', true),
(${defaultComercioId}, 'Rollo', 'rollo', false),
(${defaultComercioId}, 'Bolsa', 'bolsa', false),
(${defaultComercioId}, 'Kilo', 'kg', true),
(${defaultComercioId}, 'Litro', 'lt', true)
ON CONFLICT DO NOTHING;

-- Categorías
`;

for (const cat of categoriesSet) {
    sql += `INSERT INTO categorias (comercio_id, nombre) VALUES (${defaultComercioId}, '${cat}') ON CONFLICT DO NOTHING;\n`;
}

sql += `\n-- Marcas detectadas\n`;
for (const b of brandsSet) {
    sql += `INSERT INTO marcas (comercio_id, nombre) VALUES (${defaultComercioId}, '${b}') ON CONFLICT DO NOTHING;\n`;
}
sql += `INSERT INTO marcas (comercio_id, nombre) VALUES (${defaultComercioId}, 'GENÉRICO') ON CONFLICT DO NOTHING;\n`;

sql += `\n-- Clientes iniciales para mostrador y gremio\n`;
sql += `INSERT INTO clientes (comercio_id, nombre, tipo_documento, numero_documento, condicion_iva) VALUES
(${defaultComercioId}, 'Consumidor Final', 'CF', '0', 'CONSUMIDOR_FINAL'),
(${defaultComercioId}, 'Constructora del Valle', 'CUIT', '30-65432109-8', 'RESPONSABLE_INSCRIPTO')
ON CONFLICT DO NOTHING;\n\n`;

sql += `-- Inserción de Productos\n`;
for (const p of products) {
    const escapedName = p.name.replace(/'/g, "''");
    sql += `INSERT INTO productos (comercio_id, codigo_sku, nombre, precio_costo, precio_venta, precio_mayoreo, stock_actual, stock_minimo, categoria_id, marca_id, unidad_id)
SELECT 
    ${defaultComercioId},
    '${p.sku}',
    '${escapedName}',
    ${p.costPrice.toFixed(2)},
    ${p.sellingPrice.toFixed(2)},
    ${p.wholesalePrice.toFixed(2)},
    ${p.stock.toFixed(4)},
    ${p.minStock.toFixed(4)},
    (SELECT id FROM categorias WHERE comercio_id = ${defaultComercioId} AND nombre = '${p.dept}' LIMIT 1),
    (SELECT id FROM marcas WHERE comercio_id = ${defaultComercioId} AND nombre = '${p.brand}' LIMIT 1),
    (SELECT id FROM unidades_medida WHERE comercio_id = ${defaultComercioId} AND nombre ILIKE '${p.unit}%' LIMIT 1)
ON CONFLICT (comercio_id, codigo_sku) DO UPDATE SET
    precio_venta = EXCLUDED.precio_venta,
    precio_costo = EXCLUDED.precio_costo,
    stock_actual = EXCLUDED.stock_actual;
`;
}

fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql);
console.log('Generado supabase/seed.sql en Español exitosamente');
