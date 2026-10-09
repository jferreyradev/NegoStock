import { createClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';

// Detección automática del dominio de desarrollo / preview
export const isDevDomain = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.includes('-dev') ||
  window.location.hostname.includes('git-dev')
);

// 1. Credenciales explícitas de PRODUCCIÓN
const rawProdUrl = (import.meta.env.VITE_PROD_SUPABASE_URL || '').trim();
const rawProdKey = (import.meta.env.VITE_PROD_SUPABASE_ANON_KEY || '').trim();

// 2. Credenciales explícitas de DESARROLLO / PRUEBAS (Sandbox)
const rawDevUrl = (import.meta.env.VITE_DEV_SUPABASE_URL || '').trim();
const rawDevKey = (import.meta.env.VITE_DEV_SUPABASE_ANON_KEY || '').trim();

// 3. Credenciales Estándar / Fallback
const rawDefaultUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawDefaultKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Configuración de Producción (Ferretería Real)
export const PROD_CONFIG = {
  url: rawProdUrl || (!isDevDomain ? rawDefaultUrl : '') || 'https://aphqdlmgggglvahbhksu.supabase.co',
  key: rawProdKey || (!isDevDomain ? rawDefaultKey : '') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHFkbG1nZ2dnbHZhaGJoa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NzIxMTYsImV4cCI6MjEwNjU0ODExNn0.b5qOleVKPTxQr4NHe4G4-ANCE_CYw3RCTtRruseDbKs'
};

// Configuración de Desarrollo (Sandbox / Pruebas)
export const DEV_CONFIG = {
  url: rawDevUrl || (isDevDomain ? rawDefaultUrl : '') || 'https://ogphgokhqfodgbisuqxt.supabase.co',
  key: rawDevKey || (isDevDomain ? rawDefaultKey : '') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncGhnb2tocWZvZGdiaXN1cXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDgzNTAsImV4cCI6MjEwNzEyNDM1MH0.NP5sbK47jbBNVUEkLMbYWSYvmhQxgbswO18iDM6w-EQ'
};

function safeCreateClient(url, key) {
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('[Supabase] Error al instanciar cliente:', err);
    return null;
  }
}

const prodClient = safeCreateClient(PROD_CONFIG.url, PROD_CONFIG.key);
const devClient = safeCreateClient(DEV_CONFIG.url, DEV_CONFIG.key);

/**
 * Obtiene el modo de entorno activo persistido o calculado
 */
export function getActiveMode() {
  if (!isBrowser) return 'PROD';
  const saved = localStorage.getItem('negostock_active_mode');
  if (saved === 'DEV' || saved === 'PROD') {
    return saved;
  }
  // Si no se configuró explícitamente en este navegador:
  // en localhost o dominios de preview usa DEV; en dominios de producción usa PROD.
  return isDevDomain ? 'DEV' : 'PROD';
}

let currentMode = getActiveMode();

export function getActiveClient() {
  if (currentMode === 'DEV') {
    return devClient || prodClient;
  }
  return prodClient || devClient;
}

export function getActiveUrl() {
  return currentMode === 'DEV' ? DEV_CONFIG.url : PROD_CONFIG.url;
}

function resolveHost(url) {
  try {
    return url ? new URL(url).host : 'Offline / Local';
  } catch {
    return url || 'Offline / Local';
  }
}

// Variables exportadas (compatibles con todo el código existente)
export let isSupabaseConfigured = Boolean(getActiveClient());
export let supabaseHost = resolveHost(getActiveUrl());
export let isProductionBackend = currentMode === 'PROD';
export let environmentLabel = currentMode === 'PROD' ? 'PRODUCCIÓN' : 'MODO SANDBOX';

export function setActiveMode(mode) {
  if (mode !== 'DEV' && mode !== 'PROD') return;
  currentMode = mode;
  if (isBrowser) {
    localStorage.setItem('negostock_active_mode', mode);
  }
  isSupabaseConfigured = Boolean(getActiveClient());
  supabaseHost = resolveHost(getActiveUrl());
  isProductionBackend = currentMode === 'PROD';
  environmentLabel = currentMode === 'PROD' ? 'PRODUCCIÓN' : 'MODO SANDBOX';

  if (isBrowser) {
    console.log(
      `%c[NegoStock]%c Backend Activo: %c${supabaseHost}%c [${environmentLabel}]`,
      'background: #1976D2; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #222; font-weight: bold;',
      'color: #0288D1; font-weight: bold; text-decoration: underline;',
      `color: ${isProductionBackend ? '#2E7D32' : '#E65100'}; font-weight: bold;`
    );
  }
}

// Log inicial de diagnóstico
if (isBrowser) {
  console.log(
    `%c[NegoStock]%c Backend Conectado: %c${supabaseHost}%c [${environmentLabel}]`,
    'background: #1976D2; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #222; font-weight: bold;',
    'color: #0288D1; font-weight: bold; text-decoration: underline;',
    `color: ${isProductionBackend ? '#2E7D32' : '#E65100'}; font-weight: bold;`
  );
}

/**
 * Proxy dinámico para exportar `supabase`.
 * Permite cambiar de cliente (PROD <-> DEV) en caliente sin romper importaciones estáticas.
 */
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getActiveClient();
    if (!client) {
      console.warn(`[Supabase Proxy] No hay cliente Supabase activo para la propiedad: "${String(prop)}"`);
      return undefined;
    }
    const val = client[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
  set(target, prop, value) {
    const client = getActiveClient();
    if (!client) return false;
    client[prop] = value;
    return true;
  }
});
