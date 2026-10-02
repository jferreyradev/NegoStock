<template>
  <v-app>
    <!-- BARRA SUPERIOR -->
    <v-app-bar color="primary" elevation="2" density="comfortable">
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-toolbar-title class="font-weight-black d-flex align-center">
        <v-icon icon="mdi-tools" class="mr-2 text-secondary" />
        NegoStock
        <span class="text-caption ml-2 text-secondary font-weight-regular">
          Control de Stock & Ferretería
        </span>
      </v-toolbar-title>

      <v-spacer />

      <!-- Indicador de Red y Cola Offline -->
      <v-chip
        size="small"
        :color="syncState.isOnline ? 'success' : 'error'"
        variant="flat"
        class="mr-2 font-weight-bold"
      >
        <v-icon
          :icon="syncState.isOnline ? 'mdi-wifi' : 'mdi-wifi-off'"
          start
          size="small"
        />
        {{ syncState.isOnline ? 'En Línea' : 'Sin Internet (Offline)' }}
      </v-chip>

      <!-- Badge de Ventas pendientes de sincronizar -->
      <v-chip
        v-if="syncState.pendingCount > 0"
        size="small"
        color="warning"
        variant="flat"
        class="mr-2 font-weight-bold animate-pulse"
        title="Ventas guardadas localmente esperando conexión"
        @click="triggerManualSync"
      >
        <v-icon icon="mdi-cloud-upload-outline" start size="small" />
        {{ syncState.pendingCount }} por sincronizar
      </v-chip>

      <!-- Estado de Conexión Nube / Local -->
      <v-chip
        size="small"
        :color="isSupabaseConfigured ? 'teal-darken-1' : 'amber-darken-2'"
        variant="flat"
        class="mr-3 font-weight-bold"
      >
        <v-icon
          :icon="isSupabaseConfigured ? 'mdi-cloud-check' : 'mdi-database'"
          start
          size="small"
        />
        {{ isSupabaseConfigured ? 'Supabase Nube' : 'Modo Local / Demo' }}
      </v-chip>

      <!-- Alerta de Stock Bajo -->
      <v-btn
        icon
        to="/inventario"
        title="Ver productos con stock crítico"
      >
        <v-badge
          :content="productStore.lowStockCount"
          :model-value="productStore.lowStockCount > 0"
          color="error"
        >
          <v-icon icon="mdi-bell-outline" />
        </v-badge>
      </v-btn>
    </v-app-bar>

    <!-- MENÚ LATERAL -->
    <v-navigation-drawer v-model="drawer" elevation="2">
      <v-list density="comfortable" nav class="pt-3">
        <v-list-item
          to="/"
          prepend-icon="mdi-point-of-sale"
          title="Punto de Venta"
          subtitle="Cobro y Preventa [F6]"
          color="primary"
        />

        <v-list-item
          to="/inventario"
          prepend-icon="mdi-package-variant-closed"
          title="Control de Stock"
          subtitle="Kardex y catálogo"
          color="primary"
        >
          <template #append v-if="productStore.lowStockCount > 0">
            <v-chip size="x-small" color="error" variant="flat">
              {{ productStore.lowStockCount }}
            </v-chip>
          </template>
        </v-list-item>

        <v-list-item
          to="/actualizar-precios"
          prepend-icon="mdi-percent-box-outline"
          title="Aumento Masivo Precios"
          subtitle="Ajuste por Rubro o Marca"
          color="primary"
        />

        <v-list-item
          to="/ventas"
          prepend-icon="mdi-receipt-text-outline"
          title="Ventas y Comprobantes"
          subtitle="Historial y comprobantes"
          color="primary"
        />

        <v-list-item
          to="/auditoria"
          prepend-icon="mdi-shield-alert-outline"
          title="Auditoría de Planilla"
          subtitle="5 anomalías detectadas"
          color="warning"
        >
          <template #append>
            <v-chip size="x-small" color="warning" variant="flat">5</v-chip>
          </template>
        </v-list-item>
      </v-list>

      <template #append>
        <div class="pa-3 border-t bg-grey-lighten-4 text-caption text-grey">
          <div class="font-weight-bold text-grey-darken-2">NegoStock SaaS v1.2</div>
          <div>Preventa + Actualizador Masivo</div>
          <div>Audio Feedback + ACID RPC</div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- BANNER DE AVISO CUANDO SE CAE INTERNET -->
    <v-banner
      v-if="!syncState.isOnline"
      color="warning"
      lines="one"
      icon="mdi-wifi-alert"
      class="border-b"
    >
      <template #text>
        <strong>Modo Desconectado Activado:</strong> No hay internet. Podés seguir cobrando e imprimiendo tickets con total normalidad; las ventas se subirán automáticamente a la nube apenas regrese la conexión.
      </template>
    </v-banner>

    <!-- CONTENIDO PRINCIPAL -->
    <v-main class="bg-background">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { isSupabaseConfigured } from '@/services/supabase';
import { syncState, initSyncManager, syncPendingSales } from '@/services/syncQueue';

const drawer = ref(true);
const productStore = useProductStore();

onMounted(() => {
  productStore.fetchProducts();
  initSyncManager((sale, result) => {
    console.log('[NegoStock] Venta sincronizada:', sale.voucherNumber);
  });
});

function triggerManualSync() {
  syncPendingSales();
}
</script>

<style>
body {
  font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  user-select: none;
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}
</style>
