import { defineStore } from 'pinia';
import { useProductStore } from './productStore';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { syncState, enqueueOfflineSale, syncPendingSales } from '@/services/syncQueue';
import { secureSet, secureGet } from '@/services/secureStorage';
import { useSyncModeStore } from './syncModeStore';
import { useAuthStore } from './authStore';

export const GENERIC_VAR_PRODUCT_ID = 'a87426ee-729c-474a-a60b-109ceb259fe2';
const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    priceMode: 'selling', // 'selling' (minorista) o 'wholesale' (mayoreo)
    discountPercent: 0,
    paymentMethod: 'EFECTIVO',
    voucherType: 'PRESUPUESTO', // Por defecto el mostrador inicia en Presupuesto / Cotizador
    customer: {
      id: 'cf-default',
      name: 'Consumidor Final',
      docType: 'DNI',
      docNumber: '',
      taxCondition: 'CONSUMIDOR_FINAL',
      phone: ''
    },
    // Tracking de Presupuesto o Preventa cargada en edición activa
    activeOrderId: null,
    activeOrderType: null, // 'PRESUPUESTO' o 'PREVENTA'
    activeOrderNumber: null,

    salesHistory: [],
    pendingOrders: [], // Presupuestos y Pedidos de Preventa en espera
    nextVoucherSeq: 1,
    nextOrderSeq: 1,
    nextPresupuestoSeq: 1
  }),

  getters: {
    // Subtotal bruto a precio de lista (sin considerar descuentos por línea)
    grossSubtotal: (state) => {
      return state.items.reduce((sum, item) => {
        const price = item.customUnitPrice !== undefined && item.customUnitPrice !== null
          ? Number(item.customUnitPrice)
          : (state.priceMode === 'wholesale' && item.wholesalePrice > 0 ? item.wholesalePrice : item.sellingPrice);
        return sum + (price * item.quantity);
      }, 0);
    },

    // Subtotal neto considerando descuentos aplicados a nivel de cada ítem
    subtotal: (state) => {
      return state.items.reduce((sum, item) => {
        const price = item.customUnitPrice !== undefined && item.customUnitPrice !== null
          ? Number(item.customUnitPrice)
          : (state.priceMode === 'wholesale' && item.wholesalePrice > 0 ? item.wholesalePrice : item.sellingPrice);
        const lineDiscount = Number(item.discountPercent || 0);
        const effectivePrice = Math.max(0, price * (1 - lineDiscount / 100));
        return sum + (effectivePrice * item.quantity);
      }, 0);
    },

    // Total de bonificaciones/descuentos otorgados en las líneas de artículos
    lineDiscountsTotal: (state) => {
      return Math.max(0, state.grossSubtotal - state.subtotal);
    },

    // Descuento global sobre el total del pedido (%)
    discountAmount: (state) => {
      if (!state.discountPercent) return 0;
      return (state.subtotal * state.discountPercent) / 100;
    },

    // Importe total definitivo a pagar o presupuestar
    total: (state) => {
      return Math.max(0, state.subtotal - state.discountAmount);
    },

    // IVA 21% estimativo referencial
    estimatedIva: (state) => {
      return state.total * 0.21;
    },

    // Neto gravado sin IVA (estimativo)
    netWithoutIva: (state) => {
      return state.total / 1.21;
    },

    itemCount: (state) => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    pendingOrdersCount: (state) => {
      return state.pendingOrders.length;
    },

    isEditingPresupuesto: (state) => state.activeOrderId !== null && state.activeOrderType === 'PRESUPUESTO' && state.voucherType === 'PRESUPUESTO',
    isConvertingPresupuestoToSale: (state) => state.activeOrderId !== null && state.activeOrderType === 'PRESUPUESTO' && state.voucherType !== 'PRESUPUESTO',
    isEditingOrder: (state) => state.activeOrderId !== null,
    presupuestosList: (state) => state.pendingOrders.filter(o => o.type === 'PRESUPUESTO'),
    preventasList: (state) => state.pendingOrders.filter(o => o.type !== 'PRESUPUESTO')
  },

  actions: {
    setCustomer(cust) {
      if (!cust) return;
      this.customer = {
        id: cust.id || 'cf-default',
        name: cust.nombre || cust.name || 'Consumidor Final',
        docType: cust.tipo_documento || cust.docType || 'DNI',
        docNumber: cust.numero_documento || cust.docNumber || '',
        taxCondition: cust.condicion_iva || cust.taxCondition || 'CONSUMIDOR_FINAL',
        phone: cust.telefono || cust.phone || '',
        address: cust.direccion || cust.address || ''
      };
    },

    togglePriceMode() {
      this.priceMode = this.priceMode === 'selling' ? 'wholesale' : 'selling';
    },

    addItem(product, quantity = 1, options = {}) {
      const existing = this.items.find(i => i.id === product.id || (product.sku && i.sku === product.sku));
      if (existing) {
        existing.quantity += Number(quantity);
        if (options.discountPercent !== undefined) existing.discountPercent = Number(options.discountPercent);
        if (options.customUnitPrice !== undefined) existing.customUnitPrice = Number(options.customUnitPrice);
        if (options.notes !== undefined) existing.notes = options.notes;
      } else {
        this.items.push({
          id: product.id || 'prod-' + Date.now(),
          sku: product.sku || 'VAR',
          name: product.name,
          unit: product.unit || 'u',
          costPrice: product.costPrice || 0,
          sellingPrice: product.sellingPrice || 0,
          wholesalePrice: product.wholesalePrice || 0,
          customUnitPrice: options.customUnitPrice !== undefined ? Number(options.customUnitPrice) : null,
          discountPercent: options.discountPercent ? Number(options.discountPercent) : 0,
          notes: options.notes || '',
          quantity: Number(quantity),
          stock: product.stock !== undefined ? product.stock : 999,
          isCustom: product.isCustom || false
        });
      }
    },

    /**
     * Permite agregar un ítem vario / libre al presupuesto (flete, mano de obra, corte, etc.)
     */
    addCustomItem({ name, price, quantity = 1, costPrice = 0, unit = 'u', notes = '', discountPercent = 0 }) {
      const customId = 'custom-' + Date.now();
      const customSku = `VAR-${String(this.items.length + 1).padStart(2, '0')}`;
      this.items.push({
        id: customId,
        sku: customSku,
        name: name || 'Artículo / Servicio Personalizado',
        unit: unit || 'u',
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(price) || 0,
        wholesalePrice: Number(price) || 0,
        customUnitPrice: Number(price) || 0,
        discountPercent: Number(discountPercent) || 0,
        notes: notes || '',
        quantity: Number(quantity) || 1,
        stock: 999,
        isCustom: true
      });
    },

    updateQuantity(index, quantity) {
      if (quantity <= 0) {
        this.removeItem(index);
      } else {
        this.items[index].quantity = Number(quantity);
      }
    },

    updateItemDiscount(index, discountPercent) {
      if (!this.items[index]) return;
      this.items[index].discountPercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    },

    updateItemPrice(index, price) {
      if (!this.items[index]) return;
      this.items[index].customUnitPrice = Number(price) >= 0 ? Number(price) : null;
    },

    updateItemNotes(index, notes) {
      if (!this.items[index]) return;
      this.items[index].notes = String(notes || '').trim();
    },

    removeItem(index) {
      this.items.splice(index, 1);
    },

    clearCart() {
      this.items = [];
      this.discountPercent = 0;
      this.activeOrderId = null;
      this.activeOrderType = null;
      this.activeOrderNumber = null;
      this.voucherType = 'PRESUPUESTO';
    },

    discardActiveEditing() {
      this.clearCart();
    },

    /**
     * PRESUPUESTO: Guardar como cotización formal con número PRES-XXX y validez
     * @param {string} notes - Notas o condiciones de la cotización
     * @param {number|null} validDays - Días de validez (o null para sin fecha de caducidad)
     */
    saveAsPresupuesto(notes = '', validDays = 15) {
      if (this.items.length === 0) return null;

      const authStore = useAuthStore();
      const opName = authStore.currentUser?.fullName || 'Vendedor Mostrador';
      const opRole = authStore.currentUser?.role || 'SELLER';

      const orderNumber = `PRES-${String(this.nextPresupuestoSeq).padStart(3, '0')}`;
      this.nextPresupuestoSeq++;

      const validUntil = (validDays && Number(validDays) > 0)
        ? new Date(Date.now() + Number(validDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const presupuesto = {
        id: 'pres-' + Date.now(),
        orderNumber,
        type: 'PRESUPUESTO',
        voucherType: 'PRESUPUESTO',
        voucherNumber: orderNumber,
        createdAt: new Date().toISOString(),
        validUntil,
        customer: { ...this.customer },
        items: JSON.parse(JSON.stringify(this.items)),
        subtotal: this.subtotal,
        discount: this.discountAmount,
        discountPercent: this.discountPercent,
        total: this.total,
        priceMode: this.priceMode === 'wholesale' ? 'wholesale' : 'selling',
        notes: notes || 'Presupuesto de mostrador',
        estado: 'PENDIENTE',
        createdBy: {
          id: authStore.currentUser?.id,
          name: opName,
          role: opRole
        },
        userName: opName,
        userRole: opRole,
        isSynced: false
      };

      this.pendingOrders.unshift(presupuesto);
      this.savePendingOrders();

      // Guardar de inmediato en Supabase pedidos_preventa si hay conexión
      if (isSupabaseConfigured && supabase && syncState.isOnline) {
        (async () => {
          try {
            const notasPayload = JSON.stringify({
              type: 'PRESUPUESTO',
              notes: notes || 'Presupuesto de mostrador',
              validUntil,
              discountPercent: this.discountPercent,
              customer: this.customer,
              items: this.items,
              createdBy: {
                id: authStore.currentUser?.id,
                name: opName,
                role: opRole
              }
            });

            const { data: cloudOrder, error: orderErr } = await supabase
              .from('pedidos_preventa')
              .insert({
                comercio_id: 1,
                numero_pedido: orderNumber,
                cliente_id: isUUID(this.customer?.id) ? this.customer.id : null,
                modalidad_precio: this.priceMode === 'wholesale' ? 'wholesale' : 'selling',
                subtotal: this.subtotal,
                descuento: this.discountAmount || 0,
                total: this.total,
                estado: 'PENDIENTE',
                notas: notasPayload
              })
              .select('id')
              .single();

            if (!orderErr && cloudOrder) {
              presupuesto.cloudId = cloudOrder.id;
              presupuesto.isSynced = true;

              const validDetails = this.items.map(it => {
                const unitP = it.customUnitPrice !== null && it.customUnitPrice !== undefined
                  ? Number(it.customUnitPrice)
                  : (this.priceMode === 'wholesale' && it.wholesalePrice > 0 ? it.wholesalePrice : it.sellingPrice);
                return {
                  pedido_id: cloudOrder.id,
                  producto_id: isUUID(it.id) ? it.id : GENERIC_VAR_PRODUCT_ID,
                  cantidad: it.quantity,
                  precio_unitario: unitP,
                  subtotal: Math.round(unitP * it.quantity * 100) / 100
                };
              });

              if (validDetails.length > 0) {
                await supabase.from('pedidos_preventa_detalles').insert(validDetails);
              }
              await this.savePendingOrders();
            } else if (orderErr) {
              console.warn('[CartStore] Error guardando presupuesto en Supabase:', orderErr.message);
            }
          } catch (e) {
            console.warn('[CartStore] Excepción al guardar presupuesto en Supabase:', e);
          }
        })();
      }

      this.clearCart();
      return presupuesto;
    },

    /**
     * ACTUALIZAR PRESUPUESTO EXISTENTE:
     * Guarda las modificaciones sobre el presupuesto ya cargado en el mostrador
     */
    updateActivePresupuesto(notes = '', validDays = undefined) {
      if (!this.activeOrderId) return null;

      const idx = this.pendingOrders.findIndex(o => o.id === this.activeOrderId || o.cloudId === this.activeOrderId);
      if (idx === -1) return null;

      const authStore = useAuthStore();
      const opName = authStore.currentUser?.fullName || 'Vendedor Mostrador';
      const opRole = authStore.currentUser?.role || 'SELLER';

      const existing = this.pendingOrders[idx];
      let validUntil = existing.validUntil;
      if (validDays !== undefined) {
        validUntil = (validDays && Number(validDays) > 0)
          ? new Date(Date.now() + Number(validDays) * 24 * 60 * 60 * 1000).toISOString()
          : null;
      }

      const updated = {
        ...existing,
        items: JSON.parse(JSON.stringify(this.items)),
        subtotal: this.subtotal,
        discount: this.discountAmount,
        discountPercent: this.discountPercent,
        total: this.total,
        priceMode: this.priceMode === 'wholesale' ? 'wholesale' : 'selling',
        customer: { ...this.customer },
        validUntil,
        notes: notes || existing.notes,
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: authStore.currentUser?.id,
          name: opName,
          role: opRole,
          at: new Date().toISOString()
        }
      };

      this.pendingOrders[idx] = updated;
      this.savePendingOrders();

      // Si Supabase está disponible, actualizar también en la nube
      if (isSupabaseConfigured && supabase && syncState.isOnline) {
        (async () => {
          try {
            const notasPayload = JSON.stringify({
              type: updated.type || 'PRESUPUESTO',
              notes: notes || existing.notes,
              validUntil,
              discountPercent: this.discountPercent,
              customer: this.customer,
              items: this.items,
              updatedBy: {
                id: authStore.currentUser?.id,
                name: opName,
                role: opRole,
                at: new Date().toISOString()
              }
            });

            await supabase.from('pedidos_preventa').update({
              subtotal: this.subtotal,
              descuento: this.discountAmount || 0,
              total: this.total,
              notas: notasPayload,
              actualizado_en: new Date().toISOString()
            }).eq('comercio_id', 1).eq('numero_pedido', existing.orderNumber);
          } catch (e) {
            console.warn('[CartStore] Error actualizando presupuesto en Supabase:', e);
          }
        })();
      }

      return updated;
    },

    /**
     * PREVENTA: Guardar como Pedido Pendiente para cobrar en Caja
     */
    saveAsPendingOrder(notes = '') {
      if (this.items.length === 0) return null;

      const authStore = useAuthStore();
      const opName = authStore.currentUser?.fullName || 'Vendedor Mostrador';
      const opRole = authStore.currentUser?.role || 'SELLER';

      const orderNumber = `PED-${String(this.nextOrderSeq).padStart(3, '0')}`;
      this.nextOrderSeq++;

      const pendingOrder = {
        id: 'ord-' + Date.now(),
        orderNumber,
        type: 'PREVENTA',
        createdAt: new Date().toISOString(),
        customer: { ...this.customer },
        items: JSON.parse(JSON.stringify(this.items)),
        subtotal: this.subtotal,
        discount: this.discountAmount,
        discountPercent: this.discountPercent,
        total: this.total,
        priceMode: this.priceMode === 'wholesale' ? 'wholesale' : 'selling',
        notes: notes || 'Preventa de mostrador',
        estado: 'PENDIENTE',
        createdBy: {
          id: authStore.currentUser?.id,
          name: opName,
          role: opRole
        },
        isSynced: false
      };

      this.pendingOrders.unshift(pendingOrder);
      this.savePendingOrders();

      // Guardar de inmediato en Supabase pedidos_preventa si hay conexión
      if (isSupabaseConfigured && supabase && syncState.isOnline) {
        (async () => {
          try {
            const notasPayload = JSON.stringify({
              type: 'PREVENTA',
              notes: notes || 'Preventa de mostrador',
              discountPercent: this.discountPercent,
              customer: this.customer,
              items: this.items,
              createdBy: {
                id: authStore.currentUser?.id,
                name: opName,
                role: opRole
              }
            });

            const { data: cloudOrder, error: orderErr } = await supabase
              .from('pedidos_preventa')
              .insert({
                comercio_id: 1,
                numero_pedido: orderNumber,
                cliente_id: isUUID(this.customer?.id) ? this.customer.id : null,
                modalidad_precio: this.priceMode === 'wholesale' ? 'wholesale' : 'selling',
                subtotal: this.subtotal,
                descuento: this.discountAmount || 0,
                total: this.total,
                estado: 'PENDIENTE',
                notas: notasPayload
              })
              .select('id')
              .single();

            if (!orderErr && cloudOrder) {
              pendingOrder.cloudId = cloudOrder.id;
              pendingOrder.isSynced = true;

              const validDetails = this.items.map(it => {
                const unitP = it.customUnitPrice !== null && it.customUnitPrice !== undefined
                  ? Number(it.customUnitPrice)
                  : (this.priceMode === 'wholesale' && it.wholesalePrice > 0 ? it.wholesalePrice : it.sellingPrice);
                return {
                  pedido_id: cloudOrder.id,
                  producto_id: isUUID(it.id) ? it.id : GENERIC_VAR_PRODUCT_ID,
                  cantidad: it.quantity,
                  precio_unitario: unitP,
                  subtotal: Math.round(unitP * it.quantity * 100) / 100
                };
              });

              if (validDetails.length > 0) {
                await supabase.from('pedidos_preventa_detalles').insert(validDetails);
              }
              await this.savePendingOrders();
            }
          } catch (e) {
            console.warn('[CartStore] Error guardando preventa en Supabase:', e);
          }
        })();
      }

      this.clearCart();
      return pendingOrder;
    },

    loadPendingOrder(orderId, removeFromList = false) {
      const idx = this.pendingOrders.findIndex(o => o.id === orderId || o.cloudId === orderId);
      if (idx === -1) return false;

      const order = this.pendingOrders[idx];
      this.items = JSON.parse(JSON.stringify(order.items));
      this.customer = { ...order.customer };
      this.priceMode = order.priceMode || 'selling';
      this.discountPercent = order.discountPercent !== undefined
        ? order.discountPercent
        : (order.discount > 0 && order.subtotal > 0 ? Math.round((order.discount / order.subtotal) * 100) : 0);

      this.activeOrderId = order.id;
      this.activeOrderType = order.type || 'PREVENTA';
      this.activeOrderNumber = order.orderNumber;
      // Carga en su tipo original: PRESUPUESTO si es cotización, o TICKET_X si es preventa
      this.voucherType = order.type === 'PRESUPUESTO' ? 'PRESUPUESTO' : 'TICKET_X';

      if (removeFromList) {
        this.deletePendingOrder(order.id);
      }

      return true;
    },

    deletePendingOrder(orderId) {
      const targetOrder = this.pendingOrders.find(o => o.id === orderId || o.cloudId === orderId);
      this.pendingOrders = this.pendingOrders.filter(o => o.id !== orderId && o.cloudId !== orderId);
      if (this.activeOrderId === orderId || (targetOrder && this.activeOrderId === targetOrder.id)) {
        this.activeOrderId = null;
        this.activeOrderType = null;
        this.activeOrderNumber = null;
      }
      this.savePendingOrders();

      if (targetOrder?.orderNumber && isSupabaseConfigured && supabase && syncState.isOnline) {
        (async () => {
          try {
            await supabase.from('pedidos_preventa').update({
              estado: 'CANCELADO',
              actualizado_en: new Date().toISOString()
            }).eq('comercio_id', 1).eq('numero_pedido', targetOrder.orderNumber);
          } catch (e) {
            console.warn('[CartStore] Error cancelando pedido en Supabase:', e);
          }
        })();
      }
    },

    async savePendingOrders() {
      await secureSet('app_metadata', 'pending_orders', this.pendingOrders);
      await secureSet('app_metadata', 'next_order_seq', this.nextOrderSeq);
      await secureSet('app_metadata', 'next_presupuesto_seq', this.nextPresupuestoSeq);
      // Fallback ligero
      localStorage.removeItem('negostock_pending_orders');
    },

    async loadPendingOrders() {
      // 1. Cargar primero de IndexedDB local para respuesta inmediata
      const saved = await secureGet('app_metadata', 'pending_orders');
      if (saved && Array.isArray(saved)) {
        this.pendingOrders = saved;
      } else {
        const legacy = localStorage.getItem('negostock_pending_orders');
        if (legacy) {
          try {
            this.pendingOrders = JSON.parse(legacy);
            await this.savePendingOrders();
          } catch {
            this.pendingOrders = [];
          }
        }
      }

      // 2. Si Supabase está disponible, sincronizar presupuestos y preventas de la nube
      if (isSupabaseConfigured && supabase && syncState.isOnline) {
        try {
          const { data: cloudOrders, error } = await supabase
            .from('pedidos_preventa')
            .select(`
              id,
              numero_pedido,
              cliente_id,
              modalidad_precio,
              subtotal,
              descuento,
              total,
              estado,
              notas,
              creado_en,
              actualizado_en,
              cliente:clientes(id, nombre, numero_documento, telefono, direccion, condicion_iva),
              detalles:pedidos_preventa_detalles(
                id,
                producto_id,
                cantidad,
                precio_unitario,
                subtotal,
                producto:productos(id, codigo_sku, nombre, unidad_id)
              )
            `)
            .eq('comercio_id', 1)
            .eq('estado', 'PENDIENTE')
            .order('creado_en', { ascending: false });

          if (!error && cloudOrders) {
            const parsedCloudOrders = cloudOrders.map(row => {
              let meta = {};
              try {
                if (row.notas && row.notas.startsWith('{')) {
                  meta = JSON.parse(row.notas);
                }
              } catch (_) {}

              const type = meta.type || (row.numero_pedido?.startsWith('PRES') ? 'PRESUPUESTO' : 'PREVENTA');
              const customer = meta.customer || (row.cliente ? {
                id: row.cliente.id,
                name: row.cliente.nombre,
                docType: row.cliente.tipo_documento || 'DNI',
                docNumber: row.cliente.numero_documento || '',
                taxCondition: row.cliente.condicion_iva || 'CONSUMIDOR_FINAL',
                phone: row.cliente.telefono || '',
                address: row.cliente.direccion || ''
              } : { id: 'cf-default', name: 'Consumidor Final', docType: 'DNI', docNumber: '', taxCondition: 'CONSUMIDOR_FINAL', phone: '' });

              const items = meta.items || (row.detalles || []).map(d => ({
                id: d.producto_id,
                sku: d.producto?.codigo_sku || 'VAR',
                name: d.producto?.nombre || 'Artículo',
                unit: 'u',
                quantity: Number(d.cantidad),
                sellingPrice: Number(d.precio_unitario),
                customUnitPrice: Number(d.precio_unitario),
                subtotal: Number(d.subtotal)
              }));

              return {
                id: 'cloud-' + row.id,
                cloudId: row.id,
                orderNumber: row.numero_pedido,
                type,
                voucherType: type,
                voucherNumber: row.numero_pedido,
                createdAt: row.creado_en,
                validUntil: meta.validUntil || null,
                customer,
                items,
                subtotal: Number(row.subtotal),
                discount: Number(row.descuento),
                discountPercent: meta.discountPercent || (row.subtotal > 0 && row.descuento > 0 ? Math.round((row.descuento / row.subtotal) * 100) : 0),
                total: Number(row.total),
                priceMode: row.modalidad_precio || 'selling',
                notes: meta.notes || (row.notas && !row.notas.startsWith('{') ? row.notas : ''),
                estado: row.estado,
                createdBy: meta.createdBy || { name: 'Vendedor', role: 'SELLER' },
                userName: meta.createdBy?.name || 'Vendedor',
                userRole: meta.createdBy?.role || 'SELLER',
                isSynced: true
              };
            });

            // Reconciliar con órdenes locales offline no sincronizadas
            const unsyncedLocal = this.pendingOrders.filter(local =>
              local.isSynced === false &&
              !parsedCloudOrders.some(c => c.orderNumber === local.orderNumber)
            );

            this.pendingOrders = [...unsyncedLocal, ...parsedCloudOrders];
            await this.savePendingOrders();

            // Sincronizar secuencias
            const maxPresSeq = Math.max(
              0,
              ...cloudOrders
                .filter(o => o.numero_pedido?.startsWith('PRES-'))
                .map(o => parseInt(o.numero_pedido.replace('PRES-', ''), 10) || 0)
            );
            if (maxPresSeq >= this.nextPresupuestoSeq) {
              this.nextPresupuestoSeq = maxPresSeq + 1;
            }

            const maxOrderSeq = Math.max(
              0,
              ...cloudOrders
                .filter(o => o.numero_pedido?.startsWith('PED-'))
                .map(o => parseInt(o.numero_pedido.replace('PED-', ''), 10) || 0)
            );
            if (maxOrderSeq >= this.nextOrderSeq) {
              this.nextOrderSeq = maxOrderSeq + 1;
            }
          }
        } catch (err) {
          console.warn('[CartStore] Error sincronizando pedidos pendientes con Supabase:', err);
        }
      }

      const seq = await secureGet('app_metadata', 'next_order_seq');
      if (seq && Number(seq) > this.nextOrderSeq) {
        this.nextOrderSeq = parseInt(seq, 10);
      }
      const pSeq = await secureGet('app_metadata', 'next_presupuesto_seq');
      if (pSeq && Number(pSeq) > this.nextPresupuestoSeq) {
        this.nextPresupuestoSeq = parseInt(pSeq, 10);
      }
    },

    async checkout(extraInfo = {}) {
      if (this.items.length === 0) return null;

      const productStore = useProductStore();
      const offlineSaleId = 'sale-offline-' + Date.now();
      const localVoucherNum = `0001-${String(this.nextVoucherSeq).padStart(8, '0')}`;
      this.nextVoucherSeq++;
      await secureSet('app_metadata', 'next_voucher_seq', this.nextVoucherSeq);

      const authStore = useAuthStore();
      const opId = authStore.currentUser?.id || null;
      const opName = authStore.currentUser?.fullName || 'Cajero de Turno';
      const opRole = authStore.currentUser?.role || 'CASHIER';

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
        isSynced: false,
        userId: opId,
        userName: opName,
        userRole: opRole,
        notes: extraInfo.notes || '',
        cashReceived: extraInfo.cashReceived !== undefined ? extraInfo.cashReceived : null,
        cashChange: extraInfo.cashChange !== undefined ? extraInfo.cashChange : null,
        remitoDeliveryAddress: extraInfo.remitoDeliveryAddress || '',
        remitoCarrier: extraInfo.remitoCarrier || ''
      };

      // REGLA FUNDAMENTAL DE NEGOCIO:
      // El Presupuesto NO debe actualizar el stock.
      // Lo ÚNICO que actualiza el stock es la venta efectiva (TICKET_X, FACTURA_A, FACTURA_B, REMITO),
      // el deshacer una venta o la devolución si es aceptada.
      const isEffectiveSale = this.voucherType !== 'PRESUPUESTO';

      // 1. Descontar stock localmente SOLO si es una venta efectiva
      if (isEffectiveSale) {
        await productStore.deductStockForSale(this.items, offlineSaleId);
      }

      // 2. Procesamiento según el Modo de Operación configurado
      let finalVoucherNumber = localVoucherNum;
      const syncModeStore = useSyncModeStore();
      const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      if (!isEffectiveSale) {
        // ES UN PRESUPUESTO: No ejecuta el RPC de venta (que descuenta stock)
        // Guarda la cotización en Supabase de forma segura si hay conexión
        if (isSupabaseConfigured && supabase && syncState.isOnline) {
          try {
            const { data: presData, error: presErr } = await supabase.from('pedidos_preventa').insert({
              comercio_id: 1,
              numero_pedido: localVoucherNum,
              cliente_id: isUUID(this.customer?.id) ? this.customer.id : null,
              modalidad_precio: this.priceMode || 'selling',
              subtotal: this.subtotal,
              descuento: this.discountAmount || 0,
              total: this.total,
              estado: 'PENDIENTE',
              notas: `Presupuesto para ${this.customer.name || 'Consumidor Final'} [por ${opName}]`
            }).select('id').single();

            if (!presErr && presData) {
              localSaleRecord.isSynced = true;
              const validDetails = this.items
                .filter(it => isUUID(it.id))
                .map(it => {
                  const unitP = it.customUnitPrice !== null && it.customUnitPrice !== undefined
                    ? Number(it.customUnitPrice)
                    : (this.priceMode === 'wholesale' && it.wholesalePrice > 0 ? it.wholesalePrice : it.sellingPrice);
                  return {
                    pedido_id: presData.id,
                    producto_id: it.id,
                    cantidad: it.quantity,
                    precio_unitario: unitP,
                    subtotal: Math.round(unitP * it.quantity * 100) / 100
                  };
                });
              if (validDetails.length > 0) {
                await supabase.from('pedidos_preventa_detalles').insert(validDetails);
              }
            } else if (presErr) {
              console.warn('[CartStore] Error guardando presupuesto en Supabase:', presErr.message);
            }
          } catch (e) {
            console.warn('[CartStore] Error guardando presupuesto en Supabase:', e);
          }
        }
      } else {
        const payload = {
          p_comercio_id: 1,
          p_tipo_comprobante: this.voucherType,
          p_medio_pago: this.paymentMethod,
          p_modalidad_precio: this.priceMode === 'wholesale' ? 'wholesale' : 'selling',
          p_items: this.items.map(item => {
            const basePrice = item.customUnitPrice !== undefined && item.customUnitPrice !== null
              ? Number(item.customUnitPrice)
              : (this.priceMode === 'wholesale' && item.wholesalePrice > 0 ? item.wholesalePrice : item.sellingPrice);
            const lineDisc = Number(item.discountPercent || 0);
            const effectivePrice = lineDisc > 0 ? Math.max(0, basePrice * (1 - lineDisc / 100)) : basePrice;
            return {
              id: isUUID(item.id) ? item.id : GENERIC_VAR_PRODUCT_ID,
              sku: item.sku || 'VAR',
              quantity: item.quantity,
              price: effectivePrice
            };
          }),
          p_descuento: this.discountAmount,
          p_cliente_id: isUUID(this.customer?.id) ? this.customer.id : null,
          p_offline_id: offlineSaleId,
          p_notas: [
            extraInfo.notes,
            extraInfo.remitoDeliveryAddress ? `Entrega: ${extraInfo.remitoDeliveryAddress}` : null,
            extraInfo.remitoCarrier ? `Transporte: ${extraInfo.remitoCarrier}` : null,
            `Cliente: ${this.customer.name}`,
            `Atendido por: ${opName} (${opRole})`
          ].filter(Boolean).join(' | ')
        };

        if (syncModeStore.isLocalOnly) {
          // MODO LOCAL: Encolar directamente sin tocar la red
          await enqueueOfflineSale(localSaleRecord);
          console.log(`[NegoStock] Venta #${localSaleRecord.voucherNumber} guardada en MODO LOCAL para sincronizar luego.`);
        } else if (syncModeStore.isOnlineOnly) {
          // MODO SÓLO EN LÍNEA: Requiere conexión y respuesta de Supabase obligatoria
          if (!isSupabaseConfigured || !supabase || !syncState.isOnline) {
            throw new Error('Modo "Sólo en Línea" activo: No hay conexión con Supabase para registrar la venta en la nube.');
          }

          const { data, error } = await supabase.rpc('procesar_venta_mostrador', payload);
          if (error || !data?.success) {
            throw new Error(`Error en Supabase (Modo Sólo en Línea): ${error?.message || 'Falla al procesar comprobante'}`);
          }

          finalVoucherNumber = data.voucher_number;
          localSaleRecord.voucherNumber = finalVoucherNumber;
          localSaleRecord.isSynced = true;
        } else {
          // MODO AUTOMÁTICO (HÍBRIDO): Intenta nube; si falla, encola offline de forma transparente
          if (isSupabaseConfigured && supabase && syncState.isOnline) {
            try {
              const { data, error } = await supabase.rpc('procesar_venta_mostrador', payload);

              if (!error && data?.success) {
                finalVoucherNumber = data.voucher_number;
                localSaleRecord.voucherNumber = finalVoucherNumber;
                localSaleRecord.isSynced = true;
              } else {
                console.warn('[NegoStock] Falla al procesar en Supabase. Encolando offline...', error);
                await enqueueOfflineSale(localSaleRecord);
              }
            } catch (err) {
              console.warn('[NegoStock] Error de red. Guardando venta localmente para sincronizar...', err);
              await enqueueOfflineSale(localSaleRecord);
            }
          } else {
            await enqueueOfflineSale(localSaleRecord);
          }
        }
      }

      // 3. Agregar a historial local cifrado para reimpresión inmediata
      this.salesHistory.unshift(localSaleRecord);
      await secureSet('app_metadata', 'sales_history', this.salesHistory);
      localStorage.removeItem('negostock_sales');

      // Si la venta provenía de un presupuesto o preventa cargada, removerla de pendientes y marcarla cobrada en la nube
      if (this.activeOrderId) {
        const orderNum = this.activeOrderNumber;
        this.deletePendingOrder(this.activeOrderId);
        if (orderNum && isSupabaseConfigured && supabase && syncState.isOnline) {
          (async () => {
            try {
              await supabase.from('pedidos_preventa').update({
                estado: 'COBRADO',
                actualizado_en: new Date().toISOString()
              }).eq('comercio_id', 1).eq('numero_pedido', orderNum);
            } catch (_) {}
          })();
        }
      }

      this.clearCart();
      return localSaleRecord;
    },

    async saveSalesHistoryLocally() {
      await secureSet('app_metadata', 'sales_history', this.salesHistory);
    },

    async loadSalesHistory() {
      // 1. Cargar primero de IndexedDB local (respuesta instantánea)
      const saved = await secureGet('app_metadata', 'sales_history');
      if (saved && Array.isArray(saved)) {
        this.salesHistory = saved;
      } else {
        const legacy = localStorage.getItem('negostock_sales');
        if (legacy) {
          try {
            this.salesHistory = JSON.parse(legacy);
            await secureSet('app_metadata', 'sales_history', this.salesHistory);
            localStorage.removeItem('negostock_sales');
          } catch {}
        }
      }

      // 2. Si Supabase está disponible, sincronizar ventas reales de la nube
      if (isSupabaseConfigured && supabase && syncState.isOnline) {
        try {
          const { data: cloudSales, error } = await supabase
            .from('ventas')
            .select(`
              id,
              comercio_id,
              numero_comprobante,
              numero_secuencia,
              tipo_comprobante,
              creado_en,
              total,
              subtotal,
              descuento,
              estado,
              medio_pago,
              modalidad_precio,
              notas,
              id_offline_cliente,
              cliente:clientes(id, nombre, numero_documento, telefono, direccion, condicion_iva),
              items:ventas_detalles(
                id,
                producto_id,
                cantidad,
                precio_unitario,
                precio_costo,
                subtotal,
                producto:productos(id, codigo_sku, nombre, unidad_id)
              )
            `)
            .eq('comercio_id', 1)
            .order('creado_en', { ascending: false })
            .limit(300);

          if (!error && cloudSales) {
            const parsedCloudSales = cloudSales.map(row => {
              let userName = 'Mostrador';
              let userRole = 'CASHIER';
              if (row.notas) {
                const matchOp = row.notas.match(/Atendido por:\s*([^|\(\n]+)(?:\(([^)]+)\))?/i);
                if (matchOp) {
                  userName = matchOp[1].trim();
                  if (matchOp[2]) userRole = matchOp[2].trim();
                }
              }

              const customer = row.cliente ? {
                id: row.cliente.id,
                name: row.cliente.nombre,
                docType: row.cliente.tipo_documento || 'DNI',
                docNumber: row.cliente.numero_documento || '',
                taxCondition: row.cliente.condicion_iva || 'CONSUMIDOR_FINAL',
                phone: row.cliente.telefono || '',
                address: row.cliente.direccion || ''
              } : {
                id: 'cf-default',
                name: 'Consumidor Final',
                docType: 'DNI',
                docNumber: '',
                taxCondition: 'CONSUMIDOR_FINAL'
              };

              const items = (row.items || []).map(it => ({
                id: it.producto_id,
                sku: it.producto?.codigo_sku || 'VAR',
                name: it.producto?.nombre || 'Artículo',
                unit: 'u',
                quantity: Number(it.cantidad),
                costPrice: Number(it.precio_costo || 0),
                sellingPrice: Number(it.precio_unitario),
                customUnitPrice: Number(it.precio_unitario),
                subtotal: Number(it.subtotal)
              }));

              return {
                id: row.id,
                cloudId: row.id,
                voucherType: row.tipo_comprobante,
                voucherNumber: row.numero_comprobante,
                sequence: row.numero_secuencia,
                createdAt: row.creado_en,
                customer,
                items,
                subtotal: Number(row.subtotal),
                discount: Number(row.descuento),
                total: Number(row.total),
                paymentMethod: row.medio_pago,
                priceMode: row.modalidad_precio,
                estado: row.estado || 'PAGADA',
                isSynced: true,
                userName,
                userRole,
                notes: row.notas || ''
              };
            });

            // Preservar ventas offline pendientes que aún no impactaron en la nube
            const offlinePending = (this.salesHistory || []).filter(s =>
              s.isSynced === false &&
              !parsedCloudSales.some(c => c.voucherNumber === s.voucherNumber || (s.id && c.id === s.id))
            );

            this.salesHistory = [...offlinePending, ...parsedCloudSales];
            await secureSet('app_metadata', 'sales_history', this.salesHistory);
          }
        } catch (err) {
          console.warn('[CartStore] Error cargando ventas desde Supabase:', err);
        }
      }

      // 3. Ajustar secuencia para nuevos comprobantes locales
      const maxSeq = Math.max(
        0,
        ...this.salesHistory.map(s => {
          if (s.sequence) return Number(s.sequence);
          const parts = (s.voucherNumber || '').split('-');
          return parts.length === 2 ? parseInt(parts[1], 10) || 0 : 0;
        })
      );
      this.nextVoucherSeq = maxSeq + 1;

      // 4. Cargar pedidos y presupuestos pendientes
      await this.loadPendingOrders();
    },

    /**
     * ANULACIÓN / DEVOLUCIÓN DE VENTA CON REINTEGRO AUTOMÁTICO DE STOCK
     */
    async refundSale(saleId, reason = 'Devolución de mercadería') {
      const sale = this.salesHistory.find(s => s.id === saleId);
      if (!sale || sale.estado === 'ANULADA') return false;

      const productStore = useProductStore();
      const authStore = useAuthStore();
      const opName = authStore.currentUser?.fullName || 'Operador';

      // 1. Reintegrar stock de cada producto vendido al inventario
      for (const item of sale.items) {
        const prod = productStore.products.find(p => p.id === item.id || p.sku === item.sku);
        if (prod) {
          await productStore.adjustStock(
            prod.id,
            prod.stock + item.quantity,
            'DEVOLUCION',
            `Devolución por anulación de ticket #${sale.voucherNumber} [Operador: ${opName}]`
          );
        }
      }

      // 2. Marcar venta como ANULADA
      sale.estado = 'ANULADA';
      sale.refundedAt = new Date().toISOString();
      sale.refundedBy = opName;
      sale.refundReason = reason;
      await secureSet('app_metadata', 'sales_history', this.salesHistory);

      // 3. Si Supabase está disponible, actualizar estado en la nube
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('ventas').update({
            estado: 'ANULADA',
            actualizado_en: new Date().toISOString(),
            notas: (sale.notes || sale.notas || '') + ` | ANULADA por devolución: ${reason} [Operador: ${opName}]`
          }).eq('numero_comprobante', sale.voucherNumber);
        } catch (e) {
          console.warn('[CartStore] Error anulando venta en Supabase:', e);
        }
      }

      return true;
    },

    /**
     * GENERADOR DE VENTAS DEMO PARA ANÁLISIS DE REPORTES (DÍA, HORAS, MES)
     * Genera un conjunto balanceado de ventas realistas distribuidas en fechas y franjas horarias
     */
    async seedDemoSales() {
      const productStore = useProductStore();
      const prods = productStore.products.length > 0
        ? productStore.products.slice(0, 15)
        : [
            { id: 'p1', sku: '2030', name: 'ALICATE ABRIR ARANDELAS', sellingPrice: 34800, wholesalePrice: 29000, unit: 'u' },
            { id: 'p2', sku: '2013', name: 'CINTA AISLADORA 20M TACSA', sellingPrice: 3200, wholesalePrice: 2500, unit: 'u' },
            { id: 'p3', sku: '2024', name: 'DESTORNILLADOR PHILLIPS PH2', sellingPrice: 7500, wholesalePrice: 6200, unit: 'u' },
            { id: 'p4', sku: '2045', name: 'MARTILLO GALPONERO 25MM', sellingPrice: 18900, wholesalePrice: 15500, unit: 'u' },
            { id: 'p5', sku: '2088', name: 'DISCO CORTE METAL 115MM', sellingPrice: 1800, wholesalePrice: 1400, unit: 'u' }
          ];

      const operators = [
        { name: 'Ana López', role: 'CASHIER', id: 'a0000000-0000-0000-0000-000000000004' },
        { name: 'Carlos Ruiz', role: 'SELLER', id: 'a0000000-0000-0000-0000-000000000005' },
        { name: 'Juan Pérez', role: 'ADMIN', id: 'a0000000-0000-0000-0000-000000000002' },
        { name: 'Martín Gómez', role: 'MANAGER', id: 'a0000000-0000-0000-0000-000000000003' }
      ];

      const payMethods = ['EFECTIVO', 'DEBITO', 'TRANSFERENCIA', 'CREDITO', 'CTA_CTE'];
      const customers = [
        { name: 'Consumidor Final', docType: 'DNI', docNumber: '', taxCondition: 'CONSUMIDOR_FINAL' },
        { name: 'Constructora San Martín SRL', docType: 'CUIT', docNumber: '30-71234567-8', taxCondition: 'RESPONSABLE_INSCRIPTO' },
        { name: 'Taller Mecánico Rossi', docType: 'CUIT', docNumber: '20-25896321-4', taxCondition: 'MONOTRIBUTO' },
        { name: 'Electricidad y Obras del Norte', docType: 'CUIT', docNumber: '33-68952147-9', taxCondition: 'RESPONSABLE_INSCRIPTO' },
        { name: 'Gómez Roberto (Particular)', docType: 'DNI', docNumber: '32.145.896', taxCondition: 'CONSUMIDOR_FINAL' }
      ];

      const voucherTypes = ['TICKET_X', 'TICKET_X', 'FACTURA_B', 'FACTURA_A', 'REMITO'];
      const demoSales = [];
      const now = new Date();
      let seq = this.nextVoucherSeq || 1;

      // Generar ventas repartidas en los últimos 45 días
      for (let dayOffset = 45; dayOffset >= 0; dayOffset--) {
        const dateObj = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        // Cantidad de ventas por día: entre 2 y 7 (más ventas viernes y sábados)
        const dayOfWeek = dateObj.getDay();
        const baseSales = (dayOfWeek === 5 || dayOfWeek === 6) ? 6 : 4;
        const salesToday = baseSales + Math.floor(Math.random() * 3);

        for (let s = 0; s < salesToday; s++) {
          // Distribución horaria realista: 8h a 20h con picos a las 10-12 y 17-19
          const peakProb = Math.random();
          let hour;
          if (peakProb < 0.45) {
            hour = 10 + Math.floor(Math.random() * 3); // 10, 11, 12
          } else if (peakProb < 0.8) {
            hour = 17 + Math.floor(Math.random() * 3); // 17, 18, 19
          } else {
            hour = 8 + Math.floor(Math.random() * 12); // 8 a 20
          }
          const minute = Math.floor(Math.random() * 60);
          const second = Math.floor(Math.random() * 60);

          const saleDate = new Date(dateObj);
          saleDate.setHours(hour, minute, second, 0);

          // Elegir entre 1 y 4 productos
          const numItems = 1 + Math.floor(Math.random() * 3);
          const selectedItems = [];
          let subtotal = 0;

          for (let k = 0; k < numItems; k++) {
            const prod = prods[Math.floor(Math.random() * prods.length)];
            const qty = Math.random() < 0.7 ? (1 + Math.floor(Math.random() * 3)) : (4 + Math.floor(Math.random() * 6));
            const unitPrice = prod.sellingPrice || 5000;
            const itemSubtotal = unitPrice * qty;
            subtotal += itemSubtotal;

            selectedItems.push({
              id: prod.id,
              sku: prod.sku,
              name: prod.name,
              unit: prod.unit || 'u',
              costPrice: prod.costPrice || (unitPrice * 0.6),
              sellingPrice: unitPrice,
              wholesalePrice: prod.wholesalePrice || 0,
              quantity: qty,
              stock: prod.stock || 10
            });
          }

          const hasDiscount = Math.random() < 0.25;
          const discountPercent = hasDiscount ? [5, 10, 15][Math.floor(Math.random() * 3)] : 0;
          const discountAmount = (subtotal * discountPercent) / 100;
          const total = Math.max(0, subtotal - discountAmount);

          const op = operators[Math.floor(Math.random() * operators.length)];
          const cust = customers[Math.floor(Math.random() * customers.length)];
          const pay = payMethods[Math.floor(Math.random() * payMethods.length)];
          const vt = voucherTypes[Math.floor(Math.random() * voucherTypes.length)];

          const voucherNum = `0001-${String(seq).padStart(8, '0')}`;
          seq++;

          // 2% de ventas anuladas para testing
          const isAnulada = Math.random() < 0.02;

          demoSales.push({
            id: 'demo-sale-' + saleDate.getTime() + '-' + s,
            voucherType: vt,
            voucherNumber: voucherNum,
            createdAt: saleDate.toISOString(),
            customer: cust,
            items: selectedItems,
            subtotal,
            discount: discountAmount,
            discountPercent,
            total,
            paymentMethod: pay,
            priceMode: 'selling',
            isSynced: true,
            userId: op.id,
            userName: op.name,
            userRole: op.role,
            notes: 'Venta simulada para análisis de reportes',
            estado: isAnulada ? 'ANULADA' : 'PAGADA',
            refundReason: isAnulada ? 'Devolución de mercadería / Cambio' : null
          });
        }
      }

      // Ordenar por fecha descendente
      demoSales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      this.salesHistory = demoSales;
      this.nextVoucherSeq = seq;
      await secureSet('app_metadata', 'sales_history', this.salesHistory);
      await secureSet('app_metadata', 'next_voucher_seq', this.nextVoucherSeq);
      return demoSales.length;
    },

    /**
     * Limpia el historial de ventas
     */
    async clearSalesHistory() {
      this.salesHistory = [];
      await secureSet('app_metadata', 'sales_history', []);
    }
  }
});
