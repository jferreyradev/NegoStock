const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Archivo .env no encontrado');
  process.exit(1);
}

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

// Orden estricto de inserción para respetar Foreign Keys
const RESTORE_TABLES_ORDER = [
  'comercios',
  'unidades_medida',
  'categorias',
  'marcas',
  'clientes',
  'proveedores',
  'usuarios',
  'productos',
  'precios_historial',
  'comprobantes_secuencias'
];

async function restoreDatabase(jsonFilePath) {
  console.log('====================================================');
  console.log('🔄 RESTAURADOR DE BASE DE DATOS - PUNTO INICIAL');
  console.log('====================================================');

  const targetFile = jsonFilePath || path.join(__dirname, '../supabase/backup_completo_datos.json');
  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Archivo de backup no encontrado en: ${targetFile}`);
    console.log('Ejecutá primero: npm run backup:export para crear el punto inicial.');
    process.exit(1);
  }

  console.log('Leyendo archivo:', targetFile);
  const data = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

  let totalRestored = 0;

  for (const tableName of RESTORE_TABLES_ORDER) {
    const rows = data[tableName] || [];
    if (rows.length === 0) continue;

    process.stdout.write(`Restaurando ${tableName.padEnd(28)} (${rows.length} registros) ... `);

    try {
      // Upsert por lotes de 50
      const CHUNK_SIZE = 50;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from(tableName).upsert(chunk);
        if (error) {
          throw error;
        }
      }
      totalRestored += rows.length;
      console.log('✅ OK');
    } catch (err) {
      console.log(`⚠️ Advertencia: ${err.message}`);
    }
  }

  console.log('====================================================');
  console.log(`🎉 RESTAURACIÓN COMPLETADA: ${totalRestored} registros restablecidos.`);
  console.log('Tu punto inicial ha quedado restaurado con éxito.');
  console.log('====================================================');
}

const customPath = process.argv[2];
restoreDatabase(customPath);
