import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

export const usePriceHistoryStore = defineStore('priceHistory', {
  state: () => ({
    history: [],
    loading: false
  }),

  getters: {
    totalChangesCount: (state) => state.history.length,
    recentChanges: (state) => state.history.slice(0, 50)
  },

  actions: {
    initHistory() {
      const saved = localStorage.getItem('negostock_price_history');
      if (saved) {
        try {
          this.history = JSON.parse(saved);
        } catch {
          this.history = [];
        }
      } else {
        // Historial inicial demostrativo
        this.history = [
          {
            id: 'hist-1',
            sku: '14016',
            name: 'CINTA AISLADORA PVC NEGRA 19MM X 20 MTS TACSA',
            oldCost: 1100,
            newCost: 1200,
            oldSelling: 2200,
            newSelling: 2400,
            reason: 'AUMENTO_INFLACION',
            userName: 'Juan Pérez (Admin)',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'hist-2',
            sku: '14005',
            name: 'INTERRUPTOR DIFERENCIAL 2X25 30MA SICA',
            oldCost: 22500,
            newCost: 24374,
            oldSelling: 45000,
            newSelling: 48746,
            reason: 'IMPORTACION_EXCEL',
            userName: 'Juan Pérez (Admin)',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        this.saveToLocal();
      }
    },

    saveToLocal() {
      localStorage.setItem('negostock_price_history', JSON.stringify(this.history));
    },

    async logPriceChanges(changes, reason = 'IMPORTACION_EXCEL', userName = 'Administrador') {
      const newEntries = changes.map(ch => ({
        id: 'hist-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        sku: ch.sku,
        name: ch.name,
        oldCost: ch.oldCost,
        newCost: ch.newCost,
        oldSelling: ch.oldSelling,
        newSelling: ch.newSelling,
        oldWholesale: ch.oldWholesale || 0,
        newWholesale: ch.newWholesale || 0,
        reason,
        userName,
        createdAt: new Date().toISOString()
      }));

      this.history.unshift(...newEntries);
      this.saveToLocal();

      // Guardar en Supabase si está activo
      if (isSupabaseConfigured && supabase) {
        try {
          const rows = newEntries.map(e => ({
            comercio_id: 1,
            costo_anterior: e.oldCost,
            costo_nuevo: e.newCost,
            venta_anterior: e.oldSelling,
            venta_nueva: e.newSelling,
            mayoreo_anterior: e.oldWholesale,
            mayoreo_nuevo: e.newWholesale,
            motivo_cambio: reason,
            usuario_nombre: userName
          }));
          await supabase.from('precios_historial').insert(rows);
        } catch (err) {
          console.error('Error guardando historial en Supabase:', err);
        }
      }
    }
  }
});
