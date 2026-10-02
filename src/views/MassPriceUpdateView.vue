<template>
  <v-container fluid class="pa-4">
    <!-- CABECERA -->
    <v-card elevation="2" class="mb-4">
      <v-card-item class="bg-primary text-white py-3">
        <div class="d-flex align-center">
          <v-icon icon="mdi-percent-box-outline" size="32" class="mr-3 text-secondary" />
          <div>
            <div class="text-h6 font-weight-black">Actualizador Masivo de Precios (Inflación / Proveedores)</div>
            <div class="text-caption text-grey-lighten-2">
              Ajustá listas de precios completas por Rubro o Marca en segundos con redondeo inteligente.
            </div>
          </div>
        </div>
      </v-card-item>

      <v-divider />

      <!-- FORMULARIO DE FILTROS Y PARÁMETROS -->
      <v-card-text class="pa-4">
        <v-row>
          <!-- Filtro por Rubro -->
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="selectedCategory"
              :items="productStore.categories"
              label="1. Rubro / Departamento"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-tag-outline"
            />
          </v-col>

          <!-- Filtro por Marca -->
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="selectedBrand"
              :items="productStore.brands"
              label="2. Marca / Proveedor"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-domain"
            />
          </v-col>

          <!-- Porcentaje de Aumento -->
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model.number="percentage"
              label="3. Porcentaje de Ajuste (%)"
              type="number"
              step="0.5"
              variant="outlined"
              density="comfortable"
              suffix="%"
              prepend-inner-icon="mdi-trending-up"
            />
            <!-- Botones de incremento rápido -->
            <div class="d-flex gap-1 mt-1">
              <v-btn
                v-for="p in [5, 8, 10, 15, 20]"
                :key="p"
                size="x-small"
                variant="tonal"
                color="primary"
                class="px-2"
                @click="percentage = p"
              >
                +{{ p }}%
              </v-btn>
            </div>
          </v-col>

          <!-- Redondeo Inteligente -->
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="rounding"
              :items="roundingOptions"
              item-title="title"
              item-value="value"
              label="4. Redondeo en Efectivo"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-cash-multiple"
            />
          </v-col>
        </v-row>

        <v-divider class="my-3" />

        <!-- Destino del aumento -->
        <v-row align="center">
          <v-col cols="12" md="8">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">APLICAR EL AJUSTE SOBRE:</div>
            <v-radio-group v-model="target" inline hide-details density="compact">
              <v-radio
                label="Precio de Venta (Minorista y Mayoreo)"
                value="selling"
                color="primary"
              />
              <v-radio
                label="Costo y recalcular Venta manteniendo margen"
                value="cost_and_selling"
                color="primary"
              />
              <v-radio
                label="Solo Precio de Costo"
                value="cost_only"
                color="primary"
              />
            </v-radio-group>
          </v-col>

          <v-col cols="12" md="4" class="text-right">
            <v-btn
              color="accent"
              size="large"
              variant="flat"
              class="font-weight-black px-6"
              :disabled="matchingProducts.length === 0 || percentage === 0"
              @click="confirmDialog = true"
            >
              <v-icon icon="mdi-check-all" class="mr-2" />
              Aplicar a {{ matchingProducts.length }} Artículos
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- VISTA PREVIA EN VIVO -->
    <v-card elevation="2">
      <v-card-title class="pa-4 d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <v-icon icon="mdi-eye-outline" class="mr-2 text-primary" />
          <span class="text-h6 font-weight-bold">
            Vista Previa de Cambios ({{ matchingProducts.length }} productos alcanzados)
          </span>
        </div>
        <v-chip color="info" variant="tonal" class="font-weight-bold">
          Aumento configurado: {{ percentage > 0 ? '+' : '' }}{{ percentage }}%
        </v-chip>
      </v-card-title>

      <v-divider />

      <v-table density="comfortable" hover>
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-bold">SKU</th>
            <th class="font-weight-bold">Descripción</th>
            <th class="font-weight-bold">Rubro</th>
            <th class="font-weight-bold">Marca</th>
            <th class="font-weight-bold text-right">P. Venta Actual</th>
            <th class="font-weight-bold text-center"><v-icon icon="mdi-arrow-right" /></th>
            <th class="font-weight-bold text-right text-primary">P. Venta Nuevo</th>
            <th class="font-weight-bold text-right text-success">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prod in previewList" :key="prod.id">
            <td>
              <v-chip size="x-small" color="primary" variant="tonal">{{ prod.sku }}</v-chip>
            </td>
            <td class="font-weight-medium">{{ prod.name }}</td>
            <td><v-chip size="x-small" variant="outlined">{{ prod.dept }}</v-chip></td>
            <td class="text-caption">{{ prod.brand }}</td>
            <td class="text-right text-grey font-weight-medium">${{ formatMoney(prod.sellingPrice) }}</td>
            <td class="text-center text-grey"><v-icon icon="mdi-arrow-right" size="small" /></td>
            <td class="text-right font-weight-black text-primary">${{ formatMoney(calcNewPrice(prod)) }}</td>
            <td class="text-right font-weight-bold text-success">
              +${{ formatMoney(calcNewPrice(prod) - prod.sellingPrice) }}
            </td>
          </tr>

          <tr v-if="matchingProducts.length === 0">
            <td colspan="8" class="text-center py-8 text-grey">
              No hay productos que coincidan con los filtros seleccionados
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- MODAL DE CONFIRMACIÓN -->
    <v-dialog v-model="confirmDialog" max-width="480">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon icon="mdi-alert-circle-outline" class="mr-2" />
          Confirmar Actualización de Precios
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-body-1 font-weight-medium mb-3">
            Estás a punto de modificar los precios de <strong>{{ matchingProducts.length }} productos</strong>.
          </div>
          <v-list density="compact" class="bg-grey-lighten-4 rounded mb-3">
            <v-list-item title="Ajuste:" :subtitle="`${percentage > 0 ? '+' : ''}${percentage}%`" />
            <v-list-item title="Rubro:" :subtitle="selectedCategory" />
            <v-list-item title="Marca:" :subtitle="selectedBrand" />
            <v-list-item title="Criterio:" :subtitle="targetLabel" />
          </v-list>
          <div class="text-caption text-error font-weight-bold">
            Esta acción actualizará el catálogo y las listas de venta inmediatamente.
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="confirmDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="px-5 font-weight-bold" @click="executeMassUpdate">
            Confirmar y Aplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR DE ÉXITO -->
    <v-snackbar v-model="snackbar" color="success" timeout="3500">
      <v-icon icon="mdi-check-circle" class="mr-2" />
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

const selectedCategory = ref('TODOS');
const selectedBrand = ref('TODAS');
const percentage = ref(10);
const target = ref('selling');
const rounding = ref(10);

const confirmDialog = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');

const roundingOptions = [
  { title: 'Sin redondeo (centavos)', value: 0 },
  { title: 'Múltiplos de $10', value: 10 },
  { title: 'Múltiplos de $50', value: 50 },
  { title: 'Múltiplos de $100', value: 100 }
];

const targetLabel = computed(() => {
  if (target.value === 'selling') return 'Precio de Venta';
  if (target.value === 'cost_and_selling') return 'Costo y Venta con margen';
  return 'Solo Costo';
});

const matchingProducts = computed(() => {
  return productStore.products.filter(p => {
    const matchCat = !selectedCategory.value || selectedCategory.value === 'TODOS' || p.dept === selectedCategory.value;
    const matchBrand = !selectedBrand.value || selectedBrand.value === 'TODAS' || p.brand === selectedBrand.value;
    return matchCat && matchBrand;
  });
});

const previewList = computed(() => {
  return matchingProducts.value.slice(0, 30);
});

function calcNewPrice(prod) {
  const factor = 1 + (percentage.value / 100);
  let val = prod.sellingPrice * factor;

  if (target.value === 'cost_and_selling') {
    const newCost = prod.costPrice * factor;
    const margin = prod.costPrice > 0 ? (prod.sellingPrice / prod.costPrice) : 2;
    val = newCost * margin;
  }

  if (rounding.value > 0) {
    return Math.ceil(val / rounding.value) * rounding.value;
  }
  return Math.round(val * 100) / 100;
}

async function executeMassUpdate() {
  const result = await productStore.applyMassPriceUpdate({
    category: selectedCategory.value,
    brand: selectedBrand.value,
    percentage: percentage.value,
    target: target.value,
    rounding: rounding.value
  });

  confirmDialog.value = false;
  snackbarText.value = `¡Se actualizaron con éxito los precios de ${result.updatedCount} artículos!`;
  snackbar.value = true;
}

function formatMoney(val) {
  return Number(val || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
</script>
