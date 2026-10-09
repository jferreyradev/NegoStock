<template>
  <v-app>
    <!-- BARRA SUPERIOR -->
    <v-app-bar v-if="authStore.isAuthenticated && route.name !== 'login'" color="primary" elevation="2" density="comfortable">
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-toolbar-title class="font-weight-black d-flex align-center">
        <v-icon icon="mdi-tools" class="mr-1 mr-sm-2 text-secondary" />
        <span>NegoStock</span>
        <span class="text-caption ml-2 text-secondary font-weight-regular d-none d-md-inline">
          Control de Stock & Ferretería
        </span>
      </v-toolbar-title>

      <v-spacer />

      <!-- Badge de Usuario Activo (Responsive: en móviles solo avatar + rol) -->
      <div
        class="d-none d-sm-flex align-center mr-2 py-1 px-2 rounded-pill bg-white-opacity-10 border border-white-opacity-20"
        :title="'Sesión activa: ' + authStore.currentUser?.fullName + ' (' + authStore.roleLabel + ')'"
      >
        <v-avatar size="24" :color="authStore.roleColor" class="mr-1 mr-md-2 text-white font-weight-bold text-caption">
          {{ authStore.currentUser?.fullName?.charAt(0) || 'U' }}
        </v-avatar>
        <span class="text-caption font-weight-bold text-white text-truncate mr-2 d-none d-lg-inline" style="max-width: 140px;">
          {{ authStore.currentUser?.fullName }}
        </span>
        <v-chip size="x-small" :color="authStore.roleColor" class="font-weight-black text-white" variant="flat">
          {{ authStore.currentUser?.role }}
        </v-chip>
      </div>

      <!-- Selector Rápido de Modo de Operación (Exclusivo Superusuario / Dueño SaaS) -->
      <v-btn
        v-if="authStore.canManageModules"
        variant="tonal"
        size="small"
        class="mr-1 mr-sm-2 text-white font-weight-bold text-none px-2"
        :title="'Módulos SaaS (Superusuario): ' + moduleStore.activeModeInfo.title + ' (Clic para gestionar)'"
        @click="moduleDialog = true"
      >
        <v-icon icon="mdi-shield-crown" size="small" class="mr-1 text-amber-accent-2" />
        <span class="d-none d-md-inline">{{ moduleStore.activeModeInfo.shortTitle }}</span>
      </v-btn>

      <!-- Selector de Modo de Conectividad (Sólo si advancedHeader o Admin) -->
      <v-menu v-if="moduleStore.modules.advancedHeader || authStore.canManageUsers" location="bottom end">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="tonal"
            size="small"
            class="mr-1 mr-sm-2 text-white font-weight-bold text-none px-2"
            :title="'Modo actual: ' + syncModeStore.modeLabel"
          >
            <v-icon :icon="syncModeStore.modeIcon" size="small" />
            <span class="ml-1 d-none d-md-inline">{{ syncModeStore.modeLabel }}</span>
            <v-icon icon="mdi-chevron-down" end size="x-small" class="ml-1 d-none d-sm-inline" />
          </v-btn>
        </template>

        <v-list density="comfortable" min-width="320">
          <v-list-subheader class="font-weight-bold text-primary">MODO DE FUNCIONAMIENTO</v-list-subheader>

          <!-- 1. Automático Híbrido -->
          <v-list-item
            :active="syncModeStore.isAutomatic"
            @click="syncModeStore.setMode('AUTOMATICO')"
          >
            <template #prepend>
              <v-icon icon="mdi-cloud-sync" color="teal-darken-1" class="mr-2" />
            </template>
            <v-list-item-title class="font-weight-bold">Automático (Híbrido)</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              Guarda en la nube; si no hay internet guarda local y auto-sincroniza al volver.
            </v-list-item-subtitle>
          </v-list-item>

          <!-- 2. Sólo en Línea -->
          <v-list-item
            :active="syncModeStore.isOnlineOnly"
            @click="syncModeStore.setMode('ONLINE')"
          >
            <template #prepend>
              <v-icon icon="mdi-cloud-check" color="blue-darken-2" class="mr-2" />
            </template>
            <v-list-item-title class="font-weight-bold">Sólo en Línea (Nube)</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              Opera exclusivamente en Supabase. Requiere conexión permanente.
            </v-list-item-subtitle>
          </v-list-item>

          <!-- 3. Modo Local -->
          <v-list-item
            :active="syncModeStore.isLocalOnly"
            @click="syncModeStore.setMode('LOCAL')"
          >
            <template #prepend>
              <v-icon icon="mdi-laptop" color="amber-darken-3" class="mr-2" />
            </template>
            <v-list-item-title class="font-weight-bold">Modo Local (Offline)</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              Guarda todo en la PC y sincroniza por lotes cuando vos lo decidas.
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Botón de Sincronización Manual (Visible si hay pendientes o en modo Local) -->
      <v-btn
        v-if="syncModeStore.totalPendingCount > 0 || syncModeStore.isLocalOnly"
        size="small"
        :color="syncModeStore.totalPendingCount > 0 ? 'amber-darken-3' : 'grey-lighten-1'"
        variant="flat"
        class="mr-2 font-weight-bold text-none text-white"
        :loading="syncModeStore.isSyncing"
        @click="openSyncDialog"
      >
        <v-icon icon="mdi-sync" start size="small" />
        Sincronizar
        <v-badge
          v-if="syncModeStore.totalPendingCount > 0"
          :content="syncModeStore.totalPendingCount"
          color="error"
          inline
          class="ml-1"
        />
      </v-btn>

      <!-- Indicador de Red Física -->
      <v-chip
        size="small"
        :color="syncState.isOnline ? 'success' : 'error'"
        variant="flat"
        class="mr-1 mr-sm-2 font-weight-bold d-none d-sm-inline-flex"
      >
        <v-icon
          :icon="syncState.isOnline ? 'mdi-wifi' : 'mdi-wifi-off'"
          start
          size="small"
        />
        <span class="d-none d-md-inline">{{ syncState.isOnline ? 'Conectado' : 'Sin Red' }}</span>
      </v-chip>

      <!-- Badge de Entorno Backend (DEV / PROD) -->
      <v-chip
        size="small"
        :color="isProductionBackend ? 'indigo-darken-2' : 'amber-darken-3'"
        variant="flat"
        class="mr-1 mr-sm-2 font-weight-bold"
        :title="'Backend Supabase: ' + supabaseHost"
      >
        <v-icon :icon="isProductionBackend ? 'mdi-server-network' : 'mdi-flask'" start size="small" />
        <span>{{ environmentLabel }}</span>
      </v-chip>

      <!-- Carrito / Armador de Presupuestos -->
      <v-btn
        v-if="moduleStore.modules.armadorPresupuesto !== false"
        icon
        size="small"
        to="/armar-presupuesto"
        class="text-white"
        title="Ver Carrito y Armador de Presupuestos"
      >
        <v-badge
          :content="cartStore.itemCount"
          :model-value="cartStore.itemCount > 0"
          color="amber-accent-4"
        >
          <v-icon icon="mdi-cart" size="small" />
        </v-badge>
      </v-btn>

      <!-- Alerta de Stock Bajo -->
      <v-btn
        icon
        size="small"
        to="/inventario"
        title="Ver productos con stock crítico"
      >
        <v-badge
          :content="productStore.lowStockCount"
          :model-value="productStore.lowStockCount > 0"
          color="error"
        >
          <v-icon icon="mdi-bell-outline" size="small" />
        </v-badge>
      </v-btn>

      <!-- Botón Directo de Cerrar Sesión / Salir -->
      <v-btn
        color="red-darken-1"
        variant="flat"
        size="small"
        class="ml-1 ml-sm-2 font-weight-bold text-white text-none shadow-sm px-2"
        title="Cerrar Sesión / Salir del Sistema"
        @click="confirmLogoutDialog = true"
      >
        <v-icon icon="mdi-logout" size="small" />
        <span class="ml-1 d-none d-sm-inline">Salir</span>
      </v-btn>
    </v-app-bar>

    <!-- MENÚ LATERAL -->
    <v-navigation-drawer v-if="authStore.isAuthenticated && route.name !== 'login'" v-model="drawer" elevation="2">
      <!-- Tarjeta de usuario en el menú lateral -->
      <div class="pa-3 bg-grey-lighten-4 border-b d-flex align-center justify-space-between">
        <div class="d-flex align-center overflow-hidden">
          <v-avatar size="36" :color="authStore.roleColor" class="mr-3 text-white font-weight-bold">
            {{ authStore.currentUser?.fullName.charAt(0) }}
          </v-avatar>
          <div class="overflow-hidden">
            <div class="text-body-2 font-weight-black text-truncate">{{ authStore.currentUser?.fullName }}</div>
            <div class="text-caption font-weight-medium text-grey-darken-2">{{ authStore.roleLabel }}</div>
          </div>
        </div>
        <v-btn
          icon="mdi-logout"
          size="small"
          variant="text"
          color="error"
          title="Cerrar Sesión"
          @click="confirmLogoutDialog = true"
        />
      </div>

      <v-list density="comfortable" nav class="pt-2">
        <v-list-item
          to="/"
          prepend-icon="mdi-point-of-sale"
          title="Punto de Venta"
          :subtitle="moduleStore.modules.preventas ? 'Cobro y Preventa [F6]' : 'Cobro rápido mostrador'"
          color="primary"
        />

        <v-list-item
          v-if="moduleStore.modules.armadorPresupuesto !== false"
          to="/armar-presupuesto"
          prepend-icon="mdi-cart-outline"
          title="Armador de Presupuesto"
          subtitle="Cotizaciones, descuentos y pedidos"
          color="amber-darken-3"
        >
          <template #append v-if="cartStore.itemCount > 0">
            <v-chip size="x-small" color="amber-darken-3" variant="flat" class="font-weight-bold">
              {{ cartStore.itemCount }}
            </v-chip>
          </template>
        </v-list-item>

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

        <v-list-item
          to="/ventas"
          prepend-icon="mdi-receipt-text-outline"
          title="Ventas y Comprobantes"
          subtitle="Historial y comprobantes"
          color="primary"
        />

        <!-- Resumen e Informes de Venta (Exclusivo Administrador/Dueño y Superusuario si está habilitado) -->
        <v-list-item
          v-if="authStore.canViewSalesReports && moduleStore.modules.reportesVentas !== false"
          to="/reportes-ventas"
          prepend-icon="mdi-chart-areaspline"
          title="Resumen de Ventas"
          subtitle="Día, Horas Pico y Mes"
          color="teal-darken-1"
        >
          <template #append>
            <v-chip size="x-small" color="teal-accent-4" variant="flat" class="font-weight-black text-black">
              ADMIN
            </v-chip>
          </template>
        </v-list-item>

        <!-- Solo accesible por Administrador si el módulo está habilitado -->
        <v-list-item
          v-if="authStore.canMassUpdatePrices && moduleStore.modules.aumentoMasivo !== false"
          to="/actualizar-precios"
          prepend-icon="mdi-percent-box-outline"
          title="Aumento Masivo Precios"
          subtitle="Inflación por Rubro / Marca"
          color="primary"
        />

        <!-- Solo visible si puede ver costos y el módulo está habilitado -->
        <v-list-item
          v-if="authStore.canViewCosts && moduleStore.modules.auditoriaCostos !== false"
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

        <!-- Habilitador de Módulos (Exclusivo Desarrollador / Dueño del SaaS) -->
        <v-list-item
          v-if="authStore.canManageModules"
          prepend-icon="mdi-shield-crown-outline"
          title="Módulos del Sistema"
          :subtitle="'Licencia SaaS: ' + moduleStore.activeModeInfo.title"
          color="deep-purple-accent-4"
          @click="moduleDialog = true"
        />

        <!-- Backup y Restauración de Base de Datos (Exclusivo Superusuario / SaaS Master) -->
        <v-list-item
          v-if="authStore.canManageBackup && moduleStore.modules.backupRestore !== false"
          to="/inventario"
          prepend-icon="mdi-database-sync-outline"
          title="Backup y Restauración"
          subtitle="Respaldo de BD (Superusuario)"
          color="deep-purple-accent-4"
        />

        <!-- Gestión de Personal y Roles -->
        <v-list-item
          v-if="authStore.canManageUsers && moduleStore.modules.multiUsuario !== false"
          to="/usuarios"
          prepend-icon="mdi-account-cog-outline"
          title="Usuarios y Personal"
          subtitle="Gestión de empleados, roles y PINs"
          color="purple-darken-2"
        >
          <template #append>
            <v-chip size="x-small" color="purple-lighten-4" variant="flat" class="text-purple-darken-4 font-weight-black">
              ADMIN
            </v-chip>
          </template>
        </v-list-item>

        <!-- Configuración del Negocio y Tickets -->
        <v-list-item
          v-if="authStore.canManageUsers"
          prepend-icon="mdi-store-cog-outline"
          title="Datos del Negocio"
          subtitle="Identidad, tickets y recibos"
          color="indigo"
          @click="openBusinessDialog"
        />
      </v-list>

      <template #append>
        <div class="pa-3 border-t">
          <v-btn
            block
            color="error"
            variant="tonal"
            prepend-icon="mdi-logout"
            class="font-weight-bold text-none mb-2"
            @click="confirmLogoutDialog = true"
          >
            Cerrar Sesión / Salir
          </v-btn>
        </div>
        <div class="pa-3 bg-grey-lighten-4 text-caption text-grey border-t">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="font-weight-bold text-grey-darken-2">NegoStock SaaS v1.3</span>
            <v-chip
              size="x-small"
              :color="isProductionBackend ? 'indigo-darken-2' : 'amber-darken-3'"
              variant="flat"
              class="font-weight-bold"
            >
              {{ environmentLabel }}
            </v-chip>
          </div>
          <div class="text-truncate text-2xs" :title="supabaseHost">
            Backend: {{ supabaseHost }}
          </div>
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

    <!-- MODAL DE SINCRONIZACIÓN MANUAL -->
    <v-dialog v-model="syncDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-sync" class="mr-2" />
            <span>Sincronización con Supabase</span>
          </div>
          <v-chip size="small" :color="syncModeStore.modeColor" variant="flat" class="font-weight-bold">
            {{ syncModeStore.modeLabel }}
          </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="text-body-2 mb-3 text-grey-darken-2">
            {{ syncModeStore.modeDescription }}
          </div>

          <!-- RESUMEN DE PENDIENTES -->
          <v-row dense class="mb-3">
            <v-col cols="6">
              <v-sheet class="pa-3 bg-grey-lighten-4 rounded text-center">
                <div class="text-caption text-grey font-weight-bold">VENTAS PENDIENTES</div>
                <div class="text-h5 font-weight-black text-primary">
                  {{ syncModeStore.pendingSalesCount }}
                </div>
              </v-sheet>
            </v-col>
            <v-col cols="6">
              <v-sheet class="pa-3 bg-grey-lighten-4 rounded text-center">
                <div class="text-caption text-grey font-weight-bold">CAMBIOS PRODUCTOS</div>
                <div class="text-h5 font-weight-black text-amber-darken-3">
                  {{ syncModeStore.pendingProductsCount }}
                </div>
              </v-sheet>
            </v-col>
          </v-row>

          <!-- ESTADO DE CONECTIVIDAD -->
          <v-alert
            :type="syncState.isOnline ? 'success' : 'error'"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ syncState.isOnline ? 'Conexión a internet activa y lista para sincronizar.' : 'Sin conexión a internet. Conéctese a internet para sincronizar.' }}
          </v-alert>

          <!-- RESULTADO DE ÚLTIMA SINCRONIZACIÓN -->
          <div v-if="syncResult" class="pa-3 bg-grey-lighten-4 rounded text-caption mb-3">
            <div class="font-weight-bold text-success mb-1">
              <v-icon icon="mdi-check-circle" size="small" color="success" /> Sincronización completada
            </div>
            <div>Ventas subidas con éxito: <strong>{{ syncResult.salesSuccess }}</strong></div>
            <div>Productos/precios actualizados: <strong>{{ syncResult.prodsSuccess }}</strong></div>
            <div v-if="syncResult.errors && syncResult.errors.length > 0" class="text-error mt-1">
              Errores: {{ syncResult.errors.join(', ') }}
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="syncDialog = false">Cerrar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="px-4 font-weight-bold"
            :loading="syncModeStore.isSyncing"
            :disabled="!syncState.isOnline || (syncModeStore.totalPendingCount === 0 && !syncResult)"
            @click="handleManualSyncAll"
          >
            <v-icon icon="mdi-cloud-upload" start />
            Sincronizar Todo Ahora
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE CONFIGURACIÓN DE NEGOCIO Y RECIBOS -->
    <v-dialog v-model="businessDialog" max-width="650" persistent>
      <v-card>
        <v-card-title class="bg-indigo-darken-2 text-white d-flex align-center">
          <v-icon icon="mdi-store-cog" class="mr-2" />
          <span>Configuración del Negocio y Recibos</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="text-caption text-grey mb-3">
            Estos datos se imprimen en los tickets, comprobantes de venta y encabezados del sistema.
          </div>

          <v-row dense>
            <v-col cols="12" md="7">
              <v-text-field
                v-model="businessForm.nombre"
                label="Nombre Comercial / Fantasía *"
                variant="outlined"
                density="compact"
                placeholder="Ej. Ferretería Central"
              />
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="businessForm.cuit"
                label="CUIT / Identificación Tributaria *"
                variant="outlined"
                density="compact"
                placeholder="30-71234567-9"
              />
            </v-col>
            <v-col cols="12" md="7">
              <v-text-field
                v-model="businessForm.razonSocial"
                label="Razón Social (Legal)"
                variant="outlined"
                density="compact"
                placeholder="Ferretería Central S.R.L."
              />
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="businessForm.iibb"
                label="Ingresos Brutos (IIBB)"
                variant="outlined"
                density="compact"
                placeholder="901-123456-7"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="businessForm.condicionIva"
                label="Condición IVA"
                :items="[
                  { title: 'IVA Responsable Inscripto', value: 'RESPONSABLE_INSCRIPTO' },
                  { title: 'Responsable Monotributo', value: 'MONOTRIBUTO' },
                  { title: 'IVA Exento', value: 'EXENTO' },
                  { title: 'Consumidor Final', value: 'CONSUMIDOR_FINAL' }
                ]"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="businessForm.puntoVenta"
                label="Punto de Venta N°"
                type="number"
                variant="outlined"
                density="compact"
                min="1"
              />
            </v-col>
            <v-col cols="12" md="7">
              <v-text-field
                v-model="businessForm.direccion"
                label="Dirección Comercial"
                variant="outlined"
                density="compact"
                placeholder="Av. San Martín 1240, Morón"
              />
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="businessForm.telefono"
                label="Teléfono / WhatsApp"
                variant="outlined"
                density="compact"
                placeholder="011-4567-8900"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="businessForm.email"
                label="Email de Contacto"
                variant="outlined"
                density="compact"
                placeholder="ventas@ferreteria.com"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="businessForm.tipoImpresora"
                label="Ancho de Papel Ticketera"
                :items="[
                  { title: 'Térmica 80 mm (Estándar POS)', value: '80mm' },
                  { title: 'Térmica 58 mm (Compacta)', value: '58mm' }
                ]"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="12">
              <v-divider class="my-2" />
              <div class="text-caption font-weight-bold text-indigo-darken-2 mb-2 d-flex align-center">
                <v-icon icon="mdi-shield-lock-outline" size="18" class="mr-1" />
                Seguridad de la Terminal y Sesiones
              </div>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="businessForm.sessionTimeoutMinutes"
                label="Cierre automático por inactividad (Timeout)"
                :items="[
                  { title: '5 minutos (Máxima seguridad en mostrador)', value: 5 },
                  { title: '10 minutos (Seguridad estándar)', value: 10 },
                  { title: '15 minutos (Predeterminado recomendado)', value: 15 },
                  { title: '30 minutos (Comercios con poca rotación)', value: 30 },
                  { title: '60 minutos (1 hora)', value: 60 },
                  { title: 'Desactivado (Sin bloqueo automático)', value: 0 }
                ]"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-timer-outline"
                messages="Bloquea la terminal si no se detecta movimiento de mouse o teclado para proteger la caja."
              />
            </v-col>
            <v-col cols="12" md="12">
              <v-divider class="my-2" />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="businessForm.pieTicket"
                label="Leyenda Fiscal al pie del ticket"
                variant="outlined"
                density="compact"
                placeholder="Comprobante no válido como factura fiscal"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="businessForm.mensajeAgradecimiento"
                label="Mensaje final de agradecimiento"
                variant="outlined"
                density="compact"
                placeholder="¡Gracias por su compra!"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="businessDialog = false">Cancelar</v-btn>
          <v-btn color="indigo" variant="flat" :loading="businessStore.isLoading" class="px-4 font-weight-bold" @click="saveBusinessConfig">
            Guardar Configuración
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE CONFIGURACIÓN DE MÓDULOS SAAS (EXCLUSIVO DESARROLLADOR / SUPERUSUARIO) -->
    <v-dialog v-model="moduleDialog" max-width="660">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-deep-purple-darken-3 text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-shield-crown" class="mr-2 text-amber-accent-2" />
            <span class="font-weight-black">Control de Módulos y Licencia SaaS (Desarrollador)</span>
          </div>
          <v-chip size="small" :color="moduleStore.activeModeInfo.color" variant="flat" class="font-weight-bold text-white">
            {{ moduleStore.activeModeInfo.shortTitle }}
          </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3 text-caption font-weight-medium"
          >
            <strong>Exclusivo Desarrollador / Licenciatario del SaaS:</strong> Solo el desarrollador tiene acceso a este panel para habilitar o deshabilitar módulos según el abono o las necesidades contratadas por el comercio. Los empleados, administradores y dueños no pueden modificar esta configuración.
          </v-alert>

          <v-radio-group :model-value="moduleStore.currentMode" @update:model-value="moduleStore.setMode" hide-details>
            <!-- 1. MODO ESENCIAL -->
            <v-card
              variant="outlined"
              class="pa-3 mb-2 cursor-pointer transition-all"
              :class="{ 'border-teal bg-teal-lighten-5': moduleStore.isSimpleMode }"
              @click="moduleStore.setMode('SIMPLE')"
            >
              <div class="d-flex align-start">
                <v-radio value="SIMPLE" color="teal-darken-2" class="mt-0" />
                <div class="ml-2">
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-lightning-bolt" color="teal-darken-2" size="small" class="mr-1" />
                    <strong class="text-subtitle-2 font-weight-black">Modo Esencial (Mostrador Ágil)</strong>
                    <v-chip size="x-small" color="teal" variant="flat" class="ml-2 font-weight-bold text-white">Recomendado para empleados</v-chip>
                  </div>
                  <div class="text-caption text-grey-darken-2 mt-1">
                    Solo Vender (POS) + Inventario de Productos + Historial de Ventas. Pantalla limpia, cobro rápido, sin funciones que distraigan.
                  </div>
                </div>
              </div>
            </v-card>

            <!-- 2. MODO COMERCIAL -->
            <v-card
              variant="outlined"
              class="pa-3 mb-2 cursor-pointer transition-all"
              :class="{ 'border-indigo bg-indigo-lighten-5': moduleStore.isComercialMode }"
              @click="moduleStore.setMode('COMERCIAL')"
            >
              <div class="d-flex align-start">
                <v-radio value="COMERCIAL" color="indigo-darken-2" class="mt-0" />
                <div class="ml-2">
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-storefront-outline" color="indigo-darken-2" size="small" class="mr-1" />
                    <strong class="text-subtitle-2 font-weight-black">Modo Comercial (Preventa & Clientes)</strong>
                  </div>
                  <div class="text-caption text-grey-darken-2 mt-1">
                    Habilita Preventas/Presupuestos [F6]/[F7] (pedidos de mostrador para cobrar en caja), Armador de Pedidos, Remitos de Entrega, Precios Mayoristas [F8] y Clientes con Cuenta Corriente.
                  </div>
                </div>
              </div>
            </v-card>

            <!-- 3. MODO COMPLETO -->
            <v-card
              variant="outlined"
              class="pa-3 mb-3 cursor-pointer transition-all"
              :class="{ 'border-purple bg-deep-purple-lighten-5': moduleStore.isCompletoMode }"
              @click="moduleStore.setMode('COMPLETO')"
            >
              <div class="d-flex align-start">
                <v-radio value="COMPLETO" color="deep-purple-accent-4" class="mt-0" />
                <div class="ml-2">
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-cog-box" color="deep-purple-accent-4" size="small" class="mr-1" />
                    <strong class="text-subtitle-2 font-weight-black">Modo Gestión Total (Avanzado)</strong>
                  </div>
                  <div class="text-caption text-grey-darken-2 mt-1">
                    Todo activado: Aumentos Masivos por Inflación, Importación Masiva Excel, Auditoría de Proveedores y Opciones Técnicas de Sincronización.
                  </div>
                </div>
              </div>
            </v-card>
          </v-radio-group>

          <!-- INTERRUPTORES PERSONALIZADOS INDIVIDUALES (ACORDEÓN) -->
          <v-expansion-panels variant="accordion" class="mt-2">
            <v-expansion-panel title="Personalizar módulos individuales (A la carta)" elevation="0" class="border rounded">
              <v-expansion-panel-text class="pt-2">
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">VENTAS Y MOSTRADOR:</div>
                <v-switch
                  :model-value="moduleStore.modules.preventas"
                  label="Preventas y Presupuestos [F6] / [F7]"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('preventas', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.armadorPresupuesto"
                  label="Armador Avanzado de Presupuestos (/armar-presupuesto)"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('armadorPresupuesto', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.remitos"
                  label="Remitos de Entrega y Logística (Flete y Chofer)"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('remitos', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.mayorista"
                  label="Precios Mayoristas / Gremio [F8]"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('mayorista', $event)"
                />

                <v-divider class="my-3" />
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">CLIENTES Y FINANZAS:</div>
                <v-switch
                  :model-value="moduleStore.modules.clientes"
                  label="Cuentas Corrientes y Padrón de Clientes"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('clientes', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.reportesVentas"
                  label="Resumen e Informes de Venta (Día, Horas Pico, Mes)"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('reportesVentas', $event)"
                />

                <v-divider class="my-3" />
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">STOCK Y GESTIÓN DE PRECIOS:</div>
                <v-switch
                  :model-value="moduleStore.modules.importacionExcel"
                  label="Importación Masiva Excel / CSV y Plantilla Oficial"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('importacionExcel', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.kardex"
                  label="Kardex de Movimientos y Trazabilidad Histórica"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('kardex', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.aumentoMasivo"
                  label="Aumentos Masivos de Precios por Inflación (Rubro/Marca)"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('aumentoMasivo', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.auditoriaCostos"
                  label="Auditoría de Inconsistencias de Proveedores"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('auditoriaCostos', $event)"
                />

                <v-divider class="my-3" />
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">SEGURIDAD Y ADMINISTRACIÓN:</div>
                <v-switch
                  :model-value="moduleStore.modules.multiUsuario"
                  label="Gestión de Personal, Roles y PINs (/usuarios)"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('multiUsuario', $event)"
                />
                <v-switch
                  :model-value="moduleStore.modules.backupRestore"
                  label="Copias de Seguridad y Restauración de Base de Datos"
                  color="teal-darken-2"
                  density="compact"
                  hide-details
                  class="mb-1"
                  @update:model-value="moduleStore.toggleModule('backupRestore', $event)"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn color="primary" variant="flat" class="px-5 font-weight-bold" @click="moduleDialog = false">
            Listo / Aplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN -->
    <v-dialog v-model="confirmLogoutDialog" max-width="400">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-red-darken-1 text-white d-flex align-center py-3">
          <v-icon icon="mdi-logout" class="mr-2" />
          <span>Cerrar Sesión</span>
        </v-card-title>
        <v-card-text class="pa-4 pt-5">
          <p class="text-body-1 mb-2">
            ¿Deseás cerrar la sesión de <strong>{{ authStore.currentUser?.fullName }}</strong>?
          </p>
          <div class="text-caption text-grey-darken-1">
            Volverás a la pantalla de acceso con PIN o credenciales de administrador para el siguiente turno.
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" class="font-weight-medium text-none" @click="confirmLogoutDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" class="px-4 font-weight-bold text-none" @click="executeLogout">
            <v-icon icon="mdi-logout" start size="small" />
            Cerrar Sesión
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE ADVERTENCIA DE CIERRE POR INACTIVIDAD (SESSION TIMEOUT) -->
    <v-dialog v-model="idleWarningDialog" max-width="440" persistent>
      <v-card class="rounded-xl overflow-hidden text-center pa-4">
        <div class="d-flex justify-center my-2">
          <v-avatar color="amber-lighten-4" size="64" class="elevation-2">
            <v-icon icon="mdi-timer-sand" color="amber-darken-3" size="36" class="animate-pulse" />
          </v-avatar>
        </div>

        <v-card-title class="text-h6 font-weight-black justify-center pb-1">
          ¿Seguís en la terminal?
        </v-card-title>

        <v-card-text class="pt-1">
          <p class="text-body-2 text-grey-darken-2 mb-2">
            Por seguridad de la caja, tu sesión se cerrará automáticamente en:
          </p>

          <div class="d-flex align-center justify-center my-3">
            <div class="text-h4 font-weight-black text-amber-darken-4 font-mono px-5 py-2 bg-amber-lighten-5 rounded-lg border border-amber-lighten-3 elevation-1">
              {{ idleCountdownSeconds }}s
            </div>
          </div>

          <div class="text-caption text-grey-darken-1">
            <v-icon icon="mdi-shield-check-outline" size="14" class="mr-1 text-success" />
            Tus borradores de venta o presupuestos quedan guardados de forma segura.
          </div>
        </v-card-text>

        <v-divider class="my-2" />

        <v-card-actions class="justify-center gap-2 pt-2">
          <v-btn
            color="grey-darken-1"
            variant="text"
            class="text-none font-weight-bold"
            @click="handleAutoLogout"
          >
            Cerrar Ahora
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            class="px-5 font-weight-bold text-none shadow-sm"
            @click="keepSessionAlive"
          >
            <v-icon icon="mdi-play-circle" start />
            Continuar Trabajando
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR DE NOTIFICACIONES GLOBALES -->
    <v-snackbar
      v-model="appSnackbar.show"
      :color="appSnackbar.color"
      :timeout="appSnackbar.timeout"
      location="top right"
      elevation="4"
    >
      <div class="d-flex align-center">
        <v-icon :icon="appSnackbar.icon" class="mr-2" />
        <span class="font-weight-medium">{{ appSnackbar.text }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" icon="mdi-close" size="small" @click="appSnackbar.show = false" />
      </template>
    </v-snackbar>

    <!-- CONTENIDO PRINCIPAL -->
    <v-main class="bg-background">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useSyncModeStore } from '@/stores/syncModeStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useModuleStore } from '@/stores/moduleStore';
import { isSupabaseConfigured, supabaseHost, isProductionBackend, environmentLabel } from '@/services/supabase';
import { syncState, initSyncManager } from '@/services/syncQueue';

const route = useRoute();
const router = useRouter();

const drawer = ref(true);
const syncDialog = ref(false);
const businessDialog = ref(false);
const confirmLogoutDialog = ref(false);
const moduleDialog = ref(false);
const syncResult = ref(null);

// Control de Cierre de Sesión por Inactividad (Session Timeout)
const idleWarningDialog = ref(false);
const idleCountdownSeconds = ref(30);
let idleTimerInterval = null;
let lastActivityTime = Date.now();
let lastThrottleTime = 0;
const IDLE_WARNING_BUFFER_SEC = 30;

const productStore = useProductStore();
const cartStore = useCartStore();
const authStore = useAuthStore();
const syncModeStore = useSyncModeStore();
const businessStore = useBusinessStore();
const moduleStore = useModuleStore();

const businessForm = ref({
  nombre: '',
  razonSocial: '',
  cuit: '',
  iibb: '',
  condicionIva: 'RESPONSABLE_INSCRIPTO',
  direccion: '',
  telefono: '',
  email: '',
  puntoVenta: 1,
  tipoImpresora: '80mm',
  sessionTimeoutMinutes: 15,
  pieTicket: 'Comprobante no válido como factura fiscal',
  mensajeAgradecimiento: '¡Gracias por su compra!'
});

const appSnackbar = ref({
  show: false,
  text: '',
  color: 'success',
  icon: 'mdi-check-circle',
  timeout: 4000
});

function triggerAppSnackbar(text, color = 'success', icon = 'mdi-check-circle', timeout = 4000) {
  appSnackbar.value = {
    show: true,
    text,
    color,
    icon,
    timeout
  };
}

function openBusinessDialog() {
  businessForm.value = {
    ...businessStore.comercio,
    sessionTimeoutMinutes: authStore.sessionTimeoutMinutes ?? 15
  };
  businessDialog.value = true;
}

async function saveBusinessConfig() {
  if (businessForm.value.sessionTimeoutMinutes !== undefined) {
    await authStore.setSessionTimeout(businessForm.value.sessionTimeoutMinutes);
  }
  const result = await businessStore.updateBusiness(businessForm.value);
  businessDialog.value = false;

  if (result.success) {
    if (result.cloudSynced) {
      triggerAppSnackbar('✅ Configuración comercial guardada y sincronizada en Supabase.', 'success', 'mdi-cloud-check');
    } else {
      triggerAppSnackbar('💾 Configuración comercial guardada en la terminal.', 'indigo-darken-2', 'mdi-content-save-check');
    }
  } else {
    triggerAppSnackbar('❌ Error al guardar la configuración: ' + (result.error || 'Desconocido'), 'error', 'mdi-alert-circle');
  }
}

onMounted(async () => {
  await authStore.initAuth();
  await moduleStore.init();
  await syncModeStore.initSyncMode();
  await businessStore.initBusiness();
  await productStore.fetchProducts();
  await initSyncManager((sale, result) => {
    console.log('[NegoStock] Venta sincronizada:', sale.voucherNumber);
    syncModeStore.refreshPendingCounts();
  });
});

function openSyncDialog() {
  syncResult.value = null;
  syncDialog.value = true;
  syncModeStore.refreshPendingCounts();
}

async function handleManualSyncAll() {
  syncResult.value = await syncModeStore.syncAllNow();
  if (syncResult.value?.success) {
    await productStore.fetchProducts();
  }
}

async function executeLogout() {
  confirmLogoutDialog.value = false;
  await handleLogout();
}

async function handleLogout() {
  stopIdleTracker();
  await authStore.logout();
  router.push('/login');
}

// ========================================================
// RASTREADOR DE INACTIVIDAD (SESSION IDLE TIMEOUT)
// ========================================================
function handleUserActivityThrottled() {
  const now = Date.now();
  if (now - lastThrottleTime > 1000) {
    lastThrottleTime = now;
    lastActivityTime = now;
    if (idleWarningDialog.value) {
      keepSessionAlive();
    }
  }
}

function keepSessionAlive() {
  lastActivityTime = Date.now();
  idleWarningDialog.value = false;
  idleCountdownSeconds.value = IDLE_WARNING_BUFFER_SEC;
}

async function handleAutoLogout() {
  idleWarningDialog.value = false;
  stopIdleTracker();
  await authStore.logout();
  router.push({ path: '/login', query: { reason: 'timeout' } });
}

function checkIdleStatus() {
  if (!authStore.isAuthenticated || route.name === 'login') return;
  const timeoutMinutes = authStore.sessionTimeoutMinutes;
  if (!timeoutMinutes || timeoutMinutes <= 0) return; // 0 = Desactivado por el administrador

  const totalTimeoutMs = timeoutMinutes * 60 * 1000;
  const elapsedMs = Date.now() - lastActivityTime;
  const remainingMs = totalTimeoutMs - elapsedMs;

  if (remainingMs <= 0) {
    handleAutoLogout();
  } else if (remainingMs <= IDLE_WARNING_BUFFER_SEC * 1000) {
    idleCountdownSeconds.value = Math.max(1, Math.ceil(remainingMs / 1000));
    if (!idleWarningDialog.value) {
      idleWarningDialog.value = true;
    }
  } else {
    if (idleWarningDialog.value) {
      idleWarningDialog.value = false;
    }
  }
}

const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

function startIdleTracker() {
  stopIdleTracker();
  lastActivityTime = Date.now();
  activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivityThrottled, { passive: true }));
  idleTimerInterval = setInterval(checkIdleStatus, 1000);
}

function stopIdleTracker() {
  if (idleTimerInterval) {
    clearInterval(idleTimerInterval);
    idleTimerInterval = null;
  }
  activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivityThrottled));
}

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && route.name !== 'login') {
    startIdleTracker();
  } else {
    stopIdleTracker();
  }
}, { immediate: true });

watch(() => route.name, (routeName) => {
  if (routeName === 'login') {
    stopIdleTracker();
  } else if (authStore.isAuthenticated) {
    startIdleTracker();
  }
});

onUnmounted(() => {
  stopIdleTracker();
});

function getRoleColor(role) {
  const map = {
    SUPERADMIN: 'deep-purple-accent-4',
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

/* Normalización de inputs numéricos: elimina spinners nativos que deforman el diseño */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
  margin: 0 !important;
}
input[type=number] {
  -moz-appearance: textfield !important;
}
</style>
