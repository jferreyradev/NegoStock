<template>
  <v-container fluid class="quote-builder-container pa-3 pa-md-4">
    <!-- BARRA SUPERIOR DE FLUJO / WORKFLOW -->
    <v-card elevation="2" class="mb-3 rounded-lg border">
      <div class="d-flex flex-wrap align-center justify-space-between px-3 py-2 bg-grey-lighten-4 border-b">
        <!-- Título e Identificador -->
        <div class="d-flex align-center my-1">
          <v-avatar size="36" :color="workflowColor" class="mr-2 text-white elevation-1">
            <v-icon :icon="workflowIcon" size="small" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-black d-flex align-center">
              <span>Armador de Presupuestos y Pedidos</span>
              <v-chip
                size="x-small"
                :color="workflowColor"
                variant="flat"
                class="ml-2 font-weight-black text-white"
              >
                {{ cartStore.voucherType.replace(/_/g, ' ') }}
              </v-chip>
            </div>
            <div class="text-caption text-grey-darken-2">
              Cotizaciones detalladas, bonificaciones por ítem, ítems personalizados y pase directo a venta
            </div>
          </div>
        </div>

        <!-- Selector de Tipo de Operación (Workflow Switcher) -->
        <div class="d-flex align-center flex-wrap ga-2 my-1">
          <v-btn-toggle
            v-model="cartStore.voucherType"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            divided
          >
            <v-btn
              value="PRESUPUESTO"
              :color="cartStore.voucherType === 'PRESUPUESTO' ? 'amber-darken-3' : undefined"
              :class="{ 'text-white font-weight-bold': cartStore.voucherType === 'PRESUPUESTO' }"
              size="small"
            >
              <v-icon icon="mdi-file-document-edit" start size="small" />
              Presupuesto
            </v-btn>

            <v-btn
              value="TICKET_X"
              :color="cartStore.voucherType === 'TICKET_X' ? 'primary' : undefined"
              :class="{ 'text-white font-weight-bold': cartStore.voucherType === 'TICKET_X' }"
              size="small"
            >
              <v-icon icon="mdi-point-of-sale" start size="small" />
              Venta Directa
            </v-btn>

            <v-btn
              value="REMITO"
              :color="cartStore.voucherType === 'REMITO' ? 'amber-darken-4' : undefined"
              :class="{ 'text-white font-weight-bold': cartStore.voucherType === 'REMITO' }"
              size="small"
            >
              <v-icon icon="mdi-truck-delivery" start size="small" />
              Remito
            </v-btn>
          </v-btn-toggle>

          <v-divider vertical class="mx-1 d-none d-sm-block" />

          <!-- Presupuestos Guardados -->
          <v-btn
            variant="tonal"
            color="amber-darken-3"
            size="small"
            class="font-weight-bold text-none"
            @click="pendingQuotesDialog = true"
          >
            <v-icon icon="mdi-folder-clock-outline" start size="small" />
            Presupuestos
            <v-badge
              v-if="cartStore.presupuestosList.length > 0"
              :content="cartStore.presupuestosList.length"
              color="amber-darken-4"
              inline
              class="ml-1"
            />
          </v-btn>

          <!-- Volver a Mostrador -->
          <v-btn
            variant="outlined"
            color="grey-darken-2"
            size="small"
            to="/"
            class="font-weight-bold text-none"
            title="Ir al mostrador rápido"
          >
            <v-icon icon="mdi-keyboard-outline" start size="small" />
            Mostrador Rápido
          </v-btn>

          <!-- Limpiar -->
          <v-btn
            icon="mdi-delete-sweep-outline"
            color="error"
            variant="text"
            size="small"
            title="Vaciar carrito"
            :disabled="cartStore.items.length === 0"
            @click="confirmClearDialog = true"
          />
        </div>
      </div>

      <!-- ALERTA DE PRESUPUESTO CARGADO EN EDICIÓN ACTIVA -->
      <v-alert
        v-if="cartStore.isEditingOrder"
        density="compact"
        :color="cartStore.voucherType === 'PRESUPUESTO' ? 'amber-lighten-5' : 'blue-lighten-5'"
        :class="cartStore.voucherType === 'PRESUPUESTO' ? 'border-amber border-b' : 'border-blue border-b'"
        class="py-2 px-3 rounded-0"
      >
        <template #prepend>
          <v-icon
            :icon="cartStore.voucherType === 'PRESUPUESTO' ? 'mdi-file-document-edit' : 'mdi-cart-arrow-down'"
            :color="cartStore.voucherType === 'PRESUPUESTO' ? 'amber-darken-4' : 'primary'"
            size="small"
          />
        </template>
        <div class="d-flex flex-wrap align-center justify-space-between w-100 ga-2">
          <div>
            <strong :class="cartStore.voucherType === 'PRESUPUESTO' ? 'text-amber-darken-4' : 'text-primary'">
              {{ cartStore.voucherType === 'PRESUPUESTO'
                ? `Editando Presupuesto ${cartStore.activeOrderNumber}`
                : `Convirtiendo Presupuesto ${cartStore.activeOrderNumber} a Venta Definitiva` }}
            </strong>
            <span class="text-caption ml-2 text-grey-darken-2 d-none d-sm-inline">
              (Los cambios se aplicarán al guardar o confirmar)
            </span>
          </div>
          <div class="d-flex ga-1">
            <v-btn
              v-if="cartStore.voucherType === 'PRESUPUESTO'"
              size="x-small"
              color="amber-darken-3"
              variant="flat"
              class="font-weight-bold text-white text-none"
              @click="handleUpdateActivePresupuesto"
            >
              <v-icon icon="mdi-content-save-check" start size="x-small" />
              Guardar Cambios
            </v-btn>
            <v-btn
              v-else
              size="x-small"
              color="primary"
              variant="flat"
              class="font-weight-bold text-white text-none"
              @click="openCheckoutDialog"
            >
              <v-icon icon="mdi-cash-check" start size="x-small" />
              Cobrar Venta [F2]
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="grey-darken-2"
              class="font-weight-bold text-none"
              @click="cartStore.discardActiveEditing()"
            >
              Descartar
            </v-btn>
          </div>
        </div>
      </v-alert>
    </v-card>

    <v-row dense>
      <!-- COLUMNA PRINCIPAL (7 u 8 cols en desktop): Búsqueda, Ítems y Carrito -->
      <v-col cols="12" lg="8" xl="9">
        <!-- BARRA DE CONDICIONES Y CLIENTE (COMPACTA) -->
        <v-card elevation="1" class="mb-3 rounded-lg border">
          <v-card-text class="pa-3">
            <v-row dense align="center">
              <!-- Cliente -->
              <v-col cols="12" sm="6" md="5">
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-1 d-flex align-center justify-space-between">
                  <span>CLIENTE / RECEPTOR</span>
                  <a
                    href="#"
                    class="text-caption text-primary text-decoration-none font-weight-bold"
                    @click.prevent="openCustomerModal"
                  >
                    Cambiar / Buscar
                  </a>
                </div>
                <div class="d-flex align-center bg-grey-lighten-4 px-2 py-1 rounded border">
                  <v-icon icon="mdi-account" size="small" class="mr-2 text-primary" />
                  <div class="overflow-hidden flex-grow-1">
                    <div class="text-body-2 font-weight-black text-truncate">
                      {{ cartStore.customer.name }}
                    </div>
                    <div class="text-2xs text-grey-darken-1 text-truncate">
                      {{ cartStore.customer.taxCondition }} {{ cartStore.customer.docNumber ? '• ' + cartStore.customer.docNumber : '' }}
                      {{ cartStore.customer.phone ? '• Tel: ' + cartStore.customer.phone : '' }}
                    </div>
                  </div>
                  <v-btn
                    icon="mdi-pencil-outline"
                    size="x-small"
                    variant="text"
                    color="grey-darken-2"
                    title="Editar o buscar cliente"
                    @click="openCustomerModal"
                  />
                </div>
              </v-col>

              <!-- Modalidad de Precio (Minorista / Mayorista) -->
              <v-col cols="6" sm="3" md="2">
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-1">LISTA [F8]</div>
                <v-btn
                  block
                  size="small"
                  :color="cartStore.priceMode === 'wholesale' ? 'secondary' : 'primary'"
                  variant="tonal"
                  class="font-weight-black text-none"
                  @click="cartStore.togglePriceMode()"
                >
                  <v-icon icon="mdi-tag-multiple-outline" start size="small" />
                  {{ cartStore.priceMode === 'wholesale' ? 'Mayorista' : 'Minorista' }}
                </v-btn>
              </v-col>

              <!-- Validez de la Oferta -->
              <v-col cols="6" sm="3" md="2" v-if="cartStore.voucherType === 'PRESUPUESTO'">
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-1">VALIDEZ</div>
                <v-select
                  v-model="validityDays"
                  :items="validityOptions"
                  item-title="title"
                  item-value="value"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <!-- Notas Rápidas / Condiciones de entrega -->
              <v-col cols="12" :md="cartStore.voucherType === 'PRESUPUESTO' ? 3 : 5">
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-1">CONDICIÓN / NOTA</div>
                <v-text-field
                  v-model="quoteNotes"
                  placeholder="Ej. Entrega en obra / Contado"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- SECCIÓN DE BÚSQUEDA Y AGREGADO RÁPIDO DE PRODUCTOS -->
        <v-card elevation="1" class="mb-3 rounded-lg border">
          <v-card-text class="pa-3">
            <v-row dense align="center">
              <!-- Autocomplete / Buscador en catálogo -->
              <v-col cols="12" sm="7" md="8">
                <v-autocomplete
                  ref="productSearchInput"
                  v-model="selectedProductToAdd"
                  :items="productStore.products"
                  item-title="name"
                  return-object
                  label="Buscar producto por SKU, Código de barras o Nombre..."
                  placeholder="Escribí para buscar en inventario..."
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  :custom-filter="customProductFilter"
                  @update:model-value="onProductSelected"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" density="compact" class="py-1">
                      <template #prepend>
                        <v-chip
                          size="x-small"
                          label
                          class="mr-2 font-weight-bold font-mono"
                          color="grey-darken-3"
                          variant="tonal"
                        >
                          {{ item.raw.sku }}
                        </v-chip>
                      </template>
                      <v-list-item-title class="font-weight-medium text-body-2">
                        {{ item.raw.name }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="d-flex align-center text-caption ga-2">
                        <span :class="item.raw.stock > 0 ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
                          Stock: {{ item.raw.stock }} {{ item.raw.unit || 'u' }}
                        </span>
                        <span>•</span>
                        <span class="font-weight-bold text-primary">
                          $ {{ formatNumber(cartStore.priceMode === 'wholesale' && item.raw.wholesalePrice > 0 ? item.raw.wholesalePrice : item.raw.sellingPrice) }}
                        </span>
                        <span v-if="item.raw.brand" class="text-grey">• {{ item.raw.brand }}</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Cantidad a agregar -->
              <v-col cols="6" sm="2" md="2">
                <v-text-field
                  v-model.number="inputQuantity"
                  type="number"
                  min="0.01"
                  step="1"
                  label="Cantidad"
                  density="compact"
                  variant="outlined"
                  hide-details
                  @keydown.enter="addProductToCart"
                />
              </v-col>

              <!-- Botones: Agregar Producto + Ítem Personalizado -->
              <v-col cols="6" sm="3" md="2" class="d-flex ga-1">
                <v-btn
                  color="primary"
                  variant="flat"
                  size="small"
                  class="font-weight-bold flex-grow-1"
                  :disabled="!selectedProductToAdd"
                  @click="addProductToCart"
                >
                  <v-icon icon="mdi-plus" start size="small" />
                  Agregar
                </v-btn>

                <v-btn
                  color="secondary"
                  variant="tonal"
                  size="small"
                  icon="mdi-playlist-plus"
                  title="Agregar concepto libre / servicio no catalogado"
                  @click="openCustomItemDialog"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- TABLA COMPLETA Y DETALLADA DEL CARRITO / COTIZACIÓN -->
        <v-card elevation="2" class="rounded-lg border overflow-hidden">
          <div class="px-3 py-2 bg-grey-lighten-4 border-b d-flex justify-space-between align-center">
            <div class="font-weight-black text-subtitle-2 text-grey-darken-3 d-flex align-center">
              <v-icon icon="mdi-format-list-numbered" size="small" class="mr-1 text-primary" />
              Artículos en el Carrito ({{ cartStore.items.length }} ítems / {{ cartStore.itemCount }} unidades)
            </div>
            <div class="d-flex align-center ga-2">
              <v-btn
                size="x-small"
                variant="text"
                color="secondary"
                class="font-weight-bold text-none"
                @click="openCustomItemDialog"
              >
                <v-icon icon="mdi-plus-circle-outline" start size="x-small" />
                + Ítem Personalizado / Varios
              </v-btn>
            </div>
          </div>

          <!-- Estado Vacío -->
          <div v-if="cartStore.items.length === 0" class="text-center py-10 px-4">
            <v-avatar size="64" color="amber-lighten-5" class="mb-3 text-amber-darken-3">
              <v-icon icon="mdi-cart-outline" size="large" />
            </v-avatar>
            <div class="text-h6 font-weight-bold text-grey-darken-3 mb-1">
              El carrito de la cotización está vacío
            </div>
            <div class="text-body-2 text-grey mb-4" style="max-width: 480px; margin: 0 auto;">
              Buscá un producto en el buscador superior, o creá un concepto libre con el botón "+ Ítem Personalizado" (por ejemplo: Flete, Mano de Obra, etc.).
            </div>
            <div class="d-flex justify-center ga-2 flex-wrap">
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                class="font-weight-bold text-none"
                @click="focusProductSearch"
              >
                <v-icon icon="mdi-magnify" start size="small" />
                Buscar Productos
              </v-btn>
              <v-btn
                color="secondary"
                variant="flat"
                size="small"
                class="font-weight-bold text-none"
                @click="openCustomItemDialog"
              >
                <v-icon icon="mdi-plus" start size="small" />
                Agregar Ítem Libre
              </v-btn>
              <v-btn
                v-if="cartStore.presupuestosList.length > 0"
                color="amber-darken-3"
                variant="tonal"
                size="small"
                class="font-weight-bold text-none"
                @click="pendingQuotesDialog = true"
              >
                <v-icon icon="mdi-folder-open-outline" start size="small" />
                Cargar Presupuesto Guardado
              </v-btn>
            </div>
          </div>

          <!-- Tabla de Ítems -->
          <div v-else class="table-responsive">
            <v-table density="compact" hover class="quote-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-center font-weight-black" style="width: 45px;">#</th>
                  <th class="font-weight-black" style="width: 90px;">SKU</th>
                  <th class="font-weight-black">Descripción / Detalle</th>
                  <th class="text-center font-weight-black" style="width: 90px;">Stock</th>
                  <th class="text-right font-weight-black" style="width: 110px;">P. Base</th>
                  <th class="text-right font-weight-black" style="width: 125px;">P. Unit. Cotizado</th>
                  <th class="text-center font-weight-black" style="width: 120px;">Cantidad</th>
                  <th class="text-center font-weight-black" style="width: 90px;">% Bonif.</th>
                  <th class="text-right font-weight-black" style="width: 120px;">Subtotal</th>
                  <th class="text-center font-weight-black" style="width: 45px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in cartStore.items"
                  :key="item.id || idx"
                  :class="{ 'bg-amber-lighten-5': item.isCustom }"
                >
                  <!-- # -->
                  <td class="text-center text-caption text-grey font-weight-bold">
                    {{ idx + 1 }}
                  </td>

                  <!-- SKU -->
                  <td>
                    <v-chip
                      size="x-small"
                      label
                      :color="item.isCustom ? 'amber-darken-3' : 'grey-darken-3'"
                      variant="tonal"
                      class="font-weight-bold font-mono"
                    >
                      {{ item.sku }}
                    </v-chip>
                  </td>

                  <!-- Descripción y Notas -->
                  <td>
                    <div class="d-flex align-center">
                      <span class="font-weight-bold text-body-2 text-grey-darken-4">
                        {{ item.name }}
                      </span>
                      <v-chip
                        v-if="item.isCustom"
                        size="2xs"
                        color="amber-darken-4"
                        variant="flat"
                        class="ml-1 text-white font-weight-bold"
                      >
                        LIBRE
                      </v-chip>
                    </div>

                    <!-- Nota del renglón (editable con click o botón) -->
                    <div class="d-flex align-center mt-1">
                      <span
                        v-if="item.notes"
                        class="text-2xs text-amber-darken-4 font-italic bg-amber-lighten-4 px-1 rounded mr-1"
                      >
                        Nota: {{ item.notes }}
                      </span>
                      <a
                        href="#"
                        class="text-2xs text-grey text-decoration-none"
                        @click.prevent="promptItemNotes(idx)"
                      >
                        {{ item.notes ? 'Editar nota' : '+ Agregar nota' }}
                      </a>
                    </div>
                  </td>

                  <!-- Stock badge -->
                  <td class="text-center">
                    <v-chip
                      v-if="item.isCustom"
                      size="x-small"
                      color="grey"
                      variant="outlined"
                    >
                      N/A
                    </v-chip>
                    <v-chip
                      v-else-if="item.stock <= 0"
                      size="x-small"
                      color="error"
                      variant="flat"
                      class="font-weight-bold"
                      title="Sin existencia en inventario. Presupuestable sin descontar stock."
                    >
                      0 {{ item.unit || 'u' }}
                    </v-chip>
                    <v-chip
                      v-else-if="item.quantity > item.stock"
                      size="x-small"
                      color="warning"
                      variant="flat"
                      class="font-weight-bold"
                      :title="'Stock insuficiente para venta inmediata (' + item.stock + ' disp.)'"
                    >
                      {{ item.stock }} {{ item.unit || 'u' }}
                    </v-chip>
                    <v-chip
                      v-else
                      size="x-small"
                      color="success"
                      variant="tonal"
                      class="font-weight-bold"
                    >
                      {{ item.stock }} {{ item.unit || 'u' }}
                    </v-chip>
                  </td>

                  <!-- P. Base de Lista -->
                  <td class="text-right text-caption text-grey-darken-1 font-mono">
                    $ {{ formatNumber(getBaseItemPrice(item)) }}
                  </td>

                  <!-- P. Unitario Cotizado (Editable) -->
                  <td class="text-right">
                    <v-text-field
                      :model-value="getEffectiveItemBasePrice(item)"
                      type="number"
                      min="0"
                      step="1"
                      prefix="$"
                      density="compact"
                      variant="plain"
                      hide-details
                      class="font-mono font-weight-bold price-input"
                      @update:model-value="val => onPriceChange(idx, val)"
                    />
                  </td>

                  <!-- Cantidad con Steppers -->
                  <td>
                    <div class="d-flex align-center justify-center ga-1">
                      <v-btn
                        icon="mdi-minus"
                        size="20"
                        variant="tonal"
                        color="grey-darken-2"
                        @click="cartStore.updateQuantity(idx, item.quantity - 1)"
                      />
                      <input
                        type="number"
                        min="0.01"
                        step="1"
                        :value="item.quantity"
                        class="qty-input text-center font-weight-bold font-mono"
                        @change="e => cartStore.updateQuantity(idx, parseFloat(e.target.value) || 1)"
                      />
                      <v-btn
                        icon="mdi-plus"
                        size="20"
                        variant="tonal"
                        color="primary"
                        @click="cartStore.updateQuantity(idx, item.quantity + 1)"
                      />
                    </div>
                  </td>

                  <!-- % Bonif / Descuento de Renglón -->
                  <td class="text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      :value="item.discountPercent || 0"
                      placeholder="0"
                      class="discount-input text-center font-mono"
                      @change="e => cartStore.updateItemDiscount(idx, parseFloat(e.target.value) || 0)"
                    />
                    <span class="text-2xs text-grey ml-1">%</span>
                  </td>

                  <!-- Subtotal de Línea -->
                  <td class="text-right font-weight-black font-mono text-body-2 text-primary">
                    $ {{ formatNumber(getItemLineSubtotal(item)) }}
                  </td>

                  <!-- Eliminar Ítem -->
                  <td class="text-center">
                    <v-btn
                      icon="mdi-close"
                      size="24"
                      variant="text"
                      color="error"
                      title="Quitar artículo"
                      @click="cartStore.removeItem(idx)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card>
      </v-col>

      <!-- COLUMNA LATERAL (4 o 3 cols en desktop): Resumen Financiero y Acciones -->
      <v-col cols="12" lg="4" xl="3">
        <!-- TARJETA DE RESUMEN FINANCIERO -->
        <v-card elevation="3" class="rounded-lg border mb-3 summary-card">
          <div class="px-3 py-2 bg-grey-lighten-4 border-b d-flex justify-space-between align-center">
            <span class="font-weight-black text-subtitle-2 text-grey-darken-3">
              RESUMEN COMERCIAL
            </span>
            <v-chip
              size="x-small"
              :color="cartStore.priceMode === 'wholesale' ? 'secondary' : 'primary'"
              variant="flat"
              class="font-weight-black text-white"
            >
              {{ cartStore.priceMode === 'wholesale' ? 'LISTA MAYORISTA' : 'LISTA MINORISTA' }}
            </v-chip>
          </div>

          <v-card-text class="pa-3">
            <!-- Desglose Financiero -->
            <div class="d-flex justify-space-between py-1 text-body-2 text-grey-darken-2 border-b">
              <span>Subtotal Bruto:</span>
              <span class="font-mono font-weight-medium">$ {{ formatNumber(cartStore.grossSubtotal) }}</span>
            </div>

            <div
              v-if="cartStore.lineDiscountsTotal > 0"
              class="d-flex justify-space-between py-1 text-body-2 text-success border-b"
            >
              <span>Bonificaciones por Ítem:</span>
              <span class="font-mono font-weight-bold">- $ {{ formatNumber(cartStore.lineDiscountsTotal) }}</span>
            </div>

            <!-- Descuento Global del Pedido (%) -->
            <div class="py-2 border-b">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2 font-weight-bold text-grey-darken-3">Descuento Global:</span>
                <span class="text-caption font-weight-bold text-success" v-if="cartStore.discountAmount > 0">
                  - $ {{ formatNumber(cartStore.discountAmount) }}
                </span>
              </div>
              <v-row dense align="center">
                <v-col cols="6">
                  <v-text-field
                    v-model.number="cartStore.discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    suffix="%"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="0"
                  />
                </v-col>
                <v-col cols="6" class="d-flex ga-1">
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    :color="cartStore.discountPercent === 5 ? 'primary' : 'grey'"
                    class="font-weight-bold px-1"
                    @click="cartStore.discountPercent = cartStore.discountPercent === 5 ? 0 : 5"
                  >
                    5%
                  </v-btn>
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    :color="cartStore.discountPercent === 10 ? 'primary' : 'grey'"
                    class="font-weight-bold px-1"
                    @click="cartStore.discountPercent = cartStore.discountPercent === 10 ? 0 : 10"
                  >
                    10%
                  </v-btn>
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    :color="cartStore.discountPercent === 15 ? 'primary' : 'grey'"
                    class="font-weight-bold px-1"
                    @click="cartStore.discountPercent = cartStore.discountPercent === 15 ? 0 : 15"
                  >
                    15%
                  </v-btn>
                </v-col>
              </v-row>
            </div>

            <!-- Referencias Impositivas -->
            <div class="py-2 text-caption text-grey-darken-1 border-b">
              <div class="d-flex justify-space-between">
                <span>Neto Gravado (Estimativo):</span>
                <span class="font-mono">$ {{ formatNumber(cartStore.netWithoutIva) }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span>IVA 21% (Estimativo):</span>
                <span class="font-mono">$ {{ formatNumber(cartStore.estimatedIva) }}</span>
              </div>
            </div>

            <!-- TOTAL DEFINITIVO -->
            <div class="pa-3 my-2 rounded-lg bg-grey-lighten-4 border d-flex justify-space-between align-center">
              <div>
                <div class="text-caption text-grey-darken-2 font-weight-bold">TOTAL DEFINITIVO</div>
                <div class="text-2xs text-grey">
                  {{ cartStore.items.length }} ítems • {{ cartStore.itemCount }} unidades
                </div>
              </div>
              <div class="text-h5 font-weight-black font-mono" :class="workflowColor + '--text'">
                $ {{ formatNumber(cartStore.total) }}
              </div>
            </div>

            <!-- REGLA DE NEGOCIO DESTACADA -->
            <div
              v-if="cartStore.voucherType === 'PRESUPUESTO'"
              class="bg-amber-lighten-5 border border-amber rounded pa-2 text-2xs text-amber-darken-4 mb-3 d-flex align-start"
            >
              <v-icon icon="mdi-information-outline" size="small" class="mr-1 mt-0-5 flex-shrink-0" />
              <span>
                <strong>Importante:</strong> Guardar o generar este Presupuesto <strong>NO descuenta stock</strong>. El stock solo se descontará cuando se convierta a Venta o Remito.
              </span>
            </div>

            <!-- BOTONERA DE ACCIÓN PRINCIPAL -->
            <div class="d-flex flex-column ga-2">
              <!-- CASO 1: MODO PRESUPUESTO -->
              <template v-if="cartStore.voucherType === 'PRESUPUESTO'">
                <v-btn
                  color="amber-darken-3"
                  variant="flat"
                  size="large"
                  block
                  class="font-weight-black text-white text-none shadow-sm"
                  :disabled="cartStore.items.length === 0"
                  @click="handleSavePresupuesto"
                >
                  <v-icon icon="mdi-content-save-check" start />
                  {{ cartStore.isEditingPresupuesto ? 'Guardar Cambios Presupuesto [F6]' : 'Guardar Presupuesto [F6]' }}
                </v-btn>

                <v-btn
                  color="amber-darken-4"
                  variant="tonal"
                  size="default"
                  block
                  class="font-weight-bold text-none"
                  :disabled="cartStore.items.length === 0"
                  @click="handleDownloadPdfDirect"
                >
                  <v-icon icon="mdi-file-pdf-box" start size="small" />
                  Descargar PDF Cotización (A4)
                </v-btn>

                <v-divider class="my-1" />

                <!-- Botón de Transformación Directa a Venta -->
                <v-btn
                  color="primary"
                  variant="flat"
                  size="default"
                  block
                  class="font-weight-black text-none"
                  :disabled="cartStore.items.length === 0"
                  @click="convertToSaleAndOpenCheckout"
                >
                  <v-icon icon="mdi-cart-arrow-right" start />
                  Pasar a Venta y Cobrar [F2]
                </v-btn>
              </template>

              <!-- CASO 2: MODO VENTA DIRECTA (TICKET_X) -->
              <template v-else-if="cartStore.voucherType === 'TICKET_X'">
                <v-btn
                  color="primary"
                  variant="flat"
                  size="large"
                  block
                  class="font-weight-black text-white text-none shadow-sm"
                  :disabled="cartStore.items.length === 0"
                  @click="openCheckoutDialog"
                >
                  <v-icon icon="mdi-cash-check" start />
                  Cobrar y Emitir Ticket [F2]
                </v-btn>

                <v-btn
                  color="amber-darken-3"
                  variant="tonal"
                  size="default"
                  block
                  class="font-weight-bold text-none"
                  @click="cartStore.voucherType = 'PRESUPUESTO'"
                >
                  <v-icon icon="mdi-arrow-left-top" start size="small" />
                  Cambiar a Modo Presupuesto
                </v-btn>
              </template>

              <!-- CASO 3: MODO REMITO DE ENTREGA -->
              <template v-else-if="cartStore.voucherType === 'REMITO'">
                <v-btn
                  color="amber-darken-4"
                  variant="flat"
                  size="large"
                  block
                  class="font-weight-black text-white text-none shadow-sm"
                  :disabled="cartStore.items.length === 0"
                  @click="openRemitoDialog"
                >
                  <v-icon icon="mdi-truck-check" start />
                  Despachar Remito de Entrega
                </v-btn>

                <v-btn
                  color="grey-darken-2"
                  variant="tonal"
                  size="default"
                  block
                  class="font-weight-bold text-none"
                  @click="cartStore.voucherType = 'PRESUPUESTO'"
                >
                  <v-icon icon="mdi-arrow-left-top" start size="small" />
                  Volver a Presupuesto
                </v-btn>
              </template>
            </div>
          </v-card-text>
        </v-card>

        <!-- ATAJOS DE TECLADO RÁPIDOS -->
        <v-card elevation="1" class="rounded-lg border pa-2 bg-grey-lighten-4">
          <div class="text-caption font-weight-black text-grey-darken-3 mb-1 d-flex align-center">
            <v-icon icon="mdi-keyboard" size="small" class="mr-1" />
            Atajos de Teclado
          </div>
          <div class="d-flex flex-wrap ga-2 text-2xs text-grey-darken-2">
            <div><kbd class="kbd-badge">F2</kbd> Cobrar / Venta</div>
            <div><kbd class="kbd-badge">F6</kbd> Guardar Presupuesto</div>
            <div><kbd class="kbd-badge">F8</kbd> Mayorista/Minorista</div>
            <div><kbd class="kbd-badge">Esc</kbd> Cerrar diálogos</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- DIÁLOGO: AGREGAR ÍTEM PERSONALIZADO / LIBRE -->
    <v-dialog v-model="customItemDialog" max-width="540" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-secondary text-white font-weight-black py-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-playlist-plus" class="mr-2" />
            <span>Agregar Ítem Libre / Servicio Especial</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="customItemDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="text-caption text-grey-darken-2 mb-3">
            Podés agregar cualquier servicio, mano de obra, flete o artículo a medida sin necesidad de cargarlo en el inventario fijo.
          </div>

          <v-row dense>
            <v-col cols="12">
              <v-text-field
                ref="customNameInput"
                v-model="customItemForm.name"
                label="Descripción del concepto *"
                placeholder="Ej. Flete a obra / Mano de obra corte a medida"
                density="compact"
                variant="outlined"
                autofocus
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model.number="customItemForm.price"
                type="number"
                min="0"
                step="1"
                prefix="$"
                label="Precio Unitario *"
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model.number="customItemForm.quantity"
                type="number"
                min="0.01"
                step="1"
                label="Cantidad *"
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="customItemForm.unit"
                label="Unidad de medida"
                placeholder="u, hs, km, m..."
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model.number="customItemForm.discountPercent"
                type="number"
                min="0"
                max="100"
                suffix="%"
                label="% Bonif. de línea"
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="customItemForm.notes"
                label="Nota o aclaración en el renglón"
                placeholder="Ej. Incluye descarga en planta baja"
                density="compact"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="bg-grey-lighten-4 pa-2 rounded mt-2 d-flex justify-space-between align-center">
            <span class="text-caption font-weight-bold">Subtotal previsto de la línea:</span>
            <span class="text-subtitle-1 font-weight-black font-mono text-primary">
              $ {{ formatNumber(getCustomItemTotal()) }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 justify-end ga-2">
          <v-btn variant="outlined" color="grey" @click="customItemDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="secondary"
            variant="flat"
            class="font-weight-black px-4"
            :disabled="!customItemForm.name || customItemForm.price <= 0"
            @click="addCustomItemToCart"
          >
            <v-icon icon="mdi-check" start />
            Agregar al Carrito
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: COBRO Y CIERRE DE VENTA [F2] -->
    <v-dialog v-model="checkoutDialog" max-width="520" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-primary text-white font-weight-black py-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-cash-register" class="mr-2" />
            <span>Confirmar y Cobrar Venta Mostrador</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="checkoutDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Total en grande -->
          <div class="pa-3 bg-blue-lighten-5 rounded-lg border border-blue text-center mb-3">
            <div class="text-caption text-primary font-weight-bold">IMPORTE TOTAL A COBRAR</div>
            <div class="text-h4 font-weight-black font-mono text-primary">
              $ {{ formatNumber(cartStore.total) }}
            </div>
            <div class="text-caption text-grey-darken-1">
              Cliente: <strong>{{ cartStore.customer.name }}</strong>
            </div>
          </div>

          <!-- Medio de Pago -->
          <div class="text-caption font-weight-bold text-grey-darken-2 mb-1">FORMA DE PAGO</div>
          <v-select
            v-model="cartStore.paymentMethod"
            :items="paymentMethods"
            density="compact"
            variant="outlined"
            class="mb-3"
            hide-details
          />

          <!-- Calculadora de Vuelto para Efectivo -->
          <div v-if="cartStore.paymentMethod === 'EFECTIVO'" class="mb-3 pa-3 bg-grey-lighten-4 rounded border">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-1">DINERO RECIBIDO</div>
            <v-text-field
              v-model.number="cashReceived"
              type="number"
              prefix="$"
              density="compact"
              variant="outlined"
              hide-details
              class="font-mono font-weight-bold mb-2"
              placeholder="Importe entregado por el cliente"
            />

            <!-- Botones de montos sugeridos -->
            <div class="d-flex ga-1 flex-wrap mb-2">
              <v-btn size="x-small" variant="tonal" color="primary" @click="cashReceived = cartStore.total">
                Exacto
              </v-btn>
              <v-btn size="x-small" variant="tonal" color="grey-darken-3" @click="cashReceived = roundUpTo(cartStore.total, 1000)">
                $ {{ formatNumber(roundUpTo(cartStore.total, 1000)) }}
              </v-btn>
              <v-btn size="x-small" variant="tonal" color="grey-darken-3" @click="cashReceived = roundUpTo(cartStore.total, 5000)">
                $ {{ formatNumber(roundUpTo(cartStore.total, 5000)) }}
              </v-btn>
              <v-btn size="x-small" variant="tonal" color="grey-darken-3" @click="cashReceived = roundUpTo(cartStore.total, 10000)">
                $ {{ formatNumber(roundUpTo(cartStore.total, 10000)) }}
              </v-btn>
            </div>

            <!-- Vuelto -->
            <div class="d-flex justify-space-between align-center pt-2 border-t">
              <span class="text-body-2 font-weight-bold">Vuelto a entregar:</span>
              <span
                class="text-h6 font-weight-black font-mono"
                :class="cashChange >= 0 ? 'text-success' : 'text-error'"
              >
                $ {{ formatNumber(Math.max(0, cashChange)) }}
              </span>
            </div>
          </div>

          <!-- Nota de Venta opcional -->
          <v-text-field
            v-model="saleNotes"
            label="Observación en comprobante (opcional)"
            placeholder="Ej. Facturado s/presupuesto previo"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 justify-end ga-2">
          <v-btn variant="outlined" color="grey" @click="checkoutDialog = false">
            Volver
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            class="font-weight-black px-4 text-white"
            :loading="isProcessingCheckout"
            :disabled="cartStore.paymentMethod === 'EFECTIVO' && cashReceived > 0 && cashChange < 0"
            @click="confirmSaleCheckout"
          >
            <v-icon icon="mdi-check-circle" start />
            Confirmar y Emitir Ticket
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: DESPACHAR REMITO -->
    <v-dialog v-model="remitoDialog" max-width="500" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-amber-darken-4 text-white font-weight-black py-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-truck-delivery" class="mr-2" />
            <span>Datos del Remito de Entrega</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="remitoDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="text-caption text-grey-darken-2 mb-3">
            El remito descuenta el stock de las cantidades detalladas y genera el comprobante de traslado oficial.
          </div>

          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="remitoForm.deliveryAddress"
                label="Dirección de entrega / Obra *"
                placeholder="Calle, altura, localidad"
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="remitoForm.carrier"
                label="Transporte / Chofer asignado"
                placeholder="Ej. Flete propio / Camión #2"
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="remitoForm.notes"
                label="Observaciones de entrega"
                placeholder="Ej. Recibe encargado de obra"
                rows="2"
                density="compact"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 justify-end ga-2">
          <v-btn variant="outlined" color="grey" @click="remitoDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="amber-darken-4"
            variant="flat"
            class="font-weight-black px-4 text-white"
            :loading="isProcessingRemito"
            @click="confirmRemitoCheckout"
          >
            <v-icon icon="mdi-truck-check" start />
            Emitir Remito y Descontar Stock
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: EXPLORADOR DE PRESUPUESTOS GUARDADOS -->
    <v-dialog v-model="pendingQuotesDialog" max-width="840">
      <v-card class="rounded-lg">
        <v-card-title class="bg-amber-darken-3 text-white font-weight-black py-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-folder-clock-outline" class="mr-2" />
            <span>Presupuestos y Cotizaciones Guardadas</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="pendingQuotesDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row dense class="mb-3" align="center">
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="quotesFilterQuery"
                placeholder="Buscar por N° comprobante o cliente..."
                density="compact"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="12" sm="4" class="text-right">
              <v-chip size="small" color="amber-darken-4" variant="tonal" class="font-weight-bold">
                {{ filteredPendingQuotes.length }} presupuestos disponibles
              </v-chip>
            </v-col>
          </v-row>

          <div v-if="filteredPendingQuotes.length === 0" class="text-center py-8 text-grey">
            <v-icon icon="mdi-file-search-outline" size="48" class="mb-2" />
            <div class="font-weight-bold">No hay presupuestos guardados que coincidan.</div>
          </div>

          <v-table v-else density="compact" hover>
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="font-weight-black">N° Cto.</th>
                <th class="font-weight-black">Fecha</th>
                <th class="font-weight-black">Cliente</th>
                <th class="font-weight-black">Validez</th>
                <th class="text-right font-weight-black">Total</th>
                <th class="text-center font-weight-black">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="quote in filteredPendingQuotes" :key="quote.id">
                <td class="font-mono font-weight-bold text-amber-darken-4">
                  {{ quote.orderNumber }}
                </td>
                <td class="text-caption text-grey-darken-2">
                  {{ formatDate(quote.createdAt) }}
                </td>
                <td class="font-weight-medium">
                  {{ quote.customer?.name || 'Consumidor Final' }}
                </td>
                <td>
                  <v-chip
                    size="x-small"
                    :color="isQuoteExpired(quote.validUntil) ? 'error' : 'amber-darken-3'"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    {{ formatValidityLabel(quote.validUntil) }}
                  </v-chip>
                </td>
                <td class="text-right font-mono font-weight-black text-primary">
                  $ {{ formatNumber(quote.total) }}
                </td>
                <td class="text-center">
                  <div class="d-flex justify-center ga-1">
                    <v-btn
                      size="x-small"
                      color="primary"
                      variant="tonal"
                      class="font-weight-bold text-none"
                      title="Cargar en el armador"
                      @click="loadQuoteIntoCart(quote.id)"
                    >
                      <v-icon icon="mdi-cart-arrow-down" start size="x-small" />
                      Cargar
                    </v-btn>

                    <v-btn
                      icon="mdi-file-pdf-box"
                      size="x-small"
                      color="amber-darken-4"
                      variant="text"
                      title="Descargar PDF"
                      @click="downloadPdfForQuote(quote)"
                    />

                    <v-btn
                      icon="mdi-delete-outline"
                      size="x-small"
                      color="error"
                      variant="text"
                      title="Eliminar presupuesto"
                      @click="deleteQuote(quote.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="outlined" color="grey" @click="pendingQuotesDialog = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: COMPROBANTE GENERADO CON ÉXITO -->
    <v-dialog v-model="successDialog" max-width="480" persistent>
      <v-card class="rounded-lg text-center pa-4">
        <v-avatar size="64" :color="lastGeneratedVoucher?.voucherType === 'PRESUPUESTO' ? 'amber-lighten-4' : 'green-lighten-4'" class="mx-auto mb-3">
          <v-icon
            :icon="lastGeneratedVoucher?.voucherType === 'PRESUPUESTO' ? 'mdi-file-document-check' : 'mdi-check-decagram'"
            :color="lastGeneratedVoucher?.voucherType === 'PRESUPUESTO' ? 'amber-darken-3' : 'success'"
            size="large"
          />
        </v-avatar>

        <div class="text-h6 font-weight-black text-grey-darken-4 mb-1">
          {{ lastGeneratedVoucher?.voucherType === 'PRESUPUESTO' ? '¡Presupuesto Guardado con Éxito!' : '¡Venta Registrada Exitosamente!' }}
        </div>

        <div class="text-body-2 text-grey mb-3">
          Comprobante <strong>#{{ lastGeneratedVoucher?.voucherNumber || lastGeneratedVoucher?.orderNumber }}</strong> para <strong>{{ lastGeneratedVoucher?.customer?.name }}</strong>
        </div>

        <div class="pa-3 bg-grey-lighten-4 rounded border mb-4 font-mono font-weight-black text-h5 text-primary">
          $ {{ formatNumber(lastGeneratedVoucher?.total) }}
        </div>

        <div class="d-flex flex-column ga-2">
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            class="font-weight-black text-white text-none"
            @click="downloadLastVoucherPdf"
          >
            <v-icon icon="mdi-file-pdf-box" start />
            Descargar Comprobante PDF (A4)
          </v-btn>

          <v-btn
            variant="outlined"
            color="grey-darken-3"
            class="font-weight-bold text-none"
            @click="finishSuccessAndNewQuote"
          >
            <v-icon icon="mdi-plus" start size="small" />
            Comenzar Nuevo Presupuesto
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: MODAL DE CLIENTES -->
    <v-dialog v-model="customerModal" max-width="600">
      <v-card class="rounded-lg">
        <v-card-title class="bg-primary text-white font-weight-black py-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-account-group" class="mr-2" />
            <span>Seleccionar o Crear Cliente</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="customerModal = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <v-text-field
            v-model="customerSearchQuery"
            placeholder="Buscar por Nombre, CUIT, DNI o Teléfono..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            class="mb-3"
            hide-details
            clearable
          />

          <v-list density="compact" class="border rounded mb-3" max-height="240">
            <v-list-item
              v-for="c in filteredCustomerList"
              :key="c.id"
              :active="cartStore.customer.id === c.id"
              @click="selectCustomer(c)"
            >
              <template #prepend>
                <v-icon icon="mdi-account" class="mr-2 text-primary" />
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ c.name || c.nombre }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ c.taxCondition || c.condicion_iva }} {{ c.documentNumber || c.numero_documento ? '• ' + (c.documentNumber || c.numero_documento) : '' }}
                {{ c.phone || c.telefono ? '• Tel: ' + (c.phone || c.telefono) : '' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-3" />

          <!-- Formulario rápido de cliente ad-hoc -->
          <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">
            O CARGAR DATOS DEL CLIENTE PARA ESTA COTIZACIÓN:
          </div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="quickCustomer.name"
                label="Nombre / Razón Social *"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-select
                v-model="quickCustomer.docType"
                :items="['DNI', 'CUIT', 'CUIL', 'CF']"
                label="Tipo Doc"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model="quickCustomer.docNumber"
                label="Número"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="quickCustomer.taxCondition"
                :items="['CONSUMIDOR_FINAL', 'RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO']"
                label="Condición IVA"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="quickCustomer.phone"
                label="Teléfono"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="quickCustomer.address"
                label="Dirección"
                density="compact"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 justify-end ga-2">
          <v-btn variant="outlined" color="grey" @click="customerModal = false">
            Cerrar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="font-weight-black px-4"
            :disabled="!quickCustomer.name"
            @click="applyQuickCustomer"
          >
            Aplicar Cliente
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: CONFIRMAR VACIADO DE CARRITO -->
    <v-dialog v-model="confirmClearDialog" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title class="font-weight-black">¿Vaciar Carrito?</v-card-title>
        <v-card-text class="text-body-2 text-grey-darken-2">
          Se borrarán todos los artículos cargados en la sesión actual. Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" color="grey" @click="confirmClearDialog = false">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="flat"
            class="font-weight-bold"
            @click="clearCurrentCart"
          >
            Vaciar Carrito
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import { useProductStore } from '@/stores/productStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useBusinessStore } from '@/stores/businessStore';
import { generateVoucherPdf } from '@/utils/pdfGenerator';

const cartStore = useCartStore();
const productStore = useProductStore();
const customerStore = useCustomerStore();
const businessStore = useBusinessStore();

// Referencias a elementos
const productSearchInput = ref(null);
const customNameInput = ref(null);

// Inputs de control rápido
const selectedProductToAdd = ref(null);
const inputQuantity = ref(1);
const quoteNotes = ref('');
const validityDays = ref(15);
const saleNotes = ref('');
const cashReceived = ref(0);

// Diálogos reactivos
const customItemDialog = ref(false);
const checkoutDialog = ref(false);
const remitoDialog = ref(false);
const pendingQuotesDialog = ref(false);
const successDialog = ref(false);
const customerModal = ref(false);
const confirmClearDialog = ref(false);

const isProcessingCheckout = ref(false);
const isProcessingRemito = ref(false);
const lastGeneratedVoucher = ref(null);

// Filtros y búsquedas
const quotesFilterQuery = ref('');
const customerSearchQuery = ref('');

// Formulario de Ítem Personalizado
const customItemForm = ref({
  name: '',
  price: 0,
  quantity: 1,
  unit: 'u',
  discountPercent: 0,
  notes: ''
});

// Formulario de Remito
const remitoForm = ref({
  deliveryAddress: '',
  carrier: '',
  notes: ''
});

// Formulario Rápido de Cliente
const quickCustomer = ref({
  name: '',
  docType: 'DNI',
  docNumber: '',
  taxCondition: 'CONSUMIDOR_FINAL',
  phone: '',
  address: ''
});

// Opciones de validez
const validityOptions = [
  { title: '7 días', value: 7 },
  { title: '15 días (Recomendado)', value: 15 },
  { title: '30 días', value: 30 },
  { title: '60 días', value: 60 },
  { title: 'Sin vencimiento', value: 0 }
];

// Opciones de medios de pago
const paymentMethods = [
  { title: 'Efectivo', value: 'EFECTIVO' },
  { title: 'Tarjeta de Débito', value: 'TARJETA_DEBITO' },
  { title: 'Tarjeta de Crédito', value: 'TARJETA_CREDITO' },
  { title: 'Transferencia / QR', value: 'TRANSFERENCIA' },
  { title: 'Cuenta Corriente', value: 'CUENTA_CORRIENTE' }
];

// COMPUTADOS ESTÉTICOS
const workflowColor = computed(() => {
  if (cartStore.voucherType === 'PRESUPUESTO') return 'amber-darken-3';
  if (cartStore.voucherType === 'REMITO') return 'amber-darken-4';
  return 'primary';
});

const workflowIcon = computed(() => {
  if (cartStore.voucherType === 'PRESUPUESTO') return 'mdi-file-document-edit';
  if (cartStore.voucherType === 'REMITO') return 'mdi-truck-delivery';
  return 'mdi-point-of-sale';
});

const cashChange = computed(() => {
  if (!cashReceived.value) return 0;
  return Number(cashReceived.value) - cartStore.total;
});

const filteredPendingQuotes = computed(() => {
  const list = cartStore.presupuestosList;
  const q = (quotesFilterQuery.value || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter(item =>
    (item.orderNumber && item.orderNumber.toLowerCase().includes(q)) ||
    (item.customer?.name && item.customer.name.toLowerCase().includes(q))
  );
});

const filteredCustomerList = computed(() => {
  const q = (customerSearchQuery.value || '').trim().toLowerCase();
  const list = customerStore.customers || [];
  if (!q) return list;
  return list.filter(c =>
    (c.nombre || c.name || '').toLowerCase().includes(q) ||
    (c.numero_documento || c.documentNumber || '').toLowerCase().includes(q) ||
    (c.telefono || c.phone || '').toLowerCase().includes(q)
  );
});

// FORMATEADORES
function formatNumber(num) {
  return Number(num || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatValidityLabel(validUntil) {
  if (!validUntil) return 'Sin vencimiento';
  const d = new Date(validUntil);
  return 'Hasta ' + d.toLocaleDateString('es-AR');
}

function isQuoteExpired(validUntil) {
  if (!validUntil) return false;
  return new Date(validUntil).getTime() < Date.now();
}

function roundUpTo(amount, base) {
  if (!amount || amount <= 0) return base;
  return Math.ceil(amount / base) * base;
}

// LÓGICA DE PRECIOS Y CÁLCULOS
function getBaseItemPrice(item) {
  return cartStore.priceMode === 'wholesale' && item.wholesalePrice > 0
    ? item.wholesalePrice
    : item.sellingPrice;
}

function getEffectiveItemBasePrice(item) {
  if (item.customUnitPrice !== undefined && item.customUnitPrice !== null) {
    return item.customUnitPrice;
  }
  return getBaseItemPrice(item);
}

function getItemLineSubtotal(item) {
  const price = getEffectiveItemBasePrice(item);
  const lineDiscount = Number(item.discountPercent || 0);
  const effectivePrice = Math.max(0, price * (1 - lineDiscount / 100));
  return effectivePrice * item.quantity;
}

function onPriceChange(idx, val) {
  const num = parseFloat(val);
  if (!isNaN(num) && num >= 0) {
    cartStore.updateItemPrice(idx, num);
  }
}

function promptItemNotes(idx) {
  const current = cartStore.items[idx]?.notes || '';
  const val = window.prompt('Observación para este renglón:', current);
  if (val !== null) {
    cartStore.updateItemNotes(idx, val);
  }
}

// BÚSQUEDA Y AGREGADO DE PRODUCTOS
function customProductFilter(itemTitle, queryText, item) {
  if (!queryText) return true;
  const q = queryText.toLowerCase().trim();
  const raw = item.raw;
  return (
    (raw.name && raw.name.toLowerCase().includes(q)) ||
    (raw.sku && raw.sku.toLowerCase().includes(q)) ||
    (raw.barcode && raw.barcode.toLowerCase().includes(q)) ||
    (raw.brand && raw.brand.toLowerCase().includes(q))
  );
}

function onProductSelected(product) {
  if (!product) return;
  addProductToCart();
}

function addProductToCart() {
  if (!selectedProductToAdd.value) return;
  const qty = Number(inputQuantity.value) || 1;
  cartStore.addItem(selectedProductToAdd.value, qty);
  selectedProductToAdd.value = null;
  inputQuantity.value = 1;
}

function focusProductSearch() {
  nextTick(() => {
    productSearchInput.value?.focus();
  });
}

// ÍTEM PERSONALIZADO
function openCustomItemDialog() {
  customItemForm.value = {
    name: '',
    price: 0,
    quantity: 1,
    unit: 'u',
    discountPercent: 0,
    notes: ''
  };
  customItemDialog.value = true;
  nextTick(() => {
    customNameInput.value?.focus();
  });
}

function getCustomItemTotal() {
  const p = Number(customItemForm.value.price) || 0;
  const q = Number(customItemForm.value.quantity) || 1;
  const d = Number(customItemForm.value.discountPercent) || 0;
  return Math.max(0, p * (1 - d / 100)) * q;
}

function addCustomItemToCart() {
  if (!customItemForm.value.name) return;
  cartStore.addCustomItem({
    name: customItemForm.value.name,
    price: Number(customItemForm.value.price) || 0,
    quantity: Number(customItemForm.value.quantity) || 1,
    unit: customItemForm.value.unit || 'u',
    discountPercent: Number(customItemForm.value.discountPercent) || 0,
    notes: customItemForm.value.notes || ''
  });
  customItemDialog.value = false;
}

// CLIENTES
function openCustomerModal() {
  quickCustomer.value = {
    name: cartStore.customer.name !== 'Consumidor Final' ? cartStore.customer.name : '',
    docType: cartStore.customer.docType || 'DNI',
    docNumber: cartStore.customer.docNumber || '',
    taxCondition: cartStore.customer.taxCondition || 'CONSUMIDOR_FINAL',
    phone: cartStore.customer.phone || '',
    address: cartStore.customer.address || ''
  };
  customerModal.value = true;
}

function selectCustomer(cust) {
  cartStore.setCustomer(cust);
  customerModal.value = false;
}

function applyQuickCustomer() {
  if (!quickCustomer.value.name) return;
  cartStore.setCustomer({
    name: quickCustomer.value.name,
    docType: quickCustomer.value.docType,
    docNumber: quickCustomer.value.docNumber,
    taxCondition: quickCustomer.value.taxCondition,
    phone: quickCustomer.value.phone,
    address: quickCustomer.value.address
  });
  customerModal.value = false;
}

// VACIAR CARRITO
function clearCurrentCart() {
  cartStore.clearCart();
  quoteNotes.value = '';
  confirmClearDialog.value = false;
}

// GUARDAR PRESUPUESTO
async function handleSavePresupuesto() {
  if (cartStore.items.length === 0) return;

  if (cartStore.isEditingPresupuesto) {
    handleUpdateActivePresupuesto();
    return;
  }

  const pres = cartStore.saveAsPresupuesto(quoteNotes.value, validityDays.value);
  if (pres) {
    lastGeneratedVoucher.value = pres;
    successDialog.value = true;
  }
}

function handleUpdateActivePresupuesto() {
  const updated = cartStore.updateActivePresupuesto(quoteNotes.value, validityDays.value);
  if (updated) {
    lastGeneratedVoucher.value = updated;
    successDialog.value = true;
  }
}

// DESCARGA DIRECTA DE PDF
function handleDownloadPdfDirect() {
  if (cartStore.items.length === 0) return;

  const orderNum = cartStore.activeOrderNumber || `PRES-${String(cartStore.nextPresupuestoSeq).padStart(3, '0')}`;
  const validUntil = validityDays.value > 0
    ? new Date(Date.now() + validityDays.value * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const voucherPreview = {
    voucherType: 'PRESUPUESTO',
    voucherNumber: orderNum,
    createdAt: new Date().toISOString(),
    validUntil,
    customer: { ...cartStore.customer },
    items: JSON.parse(JSON.stringify(cartStore.items)),
    subtotal: cartStore.subtotal,
    discount: cartStore.discountAmount,
    total: cartStore.total,
    priceMode: cartStore.priceMode,
    notes: quoteNotes.value
  };

  generateVoucherPdf(voucherPreview, businessStore.comercio);
}

// CONVERTIR A VENTA Y ABRIR COBRO
function convertToSaleAndOpenCheckout() {
  cartStore.voucherType = 'TICKET_X';
  openCheckoutDialog();
}

function openCheckoutDialog() {
  cashReceived.value = cartStore.total;
  saleNotes.value = quoteNotes.value;
  checkoutDialog.value = true;
}

async function confirmSaleCheckout() {
  isProcessingCheckout.value = true;
  try {
    const saleRecord = await cartStore.checkout({
      notes: saleNotes.value,
      cashReceived: cartStore.paymentMethod === 'EFECTIVO' ? cashReceived.value : null,
      cashChange: cartStore.paymentMethod === 'EFECTIVO' ? Math.max(0, cashChange.value) : null
    });

    checkoutDialog.value = false;
    lastGeneratedVoucher.value = saleRecord;
    successDialog.value = true;
  } catch (err) {
    console.error('[QuoteBuilder] Error en cobro:', err);
    alert('Error al procesar la venta: ' + (err.message || 'Intente nuevamente'));
  } finally {
    isProcessingCheckout.value = false;
  }
}

// REMITO
function openRemitoDialog() {
  remitoForm.value = {
    deliveryAddress: cartStore.customer.address || '',
    carrier: '',
    notes: quoteNotes.value
  };
  remitoDialog.value = true;
}

async function confirmRemitoCheckout() {
  isProcessingRemito.value = true;
  try {
    const remitoRecord = await cartStore.checkout({
      notes: remitoForm.value.notes,
      remitoDeliveryAddress: remitoForm.value.deliveryAddress,
      remitoCarrier: remitoForm.value.carrier
    });

    remitoDialog.value = false;
    lastGeneratedVoucher.value = remitoRecord;
    successDialog.value = true;
  } catch (err) {
    console.error('[QuoteBuilder] Error al generar remito:', err);
    alert('Error al emitir remito: ' + (err.message || 'Intente nuevamente'));
  } finally {
    isProcessingRemito.value = false;
  }
}

// GESTIÓN DE PRESUPUESTOS GUARDADOS
function loadQuoteIntoCart(quoteId) {
  const ok = cartStore.loadPendingOrder(quoteId, false);
  if (ok) {
    pendingQuotesDialog.value = false;
  }
}

function downloadPdfForQuote(quote) {
  generateVoucherPdf(quote, businessStore.comercio);
}

function deleteQuote(quoteId) {
  if (confirm('¿Eliminar esta cotización de la lista de presupuestos guardados?')) {
    cartStore.deletePendingOrder(quoteId);
  }
}

// ÉXITO Y NUEVO PRESUPUESTO
function downloadLastVoucherPdf() {
  if (lastGeneratedVoucher.value) {
    generateVoucherPdf(lastGeneratedVoucher.value, businessStore.comercio);
  }
}

function finishSuccessAndNewQuote() {
  successDialog.value = false;
  cartStore.clearCart();
  quoteNotes.value = '';
}

// ATAJOS DE TECLADO
function handleGlobalKeydown(e) {
  // F2: Cobrar
  if (e.key === 'F2') {
    e.preventDefault();
    if (cartStore.items.length > 0) {
      if (cartStore.voucherType === 'PRESUPUESTO') {
        convertToSaleAndOpenCheckout();
      } else {
        openCheckoutDialog();
      }
    }
  }

  // F6: Guardar Presupuesto
  if (e.key === 'F6') {
    e.preventDefault();
    if (cartStore.items.length > 0) {
      cartStore.voucherType = 'PRESUPUESTO';
      handleSavePresupuesto();
    }
  }

  // F8: Modalidad de Precio
  if (e.key === 'F8') {
    e.preventDefault();
    cartStore.togglePriceMode();
  }

  // Escape: Cerrar modales
  if (e.key === 'Escape') {
    customItemDialog.value = false;
    checkoutDialog.value = false;
    remitoDialog.value = false;
    pendingQuotesDialog.value = false;
    customerModal.value = false;
    confirmClearDialog.value = false;
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown);
  if (productStore.products.length === 0) {
    await productStore.fetchProducts();
  }
  await cartStore.loadPendingOrders();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<style scoped>
.quote-builder-container {
  max-width: 1600px;
  margin: 0 auto;
}

.quote-table th {
  font-size: 0.75rem !important;
  color: #475569 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 8px !important;
}

.quote-table td {
  padding: 6px 8px !important;
  border-bottom: 1px solid #f1f5f9;
}

.qty-input {
  width: 44px;
  padding: 2px 4px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: #ffffff;
}

.qty-input:focus {
  outline: 2px solid #2563eb;
  border-color: transparent;
}

.discount-input {
  width: 36px;
  padding: 2px 2px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.8rem;
  background-color: #ffffff;
}

.discount-input:focus {
  outline: 2px solid #16a34a;
  border-color: transparent;
}

.price-input :deep(input) {
  text-align: right;
  padding: 2px 0;
  font-size: 0.85rem;
}

.kbd-badge {
  background-color: #e2e8f0;
  color: #1e293b;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  font-family: monospace;
  font-weight: bold;
}

.text-2xs {
  font-size: 0.65rem;
  line-height: 0.9rem;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.summary-card {
  position: sticky;
  top: 70px;
}
</style>
