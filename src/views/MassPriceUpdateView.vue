<template>
  <v-container fluid class="pa-4">
    <!-- CABECERA -->
    <v-card elevation="2" class="mb-4">
      <v-card-item class="bg-primary text-white py-3">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div class="d-flex align-center">
            <v-icon icon="mdi-tag-multiple-outline" size="32" class="mr-3 text-secondary" />
            <div>
              <div class="text-h6 font-weight-black">Gestión Integral de Precios e Inflación</div>
              <div class="text-caption text-grey-lighten-2">
                Ajustá por porcentaje, trabajá con planillas Excel offline o auditá el historial de cambios.
              </div>
            </div>
          </div>

          <!-- Pestañas de navegación -->
          <v-tabs v-model="activeTab" color="secondary" density="comfortable" class="mt-2 mt-md-0">
            <v-tab value="percentage">
              <v-icon icon="mdi-percent" class="mr-1" />
              Aumento por %
            </v-tab>
            <v-tab value="excel">
              <v-icon icon="mdi-file-excel-outline" class="mr-1" />
              Importar / Exportar Excel
            </v-tab>
            <v-tab value="history">
              <v-icon icon="mdi-history" class="mr-1" />
              Historial y Auditoría ({{ priceHistoryStore.totalChangesCount }})
            </v-tab>
          </v-tabs>
        </div>
      </v-card-item>
    </v-card>

    <v-window v-model="activeTab">
      <!-- ==================================================================== -->
      <!-- PESTAÑA 1: AUMENTO PORCENTUAL (INFLACIÓN)                           -->
      <!-- ==================================================================== -->
      <v-window-item value="percentage">
        <v-card elevation="2" class="mb-4">
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
                  <v-radio label="Precio de Venta" value="selling" color="primary" />
                  <v-radio label="Costo y recalcular Venta con margen" value="cost_and_selling" color="primary" />
                  <v-radio label="Solo Precio de Costo" value="cost_only" color="primary" />
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
            <span class="text-h6 font-weight-bold">
              Vista Previa ({{ matchingProducts.length }} productos alcanzados)
            </span>
            <v-chip color="info" variant="tonal" class="font-weight-bold">
              Ajuste: {{ percentage > 0 ? '+' : '' }}{{ percentage }}%
            </v-chip>
          </v-card-title>
          <v-divider />

          <div class="responsive-table-wrapper">
            <v-table density="compact" hover class="compact-update-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="font-weight-bold">SKU</th>
                  <th class="font-weight-bold">Descripción</th>
                  <th class="font-weight-bold text-right">P. Venta Actual</th>
                  <th class="font-weight-bold text-center"><v-icon icon="mdi-arrow-right" /></th>
                  <th class="font-weight-bold text-right text-primary">P. Venta Nuevo</th>
                  <th class="font-weight-bold text-right text-success">Variación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prod in previewList" :key="prod.id">
                  <td><v-chip size="x-small" color="primary" variant="tonal" class="font-mono text-2xs">{{ prod.sku }}</v-chip></td>
                  <td class="font-weight-medium">
                    <div class="text-truncate" style="max-width: 260px;" :title="prod.name">{{ prod.name }}</div>
                  </td>
                  <td class="text-right text-grey font-weight-medium font-mono text-caption">${{ formatMoney(prod.sellingPrice) }}</td>
                  <td class="text-center text-grey"><v-icon icon="mdi-arrow-right" size="x-small" /></td>
                  <td class="text-right font-weight-black text-primary font-mono text-caption">${{ formatMoney(calcNewPrice(prod)) }}</td>
                  <td class="text-right font-weight-bold text-success font-mono text-caption">
                    +${{ formatMoney(calcNewPrice(prod) - prod.sellingPrice) }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card>
      </v-window-item>

      <!-- ==================================================================== -->
      <!-- PESTAÑA 2: IMPORTAR Y EXPORTAR PLANILLAS EXCEL                        -->
      <!-- ==================================================================== -->
      <v-window-item value="excel">
        <v-row class="mb-4">
          <!-- 1. EXPORTAR PLANILLA -->
          <v-col cols="12" md="5">
            <v-card elevation="2" class="h-100 pa-4 d-flex flex-column justify-space-between">
              <div>
                <div class="d-flex align-center mb-2">
                  <v-avatar color="success" variant="tonal" size="40" class="mr-3">
                    <v-icon icon="mdi-file-download-outline" color="success" />
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-black">1. Descargar Planilla de Precios</div>
                    <div class="text-caption text-grey">
                      Descargá el catálogo actual de la ferretería para modificar costos y precios en tu computadora.
                    </div>
                  </div>
                </div>

                <v-alert type="info" variant="tonal" density="compact" class="my-3 text-caption">
                  La planilla descargada incluye el <strong>Código SKU</strong>. No modifiques esa columna para que el sistema reconozca cada producto al volver a subirla.
                </v-alert>
              </div>

              <div class="d-flex gap-2 pt-3">
                <v-btn
                  color="success"
                  variant="flat"
                  class="font-weight-bold flex-grow-1"
                  prepend-icon="mdi-microsoft-excel"
                  @click="downloadExcel('xlsx')"
                >
                  Descargar Excel (.xlsx)
                </v-btn>
                <v-btn
                  color="grey-darken-2"
                  variant="outlined"
                  class="font-weight-bold"
                  prepend-icon="mdi-file-delimited-outline"
                  @click="downloadExcel('csv')"
                >
                  CSV
                </v-btn>
              </div>
            </v-card>
          </v-col>

          <!-- 2. IMPORTAR PLANILLA MODIFICADA -->
          <v-col cols="12" md="7">
            <v-card elevation="2" class="h-100 pa-4">
              <div class="d-flex align-center mb-2">
                <v-avatar color="primary" variant="tonal" size="40" class="mr-3">
                  <v-icon icon="mdi-file-upload-outline" color="primary" />
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-black">2. Cargar Planilla Modificada</div>
                  <div class="text-caption text-grey">
                    Subí tu archivo Excel (.xlsx, .xls o .csv) para actualizar los precios masivamente.
                  </div>
                </div>
              </div>

              <!-- Selector de archivo -->
              <v-file-input
                v-model="excelFile"
                accept=".xlsx, .xls, .csv"
                label="Seleccionar o arrastrar archivo Excel..."
                variant="outlined"
                density="comfortable"
                prepend-icon="mdi-paperclip"
                show-size
                clearable
                class="mt-3"
                @update:model-value="handleFileSelect"
              />

              <div v-if="parsedChanges.length > 0" class="d-flex justify-space-between align-center mt-2">
                <span class="text-body-2 font-weight-bold text-success">
                  <v-icon icon="mdi-check-circle" color="success" size="small" />
                  {{ parsedChanges.length }} productos con cambios detectados
                </span>
                <v-btn
                  color="primary"
                  variant="flat"
                  class="font-weight-black px-6"
                  @click="applyExcelChanges"
                >
                  Aplicar Cambios al Sistema
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- TABLA COMPARATIVA DE CAMBIOS DETECTADOS EN EL EXCEL -->
        <v-card v-if="parsedChanges.length > 0" elevation="2">
          <v-card-title class="pa-4 bg-grey-lighten-4 d-flex justify-space-between align-center">
            <span class="text-subtitle-1 font-weight-bold">
              Vista Previa de Precios Modificados en el Archivo Excel
            </span>
            <v-chip color="primary" variant="flat" size="small">
              {{ parsedChanges.length }} Artículos a Actualizar
            </v-chip>
          </v-card-title>
          <v-divider />

          <div class="responsive-table-wrapper">
            <v-table density="compact" hover class="compact-update-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="font-weight-bold">SKU</th>
                  <th class="font-weight-bold">Descripción</th>
                  <th class="font-weight-bold text-right">Costo Actual</th>
                  <th class="font-weight-bold text-right text-info">Costo Nuevo</th>
                  <th class="font-weight-bold text-right">Venta Actual</th>
                  <th class="font-weight-bold text-right text-primary">Venta Nueva</th>
                  <th class="font-weight-bold text-right text-success">Variación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ch in parsedChanges" :key="ch.sku">
                  <td><v-chip size="x-small" color="primary" variant="tonal" class="font-mono text-2xs">{{ ch.sku }}</v-chip></td>
                  <td class="font-weight-medium">
                    <div class="text-truncate" style="max-width: 240px;" :title="ch.name">{{ ch.name }}</div>
                  </td>
                  <td class="text-right text-grey font-weight-medium font-mono text-caption">${{ formatMoney(ch.oldCost) }}</td>
                  <td class="text-right text-info font-weight-bold font-mono text-caption">${{ formatMoney(ch.newCost) }}</td>
                  <td class="text-right text-grey font-weight-medium font-mono text-caption">${{ formatMoney(ch.oldSelling) }}</td>
                  <td class="text-right text-primary font-weight-black font-mono text-caption">${{ formatMoney(ch.newSelling) }}</td>
                  <td class="text-right font-weight-bold font-mono text-caption" :class="ch.newSelling >= ch.oldSelling ? 'text-success' : 'text-error'">
                    {{ ch.newSelling >= ch.oldSelling ? '+' : '' }}${{ formatMoney(ch.newSelling - ch.oldSelling) }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card>
      </v-window-item>

      <!-- ==================================================================== -->
      <!-- PESTAÑA 3: HISTORIAL Y AUDITORÍA DE PRECIOS                          -->
      <!-- ==================================================================== -->
      <v-window-item value="history">
        <v-card elevation="2">
          <v-card-title class="pa-4 d-flex justify-space-between align-center flex-wrap gap-2">
            <div class="d-flex align-center">
              <v-icon icon="mdi-history" class="mr-2 text-primary" />
              <span class="text-h6 font-weight-bold">Historial de Variación de Precios</span>
            </div>
            <v-text-field
              v-model="historySearch"
              prepend-inner-icon="mdi-magnify"
              placeholder="Buscar por código o producto..."
              variant="outlined"
              density="compact"
              style="width: 280px;"
              hide-details
              clearable
            />
          </v-card-title>
          <v-divider />

          <div class="responsive-table-wrapper">
            <v-table density="compact" hover class="compact-update-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="font-weight-bold">Fecha / Hora</th>
                  <th class="font-weight-bold">SKU</th>
                  <th class="font-weight-bold">Producto</th>
                  <th class="font-weight-bold text-right">Costo Viejo $\rightarrow$ Nuevo</th>
                  <th class="font-weight-bold text-right">Venta Vieja $\rightarrow$ Nueva</th>
                  <th class="font-weight-bold">Origen / Motivo</th>
                  <th class="font-weight-bold">Responsable</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in filteredHistory" :key="h.id">
                  <td class="text-caption font-mono text-grey-darken-2" style="font-size: 11px;">{{ formatDateTime(h.createdAt) }}</td>
                  <td><v-chip size="x-small" color="primary" variant="tonal" class="font-mono text-2xs">{{ h.sku }}</v-chip></td>
                  <td class="font-weight-medium">
                    <div class="text-truncate" style="max-width: 200px;" :title="h.name">{{ h.name }}</div>
                  </td>
                  <td class="text-right text-caption font-mono">
                    ${{ formatMoney(h.oldCost) }} $\rightarrow$ <strong>${{ formatMoney(h.newCost) }}</strong>
                  </td>
                  <td class="text-right text-caption font-weight-bold font-mono text-primary">
                    ${{ formatMoney(h.oldSelling) }} $\rightarrow$ <strong class="text-success">${{ formatMoney(h.newSelling) }}</strong>
                  </td>
                  <td>
                    <v-chip size="x-small" :color="getReasonColor(h.reason)" variant="flat" class="text-2xs">
                      {{ formatReason(h.reason) }}
                    </v-chip>
                  </td>
                  <td class="text-caption text-grey-darken-2">{{ h.userName }}</td>
                </tr>

                <tr v-if="filteredHistory.length === 0">
                  <td colspan="7" class="text-center py-6 text-grey">
                    No se encontraron registros de cambios de precio
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- MODAL DE CONFIRMACIÓN DE AUMENTO PORCENTUAL -->
    <v-dialog v-model="confirmDialog" max-width="480">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon icon="mdi-alert-circle-outline" class="mr-2" />
          Confirmar Actualización
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-body-1 font-weight-medium mb-3">
            Estás a punto de modificar los precios de <strong>{{ matchingProducts.length }} productos</strong>.
          </div>
          <v-list density="compact" class="bg-grey-lighten-4 rounded mb-2">
            <v-list-item title="Ajuste:" :subtitle="`${percentage > 0 ? '+' : ''}${percentage}%`" />
            <v-list-item title="Rubro:" :subtitle="selectedCategory" />
            <v-list-item title="Marca:" :subtitle="selectedBrand" />
          </v-list>
          <div class="text-caption text-error font-weight-bold">
            El cambio se guardará automáticamente en el historial de auditoría.
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="confirmDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="px-5 font-weight-bold" @click="executePercentageUpdate">
            Confirmar y Aplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- NOTIFICACIONES -->
    <v-snackbar v-model="snackbar" color="success" timeout="3500">
      <v-icon icon="mdi-check-circle" class="mr-2" />
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { usePriceHistoryStore } from '@/stores/priceHistoryStore';
import { useAuthStore } from '@/stores/authStore';
import { exportCatalogToExcel, parseUploadedFile } from '@/services/excelService';

const productStore = useProductStore();
const priceHistoryStore = usePriceHistoryStore();
const authStore = useAuthStore();

const activeTab = ref('percentage');

// Pestaña 1: Porcentaje
const selectedCategory = ref('TODOS');
const selectedBrand = ref('TODAS');
const percentage = ref(10);
const target = ref('selling');
const rounding = ref(10);
const confirmDialog = ref(false);

// Pestaña 2: Excel
const excelFile = ref(null);
const parsedChanges = ref([]);

// Pestaña 3: Historial
const historySearch = ref('');

// Notificaciones
const snackbar = ref(false);
const snackbarText = ref('');

const roundingOptions = [
  { title: 'Sin redondeo (centavos)', value: 0 },
  { title: 'Múltiplos de $10', value: 10 },
  { title: 'Múltiplos de $50', value: 50 },
  { title: 'Múltiplos de $100', value: 100 }
];

onMounted(() => {
  priceHistoryStore.initHistory();
});

const matchingProducts = computed(() => {
  return productStore.products.filter(p => {
    const matchCat = !selectedCategory.value || selectedCategory.value === 'TODOS' || p.dept === selectedCategory.value;
    const matchBrand = !selectedBrand.value || selectedBrand.value === 'TODAS' || p.brand === selectedBrand.value;
    return matchCat && matchBrand;
  });
});

const previewList = computed(() => {
  return matchingProducts.value.slice(0, 20);
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

// 1. Aplicar aumento porcentual
async function executePercentageUpdate() {
  const changes = [];

  for (const prod of matchingProducts.value) {
    const oldCost = prod.costPrice;
    const oldSelling = prod.sellingPrice;
    const newSelling = calcNewPrice(prod);
    const newCost = target.value === 'cost_and_selling' || target.value === 'cost_only' 
      ? Math.round(oldCost * (1 + percentage.value / 100)) 
      : oldCost;

    if (oldSelling !== newSelling || oldCost !== newCost) {
      changes.push({
        sku: prod.sku,
        name: prod.name,
        oldCost,
        newCost,
        oldSelling,
        newSelling
      });
    }
  }

  await productStore.applyMassPriceUpdate({
    category: selectedCategory.value,
    brand: selectedBrand.value,
    percentage: percentage.value,
    target: target.value,
    rounding: rounding.value
  });

  // Registrar en historial
  if (changes.length > 0) {
    await priceHistoryStore.logPriceChanges(
      changes,
      'AUMENTO_MASIVO',
      authStore.currentUser?.fullName || 'Administrador'
    );
  }

  confirmDialog.value = false;
  snackbarText.value = `¡Se aplicó el ajuste a ${changes.length} productos y se registró en el historial!`;
  snackbar.value = true;
}

// 2. Exportar catálogo a Excel
function downloadExcel(format = 'xlsx') {
  exportCatalogToExcel(productStore.products, format);
  snackbarText.value = `Descargando catálogo completo de ${productStore.products.length} productos en formato .${format}...`;
  snackbar.value = true;
}

// 2. Procesar archivo Excel subido
async function handleFileSelect(file) {
  if (!file) {
    parsedChanges.value = [];
    return;
  }

  try {
    const rawFile = Array.isArray(file) ? file[0] : file;
    const rows = await parseUploadedFile(rawFile);

    const changes = [];
    for (const row of rows) {
      const existing = productStore.products.find(p => p.sku === row.sku);
      if (existing) {
        const costDiff = row.costPrice > 0 && Math.abs(row.costPrice - existing.costPrice) > 0.01;
        const sellingDiff = row.sellingPrice > 0 && Math.abs(row.sellingPrice - existing.sellingPrice) > 0.01;

        if (costDiff || sellingDiff) {
          changes.push({
            sku: existing.sku,
            name: existing.name,
            oldCost: existing.costPrice,
            newCost: row.costPrice > 0 ? row.costPrice : existing.costPrice,
            oldSelling: existing.sellingPrice,
            newSelling: row.sellingPrice > 0 ? row.sellingPrice : existing.sellingPrice,
            oldWholesale: existing.wholesalePrice,
            newWholesale: row.wholesalePrice > 0 ? row.wholesalePrice : existing.wholesalePrice
          });
        }
      }
    }

    parsedChanges.value = changes;
    if (changes.length === 0) {
      alert('No se detectaron diferencias de precio respecto a la base de datos actual.');
    }
  } catch (err) {
    console.error('Error parseando Excel:', err);
    alert('Error al leer el archivo Excel: verifique el formato.');
  }
}

// Aplicar cambios del Excel a la memoria / DB
async function applyExcelChanges() {
  if (parsedChanges.value.length === 0) return;

  for (const ch of parsedChanges.value) {
    const prod = productStore.products.find(p => p.sku === ch.sku);
    if (prod) {
      prod.costPrice = ch.newCost;
      prod.sellingPrice = ch.newSelling;
      if (ch.newWholesale > 0) prod.wholesalePrice = ch.newWholesale;
    }
  }

  productStore.saveToLocal();

  // Registrar en historial de precios
  await priceHistoryStore.logPriceChanges(
    parsedChanges.value,
    'IMPORTACION_EXCEL',
    authStore.currentUser?.fullName || 'Administrador'
  );

  snackbarText.value = `¡Se actualizaron con éxito ${parsedChanges.value.length} precios desde el archivo Excel!`;
  snackbar.value = true;

  parsedChanges.value = [];
  excelFile.value = null;
}

// 3. Filtrar Historial
const filteredHistory = computed(() => {
  let list = priceHistoryStore.history;
  if (historySearch.value && historySearch.value.trim()) {
    const q = historySearch.value.toLowerCase().trim();
    list = list.filter(h => h.name.toLowerCase().includes(q) || h.sku.toLowerCase().includes(q));
  }
  return list;
});

function getReasonColor(reason) {
  if (reason === 'IMPORTACION_EXCEL') return 'success';
  if (reason === 'AUMENTO_MASIVO') return 'primary';
  return 'secondary';
}

function formatReason(reason) {
  if (reason === 'IMPORTACION_EXCEL') return 'Importación Excel';
  if (reason === 'AUMENTO_MASIVO') return 'Aumento % Masivo';
  if (reason === 'RECEPCION_COMPRA') return 'Factura Compra';
  return 'Manual';
}

function formatMoney(val) {
  return Number(val || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.responsive-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.compact-update-table th,
.compact-update-table td {
  padding: 4px 8px !important;
  height: 36px !important;
  font-size: 12.5px;
}
.text-2xs {
  font-size: 9.5px !important;
  line-height: 12px !important;
}
</style>
