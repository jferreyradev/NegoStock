import { reactive } from 'vue';
import { supabase, isSupabaseConfigured } from './supabase';

const QUEUE_KEY = 'negostock_offline_sales_queue';

export const syncState = reactive({
  isOnline: navigator.onLine,
  pendingCount: 0,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null
});

function getQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  syncState.pendingCount = queue.length;
}

export function initSyncManager(onSaleSyncedCallback) {
  syncState.pendingCount = getQueue().length;

  window.addEventListener('online', () => {
    syncState.isOnline = true;
    console.log('[NegoStock] Conexión a internet restablecida. Iniciando sincronización...');
    syncPendingSales(onSaleSyncedCallback);
  });

  window.addEventListener('offline', () => {
    syncState.isOnline = false;
    console.warn('[NegoStock] Conexión perdida. Operando en Modo Mostrador Offline.');
  });

  // Attempt sync on startup if online
  if (syncState.isOnline && syncState.pendingCount > 0) {
    syncPendingSales(onSaleSyncedCallback);
  }
}

export function enqueueOfflineSale(saleRecord) {
  const queue = getQueue();
  queue.push({
    ...saleRecord,
    enqueuedAt: new Date().toISOString()
  });
  saveQueue(queue);
  console.log(`[NegoStock] Venta #${saleRecord.voucherNumber} encolada offline. Total pendientes: ${queue.length}`);
}

export async function syncPendingSales(onSaleSyncedCallback) {
  if (!isSupabaseConfigured || !supabase || !syncState.isOnline || syncState.isSyncing) {
    return;
  }

  const queue = getQueue();
  if (queue.length === 0) return;

  syncState.isSyncing = true;
  syncState.syncError = null;

  const remaining = [];

  for (const sale of queue) {
    try {
      const payload = {
        p_tenant_id: '00000000-0000-0000-0000-000000000001',
        p_voucher_type: sale.voucherType,
        p_payment_method: sale.paymentMethod,
        p_price_mode: sale.priceMode || 'selling',
        p_items: sale.items.map(it => ({
          id: it.id?.startsWith('local-') ? null : it.id,
          sku: it.sku,
          quantity: it.quantity,
          price: it.price
        })),
        p_discount: sale.discount || 0,
        p_offline_id: sale.id,
        p_notes: `Cliente: ${sale.customer?.name || 'Consumidor Final'} (Sincronizado Offline)`
      };

      const { data, error } = await supabase.rpc('procesar_venta_mostrador', payload);

      if (error) {
        console.error('[NegoStock] Error sincronizando venta:', error);
        remaining.push(sale);
      } else {
        console.log(`[NegoStock] Venta sincronizada exitosamente:`, data);
        if (onSaleSyncedCallback) {
          onSaleSyncedCallback(sale, data);
        }
      }
    } catch (err) {
      console.error('[NegoStock] Excepción en sincronización:', err);
      remaining.push(sale);
    }
  }

  saveQueue(remaining);
  syncState.isSyncing = false;
  syncState.lastSyncTime = new Date().toISOString();
}
