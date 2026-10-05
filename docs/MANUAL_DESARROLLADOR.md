# Manual Técnico del Desarrollador
## Sistema NegoStock SaaS (Ferretería y Control de Stock)

Este manual documenta la arquitectura técnica, estándares de código, almacenamiento seguro cifrado, políticas de base de datos y flujos de sincronización de NegoStock.

---

### 1. Stack Tecnológico
* **Frontend:** Vue 3 (Composition API `<script setup>`) + Vite 6
* **Componentes UI:** Vuetify 3 + Material Design Icons (`@mdi/font`)
* **Gestión de Estado:** Pinia 3
* **Enrutamiento:** Vue Router 4 (con Navigation Guards)
* **Procesamiento de Archivos:** SheetJS (`xlsx`) para importación y exportación de listas de precios
* **Criptografía Cliente:** Web Crypto API (`window.crypto.subtle`) con **AES-GCM 256 bits** y PBKDF2 (100.000 iteraciones)
* **Almacenamiento Local:** IndexedDB nativo transaccional (`negostock_secure_db`)
* **Backend & Base de Datos:** Supabase (PostgreSQL 15+) con Row Level Security (RLS) y funciones PL/pgSQL transaccionales

---

### 2. Estructura del Proyecto

```
NegoStock/
├── src/
│   ├── assets/              # Estilos globales y tipografías
│   ├── data/                # Datos semilla iniciales (seedData.json)
│   ├── plugins/             # Configuración de Vuetify y temas
│   ├── router/              # Definición de rutas y guardianes de navegación (index.js)
│   ├── services/
│   │   ├── audioFeedback.js # Síntesis sonora nativa (Web Audio API)
│   │   ├── excelService.js  # Parser y generador de planillas SheetJS
│   │   ├── secureStorage.js # Almacén cifrado IndexedDB + AES-GCM 256
│   │   ├── supabase.js      # Cliente de conexión @supabase/supabase-js
│   │   └── syncQueue.js     # Gestor de cola offline y auto-sincronización
│   ├── stores/
│   │   ├── authStore.js     # Sesión Supabase Auth, roles RBAC y PIN
│   │   ├── cartStore.js     # Carrito POS, preventas, medios de pago y checkout
│   │   ├── priceHistoryStore.js # Auditoría de cambios de precios
│   │   ├── productStore.js  # CRUD de artículos, Kardex, márgenes y filtros
│   │   └── syncModeStore.js # Selector de modos: ONLINE, LOCAL, AUTOMATICO
│   ├── views/
│   │   ├── AnomaliesView.vue       # Auditoría de anomalías de planilla
│   │   ├── InventoryView.vue       # Control de stock, alta/edición e historia
│   │   ├── LoginView.vue           # Pantalla de acceso por Email y PIN táctil
│   │   ├── MassPriceUpdateView.vue # Aumento masivo % y carga Excel
│   │   ├── PosView.vue             # Punto de venta mostrador con atajos
│   │   ├── SalesHistoryView.vue    # Listado de comprobantes y reimpresión
│   │   └── UsersView.vue           # Gestión de personal y roles
│   ├── App.vue              # Shell principal, barra superior y modales
│   └── main.js              # Punto de entrada de la aplicación
├── supabase/
│   ├── schema.sql           # Esquema relacional completo en español
│   ├── seed.sql             # Semilla inicial con 171 artículos reales
│   ├── drop_all.sql         # Script de reinicio de base de datos
│   └── desbloquear_escritura_supabase.sql # Políticas RLS permisivas para web
└── docs/                    # Manuales y documentación funcional
```

---

### 3. Almacenamiento Seguro Cifrado (`src/services/secureStorage.js`)
Para cumplir con estándares de seguridad comercial y evitar que empleados manipulen precios o comprobantes pendientes desde las herramientas de desarrollador (<kbd>F12</kbd>):

1. **Derivación de Clave:**  
   Se genera un salt aleatorio en la instalación y se deriva una clave criptográfica simétrica mediante PBKDF2 (SHA-256, 100.000 iteraciones).
2. **Cifrado AES-GCM 256 bits:**  
   Cada registro se serializa a JSON, se genera un vector de inicialización (IV) de 12 bytes aleatorio y se cifra con `window.crypto.subtle.encrypt`.
3. **Almacenes en IndexedDB (`negostock_secure_db`):**
   * `sales_queue`: Ventas encoladas esperando conexión o sincronización por lotes.
   * `products_catalog`: Catálogo completo de artículos cifrado (soporta > 50.000 productos sin las limitaciones de 5MB de `localStorage`).
   * `app_metadata`: Metadatos de la aplicación, configuración de modos, secuencia correlativa y cambios pendientes.
4. **Migración Transparente:**  
   Si existían datos previos en texto plano en `localStorage`, la función `migrateLegacyPlainStorage()` los encripta en IndexedDB y borra el texto plano del navegador.

---

### 4. Modos de Operación (`src/stores/syncModeStore.js`)
NegoStock soporta 3 modos de funcionamiento conmutables en caliente:

* **`AUTOMATICO` (Híbrido):**  
  Intenta ejecutar transacciones ACID directamente en Supabase. Si se detecta `!navigator.onLine` o falla de red, encola en `secureStorage` y escucha el evento `window.addEventListener('online')` para auto-sincronizar.
* **`ONLINE` (Sólo en Línea):**  
  Requiere comunicación exitosa con Supabase. Si la conexión falla, lanza una excepción de red y bloquea la operación para garantizar consistencia absoluta entre terminales.
* **`LOCAL` (Modo Desconectado):**  
  No realiza peticiones HTTP. Todas las ventas se guardan en `sales_queue` y todas las altas/modificaciones de productos se registran en `pending_product_changes`. El usuario decide cuándo enviar el lote mediante `syncAllNow()`.

---

### 5. Estándares de Base de Datos y Supabase
* **Convención en Español:** Tablas (`comercios`, `usuarios`, `productos`, `ventas`, `ventas_detalles`, `stock_movimientos`, `pedidos_preventa`, `precios_historial`, `comprobantes_secuencias`).
* **Identificador de Comercio (`comercio_id` INT):**  
  Se utiliza entero estándar (`1, 2, 3...`) para simplificar la lectura humana y la separación multi-tenant.
* **Transacción de Venta Atómica:**  
  La función PostgreSQL `procesar_venta_mostrador` ejecuta en un solo bloque transaccional:
  1. Verificación de idempotencia mediante `p_offline_id`.
  2. Incremento correlativo con bloqueo de fila (`SELECT ... FOR UPDATE` en `comprobantes_secuencias`).
  3. Inserción de cabecera en `ventas`.
  4. Inserción de ítems en `ventas_detalles`.
  5. Descuento de stock en `productos`.
  6. Registro inmutable en el Kardex (`stock_movimientos`).
* **Políticas RLS:**  
  Configuradas mediante `supabase/desbloquear_escritura_supabase.sql` para permitir que el rol `anon` y `authenticated` operen sobre el tenant 1 de forma segura.

---

### 6. Motor de Comprobantes PDF Vectoriales (`src/utils/pdfGenerator.js`)
El sistema utiliza `jsPDF` en modo milimétrico (`unit: 'mm'`, formato `A4`: 210 x 297 mm) para renderizar comprobantes vectoriales de alta fidelidad sin superposición de textos.

#### Bounding Boxes y Grilla Milimétrica:
* **Cabecera Comercial:**  
  La razón social y los datos de contacto se acotan a un ancho máximo de `100 mm` (`doc.splitTextToSize(businessName, 100)`), garantizando una separación mínima de `8 mm` respecto a la caja del comprobante ubicada en `X=120 mm`.
* **Ficha de Cliente y Logística:**  
  Cálculo dinámico de altura (`clientBoxH`) según la presencia de campos logísticos (dirección de obra, transportista, chofer, patente para remitos), empujando el inicio de la tabla de artículos a una coordenada segura.
* **Tabla de Artículos y Columnas:**  
  | Columna | Alineación | Coordenada X | Ancho Máximo / Límite |
  | :--- | :---: | :---: | :---: |
  | **Cant / SKU** | Izquierda | `X = 18 mm` | `38 mm` |
  | **Descripción** | Izquierda | `X = 59 mm` | `75 mm` (límite `X = 134 mm`) |
  | **Precio Unitario**| Derecha | `X = 163 mm`| Margen de seguridad $\ge 5 \text{ mm}$ con la descripción |
  | **Subtotal** | Derecha | `X = 195 mm`| Margen derecho de hoja: `15 mm` |
* **Ajuste Dinámico de Filas (`rowH`):**  
  Las descripciones largas se dividen en líneas mediante `doc.splitTextToSize(item.name, 75)`. La altura del renglón se computa como `Math.max(8, descLines.length * 4.2 + 3.8)`.
* **Recuadro de Totales Apilados (Stacked Layout):**  
  Para evitar colisiones entre la etiqueta ("TOTAL ESTIMADO", "TOTAL VENTA", etc.) y montos de 7 u 8 cifras, se utiliza disposición vertical:
  - Etiqueta superior centrada en `Y + 5.2 mm` (`fontSize: 8.5pt`, color blanco).
  - Importe en negrita centrado en `Y + 12 mm` (`fontSize: 13pt`, color blanco).
* **Control de Paginación y Saltos de Hoja:**  
  La función `checkPageBreak(neededHeight)` detecta si `currentY + neededHeight > 265 mm`. Si es necesario, genera una nueva página, dibuja los encabezados de columna y preserva la numeración en el pie institucional (*"Página X de Y"*).

---

### 7. Ciclo de Vida del Carrito y Comprobantes (`src/stores/cartStore.js`)
El estado del carrito (`cartStore`) gobierna la lógica transaccional de mostrador:

1. **Estado Predeterminado (`voucherType = 'PRESUPUESTO'`):**  
   Al iniciar la aplicación o al finalizar una venta (`clearCart()`), el carrito se inicializa siempre en modo `PRESUPUESTO`. Esto previene cobros involuntarios y asegura que el stock solo se altere cuando el operador decida concretar una venta.
2. **Propiedades Computadas Clave:**  
   * `isEditingPresupuesto`: `state.activeOrderId !== null && state.activeOrderType === 'PRESUPUESTO' && state.voucherType === 'PRESUPUESTO'`.  
     Verifica si se está modificando un presupuesto existente sin alterar su naturaleza.
   * `isConvertingPresupuestoToSale`: `state.activeOrderId !== null && state.activeOrderType === 'PRESUPUESTO' && state.voucherType === 'TICKET_X'`.  
     Detecta cuando una cotización cargada pasa a venta en firme.
3. **Flujo de Conversión a Venta en 1 Clic (`[F2]`):**  
   * Desde `PosView.vue`, el botón `PASAR A VENTA Y COBRAR [F2]` (o `CONCRETAR VENTA Y COBRAR [F2]`) ejecuta:
     ```javascript
     cartStore.voucherType = 'TICKET_X';
     openCheckoutDialog();
     ```
   * Se abre el modal con desglose de ítems, selector de medio de pago y cálculo de vuelto en efectivo.
4. **Ejecución Transaccional (`checkout()`):**  
   * Si el comprobante es `TICKET_X` o `REMITO`: invoca `procesar_venta_mostrador` en Supabase o encola en `secureStorage` (modo offline), descuenta stock y registra asientos inmutables en el Kardex.
   * Si la venta proviene de un presupuesto activo (`activeOrderId`), actualiza su estado a `COMPLETADO`.
   * Restablece el carrito llamando a `clearCart()`, el cual vuelve a dejar `voucherType = 'PRESUPUESTO'` listo para la siguiente operación.
5. **Guardado de Presupuesto (`saveAsPresupuesto` vs `updateActivePresupuesto`):**  
   * Las cotizaciones se guardan con estado `PENDIENTE` en `pedidos_preventa` (o IndexedDB local).
   * **No ejecutan descuento de stock ni bloquean existencias.**
   * Si se edita un presupuesto ya cargado, `updateActivePresupuesto` actualiza sus ítems y total sin crear duplicados.

---

### 8. Módulo de Resumen de Ventas y Analítica (`src/views/SalesReportsView.vue`)
Ubicado en `/reportes-ventas`, proporciona inteligencia de negocio para dueños y superadministradores:

* **Control de Acceso RBAC:**  
  Protegido mediante el guardián de Vue Router (`meta: { requiresAdmin: true }`) y validación reactiva en el componente (`authStore.isAdmin || authStore.isSuperadmin`). Los roles `CAJERO` y `VENDEDOR` tienen denegado el acceso y son redirigidos.
* **Agrupaciones Temporales:**  
  * **Por Día:** Agrupación por clave ISO `YYYY-MM-DD`. Calcula Facturación Neta, % de aporte al período, tickets emitidos, ticket promedio y destaca el día récord.
  * **Por Horas (Horas Pico):** Vector de 24 horas (`00:00` a `23:59`). Algoritmo de detección automática de la *Hora Pico de Facturación ($)* y la *Hora Pico de Clientes (Tickets)* para optimizar la distribución de personal en caja.
  * **Por Mes:** Consolidación mensual con comparativa intermensual (+% / -%), días con actividad comercial y promedio de venta diaria.
  * **Medios de Pago y Vendedores:** Gráficos de barras porcentuales por forma de pago (Efectivo, Débito, Transferencia, Crédito, Cta Cte) y ranking de desempeño por operador.
* **Exportación a Excel Multi-Hoja (SheetJS):**  
  Genera un libro `.xlsx` con hojas independientes: *Resumen por Día*, *Horas Pico*, *Resumen por Mes* y *Medios de Pago*, formateando moneda y columnas automáticas.
* **Modo Impresión Limpio (`@media print`):**  
  Oculta selectores de fechas, tabs, botones de acción y barras de navegación, dejando un informe formal listo para imprimir o guardar como PDF.

---

### 9. Arquitectura de Tablas y UI Responsiva
Para maximizar el espacio de trabajo en pantallas de 1024px o 1366px típicas de terminales de mostrador:

1. **Densidad Compacta:**  
   Se utiliza `density="compact"` en `v-table` y `v-data-table` en conjunto con estilos personalizados:
   ```css
   .v-table--density-compact th,
   .v-table--density-compact td {
     height: 38px !important;
     padding: 0 8px !important;
     font-size: 0.8125rem !important;
   }
   ```
2. **Columna de Acciones Flotante (`.sticky-action-col`):**  
   En tablas con muchas columnas (Inventario, Historial de Ventas, Reportes), los botones de acción nunca se pierden de vista al hacer scroll horizontal:
   ```css
   .sticky-action-col {
     position: sticky !important;
     right: 0 !important;
     background-color: rgb(var(--v-theme-surface)) !important;
     z-index: 2 !important;
     box-shadow: -4px 0 8px rgba(0, 0, 0, 0.06);
   }
   ```
3. **Contención Horizontal:**  
   Los contenedores de tabla emplean `overflow-x: auto; width: 100%;` con barra de desplazamiento estilizada, evitando que la página entera ensanche la ventana del navegador.

