const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('🚀 Conectando a Supabase DEV (ogphgokhqfodgbisuqxt)...');

  const client = new Client({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ogphgokhqfodgbisuqxt',
    password: 'xudbaw-zemju7-xUqgad',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito a la base de datos de DEV.');

    const sqlPath = path.join(__dirname, '../supabase/iniciar_nuevo_proyecto_dev.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Ejecutando iniciar_nuevo_proyecto_dev.sql (tamaño: ' + sql.length + ' bytes)...');
    await client.query(sql);
    console.log('✅ ¡Esquema relacional, tablas, RLS y funciones creadas exitosamente en DEV!');

    // Ahora verificar si seed.sql tiene productos
    const seedPath = path.join(__dirname, '../supabase/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Poblando productos y catálogo inicial desde seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('✅ ¡Catálogo inicial poblado exitosamente en DEV!');
    }

    const res = await client.query('SELECT count(*) as total_prods FROM public.productos WHERE comercio_id = 1');
    console.log('📦 Total de productos en DEV:', res.rows[0].total_prods);

    const resUsers = await client.query('SELECT count(*) as total_users FROM public.usuarios WHERE comercio_id = 1');
    console.log('👥 Total de usuarios en DEV:', resUsers.rows[0].total_users);

    await client.end();
    console.log('🎉 Inicialización de DEV completada.');
  } catch (err) {
    console.error('❌ Error ejecutando inicialización en DEV:', err);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

run();
