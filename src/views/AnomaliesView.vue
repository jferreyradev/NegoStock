<template>
  <v-container fluid class="pa-2 pa-sm-4">
    <!-- CABECERA PRINCIPAL -->
    <v-card elevation="2" class="mb-4">
      <v-card-item class="bg-amber-lighten-5 py-3">
        <div class="d-flex flex-wrap align-center justify-space-between gap-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-shield-alert-outline" color="warning" size="36" class="mr-3" />
            <div>
              <div class="text-h6 font-weight-bold text-amber-darken-4">
                Auditoría y Validación de Datos (Planilla de Entrada)
              </div>
              <div class="text-body-2 text-grey-darken-2">
                Detección inteligente de inconsistencias entre Precios de Costo y Venta, márgenes negativos y errores tipográficos.
              </div>
            </div>
          </div>

          <div class="d-flex align-center gap-2">
            <v-chip
              :color="anomaliesList.length > 0 ? 'error' : 'success'"
              variant="flat"
              class="font-weight-bold"
            >
              <v-icon :icon="anomaliesList.length > 0 ? 'mdi-alert-circle' : 'mdi-check-circle'" start />
              {{ anomaliesList.length }} {{ anomaliesList.length === 1 ? 'Inconsistencia Detectada' : 'Inconsistencias Detectadas' }}
            </v-chip>

            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-arrow-left"
              to="/inventario"
              class="text-none font-weight-bold ml-2"
            >
              Ir a Inventario
            </v-btn>
          </div>
        </div>
      </v-card-item>

      <v-divider />

      <!-- TARJETAS DE RESUMEN KPI -->
      <v-card-text class="pa-3 pa-sm-4">
        <v-row dense class="mb-3">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="pa-3 bg-red-lighten-5 border-error">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption font-weight-bold text-red-darken-4">MARGEN NEGATIVO (PÉRDIDA)</div>
                  <div class="text-h6 font-weight-black text-red-darken-4">
                    {{ kpiCounts.negativeMargin }}
                  </div>
                  <div class="text-2xs text-grey-darken-2">Costo superior al precio de venta</div>
                </div>
                <v-avatar color="error" variant="flat" size="40">
                  <v-icon icon="mdi-trending-down" color="white" />
                </v-avatar>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="pa-3 bg-amber-lighten-5 border-warning">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption font-weight-bold text-amber-darken-4">MARGEN IRRISORIO (&lt; 10%)</div>
                  <div class="text-h6 font-weight-black text-amber-darken-4">
                    {{ kpiCounts.lowMargin }}
                  </div>
                  <div class="text-2xs text-grey-darken-2">No cubre costos operativos</div>
                </div>
                <v-avatar color="warning" variant="flat" size="40">
                  <v-icon icon="mdi-alert-octagon-outline" color="white" />
                </v-avatar>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="pa-3 bg-blue-lighten-5">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption font-weight-bold text-blue-darken-4">SIN PRECIO DE VENTA</div>
                  <div class="text-h6 font-weight-black text-blue-darken-4">
                    {{ kpiCounts.zeroPrice }}
                  </div>
                  <div class="text-2xs text-grey-darken-2">Precio fijado en $0</div>
                </div>
                <v-avatar color="info" variant="flat" size="40">
                  <v-icon icon="mdi-currency-usd-off" color="white" />
                </v-avatar>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="pa-3 bg-grey-lighten-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption font-weight-bold text-grey-darken-3">TOTAL AUDITADOS</div>
                  <div class="text-h6 font-weight-black text-grey-darken-4">
                    {{ productStore.products.length }}
                  </div>
                  <div class="text-2xs text-grey-darken-2">Artículos en base de datos</div>
                </div>
                <v-avatar color="grey-darken-2" variant="flat" size="40">
                  <v-icon icon="mdi-database-check" color="white" />
                </v-avatar>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- AVISO EDUCATIVO DE FERRETERÍA -->
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3 text-caption"
        >
          <strong>Recomendación del sistema:</strong> En ferreterías es común que los proveedores facturen en rollos o cajas pero en mostrador se venda fraccionado (por metro o unidad), o que existan errores de tipeo al cargar listas. Corregir estos valores asegura que los reportes de ganancia neta sean 100% exactos.
        </v-alert>

        <!-- BARRA DE FILTROS Y BÚSQUEDA -->
        <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-3">
          <div class="d-flex flex-wrap align-center gap-2">
            <v-chip-group v-model="selectedFilter" mandatory selected-class="bg-primary text-white">
              <v-chip value="ALL" size="small" filter>
                Todas ({{ anomaliesList.length }})
              </v-chip>
              <v-chip value="NEGATIVE" size="small" color="error" filter>
                Margen Negativo ({{ kpiCounts.negativeMargin }})
              </v-chip>
              <v-chip value="LOW" size="small" color="warning" filter>
                Margen &lt; 10% ({{ kpiCounts.lowMargin }})
              </v-chip>
              <v-chip value="ZERO_PRICE" size="small" color="info" filter>
                Sin Precio Venta ({{ kpiCounts.zeroPrice }})
              </v-chip>
            </v-chip-group>
          </div>

          <div style="min-width: 250px; max-width: 320px;">
            <v-text-field
              v-model="searchQuery"
              placeholder="Buscar por SKU o descripción..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
          </div>
        </div>

        <!-- TABLA DE ARTÍCULOS AUDITADOS CON ANOMALÍAS -->
        <div v-if="filteredAnomalies.length > 0" class="responsive-table-wrapper">
          <v-table density="compact" hover class="compact-anomalies-table border rounded">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="font-weight-bold" style="width: 90px;">Código SKU</th>
                <th class="font-weight-bold">Descripción Comercial</th>
                <th class="font-weight-bold">Rubro</th>
                <th class="font-weight-bold text-right" style="width: 110px;">Precio Costo</th>
                <th class="font-weight-bold text-right" style="width: 110px;">Precio Venta</th>
                <th class="font-weight-bold text-center" style="width: 95px;">Margen %</th>
                <th class="font-weight-bold" style="min-width: 190px;">Diagnóstico Técnico</th>
                <th class="font-weight-bold text-center" style="min-width: 180px;">Corrección Sugerida</th>
                <th class="font-weight-bold text-center" style="min-width: 140px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredAnomalies"
                :key="item.product.id || item.product.sku"
                :class="getRowClass(item.type)"
              >
                <td>
                  <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">
                    {{ item.product.sku }}
                  </v-chip>
                </td>
                <td>
                  <div class="font-weight-bold text-truncate" style="max-width: 260px;" :title="item.product.name">
                    {{ item.product.name }}
                  </div>
                  <div class="text-2xs text-grey">
                    Stock: {{ item.product.stock }} {{ item.product.unit || 'u' }}
                  </div>
                </td>
                <td>
                  <v-chip size="x-small" variant="outlined" color="blue-grey">
                    {{ item.product.dept || 'GENERAL' }}
                  </v-chip>
                </td>
                <td class="text-right font-weight-bold text-error">
                  ${{ formatMoney(item.product.costPrice) }}
                </td>
                <td class="text-right font-weight-bold" :class="item.product.sellingPrice <= item.product.costPrice ? 'text-error' : 'text-success'">
                  ${{ formatMoney(item.product.sellingPrice) }}
                </td>
                <td class="text-center">
                  <v-chip
                    size="x-small"
                    :color="getMarginColor(item.currentMargin)"
                    variant="flat"
                    class="font-weight-bold"
                  >
                    {{ item.currentMargin > 0 ? '+' : '' }}{{ item.currentMargin }}%
                  </v-chip>
                </td>
                <td>
                  <v-chip size="x-small" :color="item.severity" variant="flat" class="mb-1 font-weight-bold">
                    {{ item.title }}
                  </v-chip>
                  <div class="text-caption text-grey-darken-2" style="font-size: 11.5px; line-height: 1.2;">
                    {{ item.explanation }}
                  </div>
                </td>
                <td class="text-center">
                  <div class="text-caption font-weight-bold text-success mb-1">
                    {{ item.suggestion }}
                  </div>
                  <v-btn
                    v-if="authStore.canEditPrices && item.suggestedSellingPrice > 0"
                    size="x-small"
                    color="success"
                    variant="tonal"
                    prepend-icon="mdi-flash"
                    class="text-none font-weight-bold"
                    @click="applyQuickFix(item)"
                  >
                    Aplicar ${{ formatMoney(item.suggestedSellingPrice) }}
                  </v-btn>
                </td>
                <td class="text-center">
                  <!-- Botón Editar si tiene permisos -->
                  <div v-if="authStore.canEditPrices" class="d-flex align-center justify-center gap-1">
                    <v-btn
                      color="primary"
                      size="small"
                      variant="flat"
                      prepend-icon="mdi-pencil"
                      class="text-none font-weight-bold"
                      title="Editar precios y datos del artículo"
                      @click="openEditModal(item.product, item.suggestedSellingPrice)"
                    >
                      Editar
                    </v-btn>

                    <v-btn
                      icon="mdi-open-in-new"
                      size="x-small"
                      variant="text"
                      color="grey-darken-2"
                      title="Ver en tabla completa de inventario"
                      @click="navigateToInventory(item.product.sku)"
                    />
                  </div>

                  <!-- Botón Bloqueado si no tiene permisos -->
                  <div v-else>
                    <v-tooltip text="Solo el Administrador o Encargado tienen permiso para modificar precios">
                      <template #activator="{ props }">
                        <v-chip v-bind="props" size="x-small" color="grey" variant="outlined">
                          <v-icon icon="mdi-lock" start size="12" />
                          Solo Admin
                        </v-chip>
                      </template>
                    </v-tooltip>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <!-- ESTADO VACÍO (SIN ANOMALÍAS DETECTADAS) -->
        <v-sheet
          v-else
          class="pa-8 text-center bg-green-lighten-5 rounded border-success my-4"
        >
          <v-icon icon="mdi-check-decagram" color="success" size="64" class="mb-3" />
          <div class="text-h6 font-weight-bold text-success mb-2">
            ¡Felicitaciones! No se detectaron inconsistencias de precios en el catálogo.
          </div>
          <div class="text-body-2 text-grey-darken-2 mb-4">
            Todos los artículos registrados tienen márgenes positivos y precios de venta acordes a sus costos de reposición.
          </div>
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-format-list-bulleted"
            to="/inventario"
            class="font-weight-bold text-none"
          >
            Ver Catálogo Completo en Inventario
          </v-btn>
        </v-sheet>
      </v-card-text>
    </v-card>

    <!-- DIÁLOGO MODAL PARA CORREGIR / EDITAR EL ARTÍCULO -->
    <v-dialog v-model="editDialog" max-width="680" persistent>
      <v-card v-if="editingProduct">
        <v-card-title class="bg-primary text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-shield-edit" class="mr-2" />
            <span>Corregir Inconsistencia de Auditoría</span>
          </div>
          <v-chip size="small" color="secondary" variant="flat" class="font-weight-bold">
            SKU: {{ editingProduct.sku }}
          </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- ALERTA DE CORRECCIÓN SUGERIDA RÁPIDA -->
          <v-alert
            v-if="currentAnomalySuggestion"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3 text-caption"
          >
            <div class="d-flex align-center justify-space-between flex-wrap gap-2">
              <div>
                <strong>Diagnóstico:</strong> {{ currentAnomalySuggestion.explanation }}
              </div>
              <v-btn
                v-if="currentAnomalySuggestion.suggestedSellingPrice > 0"
                size="x-small"
                color="success"
                variant="flat"
                prepend-icon="mdi-auto-fix"
                class="font-weight-bold"
                @click="applySuggestedToForm(currentAnomalySuggestion.suggestedSellingPrice)"
              >
                Fijar Venta Sugerida (${{ formatMoney(currentAnomalySuggestion.suggestedSellingPrice) }})
              </v-btn>
            </div>
          </v-alert>

          <v-row dense>
            <!-- NOMBRE / DESCRIPCIÓN -->
            <v-col cols="12">
              <v-text-field
                v-model="editForm.name"
                label="Nombre / Descripción Comercial *"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-format-title"
                :rules="[v => !!v || 'El nombre es obligatorio']"
                hide-details="auto"
              />
            </v-col>

            <!-- CLASIFICACIÓN -->
            <v-col cols="12" sm="4">
              <v-combobox
                v-model="editForm.dept"
                :items="productStore.categories.filter(c => c !== 'TODOS')"
                label="Rubro / Departamento *"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-combobox
                v-model="editForm.brand"
                :items="productStore.brands.filter(b => b !== 'TODAS')"
                label="Marca *"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-select
                v-model="editForm.unit"
                :items="['u', 'kg', 'm', 'l', 'par', 'juego', 'rollo', 'caja']"
                label="Unidad *"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <v-divider class="my-2" />
              <div class="text-caption font-weight-bold text-primary mb-2">PRECIOS Y MÁRGENES</div>
            </v-col>

            <!-- PRECIO COSTO -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="editForm.costPrice"
                label="Precio Costo ($) *"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                prefix="$"
                @input="onCostOrMarginChange"
                hide-details="auto"
              />
            </v-col>

            <!-- MARGEN % -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="editForm.margin"
                label="Margen Estimado (%)"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                suffix="%"
                @input="onCostOrMarginChange"
                hide-details="auto"
              />
            </v-col>

            <!-- PRECIO VENTA -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="editForm.sellingPrice"
                label="Precio Venta ($) *"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                prefix="$"
                class="font-weight-bold"
                @input="onSellingPriceChange"
                :rules="[v => Number(v) > 0 || 'El precio debe ser mayor a 0']"
                hide-details="auto"
              />
            </v-col>

            <!-- PRECIO GREMIO / MAYORISTA -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="editForm.wholesalePrice"
                label="Precio Mayorista ($)"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                prefix="$"
                hide-details="auto"
              />
            </v-col>

            <!-- STOCK -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="editForm.stock"
                label="Stock Actual"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>

            <!-- STOCK MÍNIMO -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="editForm.minStock"
                label="Stock Mínimo"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>

            <!-- MOTIVO DE AUDITORÍA -->
            <v-col cols="12" class="mt-2">
              <v-text-field
                v-model="editForm.reason"
                label="Motivo del Ajuste de Auditoría"
                placeholder="Ej: Corrección error tipográfico en planilla inicial"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-history"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 d-flex justify-space-between">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none font-weight-bold"
            @click="editDialog = false"
          >
            Cancelar
          </v-btn>

          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-content-save-check"
            class="text-none font-weight-bold"
            :loading="isSaving"
            @click="saveProductCorrection"
          >
            Guardar Corrección y Persistir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- NOTIFICACIONES TOAST -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const productStore = useProductStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const selectedFilter = ref('ALL');

// Estado del Diálogo de Edición
const editDialog = ref(false);
const editingProduct = ref(null);
const currentAnomalySuggestion = ref(null);
const isSaving = ref(false);

const editForm = reactive({
  id: '',
  sku: '',
  name: '',
  dept: '',
  brand: '',
  unit: 'u',
  costPrice: 0,
  margin: 100,
  sellingPrice: 0,
  wholesalePrice: 0,
  stock: 0,
  minStock: 0,
  reason: 'Corrección de precios desde Auditoría de Planilla'
});

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

onMounted(async () => {
  if (productStore.products.length === 0) {
    await productStore.fetchProducts();
  }
});

// ESCANEO DINÁMICO DE TODAS LAS ANOMALÍAS EN EL CATÁLOGO
const anomaliesList = computed(() => {
  const list = [];

  for (const p of productStore.products) {
    const cost = Number(p.costPrice || 0);
    const selling = Number(p.sellingPrice || 0);
    const margin = cost > 0 ? Math.round(((selling - cost) / cost) * 100) : 0;

    // 1. Error Crítico: Costo mayor que Venta (Margen Negativo)
    if (cost > selling && selling > 0) {
      const lossPercent = Math.round(((cost - selling) / cost) * 100);

      // Detección de error tipográfico o desproporción de escala (ej: $68.04 vs $38.040)
      if (cost >= selling * 10) {
        // Sugerir un precio con margen normal (+100% sobre costo)
        const suggested = Math.round(cost * 2);
        list.push({
          product: p,
          type: 'ERROR_TIPOGRAFICO',
          severity: 'error',
          title: 'Error Tipográfico / Escala',
          currentMargin: margin,
          explanation: `Costo ($${formatMoney(cost)}) es desproporcionado respecto a la venta ($${formatMoney(selling)}). Posible coma decimal errónea o bulto vs unidad.`,
          suggestion: `Venta sugerida: $${formatMoney(suggested)} (+100% margen)`,
          suggestedSellingPrice: suggested
        });
      } else {
        const suggested = Math.round(cost * 1.5);
        list.push({
          product: p,
          type: 'NEGATIVE',
          severity: 'error',
          title: `Margen Negativo (-${lossPercent}%)`,
          currentMargin: margin,
          explanation: `El costo de reposición supera al precio de venta. Cada venta genera una pérdida directa de $${formatMoney(cost - selling)}.`,
          suggestion: `Ajustar venta mínimo a $${formatMoney(suggested)} (+50%)`,
          suggestedSellingPrice: suggested
        });
      }
    }
    // 2. Margen Irrisorio o Inconveniente (< 10%)
    else if (selling > 0 && cost > 0 && selling < cost * 1.1) {
      const suggested = Math.round(cost * 1.3);
      list.push({
        product: p,
        type: 'LOW',
        severity: 'warning',
        title: `Margen Mínimo (+${margin}%)`,
        currentMargin: margin,
        explanation: `Margen de ganancia bruta menor al 10%. Es insuficiente para absorber impuestos, comisiones y costos de reposición.`,
        suggestion: `Venta sugerida: $${formatMoney(suggested)} (+30%)`,
        suggestedSellingPrice: suggested
      });
    }
    // 3. Sin Precio de Venta Fijado ($0)
    else if (cost > 0 && selling <= 0) {
      const suggested = Math.round(cost * 2);
      list.push({
        product: p,
        type: 'ZERO_PRICE',
        severity: 'info',
        title: 'Sin Precio de Venta',
        currentMargin: -100,
        explanation: `El artículo posee costo cargado ($${formatMoney(cost)}) pero su precio de venta está en $0.`,
        suggestion: `Fijar venta a $${formatMoney(suggested)} (+100%)`,
        suggestedSellingPrice: suggested
      });
    }
  }

  return list;
});

// KPIs
const kpiCounts = computed(() => {
  return {
    negativeMargin: anomaliesList.value.filter(a => a.type === 'NEGATIVE' || a.type === 'ERROR_TIPOGRAFICO').length,
    lowMargin: anomaliesList.value.filter(a => a.type === 'LOW').length,
    zeroPrice: anomaliesList.value.filter(a => a.type === 'ZERO_PRICE').length
  };
});

// FILTRADO REACTIVO
const filteredAnomalies = computed(() => {
  return anomaliesList.value.filter(item => {
    // Filtro por tipo
    if (selectedFilter.value === 'NEGATIVE' && item.type !== 'NEGATIVE' && item.type !== 'ERROR_TIPOGRAFICO') {
      return false;
    }
    if (selectedFilter.value === 'LOW' && item.type !== 'LOW') {
      return false;
    }
    if (selectedFilter.value === 'ZERO_PRICE' && item.type !== 'ZERO_PRICE') {
      return false;
    }

    // Filtro por texto de búsqueda
    if (searchQuery.value && searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const sku = (item.product.sku || '').toLowerCase();
      const name = (item.product.name || '').toLowerCase();
      const dept = (item.product.dept || '').toLowerCase();
      return sku.includes(q) || name.includes(q) || dept.includes(q);
    }

    return true;
  });
});

function getRowClass(type) {
  if (type === 'NEGATIVE' || type === 'ERROR_TIPOGRAFICO') return 'bg-red-lighten-5';
  if (type === 'LOW') return 'bg-amber-lighten-5';
  if (type === 'ZERO_PRICE') return 'bg-blue-lighten-5';
  return '';
}

function getMarginColor(margin) {
  if (margin < 0) return 'error';
  if (margin < 10) return 'warning';
  if (margin >= 40) return 'success';
  return 'primary';
}

function formatMoney(val) {
  return Number(val || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// APLICAR CORRECCIÓN RÁPIDA DE UN CLIC DIRECTO
async function applyQuickFix(item) {
  if (!authStore.canEditPrices) return;

  const target = item.product;
  const newSelling = item.suggestedSellingPrice;
  const newMargin = target.costPrice > 0
    ? Math.round(((newSelling - target.costPrice) / target.costPrice) * 100)
    : 100;

  try {
    const res = await productStore.updateProduct(target.id, {
      sellingPrice: newSelling,
      margin: newMargin,
      priceReason: `Corrección automática desde Auditoría (${item.title})`
    });

    if (res.success) {
      snackbar.text = `✅ ¡Artículo "${target.sku} - ${target.name}" corregido a $${formatMoney(newSelling)}!`;
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      snackbar.text = `Error al corregir: ${res.error}`;
      snackbar.color = 'error';
      snackbar.show = true;
    }
  } catch (err) {
    snackbar.text = `Error: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  }
}

// ABRIR MODAL COMPLETO DE EDICIÓN
function openEditModal(prod, suggestedPrice = 0) {
  if (!authStore.canEditPrices) {
    snackbar.text = 'Permiso denegado: Solo el Administrador o Encargado pueden editar artículos.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }

  editingProduct.value = prod;
  const cost = Number(prod.costPrice || 0);
  const selling = Number(prod.sellingPrice || 0);
  const margin = cost > 0 ? Math.round(((selling - cost) / cost) * 100) : 100;

  const anomaly = anomaliesList.value.find(a => a.product.sku === prod.sku);
  currentAnomalySuggestion.value = anomaly || null;

  Object.assign(editForm, {
    id: prod.id,
    sku: prod.sku,
    name: prod.name,
    dept: prod.dept || 'GENERAL',
    brand: prod.brand || 'GENÉRICO',
    unit: prod.unit || 'u',
    costPrice: cost,
    margin: margin,
    sellingPrice: selling,
    wholesalePrice: Number(prod.wholesalePrice || 0),
    stock: Number(prod.stock || 0),
    minStock: Number(prod.minStock || 0),
    reason: `Corrección de auditoría por ${authStore.currentUser?.fullName || 'Administrador'}`
  });

  editDialog.value = true;
}

function applySuggestedToForm(suggestedPrice) {
  editForm.sellingPrice = Number(suggestedPrice);
  if (editForm.costPrice > 0) {
    editForm.margin = Math.round(((editForm.sellingPrice - editForm.costPrice) / editForm.costPrice) * 100);
  }
}

function onCostOrMarginChange() {
  const cost = Number(editForm.costPrice || 0);
  const margin = Number(editForm.margin || 0);
  if (cost > 0) {
    editForm.sellingPrice = Math.round(cost * (1 + margin / 100));
  }
}

function onSellingPriceChange() {
  const cost = Number(editForm.costPrice || 0);
  const selling = Number(editForm.sellingPrice || 0);
  if (cost > 0 && selling > 0) {
    editForm.margin = Math.round(((selling - cost) / cost) * 100);
  }
}

// GUARDAR CORRECCIÓN EN PRODUCTSTORE (PERSISTE EN INDEXEDDB Y SUPABASE)
async function saveProductCorrection() {
  if (!editForm.name || !editForm.sellingPrice) {
    snackbar.text = 'Complete el nombre y el precio de venta.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }

  isSaving.value = true;
  try {
    const res = await productStore.updateProduct(editForm.id, {
      name: editForm.name,
      dept: editForm.dept,
      brand: editForm.brand,
      unit: editForm.unit,
      costPrice: Number(editForm.costPrice),
      margin: Number(editForm.margin),
      sellingPrice: Number(editForm.sellingPrice),
      wholesalePrice: Number(editForm.wholesalePrice),
      stock: Number(editForm.stock),
      minStock: Number(editForm.minStock),
      priceReason: editForm.reason || 'Corrección desde Auditoría'
    });

    if (res.success) {
      snackbar.text = `✅ Artículo "${editForm.sku} - ${editForm.name}" corregido y guardado exitosamente.`;
      snackbar.color = 'success';
      snackbar.show = true;
      editDialog.value = false;
    } else {
      snackbar.text = `Error guardando cambios: ${res.error}`;
      snackbar.color = 'error';
      snackbar.show = true;
    }
  } catch (err) {
    snackbar.text = `Error inesperado: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isSaving.value = false;
  }
}

// ENLAZAR CON EL INVENTARIO CON FILTRO Y APERTURA DE EDICIÓN
function navigateToInventory(sku) {
  router.push({
    path: '/inventario',
    query: { editSku: sku }
  });
}
</script>

<style scoped>
.responsive-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.compact-anomalies-table th,
.compact-anomalies-table td {
  padding: 6px 10px !important;
  font-size: 13px;
}
.border-error {
  border-left: 5px solid #D32F2F !important;
}
.border-warning {
  border-left: 5px solid #ED6C02 !important;
}
.border-success {
  border: 1px solid #4CAF50 !important;
}
.text-2xs {
  font-size: 10px !important;
  line-height: 12px;
}
</style>
