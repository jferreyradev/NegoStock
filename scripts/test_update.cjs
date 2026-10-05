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

async function testUpdateExisting() {
  const prodId = '7ae4c5b8-1c28-4c93-8eba-bf8580aa7a4f';
  console.log('Probando UPDATE en producto existente ID:', prodId);

  const { data, error } = await supabase
    .from('productos')
    .update({ esta_activo: true })
    .eq('id', prodId)
    .select();

  if (error) {
    console.error('❌ Error en UPDATE:', error);
  } else {
    console.log('Resultado UPDATE:', data);
  }
}

testUpdateExisting();
