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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCrud() {
  console.log('--- TEST CRUD SUPABASE ---');

  // 1. Probar INSERT en productos
  const testSku = 'TEST-SKU-' + Date.now();
  console.log('Intentando INSERT de producto SKU:', testSku);
  const { data: inserted, error: insertError } = await supabase
    .from('productos')
    .insert({
      comercio_id: 1,
      codigo_sku: testSku,
      nombre: 'ARTICULO TEST PROBANDO INSERCION',
      precio_costo: 100,
      margen_ganancia: 50,
      precio_venta: 150,
      stock_actual: 10,
      stock_minimo: 2,
      esta_activo: true
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ ERROR INSERT PRODUCTO:', insertError);
  } else {
    console.log('✅ INSERT EXITOSO! ID:', inserted.id);
  }

  // 2. Probar UPDATE
  if (inserted && inserted.id) {
    console.log('Intentando UPDATE del producto...');
    const { data: updated, error: updateError } = await supabase
      .from('productos')
      .update({
        precio_venta: 180,
        esta_activo: false
      })
      .eq('id', inserted.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ ERROR UPDATE PRODUCTO:', updateError);
    } else {
      console.log('✅ UPDATE EXITOSO! Nuevo precio_venta:', updated.precio_venta, 'esta_activo:', updated.esta_activo);
    }

    // 3. Probar INSERT en precios_historial
    console.log('Intentando INSERT en precios_historial...');
    const { data: histData, error: histError } = await supabase
      .from('precios_historial')
      .insert({
        comercio_id: 1,
        producto_id: inserted.id,
        costo_anterior: 100,
        costo_nuevo: 100,
        venta_anterior: 150,
        venta_nueva: 180,
        motivo_cambio: 'MANUAL'
      })
      .select();

    if (histError) {
      console.error('❌ ERROR EN precios_historial:', histError);
    } else {
      console.log('✅ INSERT EN precios_historial EXITOSO!');
    }

    // 4. Probar INSERT en stock_movimientos
    console.log('Intentando INSERT en stock_movimientos...');
    const { data: stockData, error: stockError } = await supabase
      .from('stock_movimientos')
      .insert({
        comercio_id: 1,
        producto_id: inserted.id,
        tipo_movimiento: 'INICIAL',
        cantidad: 10,
        saldo_posterior: 10,
        notas: 'Test movimiento'
      })
      .select();

    if (stockError) {
      console.error('❌ ERROR EN stock_movimientos:', stockError);
    } else {
      console.log('✅ INSERT EN stock_movimientos EXITOSO!');
    }

    // Limpiar producto de prueba
    await supabase.from('productos').delete().eq('id', inserted.id);
    console.log('🧹 Producto de prueba eliminado correctamente.');
  }

  // 5. Ver los últimos 3 productos creados o actualizados en la base de datos
  const { data: latest } = await supabase
    .from('productos')
    .select('id, codigo_sku, nombre, precio_costo, precio_venta, stock_actual, esta_activo, actualizado_en')
    .order('actualizado_en', { ascending: false })
    .limit(5);

  console.log('\n--- ÚLTIMOS PRODUCTOS EN LA BASE DE DATOS DE SUPABASE ---');
  console.table(latest);
}

testCrud();
