<template>
  <v-container fluid class="pa-4">
    <v-card elevation="2">
      <v-card-title class="pa-4 d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <v-icon icon="mdi-receipt-text-outline" class="mr-2 text-primary" />
          <span class="text-h6 font-weight-bold">Comprobantes y Ventas Emitidas</span>
        </div>
        <v-chip color="primary" variant="flat" class="font-weight-bold">
          Total Ventas: ${{ formatMoney(totalVentas) }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <v-table density="comfortable" hover>
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-bold">N° Comprobante</th>
            <th class="font-weight-bold">Tipo</th>
            <th class="font-weight-bold">Fecha / Hora</th>
            <th class="font-weight-bold">Cliente</th>
            <th class="font-weight-bold">Medio de Pago</th>
            <th class="font-weight-bold text-center">Items</th>
            <th class="font-weight-bold text-right">Total</th>
            <th class="font-weight-bold text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in cartStore.salesHistory" :key="sale.id">
            <td class="font-weight-bold text-primary">{{ sale.voucherNumber }}</td>
            <td>
              <v-chip size="x-small" color="secondary" variant="tonal">
                {{ sale.voucherType.replace('_', ' ') }}
              </v-chip>
            </td>
            <td class="text-caption">{{ formatDate(sale.createdAt) }}</td>
            <td>{{ sale.customer.name }}</td>
            <td>
              <v-chip size="x-small" variant="outlined">{{ sale.paymentMethod }}</v-chip>
            </td>
            <td class="text-center font-weight-bold">{{ sale.items.length }}</td>
            <td class="text-right font-weight-black text-h6 text-primary">
              ${{ formatMoney(sale.total) }}
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-eye-outline"
                size="x-small"
                variant="tonal"
                color="primary"
                title="Ver e Imprimir Comprobante"
                @click="openTicket(sale)"
              />
            </td>
          </tr>

          <tr v-if="cartStore.salesHistory.length === 0">
            <td colspan="8" class="text-center py-10 text-grey">
              <v-icon icon="mdi-receipt-text-remove-outline" size="48" class="mb-2" />
              <div>Aún no se registraron ventas en esta sesión.</div>
              <div class="text-caption">Ingresá al Punto de Venta para realizar la primera cobranza.</div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Modal de Comprobante / Ticket -->
    <v-dialog v-model="viewDialog" max-width="420">
      <v-card v-if="selectedSale">
        <v-card-text class="pa-4 text-center">
          <div class="text-h6 font-weight-black">FERRETERÍA CENTRAL</div>
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
          <div class="text-caption text-right text-grey">Medio: {{ selectedSale.paymentMethod }}</div>
        </v-card-text>
        <v-card-actions class="pa-3">
          <v-btn block color="primary" variant="flat" @click="window.print()">
            <v-icon icon="mdi-printer" class="mr-1" /> Imprimir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from '@/stores/cartStore';

const cartStore = useCartStore();
const viewDialog = ref(false);
const selectedSale = ref(null);

onMounted(() => {
  cartStore.loadSalesHistory();
});

const totalVentas = computed(() => {
  return cartStore.salesHistory.reduce((acc, s) => acc + s.total, 0);
});

function openTicket(sale) {
  selectedSale.value = sale;
  viewDialog.value = true;
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
