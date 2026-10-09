import { createClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';
const isDevDomain = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.includes('-dev') ||
  window.location.hostname.includes('git-dev')
);

// Variables estándar
const defaultUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const defaultKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Variables con prefijo explícito (opcional para evitar confusiones en Vercel)
const devUrl = (import.meta.env.VITE_DEV_SUPABASE_URL || '').trim();
const devKey = (import.meta.env.VITE_DEV_SUPABASE_ANON_KEY || '').trim();

const prodUrl = (import.meta.env.VITE_PROD_SUPABASE_URL || '').trim();
const prodKey = (import.meta.env.VITE_PROD_SUPABASE_ANON_KEY || '').trim();

// Resolución inteligente de credenciales
let supabaseUrl = defaultUrl;
let supabaseAnonKey = defaultKey;

if (isDevDomain && devUrl && devKey) {
  supabaseUrl = devUrl;
  supabaseAnonKey = devKey;
} else if (!isDevDomain && prodUrl && prodKey) {
  supabaseUrl = prodUrl;
  supabaseAnonKey = prodKey;
}

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

if (isBrowser) {
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
