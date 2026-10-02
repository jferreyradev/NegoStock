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
            old_cost_price: e.oldCost,
            new_cost_price: e.newCost,
            old_selling_price: e.oldSelling,
            new_selling_price: e.newSelling,
            old_wholesale_price: e.oldWholesale,
            new_wholesale_price: e.newWholesale,
            change_reason: reason,
            user_name: userName
          }));
          await supabase.from('price_histories').insert(rows);
        } catch (err) {
          console.error('Error guardando historial en Supabase:', err);
        }
      }
    }
  }
});
