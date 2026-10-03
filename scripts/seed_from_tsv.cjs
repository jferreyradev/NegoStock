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

// Known brands to extract
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

    // Detect brand in description
    let detectedBrand = 'GENÉRICO';
    for (const b of KNOWN_BRANDS) {
        const regex = new RegExp(`\\b${b}\\b`, 'i');
        if (regex.test(name)) {
            detectedBrand = b;
            brandsSet.add(b);
            break;
        }
    }

    // Detect unit
    let unit = 'UNIDAD';
    if (/\bMETRO\b|\bMTS\b/i.test(name)) unit = 'METRO';
    else if (/\bROLLO\b/i.test(name)) unit = 'ROLLO';
    else if (/\bBOLSA\b/i.test(name)) unit = 'BOLSA';

    // Flag anomalies
    if (sellingPrice > 0 && costPrice > sellingPrice) {
        anomalies.push({
            sku,
            name,
            costPrice,
            sellingPrice,
            issue: 'Costo mayor que precio de venta (posible error o rollo vs metro)'
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
console.log(`Categorías únicas (${categoriesSet.size}):`, Array.from(categoriesSet));
console.log(`Marcas detectadas (${brandsSet.size}):`, Array.from(brandsSet));
console.log(`Anomalías de precio detectadas (${anomalies.length}):`, anomalies);

// Generate JSON seed
fs.writeFileSync(
    path.join(__dirname, '../data/productos_procesados.json'),
    JSON.stringify({ categories: Array.from(categoriesSet), brands: Array.from(brandsSet), products, anomalies }, null, 2)
);

// Generate SQL Seed File
const defaultTenantId = 1;

let sql = `-- SEED DATA GENERADO AUTOMÁTICAMENTE PARA NEGOTOCK (tenant_id = 1)
-- Tenant por defecto: Ferretería Central
INSERT INTO tenants (id, name, business_name, cuit)
VALUES (${defaultTenantId}, 'Ferretería Central', 'Ferretería Central S.R.L.', '30-71234567-9')
ON CONFLICT (id) DO NOTHING;

-- Unidades de Medida
INSERT INTO units_of_measure (tenant_id, name, abbreviation, allows_decimals) VALUES
(${defaultTenantId}, 'Unidad', 'u', false),
(${defaultTenantId}, 'Metro', 'm', true),
(${defaultTenantId}, 'Rollo', 'rollo', false),
(${defaultTenantId}, 'Bolsa', 'bolsa', false),
(${defaultTenantId}, 'Kilo', 'kg', true),
(${defaultTenantId}, 'Litro', 'lt', true)
ON CONFLICT DO NOTHING;

-- Categorías
`;

for (const cat of categoriesSet) {
    sql += `INSERT INTO categories (tenant_id, name) VALUES (${defaultTenantId}, '${cat}') ON CONFLICT DO NOTHING;\n`;
}

sql += `\n-- Marcas detectadas\n`;
for (const b of brandsSet) {
    sql += `INSERT INTO brands (tenant_id, name) VALUES (${defaultTenantId}, '${b}') ON CONFLICT DO NOTHING;\n`;
}
sql += `INSERT INTO brands (tenant_id, name) VALUES (${defaultTenantId}, 'GENÉRICO') ON CONFLICT DO NOTHING;\n`;

sql += `\n-- Clientes iniciales para mostrador y gremio\n`;
sql += `INSERT INTO customers (tenant_id, name, doc_type, doc_number, tax_condition) VALUES
(${defaultTenantId}, 'Consumidor Final', 'CF', '0', 'CONSUMIDOR_FINAL'),
(${defaultTenantId}, 'Constructora del Valle', 'CUIT', '30-65432109-8', 'RESPONSABLE_INSCRIPTO')
ON CONFLICT DO NOTHING;\n\n`;

sql += `-- Inserción de Productos\n`;
for (const p of products) {
    const escapedName = p.name.replace(/'/g, "''");
    sql += `INSERT INTO products (tenant_id, sku, name, cost_price, selling_price, wholesale_price, current_stock, min_stock, category_id, brand_id, unit_id)
SELECT 
    ${defaultTenantId},
    '${p.sku}',
    '${escapedName}',
    ${p.costPrice.toFixed(2)},
    ${p.sellingPrice.toFixed(2)},
    ${p.wholesalePrice.toFixed(2)},
    ${p.stock.toFixed(4)},
    ${p.minStock.toFixed(4)},
    (SELECT id FROM categories WHERE tenant_id = ${defaultTenantId} AND name = '${p.dept}' LIMIT 1),
    (SELECT id FROM brands WHERE tenant_id = ${defaultTenantId} AND name = '${p.brand}' LIMIT 1),
    (SELECT id FROM units_of_measure WHERE tenant_id = ${defaultTenantId} AND name ILIKE '${p.unit}%' LIMIT 1)
ON CONFLICT (tenant_id, sku) DO UPDATE SET
    selling_price = EXCLUDED.selling_price,
    cost_price = EXCLUDED.cost_price,
    current_stock = EXCLUDED.current_stock;
`;
}

fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql);
console.log('Generado supabase/seed.sql exitosamente');
