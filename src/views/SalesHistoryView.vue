<template>
  <v-container fluid class="pa-4">
    <v-card elevation="2">
      <v-card-title class="pa-4 d-flex justify-space-between align-center flex-wrap ga-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-receipt-text-outline" class="mr-2 text-primary" />
          <span class="text-h6 font-weight-bold">Comprobantes y Ventas Emitidas</span>
        </div>
        <div class="d-flex align-center flex-wrap ga-2">
          <v-btn
            v-if="authStore.canViewSalesReports"
            to="/reportes-ventas"
            variant="flat"
            color="teal-darken-1"
            size="small"
            class="font-weight-bold text-none shadow-sm"
          >
            <v-icon icon="mdi-chart-areaspline" start size="small" />
            Resumen e Informes (Día / Horas / Mes)
          </v-btn>
          <v-chip color="primary" variant="flat" class="font-weight-bold">
            Total Ventas: ${{ formatMoney(totalVentas) }}
          </v-chip>
        </div>
      </v-card-title>

      <v-divider />

      <div class="responsive-table-wrapper">
        <v-table density="compact" hover class="compact-history-table">
          <thead>
            <tr class="bg-grey-lighten-4">
              <th class="font-weight-bold">Comprobante</th>
              <th class="font-weight-bold">Estado</th>
              <th class="font-weight-bold">Tipo</th>
              <th class="font-weight-bold">Fecha / Hora</th>
              <th class="font-weight-bold">Operador</th>
              <th class="font-weight-bold">Cliente</th>
              <th class="font-weight-bold">Medio de Pago</th>
              <th class="font-weight-bold text-center">Items</th>
              <th class="font-weight-bold text-right">Total</th>
              <th class="font-weight-bold text-center sticky-action-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sale in cartStore.salesHistory"
              :key="sale.id"
              :class="{ 'bg-red-lighten-5 text-decoration-line-through text-grey': sale.estado === 'ANULADA' }"
            >
              <td class="font-weight-bold text-primary font-mono text-caption">{{ sale.voucherNumber }}</td>
              <td>
                <v-chip
                  size="x-small"
                  :color="sale.estado === 'ANULADA' ? 'error' : 'success'"
                  variant="flat"
                  class="font-weight-bold text-2xs"
                >
                  {{ sale.estado === 'ANULADA' ? 'ANULADA' : 'PAGADA' }}
                </v-chip>
              </td>
              <td>
                <v-chip size="x-small" color="secondary" variant="tonal" class="text-2xs">
                  {{ sale.voucherType.replace('_', ' ') }}
                </v-chip>
              </td>
              <td class="text-caption font-mono text-grey-darken-2" style="font-size: 11px;">
                {{ formatDate(sale.createdAt) }}
              </td>
              <td>
                <div class="d-flex align-center">
                  <v-avatar size="20" :color="getRoleColor(sale.userRole)" class="mr-1.5 text-white font-weight-bold text-2xs">
                    {{ (sale.userName || 'O').charAt(0) }}
                  </v-avatar>
                  <span class="text-caption font-weight-medium text-truncate" style="max-width: 110px;" :title="sale.userName || 'Mostrador'">
                    {{ sale.userName || 'Mostrador' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="text-caption font-weight-medium text-truncate" style="max-width: 130px;" :title="sale.customer?.name || 'Consumidor Final'">
                  {{ sale.customer?.name || 'Consumidor Final' }}
                </div>
              </td>
              <td>
                <v-chip size="x-small" variant="outlined" class="text-2xs font-weight-bold">
                  {{ sale.paymentMethod }}
                </v-chip>
              </td>
              <td class="text-center font-weight-bold text-caption">{{ sale.items.length }}</td>
              <td class="text-right font-weight-black text-subtitle-2 text-no-wrap" :class="sale.estado === 'ANULADA' ? 'text-grey' : 'text-primary'">
                ${{ formatMoney(sale.total) }}
              </td>
              <!-- COLUMNA DE ACCIONES: STICKY A LA DERECHA (NUNCA SE ESCONDE AL ACHICAR VENTANA) -->
              <td class="text-center text-no-wrap sticky-action-col">
                <v-btn
                  icon="mdi-eye-outline"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  title="Ver e Imprimir Comprobante"
                  class="mr-1 action-btn"
                  @click="openTicket(sale)"
                />
                <v-btn
                  icon="mdi-file-pdf-box"
                  size="x-small"
                  variant="tonal"
                  color="error"
                  title="Descargar Comprobante en PDF"
                  class="mr-1 action-btn"
                  @click="downloadPdf(sale)"
                />
                <v-btn
                  v-if="sale.estado !== 'ANULADA'"
                  icon="mdi-backup-restore"
                  size="x-small"
                  variant="tonal"
                  color="error"
                  title="Anular Venta / Devolución (Reintegra Stock)"
                  class="action-btn"
                  @click="openRefundDialog(sale)"
                />
              </td>
            </tr>

            <tr v-if="cartStore.salesHistory.length === 0">
              <td colspan="10" class="text-center py-8 text-grey">
                <v-icon icon="mdi-receipt-text-remove-outline" size="36" class="mb-2" />
                <div>Aún no se registraron ventas en esta sesión.</div>
                <div class="text-caption">Ingresá al Punto de Venta para realizar la primera cobranza.</div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- Modal de Comprobante / Ticket -->
    <v-dialog v-model="viewDialog" max-width="420">
      <v-card v-if="selectedSale">
        <v-card-text class="pa-4 text-center">
          <v-alert
            v-if="selectedSale.estado === 'ANULADA'"
            type="error"
            variant="flat"
            density="compact"
            class="mb-3 font-weight-bold"
          >
            COMPROBANTE ANULADO (STOCK DEVUELTO)
            <div class="text-caption font-weight-regular mt-1" v-if="selectedSale.refundReason">
              Motivo: {{ selectedSale.refundReason }}
            </div>
          </v-alert>

          <div class="text-h6 font-weight-black">{{ businessStore.comercio.nombre }}</div>
          <div class="text-caption">Comprobante N° {{ selectedSale.voucherNumber }}</div>
          <div class="text-caption text-grey">{{ formatDate(selectedSale.createdAt) }}</div>
          <v-divider class="my-2" />

          <table style="width: 100%; text-align: left;" class="text-caption">
            <thead>
              <tr style="border-bottom: 1px dashed #ccc;">
                <th>Cant</th>
                <th>Art</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in selectedSale.items" :key="it.sku">
                <td>{{ it.quantity }} {{ it.unit }}</td>
                <td class="line-clamp-1">{{ it.name }}</td>
                <td style="text-align: right;">${{ formatMoney(it.quantity * (selectedSale.priceMode === 'wholesale' && it.wholesalePrice > 0 ? it.wholesalePrice : it.sellingPrice)) }}</td>
              </tr>
            </tbody>
          </table>

          <v-divider class="my-2" />
          <div class="d-flex justify-space-between text-h6 font-weight-black mt-2">
            <span>TOTAL:</span>
            <span>${{ formatMoney(selectedSale.total) }}</span>
          </div>
          <div class="d-flex justify-space-between text-caption text-grey mt-1">
            <span>Medio: {{ selectedSale.paymentMethod }}</span>
            <span v-if="selectedSale.userName">Operador: {{ selectedSale.userName }}</span>
          </div>
        </v-card-text>
        <v-card-actions class="pa-3 d-flex flex-column ga-2">
          <div class="d-flex w-100 ga-2">
            <v-btn variant="tonal" color="error" class="flex-grow-1 font-weight-bold text-none" @click="downloadPdf(selectedSale)">
              <v-icon icon="mdi-file-pdf-box" class="mr-1" /> Descargar PDF
            </v-btn>
            <v-btn variant="flat" color="primary" class="flex-grow-1 font-weight-bold text-none" @click="window.print()">
              <v-icon icon="mdi-printer" class="mr-1" /> Imprimir
            </v-btn>
          </div>
          <v-btn variant="text" color="grey" block size="small" @click="viewDialog = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal Confirmación de Devolución / Anulación de Venta -->
    <v-dialog v-model="refundDialog" max-width="480">
      <v-card v-if="saleToRefund">
        <v-card-title class="pa-4 bg-error text-white d-flex align-center">
          <v-icon icon="mdi-backup-restore" class="mr-2" />
          <span>Anular Venta / Devolución</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-1 font-weight-bold mb-2">
            ¿Deseas anular el comprobante {{ saleToRefund.voucherNumber }} por ${{ formatMoney(saleToRefund.total) }}?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4 text-caption">
            <strong>Reintegro Automático de Stock:</strong> Los {{ saleToRefund.items.length }} artículos vendidos volverán a sumarse al inventario de forma inmediata y quedará registrado el movimiento en el kardex de auditoría.
          </v-alert>
          <v-text-field
            v-model="refundReason"
            label="Motivo de la anulación o devolución"
            variant="outlined"
            density="compact"
            placeholder="Ej: Devolución por cliente / Error de cobro"
            hide-details
            autofocus
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="refundDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="isRefunding" @click="confirmRefund">
            Confirmar Anulación y Devolver Stock
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de retroalimentación -->
    <v-snackbar v-model="snackbar" :color="snackColor" timeout="4000">
      {{ snackText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { generateVoucherPdf } from '@/utils/pdfGenerator';

const cartStore = useCartStore();
const authStore = useAuthStore();
const businessStore = useBusinessStore();
const viewDialog = ref(false);
const selectedSale = ref(null);

const refundDialog = ref(false);
const saleToRefund = ref(null);
const refundReason = ref('Devolución de mercadería');
const isRefunding = ref(false);

const snackbar = ref(false);
const snackText = ref('');
const snackColor = ref('success');

onMounted(() => {
  businessStore.initBusiness();
  cartStore.loadSalesHistory();
});

function downloadPdf(sale) {
  if (!sale) return;
  generateVoucherPdf(sale, businessStore.comercio);
}

const totalVentas = computed(() => {
  return cartStore.salesHistory
    .filter(s => s.estado !== 'ANULADA')
    .reduce((acc, s) => acc + s.total, 0);
});

function openTicket(sale) {
  selectedSale.value = sale;
  viewDialog.value = true;
}

function openRefundDialog(sale) {
  saleToRefund.value = sale;
  refundReason.value = 'Devolución de mercadería';
  refundDialog.value = true;
}

async function confirmRefund() {
  if (!saleToRefund.value) return;
  isRefunding.value = true;
  try {
    const ok = await cartStore.refundSale(saleToRefund.value.id, refundReason.value);
    if (ok) {
      snackText.value = `Comprobante #${saleToRefund.value.voucherNumber} anulado. Stock reintegrado con éxito.`;
      snackColor.value = 'success';
      snackbar.value = true;
      refundDialog.value = false;
      saleToRefund.value = null;
    } else {
      snackText.value = 'No se pudo anular la venta.';
      snackColor.value = 'error';
      snackbar.value = true;
    }
  } catch (err) {
    snackText.value = `Error al anular: ${err.message}`;
    snackColor.value = 'error';
    snackbar.value = true;
  } finally {
    isRefunding.value = false;
  }
}

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

function formatMoney(val) {
  return Number(val || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(isoStr) {
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
.compact-history-table th,
.compact-history-table td {
  padding: 4px 8px !important;
  height: 38px !important;
  font-size: 12.5px;
}
.sticky-action-col {
  position: sticky;
  right: 0;
  background: white;
  z-index: 2;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.05);
}
th.sticky-action-col {
  background: #F1F5F9 !important;
  z-index: 3;
}
tr.bg-red-lighten-5 td.sticky-action-col {
  background: #FFEBEE !important;
}
.action-btn {
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
}
.text-2xs {
  font-size: 9.5px !important;
  line-height: 12px !important;
}
</style>
