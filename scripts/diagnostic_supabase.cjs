const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
});

const configs = [
  {
    name: 'PRODUCCIÓN',
    url: env.VITE_PROD_SUPABASE_URL || 'https://aphqdlmgggglvahbhksu.supabase.co',
    key: env.VITE_PROD_SUPABASE_ANON_KEY
  },
  {
    name: 'DESARROLLO (DEV / SANDBOX)',
    url: env.VITE_DEV_SUPABASE_URL || 'https://ogphgokhqfodgbisuqxt.supabase.co',
    key: env.VITE_DEV_SUPABASE_ANON_KEY
  }
];

const exactTables = [
  'comercios',
  'usuarios',
  'unidades_medida',
  'categorias',
  'marcas',
  'productos',
  'clientes',
  'proveedores',
  'compras',
  'compras_detalles',
  'comprobantes_secuencias',
  'ventas',
  'ventas_detalles',
  'stock_movimientos',
  'pedidos_preventa',
  'pedidos_preventa_detalles',
  'precios_historial',
  'cajas_turnos'
];

async function runDiagnostics() {
  console.log('====================================================');
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE SUPABASE');
  console.log('====================================================\n');

  for (const cfg of configs) {
    console.log(`\n----------------------------------------------------`);
    console.log(`📡 ENTORNO: ${cfg.name}`);
    console.log(`🔗 URL: ${cfg.url}`);
    console.log(`----------------------------------------------------`);

    if (!cfg.url || !cfg.key) {
      console.log(`❌ Configuración incompleta`);
      continue;
    }

    const supabase = createClient(cfg.url, cfg.key, {
      auth: { persistSession: false }
    });

    console.log(`\n📋 ESTADO DE LAS 18 TABLAS:`);
    for (const table of exactTables) {
      try {
        const { count, error, data } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: false })
          .limit(1);

        if (error) {
          if (error.code === '42P01' || error.message.includes('schema cache')) {
            console.log(`  ❌ [${table}]: NO EXISTE`);
          } else if (error.code === '42501') {
            console.log(`  🔒 [${table}]: ERROR RLS / PERMISO DENEGADO (42501)`);
          } else {
            console.log(`  ⚠️ [${table}]: ERROR [${error.code}]: ${error.message}`);
          }
        } else {
          console.log(`  ✅ [${table}]: OK (${count !== null ? count : data.length} registros)`);
        }
      } catch (err) {
        console.log(`  ❌ [${table}]: Excepción: ${err.message}`);
      }
    }

    console.log(`\n⚙️ VERIFICANDO RPC:`);
    try {
      const { data, error } = await supabase.rpc('procesar_venta_mostrador', {
        p_comercio_id: 1,
        p_tipo_comprobante: 'TICKET_X',
        p_medio_pago: 'EFECTIVO',
        p_modalidad_precio: 'selling',
        p_items: [],
        p_descuento: 0,
        p_offline_id: 'test-check-existence-' + Date.now()
      });
      if (error) {
        if (error.code === 'PGRST202' || error.message.includes('schema cache')) {
          console.log(`  ❌ RPC 'procesar_venta_mostrador': NO EXISTE`);
        } else {
          console.log(`  ✅ RPC 'procesar_venta_mostrador': EXISTE (Error esperado con items vacíos: ${error.message})`);
        }
      } else {
        console.log(`  ✅ RPC 'procesar_venta_mostrador': EXISTE Y EJECUTA (Data: ${JSON.stringify(data)})`);
      }
    } catch (e) {
      console.log(`  ❌ RPC 'procesar_venta_mostrador': Excepción: ${e.message}`);
    }

    try {
      const { data, error } = await supabase.rpc('actualizar_precios_masivo', {
        p_comercio_id: 1,
        p_porcentaje: 0,
        p_criterio: 'selling'
      });
      if (error) {
        if (error.code === 'PGRST202' || error.message.includes('schema cache')) {
          console.log(`  ❌ RPC 'actualizar_precios_masivo': NO EXISTE`);
        } else {
          console.log(`  ⚠️ RPC 'actualizar_precios_masivo': [${error.code}] ${error.message}`);
        }
      } else {
        console.log(`  ✅ RPC 'actualizar_precios_masivo': EXISTE Y EJECUTÓ EXITOSAMENTE (${JSON.stringify(data)})`);
      }
    } catch (e) {
      console.log(`  ❌ RPC 'actualizar_precios_masivo': Excepción: ${e.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('🏁 FIN DEL DIAGNÓSTICO');
  console.log('====================================================\n');
}

runDiagnostics();
