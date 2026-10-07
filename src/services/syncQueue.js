import { reactive } from 'vue';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  secureSet,
  secureGetAll,
  secureRemove,
  secureClear,
  migrateLegacyPlainStorage
} from './secureStorage';

export const syncState = reactive({
  isOnline: navigator.onLine,
  pendingCount: 0,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null
});

async function refreshPendingCount() {
  try {
    const queue = await secureGetAll('sales_queue');
    syncState.pendingCount = queue.length;
    return queue;
  } catch (e) {
    console.error('[SyncQueue] Error leyendo cola segura:', e);
    return [];
  }
}

export async function initSyncManager(onSaleSyncedCallback) {
  // 1. Migrar datos antiguos de texto plano si existían
  await migrateLegacyPlainStorage();

  // 2. Calcular pendientes iniciales
  await refreshPendingCount();

  // 3. Listeners de conectividad
  window.addEventListener('online', async () => {
    syncState.isOnline = true;
    console.log('[NegoStock] Conexión a internet restablecida. Iniciando sincronización segura...');
    await syncPendingSales(onSaleSyncedCallback);
  });

  window.addEventListener('offline', () => {
    syncState.isOnline = false;
    console.warn('[NegoStock] Conexión perdida. Operando en Modo Mostrador Seguro Offline (Cifrado AES-256).');
  });

  // Intentar sincronizar al inicio si hay internet y ventas pendientes
  if (syncState.isOnline && syncState.pendingCount > 0) {
    await syncPendingSales(onSaleSyncedCallback);
  }
}

export async function enqueueOfflineSale(saleRecord) {
  const record = {
    ...saleRecord,
    id: saleRecord.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    enqueuedAt: new Date().toISOString()
  };

  // Guardado en IndexedDB con cifrado AES-256
  await secureSet('sales_queue', record.id, record);
  await refreshPendingCount();

  console.log(`[NegoStock] Venta #${record.voucherNumber || record.id} encolada de forma segura cifrada. Total pendientes: ${syncState.pendingCount}`);
}

export async function syncPendingSales(onSaleSyncedCallback) {
  if (!isSupabaseConfigured || !supabase || !syncState.isOnline || syncState.isSyncing) {
    return;
  }

  const queue = await refreshPendingCount();
  if (queue.length === 0) return;

  syncState.isSyncing = true;
  syncState.syncError = null;

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  for (const sale of queue) {
    try {
      const payload = {
        p_comercio_id: 1,
        p_tipo_comprobante: sale.voucherType,
        p_medio_pago: sale.paymentMethod,
        p_modalidad_precio: sale.priceMode || 'selling',
        p_items: sale.items.map(it => {
          const basePrice = (it.customUnitPrice !== undefined && it.customUnitPrice !== null)
            ? Number(it.customUnitPrice)
            : (sale.priceMode === 'wholesale' && it.wholesalePrice > 0 ? it.wholesalePrice : (it.sellingPrice || it.price || 0));
          const lineDisc = Number(it.discountPercent || 0);
          const effectivePrice = lineDisc > 0 ? Math.max(0, basePrice * (1 - lineDisc / 100)) : basePrice;
          return {
            id: isUUID(it.id) ? it.id : null,
            sku: it.sku,
            quantity: it.quantity,
            price: it.price !== undefined && it.price !== null ? Number(it.price) : effectivePrice
          };
        }),
        p_descuento: sale.discount || 0,
        p_cliente_id: isUUID(sale.customer?.id) ? sale.customer.id : null,
        p_offline_id: sale.id,
        p_notas: [
          sale.notes,
          sale.remitoDeliveryAddress ? `Entrega: ${sale.remitoDeliveryAddress}` : null,
          sale.remitoCarrier ? `Transporte: ${sale.remitoCarrier}` : null,
          `Cliente: ${sale.customer?.name || 'Consumidor Final'}`,
          `Atendido por: ${sale.userName || 'Mostrador'} (${sale.userRole || 'Cajero'})`,
          `[Sincronizado Offline]`
        ].filter(Boolean).join(' | ')
      };

      const { data, error } = await supabase.rpc('procesar_venta_mostrador', payload);

      if (error) {
        console.error('[NegoStock] Error sincronizando venta en Supabase:', error);
        syncState.syncError = error.message;
      } else {
        console.log(`[NegoStock] Venta ${sale.id} sincronizada exitosamente:`, data);
        // Eliminar del almacén seguro una vez confirmada
        await secureRemove('sales_queue', sale.id);
        if (onSaleSyncedCallback) {
          onSaleSyncedCallback(sale, data);
        }
      }
    } catch (err) {
      console.error('[NegoStock] Excepción en sincronización:', err);
      syncState.syncError = err.message;
    }
  }

  await refreshPendingCount();
  syncState.isSyncing = false;
  syncState.lastSyncTime = new Date().toISOString();
}
