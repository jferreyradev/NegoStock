<template>
  <v-container fluid class="pa-2 pa-sm-3">
    <!-- BARRA DE ATAJOS RÁPIDOS DE TECLADO Y PEDIDOS PENDIENTES -->
    <v-card elevation="1" class="mb-2 px-3 py-1 bg-grey-lighten-4 d-flex align-center justify-space-between flex-wrap text-caption">
      <div class="d-none d-md-flex align-center gap-3">
        <span class="font-weight-bold text-grey-darken-3">Atajos Mostrador:</span>
        <span><kbd class="kbd-badge">F2</kbd> Cobrar</span>
        <span><kbd class="kbd-badge">F4</kbd> Limpiar</span>
        <span v-if="moduleStore.modules.preventas"><kbd class="kbd-badge">F6</kbd> Guardar Preventa</span>
        <span v-if="moduleStore.modules.preventas"><kbd class="kbd-badge">F7</kbd> Ver Preventas ({{ cartStore.pendingOrdersCount }})</span>
        <span v-if="moduleStore.modules.mayorista"><kbd class="kbd-badge">F8</kbd> Minorista/Mayorista</span>
        <span><kbd class="kbd-badge">Enter</kbd> Pistola / Buscar</span>
      </div>

      <div class="d-flex align-center gap-2">
        <!-- Botón rápido de Pedidos Pendientes (Preventa) -->
        <v-btn
          v-if="moduleStore.modules.preventas"
          size="small"
          :color="cartStore.pendingOrdersCount > 0 ? 'secondary' : 'grey'"
          :variant="cartStore.pendingOrdersCount > 0 ? 'flat' : 'outlined'"
          class="font-weight-bold mr-2"
          @click="pendingOrdersDialog = true"
        >
          <v-icon icon="mdi-clipboard-clock-outline" class="mr-1" />
          Preventas Pendientes ({{ cartStore.pendingOrdersCount }}) [F7]
        </v-btn>

        <span v-if="moduleStore.modules.mayorista" class="text-grey-darken-1 font-weight-medium">
          Lista: <strong class="text-primary">{{ cartStore.priceMode === 'wholesale' ? 'MAYOREO' : 'MOSTRADOR' }}</strong>
        </span>
      </div>
    </v-card>

    <v-row dense class="align-start">
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
                  :class="{
                    'low-stock-border': prod.stock <= prod.minStock && prod.stock > 0,
                    'opacity-60 bg-grey-lighten-4': prod.stock <= 0 || prod.isActive === false
                  }"
                  @click="addToCart(prod)"
                >
                  <v-card-item class="pb-1">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="text-caption font-weight-bold text-primary">#{{ prod.sku }}</span>
                      <v-chip
                        v-if="prod.stock <= 0 || prod.isActive === false"
                        size="x-small"
                        color="error"
                        variant="flat"
                        class="font-weight-bold text-white"
                      >
                        SIN STOCK
                      </v-chip>
                      <v-chip
                        v-else
                        size="x-small"
                        :color="prod.stock <= prod.minStock ? 'warning' : 'success'"
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
                      <div class="text-h6 font-weight-black" :class="prod.stock <= 0 || prod.isActive === false ? 'text-grey' : 'text-primary'">
                        ${{ formatMoney(activePrice(prod)) }}
                      </div>
                      <div v-if="prod.wholesalePrice > 0" class="text-caption text-grey">
                        Mayoreo: ${{ formatMoney(prod.wholesalePrice) }}
                      </div>
                    </div>
                    <v-btn
                      v-if="prod.stock > 0 && prod.isActive !== false"
                      icon="mdi-plus"
                      size="small"
                      color="primary"
                      variant="tonal"
                      title="Agregar al carrito"
                      @click.stop="addToCart(prod)"
                    />
                    <v-chip
                      v-else
                      size="x-small"
                      color="error"
                      variant="outlined"
                      class="font-weight-bold"
                    >
                      No disponible
                    </v-chip>
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
      <v-col id="cart-column" cols="12" md="5" lg="4" class="pos-cart-col">
        <v-card elevation="3" class="d-flex flex-column pos-cart-card">
          <!-- Cabecera Mostrador / Tipo Comprobante Dinámica -->
          <v-card-item
            :class="cartStore.voucherType === 'PRESUPUESTO' 
              ? 'bg-amber-darken-3 text-white py-2 px-3' 
              : (cartStore.voucherType === 'REMITO' ? 'bg-amber-darken-4 text-white py-2 px-3' : 'bg-primary text-white py-2 px-3')"
          >
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-icon :icon="cartStore.voucherType === 'PRESUPUESTO' ? 'mdi-file-document-edit' : (cartStore.voucherType === 'REMITO' ? 'mdi-truck-delivery' : 'mdi-point-of-sale')" class="mr-1" />
                <span class="text-subtitle-1 font-weight-bold">
                  {{ cartStore.voucherType === 'PRESUPUESTO' ? 'Cotizador / Presupuesto' : (cartStore.voucherType === 'REMITO' ? 'Remito de Entrega' : 'Venta Mostrador') }}
                </span>
              </div>
              <div class="d-flex align-center ga-1">
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="white"
                  to="/armar-presupuesto"
                  class="font-weight-bold text-none"
                  title="Abrir en pantalla completa / Armador de cotizaciones avanzadas"
                >
                  <v-icon icon="mdi-arrow-expand-all" size="x-small" class="mr-1" />
                  Armador
                </v-btn>
                <v-chip size="small" color="white" variant="flat" :class="cartStore.voucherType === 'PRESUPUESTO' ? 'text-amber-darken-4 font-weight-black' : (cartStore.voucherType === 'REMITO' ? 'text-orange-darken-4 font-weight-black' : 'text-primary font-weight-black')">
                  {{ cartStore.voucherType.replace('_', ' ') }}
                </v-chip>
              </div>
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

          <!-- SELECTOR DE CLIENTE -->
          <div class="px-3 py-2 bg-grey-lighten-4 border-b d-flex align-center justify-space-between">
            <div class="d-flex align-center overflow-hidden mr-2 cursor-pointer" @click="openCustomerDialog" title="Hacé clic para cambiar de cliente">
              <v-avatar size="28" color="primary" class="mr-2 text-white font-weight-bold text-caption">
                <v-icon icon="mdi-account" size="small" />
              </v-avatar>
              <div class="overflow-hidden">
                <div class="text-body-2 font-weight-black text-truncate">
                  {{ cartStore.customer.name }}
                </div>
                <div class="text-caption text-grey-darken-1 text-truncate">
                  {{ cartStore.customer.taxCondition }} {{ cartStore.customer.docNumber ? '• ' + cartStore.customer.docNumber : '' }}
                </div>
              </div>
            </div>

            <div v-if="moduleStore.modules.clientes" class="d-flex align-center gap-1">
              <v-btn
                size="x-small"
                variant="outlined"
                color="primary"
                class="font-weight-bold text-none"
                @click="openCustomerDialog"
              >
                <v-icon icon="mdi-account-search" class="mr-1" />
                Clientes
              </v-btn>
              <v-btn
                size="x-small"
                variant="flat"
                color="secondary"
                class="font-weight-bold text-none"
                @click="openNewCustomerDialog"
                title="Nuevo Cliente Rápido"
              >
                <v-icon icon="mdi-account-plus" />
              </v-btn>
              <v-btn
                v-if="cartStore.customer.name !== 'Consumidor Final'"
                size="x-small"
                variant="text"
                color="grey"
                title="Volver a Consumidor Final"
                @click="resetCustomerToDefault"
              >
                <v-icon icon="mdi-close" size="small" />
              </v-btn>
            </div>
          </div>

          <!-- BANNER DE EDICIÓN DE PRESUPUESTO / PEDIDO ACTIVO -->
          <div
            v-if="cartStore.isEditingOrder"
            class="px-3 py-2 border-b d-flex align-center justify-space-between flex-wrap ga-1"
            :class="cartStore.voucherType === 'PRESUPUESTO' ? 'bg-amber-lighten-5 text-amber-darken-4' : 'bg-blue-lighten-5 text-blue-darken-4'"
          >
            <div class="d-flex align-center overflow-hidden mr-2">
              <v-icon :icon="cartStore.voucherType === 'PRESUPUESTO' ? 'mdi-file-document-edit' : 'mdi-cart-arrow-down'" class="mr-2" size="small" />
              <div>
                <div class="text-caption font-weight-bold text-truncate">
                  {{ cartStore.voucherType === 'PRESUPUESTO' 
                      ? 'Presupuesto ' + cartStore.activeOrderNumber + ' cargado' 
                      : 'Convirtiendo Presupuesto ' + cartStore.activeOrderNumber + ' a Venta' }}
                </div>
                <div class="text-2xs text-grey-darken-1" v-if="cartStore.voucherType !== 'PRESUPUESTO'">
                  Al cobrar se cerrará el presupuesto y se descontará el stock
                </div>
              </div>
            </div>
            <div class="d-flex align-center gap-1">
              <!-- Si está en presupuesto: botón para actualizar cotización sin cobrar -->
              <v-btn
                v-if="cartStore.voucherType === 'PRESUPUESTO'"
                size="x-small"
                color="amber-darken-3"
                variant="flat"
                class="font-weight-black text-none"
                title="Actualizar modificaciones en el presupuesto guardado"
                @click="handleUpdatePresupuesto"
              >
                <v-icon icon="mdi-content-save-edit" start size="x-small" />
                Actualizar
              </v-btn>
              <!-- Botón rápido para pasar a cobrar si está en presupuesto -->
              <v-btn
                v-if="cartStore.voucherType === 'PRESUPUESTO'"
                size="x-small"
                color="success"
                variant="flat"
                class="font-weight-black text-none"
                title="Convertir este presupuesto a venta y cobrar"
                @click="convertAndOpenCheckout"
              >
                <v-icon icon="mdi-cash-check" start size="x-small" />
                Cobrar
              </v-btn>
              <!-- Si lo pasó a venta: botón para volver a cotización -->
              <v-btn
                v-else-if="cartStore.isConvertingPresupuestoToSale"
                size="x-small"
                color="secondary"
                variant="tonal"
                class="font-weight-bold text-none"
                title="Volver a modo presupuesto (no vender)"
                @click="cartStore.voucherType = 'PRESUPUESTO'"
              >
                Volver a Cotización
              </v-btn>
              <v-btn
                size="x-small"
                color="grey-darken-2"
                variant="text"
                class="text-none"
                title="Descartar edición y limpiar mostrador"
                @click="handleDiscardEditing"
              >
                Descartar
              </v-btn>
            </div>
          </div>

          <!-- ENCABEZADO DEL DETALLE DE ÍTEMS -->
          <div class="px-3 py-2 bg-grey-lighten-4 border-b d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon
                :icon="cartStore.voucherType === 'PRESUPUESTO' ? 'mdi-file-document-edit' : (cartStore.voucherType === 'REMITO' ? 'mdi-truck-delivery' : 'mdi-cart-check')"
                size="small"
                class="mr-1.5"
                :color="cartStore.voucherType === 'PRESUPUESTO' ? 'amber-darken-3' : (cartStore.voucherType === 'REMITO' ? 'amber-darken-4' : 'primary')"
              />
              <span class="text-caption font-weight-black text-uppercase">
                {{ cartStore.voucherType === 'PRESUPUESTO' ? 'Cotización' : (cartStore.voucherType === 'REMITO' ? 'Remito' : 'Venta Mostrador') }}
              </span>
              <v-chip size="x-small" variant="flat" color="blue-grey-lighten-4" class="ml-2 font-weight-bold text-caption text-blue-grey-darken-4">
                {{ cartStore.items.length }} {{ cartStore.items.length === 1 ? 'artículo' : 'artículos' }} • {{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? 'unidad' : 'unidades' }}
              </v-chip>
            </div>

            <!-- Botón Vaciar Todo si hay ítems -->
            <v-btn
              v-if="cartStore.items.length > 0"
              size="x-small"
              variant="text"
              color="error"
              class="font-weight-bold text-none px-1"
              title="Vaciar todos los artículos del carrito"
              @click="confirmClearCart"
            >
              <v-icon icon="mdi-trash-can-outline" size="small" class="mr-1" />
              Vaciar
            </v-btn>
          </div>

          <!-- BANNER INFORMATIVO SEGÚN TIPO DE COMPROBANTE -->
          <div
            v-if="cartStore.voucherType === 'PRESUPUESTO'"
            class="px-3 py-1 bg-amber-lighten-5 text-amber-darken-4 border-b text-caption font-weight-bold d-flex align-center"
          >
            <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
            Cotización comercial: los productos no descuentan stock hasta concretar la venta
          </div>
          <div
            v-else-if="cartStore.voucherType === 'REMITO'"
            class="px-3 py-1 bg-orange-lighten-5 text-orange-darken-4 border-b text-caption font-weight-bold d-flex align-center"
          >
            <v-icon icon="mdi-truck-outline" size="x-small" class="mr-1" />
            Remito de entrega: descuenta stock e incluye datos de flete y destino
          </div>

          <!-- LISTA DE ÍTEMS EN EL CARRITO -->
          <v-card-text class="flex-grow-1 pa-1.5" style="max-height: clamp(140px, 25vh, 250px); overflow-y: auto;">
            <!-- Estado vacío amigable y con atajos -->
            <div v-if="cartStore.items.length === 0" class="text-center py-4 px-3">
              <v-avatar size="44" color="blue-grey-lighten-5" class="mb-2">
                <v-icon icon="mdi-cart-plus" size="24" color="blue-grey-lighten-2" />
              </v-avatar>
              <div class="text-body-2 font-weight-black text-blue-grey-darken-3 mb-1">
                {{ cartStore.voucherType === 'PRESUPUESTO' ? 'Cotizador listo para cargar' : (cartStore.voucherType === 'REMITO' ? 'Remito listo para cargar' : 'Mostrador listo para la venta') }}
              </div>
              <div class="text-caption text-grey-darken-1 max-w-xs mx-auto mb-2 text-2xs">
                Pistoleá un código de barras, buscá por SKU o hacé clic en un artículo.
              </div>
              <div class="d-flex justify-center ga-1.5 flex-wrap">
                <v-btn
                  size="x-small"
                  variant="outlined"
                  color="primary"
                  class="font-weight-bold text-none"
                  @click="focusSearch"
                >
                  <v-icon icon="mdi-magnify" start size="x-small" />
                  Buscar Artículo
                </v-btn>
                <v-btn
                  v-if="cartStore.pendingOrdersCount > 0"
                  size="x-small"
                  variant="tonal"
                  color="amber-darken-4"
                  class="font-weight-bold text-none"
                  @click="pendingOrdersDialog = true"
                >
                  <v-icon icon="mdi-clipboard-list-outline" start size="x-small" />
                  Presupuestos ({{ cartStore.pendingOrdersCount }})
                </v-btn>
              </div>
            </div>

            <!-- Listado con tarjetas modernas de producto -->
            <div v-else class="pa-1">
              <div class="d-flex flex-column ga-2">
                <div
                  v-for="(item, idx) in cartStore.items"
                  :key="item.sku + idx"
                  class="cart-item-card pa-2.5 rounded-lg border bg-white"
                  :class="{
                    'stock-alert-border': item.stock !== undefined && item.quantity > item.stock
                  }"
                >
                  <!-- Fila 1: N° Línea + SKU + Nombre del producto + Subtotal -->
                  <div class="d-flex align-start justify-space-between ga-2 mb-1.5">
                    <div class="d-flex align-center overflow-hidden flex-grow-1">
                      <!-- Badge con número de orden -->
                      <span class="item-order-badge mr-1.5 flex-shrink-0">
                        {{ idx + 1 }}
                      </span>
                      <!-- Badge SKU -->
                      <v-chip
                        size="x-small"
                        variant="tonal"
                        color="blue-grey-darken-2"
                        class="font-mono font-weight-bold mr-1.5 flex-shrink-0"
                      >
                        #{{ item.sku }}
                      </v-chip>
                      <!-- Nombre -->
                      <span class="text-body-2 font-weight-bold text-slate-800 line-clamp-1" :title="item.name">
                        {{ item.name }}
                      </span>
                    </div>

                    <!-- Subtotal de la línea -->
                    <div class="text-right flex-shrink-0">
                      <span class="text-subtitle-2 font-weight-black text-primary">
                        ${{ formatMoney(getItemSubtotal(item)) }}
                      </span>
                    </div>
                  </div>

                  <!-- Fila 2: Precios, Descuentos, Stock disponible y Controles de Cantidad -->
                  <div class="d-flex align-center justify-space-between flex-wrap ga-2 pt-1 border-t-dashed">
                    <!-- Precios y Stock -->
                    <div class="d-flex align-center flex-wrap ga-1">
                      <!-- Precio Unitario -->
                      <span class="text-caption font-weight-bold text-slate-700">
                        ${{ formatMoney(getItemUnitPrice(item)) }}
                      </span>
                      <span class="text-caption text-grey">/ {{ item.unit }}</span>

                      <!-- Indicador Mayorista -->
                      <template v-if="cartStore.priceMode === 'wholesale' && item.wholesalePrice > 0">
                        <span class="text-caption text-grey text-decoration-line-through ml-1">
                          ${{ formatMoney(item.sellingPrice) }}
                        </span>
                        <v-chip size="x-small" color="purple-darken-2" variant="flat" class="font-weight-black ml-1 text-2xs">
                          MAYORISTA
                        </v-chip>
                      </template>

                      <!-- Alerta o feedback de stock -->
                      <template v-if="item.stock !== undefined && item.stock !== null">
                        <v-chip
                          v-if="item.quantity > item.stock"
                          size="x-small"
                          color="error"
                          variant="tonal"
                          class="font-weight-bold ml-1 text-2xs"
                        >
                          <v-icon icon="mdi-alert-circle" start size="10" />
                          Stock: {{ item.stock }} {{ item.unit }}
                        </v-chip>
                        <span v-else class="text-caption text-grey-darken-1 ml-1" style="font-size: 11px;">
                          (Stock: {{ item.stock }})
                        </span>
                      </template>
                    </div>

                    <!-- Controles de Cantidad y Botón Eliminar -->
                    <div class="d-flex align-center ga-1 ml-auto">
                      <div class="qty-stepper d-flex align-center rounded border bg-grey-lighten-5">
                        <!-- Decrementar / Eliminar si es 1 -->
                        <v-btn
                          :icon="item.quantity <= 1 ? 'mdi-trash-can-outline' : 'mdi-minus'"
                          size="x-small"
                          variant="text"
                          :color="item.quantity <= 1 ? 'error' : 'default'"
                          class="qty-btn"
                          :title="item.quantity <= 1 ? 'Quitar del carrito' : 'Restar 1'"
                          @click="cartStore.updateQuantity(idx, item.quantity - 1)"
                        />

                        <!-- Input de Cantidad con autoselect -->
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          step="any"
                          min="0.1"
                          class="qty-input-modern text-center font-weight-bold"
                          title="Clic para editar cantidad"
                          @focus="$event.target.select()"
                          @blur="handleQtyBlur(idx, item.quantity)"
                        />

                        <!-- Incrementar -->
                        <v-btn
                          icon="mdi-plus"
                          size="x-small"
                          variant="text"
                          color="primary"
                          class="qty-btn"
                          title="Sumar 1"
                          @click="cartStore.updateQuantity(idx, item.quantity + 1)"
                        />
                      </div>

                      <!-- Botón de Quitar Rápido -->
                      <v-btn
                        icon="mdi-close"
                        size="x-small"
                        variant="text"
                        color="grey"
                        class="delete-btn ml-0.5"
                        title="Quitar este artículo"
                        @click="cartStore.removeItem(idx)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>

          <v-divider />

          <!-- RESUMEN DE TOTALES Y ACCIONES (SIEMPRE VISIBLE Y COMPACTO) -->
          <v-card-text class="bg-grey-lighten-5 pa-2 border-t">
            <!-- Subtotal y desglose -->
            <div class="d-flex justify-space-between text-caption text-grey-darken-2 mb-1">
              <span>Subtotal ({{ cartStore.items.length }} lín. • {{ cartStore.itemCount }} un.):</span>
              <span class="font-weight-bold text-slate-800">${{ formatMoney(cartStore.subtotal) }}</span>
            </div>

            <!-- Descuento global con selector rápido -->
            <div class="d-flex justify-space-between align-center text-caption mb-1">
              <div class="d-flex align-center">
                <span>Descuento:</span>
                <span v-if="cartStore.discountAmount > 0" class="text-caption text-error font-weight-bold ml-1">
                  (-${{ formatMoney(cartStore.discountAmount) }})
                </span>
              </div>
              <div class="d-flex align-center ga-1">
                <v-btn
                  v-if="cartStore.discountPercent > 0"
                  size="x-small"
                  variant="text"
                  color="error"
                  class="font-weight-bold px-1"
                  @click="cartStore.discountPercent = 0"
                  title="Quitar descuento"
                >
                  Quitar
                </v-btn>
                <div style="width: 72px;">
                  <v-text-field
                    v-model.number="cartStore.discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    density="compact"
                    variant="outlined"
                    suffix="%"
                    hide-details
                    class="bg-white"
                  />
                </div>
              </div>
            </div>

            <!-- TOTAL DESTACADO SEGÚN COMPROBANTE -->
            <div
              class="d-flex justify-space-between align-center mt-1 pa-2 rounded-lg border"
              :class="cartStore.voucherType === 'PRESUPUESTO' 
                ? 'bg-amber-lighten-5 border-amber-lighten-3' 
                : (cartStore.voucherType === 'REMITO' ? 'bg-orange-lighten-5 border-orange-lighten-3' : 'bg-blue-lighten-5 border-blue-lighten-3')"
            >
              <div>
                <div
                  class="text-caption font-weight-bold text-uppercase"
                  :class="cartStore.voucherType === 'PRESUPUESTO' 
                    ? 'text-amber-darken-4' 
                    : (cartStore.voucherType === 'REMITO' ? 'text-orange-darken-4' : 'text-primary')"
                >
                  {{ cartStore.voucherType === 'PRESUPUESTO' ? 'Total Cotizado' : (cartStore.voucherType === 'REMITO' ? 'Total Remitido' : 'Total a Cobrar') }}:
                </div>
                <div class="text-caption text-grey" style="font-size: 10px;">
                  {{ cartStore.priceMode === 'wholesale' ? 'Mayorista' : 'Minorista estándar' }}
                </div>
              </div>
              <div
                class="text-h5 text-sm-h4 font-weight-black"
                :class="cartStore.voucherType === 'PRESUPUESTO' 
                  ? 'text-amber-darken-4' 
                  : (cartStore.voucherType === 'REMITO' ? 'text-orange-darken-4' : 'text-primary')"
              >
                ${{ formatMoney(cartStore.total) }}
              </div>
            </div>

            <!-- Método de pago (Solo para Venta / Remito) -->
            <v-select
              v-if="cartStore.voucherType !== 'PRESUPUESTO'"
              v-model="cartStore.paymentMethod"
              :items="paymentMethods"
              label="Forma de Cobro"
              density="compact"
              variant="outlined"
              class="mt-1.5 bg-white"
              hide-details
            />
          </v-card-text>

          <!-- BOTONES DE ACCIÓN: BOTÓN PRINCIPAL BLOCK + ACCIONES SECUNDARIAS COMPACTAS -->
          <v-card-actions class="pa-2 bg-grey-lighten-4 d-flex flex-column ga-1.5 border-t">
            <!-- CASO 1: MODO PRESUPUESTO (POR DEFECTO) -->
            <template v-if="cartStore.voucherType === 'PRESUPUESTO'">
              <!-- Botón 1: PASAR A VENTA Y COBRAR (Permite pasar a la compra inmediatamente) -->
              <v-btn
                color="accent"
                size="large"
                variant="flat"
                block
                class="font-weight-black text-subtitle-1 shadow-sm text-none"
                :disabled="cartStore.items.length === 0"
                @click="convertAndOpenCheckout"
              >
                <v-icon icon="mdi-cart-check" class="mr-1.5" />
                {{ cartStore.activeOrderId ? 'PASAR A VENTA Y COBRAR [F2]' : 'CONCRETAR VENTA Y COBRAR [F2]' }}
              </v-btn>

              <!-- Botón 2: GUARDAR / EMITIR O ACTUALIZAR PRESUPUESTO (Sin descontar stock) -->
              <v-btn
                color="amber-darken-3"
                size="default"
                variant="tonal"
                block
                class="font-weight-bold text-subtitle-2 text-none"
                :disabled="cartStore.items.length === 0"
                @click="cartStore.isEditingPresupuesto ? handleUpdatePresupuesto() : openPresupuestoDialog()"
              >
                <v-icon :icon="cartStore.isEditingPresupuesto ? 'mdi-content-save-check' : 'mdi-file-document-edit'" class="mr-1" />
                {{ cartStore.isEditingPresupuesto ? 'Actualizar Presupuesto (' + cartStore.activeOrderNumber + ')' : 'Guardar / Emitir Presupuesto [F6]' }}
              </v-btn>
            </template>

            <!-- CASO 2: MODO VENTA EFECTIVA (TICKET X O REMITO) -->
            <template v-else>
              <v-btn
                :color="cartStore.voucherType === 'REMITO' ? 'amber-darken-4' : 'accent'"
                size="large"
                variant="flat"
                block
                class="font-weight-black text-subtitle-1 shadow-sm text-none"
                :disabled="cartStore.items.length === 0"
                @click="openCheckoutConfirmDialog"
              >
                <v-icon icon="mdi-check-circle" class="mr-1.5" />
                {{ cartStore.isConvertingPresupuestoToSale ? 'COBRAR VENTA (' + cartStore.activeOrderNumber + ') $' + formatMoney(cartStore.total) : (cartStore.voucherType === 'REMITO' ? 'EMITIR REMITO $' + formatMoney(cartStore.total) : 'COBRAR $' + formatMoney(cartStore.total)) }} [F2]
              </v-btn>
            </template>

            <!-- FILA DE ACCIONES SECUNDARIAS COMPACTAS -->
            <div class="d-flex justify-space-between w-100 ga-1">
              <v-btn
                color="grey-darken-2"
                variant="outlined"
                size="x-small"
                class="flex-grow-1 font-weight-bold text-none px-1"
                :disabled="cartStore.items.length === 0"
                title="Vaciar artículos del carrito [F4]"
                @click="confirmClearCart"
              >
                [F4] Limpiar
              </v-btn>

              <v-menu v-if="moduleStore.modules.preventas" location="top start">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="secondary"
                    variant="tonal"
                    size="x-small"
                    class="flex-grow-1 font-weight-bold text-none px-1"
                    :disabled="cartStore.items.length === 0"
                  >
                    <v-icon icon="mdi-file-document-edit" class="mr-1" size="x-small" />
                    [F6] Guardar...
                    <v-icon icon="mdi-chevron-up" end size="x-small" />
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-file-percent-outline"
                    title="Guardar como Presupuesto"
                    subtitle="Genera cotización formal con validez"
                    @click="openPresupuestoDialog"
                  />
                  <v-list-item
                    prepend-icon="mdi-clock-outline"
                    title="Guardar como Preventa Mostrador"
                    subtitle="Para cobrar luego en caja"
                    @click="handleSavePendingOrder"
                  />
                </v-list>
              </v-menu>

              <v-btn
                v-if="moduleStore.modules.preventas"
                variant="tonal"
                color="primary"
                size="x-small"
                class="flex-grow-1 font-weight-bold text-none px-1"
                @click="pendingOrdersDialog = true"
              >
                <v-icon icon="mdi-clipboard-list-outline" start size="x-small" />
                [F7] Presupuestos
                <v-badge
                  v-if="cartStore.pendingOrdersCount > 0"
                  :content="cartStore.pendingOrdersCount"
                  color="error"
                  inline
                  class="ml-1"
                />
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- MODAL DE SELECCIÓN Y BÚSQUEDA DE CLIENTES -->
    <v-dialog v-model="customerDialog" max-width="580">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-primary text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-account-group" class="mr-2" />
            <span>Seleccionar Cliente para Mostrador</span>
          </div>
          <v-btn
            color="secondary"
            variant="flat"
            size="small"
            class="font-weight-bold text-none"
            @click="openNewCustomerDialog"
          >
            <v-icon icon="mdi-account-plus" class="mr-1" />
            + Nuevo Cliente
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-text-field
            v-model="customerStore.searchQuery"
            prepend-inner-icon="mdi-magnify"
            label="Buscar por nombre, DNI, CUIT o teléfono..."
            variant="outlined"
            density="compact"
            clearable
            autofocus
            class="mb-3"
          />

          <v-list density="comfortable" style="max-height: 340px; overflow-y: auto;">
            <v-list-item
              v-for="c in customerStore.filteredCustomers"
              :key="c.id"
              :active="cartStore.customer.id === c.id || cartStore.customer.name === c.nombre"
              class="border-b rounded mb-1"
              @click="handleSelectCustomer(c)"
            >
              <template #prepend>
                <v-avatar size="36" :color="c.isDefault ? 'grey-darken-1' : 'primary'" class="text-white font-weight-bold text-caption mr-2">
                  {{ (c.nombre || c.name || 'C').charAt(0) }}
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">
                {{ c.nombre || c.name }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ c.condicion_iva || c.taxCondition }} 
                <span v-if="c.numero_documento || c.documentNumber"> • Doc: {{ c.numero_documento || c.documentNumber }}</span>
                <span v-if="c.telefono || c.phone"> • Tel: {{ c.telefono || c.phone }}</span>
              </v-list-item-subtitle>

              <template #append>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  class="font-weight-bold text-none"
                  @click.stop="handleSelectCustomer(c)"
                >
                  Seleccionar
                </v-btn>
              </template>
            </v-list-item>

            <div v-if="customerStore.filteredCustomers.length === 0" class="text-center py-6 text-grey">
              <v-icon icon="mdi-account-search-outline" size="48" class="mb-2" />
              <div>No se encontraron clientes con "{{ customerStore.searchQuery }}"</div>
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                class="mt-2 text-none"
                @click="openNewCustomerDialogWithSearch"
              >
                Crear cliente "{{ customerStore.searchQuery }}"
              </v-btn>
            </div>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-btn variant="text" color="grey" @click="resetCustomerToDefault">Consumidor Final</v-btn>
          <v-spacer />
          <v-btn variant="text" color="grey" @click="customerDialog = false">Cerrar [ESC]</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE ALTA RÁPIDA DE CLIENTE -->
    <v-dialog v-model="newCustomerDialog" max-width="500">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-primary text-white d-flex align-center py-3">
          <v-icon icon="mdi-account-plus" class="mr-2" />
          <span>Alta Rápida de Cliente</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="newCustomerForm.nombre"
                label="Nombre y Apellido / Razón Social *"
                variant="outlined"
                density="compact"
                placeholder="Ej. Taller Los Pinos o Juan Pérez"
                autofocus
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="newCustomerForm.tipo_documento"
                label="Tipo Doc."
                :items="['DNI', 'CUIT', 'CUIL', 'PASAPORTE']"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="newCustomerForm.numero_documento"
                label="Número de Doc / CUIT"
                variant="outlined"
                density="compact"
                placeholder="30-12345678-9"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="newCustomerForm.condicion_iva"
                label="Condición IVA"
                :items="[
                  { title: 'Consumidor Final', value: 'CONSUMIDOR_FINAL' },
                  { title: 'Responsable Inscripto', value: 'RESPONSABLE_INSCRIPTO' },
                  { title: 'Responsable Monotributo', value: 'MONOTRIBUTO' },
                  { title: 'IVA Exento', value: 'EXENTO' }
                ]"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="newCustomerForm.telefono"
                label="Teléfono / WhatsApp"
                variant="outlined"
                density="compact"
                placeholder="11-2345-6789"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="newCustomerForm.email"
                label="Email"
                variant="outlined"
                density="compact"
                placeholder="cliente@email.com"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="newCustomerForm.direccion"
                label="Dirección / Localidad"
                variant="outlined"
                density="compact"
                placeholder="Av. San Martín 1500"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="newCustomerDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!newCustomerForm.nombre.trim()"
            :loading="customerStore.isLoading"
            class="px-4 font-weight-bold"
            @click="handleSaveNewCustomer"
          >
            Guardar y Asignar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE GUARDAR PRESUPUESTO FORMAL -->
    <v-dialog v-model="presupuestoDialog" max-width="520">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-amber-darken-3 text-white d-flex align-center py-3">
          <v-icon icon="mdi-file-document-edit" class="mr-2" />
          <span>Emitir Presupuesto / Cotización</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Tarjeta del cliente asignado -->
          <div class="pa-3 bg-grey-lighten-4 rounded-lg mb-3 d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey-darken-1">Cliente del Presupuesto:</div>
              <div class="text-body-1 font-weight-black">{{ cartStore.customer.name }}</div>
              <div class="text-caption text-grey">{{ cartStore.customer.taxCondition }} {{ cartStore.customer.docNumber ? '• ' + cartStore.customer.docNumber : '' }}</div>
            </div>
            <v-btn size="small" variant="outlined" color="primary" class="text-none font-weight-bold" @click="openCustomerDialog">
              Cambiar
            </v-btn>
          </div>

          <v-row dense>
            <!-- Checkbox de Sin Vencimiento -->
            <v-col cols="12">
              <v-checkbox
                v-model="presupuestoForm.sinVencimiento"
                label="Sin fecha de caducidad (Validez indefinida / sujeta a stock)"
                color="amber-darken-3"
                density="compact"
                hide-details
                class="mb-1"
              />
            </v-col>

            <!-- Selector de Días de Validez (si tiene vencimiento) -->
            <v-col cols="6" v-if="!presupuestoForm.sinVencimiento">
              <v-select
                v-model.number="presupuestoForm.validDays"
                label="Días de Validez"
                :items="[
                  { title: '3 días hábiles', value: 3 },
                  { title: '7 días corridos', value: 7 },
                  { title: '15 días (Estándar)', value: 15 },
                  { title: '30 días corridos', value: 30 },
                  { title: '60 días corridos', value: 60 }
                ]"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>

            <!-- Mensaje explicativo cuando no tiene vencimiento -->
            <v-col cols="6" v-else>
              <div class="pa-2 bg-amber-lighten-5 rounded text-caption text-amber-darken-4 border border-amber-lighten-3">
                <v-icon icon="mdi-information-outline" size="small" class="mr-1" />
                Válido por tiempo indeterminado sujeto a reposición de stock.
              </div>
            </v-col>

            <v-col cols="6">
              <div class="text-caption text-grey">Total Presupuestado:</div>
              <div class="text-h6 font-weight-black text-amber-darken-4">${{ formatMoney(cartStore.total) }}</div>
            </v-col>

            <v-col cols="12" class="mt-2">
              <v-textarea
                v-model="presupuestoForm.notes"
                label="Notas / Condiciones del Presupuesto"
                variant="outlined"
                density="compact"
                rows="2"
                placeholder="Ej. Precios sujetos a modificación sin previo aviso. Entrega inmediata."
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-btn variant="text" color="grey" @click="presupuestoDialog = false">Cancelar</v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="outlined"
            class="font-weight-bold text-none"
            @click="confirmSavePresupuesto('save')"
          >
            Guardar
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            class="font-weight-bold text-none"
            @click="confirmSavePresupuesto('pdf')"
          >
            <v-icon icon="mdi-file-pdf-box" class="mr-1" />
            Descargar PDF
          </v-btn>
          <v-btn
            color="amber-darken-3"
            variant="flat"
            class="px-3 font-weight-bold text-none"
            @click="confirmSavePresupuesto('print')"
          >
            <v-icon icon="mdi-printer" class="mr-1" />
            Imprimir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE PRESUPUESTOS Y PEDIDOS DE MOSTRADOR [F7] -->
    <v-dialog v-model="pendingOrdersDialog" max-width="820">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-primary text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-clipboard-list-outline" class="mr-2" />
            <span>Presupuestos y Pedidos de Mostrador</span>
          </div>
          <v-chip size="small" color="secondary" variant="flat" class="font-weight-black">
            {{ cartStore.pendingOrdersCount }} Registros
          </v-chip>
        </v-card-title>

        <!-- Filtros de Tipo -->
        <div class="bg-grey-lighten-4 px-4 pt-2">
          <v-tabs v-model="pendingTab" density="compact" color="primary">
            <v-tab value="todos" class="font-weight-bold text-none">
              Todos ({{ cartStore.pendingOrdersCount }})
            </v-tab>
            <v-tab value="presupuestos" class="font-weight-bold text-none">
              Presupuestos ({{ cartStore.presupuestosList.length }})
            </v-tab>
            <v-tab value="preventas" class="font-weight-bold text-none">
              Preventas ({{ cartStore.preventasList.length }})
            </v-tab>
          </v-tabs>
        </div>

        <v-card-text class="pa-4">
          <div v-if="filteredPendingOrders.length === 0" class="text-center py-8 text-grey">
            <v-icon icon="mdi-clipboard-text-outline" size="48" class="mb-2" />
            <div>No hay registros guardados en esta sección.</div>
            <div class="text-caption">Creá presupuestos desde el mostrador presionando [F6] o el botón "Presupuesto...".</div>
          </div>

          <div v-else class="responsive-table-wrapper">
            <v-table density="compact" hover class="compact-orders-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th>Tipo y N°</th>
                  <th>Fecha / Validez</th>
                  <th>Cliente</th>
                  <th class="text-center">Ítems</th>
                  <th class="text-right">Total</th>
                  <th class="text-center sticky-action-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ord in filteredPendingOrders" :key="ord.id">
                  <td>
                    <v-chip
                      size="x-small"
                      :color="ord.type === 'PRESUPUESTO' ? 'amber-darken-3' : 'blue-darken-2'"
                      variant="flat"
                      class="font-weight-black mr-1"
                    >
                      {{ ord.type === 'PRESUPUESTO' ? 'PRESUPUESTO' : 'PREVENTA' }}
                    </v-chip>
                    <span class="font-weight-black text-body-2">{{ ord.orderNumber }}</span>
                  </td>
                  <td>
                    <div class="text-caption font-weight-bold">{{ formatDate(ord.createdAt) }}</div>
                    <div v-if="ord.validUntil" class="text-caption text-amber-darken-4 font-weight-bold">
                      Vence: {{ formatDate(ord.validUntil) }}
                    </div>
                    <div v-else-if="ord.type === 'PRESUPUESTO'" class="text-caption text-teal-darken-3 font-weight-bold">
                      Sin vencimiento
                    </div>
                    <div v-if="ord.createdBy" class="text-caption text-primary font-weight-medium mt-1">
                      <v-icon icon="mdi-account-edit" size="x-small" /> {{ ord.createdBy.name }}
                    </div>
                    <div v-if="ord.updatedBy" class="text-caption text-amber-darken-3 font-weight-medium">
                      <v-icon icon="mdi-pencil-clock" size="x-small" /> Modif: {{ ord.updatedBy.name }}
                    </div>
                  </td>
                  <td>
                    <div class="font-weight-bold text-body-2">{{ ord.customer?.name || 'Consumidor Final' }}</div>
                    <div class="text-caption text-grey" v-if="ord.customer?.phone || ord.notes">
                      {{ ord.customer?.phone || ord.notes }}
                    </div>
                  </td>
                  <td class="text-center font-weight-bold">{{ ord.items.length }}</td>
                  <td class="text-right font-weight-black text-primary">${{ formatMoney(ord.total) }}</td>
                  <td class="text-center text-no-wrap sticky-action-col">
                    <!-- Cargar al mostrador para continuar la venta o actualizar -->
                    <v-btn
                      color="primary"
                      size="small"
                      variant="flat"
                      class="font-weight-bold text-none mr-1"
                      title="Cargar al mostrador para continuar con la venta o modificar"
                      @click="loadOrderToCart(ord.id)"
                    >
                      <v-icon icon="mdi-cart-arrow-down" start size="small" />
                      Cargar
                    </v-btn>
                    <!-- Descargar PDF -->
                    <v-btn
                      icon="mdi-file-pdf-box"
                      size="small"
                      color="error"
                      variant="tonal"
                      class="mr-1"
                      title="Descargar en PDF"
                      @click="downloadOrderPdf(ord)"
                    />
                    <!-- Imprimir Presupuesto -->
                    <v-btn
                      v-if="ord.type === 'PRESUPUESTO'"
                      icon="mdi-printer"
                      size="small"
                      color="secondary"
                      variant="tonal"
                      class="mr-1"
                      title="Imprimir Presupuesto"
                      @click="printPresupuestoTicket(ord)"
                    />
                    <!-- Eliminar -->
                    <v-btn
                      icon="mdi-delete-outline"
                      size="small"
                      color="error"
                      variant="text"
                      title="Eliminar registro"
                      @click="cartStore.deletePendingOrder(ord.id)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn color="grey-darken-1" variant="text" @click="pendingOrdersDialog = false">Cerrar [ESC]</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE CONFIRMACIÓN Y COBRO DE VENTA (TICKET X / REMITO) -->
    <v-dialog
      v-model="checkoutConfirmDialog"
      max-width="860"
      persistent
      @keydown.esc="checkoutConfirmDialog = false"
    >
      <v-card class="rounded-xl overflow-hidden elevation-12">
        <v-card-title
          :class="cartStore.voucherType === 'REMITO' ? 'bg-amber-darken-4 text-white py-3 px-4 d-flex align-center justify-space-between' : 'bg-primary text-white py-3 px-4 d-flex align-center justify-space-between'"
        >
          <div class="d-flex align-center">
            <v-icon
              :icon="cartStore.voucherType === 'REMITO' ? 'mdi-truck-delivery' : 'mdi-cash-register'"
              size="28"
              class="mr-3"
            />
            <div>
              <div class="text-h6 font-weight-black leading-tight">
                {{ cartStore.voucherType === 'REMITO' ? 'Confirmar Emisión de Remito de Entrega' : 'Confirmar Cobro y Emisión de Venta' }}
              </div>
              <div class="text-caption text-blue-grey-lighten-4">
                {{ cartStore.voucherType === 'REMITO' ? 'Verifique el destino, chofer y artículos antes de registrar la entrega' : 'Revise el resumen de la compra, medio de pago y entrega de vuelto' }}
              </div>
            </div>
          </div>
          <div class="d-flex align-center ga-2">
            <v-chip
              color="white"
              variant="flat"
              class="font-weight-black text-caption px-3"
              :class="cartStore.voucherType === 'REMITO' ? 'text-amber-darken-4' : 'text-primary'"
            >
              {{ cartStore.voucherType === 'REMITO' ? 'REMITO DE ENTREGA' : 'TICKET X (INTERNO)' }}
            </v-chip>
            <v-btn
              icon="mdi-close"
              variant="text"
              color="white"
              size="small"
              :disabled="isProcessingCheckout"
              @click="checkoutConfirmDialog = false"
            />
          </div>
        </v-card-title>

        <!-- Mensaje de error si la transacción falla -->
        <v-alert
          v-if="checkoutError"
          type="error"
          variant="tonal"
          closable
          class="ma-3 mb-0"
          @click:close="checkoutError = ''"
        >
          {{ checkoutError }}
        </v-alert>

        <v-card-text class="pa-4 bg-grey-lighten-5">
          <!-- Notificación de conversión de presupuesto a venta -->
          <v-alert
            v-if="cartStore.activeOrderId"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3 text-caption font-weight-bold"
          >
            <v-icon icon="mdi-check-decagram" class="mr-1" />
            Esta compra concreta y cierra el {{ cartStore.activeOrderType === 'PRESUPUESTO' ? 'Presupuesto ' : 'Pedido ' }} <strong>{{ cartStore.activeOrderNumber }}</strong>. El stock de los artículos será descontado.
          </v-alert>

          <v-row>
            <!-- COLUMNA IZQUIERDA: RESUMEN DEL COMPROBANTE Y ARTÍCULOS -->
            <v-col cols="12" md="7">
              <v-card variant="flat" border class="pa-3 rounded-lg bg-white mb-3">
                <!-- Cliente seleccionado -->
                <div class="d-flex align-center justify-space-between border-b pb-2 mb-2">
                  <div class="d-flex align-center overflow-hidden">
                    <v-avatar size="32" color="primary" class="text-white mr-2 flex-shrink-0">
                      <v-icon icon="mdi-account" size="small" />
                    </v-avatar>
                    <div class="overflow-hidden">
                      <div class="text-subtitle-2 font-weight-bold text-truncate">{{ cartStore.customer.name }}</div>
                      <div class="text-caption text-grey text-truncate">
                        {{ cartStore.customer.taxCondition }}
                        {{ cartStore.customer.docNumber ? '• ' + cartStore.customer.docNumber : '' }}
                      </div>
                    </div>
                  </div>
                  <v-chip size="x-small" :color="cartStore.priceMode === 'wholesale' ? 'purple' : 'primary'" variant="tonal" class="font-weight-bold flex-shrink-0">
                    {{ cartStore.priceMode === 'wholesale' ? 'Mayorista' : 'Minorista' }}
                  </v-chip>
                </div>

                <!-- Detalle de Artículos -->
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-caption font-weight-bold text-grey-darken-2">
                    ARTÍCULOS A DESCONTAR DEL STOCK ({{ cartStore.itemCount }}):
                  </span>
                </div>
                <div style="max-height: 210px; overflow-y: auto;" class="border rounded">
                  <v-table density="compact">
                    <thead class="bg-grey-lighten-4">
                      <tr>
                        <th class="text-left py-1 text-caption">Cant</th>
                        <th class="text-left py-1 text-caption">Detalle</th>
                        <th class="text-right py-1 text-caption">P. Unit</th>
                        <th class="text-right py-1 text-caption">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="it in cartStore.items" :key="it.sku">
                        <td class="font-weight-bold">{{ it.quantity }} {{ it.unit }}</td>
                        <td class="text-caption line-clamp-1">
                          {{ it.name }}
                          <span class="text-grey font-mono">(#{{ it.sku }})</span>
                        </td>
                        <td class="text-right text-caption">${{ formatMoney(getItemUnitPrice(it)) }}</td>
                        <td class="text-right font-weight-bold">${{ formatMoney(getItemSubtotal(it)) }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>

                <!-- Totales y Descuento -->
                <div class="mt-3 pt-2 border-t">
                  <div class="d-flex justify-space-between text-body-2 text-grey-darken-2" v-if="cartStore.discountAmount > 0">
                    <span>Subtotal:</span>
                    <span>${{ formatMoney(cartStore.subtotal) }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 text-error font-weight-bold" v-if="cartStore.discountAmount > 0">
                    <span>Descuento ({{ cartStore.discountPercent }}%):</span>
                    <span>-${{ formatMoney(cartStore.discountAmount) }}</span>
                  </div>
                  <div
                    class="d-flex justify-space-between align-center mt-2 pa-2 rounded-lg"
                    :class="cartStore.voucherType === 'REMITO' ? 'bg-orange-lighten-5' : 'bg-blue-lighten-5'"
                  >
                    <span class="text-subtitle-1 font-weight-bold" :class="cartStore.voucherType === 'REMITO' ? 'text-amber-darken-4' : 'text-primary'">
                      TOTAL A COBRAR:
                    </span>
                    <span class="text-h5 font-weight-black" :class="cartStore.voucherType === 'REMITO' ? 'text-amber-darken-4' : 'text-primary'">
                      ${{ formatMoney(cartStore.total) }}
                    </span>
                  </div>
                </div>
              </v-card>
            </v-col>

            <!-- COLUMNA DERECHA: FORMA DE PAGO, VUELTO Y LOGÍSTICA -->
            <v-col cols="12" md="5">
              <v-card variant="flat" border class="pa-3 rounded-lg bg-white h-100 d-flex flex-column justify-space-between">
                <div>
                  <!-- Selector de Medio de Pago -->
                  <div class="text-subtitle-2 font-weight-bold mb-1 d-flex align-center">
                    <v-icon icon="mdi-credit-card-outline" class="mr-1" size="small" />
                    Forma de Cobro:
                  </div>
                  <v-select
                    v-model="cartStore.paymentMethod"
                    :items="paymentMethods"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-3"
                  />

                  <!-- CALCULADORA DE EFECTIVO Y VUELTO (SI PAGO = EFECTIVO) -->
                  <div v-if="cartStore.paymentMethod === 'EFECTIVO'" class="pa-3 rounded-lg bg-grey-lighten-4 mb-3 border">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="text-caption font-weight-bold text-grey-darken-2">Paga con (Efectivo):</span>
                      <v-btn
                        size="x-small"
                        variant="text"
                        color="primary"
                        class="font-weight-bold px-1"
                        @click="checkoutCashReceived = cartStore.total"
                      >
                        Monto Exacto
                      </v-btn>
                    </div>

                    <v-text-field
                      v-model="checkoutCashReceived"
                      type="number"
                      step="any"
                      min="0"
                      prefix="$"
                      placeholder="0,00"
                      variant="outlined"
                      density="compact"
                      hide-details
                      autofocus
                      class="bg-white mb-2"
                    />

                    <!-- Sugerencias de billetes rápidos -->
                    <div class="d-flex flex-wrap ga-1 mb-2">
                      <v-chip
                        v-for="amt in cashSuggestions"
                        :key="amt"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        class="cursor-pointer font-weight-bold"
                        @click="checkoutCashReceived = amt"
                      >
                        ${{ formatMoney(amt) }}
                      </v-chip>
                    </div>

                    <!-- Indicador de Vuelto o Faltante -->
                    <div
                      v-if="checkoutCashDifference >= 0"
                      class="pa-2 rounded text-center bg-teal-lighten-5 text-teal-darken-4 border border-teal-lighten-3"
                    >
                      <div class="text-caption font-weight-bold text-uppercase">Vuelto a entregar:</div>
                      <div class="text-h6 font-weight-black">${{ formatMoney(checkoutCashChange) }}</div>
                    </div>
                    <div
                      v-else-if="checkoutCashReceived"
                      class="pa-2 rounded text-center bg-amber-lighten-5 text-amber-darken-4 border border-amber-lighten-3"
                    >
                      <div class="text-caption font-weight-bold">Falta abonar:</div>
                      <div class="text-subtitle-1 font-weight-black">${{ formatMoney(Math.abs(checkoutCashDifference)) }}</div>
                    </div>
                  </div>

                  <!-- CAMPOS ESPECÍFICOS DE REMITO -->
                  <div v-if="cartStore.voucherType === 'REMITO'" class="pa-3 rounded-lg bg-orange-lighten-5 mb-3 border border-orange-lighten-3">
                    <div class="text-caption font-weight-bold text-orange-darken-4 mb-2 d-flex align-center">
                      <v-icon icon="mdi-truck" size="small" class="mr-1" />
                      Datos de Despacho y Entrega:
                    </div>
                    <v-text-field
                      v-model="checkoutDeliveryAddress"
                      label="Dirección de Destino / Obra"
                      prepend-inner-icon="mdi-map-marker"
                      variant="outlined"
                      density="compact"
                      class="bg-white mb-2"
                      hide-details
                    />
                    <v-text-field
                      v-model="checkoutCarrier"
                      label="Transporte / Chofer / Patente"
                      prepend-inner-icon="mdi-account-tie"
                      variant="outlined"
                      density="compact"
                      class="bg-white"
                      hide-details
                    />
                  </div>

                  <!-- Observaciones generales de la venta -->
                  <v-textarea
                    v-model="checkoutSaleNotes"
                    label="Observaciones en comprobante (opcional)"
                    rows="2"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="bg-white"
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- Acciones del Modal de Confirmación -->
        <v-card-actions class="pa-4 bg-white border-t d-flex justify-space-between flex-wrap ga-2">
          <v-btn
            color="grey-darken-2"
            variant="text"
            class="font-weight-bold text-none"
            :disabled="isProcessingCheckout"
            @click="checkoutConfirmDialog = false"
          >
            <v-icon icon="mdi-arrow-left" class="mr-1" />
            Cancelar [ESC]
          </v-btn>

          <div class="d-flex ga-2">
            <!-- Confirmar y Descargar PDF -->
            <v-btn
              color="error"
              variant="tonal"
              class="font-weight-bold text-none"
              :loading="isProcessingCheckout"
              @click="confirmAndExecuteCheckout({ andPdf: true })"
            >
              <v-icon icon="mdi-file-pdf-box" class="mr-1" />
              Confirmar y Bajar PDF
            </v-btn>

            <!-- Confirmar Cobro e Imprimir -->
            <v-btn
              :color="cartStore.voucherType === 'REMITO' ? 'amber-darken-4' : 'primary'"
              variant="flat"
              size="large"
              class="font-weight-black text-none px-5"
              :loading="isProcessingCheckout"
              @click="confirmAndExecuteCheckout({ andPrint: false })"
            >
              <v-icon icon="mdi-check-circle" class="mr-1" />
              Confirmar Cobro e Imprimir [Enter]
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO DE TICKET / COMPROBANTE EMITIDO -->
    <v-dialog v-model="ticketDialog" max-width="420" @keydown.esc="closeTicketDialog">
      <v-card v-if="lastSale">
        <v-card-text class="pa-4 text-center" id="printable-ticket">
          <div class="text-h6 font-weight-black">{{ businessStore.comercio.nombre }}</div>
          <div class="text-caption">CUIT: {{ businessStore.comercio.cuit }} | {{ businessStore.condicionIvaLabel }}</div>
          <div class="text-caption">{{ businessStore.comercio.direccion }} - Tel: {{ businessStore.comercio.telefono }}</div>
          <v-divider class="my-2" />

          <div class="d-flex justify-space-between text-body-2 font-weight-bold">
            <span>{{ lastSale.voucherType.replace('_', ' ') }}</span>
            <span>N° {{ lastSale.voucherNumber }}</span>
          </div>
          <div class="text-caption text-left text-grey">
            Fecha: {{ formatDate(lastSale.createdAt) }}
          </div>
          <div class="text-caption text-left text-grey font-weight-medium" v-if="lastSale.userName">
            {{ lastSale.voucherType === 'PRESUPUESTO' ? 'Cotizado por: ' : 'Atendido por: ' }}
            <strong>{{ lastSale.userName }}</strong> ({{ lastSale.userRole || 'Operador' }})
          </div>
          <div class="text-caption text-left text-amber-darken-4 font-weight-bold" v-if="lastSale.validUntil">
            Válido hasta: {{ formatDate(lastSale.validUntil) }}
          </div>
          <div class="text-caption text-left text-teal-darken-3 font-weight-bold" v-else-if="lastSale.voucherType === 'PRESUPUESTO'">
            Validez: Sin fecha de caducidad (sujeto a stock)
          </div>
          <div class="text-caption text-left text-grey">
            Cliente: {{ lastSale.customer.name }} ({{ lastSale.customer.taxCondition }})
          </div>
          <div class="text-caption text-left text-grey" v-if="lastSale.customer.phone">
            Tel: {{ lastSale.customer.phone }}
          </div>
          <div class="text-caption text-left text-amber-darken-4 font-weight-bold" v-if="lastSale.voucherType === 'REMITO' && lastSale.remitoDeliveryAddress">
            Entrega en: {{ lastSale.remitoDeliveryAddress }}
          </div>
          <div class="text-caption text-left text-grey" v-if="lastSale.voucherType === 'REMITO' && lastSale.remitoCarrier">
            Transporte: {{ lastSale.remitoCarrier }}
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
          <div class="d-flex justify-space-between text-caption text-grey" v-if="lastSale.cashReceived">
            <span>Abonó con:</span>
            <span>${{ formatMoney(lastSale.cashReceived) }}</span>
          </div>
          <div class="d-flex justify-space-between text-caption text-teal-darken-3 font-weight-bold" v-if="lastSale.cashChange > 0">
            <span>Su vuelto:</span>
            <span>${{ formatMoney(lastSale.cashChange) }}</span>
          </div>
          <div class="text-caption text-right text-grey">
            {{ lastSale.voucherType === 'PRESUPUESTO' ? 'Condición: Cotización sujeta a stock' : 'Pago con: ' + lastSale.paymentMethod }}
          </div>
          <div class="text-caption text-left text-grey font-italic mt-1" v-if="lastSale.notes">
            Obs: {{ lastSale.notes }}
          </div>

          <v-divider class="my-2" />
          <div class="text-caption text-grey" v-if="lastSale.voucherType === 'PRESUPUESTO'">
            {{ lastSale.validUntil ? 'Precios presupuestados válidos hasta la fecha indicada.' : 'Cotización sin fecha de caducidad sujeta a reposición de stock al concretar la compra.' }} • Comprobante no válido como factura fiscal
          </div>
          <div class="text-caption text-grey" v-else>
            {{ businessStore.comercio.pieTicket }}
          </div>
          <div class="text-caption font-weight-medium">{{ businessStore.comercio.mensajeAgradecimiento }}</div>
        </v-card-text>

        <v-card-actions class="pa-3 d-flex flex-column ga-2">
          <div class="d-flex w-100 ga-2">
            <v-btn variant="tonal" color="error" class="flex-grow-1 font-weight-bold text-none" @click="downloadLastSalePdf">
              <v-icon icon="mdi-file-pdf-box" class="mr-1" /> Descargar PDF
            </v-btn>
            <v-btn variant="flat" color="primary" class="flex-grow-1 font-weight-bold text-none" @click="printTicket">
              <v-icon icon="mdi-printer" class="mr-1" /> Imprimir (Enter)
            </v-btn>
          </div>
          <v-btn variant="text" color="grey" block size="small" @click="closeTicketDialog">
            Cerrar [ESC]
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- BARRA FLOTANTE INFERIOR PARA TELÉFONOS (ACCESO DIRECTO AL CARRITO) -->
    <v-sheet
      v-if="cartStore.itemsCount > 0"
      elevation="8"
      color="primary"
      class="d-md-none position-fixed bottom-0 left-0 right-0 px-4 py-2 text-white d-flex align-center justify-space-between shadow-lg"
      style="bottom: 0; left: 0; right: 0; z-index: 1000;"
    >
      <div>
        <div class="text-caption text-blue-grey-lighten-3 font-weight-medium">
          {{ cartStore.itemsCount }} {{ cartStore.itemsCount === 1 ? 'artículo' : 'artículos' }}
        </div>
        <div class="text-subtitle-1 font-weight-black text-amber-accent-2">
          ${{ formatMoney(cartStore.total) }}
        </div>
      </div>
      <v-btn
        color="secondary"
        variant="flat"
        class="font-weight-black text-none"
        @click="scrollToCart"
      >
        <v-icon icon="mdi-cart-arrow-down" class="mr-1" />
        Ver Carrito / Cobrar
      </v-btn>
    </v-sheet>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useModuleStore } from '@/stores/moduleStore';
import { playSuccessBeep, playErrorBeep } from '@/utils/audioFeedback';
import { generateVoucherPdf } from '@/utils/pdfGenerator';

const productStore = useProductStore();
const cartStore = useCartStore();
const businessStore = useBusinessStore();
const customerStore = useCustomerStore();
const moduleStore = useModuleStore();

const searchInputRef = ref(null);
const ticketDialog = ref(false);
const pendingOrdersDialog = ref(false);
const customerDialog = ref(false);
const newCustomerDialog = ref(false);
const presupuestoDialog = ref(false);
const pendingTab = ref('todos');
const lastSale = ref(null);

// Variables reactivas para el modal de confirmación de cobro / remito
const checkoutConfirmDialog = ref(false);
const isProcessingCheckout = ref(false);
const checkoutCashReceived = ref('');
const checkoutSaleNotes = ref('');
const checkoutDeliveryAddress = ref('');
const checkoutCarrier = ref('');
const checkoutError = ref('');

const checkoutCashDifference = computed(() => {
  const val = parseFloat(String(checkoutCashReceived.value || '').replace(',', '.'));
  if (isNaN(val)) return -Number(cartStore.total || 0);
  return val - Number(cartStore.total || 0);
});

const checkoutCashChange = computed(() => {
  return Math.max(0, checkoutCashDifference.value);
});

const cashSuggestions = computed(() => {
  const total = Number(cartStore.total || 0);
  if (total <= 0) return [];
  const suggestions = new Set();
  suggestions.add(total);
  const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
  for (const d of denominations) {
    if (d >= total && d <= total * 2.5) {
      suggestions.add(d);
    } else if (d < total) {
      const nextMult = Math.ceil(total / d) * d;
      if (nextMult >= total && nextMult <= total * 2) {
        suggestions.add(nextMult);
      }
    }
  }
  return Array.from(suggestions).filter(v => v >= total).sort((a, b) => a - b).slice(0, 5);
});

const presupuestoForm = ref({
  sinVencimiento: false,
  validDays: 15,
  notes: ''
});

const newCustomerForm = ref({
  nombre: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  condicion_iva: 'CONSUMIDOR_FINAL',
  telefono: '',
  email: '',
  direccion: ''
});

function scrollToCart() {
  const el = document.getElementById('cart-column');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

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
  { title: 'Presupuesto (Cotización) [Por defecto]', value: 'PRESUPUESTO' },
  { title: 'Ticket X (Venta Mostrador)', value: 'TICKET_X' },
  { title: 'Remito de Entrega', value: 'REMITO' }
];

const paymentMethods = [
  { title: 'Efectivo', value: 'EFECTIVO' },
  { title: 'Transferencia (Alias/CBU)', value: 'TRANSFERENCIA' },
  { title: 'Tarjeta Débito', value: 'DEBITO' },
  { title: 'Tarjeta Crédito', value: 'CREDITO' },
  { title: 'Mercado Pago / QR', value: 'MERCADOPAGO' },
  { title: 'Cuenta Corriente', value: 'CTA_CTE' }
];

function focusSearch() {
  nextTick(() => {
    if (searchInputRef.value?.$el?.querySelector('input')) {
      searchInputRef.value.$el.querySelector('input').focus();
    }
  });
}

const filteredPendingOrders = computed(() => {
  if (pendingTab.value === 'presupuestos') {
    return cartStore.presupuestosList;
  }
  if (pendingTab.value === 'preventas') {
    return cartStore.preventasList;
  }
  return cartStore.pendingOrders;
});

function handleGlobalKeydown(e) {
  if (e.key === 'F2') {
    e.preventDefault();
    if (cartStore.items.length > 0) {
      if (cartStore.voucherType === 'PRESUPUESTO') {
        convertAndOpenCheckout();
      } else {
        openCheckoutConfirmDialog();
      }
    }
  } else if (e.key === 'Enter' && checkoutConfirmDialog.value && !isProcessingCheckout.value) {
    if (document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      confirmAndExecuteCheckout({ andPrint: false });
    }
  } else if (e.key === 'F4') {
    e.preventDefault();
    handleDiscardEditing();
    focusSearch();
  } else if (e.key === 'F6') {
    e.preventDefault();
    if (cartStore.items.length > 0) {
      if (cartStore.isEditingPresupuesto) {
        handleUpdatePresupuesto();
      } else {
        openPresupuestoDialog();
      }
    }
  } else if (e.key === 'F7') {
    e.preventDefault();
    pendingOrdersDialog.value = !pendingOrdersDialog.value;
  } else if (e.key === 'F8') {
    e.preventDefault();
    cartStore.togglePriceMode();
  } else if (e.key === 'Escape') {
    if (checkoutConfirmDialog.value) {
      checkoutConfirmDialog.value = false;
      return;
    }
    if (ticketDialog.value) closeTicketDialog();
    if (pendingOrdersDialog.value) pendingOrdersDialog.value = false;
    if (customerDialog.value) customerDialog.value = false;
    if (newCustomerDialog.value) newCustomerDialog.value = false;
    if (presupuestoDialog.value) presupuestoDialog.value = false;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  businessStore.initBusiness();
  customerStore.fetchCustomers();
  cartStore.loadPendingOrders();
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
  if (product.isActive === false || Number(product.stock) <= 0) {
    playErrorBeep();
    alert(`El artículo "${product.name}" (#${product.sku}) está SIN STOCK (No disponible para mostrador).`);
    return;
  }
  cartStore.addItem(product, 1);
  playSuccessBeep();
  focusSearch();
}

function handleEnterSearch() {
  const query = (productStore.searchQuery || '').trim();
  if (!query) return;

  const exactMatch = productStore.products.find(
    p => p.sku.toLowerCase() === query.toLowerCase() || (p.barcode && p.barcode === query)
  );

  if (exactMatch) {
    if (exactMatch.isActive === false || Number(exactMatch.stock) <= 0) {
      playErrorBeep();
      alert(`El artículo "${exactMatch.name}" (#${exactMatch.sku}) está SIN STOCK (No disponible para la venta).`);
      return;
    }
    addToCart(exactMatch);
    productStore.searchQuery = '';
    return;
  }

  const matches = productStore.filteredProducts.filter(p => p.isActive !== false && Number(p.stock) > 0);
  if (matches.length === 1) {
    addToCart(matches[0]);
    productStore.searchQuery = '';
    return;
  }

  // Not found
  playErrorBeep();
}

function openCustomerDialog() {
  customerDialog.value = true;
}

function handleSelectCustomer(cust) {
  customerStore.selectCustomer(cust);
  cartStore.setCustomer(cust);
  customerDialog.value = false;
  playSuccessBeep();
}

function resetCustomerToDefault() {
  customerStore.resetToDefault();
  cartStore.setCustomer(customerStore.selectedCustomer);
  customerDialog.value = false;
}

function openNewCustomerDialog() {
  newCustomerForm.value = {
    nombre: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    condicion_iva: 'CONSUMIDOR_FINAL',
    telefono: '',
    email: '',
    direccion: ''
  };
  newCustomerDialog.value = true;
}

function openNewCustomerDialogWithSearch() {
  newCustomerForm.value = {
    nombre: customerStore.searchQuery,
    tipo_documento: 'DNI',
    numero_documento: '',
    condicion_iva: 'CONSUMIDOR_FINAL',
    telefono: '',
    email: '',
    direccion: ''
  };
  newCustomerDialog.value = true;
}

async function handleSaveNewCustomer() {
  if (!newCustomerForm.value.nombre.trim()) return;
  const res = await customerStore.addCustomer(newCustomerForm.value);
  if (res.success) {
    cartStore.setCustomer(res.customer);
    newCustomerDialog.value = false;
    customerDialog.value = false;
    playSuccessBeep();
  }
}

function openPresupuestoDialog() {
  if (cartStore.items.length === 0) return;
  const existing = cartStore.activeOrderId ? cartStore.pendingOrders.find(o => o.id === cartStore.activeOrderId) : null;
  if (existing) {
    presupuestoForm.value = {
      sinVencimiento: !existing.validUntil,
      validDays: existing.validUntil ? 15 : null,
      notes: existing.notes || ('Presupuesto de mostrador para ' + (cartStore.customer.name || 'Consumidor Final'))
    };
  } else {
    presupuestoForm.value = {
      sinVencimiento: false,
      validDays: 15,
      notes: 'Presupuesto de mostrador para ' + (cartStore.customer.name || 'Consumidor Final')
    };
  }
  presupuestoDialog.value = true;
}

function confirmSavePresupuesto(action = 'save') {
  const days = presupuestoForm.value.sinVencimiento ? null : Number(presupuestoForm.value.validDays || 15);
  let pres;
  if (cartStore.isEditingPresupuesto) {
    pres = cartStore.updateActivePresupuesto(presupuestoForm.value.notes, days);
  } else {
    pres = cartStore.saveAsPresupuesto(presupuestoForm.value.notes, days);
  }
  presupuestoDialog.value = false;
  playSuccessBeep();

  if (!pres) return;

  if (action === 'print') {
    printPresupuestoTicket(pres);
  } else if (action === 'pdf') {
    downloadPresupuestoPdf(pres);
  }
}

function downloadPresupuestoPdf(pres) {
  if (!pres) return;
  const voucher = {
    voucherType: 'PRESUPUESTO',
    voucherNumber: pres.orderNumber,
    createdAt: pres.createdAt,
    validUntil: pres.validUntil,
    customer: pres.customer || { name: 'Consumidor Final', taxCondition: 'Consumidor Final' },
    items: pres.items,
    subtotal: pres.subtotal,
    discount: pres.discount || 0,
    total: pres.total,
    paymentMethod: 'PRESUPUESTO',
    priceMode: pres.priceMode || 'selling',
    userName: pres.createdBy?.name || pres.userName || 'Mostrador',
    userRole: pres.createdBy?.role || pres.userRole || 'Vendedor',
    notes: pres.notes || ''
  };
  generateVoucherPdf(voucher, businessStore.comercio);
}

function downloadOrderPdf(ord) {
  if (!ord) return;
  const voucher = {
    voucherType: ord.type || 'PRESUPUESTO',
    voucherNumber: ord.orderNumber,
    createdAt: ord.createdAt,
    validUntil: ord.validUntil,
    customer: ord.customer || { name: 'Consumidor Final', taxCondition: 'Consumidor Final' },
    items: ord.items,
    subtotal: ord.subtotal,
    discount: ord.discount || 0,
    total: ord.total,
    paymentMethod: ord.type === 'PRESUPUESTO' ? 'PRESUPUESTO' : 'MOSTRADOR',
    priceMode: ord.priceMode || 'selling',
    userName: ord.createdBy?.name || ord.userName || 'Mostrador',
    userRole: ord.createdBy?.role || ord.userRole || 'Vendedor',
    notes: ord.notes || ''
  };
  generateVoucherPdf(voucher, businessStore.comercio);
}

function downloadLastSalePdf() {
  if (!lastSale.value) return;
  generateVoucherPdf(lastSale.value, businessStore.comercio);
}

function handleUpdatePresupuesto() {
  const updated = cartStore.updateActivePresupuesto();
  if (updated) {
    playSuccessBeep();
    alert(`Presupuesto ${updated.orderNumber} actualizado con éxito.`);
  }
}

function handleDiscardEditing() {
  cartStore.discardActiveEditing();
}

function confirmClearCart() {
  if (cartStore.items.length === 0) return;
  if (window.confirm('¿Desea vaciar todos los artículos del mostrador?')) {
    cartStore.clearCart();
    playSuccessBeep();
    focusSearch();
  }
}

function handleQtyBlur(index, qty) {
  const val = Number(qty);
  if (!val || isNaN(val) || val <= 0) {
    cartStore.updateQuantity(index, 1);
  }
}

function loadOrderToCart(orderId) {
  const ok = cartStore.loadPendingOrder(orderId, false);
  if (ok) {
    pendingOrdersDialog.value = false;
    playSuccessBeep();
    focusSearch();
  }
}

function printPresupuestoTicket(ord) {
  lastSale.value = {
    voucherType: 'PRESUPUESTO',
    voucherNumber: ord.orderNumber,
    createdAt: ord.createdAt,
    validUntil: ord.validUntil,
    customer: ord.customer || { name: 'Consumidor Final', taxCondition: 'Consumidor Final' },
    items: ord.items,
    subtotal: ord.subtotal,
    discount: ord.discount || 0,
    total: ord.total,
    paymentMethod: 'PRESUPUESTO',
    priceMode: ord.priceMode || 'selling',
    isPresupuesto: true,
    userName: ord.createdBy?.name || ord.userName || 'Mostrador',
    userRole: ord.createdBy?.role || ord.userRole || 'Vendedor',
    notes: ord.notes || ''
  };
  ticketDialog.value = true;
}

function handleSavePendingOrder() {
  if (cartStore.items.length === 0) return;
  const order = cartStore.saveAsPendingOrder();
  if (order) {
    playSuccessBeep();
    focusSearch();
  }
}

function resumePendingOrder(orderId) {
  cartStore.loadPendingOrder(orderId);
  pendingOrdersDialog.value = false;
  playSuccessBeep();
  focusSearch();
}

function convertAndOpenCheckout() {
  if (cartStore.items.length === 0) return;
  // Si estaba en presupuesto, pasar a Ticket X (venta de mostrador) para poder cobrar y descontar stock
  if (cartStore.voucherType === 'PRESUPUESTO') {
    cartStore.voucherType = 'TICKET_X';
  }
  openCheckoutConfirmDialog();
}

function openCheckoutConfirmDialog() {
  if (cartStore.items.length === 0) return;
  // Garantizar que la venta efectiva nunca quede como presupuesto
  if (cartStore.voucherType === 'PRESUPUESTO') {
    cartStore.voucherType = 'TICKET_X';
  }
  checkoutError.value = '';
  isProcessingCheckout.value = false;
  checkoutCashReceived.value = cartStore.paymentMethod === 'EFECTIVO' ? cartStore.total : '';
  checkoutSaleNotes.value = '';
  checkoutDeliveryAddress.value = cartStore.customer.address || cartStore.customer.direccion || '';
  checkoutCarrier.value = '';
  checkoutConfirmDialog.value = true;
}

async function confirmAndExecuteCheckout({ andPrint = false, andPdf = false } = {}) {
  if (cartStore.items.length === 0) return;
  try {
    isProcessingCheckout.value = true;
    checkoutError.value = '';

    const cashNum = parseFloat(String(checkoutCashReceived.value || '').replace(',', '.'));
    const extraInfo = {
      notes: (checkoutSaleNotes.value || '').trim(),
      cashReceived: !isNaN(cashNum) && cashNum > 0 ? cashNum : cartStore.total,
      cashChange: !isNaN(cashNum) && cashNum > cartStore.total ? cashNum - cartStore.total : 0,
      remitoDeliveryAddress: (checkoutDeliveryAddress.value || '').trim(),
      remitoCarrier: (checkoutCarrier.value || '').trim()
    };

    const result = await cartStore.checkout(extraInfo);
    if (result) {
      lastSale.value = result;
      checkoutConfirmDialog.value = false;
      playSuccessBeep();

      if (andPdf) {
        downloadLastSalePdf();
      } else if (andPrint) {
        window.print();
      } else {
        ticketDialog.value = true;
      }
    } else {
      checkoutError.value = 'No se pudo procesar la venta. Verifique los artículos e intente nuevamente.';
      playErrorBeep();
    }
  } catch (err) {
    console.error('[PosView] Error al procesar checkout:', err);
    checkoutError.value = err.message || 'Ocurrió un error inesperado al registrar el cobro.';
    playErrorBeep();
  } finally {
    isProcessingCheckout.value = false;
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

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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
.cart-item-card {
  transition: all 0.15s ease-in-out;
  border-color: #E2E8F0 !important;
}
.cart-item-card:hover {
  border-color: #CBD5E1 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.item-order-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 800;
  background: #E2E8F0;
  color: #475569;
}
.qty-stepper {
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  background: #F8FAFC;
  overflow: hidden;
}
.qty-btn {
  min-width: 24px !important;
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
}
.qty-input-modern {
  width: 44px;
  height: 24px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-family: monospace;
  font-weight: 700;
  color: #1E293B;
  text-align: center;
  -moz-appearance: textfield;
}
.qty-input-modern::-webkit-outer-spin-button,
.qty-input-modern::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.stock-alert-border {
  border-color: #F59E0B !important;
  background-color: #FFFBEB !important;
}
.border-t-dashed {
  border-top: 1px dashed #E2E8F0;
}
.text-2xs {
  font-size: 9px !important;
  line-height: 12px !important;
}
.delete-btn {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
}
.responsive-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.compact-orders-table th,
.compact-orders-table td {
  padding: 4px 8px !important;
  font-size: 12.5px;
}
.sticky-action-col {
  position: sticky;
  right: 0;
  background: white;
  z-index: 2;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.05);
}
@media (min-width: 960px) {
  .pos-cart-col {
    position: sticky;
    top: 64px;
    z-index: 5;
  }
  .pos-cart-card {
    max-height: calc(100vh - 76px);
    overflow-y: auto;
  }
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
