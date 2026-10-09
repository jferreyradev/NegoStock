import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true })
    ],
    define: {
      // Inyección robusta para Vercel y entornos locales
      'import.meta.env.VITE_PROD_SUPABASE_URL': JSON.stringify((env.VITE_PROD_SUPABASE_URL || process.env.VITE_PROD_SUPABASE_URL || '').trim()),
      'import.meta.env.VITE_PROD_SUPABASE_ANON_KEY': JSON.stringify((env.VITE_PROD_SUPABASE_ANON_KEY || process.env.VITE_PROD_SUPABASE_ANON_KEY || '').trim()),
      'import.meta.env.VITE_DEV_SUPABASE_URL': JSON.stringify((env.VITE_DEV_SUPABASE_URL || process.env.VITE_DEV_SUPABASE_URL || '').trim()),
      'import.meta.env.VITE_DEV_SUPABASE_ANON_KEY': JSON.stringify((env.VITE_DEV_SUPABASE_ANON_KEY || process.env.VITE_DEV_SUPABASE_ANON_KEY || '').trim()),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify((env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify((env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim())
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      host: true
    }
  };
});
