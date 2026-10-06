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
      armadorPresupuesto: false,
      remitos: false,
      mayorista: false,
      clientes: false,
      reportesVentas: false,
      importacionExcel: false,
      kardex: true,
      aumentoMasivo: false,
      auditoriaCostos: false,
      multiUsuario: false,
      backupRestore: false,
      advancedHeader: false
    }
  },
  COMERCIAL: {
    key: 'COMERCIAL',
    title: 'Modo Comercial (Preventa & Clientes)',
    shortTitle: 'Comercial',
    icon: 'mdi-storefront-outline',
    color: 'indigo-darken-1',
    description: 'Habilita Preventas/Presupuestos [F6]/[F7], Armador de Pedidos, Remitos, Precios Mayoristas [F8] y Clientes con Cuenta Corriente.',
    modules: {
      preventas: true,
      armadorPresupuesto: true,
      remitos: true,
      mayorista: true,
      clientes: true,
      reportesVentas: true,
      importacionExcel: false,
      kardex: true,
      aumentoMasivo: false,
      auditoriaCostos: false,
      multiUsuario: true,
      backupRestore: false,
      advancedHeader: false
    }
  },
  COMPLETO: {
    key: 'COMPLETO',
    title: 'Modo Gestión Total (Avanzado)',
    shortTitle: 'Completo',
    icon: 'mdi-cog-box',
    color: 'deep-purple-accent-4',
    description: 'Todas las herramientas activas: Aumentos Masivos por Inflación, Importación Excel, Auditoría de Proveedores y Ajustes Técnicos de Red.',
    modules: {
      preventas: true,
      armadorPresupuesto: true,
      remitos: true,
      mayorista: true,
      clientes: true,
      reportesVentas: true,
      importacionExcel: true,
      kardex: true,
      aumentoMasivo: true,
      auditoriaCostos: true,
      multiUsuario: true,
      backupRestore: true,
      advancedHeader: true
    }
  }
};

export const useModuleStore = defineStore('modules', {
  state: () => ({
    currentMode: 'COMPLETO',
    modules: { ...MODES.COMPLETO.modules },
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
          const baseDefaults = MODES[saved.currentMode]?.modules || MODES.COMPLETO.modules;
          this.modules = { ...baseDefaults, ...(saved.modules || {}) };
        } else {
          // Por defecto en NegoStock Pro iniciamos con todas las herramientas disponibles
          this.currentMode = 'COMPLETO';
          this.modules = { ...MODES.COMPLETO.modules };
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
      if (typeof this.modules[moduleName] === 'undefined') {
        this.modules[moduleName] = forcedVal !== null ? forcedVal : true;
      } else {
        this.modules[moduleName] = forcedVal !== null ? forcedVal : !this.modules[moduleName];
      }
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
