<template>
  <v-container fluid class="pa-4">
    <!-- ENCABEZADO PRINCIPAL -->
    <v-card elevation="2" class="mb-4">
      <div class="pa-4 bg-slate-900 text-white d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="d-flex align-center">
          <v-avatar size="44" color="teal-darken-1" class="mr-3 shadow-sm">
            <v-icon icon="mdi-chart-areaspline" size="26" color="white" />
          </v-avatar>
          <div>
            <div class="d-flex align-center ga-2">
              <span class="text-h6 font-weight-black">Informe y Resumen de Ventas</span>
              <v-chip size="x-small" color="teal-accent-3" variant="flat" class="font-weight-black text-black">
                EXCLUSIVO ADMINISTRACIÓN
              </v-chip>
            </div>
            <div class="text-caption text-grey-lighten-2">
              Métricas consolidadas de facturación por Día, Horas Pico y Mes • Auditoría del Propietario / Superusuario
            </div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap ga-2">
          <!-- Botón Generar Demo si hay pocos datos -->
          <v-btn
            size="small"
            variant="tonal"
            color="amber-accent-2"
            class="font-weight-bold text-none"
            title="Generar 45 días de ventas simuladas para ver reportes completos"
            :loading="isSeeding"
            @click="handleSeedDemo"
          >
            <v-icon icon="mdi-database-plus-outline" start size="small" />
            Cargar Ventas Demo
          </v-btn>

          <!-- Exportar a Excel -->
          <v-btn
            size="small"
            variant="flat"
            color="success"
            class="font-weight-bold text-none"
            title="Descargar informe completo en formato Excel (.xlsx)"
            @click="handleExportExcel"
          >
            <v-icon icon="mdi-file-excel-outline" start size="small" />
            Exportar Excel
          </v-btn>

          <!-- Imprimir Reporte -->
          <v-btn
            size="small"
            variant="tonal"
            color="white"
            class="font-weight-bold text-none"
            title="Imprimir resumen ejecutivo"
            @click="window.print()"
          >
            <v-icon icon="mdi-printer" start size="small" />
            Imprimir
          </v-btn>

          <!-- Volver a Lista de Comprobantes -->
          <v-btn
            size="small"
            variant="text"
            color="grey-lighten-2"
            class="font-weight-bold text-none"
            to="/ventas"
          >
            <v-icon icon="mdi-arrow-left" start size="small" />
            Comprobantes
          </v-btn>
        </div>
      </div>

      <!-- BARRA DE FILTROS GLOBALES -->
      <v-divider />
      <div class="pa-3 bg-grey-lighten-5">
        <v-row dense align="center">
          <!-- Selector Rápido de Rango -->
          <v-col cols="12" md="5" class="d-flex align-center flex-wrap ga-1">
            <span class="text-caption font-weight-bold text-grey-darken-3 mr-1">Período:</span>
            <v-btn-toggle
              v-model="periodPreset"
              mandatory
              density="compact"
              color="primary"
              variant="outlined"
              class="flex-wrap"
            >
              <v-btn value="today" size="x-small" class="font-weight-bold text-none px-2">Hoy</v-btn>
              <v-btn value="yesterday" size="x-small" class="font-weight-bold text-none px-2">Ayer</v-btn>
              <v-btn value="last7days" size="x-small" class="font-weight-bold text-none px-2">7 Días</v-btn>
              <v-btn value="thisMonth" size="x-small" class="font-weight-bold text-none px-2">Este Mes</v-btn>
              <v-btn value="lastMonth" size="x-small" class="font-weight-bold text-none px-2">Mes Anterior</v-btn>
              <v-btn value="all" size="x-small" class="font-weight-bold text-none px-2">Histórico</v-btn>
              <v-btn value="custom" size="x-small" class="font-weight-bold text-none px-2">Rango...</v-btn>
            </v-btn-toggle>
          </v-col>

          <!-- Rango personalizado (si seleccionó 'custom') -->
          <v-col v-if="periodPreset === 'custom'" cols="12" sm="6" md="3" class="d-flex align-center ga-1">
            <v-text-field
              v-model="customStartDate"
              type="date"
              label="Desde"
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-text-field
              v-model="customEndDate"
              type="date"
              label="Hasta"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>

          <!-- Filtro Medio de Pago -->
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="selectedPayment"
              :items="paymentOptions"
              label="Medio de Pago"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>

          <!-- Filtro Vendedor / Operador -->
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="selectedOperator"
              :items="operatorOptions"
              label="Operador / Cajero"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- TARJETAS KPI RESUMEN CONSOLIDADO -->
    <v-row dense class="mb-4">
      <!-- 1. Total Facturado -->
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="1" class="pa-3 border-s-lg border-primary h-100 bg-white">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">Facturación Neta</div>
              <div class="text-h5 font-weight-black text-primary mt-1">
                ${{ formatMoney(kpis.totalSales) }}
              </div>
              <div class="text-caption text-grey mt-1">
                {{ kpis.ticketsCount }} transacciones cobradas
              </div>
            </div>
            <v-avatar color="blue-lighten-5" size="36">
              <v-icon icon="mdi-cash-register" color="primary" size="20" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <!-- 2. Ticket Promedio -->
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="1" class="pa-3 border-s-lg border-teal-darken-1 h-100 bg-white">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">Ticket Promedio</div>
              <div class="text-h5 font-weight-black text-teal-darken-3 mt-1">
                ${{ formatMoney(kpis.avgTicket) }}
              </div>
              <div class="text-caption text-grey mt-1">
                Gasto promedio por cliente
              </div>
            </div>
            <v-avatar color="teal-lighten-5" size="36">
              <v-icon icon="mdi-chart-line" color="teal-darken-2" size="20" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <!-- 3. Unidades Vendidas -->
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="1" class="pa-3 border-s-lg border-amber-darken-2 h-100 bg-white">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">Artículos Despachados</div>
              <div class="text-h5 font-weight-black text-amber-darken-4 mt-1">
                {{ kpis.unitsSold.toLocaleString('es-AR') }} u.
              </div>
              <div class="text-caption text-grey mt-1">
                Promedio {{ kpis.ticketsCount > 0 ? (kpis.unitsSold / kpis.ticketsCount).toFixed(1) : 0 }} u. por ticket
              </div>
            </div>
            <v-avatar color="amber-lighten-5" size="36">
              <v-icon icon="mdi-package-variant-closed-check" color="amber-darken-3" size="20" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <!-- 4. Presupuestos y Anulaciones -->
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="1" class="pa-3 border-s-lg border-purple h-100 bg-white">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">Cotizaciones & Retornos</div>
              <div class="text-body-2 font-weight-bold text-purple-darken-3 mt-1">
                Cotizado: ${{ formatMoney(kpis.presupuestosTotal) }} ({{ kpis.presupuestosCount }})
              </div>
              <div class="text-caption text-error font-weight-bold mt-1">
                Anuladas: {{ kpis.refundedCount }} (${{ formatMoney(kpis.refundedTotal) }})
              </div>
            </div>
            <v-avatar color="purple-lighten-5" size="36">
              <v-icon icon="mdi-file-document-edit-outline" color="purple-darken-2" size="20" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- PESTAÑAS PRINCIPALES: DÍA, HORAS, MES, MEDIOS DE PAGO Y VENDEDORES -->
    <v-card elevation="2">
      <v-tabs v-model="activeTab" bg-color="grey-lighten-4" color="primary" density="comfortable" grow>
        <v-tab value="daily" class="font-weight-bold text-none">
          <v-icon icon="mdi-calendar-today" start />
          Resumen por Día
        </v-tab>
        <v-tab value="hourly" class="font-weight-bold text-none">
          <v-icon icon="mdi-clock-time-four-outline" start />
          Resumen por Horas (Horas Pico)
        </v-tab>
        <v-tab value="monthly" class="font-weight-bold text-none">
          <v-icon icon="mdi-calendar-month" start />
          Resumen por Mes
        </v-tab>
        <v-tab value="breakdown" class="font-weight-bold text-none">
          <v-icon icon="mdi-credit-card-outline" start />
          Medios de Pago & Vendedores
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab" class="pa-4">
        <!-- ========================================== -->
        <!-- PESTAÑA 1: RESUMEN POR DÍA                -->
        <!-- ========================================== -->
        <v-window-item value="daily">
          <!-- Insights de Días -->
          <div v-if="dailySummary.length > 0" class="mb-4 d-flex align-center justify-space-between flex-wrap ga-2 bg-blue-grey-lighten-5 pa-3 rounded-lg border">
            <div class="d-flex align-center">
              <v-icon icon="mdi-trophy-outline" color="amber-darken-3" class="mr-2" />
              <span class="text-caption font-weight-bold">
                Día de mayor recaudación: 
                <strong class="text-primary">{{ topDay ? topDay.dayName + ' ' + topDay.dateFormatted : '-' }}</strong> 
                con ${{ formatMoney(topDay ? topDay.total : 0) }} ({{ topDay ? topDay.count : 0 }} tickets).
              </span>
            </div>
            <div class="text-caption text-grey-darken-2">
              Mostrando <strong>{{ dailySummary.length }}</strong> días con ventas registradas
            </div>
          </div>

          <!-- GRÁFICO VISUAL DE BARRAS POR DÍA -->
          <div v-if="dailySummary.length > 0" class="mb-5 pa-3 bg-white border rounded-lg">
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-subtitle-2 font-weight-bold text-slate-800">
                Evolución de Facturación Diaria ($)
              </span>
              <span class="text-caption text-grey">Pasa el cursor sobre cada barra para detalles</span>
            </div>

            <!-- Gráfico de barras responsivo -->
            <div class="chart-container d-flex align-end ga-1 pt-6 pb-2 px-1 overflow-x-auto" style="min-height: 180px;">
              <div
                v-for="day in dailySummary.slice(-30)"
                :key="day.dateKey"
                class="chart-bar-wrapper d-flex flex-column align-center"
                style="flex: 1 1 0; min-width: 28px;"
                :title="`${day.dayName} ${day.dateFormatted}: $${formatMoney(day.total)} (${day.count} tickets)`"
              >
                <!-- Monto abreviado arriba si es barra alta -->
                <span class="chart-bar-val text-2xs font-weight-bold mb-1 text-grey-darken-2">
                  {{ day.total >= 1000000 ? (day.total / 1000000).toFixed(1) + 'M' : (day.total >= 1000 ? (day.total / 1000).toFixed(0) + 'k' : day.total) }}
                </span>
                
                <!-- Barra -->
                <div
                  class="chart-bar rounded-t"
                  :class="day.dateKey === topDay?.dateKey ? 'bg-teal-darken-1' : 'bg-primary'"
                  :style="{
                    height: Math.max(8, (day.total / maxDailyTotal) * 110) + 'px',
                    width: '100%',
                    opacity: 0.9
                  }"
                />

                <!-- Etiqueta día debajo -->
                <span class="chart-bar-label text-2xs mt-1 text-truncate text-center" style="max-width: 32px;">
                  {{ day.shortLabel }}
                </span>
              </div>
            </div>
          </div>

          <!-- TABLA DETALLADA POR DÍA -->
          <div class="responsive-table-wrapper">
            <v-table density="compact" hover class="border rounded-lg compact-report-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="font-weight-bold">Fecha</th>
                  <th class="font-weight-bold">Día</th>
                  <th class="font-weight-bold text-right">Facturación</th>
                  <th class="font-weight-bold text-center">% Período</th>
                  <th class="font-weight-bold text-center">Tickets</th>
                  <th class="font-weight-bold text-right">Ticket Promedio</th>
                  <th class="font-weight-bold text-center">Unidades</th>
                  <th class="font-weight-bold">Medio Principal</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="day in dailySummary"
                  :key="day.dateKey"
                  :class="{ 'bg-teal-lighten-5': day.dateKey === topDay?.dateKey }"
                >
                  <td class="font-weight-bold font-mono text-caption">{{ day.dateFormatted }}</td>
                  <td>
                    <v-chip size="x-small" variant="tonal" :color="day.dayOfWeek === 6 || day.dayOfWeek === 0 ? 'amber-darken-4' : 'blue-grey'" class="text-2xs">
                      {{ day.dayName }}
                    </v-chip>
                  </td>
                  <td class="text-right font-weight-black text-primary font-mono text-caption">
                    ${{ formatMoney(day.total) }}
                  </td>
                  <td class="text-center font-weight-bold text-caption">
                    {{ kpis.totalSales > 0 ? ((day.total / kpis.totalSales) * 100).toFixed(1) : 0 }}%
                  </td>
                  <td class="text-center font-weight-bold text-caption">{{ day.count }}</td>
                  <td class="text-right text-caption font-weight-bold font-mono">${{ formatMoney(day.avgTicket) }}</td>
                  <td class="text-center text-caption">{{ day.units }} u.</td>
                  <td>
                    <v-chip size="x-small" variant="outlined" color="primary" class="text-2xs">
                      {{ day.topPayment }}
                    </v-chip>
                  </td>
                </tr>

                <tr v-if="dailySummary.length === 0">
                  <td colspan="8" class="text-center py-6 text-grey">
                    No hay ventas registradas en el período seleccionado.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>

        <!-- ========================================== -->
        <!-- PESTAÑA 2: RESUMEN POR HORAS (HORAS PICO) -->
        <!-- ========================================== -->
        <v-window-item value="hourly">
          <!-- Tarjetas de Diagnóstico de Horas Pico -->
          <v-row dense class="mb-4">
            <v-col cols="12" md="6">
              <v-card elevation="0" class="pa-3 border bg-teal-lighten-5 rounded-lg">
                <div class="d-flex align-center">
                  <v-avatar color="teal-darken-1" size="36" class="mr-3 text-white">
                    <v-icon icon="mdi-cash-multiple" size="20" />
                  </v-avatar>
                  <div>
                    <div class="text-caption font-weight-bold text-teal-darken-4 text-uppercase">Hora Pico de Facturación</div>
                    <div class="text-subtitle-1 font-weight-black text-teal-darken-3">
                      {{ peakHourRevenue ? peakHourRevenue.label : 'Sin datos' }}
                    </div>
                    <div class="text-caption text-teal-darken-2">
                      Recaudó <strong>${{ formatMoney(peakHourRevenue ? peakHourRevenue.total : 0) }}</strong> 
                      ({{ peakHourRevenue ? peakHourRevenue.percentage.toFixed(1) : 0 }}% de la facturación)
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card elevation="0" class="pa-3 border bg-blue-lighten-5 rounded-lg">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="36" class="mr-3 text-white">
                    <v-icon icon="mdi-account-group" size="20" />
                  </v-avatar>
                  <div>
                    <div class="text-caption font-weight-bold text-blue-darken-4 text-uppercase">Hora Pico de Afluencia (Tickets)</div>
                    <div class="text-subtitle-1 font-weight-black text-primary">
                      {{ peakHourTickets ? peakHourTickets.label : 'Sin datos' }}
                    </div>
                    <div class="text-caption text-blue-darken-2">
                      Emitió <strong>{{ peakHourTickets ? peakHourTickets.count : 0 }} tickets</strong> 
                      ({{ peakHourTickets ? peakHourTickets.percentageTickets.toFixed(1) : 0 }}% del tráfico)
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- GRÁFICO VISUAL DE 24 HORAS -->
          <div class="mb-5 pa-3 bg-white border rounded-lg">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2 font-weight-bold text-slate-800">
                Distribución Horaria de Ventas (00:00 a 23:00 hs)
              </span>
              <span class="text-caption text-grey">Franja comercial habitual: 08:00 a 20:00 hs</span>
            </div>

            <!-- Gráfico de barras horarias -->
            <div class="chart-container d-flex align-end ga-1 pt-6 pb-2 px-1 overflow-x-auto" style="min-height: 190px;">
              <div
                v-for="h in hourlySummary"
                :key="h.hour"
                class="chart-bar-wrapper d-flex flex-column align-center"
                style="flex: 1 1 0; min-width: 22px;"
                :title="`${h.label}: $${formatMoney(h.total)} (${h.count} tickets)`"
              >
                <!-- Valor abreviado si es > 0 -->
                <span class="chart-bar-val text-2xs font-weight-bold mb-1 text-grey-darken-2">
                  {{ h.count > 0 ? h.count + 't' : '' }}
                </span>

                <!-- Barra -->
                <div
                  class="chart-bar rounded-t"
                  :class="h.hour === peakHourRevenue?.hour ? 'bg-teal-darken-1' : (h.count > 0 ? 'bg-primary' : 'bg-grey-lighten-3')"
                  :style="{
                    height: Math.max(4, (h.total / maxHourlyTotal) * 110) + 'px',
                    width: '100%',
                    opacity: h.count > 0 ? 0.9 : 0.4
                  }"
                />

                <!-- Etiqueta hora debajo -->
                <span class="chart-bar-label text-2xs mt-1 text-center font-mono">
                  {{ String(h.hour).padStart(2, '0') }}h
                </span>
              </div>
            </div>
          </div>

          <!-- TABLA HORARIA DETALLADA -->
          <div class="responsive-table-wrapper">
            <v-table density="compact" hover class="border rounded-lg compact-report-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="font-weight-bold">Franja Horaria</th>
                  <th class="font-weight-bold text-right">Facturación</th>
                  <th class="font-weight-bold text-center">% Facturación</th>
                  <th class="font-weight-bold text-center">Tickets</th>
                  <th class="font-weight-bold text-center">% Clientes</th>
                  <th class="font-weight-bold text-right">Ticket Promedio</th>
                  <th class="font-weight-bold text-center">Nivel de Actividad</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="h in hourlySummary.filter(h => h.count > 0 || (h.hour >= 8 && h.hour <= 20))"
                  :key="h.hour"
                  :class="{
                    'bg-teal-lighten-5': h.hour === peakHourRevenue?.hour,
                    'bg-blue-lighten-5': h.hour === peakHourTickets?.hour && h.hour !== peakHourRevenue?.hour
                  }"
                >
                  <td class="font-weight-bold font-mono text-caption">
                    {{ h.label }}
                    <v-chip v-if="h.hour === peakHourRevenue?.hour" size="x-small" color="teal-darken-2" variant="flat" class="ml-2 font-weight-black text-2xs">
                      PICO $
                    </v-chip>
                    <v-chip v-if="h.hour === peakHourTickets?.hour" size="x-small" color="primary" variant="flat" class="ml-2 font-weight-black text-2xs">
                      PICO TICKETS
                    </v-chip>
                  </td>
                  <td class="text-right font-weight-black text-primary font-mono text-caption">
                    ${{ formatMoney(h.total) }}
                  </td>
                  <td class="text-center font-weight-bold text-caption">
                    {{ h.percentage.toFixed(1) }}%
                  </td>
                  <td class="text-center font-weight-bold text-caption">{{ h.count }}</td>
                  <td class="text-center font-weight-bold text-caption">
                    {{ h.percentageTickets.toFixed(1) }}%
                  </td>
                  <td class="text-right text-caption font-weight-bold font-mono">
                    ${{ formatMoney(h.avgTicket) }}
                  </td>
                  <td class="text-center">
                    <v-chip size="x-small" :color="getActivityColor(h.percentage)" variant="flat" class="font-weight-bold text-white text-2xs">
                      {{ getActivityLabel(h.percentage) }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>

        <!-- ========================================== -->
        <!-- PESTAÑA 3: RESUMEN POR MES                -->
        <!-- ========================================== -->
        <v-window-item value="monthly">
          <!-- Gráfico y Tabla Comparativa Mes a Mes -->
          <div v-if="monthlySummary.length > 0" class="mb-5 pa-3 bg-white border rounded-lg">
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-subtitle-2 font-weight-bold text-slate-800">
                Facturación Mensual Consolidada
              </span>
              <span class="text-caption text-grey">Historial de períodos comerciales</span>
            </div>

            <!-- Gráfico de barras mensual -->
            <div class="chart-container d-flex align-end ga-3 pt-6 pb-2 px-3 overflow-x-auto" style="min-height: 180px;">
              <div
                v-for="m in monthlySummary"
                :key="m.monthKey"
                class="chart-bar-wrapper d-flex flex-column align-center"
                style="flex: 1 1 0; min-width: 60px; max-width: 120px;"
                :title="`${m.label}: $${formatMoney(m.total)} (${m.count} tickets)`"
              >
                <span class="chart-bar-val text-xs font-weight-bold mb-1 text-grey-darken-2">
                  ${{ (m.total / 1000).toFixed(0) }}k
                </span>
                
                <div
                  class="chart-bar rounded-t bg-primary"
                  :style="{
                    height: Math.max(12, (m.total / maxMonthlyTotal) * 110) + 'px',
                    width: '100%',
                    opacity: 0.9
                  }"
                />

                <span class="chart-bar-label text-caption mt-1 font-weight-bold text-truncate text-center">
                  {{ m.shortLabel }}
                </span>
              </div>
            </div>
          </div>

          <!-- TABLA MENSUAL DETALLADA -->
          <div class="responsive-table-wrapper">
            <v-table density="compact" hover class="border rounded-lg compact-report-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="font-weight-bold">Mes / Año</th>
                  <th class="font-weight-bold text-right">Facturación Total</th>
                  <th class="font-weight-bold text-center">Variación %</th>
                  <th class="font-weight-bold text-center">Tickets</th>
                  <th class="font-weight-bold text-right">Ticket Promedio</th>
                  <th class="font-weight-bold text-center">Días con Venta</th>
                  <th class="font-weight-bold text-right">Promedio Diario</th>
                  <th class="font-weight-bold text-center">Mejor Día</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, idx) in monthlySummary" :key="m.monthKey">
                  <td class="font-weight-bold text-slate-800 text-caption">{{ m.label }}</td>
                  <td class="text-right font-weight-black text-subtitle-2 text-primary font-mono">
                    ${{ formatMoney(m.total) }}
                  </td>
                  <td class="text-center font-weight-bold">
                    <template v-if="m.growth !== null">
                      <v-chip
                        size="x-small"
                        :color="m.growth >= 0 ? 'success' : 'error'"
                        variant="flat"
                        class="font-weight-bold text-2xs"
                      >
                        <v-icon :icon="m.growth >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" start size="10" />
                        {{ m.growth >= 0 ? '+' : '' }}{{ m.growth.toFixed(1) }}%
                      </v-chip>
                    </template>
                    <span v-else class="text-caption text-grey text-2xs">Base</span>
                  </td>
                  <td class="text-center font-weight-bold text-caption">{{ m.count }}</td>
                  <td class="text-right font-weight-bold text-caption font-mono">${{ formatMoney(m.avgTicket) }}</td>
                  <td class="text-center font-weight-bold text-caption">{{ m.activeDays }} d.</td>
                  <td class="text-right text-caption font-weight-bold font-mono">${{ formatMoney(m.dailyAvg) }}</td>
                  <td class="text-center text-caption font-weight-bold" style="font-size: 11px;">
                    {{ m.bestDay ? m.bestDay.dateFormatted + ' ($' + formatMoney(m.bestDay.total) + ')' : '-' }}
                  </td>
                </tr>

                <tr v-if="monthlySummary.length === 0">
                  <td colspan="8" class="text-center py-6 text-grey">
                    No hay ventas registradas para el análisis mensual.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>

        <!-- ========================================== -->
        <!-- PESTAÑA 4: MEDIOS DE PAGO Y PERSONAL      -->
        <!-- ========================================== -->
        <v-window-item value="breakdown">
          <v-row dense>
            <!-- COLUMNA 1: DISTRIBUCIÓN POR MEDIO DE PAGO -->
            <v-col cols="12" md="6">
              <v-card elevation="0" class="pa-4 border rounded-lg h-100">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-cash-multiple" class="mr-2 text-teal-darken-1" />
                    <span class="text-subtitle-1 font-weight-bold">Participación por Medio de Pago</span>
                  </div>
                  <v-chip size="x-small" variant="flat" color="teal-lighten-5" class="text-teal-darken-4 font-weight-bold">
                    {{ paymentSummary.length }} métodos
                  </v-chip>
                </div>

                <div class="d-flex flex-column ga-3">
                  <div
                    v-for="p in paymentSummary"
                    :key="p.name"
                    class="pa-2.5 rounded border bg-grey-lighten-5"
                  >
                    <div class="d-flex justify-space-between align-center mb-1">
                      <div class="d-flex align-center">
                        <v-icon :icon="getPaymentIcon(p.name)" size="small" class="mr-2 text-slate-700" />
                        <span class="text-body-2 font-weight-bold text-slate-800">{{ p.name }}</span>
                      </div>
                      <div class="text-right">
                        <span class="text-body-2 font-weight-black text-primary">${{ formatMoney(p.total) }}</span>
                        <span class="text-caption text-grey ml-1 font-weight-bold">({{ p.percentage.toFixed(1) }}%)</span>
                      </div>
                    </div>

                    <!-- Barra de progreso -->
                    <v-progress-linear
                      :model-value="p.percentage"
                      height="7"
                      rounded
                      :color="getPaymentColor(p.name)"
                    />
                    <div class="text-2xs text-grey-darken-1 mt-1 d-flex justify-space-between">
                      <span>{{ p.count }} transacciones</span>
                      <span>Ticket prom: ${{ formatMoney(p.avgTicket) }}</span>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>

            <!-- COLUMNA 2: RENDIMIENTO POR VENDEDOR / OPERADOR -->
            <v-col cols="12" md="6">
              <v-card elevation="0" class="pa-4 border rounded-lg h-100">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-account-star-outline" class="mr-2 text-primary" />
                    <span class="text-subtitle-1 font-weight-bold">Rendimiento por Operador</span>
                  </div>
                  <v-chip size="x-small" variant="flat" color="blue-lighten-5" class="text-primary font-weight-bold">
                    {{ operatorSummary.length }} operadores
                  </v-chip>
                </div>

                <div class="d-flex flex-column ga-3">
                  <div
                    v-for="op in operatorSummary"
                    :key="op.name"
                    class="pa-2.5 rounded border bg-grey-lighten-5"
                  >
                    <div class="d-flex justify-space-between align-center mb-1">
                      <div class="d-flex align-center">
                        <v-avatar size="24" :color="getRoleColor(op.role)" class="mr-2 text-white font-weight-bold text-2xs">
                          {{ op.name.charAt(0) }}
                        </v-avatar>
                        <div>
                          <span class="text-body-2 font-weight-bold text-slate-800">{{ op.name }}</span>
                          <v-chip size="x-small" :color="getRoleColor(op.role)" variant="tonal" class="ml-1 text-2xs">
                            {{ op.role }}
                          </v-chip>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="text-body-2 font-weight-black text-primary">${{ formatMoney(op.total) }}</span>
                        <span class="text-caption text-grey ml-1 font-weight-bold">({{ op.percentage.toFixed(1) }}%)</span>
                      </div>
                    </div>

                    <v-progress-linear
                      :model-value="op.percentage"
                      height="7"
                      rounded
                      color="primary"
                    />
                    <div class="text-2xs text-grey-darken-1 mt-1 d-flex justify-space-between">
                      <span>{{ op.count }} tickets emitidos</span>
                      <span>Ticket prom: ${{ formatMoney(op.avgTicket) }}</span>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Snackbar de notificaciones -->
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
import { exportSalesReportToExcel } from '@/services/excelService';

const cartStore = useCartStore();
const authStore = useAuthStore();
const businessStore = useBusinessStore();

const activeTab = ref('daily');
const periodPreset = ref('last7days');
const customStartDate = ref('');
const customEndDate = ref('');
const selectedPayment = ref('TODOS');
const selectedOperator = ref('TODOS');
const isSeeding = ref(false);

const snackbar = ref(false);
const snackText = ref('');
const snackColor = ref('success');

onMounted(async () => {
  businessStore.initBusiness();
  await cartStore.loadSalesHistory();
});

// Opciones de Medios de Pago
const paymentOptions = [
  'TODOS',
  'EFECTIVO',
  'DEBITO',
  'CREDITO',
  'TRANSFERENCIA',
  'CTA_CTE'
];

// Opciones de Operador / Cajero basadas en el historial
const operatorOptions = computed(() => {
  const ops = new Set(cartStore.salesHistory.map(s => s.userName).filter(Boolean));
  return ['TODOS', ...Array.from(ops)];
});

// ==========================================
// FILTRADO DINÁMICO DE VENTAS
// ==========================================
const filteredSales = computed(() => {
  const now = new Date();
  let start = null;
  let end = null;

  if (periodPreset.value === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (periodPreset.value === 'yesterday') {
    const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
    end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
  } else if (periodPreset.value === 'last7days') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    end = now;
  } else if (periodPreset.value === 'thisMonth') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    end = now;
  } else if (periodPreset.value === 'lastMonth') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (periodPreset.value === 'custom') {
    if (customStartDate.value) start = new Date(customStartDate.value + 'T00:00:00');
    if (customEndDate.value) end = new Date(customEndDate.value + 'T23:59:59.999');
  }

  return cartStore.salesHistory.filter(s => {
    const d = new Date(s.createdAt);
    if (start && d < start) return false;
    if (end && d > end) return false;
    if (selectedPayment.value !== 'TODOS' && s.paymentMethod !== selectedPayment.value) return false;
    if (selectedOperator.value !== 'TODOS' && s.userName !== selectedOperator.value) return false;
    return true;
  });
});

// Ventas efectivas (excluye anuladas y presupuestos)
const effectiveSales = computed(() => {
  return filteredSales.value.filter(s => s.estado !== 'ANULADA' && s.voucherType !== 'PRESUPUESTO');
});

// ==========================================
// KPIS CONSOLIDADOS
// ==========================================
const kpis = computed(() => {
  const totalSales = effectiveSales.value.reduce((acc, s) => acc + s.total, 0);
  const ticketsCount = effectiveSales.value.length;
  const avgTicket = ticketsCount > 0 ? totalSales / ticketsCount : 0;

  const unitsSold = effectiveSales.value.reduce((acc, s) => {
    return acc + (s.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  }, 0);

  const refundedList = filteredSales.value.filter(s => s.estado === 'ANULADA');
  const refundedCount = refundedList.length;
  const refundedTotal = refundedList.reduce((acc, s) => acc + s.total, 0);

  const presList = filteredSales.value.filter(s => s.voucherType === 'PRESUPUESTO');
  const presupuestosCount = presList.length;
  const presupuestosTotal = presList.reduce((acc, s) => acc + s.total, 0);

  return {
    totalSales,
    ticketsCount,
    avgTicket,
    unitsSold,
    refundedCount,
    refundedTotal,
    presupuestosCount,
    presupuestosTotal
  };
});

// ==========================================
// 1. RESUMEN POR DÍA
// ==========================================
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const dailySummary = computed(() => {
  const map = {};

  effectiveSales.value.forEach(s => {
    const d = new Date(s.createdAt);
    const dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!map[dateKey]) {
      map[dateKey] = {
        dateKey,
        dateObj: d,
        dateFormatted: d.toLocaleDateString('es-AR'),
        dayOfWeek: d.getDay(),
        dayName: dayNames[d.getDay()],
        shortLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        total: 0,
        count: 0,
        units: 0,
        paymentCounts: {}
      };
    }

    map[dateKey].total += s.total;
    map[dateKey].count += 1;
    map[dateKey].units += (s.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

    const pay = s.paymentMethod || 'EFECTIVO';
    map[dateKey].paymentCounts[pay] = (map[dateKey].paymentCounts[pay] || 0) + 1;
  });

  const list = Object.values(map).map(item => {
    item.avgTicket = item.count > 0 ? item.total / item.count : 0;
    // Encontrar medio de pago predominante
    let maxPay = 'EFECTIVO';
    let maxCnt = 0;
    Object.entries(item.paymentCounts).forEach(([k, v]) => {
      if (v > maxCnt) {
        maxCnt = v;
        maxPay = k;
      }
    });
    item.topPayment = maxPay;
    return item;
  });

  // Ordenar por fecha cronológica descendente para tabla
  return list.sort((a, b) => b.dateObj - a.dateObj);
});

const topDay = computed(() => {
  if (dailySummary.value.length === 0) return null;
  return [...dailySummary.value].sort((a, b) => b.total - a.total)[0];
});

const maxDailyTotal = computed(() => {
  if (dailySummary.value.length === 0) return 1;
  return Math.max(...dailySummary.value.map(d => d.total), 1);
});

// ==========================================
// 2. RESUMEN POR HORAS (HORAS PICO)
// ==========================================
const hourlySummary = computed(() => {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00 - ${String(i).padStart(2, '0')}:59`,
    total: 0,
    count: 0,
    avgTicket: 0,
    percentage: 0,
    percentageTickets: 0
  }));

  const totalRev = kpis.value.totalSales;
  const totalTicks = kpis.value.ticketsCount;

  effectiveSales.value.forEach(s => {
    const d = new Date(s.createdAt);
    const h = d.getHours();
    if (hours[h]) {
      hours[h].total += s.total;
      hours[h].count += 1;
    }
  });

  hours.forEach(h => {
    h.avgTicket = h.count > 0 ? h.total / h.count : 0;
    h.percentage = totalRev > 0 ? (h.total / totalRev) * 100 : 0;
    h.percentageTickets = totalTicks > 0 ? (h.count / totalTicks) * 100 : 0;
  });

  return hours;
});

const peakHourRevenue = computed(() => {
  const active = hourlySummary.value.filter(h => h.count > 0);
  if (active.length === 0) return null;
  return [...active].sort((a, b) => b.total - a.total)[0];
});

const peakHourTickets = computed(() => {
  const active = hourlySummary.value.filter(h => h.count > 0);
  if (active.length === 0) return null;
  return [...active].sort((a, b) => b.count - a.count)[0];
});

const maxHourlyTotal = computed(() => {
  const active = hourlySummary.value.map(h => h.total);
  return Math.max(...active, 1);
});

function getActivityLabel(pct) {
  if (pct >= 15) return 'Muy Alta';
  if (pct >= 9) return 'Alta';
  if (pct >= 4) return 'Media';
  return 'Baja';
}

function getActivityColor(pct) {
  if (pct >= 15) return 'deep-orange-darken-1';
  if (pct >= 9) return 'teal-darken-2';
  if (pct >= 4) return 'primary';
  return 'grey';
}

// ==========================================
// 3. RESUMEN POR MES
// ==========================================
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const monthlySummary = computed(() => {
  const map = {};

  effectiveSales.value.forEach(s => {
    const d = new Date(s.createdAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = d.toISOString().split('T')[0];

    if (!map[monthKey]) {
      map[monthKey] = {
        monthKey,
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        shortLabel: `${monthNames[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`,
        total: 0,
        count: 0,
        dailyMap: {},
        growth: null
      };
    }

    map[monthKey].total += s.total;
    map[monthKey].count += 1;
    map[monthKey].dailyMap[dayKey] = (map[monthKey].dailyMap[dayKey] || 0) + s.total;
  });

  const list = Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Calcular métricas derivadas y variación mensual
  list.forEach((m, idx) => {
    m.avgTicket = m.count > 0 ? m.total / m.count : 0;
    const daysArr = Object.entries(m.dailyMap);
    m.activeDays = daysArr.length;
    m.dailyAvg = m.activeDays > 0 ? m.total / m.activeDays : 0;

    if (daysArr.length > 0) {
      const best = [...daysArr].sort((a, b) => b[1] - a[1])[0];
      const bestDate = new Date(best[0] + 'T12:00:00');
      m.bestDay = {
        dateFormatted: bestDate.toLocaleDateString('es-AR'),
        total: best[1]
      };
    } else {
      m.bestDay = null;
    }

    if (idx > 0) {
      const prev = list[idx - 1];
      m.growth = prev.total > 0 ? ((m.total - prev.total) / prev.total) * 100 : 0;
    }
  });

  // Retornar en orden cronológico descendente
  return list.reverse();
});

const maxMonthlyTotal = computed(() => {
  if (monthlySummary.value.length === 0) return 1;
  return Math.max(...monthlySummary.value.map(m => m.total), 1);
});

// ==========================================
// 4. MEDIOS DE PAGO Y VENDEDORES
// ==========================================
const paymentSummary = computed(() => {
  const map = {};
  const totalRev = kpis.value.totalSales;

  effectiveSales.value.forEach(s => {
    const pay = s.paymentMethod || 'EFECTIVO';
    if (!map[pay]) {
      map[pay] = { name: pay, total: 0, count: 0 };
    }
    map[pay].total += s.total;
    map[pay].count += 1;
  });

  return Object.values(map).map(p => {
    p.percentage = totalRev > 0 ? (p.total / totalRev) * 100 : 0;
    p.avgTicket = p.count > 0 ? p.total / p.count : 0;
    return p;
  }).sort((a, b) => b.total - a.total);
});

const operatorSummary = computed(() => {
  const map = {};
  const totalRev = kpis.value.totalSales;

  effectiveSales.value.forEach(s => {
    const name = s.userName || 'Mostrador General';
    const role = s.userRole || 'CASHIER';
    if (!map[name]) {
      map[name] = { name, role, total: 0, count: 0 };
    }
    map[name].total += s.total;
    map[name].count += 1;
  });

  return Object.values(map).map(op => {
    op.percentage = totalRev > 0 ? (op.total / totalRev) * 100 : 0;
    op.avgTicket = op.count > 0 ? op.total / op.count : 0;
    return op;
  }).sort((a, b) => b.total - a.total);
});

// ==========================================
// ACCIONES Y EXPORTACIÓN
// ==========================================
function handleExportExcel() {
  try {
    exportSalesReportToExcel({
      daily: dailySummary.value,
      hourly: hourlySummary.value.filter(h => h.count > 0 || (h.hour >= 8 && h.hour <= 20)),
      monthly: monthlySummary.value,
      paymentMethods: paymentSummary.value,
      operators: operatorSummary.value
    });
    snackText.value = 'Reporte de ventas exportado a Excel con éxito.';
    snackColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackText.value = `Error al exportar: ${err.message}`;
    snackColor.value = 'error';
    snackbar.value = true;
  }
}

async function handleSeedDemo() {
  isSeeding.value = true;
  try {
    const count = await cartStore.seedDemoSales();
    snackText.value = `Se generaron ${count} ventas simuladas en los últimos 45 días para análisis de reportes.`;
    snackColor.value = 'success';
    snackbar.value = true;
    periodPreset.value = 'last7days';
  } catch (err) {
    snackText.value = `Error: ${err.message}`;
    snackColor.value = 'error';
    snackbar.value = true;
  } finally {
    isSeeding.value = false;
  }
}

function getPaymentIcon(method) {
  const map = {
    EFECTIVO: 'mdi-cash',
    DEBITO: 'mdi-credit-card-outline',
    CREDITO: 'mdi-credit-card-multiple',
    TRANSFERENCIA: 'mdi-bank-transfer',
    CTA_CTE: 'mdi-notebook-outline'
  };
  return map[method] || 'mdi-cash';
}

function getPaymentColor(method) {
  const map = {
    EFECTIVO: 'teal-darken-1',
    DEBITO: 'blue-darken-1',
    CREDITO: 'indigo-darken-1',
    TRANSFERENCIA: 'purple-darken-1',
    CTA_CTE: 'amber-darken-3'
  };
  return map[method] || 'primary';
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
</script>

<style scoped>
.chart-container {
  border-bottom: 2px solid #E2E8F0;
  min-height: 180px;
}
.chart-bar-wrapper {
  transition: all 0.2s ease;
  cursor: pointer;
}
.chart-bar-wrapper:hover .chart-bar {
  filter: brightness(1.15);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}
.chart-bar {
  transition: height 0.3s ease, background-color 0.2s ease;
  min-height: 4px;
}
.text-2xs {
  font-size: 9px !important;
  line-height: 11px !important;
}
.responsive-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.compact-report-table th,
.compact-report-table td {
  padding: 4px 6px !important;
  height: 34px !important;
  font-size: 12px;
}
@media print {
  body * {
    visibility: hidden;
  }
  .v-main, .v-container, .v-container * {
    visibility: visible;
  }
  .v-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0 !important;
  }
  .v-btn, .v-btn-toggle, .v-tabs {
    display: none !important;
  }
}
</style>
