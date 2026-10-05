import { defineStore } from 'pinia';
import { secureGet, secureSet } from '@/services/secureStorage';

export const MODES = {
  SIMPLE: {
    key: 'SIMPLE',
    title: 'Modo Esencial (Mostrador Ágil)',
    shortTitle: 'Esencial',
    icon: 'mdi-lightning-bolt',
    color: 'teal-darken-1',
    description: 'La versión más simple y rápida para empleados. Solo Vender, Productos e Historial de Ventas. Sin distracciones.',
    modules: {
      preventas: false,
      mayorista: false,
      clientes: false,
      aumentoMasivo: false,
      auditoriaCostos: false,
      advancedHeader: false
    }
  },
  COMERCIAL: {
    key: 'COMERCIAL',
    title: 'Modo Comercial (Preventa & Clientes)',
    shortTitle: 'Comercial',
    icon: 'mdi-storefront-outline',
    color: 'indigo-darken-1',
    description: 'Habilita Preventas/Presupuestos [F6]/[F7], Precios Mayoristas [F8] y Clientes con Cuenta Corriente.',
    modules: {
      preventas: true,
      mayorista: true,
      clientes: true,
      aumentoMasivo: false,
      auditoriaCostos: false,
      advancedHeader: false
    }
  },
  COMPLETO: {
    key: 'COMPLETO',
    title: 'Modo Gestión Total (Avanzado)',
    shortTitle: 'Completo',
    icon: 'mdi-cog-box',
    color: 'deep-purple-accent-4',
    description: 'Todas las herramientas activas: Aumentos Masivos por Inflación, Auditoría de Proveedores y Ajustes Técnicos de Red.',
    modules: {
      preventas: true,
      mayorista: true,
      clientes: true,
      aumentoMasivo: true,
      auditoriaCostos: true,
      advancedHeader: true
    }
  }
};

export const useModuleStore = defineStore('modules', {
  state: () => ({
    currentMode: 'SIMPLE',
    modules: { ...MODES.SIMPLE.modules },
    isLoaded: false
  }),

  getters: {
    isSimpleMode: (state) => state.currentMode === 'SIMPLE',
    isComercialMode: (state) => state.currentMode === 'COMERCIAL',
    isCompletoMode: (state) => state.currentMode === 'COMPLETO',
    activeModeInfo: (state) => MODES[state.currentMode] || {
      key: 'CUSTOM',
      title: 'Modo Personalizado',
      shortTitle: 'Personalizado',
      icon: 'mdi-tune-variant',
      color: 'blue-grey'
    }
  },

  actions: {
    async init() {
      if (this.isLoaded) return;
      try {
        const saved = await secureGet('app_metadata', 'active_modules_config');
        if (saved && saved.currentMode) {
          this.currentMode = saved.currentMode;
          this.modules = { ...(MODES[saved.currentMode]?.modules || saved.modules) };
        } else {
          // Por defecto iniciamos en SIMPLE para máxima facilidad del personal
          this.currentMode = 'SIMPLE';
          this.modules = { ...MODES.SIMPLE.modules };
        }
      } catch (e) {
        console.warn('[moduleStore] Error leyendo configuración de módulos:', e);
      } finally {
        this.isLoaded = true;
      }
    },

    async setMode(modeKey) {
      if (!MODES[modeKey]) return;
      this.currentMode = modeKey;
      this.modules = { ...MODES[modeKey].modules };
      await this.persist();
    },

    async toggleModule(moduleName, forcedVal = null) {
      if (typeof this.modules[moduleName] === 'undefined') return;
      this.modules[moduleName] = forcedVal !== null ? forcedVal : !this.modules[moduleName];
      this.currentMode = 'CUSTOM';
      await this.persist();
    },

    async persist() {
      await secureSet('app_metadata', 'active_modules_config', {
        currentMode: this.currentMode,
        modules: this.modules,
        updatedAt: new Date().toISOString()
      });
    }
  }
});
