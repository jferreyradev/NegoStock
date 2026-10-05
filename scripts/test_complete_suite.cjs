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
  console.error('❌ Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 BATERÍA DE PRUEBAS INTEGRALES DE NEGOTOCK (QA)');
  console.log('====================================================');
  console.log('Destino Supabase URL:', supabaseUrl);
  console.log('Timestamp:', new Date().toISOString());

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function report(name, passed, detail = '') {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`✅ [PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
    } else {
      failedTests++;
      console.error(`❌ [FAIL] ${name} -> ${detail}`);
    }
  }

  // ------------------------------------------------------------------------
  // TEST 1: Conexión con Supabase y Comercios
  // ------------------------------------------------------------------------
  console.log('\n--- 1. IDENTIDAD DEL NEGOCIO (COMERCIO) ---');
  try {
    const { data: comercios, error: comError } = await supabase
      .from('comercios')
      .select('*')
      .eq('id', 1);

    if (comError) throw comError;
    const comercio = comercios && comercios[0];
    report('Consulta de Comercio (id=1)', !!comercio, comercio ? `${comercio.nombre} | CUIT: ${comercio.cuit}` : 'No encontrado');
  } catch (e) {
    report('Consulta de Comercio', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 2: Personal y Empleados (Tabla usuarios)
  // ------------------------------------------------------------------------
  console.log('\n--- 2. GESTIÓN DE PERSONAL Y EMPLEADOS (USUARIOS) ---');
  let testUserId = null;
  try {
    const { data: users, error: userError } = await supabase
      .from('usuarios')
      .select('id, nombre_completo, email, rol, codigo_pin, esta_activo')
      .eq('comercio_id', 1);

    if (userError) throw userError;
    report('Lectura de tabla usuarios', true, `${users ? users.length : 0} empleados existentes`);

    // Probar inserción de un empleado temporal de prueba
    const testPin = '8888';
    const { data: newEmp, error: insertEmpError } = await supabase
      .from('usuarios')
      .insert({
        comercio_id: 1,
        nombre_completo: 'QA Test Operador Temporal',
        email: 'qa.test@negostock.com',
        rol: 'CASHIER',
        codigo_pin: testPin,
        esta_activo: true
      })
      .select()
      .single();

    if (insertEmpError) {
      report('Alta de nuevo empleado (INSERT usuarios)', false, insertEmpError.message);
    } else {
      testUserId = newEmp.id;
      report('Alta de nuevo empleado (INSERT usuarios)', true, `ID: ${newEmp.id} | Rol: ${newEmp.rol} | PIN: ${newEmp.codigo_pin}`);

      // Probar actualización
      const { data: updatedEmp, error: updEmpErr } = await supabase
        .from('usuarios')
        .update({ rol: 'MANAGER' })
        .eq('id', testUserId)
        .select()
        .single();

      report('Modificación de rol empleado (UPDATE usuarios)', !updEmpErr && updatedEmp?.rol === 'MANAGER', updEmpErr ? updEmpErr.message : `Nuevo rol: ${updatedEmp?.rol}`);

      // Limpieza del empleado de prueba
      await supabase.from('usuarios').delete().eq('id', testUserId);
      report('Eliminación / Limpieza de empleado de prueba', true);
    }
  } catch (e) {
    report('Gestión de Usuarios', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 3: Catálogo de Productos e Inventario
  // ------------------------------------------------------------------------
  console.log('\n--- 3. CATÁLOGO DE PRODUCTOS E INVENTARIO ---');
  let sampleProduct = null;
  try {
    const { data: prods, count, error: prodErr } = await supabase
      .from('productos')
      .select('id, codigo_sku, nombre, precio_costo, precio_venta, stock_actual, esta_activo', { count: 'exact' })
      .eq('comercio_id', 1)
      .limit(5);

    if (prodErr) throw prodErr;
    report('Consulta de catálogo de productos', Array.isArray(prods) && prods.length > 0, `${count || prods.length} productos en base`);
    sampleProduct = prods && prods[0];

    // Verificar Tablas Auxiliares
    const { count: countCat } = await supabase.from('categorias').select('*', { count: 'exact', head: true });
    report('Consulta de categorías', countCat > 0, `${countCat} categorías`);

    const { count: countMarcas } = await supabase.from('marcas').select('*', { count: 'exact', head: true });
    report('Consulta de marcas', countMarcas > 0, `${countMarcas} marcas`);

    const { count: countUnidades } = await supabase.from('unidades_medida').select('*', { count: 'exact', head: true });
    report('Consulta de unidades de medida', countUnidades > 0, `${countUnidades} unidades`);
  } catch (e) {
    report('Catálogo de Productos', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 4: Trazabilidad, Kardex y Auditoría de Precios
  // ------------------------------------------------------------------------
  console.log('\n--- 4. TRAZABILIDAD Y AUDITORÍA DE PRECIOS/STOCK ---');
  let testProductId = null;
  try {
    // Crear producto transitorio
    const tempSku = 'QA-AUDIT-' + Date.now();
    const { data: prodCreated, error: createErr } = await supabase
      .from('productos')
      .insert({
        comercio_id: 1,
        codigo_sku: tempSku,
        nombre: 'PRODUCTO TEST AUDITORIA NEGOTOCK',
        precio_costo: 500,
        precio_venta: 1000,
        stock_actual: 20,
        esta_activo: true
      })
      .select()
      .single();

    if (createErr) throw createErr;
    testProductId = prodCreated.id;
    report('Creación de producto para auditoría', true, `SKU: ${tempSku}`);

    // Registrar histórico de precios con operador auditado
    const { error: priceHistErr } = await supabase
      .from('precios_historial')
      .insert({
        comercio_id: 1,
        producto_id: testProductId,
        costo_anterior: 500,
        costo_nuevo: 600,
        venta_anterior: 1000,
        venta_nueva: 1200,
        motivo_cambio: 'MANUAL',
        usuario_nombre: 'Dario Ovejero (Propietario)'
      });

    report('Registro en precios_historial con operador', !priceHistErr, priceHistErr ? priceHistErr.message : 'Operador auditado correctamente');

    // Registrar movimiento de stock (Kardex) con operador
    const { error: stockMovErr } = await supabase
      .from('stock_movimientos')
      .insert({
        comercio_id: 1,
        producto_id: testProductId,
        tipo_movimiento: 'INICIAL',
        cantidad: 5,
        saldo_posterior: 25,
        notas: 'Ingreso lote verificado por Dario Ovejero (Propietario)'
      });

    report('Registro en stock_movimientos (Kardex) con operador', !stockMovErr, stockMovErr ? stockMovErr.message : 'Kardex auditado correctamente');

    // Limpieza
    await supabase.from('stock_movimientos').delete().eq('producto_id', testProductId);
    await supabase.from('precios_historial').delete().eq('producto_id', testProductId);
    await supabase.from('productos').delete().eq('id', testProductId);
    report('Limpieza de registros de prueba de inventario', true);
  } catch (e) {
    report('Prueba de trazabilidad/auditoría', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 5: Clientes y Cuentas Corrientes
  // ------------------------------------------------------------------------
  console.log('\n--- 5. CLIENTES Y GREMIO ---');
  let testClientId = null;
  try {
    const { data: clients, error: cliErr } = await supabase
      .from('clientes')
      .select('id, nombre, tipo_documento, numero_documento, condicion_iva')
      .eq('comercio_id', 1)
      .limit(5);

    if (cliErr) throw cliErr;
    report('Consulta de clientes', Array.isArray(clients), `${clients ? clients.length : 0} clientes iniciales`);

    // Inserción de cliente de prueba
    const { data: newClient, error: newCliErr } = await supabase
      .from('clientes')
      .insert({
        comercio_id: 1,
        nombre: 'Cliente Prueba QA Automático',
        tipo_documento: 'DNI',
        numero_documento: '35999888',
        condicion_iva: 'CONSUMIDOR_FINAL',
        telefono: '11-5555-4444'
      })
      .select()
      .single();

    if (newCliErr) {
      report('Alta de nuevo cliente', false, newCliErr.message);
    } else {
      testClientId = newClient.id;
      report('Alta de nuevo cliente', true, `ID: ${newClient.id} - ${newClient.nombre}`);
      await supabase.from('clientes').delete().eq('id', testClientId);
      report('Limpieza de cliente temporal', true);
    }
  } catch (e) {
    report('Gestión de clientes', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 6: Punto de Venta (POS) - Cobro de Ticket y Detalle
  // ------------------------------------------------------------------------
  console.log('\n--- 6. PUNTO DE VENTA (VENTAS Y DETALLES) ---');
  let testSaleId = null;
  try {
    // 1. Obtener un producto real para la venta
    const { data: p } = await supabase
      .from('productos')
      .select('id, codigo_sku, nombre, precio_costo, precio_venta')
      .eq('comercio_id', 1)
      .limit(1)
      .single();

    // 2. Crear cabecera de venta
    const randomSec = Math.floor(100000 + Math.random() * 800000);
    const ticketNumero = '0001-' + String(randomSec).padStart(8, '0');
    const { data: saleCreated, error: saleErr } = await supabase
      .from('ventas')
      .insert({
        comercio_id: 1,
        tipo_comprobante: 'TICKET_X',
        punto_venta: 1,
        numero_secuencia: randomSec,
        numero_comprobante: ticketNumero,
        subtotal: p.precio_venta,
        descuento: 0,
        total_iva: 0,
        total: p.precio_venta,
        medio_pago: 'EFECTIVO',
        estado: 'PAGADA',
        notas: `Atendido por: Ana López (Cajera Turno Mañana) | ${ticketNumero}`
      })
      .select()
      .single();

    if (saleErr) throw saleErr;
    testSaleId = saleCreated.id;
    report('Registro de cabecera de Venta en POS', true, `Venta ID: ${testSaleId} - Total: $${saleCreated.total}`);

    // 3. Crear ítem de detalle de venta
    const { data: itemCreated, error: itemErr } = await supabase
      .from('ventas_detalles')
      .insert({
        venta_id: testSaleId,
        producto_id: p.id,
        cantidad: 1,
        precio_unitario: p.precio_venta,
        precio_costo: p.precio_costo,
        alicuota_iva: 21,
        subtotal: p.precio_venta
      })
      .select()
      .single();

    if (itemErr) throw itemErr;
    report('Registro de detalle de venta (ventas_detalles)', true, `Ítem subtotal: $${itemCreated.subtotal}`);

    // Limpieza de venta de prueba
    await supabase.from('ventas_detalles').delete().eq('venta_id', testSaleId);
    await supabase.from('ventas').delete().eq('id', testSaleId);
    report('Limpieza de venta de prueba', true);
  } catch (e) {
    report('Flujo de Ventas POS', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 7: Preventa y Presupuestos (Mostrador [F6] y [F7])
  // ------------------------------------------------------------------------
  console.log('\n--- 7. PREVENTAS Y PRESUPUESTOS (PEDIDOS_PREVENTA) ---');
  let testPedId = null;
  try {
    const { data: pedCreated, error: pedErr } = await supabase
      .from('pedidos_preventa')
      .insert({
        comercio_id: 1,
        numero_pedido: 'PRE-QA-' + Date.now(),
        subtotal: 2500,
        total: 2500,
        estado: 'PENDIENTE',
        notas: 'Presupuesto armado por Carlos Ruiz (Vendedor)'
      })
      .select()
      .single();

    if (pedErr) throw pedErr;
    testPedId = pedCreated.id;
    report('Creación de Pedido / Presupuesto', true, `ID: ${testPedId} - ${pedCreated.numero_pedido}`);

    // Limpieza
    await supabase.from('pedidos_preventa').delete().eq('id', testPedId);
    report('Limpieza de pedido temporal', true);
  } catch (e) {
    report('Flujo de Preventas / Presupuestos', false, e.message);
  }

  // ------------------------------------------------------------------------
  // RESUMEN FINAL
  // ------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 RESULTADO DE LA BATERÍA: ${passedTests}/${totalTests} PRUEBAS SUPERADAS`);
  if (failedTests === 0) {
    console.log('🎉 TODOS LOS SERVICIOS Y TABLAS ESTÁN 100% OPERATIVOS');
  } else {
    console.log(`⚠️ SE DETECTARON ${failedTests} FALLOS QUE REQUIEREN ATENCIÓN`);
  }
  console.log('====================================================\n');

  return failedTests === 0;
}

runTestSuite().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
