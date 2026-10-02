<template>
  <v-container fluid class="pa-4">
    <v-card elevation="2" class="mb-4">
      <v-card-item class="bg-amber-lighten-5 py-3">
        <div class="d-flex align-center">
          <v-icon icon="mdi-shield-alert-outline" color="warning" size="32" class="mr-3" />
          <div>
            <div class="text-h6 font-weight-bold text-amber-darken-4">
              Auditoría y Validación de Datos (Planilla de Entrada)
            </div>
            <div class="text-body-2 text-grey-darken-2">
              Se detectaron 5 artículos con inconsistencias críticas entre el Precio de Costo y el Precio de Venta.
            </div>
          </div>
        </div>
      </v-card-item>

      <v-divider />

      <v-card-text class="pa-4">
        <v-alert
          type="info"
          variant="tonal"
          density="comfortable"
          class="mb-4"
        >
          <strong>Recomendación del sistema:</strong> En un negocio de ferretería es habitual que los proveedores facturen en rollos/cajas pero en mostrador se venda fraccionado (por metro o unidad), o que existan errores de tipeo al cargar listas. Corregir estos valores asegura que los reportes de margen de ganancia sean 100% reales.
        </v-alert>

        <v-table density="comfortable" hover>
          <thead>
            <tr class="bg-grey-lighten-4">
              <th class="font-weight-bold">Código SKU</th>
              <th class="font-weight-bold">Descripción</th>
              <th class="font-weight-bold text-right">Precio Costo</th>
              <th class="font-weight-bold text-right">Precio Venta</th>
              <th class="font-weight-bold">Diagnóstico Técnico</th>
              <th class="font-weight-bold text-center">Corrección Sugerida</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><v-chip size="x-small" color="primary">2028</v-chip></td>
              <td class="font-weight-bold">LLAVE AJUSTABLE LLC12 - LLP12</td>
              <td class="text-right text-error font-weight-bold">$38.040,00</td>
              <td class="text-right text-error font-weight-bold">$68,04</td>
              <td>
                <v-chip size="small" color="error" variant="flat">Error tipográfico</v-chip>
                <div class="text-caption text-grey">Se cargó $68.04 en vez de $68.040,00 o $76.080,00</div>
              </td>
              <td class="text-center font-weight-bold text-success">
                Venta sugerida: $76.080,00 (+100% margen)
              </td>
            </tr>

            <tr>
              <td><v-chip size="x-small" color="primary">6000</v-chip></td>
              <td class="font-weight-bold">MANGUERA CRISTAL 3/4 X METRO</td>
              <td class="text-right text-error font-weight-bold">$36.700,00</td>
              <td class="text-right font-weight-bold">$3.000,00</td>
              <td>
                <v-chip size="small" color="warning" variant="flat">Unidad de Medida no coincidente</v-chip>
                <div class="text-caption text-grey">Costo por rollo (25m o 50m) vs Venta por metro</div>
              </td>
              <td class="text-center font-weight-bold text-success">
                Costo unitario real: $1.468,00 / metro
              </td>
            </tr>

            <tr>
              <td><v-chip size="x-small" color="primary">12000</v-chip></td>
              <td class="font-weight-bold">BARBIJO KN95</td>
              <td class="text-right text-error font-weight-bold">$1.735,00</td>
              <td class="text-right text-error font-weight-bold">$1.000,00</td>
              <td>
                <v-chip size="small" color="error" variant="flat">Margen Negativo (-42%)</v-chip>
                <div class="text-caption text-grey">El costo supera el precio de venta</div>
              </td>
              <td class="text-center font-weight-bold text-success">
                Ajustar venta a $2.500,00
              </td>
            </tr>

            <tr>
              <td><v-chip size="x-small" color="primary">20</v-chip></td>
              <td class="font-weight-bold">DISCO DE CORTE 115X 6 DESBASTE RAPTOR</td>
              <td class="text-right text-error font-weight-bold">$8.700,00</td>
              <td class="text-right text-error font-weight-bold">$3.400,00</td>
              <td>
                <v-chip size="small" color="error" variant="flat">Margen Negativo (-60%)</v-chip>
                <div class="text-caption text-grey">Costo invertido o paquete vs unidad</div>
              </td>
              <td class="text-center font-weight-bold text-success">
                Verificar pack x 5 o venta sugerida: $14.000,00
              </td>
            </tr>

            <tr>
              <td><v-chip size="x-small" color="primary">21</v-chip></td>
              <td class="font-weight-bold">DISCO DIAMANTADO TURBO 115 MM X 8 MM RAPTOR</td>
              <td class="text-right text-error font-weight-bold">$18.900,00</td>
              <td class="text-right text-error font-weight-bold">$9.400,00</td>
              <td>
                <v-chip size="small" color="error" variant="flat">Margen Negativo (-50%)</v-chip>
                <div class="text-caption text-grey">El costo cargado es exactamente el doble</div>
              </td>
              <td class="text-center font-weight-bold text-success">
                Venta sugerida: $28.000,00 o Costo real $5.000
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
</script>
