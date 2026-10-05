import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { secureSet, secureGet, secureRemove } from '@/services/secureStorage';
import { syncState, syncPendingSales } from '@/services/syncQueue';

export const useSyncModeStore = defineStore('syncMode', {
  state: () => ({
    // 'AUTOMATICO' | 'ONLINE' | 'LOCAL'
    mode: 'AUTOMATICO',
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingSalesCount: 0,
    pendingProductsCount: 0,
    lastSyncTime: null,
    syncErrors: [],
    syncDialog: false,
    syncProgress: {
      step: '',
      percent: 0,
      total: 0,
      processed: 0
    }
  }),

  getters: {
    totalPendingCount: (state) => state.pendingSalesCount + state.pendingProductsCount,

    isOnlineOnly: (state) => state.mode === 'ONLINE',
    isLocalOnly: (state) => state.mode === 'LOCAL',
    isAutomatic: (state) => state.mode === 'AUTOMATICO',

    modeLabel: (state) => {
      const map = {
        AUTOMATICO: 'Automático (Híbrido)',
        ONLINE: 'Sólo en Línea (Nube)',
        LOCAL: 'Modo Local (Offline)'
      };
      return map[state.mode] || state.mode;
    },

    modeDescription: (state) => {
      const map = {
        AUTOMATICO: 'Guarda en la nube; si no hay internet almacena localmente y auto-sincroniza al restablecerse.',
        ONLINE: 'Opera exclusivamente conectado a Supabase. Avisa inmediatamente si no hay red.',
        LOCAL: 'Opera 100% en la computadora local. Nada viaja a la nube hasta que presiones Sincronizar.'
      };
      return map[state.mode] || '';
    },

    modeColor: (state) => {
      const map = {
        AUTOMATICO: 'teal-darken-1',
        ONLINE: 'blue-darken-2',
        LOCAL: 'amber-darken-3'
      };
      return map[state.mode] || 'grey';
    },

    modeIcon: (state) => {
      const map = {
        AUTOMATICO: 'mdi-cloud-sync',
        ONLINE: 'mdi-cloud-check',
        LOCAL: 'mdi-laptop'
      };
      return map[state.mode] || 'mdi-help-circle';
    }
  },

  actions: {
    async initSyncMode() {
      // 1. Cargar modo persistido
      const savedMode = await secureGet('app_metadata', 'app_sync_mode');
      if (savedMode && ['AUTOMATICO', 'ONLINE', 'LOCAL'].includes(savedMode)) {
        this.mode = savedMode;
      } else {
        const legacy = localStorage.getItem('negostock_sync_mode');
        if (legacy && ['AUTOMATICO', 'ONLINE', 'LOCAL'].includes(legacy)) {
          this.mode = legacy;
          await secureSet('app_metadata', 'app_sync_mode', legacy);
          localStorage.removeItem('negostock_sync_mode');
        }
      }

      // 2. Escuchar conectividad física
      window.addEventListener('online', () => {
        this.isOnline = true;
        syncState.isOnline = true;
        if (this.mode === 'AUTOMATICO') {
          console.log('[SyncMode] Conexión detectada en Modo Automático. Iniciando auto-sincronización...');
          this.syncAllNow();
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        syncState.isOnline = false;
        console.warn('[SyncMode] Dispositivo offline.');
      });

      // 3. Refrescar contadores de pendientes
      await this.refreshPendingCounts();
    },

    async setMode(newMode) {
      if (!['AUTOMATICO', 'ONLINE', 'LOCAL'].includes(newMode)) return;
      this.mode = newMode;
      await secureSet('app_metadata', 'app_sync_mode', newMode);
      console.log(`[SyncMode] Modo de operación cambiado a: ${newMode}`);

      // Si cambió a Automático o En Línea y hay pendientes e internet, sugerir o sincronizar
      if (newMode === 'AUTOMATICO' && this.isOnline && this.totalPendingCount > 0) {
        this.syncAllNow();
      }
    },

    async refreshPendingCounts() {
      try {
        // 1. Ventas pendientes
        const salesQueue = (await secureGet('app_metadata', 'sales_queue_list')) || [];
        this.pendingSalesCount = syncState.pendingCount || salesQueue.length;

        // 2. Cambios de productos pendientes
        const pendingProdChanges = (await secureGet('app_metadata', 'pending_product_changes')) || [];
        this.pendingProductsCount = pendingProdChanges.length;
      } catch (e) {
        console.warn('[SyncMode] Error contando pendientes:', e);
      }
    },

    /**
     * Encolar una modificación de producto para sincronización posterior (en Modo Local)
     */
    async enqueueProductChange(changeType, payload) {
      const pending = (await secureGet('app_metadata', 'pending_product_changes')) || [];
      pending.push({
        id: 'pch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        changeType, // 'CREATE' | 'UPDATE' | 'TOGGLE_AVAILABILITY' | 'UPDATE_STOCK'
        payload,
        createdAt: new Date().toISOString()
      });
      await secureSet('app_metadata', 'pending_product_changes', pending);
      this.pendingProductsCount = pending.length;
    },

    /**
     * PROCESO DE SINCRONIZACIÓN COMPLETO (Ventas + Productos)
     */
    async syncAllNow() {
      if (this.isSyncing) return { success: false, message: 'Ya hay una sincronización en curso' };
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, message: 'Supabase no está configurado en las variables de entorno' };
      }
      if (!this.isOnline) {
        return { success: false, message: 'No hay conexión a internet actualmente' };
      }

      this.isSyncing = true;
      this.syncErrors = [];
      let salesSuccess = 0;
      let salesFailed = 0;
      let prodsSuccess = 0;
      let prodsFailed = 0;

      try {
        // -------------------------------------------------------------
        // FASE 1: Subir cambios de productos pendientes (Modo Local)
        // -------------------------------------------------------------
        const pendingProds = (await secureGet('app_metadata', 'pending_product_changes')) || [];
        if (pendingProds.length > 0) {
          const remainingProds = [];

          for (const item of pendingProds) {
            try {
              if (item.changeType === 'CREATE') {
                const { error } = await supabase.from('productos').insert(item.payload);
                if (error) throw error;
                prodsSuccess++;
              } else if (item.changeType === 'UPDATE') {
                const { error } = await supabase
                  .from('productos')
                  .update(item.payload.updates)
                  .eq('id', item.payload.id);
                if (error) throw error;
                prodsSuccess++;
              } else if (item.changeType === 'TOGGLE_AVAILABILITY') {
                const { error } = await supabase
                  .from('productos')
                  .update({ esta_activo: item.payload.isActive, actualizado_en: new Date().toISOString() })
                  .eq('id', item.payload.id);
                if (error) throw error;
                prodsSuccess++;
              } else if (item.changeType === 'UPDATE_STOCK') {
                const { error } = await supabase
                  .from('productos')
                  .update({ stock_actual: item.payload.stock })
                  .eq('id', item.payload.id);
                if (error) throw error;
                prodsSuccess++;
              }
            } catch (err) {
              console.error('[SyncMode] Error sincronizando producto:', err);
              this.syncErrors.push(`Producto ${item.payload.name || item.payload.id}: ${err.message}`);
              remainingProds.push(item);
              prodsFailed++;
            }
          }

          await secureSet('app_metadata', 'pending_product_changes', remainingProds);
          this.pendingProductsCount = remainingProds.length;
        }

        // -------------------------------------------------------------
        // FASE 2: Subir ventas pendientes de la cola offline
        // -------------------------------------------------------------
        const salesBefore = syncState.pendingCount;
        await syncPendingSales();
        const salesAfter = syncState.pendingCount;
        salesSuccess = Math.max(0, salesBefore - salesAfter);
        salesFailed = salesAfter;
        this.pendingSalesCount = salesAfter;

        this.lastSyncTime = new Date().toISOString();
        await secureSet('app_metadata', 'last_sync_timestamp', this.lastSyncTime);

        return {
          success: this.syncErrors.length === 0,
          salesSuccess,
          salesFailed,
          prodsSuccess,
          prodsFailed,
          errors: this.syncErrors
        };
      } catch (globalErr) {
        console.error('[SyncMode] Error general en sincronización:', globalErr);
        this.syncErrors.push(globalErr.message);
        return { success: false, message: globalErr.message };
      } finally {
        this.isSyncing = false;
        await this.refreshPendingCounts();
      }
    }
  }
});
