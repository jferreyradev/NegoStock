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

console.log('Conectando a Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // 1. Probar consultar la tabla productos
    const { data, error, count } = await supabase
      .from('productos')
      .select('id, codigo_sku, nombre, precio_venta, stock_actual', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Error al consultar Supabase:', error.message);
      if (error.code === '42P01') {
        console.log('💡 La tabla "productos" todavía no existe en Supabase. Falta ejecutar schema.sql y seed.sql en el SQL Editor.');
      }
      return;
    }

    console.log('✅ ¡CONEXIÓN EXITOSA A SUPABASE NUBE!');
    console.log(`📦 Total de productos encontrados en Supabase: ${count || data.length}`);
    console.log('Muestra de productos leídos en tiempo real de Supabase:');
    console.table(data);
  } catch (err) {
    console.error('Excepción al conectar:', err);
  }
}

testConnection();
