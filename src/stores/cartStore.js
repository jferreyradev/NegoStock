import { defineStore } from 'pinia';
import { useProductStore } from './productStore';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { syncState, enqueueOfflineSale, syncPendingSales } from '@/services/syncQueue';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    priceMode: 'selling', // 'selling' (minorista) o 'wholesale' (mayoreo)
    discountPercent: 0,
    paymentMethod: 'EFECTIVO',
    voucherType: 'TICKET_X',
    customer: {
      name: 'Consumidor Final',
      docType: 'DNI',
      docNumber: '',
      taxCondition: 'CONSUMIDOR_FINAL'
    },
    salesHistory: [],
    nextVoucherSeq: 1
  }),

  getters: {
    subtotal: (state) => {
      return state.items.reduce((sum, item) => {
        const price = state.priceMode === 'wholesale' && item.wholesalePrice > 0 
          ? item.wholesalePrice 
          : item.sellingPrice;
        return sum + (price * item.quantity);
      }, 0);
    },

    discountAmount: (state) => {
      if (!state.discountPercent) return 0;
      return (state.subtotal * state.discountPercent) / 100;
    },

    total: (state) => {
      return Math.max(0, state.subtotal - state.discountAmount);
    },

    itemCount: (state) => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  },

  actions: {
    togglePriceMode() {
      this.priceMode = this.priceMode === 'selling' ? 'wholesale' : 'selling';
    },

    addItem(product, quantity = 1) {
      const existing = this.items.find(i => i.id === product.id || i.sku === product.sku);
      if (existing) {
        existing.quantity += Number(quantity);
      } else {
        this.items.push({
          id: product.id,
          sku: product.sku,
          name: product.name,
          unit: product.unit || 'u',
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          wholesalePrice: product.wholesalePrice,
          quantity: Number(quantity),
          stock: product.stock
        });
      }
    },

    updateQuantity(index, quantity) {
      if (quantity <= 0) {
        this.removeItem(index);
      } else {
        this.items[index].quantity = Number(quantity);
      }
    },

    removeItem(index) {
      this.items.splice(index, 1);
    },

    clearCart() {
      this.items = [];
      this.discountPercent = 0;
      this.customer = {
        name: 'Consumidor Final',
        docType: 'DNI',
        docNumber: '',
        taxCondition: 'CONSUMIDOR_FINAL'
      };
    },

    async checkout() {
      if (this.items.length === 0) return null;

      const productStore = useProductStore();
      const offlineSaleId = 'sale-offline-' + Date.now();
      const localVoucherNum = `0001-${String(this.nextVoucherSeq).padStart(8, '0')}`;
      this.nextVoucherSeq++;

      const localSaleRecord = {
        id: offlineSaleId,
        voucherType: this.voucherType,
        voucherNumber: localVoucherNum,
        createdAt: new Date().toISOString(),
        customer: { ...this.customer },
        items: JSON.parse(JSON.stringify(this.items)),
        subtotal: this.subtotal,
        discount: this.discountAmount,
        total: this.total,
        paymentMethod: this.paymentMethod,
        priceMode: this.priceMode,
        isSynced: false
      };

      // 1. Descontar stock localmente en memoria y almacenamiento local
      await productStore.deductStockForSale(this.items, offlineSaleId);

      // 2. Intentar transacción ACID en Supabase si está online
      let finalVoucherNumber = localVoucherNum;

      if (isSupabaseConfigured && supabase && syncState.isOnline) {
        try {
          const payload = {
            p_tenant_id: '00000000-0000-0000-0000-000000000001',
            p_voucher_type: this.voucherType,
            p_payment_method: this.paymentMethod,
            p_price_mode: this.priceMode,
            p_items: this.items.map(item => ({
              id: item.id?.startsWith('local-') ? null : item.id,
              sku: item.sku,
              quantity: item.quantity,
              price: this.priceMode === 'wholesale' && item.wholesalePrice > 0 ? item.wholesalePrice : item.sellingPrice
            })),
            p_discount: this.discountAmount,
            p_offline_id: offlineSaleId,
            p_notes: `Cliente: ${this.customer.name}`
          };

          const { data, error } = await supabase.rpc('procesar_venta_mostrador', payload);

          if (!error && data?.success) {
            finalVoucherNumber = data.voucher_number;
            localSaleRecord.voucherNumber = finalVoucherNumber;
            localSaleRecord.isSynced = true;
          } else {
            console.warn('[NegoStock] Falla al procesar en Supabase. Encolando offline...', error);
            enqueueOfflineSale(localSaleRecord);
          }
        } catch (err) {
          console.warn('[NegoStock] Error de red. Guardando venta localmente para sincronizar...', err);
          enqueueOfflineSale(localSaleRecord);
        }
      } else if (isSupabaseConfigured) {
        // Estaba configurado pero sin internet: a la cola
        enqueueOfflineSale(localSaleRecord);
      }

      // 3. Agregar a historial local para reimpresión inmediata
      this.salesHistory.unshift(localSaleRecord);
      localStorage.setItem('negostock_sales', JSON.stringify(this.salesHistory));

      this.clearCart();
      return localSaleRecord;
    },

    loadSalesHistory() {
      const saved = localStorage.getItem('negostock_sales');
      if (saved) {
        this.salesHistory = JSON.parse(saved);
        this.nextVoucherSeq = this.salesHistory.length + 1;
      }
    }
  }
});
