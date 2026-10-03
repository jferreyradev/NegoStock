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

      if (state.searchQuery && state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase().trim();
        list = list.filter(p => 
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.barcode && p.barcode.toLowerCase().includes(query)) ||
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
            .from('productos')
            .select(`
              id, codigo_sku, codigo_barras, nombre, precio_costo, precio_venta, precio_mayoreo,
              stock_actual, stock_minimo,
              categorias ( nombre ),
              marcas ( nombre ),
              unidades_medida ( abreviatura )
            `)
            .order('nombre');

          if (error) throw error;

          this.products = data.map(p => ({
            id: p.id,
            sku: p.codigo_sku,
            barcode: p.codigo_barras,
            name: p.nombre,
            costPrice: Number(p.precio_costo),
            sellingPrice: Number(p.precio_venta),
            wholesalePrice: Number(p.precio_mayoreo),
            stock: Number(p.stock_actual),
            minStock: Number(p.stock_minimo),
            dept: p.categorias?.nombre || 'GENERAL',
            brand: p.marcas?.nombre || 'GENÉRICO',
            unit: p.unidades_medida?.abreviatura || 'u'
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
          this.brands = ['TODAS', ...initialSeed.brands];
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
          .from('productos')
          .update({ stock_actual: newStock })
          .eq('id', productId);

        await supabase
          .from('stock_movimientos')
          .insert({
            comercio_id: 1,
            producto_id: productId,
            tipo_movimiento: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
            cantidad: diff,
            saldo_posterior: newStock,
            notas: `Ajuste manual desde la aplicación (${movementType})`
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
            await supabase.from('stock_movimientos').insert({
              comercio_id: 1,
              producto_id: prod.id,
              tipo_movimiento: 'VENTA',
              cantidad: -item.quantity,
              saldo_posterior: prod.stock,
              referencia_id: saleId,
              notas: `Venta comprobante #${saleId || 'local'}`
            });
          }
        }
      }
    },

    /**
     * ACTUALIZADOR MASIVO DE PRECIOS POR INFLACIÓN
     */
    async applyMassPriceUpdate({ category, brand, percentage, target = 'selling', rounding = 0 }) {
      const factor = 1 + (percentage / 100);
      let updatedCount = 0;
      const roundValue = (val) => {
        if (!rounding || rounding <= 0) return Math.round(val * 100) / 100;
        return Math.ceil(val / rounding) * rounding;
      };

      const updatedIds = [];

      for (const prod of this.products) {
        const matchesCategory = !category || category === 'TODOS' || prod.dept === category;
        const matchesBrand = !brand || brand === 'TODAS' || prod.brand === brand;

        if (matchesCategory && matchesBrand) {
          updatedCount++;
          updatedIds.push(prod.id);

          if (target === 'cost_and_selling') {
            const oldCost = prod.costPrice;
            prod.costPrice = roundValue(prod.costPrice * factor);
            const margin = oldCost > 0 ? (prod.sellingPrice / oldCost) : 2;
            prod.sellingPrice = roundValue(prod.costPrice * margin);
            if (prod.wholesalePrice > 0) {
              prod.wholesalePrice = roundValue(prod.wholesalePrice * factor);
            }
          } else if (target === 'selling') {
            prod.sellingPrice = roundValue(prod.sellingPrice * factor);
            if (prod.wholesalePrice > 0) {
              prod.wholesalePrice = roundValue(prod.wholesalePrice * factor);
            }
          } else if (target === 'cost_only') {
            prod.costPrice = roundValue(prod.costPrice * factor);
          }
        }
      }

      this.saveToLocal();

      // Si Supabase está conectado, actualizar en lote
      if (isSupabaseConfigured && supabase && updatedCount > 0) {
        try {
          await supabase.rpc('actualizar_precios_masivo', {
            p_comercio_id: 1,
            p_categoria_nombre: category === 'TODOS' ? null : category,
            p_marca_nombre: brand === 'TODAS' ? null : brand,
            p_porcentaje: percentage,
            p_criterio: target,
            p_redondeo: rounding
          });
        } catch (e) {
          console.error('Error aplicando actualización masiva en Supabase:', e);
        }
      }

      return { updatedCount };
    }
  }
});
