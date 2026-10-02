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

      <!-- Selector Rápido de Usuario / Turno de Empleado -->
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="tonal"
            class="mr-3 font-weight-bold text-white text-none"
            size="small"
          >
            <v-avatar size="24" :color="authStore.roleColor" class="mr-2 text-white font-weight-bold text-caption">
              {{ authStore.currentUser?.fullName.charAt(0) }}
            </v-avatar>
            {{ authStore.currentUser?.fullName }}
            <v-chip size="x-small" :color="authStore.roleColor" class="ml-2 font-weight-black text-white">
              {{ authStore.currentUser?.role }}
            </v-chip>
            <v-icon icon="mdi-chevron-down" size="small" class="ml-1" />
          </v-btn>
        </template>

        <v-list density="compact" min-width="260">
          <v-list-subheader class="font-weight-bold">CAMBIAR DE EMPLEADO / TURNO</v-list-subheader>
          <v-list-item
            v-for="usr in authStore.users"
            :key="usr.id"
            :active="usr.id === authStore.currentUser?.id"
            @click="authStore.switchUser(usr.id)"
          >
            <template #prepend>
              <v-avatar size="28" :color="getRoleColor(usr.role)" class="text-white font-weight-bold text-caption mr-2">
                {{ usr.fullName.charAt(0) }}
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold text-body-2">{{ usr.fullName }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ usr.role }} (PIN: {{ usr.pin }})
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-1" />
          <v-list-item @click="pinDialog = true" prepend-icon="mdi-dialpad" title="Ingresar con PIN..." />
        </v-list>
      </v-menu>

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
        {{ syncState.isOnline ? 'En Línea' : 'Offline' }}
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
        {{ syncState.pendingCount }}
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
        {{ isSupabaseConfigured ? 'Supabase' : 'Local' }}
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
      <!-- Tarjeta de usuario en el menú lateral -->
      <div class="pa-3 bg-grey-lighten-4 border-b d-flex align-center">
        <v-avatar size="36" :color="authStore.roleColor" class="mr-3 text-white font-weight-bold">
          {{ authStore.currentUser?.fullName.charAt(0) }}
        </v-avatar>
        <div class="overflow-hidden">
          <div class="text-body-2 font-weight-black text-truncate">{{ authStore.currentUser?.fullName }}</div>
          <div class="text-caption font-weight-medium text-grey-darken-2">{{ authStore.roleLabel }}</div>
        </div>
      </div>

      <v-list density="comfortable" nav class="pt-2">
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
          subtitle="Kardex e inventario"
          color="primary"
        >
          <template #append v-if="productStore.lowStockCount > 0">
            <v-chip size="x-small" color="error" variant="flat">
              {{ productStore.lowStockCount }}
            </v-chip>
          </template>
        </v-list-item>

        <!-- Solo accesible por Administrador -->
        <v-list-item
          v-if="authStore.canMassUpdatePrices"
          to="/actualizar-precios"
          prepend-icon="mdi-percent-box-outline"
          title="Aumento Masivo Precios"
          subtitle="Inflación por Rubro / Marca"
          color="primary"
        />

        <v-list-item
          to="/ventas"
          prepend-icon="mdi-receipt-text-outline"
          title="Ventas y Comprobantes"
          subtitle="Historial y comprobantes"
          color="primary"
        />

        <!-- Solo visible si puede ver costos -->
        <v-list-item
          v-if="authStore.canViewCosts"
          to="/auditoria"
          prepend-icon="mdi-shield-alert-outline"
          title="Auditoría de Planilla"
          subtitle="Inconsistencias de costos"
          color="warning"
        >
          <template #append>
            <v-chip size="x-small" color="warning" variant="flat">5</v-chip>
          </template>
        </v-list-item>

        <v-divider class="my-2" v-if="authStore.canManageUsers" />

        <!-- Gestión de Personal y Roles -->
        <v-list-item
          v-if="authStore.canManageUsers"
          to="/usuarios"
          prepend-icon="mdi-account-cog-outline"
          title="Personal y Permisos"
          subtitle="Gestión de roles y PINs"
          color="purple-darken-2"
        />
      </v-list>

      <template #append>
        <div class="pa-3 border-t bg-grey-lighten-4 text-caption text-grey">
          <div class="font-weight-bold text-grey-darken-2">NegoStock SaaS v1.3</div>
          <div>Multi-tenant + RBAC Roles</div>
          <div>Supabase Auth Ready</div>
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
        <strong>Modo Desconectado Activado:</strong> Podés seguir cobrando normalmente; las ventas se subirán a la nube cuando regrese la conexión.
      </template>
    </v-banner>

    <!-- MODAL DE CAMBIO RÁPIDO DE PIN -->
    <v-dialog v-model="pinDialog" max-width="320">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon icon="mdi-dialpad" class="mr-2" />
          Ingreso por PIN
        </v-card-title>
        <v-card-text class="pa-4 text-center">
          <div class="text-caption text-grey mb-3">Ingresá tu PIN de 4 dígitos de empleado:</div>
          <v-text-field
            v-model="inputPin"
            type="password"
            maxlength="4"
            variant="outlined"
            density="comfortable"
            class="text-h5"
            autofocus
            @keydown.enter="handlePinSubmit"
          />
          <div v-if="pinError" class="text-caption text-error font-weight-bold mt-1">{{ pinError }}</div>
        </v-card-text>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="pinDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="px-4 font-weight-bold" @click="handlePinSubmit">
            Ingresar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- CONTENIDO PRINCIPAL -->
    <v-main class="bg-background">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/services/supabase';
import { syncState, initSyncManager, syncPendingSales } from '@/services/syncQueue';

const drawer = ref(true);
const pinDialog = ref(false);
const inputPin = ref('');
const pinError = ref('');

const productStore = useProductStore();
const authStore = useAuthStore();

onMounted(() => {
  authStore.initAuth();
  productStore.fetchProducts();
  initSyncManager((sale, result) => {
    console.log('[NegoStock] Venta sincronizada:', sale.voucherNumber);
  });
});

function handlePinSubmit() {
  const result = authStore.loginWithPin(inputPin.value);
  if (result.success) {
    pinDialog.value = false;
    inputPin.value = '';
    pinError.value = '';
  } else {
    pinError.value = result.error;
  }
}

function getRoleColor(role) {
  const map = {
    ADMIN: 'purple-darken-2',
    MANAGER: 'indigo',
    CASHIER: 'teal-darken-2',
    SELLER: 'blue-grey'
  };
  return map[role] || 'grey';
}

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
