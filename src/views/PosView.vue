<template>
  <v-container fluid class="pa-4">
    <!-- BARRA DE ATAJOS RÁPIDOS DE TECLADO -->
    <v-card elevation="1" class="mb-3 px-3 py-1 bg-grey-lighten-4 d-flex align-center justify-space-between flex-wrap text-caption">
      <div class="d-flex align-center gap-3">
        <span class="font-weight-bold text-grey-darken-3">Atajos Mostrador:</span>
        <span><kbd class="kbd-badge">F2</kbd> Cobrar</span>
        <span><kbd class="kbd-badge">F4</kbd> Limpiar Carrito</span>
        <span><kbd class="kbd-badge">F8</kbd> Alternar Minorista/Mayorista</span>
        <span><kbd class="kbd-badge">Enter</kbd> Pistola / Buscar y Agregar</span>
        <span><kbd class="kbd-badge">ESC</kbd> Cerrar Ventanas</span>
      </div>
      <div class="text-grey-darken-1 font-weight-medium">
        Modo actual: <strong class="text-primary">{{ cartStore.priceMode === 'wholesale' ? 'MAYOREO' : 'MOSTRADOR' }}</strong>
      </div>
    </v-card>

    <v-row>
      <!-- COLUMNA IZQUIERDA: BÚSQUEDA Y CATÁLOGO DE PRODUCTOS -->
      <v-col cols="12" md="7" lg="8">
        <v-card elevation="2" class="mb-4">
          <v-card-text class="pb-2">
            <!-- Barra de búsqueda rápida / Pistola de Códigos -->
            <v-row dense align="center">
              <v-col cols="12" sm="8">
                <v-text-field
                  ref="searchInputRef"
                  v-model="productStore.searchQuery"
                  prepend-inner-icon="mdi-barcode-scan"
                  placeholder="Escanear código o buscar por nombre (Enter para agregar)..."
                  variant="outlined"
                  density="comfortable"
                  clearable
                  hide-details
                  autofocus
                  @keydown.enter="handleEnterSearch"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="productStore.selectedCategory"
                  :items="productStore.categories"
                  label="Rubro / Depto"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
            </v-row>

            <!-- Categorías rápidas -->
            <div class="mt-3 d-flex flex-wrap gap-2">
              <v-chip
                v-for="cat in quickCategories"
                :key="cat"
                size="small"
                :color="productStore.selectedCategory === cat ? 'primary' : 'default'"
                :variant="productStore.selectedCategory === cat ? 'flat' : 'outlined'"
                class="mr-1 mb-1 cursor-pointer"
                @click="productStore.selectedCategory = (productStore.selectedCategory === cat ? 'TODOS' : cat)"
              >
                {{ cat }}
              </v-chip>
            </div>
          </v-card-text>

          <v-divider />

          <!-- Lista de productos -->
          <v-card-text class="pa-2" style="max-height: 560px; overflow-y: auto;">
            <v-row dense>
              <v-col
                v-for="prod in paginatedProducts"
                :key="prod.id"
                cols="12"
                sm="6"
                lg="4"
              >
                <v-card
                  variant="outlined"
                  class="h-100 product-card d-flex flex-column justify-space-between"
                  :class="{ 'low-stock-border': prod.stock <= prod.minStock }"
                  @click="addToCart(prod)"
                >
                  <v-card-item class="pb-1">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="text-caption font-weight-bold text-primary">#{{ prod.sku }}</span>
                      <v-chip
                        size="x-small"
                        :color="prod.stock <= prod.minStock ? 'error' : 'success'"
                        variant="tonal"
                      >
                        Stock: {{ prod.stock }} {{ prod.unit }}
                      </v-chip>
                    </div>
                    <div class="text-body-2 font-weight-bold line-clamp-2" :title="prod.name">
                      {{ prod.name }}
                    </div>
                  </v-card-item>

                  <v-card-actions class="pt-0 px-3 pb-2 d-flex justify-space-between align-center">
                    <div>
                      <div class="text-h6 font-weight-black text-primary">
                        ${{ formatMoney(activePrice(prod)) }}
                      </div>
                      <div v-if="prod.wholesalePrice > 0" class="text-caption text-grey">
                        Mayoreo: ${{ formatMoney(prod.wholesalePrice) }}
                      </div>
                    </div>
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      color="primary"
                      variant="tonal"
                      @click.stop="addToCart(prod)"
                    />
                  </v-card-actions>
                </v-card>
              </v-col>

              <v-col v-if="productStore.filteredProducts.length === 0" cols="12" class="text-center py-8">
                <v-icon icon="mdi-package-variant-remove" size="48" color="grey" class="mb-2" />
                <div class="text-body-1 text-grey">No se encontraron productos con ese filtro</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- COLUMNA DERECHA: CARRITO, FACTURACIÓN Y COBRO -->
      <v-col cols="12" md="5" lg="4">
        <v-card elevation="3" class="h-100 d-flex flex-column">
          <!-- Cabecera Mostrador / Tipo Comprobante -->
          <v-card-item class="bg-primary text-white py-3">
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-icon icon="mdi-point-of-sale" class="mr-1" />
                <span class="text-subtitle-1 font-weight-bold">Venta Mostrador</span>
              </div>
              <v-chip size="small" color="secondary" variant="flat">
                {{ cartStore.voucherType.replace('_', ' ') }}
              </v-chip>
            </div>
          </v-card-item>

          <!-- Opciones Rápidas: Lista de Precios & Comprobante -->
          <v-card-text class="py-2 border-b">
            <v-row dense align="center">
              <v-col cols="6">
                <v-btn
                  block
                  size="small"
                  :color="cartStore.priceMode === 'wholesale' ? 'secondary' : 'primary'"
                  variant="tonal"
                  class="font-weight-bold"
                  @click="cartStore.togglePriceMode()"
                >
                  <v-icon icon="mdi-tag-outline" class="mr-1" />
                  {{ cartStore.priceMode === 'wholesale' ? 'Mayorista [F8]' : 'Minorista [F8]' }}
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="cartStore.voucherType"
                  :items="voucherTypes"
                  item-title="title"
                  item-value="value"
                  label="Comprobante"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Lista de Items en el carrito -->
          <v-card-text class="flex-grow-1 pa-2" style="max-height: 380px; overflow-y: auto;">
            <div v-if="cartStore.items.length === 0" class="text-center py-12">
              <v-icon icon="mdi-cart-outline" size="56" color="grey-lighten-1" class="mb-2" />
              <div class="text-body-2 text-grey">El carrito está vacío</div>
              <div class="text-caption text-grey">Pistoleá un código de barras o buscá un producto</div>
            </div>

            <v-list v-else lines="two" density="compact" class="pa-0">
              <v-list-item
                v-for="(item, idx) in cartStore.items"
                :key="item.sku"
                class="px-2 border-b"
              >
                <template #title>
                  <div class="d-flex justify-space-between">
                    <span class="text-body-2 font-weight-bold line-clamp-1">{{ item.name }}</span>
                    <span class="text-body-2 font-weight-black">
                      ${{ formatMoney(getItemSubtotal(item)) }}
                    </span>
                  </div>
                </template>

                <template #subtitle>
                  <div class="d-flex justify-space-between align-center mt-1">
                    <span class="text-caption text-grey">
                      ${{ formatMoney(getItemUnitPrice(item)) }} / {{ item.unit }}
                    </span>

                    <!-- Controles de cantidad -->
                    <div class="d-flex align-center">
                      <v-btn
                        icon="mdi-minus"
                        size="x-small"
                        variant="tonal"
                        @click="cartStore.updateQuantity(idx, item.quantity - 1)"
                      />
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        step="any"
                        min="0.1"
                        class="qty-input mx-1 text-center"
                      />
                      <v-btn
                        icon="mdi-plus"
                        size="x-small"
                        variant="tonal"
                        @click="cartStore.updateQuantity(idx, item.quantity + 1)"
                      />
                      <v-btn
                        icon="mdi-delete"
                        size="x-small"
                        color="error"
                        variant="text"
                        class="ml-1"
                        @click="cartStore.removeItem(idx)"
                      />
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-divider />

          <!-- Resumen de Totales y Método de Cobro -->
          <v-card-text class="bg-grey-lighten-5 pt-3 pb-2">
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>Subtotal ({{ cartStore.itemCount }} items):</span>
              <span class="font-weight-medium">${{ formatMoney(cartStore.subtotal) }}</span>
            </div>

            <div class="d-flex justify-space-between align-center text-body-2 mb-2">
              <span>Descuento (%):</span>
              <div style="width: 80px;">
                <v-text-field
                  v-model.number="cartStore.discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  density="compact"
                  variant="outlined"
                  suffix="%"
                  hide-details
                />
              </div>
            </div>

            <div class="d-flex justify-space-between align-center mt-2 pt-2 border-t">
              <span class="text-h6 font-weight-bold">TOTAL:</span>
              <span class="text-h4 font-weight-black text-primary">
                ${{ formatMoney(cartStore.total) }}
              </span>
            </div>

            <!-- Método de pago -->
            <v-select
              v-model="cartStore.paymentMethod"
              :items="paymentMethods"
              label="Forma de Cobro"
              density="compact"
              variant="outlined"
              class="mt-3"
              hide-details
            />
          </v-card-text>

          <!-- Botones de Acción con Hotkeys -->
          <v-card-actions class="pa-3 bg-grey-lighten-5">
            <v-btn
              color="grey"
              variant="outlined"
              :disabled="cartStore.items.length === 0"
              @click="cartStore.clearCart()"
            >
              [F4] Cancelar
            </v-btn>
            <v-spacer />
            <v-btn
              color="accent"
              size="large"
              variant="flat"
              class="px-6 font-weight-bold"
              :disabled="cartStore.items.length === 0"
              @click="processCheckout"
            >
              <v-icon icon="mdi-check-circle" class="mr-1" />
              [F2] COBRAR ${{ formatMoney(cartStore.total) }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- DIÁLOGO DE TICKET / COMPROBANTE EMITIDO -->
    <v-dialog v-model="ticketDialog" max-width="420" @keydown.esc="closeTicketDialog">
      <v-card v-if="lastSale">
        <v-card-text class="pa-4 text-center" id="printable-ticket">
          <div class="text-h6 font-weight-black">FERRETERÍA CENTRAL</div>
          <div class="text-caption">CUIT: 30-71234567-9 | IVA Resp. Inscripto</div>
          <div class="text-caption">Av. San Martín 1240 - Tel: 011-4567-8900</div>
          <v-divider class="my-2" />

          <div class="d-flex justify-space-between text-body-2 font-weight-bold">
            <span>{{ lastSale.voucherType.replace('_', ' ') }}</span>
            <span>N° {{ lastSale.voucherNumber }}</span>
          </div>
          <div class="text-caption text-left text-grey">
            Fecha: {{ formatDate(lastSale.createdAt) }}
          </div>
          <div class="text-caption text-left text-grey">
            Cliente: {{ lastSale.customer.name }} ({{ lastSale.customer.taxCondition }})
          </div>
          <v-divider class="my-2" />

          <table style="width: 100%; text-align: left;" class="text-caption">
            <thead>
              <tr style="border-bottom: 1px dashed #ccc;">
                <th>Cant</th>
                <th>Detalle</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in lastSale.items" :key="it.sku">
                <td>{{ it.quantity }} {{ it.unit }}</td>
                <td class="line-clamp-1">{{ it.name }}</td>
                <td style="text-align: right;">${{ formatMoney(it.quantity * (lastSale.priceMode === 'wholesale' && it.wholesalePrice > 0 ? it.wholesalePrice : it.sellingPrice)) }}</td>
              </tr>
            </tbody>
          </table>

          <v-divider class="my-2" />

          <div class="d-flex justify-space-between text-caption" v-if="lastSale.discount > 0">
            <span>Subtotal:</span>
            <span>${{ formatMoney(lastSale.subtotal) }}</span>
          </div>
          <div class="d-flex justify-space-between text-caption text-error" v-if="lastSale.discount > 0">
            <span>Descuento:</span>
            <span>-${{ formatMoney(lastSale.discount) }}</span>
          </div>

          <div class="d-flex justify-space-between text-h6 font-weight-black mt-2">
            <span>TOTAL:</span>
            <span>${{ formatMoney(lastSale.total) }}</span>
          </div>
          <div class="text-caption text-right text-grey">
            Pago con: {{ lastSale.paymentMethod }}
          </div>

          <v-divider class="my-2" />
          <div class="text-caption text-grey">Comprobante no válido como factura fiscal</div>
          <div class="text-caption font-weight-medium">¡Gracias por su compra!</div>
        </v-card-text>

        <v-card-actions class="pa-3">
          <v-btn variant="outlined" block color="primary" @click="printTicket">
            <v-icon icon="mdi-printer" class="mr-1" /> Imprimir Comprobante (Enter)
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';

const productStore = useProductStore();
const cartStore = useCartStore();

const searchInputRef = ref(null);
const ticketDialog = ref(false);
const lastSale = ref(null);

const quickCategories = [
  'HERRAMIENTAS',
  'ELECTRICIDAD',
  'BULONERIA',
  'PINTURERIA',
  'SEGURIDAD',
  'ALBAÑIL',
  'MANGUERAS'
];

const voucherTypes = [
  { title: 'Ticket X (Interno)', value: 'TICKET_X' },
  { title: 'Presupuesto', value: 'PRESUPUESTO' },
  { title: 'Remito', value: 'REMITO' }
];

const paymentMethods = [
  { title: 'Efectivo', value: 'EFECTIVO' },
  { title: 'Transferencia (Alias/CBU)', value: 'TRANSFERENCIA' },
  { title: 'Tarjeta Débito', value: 'DEBITO' },
  { title: 'Tarjeta Crédito', value: 'CREDITO' },
  { title: 'Mercado Pago / QR', value: 'MERCADOPAGO' },
  { title: 'Cuenta Corriente', value: 'CTA_CTE' }
];

// Focus helper
function focusSearch() {
  nextTick(() => {
    if (searchInputRef.value?.$el?.querySelector('input')) {
      searchInputRef.value.$el.querySelector('input').focus();
    }
  });
}

// Global Keyboard Shortcuts handler
function handleGlobalKeydown(e) {
  // F2: Checkout
  if (e.key === 'F2') {
    e.preventDefault();
    if (cartStore.items.length > 0) {
      processCheckout();
    }
  }
  // F4: Clear cart
  else if (e.key === 'F4') {
    e.preventDefault();
    cartStore.clearCart();
    focusSearch();
  }
  // F8: Toggle price mode
  else if (e.key === 'F8') {
    e.preventDefault();
    cartStore.togglePriceMode();
  }
  // ESC: Close dialog
  else if (e.key === 'Escape') {
    if (ticketDialog.value) {
      closeTicketDialog();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  focusSearch();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

const paginatedProducts = computed(() => {
  return productStore.filteredProducts.slice(0, 48);
});

function activePrice(product) {
  if (cartStore.priceMode === 'wholesale' && product.wholesalePrice > 0) {
    return product.wholesalePrice;
  }
  return product.sellingPrice;
}

function getItemUnitPrice(item) {
  if (cartStore.priceMode === 'wholesale' && item.wholesalePrice > 0) {
    return item.wholesalePrice;
  }
  return item.sellingPrice;
}

function getItemSubtotal(item) {
  return getItemUnitPrice(item) * item.quantity;
}

function addToCart(product) {
  cartStore.addItem(product, 1);
  focusSearch();
}

function handleEnterSearch() {
  const query = (productStore.searchQuery || '').trim();
  if (!query) return;

  // 1. Coincidencia exacta por SKU o Barcode
  const exactMatch = productStore.products.find(
    p => p.sku.toLowerCase() === query.toLowerCase() || (p.barcode && p.barcode === query)
  );

  if (exactMatch) {
    addToCart(exactMatch);
    productStore.searchQuery = '';
    return;
  }

  // 2. Si solo queda un resultado filtrado en la lista
  const matches = productStore.filteredProducts;
  if (matches.length === 1) {
    addToCart(matches[0]);
    productStore.searchQuery = '';
    return;
  }
}

async function processCheckout() {
  const result = await cartStore.checkout();
  if (result) {
    lastSale.value = result;
    ticketDialog.value = true;
  }
}

function closeTicketDialog() {
  ticketDialog.value = false;
  focusSearch();
}

function printTicket() {
  window.print();
  closeTicketDialog();
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
.product-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
  border-radius: 8px;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.low-stock-border {
  border-color: #EF4444 !important;
}
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.qty-input {
  width: 50px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 13px;
}
.kbd-badge {
  background: #2D3748;
  color: #FFF;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
}
@media print {
  body * {
    visibility: hidden;
  }
  #printable-ticket, #printable-ticket * {
    visibility: visible;
  }
  #printable-ticket {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
  }
}
</style>
