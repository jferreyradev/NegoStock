import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let hostName = 'Offline / Local';
try {
  if (supabaseUrl) {
    hostName = new URL(supabaseUrl).host;
  }
} catch {
  hostName = supabaseUrl || 'Offline / Local';
}

export const supabaseHost = hostName;
export const isProductionBackend = Boolean(supabaseHost.includes('aphqdlmgggglvahbhksu'));
export const environmentLabel = isProductionBackend ? 'PRODUCCIÓN' : 'DESARROLLO';

if (typeof window !== 'undefined') {
  console.log(
    `%c[NegoStock]%c Backend Conectado: %c${supabaseHost}%c [${environmentLabel}]`,
    'background: #1976D2; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #222; font-weight: bold;',
    'color: #0288D1; font-weight: bold; text-decoration: underline;',
    `color: ${isProductionBackend ? '#2E7D32' : '#E65100'}; font-weight: bold;`
  );
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
