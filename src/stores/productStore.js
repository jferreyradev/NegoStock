import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import initialSeed from '@/data/seedData.json';

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    categories: [],
    brands: [],
    anomalies: initialSeed.anomalies || [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedCategory: null,
    filterOnlyLowStock: false,
  }),

  getters: {
    filteredProducts: (state) => {
      let list = state.products;

      if (state.selectedCategory && state.selectedCategory !== 'TODOS') {
        list = list.filter(p => p.dept === state.selectedCategory);
      }

      if (state.filterOnlyLowStock) {
        list = list.filter(p => Number(p.stock) <= Number(p.minStock));
      }

      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase().trim();
        list = list.filter(p => 
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.brand && p.brand.toLowerCase().includes(query))
        );
      }

      return list;
    },

    lowStockCount: (state) => {
      return state.products.filter(p => Number(p.stock) <= Number(p.minStock)).length;
    },

    totalInventoryValue: (state) => {
      return state.products.reduce((acc, p) => acc + (Number(p.costPrice) * Number(p.stock)), 0);
    },

    totalSalesValue: (state) => {
      return state.products.reduce((acc, p) => acc + (Number(p.sellingPrice) * Number(p.stock)), 0);
    }
  },

  actions: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;

      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('products')
            .select(`
              id, sku, barcode, name, cost_price, selling_price, wholesale_price,
              current_stock, min_stock,
              categories ( name ),
              brands ( name ),
              units_of_measure ( abbreviation )
            `)
            .order('name');

          if (error) throw error;

          this.products = data.map(p => ({
            id: p.id,
            sku: p.sku,
            barcode: p.barcode,
            name: p.name,
            costPrice: Number(p.cost_price),
            sellingPrice: Number(p.selling_price),
            wholesalePrice: Number(p.wholesale_price),
            stock: Number(p.current_stock),
            minStock: Number(p.min_stock),
            dept: p.categories?.name || 'GENERAL',
            brand: p.brands?.name || 'GENÉRICO',
            unit: p.units_of_measure?.abbreviation || 'u'
          }));
        } else {
          // LocalStorage fallback / Demo mode
          const localData = localStorage.getItem('negostock_products');
          if (localData) {
            this.products = JSON.parse(localData);
          } else {
            this.products = initialSeed.products.map((p, idx) => ({
              id: 'local-' + (idx + 1),
              ...p
            }));
            this.saveToLocal();
          }
          this.categories = ['TODOS', ...initialSeed.categories];
          this.brands = initialSeed.brands;
        }
      } catch (err) {
        console.error('Error cargando productos:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    saveToLocal() {
      if (!isSupabaseConfigured) {
        localStorage.setItem('negostock_products', JSON.stringify(this.products));
      }
    },

    async updateStock(productId, newStock, movementType = 'AJUSTE') {
      const prod = this.products.find(p => p.id === productId);
      if (!prod) return;

      const diff = newStock - prod.stock;
      prod.stock = Number(newStock);
      this.saveToLocal();

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', productId);

        await supabase
          .from('stock_movements')
          .insert({
            product_id: productId,
            movement_type: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
            quantity: diff,
            balance_after: newStock,
            notes: `Ajuste manual desde la aplicación (${movementType})`
          });
      }
    },

    async deductStockForSale(items, saleId = null) {
      for (const item of items) {
        const prod = this.products.find(p => p.id === item.id || p.sku === item.sku);
        if (prod) {
          prod.stock = Math.max(0, Number(prod.stock) - Number(item.quantity));
        }
      }
      this.saveToLocal();

      if (isSupabaseConfigured && supabase) {
        for (const item of items) {
          const prod = this.products.find(p => p.id === item.id || p.sku === item.sku);
          if (prod) {
            await supabase.from('stock_movements').insert({
              product_id: prod.id,
              movement_type: 'VENTA',
              quantity: -item.quantity,
              balance_after: prod.stock,
              reference_id: saleId,
              notes: `Venta comprobante #${saleId || 'local'}`
            });
          }
        }
      }
    }
  }
});
