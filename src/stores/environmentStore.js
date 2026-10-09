import { defineStore } from 'pinia';
import {
  getActiveMode,
  setActiveMode,
  getActiveClient,
  supabaseHost,
  isProductionBackend,
  environmentLabel,
  isSupabaseConfigured,
  PROD_CONFIG,
  DEV_CONFIG,
  isDevDomain
} from '@/services/supabase';
import { secureClear, secureSet } from '@/services/secureStorage';

export const useEnvironmentStore = defineStore('environment', {
  state: () => ({
    currentMode: getActiveMode(), // 'PROD' | 'DEV'
    isDevDomain,
    prodConfig: {
      url: PROD_CONFIG.url,
      host: PROD_CONFIG.url ? new URL(PROD_CONFIG.url).host : 'No configurado',
      isConfigured: Boolean(PROD_CONFIG.url && PROD_CONFIG.key)
    },
    devConfig: {
      url: DEV_CONFIG.url,
      host: DEV_CONFIG.url ? new URL(DEV_CONFIG.url).host : 'No configurado',
      isConfigured: Boolean(DEV_CONFIG.url && DEV_CONFIG.key)
    }
  }),

  getters: {
    isSandbox: (state) => state.currentMode === 'DEV',
    isProduction: (state) => state.currentMode === 'PROD',
    activeHost: () => supabaseHost,
    label: () => environmentLabel,
    isConfigured: () => isSupabaseConfigured,
    canSwitch: (state) => state.prodConfig.isConfigured && state.devConfig.isConfigured,

    modeBadgeColor: (state) => {
      return state.currentMode === 'PROD' ? 'indigo-darken-2' : 'amber-darken-3';
    },

    modeIcon: (state) => {
      return state.currentMode === 'PROD' ? 'mdi-server-network' : 'mdi-flask';
    }
  },

  actions: {
    /**
     * Cambia de entorno (PROD <-> DEV)
     * Limpia la caché de catálogo local de IndexedDB para evitar mezcla de datos entre proyectos
     * y reinicia la aplicación para garantizar un estado limpio.
     */
    async switchEnvironment(targetMode) {
      if (targetMode !== 'PROD' && targetMode !== 'DEV') return;
      if (this.currentMode === targetMode) return;

      console.warn(`[EnvironmentStore] Cambiando entorno: ${this.currentMode} -> ${targetMode}`);

      // 1. Guardar modo en persistencia y servicio de Supabase
      setActiveMode(targetMode);
      this.currentMode = targetMode;

      // 2. Limpiar caché local de catálogo para que no queden productos cruzados
      try {
        await secureClear('products_catalog');
        await secureSet('app_metadata', 'catalog_is_cleared', true);
        await secureSet('app_metadata', 'active_backend_host', supabaseHost);
      } catch (err) {
        console.warn('[EnvironmentStore] Error limpiando caché local al cambiar de entorno:', err);
      }

      // 3. Recargar página para asegurar re-inicialización completa y limpia
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }
});
