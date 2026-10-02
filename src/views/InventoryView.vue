<template>
  <v-container fluid class="pa-4">
    <!-- METRICAS DE CABECERA -->
    <v-row class="mb-2">
      <v-col cols="12" sm="6" :md="authStore.canViewCosts ? 3 : 4">
        <v-card elevation="2" class="pa-3">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey font-weight-bold">PRODUCTOS REGISTRADOS</div>
              <div class="text-h5 font-weight-black text-primary">{{ productStore.products.length }}</div>
            </div>
            <v-avatar color="primary" variant="tonal" size="44">
              <v-icon icon="mdi-tools" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" :md="authStore.canViewCosts ? 3 : 4">
        <v-card elevation="2" class="pa-3" :class="{ 'bg-red-lighten-5': productStore.lowStockCount > 0 }">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey font-weight-bold">STOCK CRÍTICO / MÍNIMO</div>
              <div class="text-h5 font-weight-black text-error">{{ productStore.lowStockCount }}</div>
            </div>
            <v-avatar color="error" variant="tonal" size="44">
              <v-icon icon="mdi-alert" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <!-- Solo visible si tiene permiso para ver costos (Admin / Encargado) -->
      <v-col v-if="authStore.canViewCosts" cols="12" sm="6" md="3">
        <v-card elevation="2" class="pa-3">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey font-weight-bold">VALUACIÓN AL COSTO</div>
              <div class="text-h6 font-weight-black text-grey-darken-3">
                ${{ formatMoney(productStore.totalInventoryValue) }}
              </div>
            </div>
            <v-avatar color="secondary" variant="tonal" size="44">
              <v-icon icon="mdi-currency-usd" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" :md="authStore.canViewCosts ? 3 : 4">
        <v-card elevation="2" class="pa-3">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey font-weight-bold">VALUACIÓN A LA VENTA</div>
              <div class="text-h6 font-weight-black text-success">
                ${{ formatMoney(productStore.totalSalesValue) }}
              </div>
            </div>
            <v-avatar color="success" variant="tonal" size="44">
              <v-icon icon="mdi-cash-register" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- TABLA DE CONTROL DE INVENTARIO -->
    <v-card elevation="2">
      <v-card-title class="pa-4 d-flex flex-wrap align-center justify-space-between gap-3">
        <div class="d-flex align-center">
          <v-icon icon="mdi-clipboard-list-outline" class="mr-2 text-primary" />
          <span class="text-h6 font-weight-bold">Control de Stock e Inventario</span>
        </div>

        <div class="d-flex flex-wrap align-center gap-2">
          <v-switch
            v-model="productStore.filterOnlyLowStock"
            label="Sólo Stock Bajo"
            color="error"
            density="compact"
            hide-details
            class="mr-4"
          />
          <v-text-field
            v-model="productStore.searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar por código, nombre o marca..."
            density="compact"
            variant="outlined"
            style="width: 280px;"
            clearable
            hide-details
          />
          <v-select
            v-model="productStore.selectedCategory"
            :items="productStore.categories"
            density="compact"
            variant="outlined"
            style="width: 180px;"
            hide-details
          />
        </div>
      </v-card-title>

      <v-divider />

      <v-table density="comfortable" hover>
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-bold">Cód (SKU)</th>
            <th class="font-weight-bold">Descripción</th>
            <th class="font-weight-bold">Rubro</th>
            <th class="font-weight-bold">Marca</th>
            <th v-if="authStore.canViewCosts" class="font-weight-bold text-right">P. Costo</th>
            <th class="font-weight-bold text-right">P. Venta</th>
            <th class="font-weight-bold text-right">P. Mayoreo</th>
            <th class="font-weight-bold text-center">Stock Actual</th>
            <th class="font-weight-bold text-center">Mínimo</th>
            <th v-if="authStore.canAdjustStock" class="font-weight-bold text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="prod in paginatedTable"
            :key="prod.id"
            :class="{ 'bg-red-lighten-5': prod.stock <= prod.minStock }"
          >
            <td>
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                {{ prod.sku }}
              </v-chip>
            </td>
            <td class="font-weight-medium">
              {{ prod.name }}
            </td>
            <td>
              <v-chip size="x-small" variant="outlined">{{ prod.dept }}</v-chip>
            </td>
            <td>
              <span class="text-caption text-grey-darken-2">{{ prod.brand }}</span>
            </td>
            <!-- Columna de Costo Ocultable -->
            <td v-if="authStore.canViewCosts" class="text-right text-caption font-weight-medium">
              ${{ formatMoney(prod.costPrice) }}
            </td>
            <td class="text-right font-weight-bold text-primary">
              ${{ formatMoney(prod.sellingPrice) }}
            </td>
            <td class="text-right text-caption">
              {{ prod.wholesalePrice > 0 ? '$' + formatMoney(prod.wholesalePrice) : '-' }}
            </td>
            <td class="text-center">
              <v-chip
                size="small"
                :color="prod.stock <= prod.minStock ? 'error' : 'success'"
                variant="flat"
                class="font-weight-bold"
              >
                {{ prod.stock }} {{ prod.unit }}
              </v-chip>
            </td>
            <td class="text-center text-caption text-grey">
              {{ prod.minStock }}
            </td>
            <td v-if="authStore.canAdjustStock" class="text-center">
              <v-btn
                icon="mdi-pencil-outline"
                size="x-small"
                variant="tonal"
                color="primary"
                title="Ajustar Stock"
                @click="openAdjustDialog(prod)"
              />
            </td>
          </tr>

          <tr v-if="productStore.filteredProducts.length === 0">
            <td colspan="10" class="text-center py-6 text-grey">
              No se encontraron artículos con los criterios seleccionados
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Paginación -->
      <v-card-actions class="d-flex justify-space-between align-center pa-4 border-t">
        <div class="text-caption text-grey">
          Mostrando {{ (page - 1) * perPage + 1 }} a {{ Math.min(page * perPage, productStore.filteredProducts.length) }} de {{ productStore.filteredProducts.length }} productos
        </div>
        <v-pagination
          v-model="page"
          :length="Math.ceil(productStore.filteredProducts.length / perPage)"
          density="compact"
          total-visible="5"
        />
      </v-card-actions>
    </v-card>

    <!-- DIÁLOGO DE AJUSTE RÁPIDO DE STOCK -->
    <v-dialog v-model="adjustDialog" max-width="450">
      <v-card v-if="selectedProd">
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon icon="mdi-package-variant-plus" class="mr-2" />
          Ajuste de Stock
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-1">{{ selectedProd.name }}</div>
          <div class="text-caption text-grey mb-4">Código SKU: #{{ selectedProd.sku }}</div>

          <v-text-field
            v-model.number="newStockVal"
            label="Nuevo Stock Físico"
            type="number"
            step="any"
            variant="outlined"
            density="comfortable"
            :suffix="selectedProd.unit"
            autofocus
          />

          <v-select
            v-model="movementReason"
            :items="reasons"
            label="Motivo del Ajuste"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="adjustDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="px-4" @click="saveStockAdjustment">
            Guardar Ajuste
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore';

const productStore = useProductStore();
const authStore = useAuthStore();

const page = ref(1);
const perPage = ref(20);

const adjustDialog = ref(false);
const selectedProd = ref(null);
const newStockVal = ref(0);
const movementReason = ref('CONTEO_FISICO');

const reasons = [
  { title: 'Conteo Físico / Inventario', value: 'CONTEO_FISICO' },
  { title: 'Ingreso por Compra', value: 'COMPRA' },
  { title: 'Merma / Rotura', value: 'ROTURA' },
  { title: 'Devolución de Cliente', value: 'DEVOLUCION' }
];

const paginatedTable = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return productStore.filteredProducts.slice(start, start + perPage.value);
});

function openAdjustDialog(prod) {
  selectedProd.value = prod;
  newStockVal.value = prod.stock;
  adjustDialog.value = true;
}

function saveStockAdjustment() {
  if (selectedProd.value) {
    productStore.updateStock(selectedProd.value.id, newStockVal.value, movementReason.value);
    adjustDialog.value = false;
  }
}

function formatMoney(val) {
  return Number(val || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
</script>
