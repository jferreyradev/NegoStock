<template>
  <v-container fluid class="pa-4">
    <!-- METRICAS DE CABECERA -->
    <v-row class="mb-2">
      <v-col cols="12" sm="6" :md="authStore.canViewCosts ? 3 : 4">
        <v-card elevation="2" class="pa-3">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey font-weight-bold">PRODUCTOS REGISTRADOS</div>
              <div class="text-h5 font-weight-black text-primary">
                {{ productStore.products.length }}
                <span class="text-caption text-grey font-weight-regular">
                  ({{ productStore.availableProducts.length }} activos)
                </span>
              </div>
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
          <!-- Botón de Copia de Seguridad y Exportación (Exclusivo Superusuario / SaaS Master) -->
          <v-btn
            v-if="authStore.canManageBackup"
            color="deep-purple-accent-4"
            variant="flat"
            prepend-icon="mdi-database-export"
            class="font-weight-bold text-none mr-2 text-white"
            @click="openBackupDialog"
          >
            <v-icon icon="mdi-shield-crown" start size="small" class="mr-1 text-amber-accent-2" />
            Copia de Seguridad
          </v-btn>

          <!-- Botón de Alta de Producto (Sólo Admin / Encargado) -->
          <v-btn
            v-if="authStore.canEditPrices"
            color="success"
            prepend-icon="mdi-plus-box"
            class="font-weight-bold text-none mr-2"
            elevation="2"
            @click="openCreateDialog"
          >
            Nuevo Artículo
          </v-btn>

          <!-- Botón de Importar Catálogo Excel (Sólo Admin / Encargado) -->
          <v-btn
            v-if="authStore.canEditPrices"
            color="teal-darken-2"
            variant="tonal"
            prepend-icon="mdi-file-excel-box"
            class="font-weight-bold text-none mr-2"
            title="Importar productos por lote desde Excel o CSV"
            @click="openImportDialog"
          >
            Importar Excel
          </v-btn>

          <!-- Botón Exportar Catálogo a Excel -->
          <v-btn
            color="grey-darken-2"
            variant="outlined"
            prepend-icon="mdi-download"
            class="font-weight-bold text-none mr-2"
            title="Exportar catálogo completo a Excel (.xlsx)"
            @click="handleExportCatalog"
          >
            Exportar
          </v-btn>

          <!-- Filtro de Disponibilidad -->
          <v-select
            v-model="productStore.filterAvailability"
            :items="availabilityFilterOptions"
            density="compact"
            variant="outlined"
            style="width: 175px;"
            hide-details
            prepend-inner-icon="mdi-eye-check-outline"
          />

          <v-switch
            v-model="productStore.filterOnlyLowStock"
            label="Sólo Stock Bajo"
            color="error"
            density="compact"
            hide-details
            class="mr-2"
          />
          <v-text-field
            v-model="productStore.searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar código, nombre o marca..."
            density="compact"
            variant="outlined"
            style="width: 250px;"
            clearable
            hide-details
          />
          <v-select
            v-model="productStore.selectedCategory"
            :items="productStore.categories"
            density="compact"
            variant="outlined"
            style="width: 160px;"
            hide-details
          />
        </div>
      </v-card-title>

      <v-divider />

      <div class="responsive-table-wrapper">
        <v-table density="compact" hover class="compact-inventory-table">
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
              <th class="font-weight-bold text-center">Disponibilidad</th>
              <th v-if="authStore.canAdjustStock || authStore.canEditPrices" class="font-weight-bold text-center sticky-action-col">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="prod in paginatedTable"
              :key="prod.id"
              :class="{
                'bg-red-lighten-5': prod.stock <= 0 || (prod.stock <= prod.minStock && prod.isActive),
                'bg-grey-lighten-4 text-grey-darken-1': !prod.isActive
              }"
            >
              <td>
                <v-chip size="x-small" :color="prod.isActive && prod.stock > 0 ? 'primary' : 'grey'" variant="tonal" class="font-weight-bold font-mono text-2xs">
                  {{ prod.sku }}
                </v-chip>
              </td>
              <td class="font-weight-medium">
                <div class="text-truncate text-body-2 font-weight-bold" style="max-width: 240px;" :title="prod.name">
                  {{ prod.name }}
                </div>
                <div v-if="prod.barcode" class="text-caption text-grey font-mono" style="font-size: 10px;">
                  <v-icon icon="mdi-barcode" size="10" /> {{ prod.barcode }}
                </div>
              </td>
              <td>
                <v-chip size="x-small" variant="outlined" class="text-2xs">{{ prod.dept }}</v-chip>
              </td>
              <td>
                <span class="text-caption text-grey-darken-2" style="font-size: 11px;">{{ prod.brand }}</span>
              </td>
              <!-- Columna de Costo Ocultable -->
              <td v-if="authStore.canViewCosts" class="text-right text-caption font-mono">
                ${{ formatMoney(prod.costPrice) }}
              </td>
              <td class="text-right font-weight-bold font-mono" :class="prod.isActive && prod.stock > 0 ? 'text-primary' : 'text-grey'">
                ${{ formatMoney(prod.sellingPrice) }}
              </td>
              <td class="text-right text-caption font-mono">
                {{ prod.wholesalePrice > 0 ? '$' + formatMoney(prod.wholesalePrice) : '-' }}
              </td>
              <td class="text-center">
                <v-chip
                  size="x-small"
                  :color="prod.stock <= 0 ? 'error' : (prod.stock <= prod.minStock ? 'warning' : 'success')"
                  variant="flat"
                  class="font-weight-bold text-2xs"
                >
                  {{ prod.stock }} {{ prod.unit }}
                </v-chip>
              </td>
              <td class="text-center text-caption text-grey" style="font-size: 11px;">
                {{ prod.minStock }}
              </td>

              <!-- DISPONIBILIDAD (DISPONIBLE / SIN STOCK / PAUSADO) -->
              <td class="text-center">
                <v-chip
                  v-if="prod.stock <= 0"
                  size="x-small"
                  color="error"
                  variant="flat"
                  class="font-weight-bold text-2xs"
                  title="Sin existencia: Pasa a No Disponible automáticamente. Nunca se elimina."
                >
                  <v-icon icon="mdi-alert-circle-outline" start size="10" />
                  Sin stock
                </v-chip>
                <v-chip
                  v-else
                  size="x-small"
                  :color="prod.isActive ? 'success' : 'blue-grey'"
                  :variant="prod.isActive ? 'flat' : 'outlined'"
                  class="font-weight-bold cursor-pointer text-2xs"
                  :title="prod.isActive ? 'Artículo disponible para mostrador' : 'Artículo pausado por encargado'"
                  @click="toggleAvailability(prod)"
                >
                  <v-icon :icon="prod.isActive ? 'mdi-check-circle' : 'mdi-pause-circle'" start size="10" />
                  {{ prod.isActive ? 'Disponible' : 'Pausado' }}
                </v-chip>
              </td>

              <!-- ACCIONES STICKY A LA DERECHA (NUNCA SE PIERDEN DE VISTA) -->
              <td v-if="authStore.canAdjustStock || authStore.canEditPrices" class="text-center text-no-wrap sticky-action-col">
                <!-- Editar Artículo completo (Admin/Encargado) -->
                <v-btn
                  v-if="authStore.canEditPrices"
                  icon="mdi-pencil"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  class="mr-1 action-btn"
                  title="Modificar Artículo"
                  @click="openEditDialog(prod)"
                />

                <!-- Ajuste de Stock rápido -->
                <v-btn
                  v-if="authStore.canAdjustStock"
                  icon="mdi-package-variant-plus"
                  size="x-small"
                  variant="tonal"
                  color="secondary"
                  class="mr-1 action-btn"
                  title="Ajuste Rápido de Stock"
                  @click="openAdjustDialog(prod)"
                />

                <!-- Ver Historial de Precios y Kardex de Stock -->
                <v-btn
                  icon="mdi-history"
                  size="x-small"
                  variant="tonal"
                  color="info"
                  class="mr-1 action-btn"
                  title="Ver Historia de Precios y Kardex de Stock"
                  @click="openHistoryDialog(prod)"
                />

                <!-- Alternar disponibilidad (Sin borrado físico) -->
                <v-btn
                  v-if="authStore.canEditPrices"
                  :icon="prod.isActive ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  size="x-small"
                  variant="tonal"
                  :color="prod.isActive ? 'warning' : 'success'"
                  :title="prod.isActive ? 'Pausar (Hacer No Disponible)' : 'Habilitar (Hacer Disponible)'"
                  class="action-btn"
                  @click="toggleAvailability(prod)"
                />
              </td>
            </tr>

            <tr v-if="productStore.filteredProducts.length === 0">
              <td colspan="11" class="text-center py-6 text-grey">
                No se encontraron artículos con los criterios seleccionados
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <!-- Paginación -->
      <v-card-actions class="d-flex justify-space-between align-center pa-4 border-t">
        <div class="text-caption text-grey">
          Mostrando {{ (page - 1) * perPage + 1 }} a {{ Math.min(page * perPage, productStore.filteredProducts.length) }} de {{ productStore.filteredProducts.length }} productos
        </div>
        <v-pagination
          v-model="page"
          :length="Math.ceil(productStore.filteredProducts.length / perPage) || 1"
          density="compact"
          total-visible="5"
        />
      </v-card-actions>
    </v-card>

    <!-- DIÁLOGO DE ALTA / MODIFICACIÓN DE ARTÍCULO -->
    <v-dialog v-model="productDialog" max-width="740" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon :icon="isEditing ? 'mdi-pencil-box' : 'mdi-plus-box'" class="mr-2" />
            <span>{{ isEditing ? 'Modificar Artículo' : 'Alta de Nuevo Artículo' }}</span>
          </div>
          <v-chip v-if="isEditing" size="small" color="secondary" variant="flat" class="font-weight-bold">
            SKU: {{ form.sku }}
          </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row dense>
            <!-- DISPONIBILIDAD SWITCH (NO BORRADO) -->
            <v-col cols="12" class="mb-2">
              <v-sheet class="pa-3 bg-grey-lighten-4 rounded d-flex align-center justify-space-between">
                <div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ form.isActive ? 'Artículo Disponible para Venta' : 'Artículo No Disponible / Pausado' }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ form.isActive ? 'Visible en el Punto de Venta para facturación inmediata' : 'Oculto en el mostrador para evitar ventas accidentales' }}
                  </div>
                </div>
                <v-switch
                  v-model="form.isActive"
                  color="success"
                  density="compact"
                  hide-details
                />
              </v-sheet>
            </v-col>

            <!-- CÓDIGOS -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.sku"
                label="Código SKU *"
                placeholder="Ej: BUL-0042 o dejar vacío para autogenerar"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-identifier"
                :disabled="isEditing"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.barcode"
                label="Código de Barras (EAN-13)"
                placeholder="Escanear o ingresar código"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-barcode-scan"
                append-inner-icon="mdi-refresh"
                @click:append-inner="generateBarcode"
                hide-details="auto"
              />
            </v-col>

            <!-- DESCRIPCIÓN Y NOMBRE -->
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="Nombre / Descripción Comercial *"
                placeholder="Ej: Tornillo Autoperforante T1 8x1/2 (Caja x 100)"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-format-title"
                autofocus
                :rules="[v => !!v || 'El nombre es obligatorio']"
              />
            </v-col>

            <!-- CLASIFICACIÓN -->
            <v-col cols="12" sm="4">
              <v-combobox
                v-model="form.dept"
                :items="categoryOptions"
                label="Rubro / Departamento *"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-shape"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-combobox
                v-model="form.brand"
                :items="brandOptions"
                label="Marca *"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-tag"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.unit"
                :items="unitOptions"
                label="Unidad de Medida *"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12">
              <v-divider class="my-2" />
              <div class="text-caption font-weight-bold text-primary mb-2">PRECIOS Y MÁRGENES DE VENTA</div>
            </v-col>

            <!-- PRECIOS Y MARGEN -->
            <v-col cols="12" sm="3">
              <v-text-field
                v-model.number="form.costPrice"
                label="Precio Costo ($)"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                prefix="$"
                @input="onCostOrMarginChange"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model.number="form.margin"
                label="Margen (%)"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                suffix="%"
                @input="onCostOrMarginChange"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model.number="form.sellingPrice"
                label="Precio Venta ($) *"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                prefix="$"
                class="font-weight-bold"
                @input="onSellingPriceChange"
                :rules="[v => Number(v) > 0 || 'El precio debe ser mayor a 0']"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model.number="form.wholesalePrice"
                label="Precio Gremio ($)"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                prefix="$"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-select
                v-model.number="form.ivaRate"
                :items="ivaOptions"
                label="Alícuota IVA"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
            </v-col>

            <!-- STOCK -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.stock"
                :label="isEditing ? 'Stock Actual' : 'Stock Inicial'"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                :suffix="form.unit"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.minStock"
                label="Stock Mínimo (Alerta)"
                type="number"
                step="any"
                variant="outlined"
                density="compact"
                :suffix="form.unit"
                hide-details="auto"
              />
            </v-col>

            <!-- DETALLES TÉCNICOS -->
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Detalles Técnicos / Ubicación en Depósito"
                placeholder="Ej: Pasillo 3, Estante B - Acero inoxidable calidad 304"
                variant="outlined"
                density="compact"
                rows="2"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" @click="productDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="px-5 font-weight-bold"
            :loading="productStore.loading"
            @click="saveProductForm"
          >
            <v-icon icon="mdi-content-save" start />
            {{ isEditing ? 'Guardar Cambios' : 'Dar de Alta Artículo' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO DE HISTORIA DE ARTÍCULO (AUDITORÍA DE PRECIOS Y KARDEX DE STOCK) -->
    <v-dialog v-model="historyDialog" max-width="850">
      <v-card v-if="historyProduct">
        <v-card-title class="bg-indigo-darken-2 text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-history" class="mr-2" />
            <span>Historia y Trazabilidad: {{ historyProduct.name }}</span>
          </div>
          <v-chip size="small" color="white" variant="tonal" class="font-weight-bold">
            SKU: #{{ historyProduct.sku }}
          </v-chip>
        </v-card-title>

        <v-tabs v-model="historyTab" grow bg-color="grey-lighten-4" color="primary">
          <v-tab value="prices" class="font-weight-bold text-none">
            <v-icon icon="mdi-currency-usd" start />
            Historial de Precios ({{ currentPriceHistory.length }})
          </v-tab>
          <v-tab value="stock" class="font-weight-bold text-none">
            <v-icon icon="mdi-swap-horizontal" start />
            Kardex de Movimientos de Stock ({{ currentStockHistory.length }})
          </v-tab>
        </v-tabs>

        <v-card-text class="pa-4" style="max-height: 520px; overflow-y: auto;">
          <v-window v-model="historyTab">
            <!-- PESTAÑA HISTORIAL DE PRECIOS -->
            <v-window-item value="prices">
              <div class="responsive-table-wrapper">
                <v-table density="compact" hover>
                  <thead>
                    <tr class="bg-grey-lighten-4">
                      <th class="font-weight-bold">Fecha / Hora</th>
                      <th class="font-weight-bold text-right">P. Costo Anterior</th>
                      <th class="font-weight-bold text-right">P. Costo Nuevo</th>
                      <th class="font-weight-bold text-right">P. Venta Anterior</th>
                      <th class="font-weight-bold text-right">P. Venta Nuevo</th>
                      <th class="font-weight-bold text-center">Variación %</th>
                      <th class="font-weight-bold">Motivo</th>
                      <th class="font-weight-bold">Modificado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="h in currentPriceHistory" :key="h.id || h.creado_en">
                      <td class="text-caption font-weight-medium">
                        {{ formatDate(h.creado_en) }}
                      </td>
                      <td class="text-right text-caption text-grey">
                        ${{ formatMoney(h.costo_anterior) }}
                      </td>
                      <td class="text-right text-caption font-weight-bold">
                        ${{ formatMoney(h.costo_nuevo) }}
                      </td>
                      <td class="text-right text-caption text-grey">
                        ${{ formatMoney(h.venta_anterior) }}
                      </td>
                      <td class="text-right font-weight-bold text-primary">
                        ${{ formatMoney(h.venta_nueva) }}
                      </td>
                      <td class="text-center">
                        <v-chip
                          size="x-small"
                          :color="getVariationColor(h.venta_anterior, h.venta_nueva)"
                          variant="tonal"
                          class="font-weight-bold"
                        >
                          {{ calcVariation(h.venta_anterior, h.venta_nueva) }}
                        </v-chip>
                      </td>
                      <td class="text-caption">
                        <v-chip size="x-small" variant="outlined">{{ h.motivo_cambio || 'Ajuste' }}</v-chip>
                      </td>
                      <td class="text-caption font-weight-bold text-grey-darken-3">
                        <v-icon icon="mdi-account" size="x-small" color="primary" class="mr-1" />
                        {{ h.usuario_nombre || 'Sistema / Admin' }}
                      </td>
                    </tr>

                    <tr v-if="currentPriceHistory.length === 0">
                      <td colspan="8" class="text-center py-6 text-grey">
                        No se han registrado modificaciones de precio para este artículo aún.
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>

            <!-- PESTAÑA KARDEX DE STOCK -->
            <v-window-item value="stock">
              <div class="responsive-table-wrapper">
                <v-table density="compact" hover>
                  <thead>
                    <tr class="bg-grey-lighten-4">
                      <th class="font-weight-bold">Fecha / Hora</th>
                      <th class="font-weight-bold">Tipo Movimiento</th>
                      <th class="font-weight-bold text-center">Cantidad</th>
                      <th class="font-weight-bold text-center">Saldo Resultante</th>
                      <th class="font-weight-bold">Detalle / Notas</th>
                      <th class="font-weight-bold">Operador / Autor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="m in currentStockHistory" :key="m.id || m.creado_en">
                      <td class="text-caption font-weight-medium">
                        {{ formatDate(m.creado_en) }}
                      </td>
                      <td>
                        <v-chip size="x-small" :color="getMovementColor(m.tipo_movimiento)" variant="flat" class="font-weight-bold">
                          {{ m.tipo_movimiento }}
                        </v-chip>
                      </td>
                      <td class="text-center font-weight-bold" :class="Number(m.cantidad) >= 0 ? 'text-success' : 'text-error'">
                        {{ Number(m.cantidad) > 0 ? '+' : '' }}{{ m.cantidad }} {{ historyProduct.unit }}
                      </td>
                      <td class="text-center font-weight-black text-body-2">
                        {{ m.saldo_posterior }} {{ historyProduct.unit }}
                      </td>
                      <td class="text-caption text-grey-darken-1">
                        {{ m.notas || '-' }}
                      </td>
                      <td class="text-caption font-weight-bold text-grey-darken-3">
                        <v-icon icon="mdi-account" size="x-small" color="secondary" class="mr-1" />
                        {{ m.usuario_nombre || (m.notas?.includes('[por ') ? m.notas.split('[por ')[1]?.replace(']', '') : (m.notas?.includes('[Operador: ') ? m.notas.split('[Operador: ')[1]?.replace(']', '') : 'Sistema')) }}
                      </td>
                    </tr>

                    <tr v-if="currentStockHistory.length === 0">
                      <td colspan="6" class="text-center py-6 text-grey">
                        No hay movimientos de Kardex registrados para este artículo aún.
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="historyDialog = false">Cerrar Historia</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

    <!-- DIÁLOGO DE COPIA DE SEGURIDAD Y DESCARGA DE DATOS (EXCLUSIVO SUPERUSUARIO) -->
    <v-dialog v-model="backupDialog" max-width="620">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-deep-purple-accent-4 text-white d-flex align-center py-3">
          <v-icon icon="mdi-shield-crown" class="mr-2 text-amber-accent-2" />
          <span>Copia de Seguridad & Restauración (Exclusivo Superusuario)</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Bloqueo de seguridad si no es Superusuario -->
          <div v-if="!authStore.canManageBackup" class="py-6 text-center">
            <v-icon icon="mdi-shield-lock-outline" size="64" color="error" class="mb-3" />
            <div class="text-h6 font-weight-bold text-error mb-2">Acceso Exclusivo de Superusuario</div>
            <div class="text-body-2 text-grey-darken-1 mb-4">
              Por razones de seguridad e integridad de la plataforma, únicamente el Superusuario (SaaS Master) tiene autorización para generar copias de seguridad o restaurar la base de datos.
            </div>
            <v-btn color="grey-darken-1" variant="outlined" @click="backupDialog = false">Cerrar</v-btn>
          </div>

          <div v-else>
            <div class="text-body-2 text-grey-darken-2 mb-4">
              Panel maestro de resguardo y migración. Permite generar copias completas de la base de datos de PostgreSQL/Supabase o restaurar el catálogo a un punto inicial seguro.
            </div>

            <v-list density="comfortable" class="border rounded-lg mb-4">
              <!-- 1. Descargar Backup SQL -->
              <v-list-item class="py-3">
                <template #prepend>
                  <v-avatar color="deep-purple-lighten-5" variant="flat" size="42">
                    <v-icon icon="mdi-database-arrow-down" color="deep-purple-accent-4" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-black">
                  Backup Completo en SQL (.sql)
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Instrucciones SQL con tablas maestras, artículos, rubros, marcas y empleados. Listo para restaurar con 1 clic en otra base.
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    color="deep-purple-accent-4"
                    variant="flat"
                    size="small"
                    class="font-weight-bold text-none text-white"
                    :loading="isExportingSql"
                    @click="requestSuperadminAuth(handleExportSql)"
                  >
                    <v-icon icon="mdi-download" class="mr-1" />
                    Descargar SQL
                  </v-btn>
                </template>
              </v-list-item>

              <v-divider />

              <!-- 2. Descargar Backup JSON -->
              <v-list-item class="py-3">
                <template #prepend>
                  <v-avatar color="secondary" variant="tonal" size="42">
                    <v-icon icon="mdi-code-json" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-black">
                  Backup Completo en JSON (.json)
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Estructura de datos limpia y portable para integraciones, análisis o respaldo independiente.
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    color="secondary"
                    variant="flat"
                    size="small"
                    class="font-weight-bold text-none"
                    :loading="isExportingJson"
                    @click="requestSuperadminAuth(handleExportJson)"
                  >
                    <v-icon icon="mdi-download" class="mr-1" />
                    Descargar JSON
                  </v-btn>
                </template>
              </v-list-item>

              <v-divider />

              <!-- 3. Exportar Catálogo a CSV / Excel -->
              <v-list-item class="py-3">
                <template #prepend>
                  <v-avatar color="success" variant="tonal" size="42">
                    <v-icon icon="mdi-file-excel-box" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-black">
                  Planilla de Artículos a Excel / CSV (.csv)
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Planilla compatible con Excel con SKU, descripciones, stock, precios y marcas.
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    color="success"
                    variant="flat"
                    size="small"
                    class="font-weight-bold text-none"
                    @click="handleExportCsv"
                  >
                    <v-icon icon="mdi-download" class="mr-1" />
                    Descargar CSV
                  </v-btn>
                </template>
              </v-list-item>

              <v-divider />

              <!-- 4. Restaurar Punto Inicial desde Backup JSON -->
              <v-list-item class="py-3 bg-deep-purple-lighten-5">
                <template #prepend>
                  <v-avatar color="deep-purple-accent-4" variant="tonal" size="42">
                    <v-icon icon="mdi-backup-restore" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-black text-deep-purple-darken-3">
                  Restaurar Punto Inicial desde Backup (.json)
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Cargá un archivo de backup para restablecer la base de datos al estado inicial del catálogo.
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    color="deep-purple-accent-4"
                    variant="flat"
                    size="small"
                    class="font-weight-bold text-none"
                    :loading="isRestoringJson"
                    @click="requestSuperadminAuth(triggerRestoreInput)"
                  >
                    <v-icon icon="mdi-upload" class="mr-1" />
                    Restaurar Backup
                  </v-btn>
                  <input
                    ref="restoreInputRef"
                    type="file"
                    accept=".json"
                    style="display: none;"
                    @change="handleRestoreFileChange"
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-alert type="info" variant="tonal" density="compact" class="text-caption">
              <v-icon icon="mdi-shield-check" start size="small" />
              Operaciones protegidas bajo credenciales del Superusuario. Toda acción queda auditada localmente.
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey-darken-2" @click="backupDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE CONFIRMACIÓN DE CLAVE DE SUPERUSUARIO (MÁSCARA TOTAL) -->
    <v-dialog v-model="superadminAuthDialog" max-width="440" persistent>
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-deep-purple-accent-4 text-white d-flex align-center py-3">
          <v-icon icon="mdi-shield-lock" class="mr-2 text-amber-accent-2" />
          <span class="text-subtitle-1 font-weight-black">Confirmación de Superusuario</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-caption text-grey-darken-1 mb-3">
            Operación crítica de base de datos. Ingresá el código o clave de Superusuario para autorizar la acción.
          </div>
          <v-text-field
            v-model="superadminAuthInput"
            label="Código / Clave de Superusuario"
            type="password"
            variant="outlined"
            density="comfortable"
            autofocus
            :error-messages="superadminAuthError"
            prepend-inner-icon="mdi-key"
            placeholder="••••"
            @keydown.enter="confirmSuperadminAuth"
          />
          <div class="text-caption text-grey-darken-1 d-flex align-center mt-2">
            <v-icon icon="mdi-eye-off" size="small" class="mr-1 text-deep-purple" />
            Entrada enmascarada: Tu código permanece totalmente confidencial y oculto.
          </div>
        </v-card-text>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-btn variant="text" color="grey" @click="cancelSuperadminAuth">Cancelar</v-btn>
          <v-spacer />
          <v-btn
            color="deep-purple-accent-4"
            variant="flat"
            class="font-weight-bold px-4 text-white"
            @click="confirmSuperadminAuth"
          >
            Autorizar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE IMPORTACIÓN MASIVA DE PRODUCTOS (EXCEL / CSV) -->
    <v-dialog v-model="importDialog" max-width="860" persistent>
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-teal-darken-2 text-white d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-file-excel-box" class="mr-2" size="26" />
            <div>
              <div class="text-subtitle-1 font-weight-black">Importación Masiva de Productos</div>
              <div class="text-caption text-teal-lighten-4 font-weight-regular">
                Carga inicial de inventario, nuevos artículos y actualización desde planillas
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="importDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- PASO 1: DESCARGAR PLANTILLA -->
          <v-card variant="outlined" class="pa-4 mb-4 bg-teal-lighten-5 border-teal-lighten-3">
            <div class="d-flex align-start justify-space-between flex-wrap gap-2">
              <div class="flex-grow-1" style="max-width: 520px;">
                <div class="d-flex align-center mb-1">
                  <v-avatar color="teal-darken-2" size="26" class="text-white text-caption font-weight-bold mr-2">1</v-avatar>
                  <strong class="text-subtitle-2 text-teal-darken-4 font-weight-black">Descargá la Plantilla Oficial de Carga</strong>
                </div>
                <div class="text-caption text-grey-darken-2 mb-2">
                  La plantilla contiene las columnas requeridas (SKU, Código de Barras, Descripción, Rubro, Marca, Precios y Stock) junto a <strong>ejemplos de referencia</strong> y notas de ayuda.
                </div>
                <div class="d-flex gap-2 flex-wrap">
                  <v-chip size="x-small" color="teal-darken-3" variant="flat" class="font-weight-bold">
                    Descripción (Obligatorio)
                  </v-chip>
                  <v-chip size="x-small" color="blue-grey-darken-1" variant="tonal">
                    SKU (Si se omite, se autogenera)
                  </v-chip>
                  <v-chip size="x-small" color="blue-grey-darken-1" variant="tonal">
                    Venta = Costo + Margen % (Autocálculo)
                  </v-chip>
                </div>
              </div>

              <div class="d-flex flex-column ga-2 justify-center">
                <v-btn
                  color="teal-darken-2"
                  variant="flat"
                  size="small"
                  class="font-weight-bold text-none shadow-sm"
                  prepend-icon="mdi-microsoft-excel"
                  @click="handleDownloadTemplate('xlsx')"
                >
                  Bajar Plantilla (.xlsx)
                </v-btn>
                <v-btn
                  color="grey-darken-2"
                  variant="outlined"
                  size="small"
                  class="font-weight-bold text-none bg-white"
                  prepend-icon="mdi-file-delimited-outline"
                  @click="handleDownloadTemplate('csv')"
                >
                  Bajar Plantilla (.csv)
                </v-btn>
              </div>
            </div>
          </v-card>

          <!-- PASO 2: SUBIR ARCHIVO -->
          <v-card variant="outlined" class="pa-4 mb-4 bg-white border-grey-lighten-2">
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="26" class="text-white text-caption font-weight-bold mr-2">2</v-avatar>
              <strong class="text-subtitle-2 text-primary font-weight-black">Subí tu Planilla Completada</strong>
            </div>

            <v-file-input
              v-model="importFile"
              accept=".xlsx, .xls, .csv"
              label="Seleccionar o arrastrar archivo Excel (.xlsx, .xls) o CSV..."
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-paperclip"
              prepend-icon=""
              show-size
              clearable
              hide-details
              class="mb-3"
              @update:model-value="handleFileSelect"
            />

            <!-- Opciones de importación -->
            <div class="d-flex align-center justify-space-between flex-wrap mt-2">
              <v-checkbox
                v-model="updateExistingProducts"
                label="Actualizar datos de productos existentes si el Código SKU ya existe en el sistema"
                color="primary"
                density="compact"
                hide-details
                class="font-weight-medium text-caption"
              />
            </div>
          </v-card>

          <!-- ALERTA DE ERROR DE PARSEO -->
          <v-alert
            v-if="importError"
            type="error"
            variant="tonal"
            density="comfortable"
            closable
            class="mb-3 text-caption font-weight-medium"
            @click:close="importError = ''"
          >
            {{ importError }}
          </v-alert>

          <!-- PASO 3: VISTA PREVIA Y RESUMEN (SI HAY PRODUCTOS PARSEADOS) -->
          <v-card v-if="parsedProducts.length > 0" variant="outlined" class="mb-2 border-grey-lighten-2 overflow-hidden">
            <div class="pa-3 bg-grey-lighten-4 border-b d-flex align-center justify-space-between flex-wrap gap-2">
              <div class="d-flex align-center">
                <v-icon icon="mdi-table-check" color="teal-darken-2" class="mr-2" />
                <span class="text-subtitle-2 font-weight-black">
                  Vista Previa ({{ parsedProducts.length }} productos detectados)
                </span>
              </div>

              <!-- Resumen de Nuevos vs Existentes -->
              <div class="d-flex ga-2">
                <v-chip size="small" color="success" variant="flat" class="font-weight-bold">
                  <v-icon icon="mdi-plus-circle" start size="x-small" />
                  {{ importSummary.newCount }} Nuevos
                </v-chip>
                <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
                  <v-icon icon="mdi-refresh" start size="x-small" />
                  {{ importSummary.updateCount }} a Actualizar
                </v-chip>
                <v-chip v-if="importSummary.ignoredCount > 0" size="small" color="grey" variant="tonal">
                  {{ importSummary.ignoredCount }} vacíos ignorados
                </v-chip>
              </div>
            </div>

            <!-- Tabla de vista previa -->
            <div class="responsive-table-wrapper" style="max-height: 260px; overflow-y: auto;">
              <v-table density="compact" hover class="compact-update-table">
                <thead>
                  <tr class="bg-grey-lighten-5">
                    <th class="font-weight-bold" style="width: 90px;">Acción</th>
                    <th class="font-weight-bold" style="width: 110px;">SKU</th>
                    <th class="font-weight-bold">Descripción</th>
                    <th class="font-weight-bold" style="width: 110px;">Rubro</th>
                    <th class="font-weight-bold" style="width: 100px;">Marca</th>
                    <th class="font-weight-bold text-right" style="width: 95px;">Costo</th>
                    <th class="font-weight-bold text-right" style="width: 95px;">Venta</th>
                    <th class="font-weight-bold text-center" style="width: 70px;">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, idx) in parsedProducts.slice(0, 50)" :key="idx">
                    <td>
                      <v-chip
                        size="x-small"
                        :color="p.isExisting ? 'primary' : 'success'"
                        variant="flat"
                        class="font-weight-bold font-mono"
                      >
                        {{ p.isExisting ? 'ACTUALIZAR' : 'NUEVO' }}
                      </v-chip>
                    </td>
                    <td>
                      <span class="font-mono text-caption text-grey-darken-3 font-weight-bold">
                        {{ p.sku || '(Auto-SKU)' }}
                      </span>
                    </td>
                    <td>
                      <div class="text-truncate font-weight-medium text-caption" style="max-width: 220px;" :title="p.name">
                        {{ p.name }}
                      </div>
                    </td>
                    <td class="text-caption text-truncate" style="max-width: 110px;">{{ p.dept }}</td>
                    <td class="text-caption text-truncate" style="max-width: 100px;">{{ p.brand }}</td>
                    <td class="text-right text-caption font-mono">${{ formatMoney(p.costPrice) }}</td>
                    <td class="text-right text-caption font-mono font-weight-bold text-primary">${{ formatMoney(p.sellingPrice) }}</td>
                    <td class="text-center text-caption font-mono font-weight-bold">{{ p.stock }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
            <div v-if="parsedProducts.length > 50" class="pa-2 bg-grey-lighten-4 text-center text-caption text-grey-darken-1 border-t">
              Mostrando las primeras 50 filas de {{ parsedProducts.length }} productos a importar.
            </div>
          </v-card>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 bg-grey-lighten-4 d-flex justify-space-between align-center">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none font-weight-medium"
            @click="importDialog = false"
          >
            Cancelar
          </v-btn>

          <v-btn
            color="teal-darken-2"
            variant="flat"
            size="large"
            class="px-6 font-weight-bold text-none shadow-sm"
            :disabled="parsedProducts.length === 0 || isImporting"
            :loading="isImporting"
            @click="executeImport"
          >
            <v-icon icon="mdi-database-import" start />
            Confirmar e Importar {{ parsedProducts.length }} Productos
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR DE NOTIFICACIÓN -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore';
import {
  downloadBlob,
  generateSqlBackupContent,
  fetchFullDatabasePayload,
  generateProductsCsv,
  restoreDatabaseFromJson
} from '@/services/backupService';
import {
  exportCatalogToExcel,
  downloadProductImportTemplate,
  parseProductImportFile
} from '@/services/excelService';

const productStore = useProductStore();
const authStore = useAuthStore();

const page = ref(1);
const perPage = ref(20);

// Diálogos y estado
const productDialog = ref(false);
const isEditing = ref(false);
const adjustDialog = ref(false);
const historyDialog = ref(false);
const backupDialog = ref(false);
const isExportingSql = ref(false);
const isExportingJson = ref(false);
const superadminAuthDialog = ref(false);
const superadminAuthInput = ref('');
const superadminAuthError = ref('');
let pendingSuperadminAction = null;

// ========================================================
// IMPORTACIÓN Y EXPORTACIÓN MASIVA DE PRODUCTOS (EXCEL / CSV)
// ========================================================
const importDialog = ref(false);
const importFile = ref(null);
const importError = ref('');
const isImporting = ref(false);
const updateExistingProducts = ref(true);
const parsedProducts = ref([]);
const importSummary = ref({
  totalRows: 0,
  validCount: 0,
  newCount: 0,
  updateCount: 0,
  ignoredCount: 0
});

function openImportDialog() {
  if (!authStore.canEditPrices) {
    snackbar.text = 'Acceso Denegado: Se requiere rol de Administrador o Encargado para importar artículos.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  importFile.value = null;
  importError.value = '';
  parsedProducts.value = [];
  importSummary.value = { totalRows: 0, validCount: 0, newCount: 0, updateCount: 0, ignoredCount: 0 };
  importDialog.value = true;
}

function handleDownloadTemplate(format = 'xlsx') {
  downloadProductImportTemplate(format);
}

function handleExportCatalog() {
  exportCatalogToExcel(productStore.products, 'xlsx');
  snackbar.text = `¡Catálogo completo exportado a Excel (${productStore.products.length} artículos)!`;
  snackbar.color = 'success';
  snackbar.show = true;
}

async function handleFileSelect(file) {
  importError.value = '';
  parsedProducts.value = [];
  if (!file) return;

  const actualFile = Array.isArray(file) ? file[0] : file;
  if (!actualFile) return;

  try {
    const result = await parseProductImportFile(actualFile);
    if (!result.products || result.products.length === 0) {
      importError.value = 'El archivo no contiene filas válidas de productos con descripción.';
      return;
    }

    let newCount = 0;
    let updateCount = 0;

    const analyzedProducts = result.products.map(p => {
      const skuClean = p.sku?.trim().toLowerCase();
      const exists = skuClean && productStore.products.some(
        ep => ep.sku && ep.sku.toLowerCase().trim() === skuClean
      );
      if (exists) {
        updateCount++;
      } else {
        newCount++;
      }
      return {
        ...p,
        isExisting: Boolean(exists)
      };
    });

    parsedProducts.value = analyzedProducts;
    importSummary.value = {
      totalRows: result.totalRows,
      validCount: result.validCount,
      newCount,
      updateCount,
      ignoredCount: result.ignoredCount
    };
  } catch (err) {
    importError.value = err.message || 'Error al procesar el archivo Excel / CSV.';
  }
}

async function executeImport() {
  if (parsedProducts.value.length === 0 || isImporting.value) return;

  isImporting.value = true;
  try {
    const res = await productStore.importProductsBatch(parsedProducts.value, {
      updateExisting: updateExistingProducts.value
    });

    if (res.success) {
      importDialog.value = false;
      snackbar.text = `¡Importación exitosa! Se procesaron ${res.total} artículos (${res.createdCount} nuevos dados de alta, ${res.updatedCount} actualizados).`;
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      importError.value = res.error || 'Error al importar los productos.';
    }
  } catch (err) {
    importError.value = err.message || 'Ocurrió un error inesperado al guardar los productos.';
  } finally {
    isImporting.value = false;
  }
}

function openBackupDialog() {
  if (!authStore.canManageBackup) {
    snackbar.text = 'Acceso Denegado: Solo el Superusuario (SaaS Master) puede gestionar copias de seguridad.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  backupDialog.value = true;
}

function requestSuperadminAuth(action) {
  if (!authStore.canManageBackup) {
    snackbar.text = 'Acceso Denegado: Solo el Superusuario tiene autorización para esta operación.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  pendingSuperadminAction = action;
  superadminAuthInput.value = '';
  superadminAuthError.value = '';
  superadminAuthDialog.value = true;
}

function confirmSuperadminAuth() {
  if (!authStore.verifySuperadminCode(superadminAuthInput.value)) {
    superadminAuthError.value = 'Código o clave de Superusuario incorrecta.';
    return;
  }
  superadminAuthDialog.value = false;
  if (typeof pendingSuperadminAction === 'function') {
    const action = pendingSuperadminAction;
    pendingSuperadminAction = null;
    action();
  }
}

function cancelSuperadminAuth() {
  superadminAuthDialog.value = false;
  pendingSuperadminAction = null;
  superadminAuthInput.value = '';
  superadminAuthError.value = '';
}

const historyTab = ref('prices');
const selectedProd = ref(null);
const historyProduct = ref(null);
const currentPriceHistory = ref([]);
const currentStockHistory = ref([]);
const newStockVal = ref(0);
const movementReason = ref('CONTEO_FISICO');

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

async function handleExportSql() {
  if (!authStore.canManageBackup) {
    snackbar.text = 'Acceso Denegado: Operación exclusiva de Superusuario.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  isExportingSql.value = true;
  try {
    const { sql, totalCount } = await generateSqlBackupContent({
      products: productStore.products,
      users: authStore.users
    });
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(sql, `negostock_backup_${dateStr}.sql`, 'text/plain;charset=utf-8');
    snackbar.text = `Backup SQL descargado (${totalCount} filas respaldadas)`;
    snackbar.color = 'success';
    snackbar.show = true;
  } catch (err) {
    snackbar.text = 'Error generando el backup SQL: ' + err.message;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isExportingSql.value = false;
  }
}

async function handleExportJson() {
  if (!authStore.canManageBackup) {
    snackbar.text = 'Acceso Denegado: Operación exclusiva de Superusuario.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  isExportingJson.value = true;
  try {
    const payload = await fetchFullDatabasePayload({
      products: productStore.products,
      users: authStore.users
    });
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(JSON.stringify(payload, null, 2), `negostock_backup_${dateStr}.json`, 'application/json;charset=utf-8');
    snackbar.text = 'Backup JSON descargado correctamente';
    snackbar.color = 'success';
    snackbar.show = true;
  } catch (err) {
    snackbar.text = 'Error generando backup JSON: ' + err.message;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isExportingJson.value = false;
  }
}

function handleExportCsv() {
  try {
    const csv = generateProductsCsv(productStore.products, authStore.canViewCosts);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(csv, `negostock_articulos_${dateStr}.csv`, 'text/csv;charset=utf-8');
    snackbar.text = `Catálogo exportado (${productStore.products.length} artículos)`;
    snackbar.color = 'success';
    snackbar.show = true;
  } catch (err) {
    snackbar.text = 'Error exportando catálogo: ' + err.message;
    snackbar.color = 'error';
    snackbar.show = true;
  }
}

const isRestoringJson = ref(false);
const restoreInputRef = ref(null);

function triggerRestoreInput() {
  if (!authStore.canManageBackup) {
    snackbar.text = 'Acceso Denegado: Solo el Superusuario puede restaurar la base de datos.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  if (confirm('¿Deseás restaurar la base de datos con un archivo de backup? Se restablecerán los artículos y configuraciones al estado del punto inicial seleccionado.')) {
    restoreInputRef.value?.click();
  }
}

async function handleRestoreFileChange(event) {
  if (!authStore.canManageBackup) {
    snackbar.text = 'Acceso Denegado: Solo el Superusuario puede restaurar la base de datos.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  const file = event.target?.files?.[0];
  if (!file) return;

  isRestoringJson.value = true;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const { totalRestored } = await restoreDatabaseFromJson(json);
    await productStore.fetchProducts();
    snackbar.text = `Base de datos restaurada con éxito (${totalRestored} registros restablecidos).`;
    snackbar.color = 'success';
    snackbar.show = true;
    backupDialog.value = false;
  } catch (err) {
    snackbar.text = 'Error al restaurar: ' + err.message;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isRestoringJson.value = false;
    if (event.target) event.target.value = '';
  }
}

const availabilityFilterOptions = [
  { title: 'Todos los estados', value: 'TODOS' },
  { title: 'Sólo Disponibles', value: 'DISPONIBLES' },
  { title: 'No Disponibles', value: 'NO_DISPONIBLES' }
];

// Formulario reactivo para alta y edición
const form = reactive({
  id: null,
  sku: '',
  barcode: '',
  name: '',
  description: '',
  dept: 'HERRAMIENTAS',
  brand: 'GENÉRICO',
  unit: 'u',
  costPrice: 0,
  margin: 100,
  sellingPrice: 0,
  wholesalePrice: 0,
  ivaRate: 21,
  stock: 0,
  minStock: 5,
  isActive: true
});

const reasons = [
  { title: 'Conteo Físico / Inventario', value: 'CONTEO_FISICO' },
  { title: 'Ingreso por Compra', value: 'COMPRA' },
  { title: 'Merma / Rotura', value: 'ROTURA' },
  { title: 'Devolución de Cliente', value: 'DEVOLUCION' }
];

const unitOptions = [
  { title: 'Unidad (u)', value: 'u' },
  { title: 'Metro (m)', value: 'm' },
  { title: 'Kilogramo (kg)', value: 'kg' },
  { title: 'Litro (lt)', value: 'lt' },
  { title: 'Bolsa / Paquete', value: 'bolsa' },
  { title: 'Caja', value: 'caja' },
  { title: 'Rollo', value: 'rollo' },
  { title: 'Par', value: 'par' }
];

const ivaOptions = [
  { title: 'IVA 21.00% (General)', value: 21 },
  { title: 'IVA 10.50% (Diferencial)', value: 10.5 },
  { title: 'IVA 0% (Exento)', value: 0 }
];

const categoryOptions = computed(() => {
  return productStore.categories.filter(c => c !== 'TODOS');
});

const brandOptions = computed(() => {
  return productStore.brands.filter(b => b !== 'TODAS');
});

const paginatedTable = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return productStore.filteredProducts.slice(start, start + perPage.value);
});

// Cálculos automáticos de precio / margen
function onCostOrMarginChange() {
  const cost = Number(form.costPrice) || 0;
  const margin = Number(form.margin) || 0;
  form.sellingPrice = Math.round((cost * (1 + margin / 100)) * 100) / 100;
}

function onSellingPriceChange() {
  const cost = Number(form.costPrice) || 0;
  const sell = Number(form.sellingPrice) || 0;
  if (cost > 0) {
    form.margin = Math.round(((sell / cost) - 1) * 100 * 10) / 10;
  }
}

function generateBarcode() {
  form.barcode = '779' + Math.floor(100000000 + Math.random() * 900000000);
}

// Abrir diálogo de alta
function openCreateDialog() {
  isEditing.value = false;
  Object.assign(form, {
    id: null,
    sku: `FERR-${Date.now().toString().slice(-5)}`,
    barcode: '',
    name: '',
    description: '',
    dept: categoryOptions.value[0] || 'HERRAMIENTAS',
    brand: brandOptions.value[0] || 'GENÉRICO',
    unit: 'u',
    costPrice: 0,
    margin: 100,
    sellingPrice: 0,
    wholesalePrice: 0,
    ivaRate: 21,
    stock: 0,
    minStock: 5,
    isActive: true
  });
  productDialog.value = true;
}

// Abrir diálogo de edición
function openEditDialog(prod) {
  isEditing.value = true;
  Object.assign(form, {
    id: prod.id,
    sku: prod.sku,
    barcode: prod.barcode || '',
    name: prod.name,
    description: prod.description || '',
    dept: prod.dept || 'GENERAL',
    brand: prod.brand || 'GENÉRICO',
    unit: prod.unit || 'u',
    costPrice: prod.costPrice,
    margin: prod.costPrice > 0 ? Math.round(((prod.sellingPrice / prod.costPrice) - 1) * 100) : 100,
    sellingPrice: prod.sellingPrice,
    wholesalePrice: prod.wholesalePrice,
    ivaRate: prod.ivaRate || 21,
    stock: prod.stock,
    minStock: prod.minStock,
    isActive: prod.isActive !== false
  });
  productDialog.value = true;
}

// Guardar alta o edición
async function saveProductForm() {
  if (!form.name || !form.sellingPrice) {
    snackbar.text = 'Por favor complete el nombre y precio de venta';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }

  let res;
  if (isEditing.value) {
    res = await productStore.updateProduct(form.id, { ...form });
    if (res.success) {
      snackbar.text = `Artículo "${form.name}" actualizado exitosamente`;
      snackbar.color = 'success';
      productDialog.value = false;
    } else {
      snackbar.text = `Error: ${res.error}`;
      snackbar.color = 'error';
    }
  } else {
    res = await productStore.createProduct({ ...form });
    if (res.success) {
      snackbar.text = `Artículo "${form.name}" dado de alta exitosamente`;
      snackbar.color = 'success';
      productDialog.value = false;
    } else {
      snackbar.text = `Error: ${res.error}`;
      snackbar.color = 'error';
    }
  }
  snackbar.show = true;
}

// Alternar disponibilidad sin borrado físico
async function toggleAvailability(prod) {
  const res = await productStore.toggleProductAvailability(prod.id);
  if (res.success) {
    snackbar.text = res.isActive 
      ? `"${prod.name}" marcado como DISPONIBLE para mostrador`
      : `"${prod.name}" marcado como NO DISPONIBLE (pausado)`;
    snackbar.color = res.isActive ? 'success' : 'blue-grey';
    snackbar.show = true;
  }
}

// Abrir Historia y Trazabilidad (Precios + Kardex)
async function openHistoryDialog(prod) {
  historyProduct.value = prod;
  currentPriceHistory.value = [];
  currentStockHistory.value = [];
  historyDialog.value = true;

  const { priceHistory, stockHistory } = await productStore.fetchProductHistory(prod.id);
  currentPriceHistory.value = priceHistory;
  currentStockHistory.value = stockHistory;
}

function openAdjustDialog(prod) {
  selectedProd.value = prod;
  newStockVal.value = prod.stock;
  adjustDialog.value = true;
}

function saveStockAdjustment() {
  if (selectedProd.value) {
    productStore.updateStock(selectedProd.value.id, newStockVal.value, movementReason.value);
    adjustDialog.value = false;
    snackbar.text = `Stock de "${selectedProd.value.name}" actualizado a ${newStockVal.value}`;
    snackbar.color = 'info';
    snackbar.show = true;
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calcVariation(oldPrice, newPrice) {
  const o = Number(oldPrice) || 0;
  const n = Number(newPrice) || 0;
  if (o === 0) return '+100%';
  const diff = ((n - o) / o) * 100;
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
}

function getVariationColor(oldPrice, newPrice) {
  const o = Number(oldPrice) || 0;
  const n = Number(newPrice) || 0;
  if (n > o) return 'error';
  if (n < o) return 'success';
  return 'grey';
}

function getMovementColor(tipo) {
  const map = {
    VENTA: 'indigo',
    COMPRA: 'success',
    INICIAL: 'teal',
    AJUSTE_POSITIVO: 'blue',
    AJUSTE_NEGATIVO: 'orange',
    ROTURA: 'error'
  };
  return map[tipo] || 'grey';
}

function formatMoney(val) {
  return Number(val || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
</script>

<style scoped>
.responsive-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.compact-inventory-table th,
.compact-inventory-table td {
  padding: 4px 6px !important;
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
tr.bg-grey-lighten-4 td.sticky-action-col {
  background: #F8FAFC !important;
}
.action-btn {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
}
.text-2xs {
  font-size: 9.5px !important;
  line-height: 12px !important;
}
</style>
