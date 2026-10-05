const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.replace('VITE_SUPABASE_URL=', '').trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan credenciales de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Orden topológico estricto de dependencias de claves foráneas
const TABLES_TO_EXPORT = [
  { name: 'comercios', pkey: 'id' },
  { name: 'unidades_medida', pkey: 'id' },
  { name: 'categorias', pkey: 'id' },
  { name: 'marcas', pkey: 'id' },
  { name: 'clientes', pkey: 'id' },
  { name: 'proveedores', pkey: 'id' },
  { name: 'usuarios', pkey: 'id' },
  { name: 'productos', pkey: 'id' },
  { name: 'precios_historial', pkey: 'id' },
  { name: 'stock_movimientos', pkey: 'id' },
  { name: 'comprobantes_secuencias', pkey: 'comercio_id, punto_venta, tipo_comprobante' },
  { name: 'ventas', pkey: 'id' },
  { name: 'ventas_detalles', pkey: 'id' },
  { name: 'pedidos_preventa', pkey: 'id' },
  { name: 'pedidos_preventa_detalles', pkey: 'id' }
];

async function exportDatabase() {
  console.log('====================================================');
  console.log('📦 EXPORTADOR / BACKUP COMPLETO DE NEGOTOCK');
  console.log('====================================================');
  console.log('Servidor origen:', supabaseUrl);
  console.log('Fecha de exportación:', new Date().toISOString());

  const backupData = {};
  let totalRows = 0;
  const sqlLines = [
    '--',
    '-- ============================================================================== ',
    '-- COPIA DE SEGURIDAD / BACKUP COMPLETO DE DATOS DE NEGOTOCK',
    `-- Fecha de generación: ${new Date().toISOString()}`,
    `-- Servidor de origen: ${supabaseUrl}`,
    '-- Este archivo contiene TODOS los datos de tu base de datos listos para ser',
    '-- restaurados o migrados a otra instancia de Supabase o PostgreSQL.',
    '-- ============================================================================== ',
    '--',
    'BEGIN;',
    'SET client_encoding = \'UTF8\';',
    ''
  ];

  for (const tableInfo of TABLES_TO_EXPORT) {
    const tableName = tableInfo.name;
    process.stdout.write(`Extrayendo tabla ${tableName.padEnd(28)} ... `);

    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) {
        console.log(`⚠️ Aviso: ${error.message}`);
        continue;
      }

      const rows = data || [];
      backupData[tableName] = rows;
      totalRows += rows.length;
      console.log(`✅ ${rows.length} registros`);

      if (rows.length === 0) continue;

      sqlLines.push(`-- ------------------------------------------------------------------------------`);
      sqlLines.push(`-- TABLA: ${tableName} (${rows.length} registros)`);
      sqlLines.push(`-- ------------------------------------------------------------------------------`);

      const columns = Object.keys(rows[0]);
      const columnsList = columns.join(', ');

      for (const row of rows) {
        const valuesList = columns.map(col => escapeSqlValue(row[col])).join(', ');
        
        if (tableInfo.pkey.includes(',')) {
          // Clave compuesta
          sqlLines.push(`INSERT INTO public.${tableName} (${columnsList}) VALUES (${valuesList}) ON CONFLICT DO NOTHING;`);
        } else {
          // Clave simple (id)
          sqlLines.push(`INSERT INTO public.${tableName} (${columnsList}) VALUES (${valuesList}) ON CONFLICT (${tableInfo.pkey}) DO UPDATE SET`);
          const updates = columns
            .filter(col => col !== tableInfo.pkey)
            .map(col => `    ${col} = EXCLUDED.${col}`)
            .join(',\n');
          if (updates) {
            sqlLines[sqlLines.length - 1] += '\n' + updates + ';';
          } else {
            sqlLines[sqlLines.length - 1] = `INSERT INTO public.${tableName} (${columnsList}) VALUES (${valuesList}) ON CONFLICT (${tableInfo.pkey}) DO NOTHING;`;
          }
        }
      }
      sqlLines.push('');
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  sqlLines.push('COMMIT;');
  sqlLines.push('');
  sqlLines.push(`SELECT '✅ Copia de seguridad restaurada exitosamente. Total de registros: ${totalRows}' AS resultado;`);

  // Guardar archivo SQL
  const outputSqlPath = path.join(__dirname, '../supabase/backup_completo_datos.sql');
  fs.writeFileSync(outputSqlPath, sqlLines.join('\n'), 'utf8');

  // Guardar archivo JSON
  const outputJsonPath = path.join(__dirname, '../supabase/backup_completo_datos.json');
  fs.writeFileSync(outputJsonPath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log('\n====================================================');
  console.log(`🎉 BACKUP COMPLETADO EXITOSAMENTE`);
  console.log(`Total de registros exportados: ${totalRows}`);
  console.log(`📄 Archivo SQL generado: supabase/backup_completo_datos.sql`);
  console.log(`📄 Archivo JSON generado: supabase/backup_completo_datos.json`);
  console.log('====================================================\n');
}

exportDatabase().catch(err => {
  console.error('Error fatal al exportar:', err);
  process.exit(1);
});
