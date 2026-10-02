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
    pendingOrders: [], // Pedidos de Preventa en espera
    nextVoucherSeq: 1,
    nextOrderSeq: 1
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
    },

    pendingOrdersCount: (state) => {
      return state.pendingOrders.length;
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

    /**
     * PREVENTA: Guardar como Pedido Pendiente para cobrar en Caja
     */
    saveAsPendingOrder(notes = '') {
      if (this.items.length === 0) return null;

      const orderNumber = `PED-${String(this.nextOrderSeq).padStart(3, '0')}`;
      this.nextOrderSeq++;

      const pendingOrder = {
        id: 'ord-' + Date.now(),
        orderNumber,
        createdAt: new Date().toISOString(),
        customer: { ...this.customer },
        items: JSON.parse(JSON.stringify(this.items)),
        subtotal: this.subtotal,
        discount: this.discountAmount,
        total: this.total,
        priceMode: this.priceMode,
        notes: notes || 'Preventa de mostrador'
      };

      this.pendingOrders.unshift(pendingOrder);
      this.savePendingOrders();
      this.clearCart();

      return pendingOrder;
    },

    loadPendingOrder(orderId) {
      const idx = this.pendingOrders.findIndex(o => o.id === orderId);
      if (idx === -1) return false;

      const order = this.pendingOrders[idx];
      this.items = JSON.parse(JSON.stringify(order.items));
      this.customer = { ...order.customer };
      this.priceMode = order.priceMode || 'selling';
      this.discountPercent = order.discount > 0 && order.subtotal > 0 
        ? Math.round((order.discount / order.subtotal) * 100) 
        : 0;

      // Quitar de pendientes al cargarlo al mostrador
      this.pendingOrders.splice(idx, 1);
      this.savePendingOrders();
      return true;
    },

    deletePendingOrder(orderId) {
      this.pendingOrders = this.pendingOrders.filter(o => o.id !== orderId);
      this.savePendingOrders();
    },

    savePendingOrders() {
      localStorage.setItem('negostock_pending_orders', JSON.stringify(this.pendingOrders));
      localStorage.setItem('negostock_next_order_seq', String(this.nextOrderSeq));
    },

    loadPendingOrders() {
      const saved = localStorage.getItem('negostock_pending_orders');
      if (saved) {
        try {
          this.pendingOrders = JSON.parse(saved);
        } catch {
          this.pendingOrders = [];
        }
      }
      const seq = localStorage.getItem('negostock_next_order_seq');
      if (seq) {
        this.nextOrderSeq = parseInt(seq, 10) || 1;
      }
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
      this.loadPendingOrders();
    }
  }
});
