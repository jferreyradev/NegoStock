# Manual Técnico y de Arquitectura para el Desarrollador
## NegoStock SaaS - Control de Stock & Ferretería

Este documento detalla la arquitectura de software, el diseño de base de datos relacional, los patrones transaccionales y la estructura del frontend para desarrolladores y mantenedores del sistema.

---

### 1. Stack Tecnológico

* **Frontend**: Vue 3 (Composition API con `<script setup>`), Vite 6.
* **Componentes UI**: Vuetify 3 (Material Design con `density="compact"` y temas personalizados).
* **Gestión de Estado**: Pinia 3.
* **Ruteo**: Vue Router 4.
* **Procesamiento de Archivos**: SheetJS (`xlsx`) para manipulación nativa de Excel (.xlsx, .xls) y CSV.
* **Audio y Feedback**: Web Audio API nativo (sintetizador de osciladores, cero assets de audio externos).
* **Base de Datos / Backend**: Supabase (PostgreSQL 15+) con Row Level Security (RLS) y Edge Functions (Deno).

---

### 2. Arquitectura de Datos y Multi-Inquilino (SaaS)

El sistema implementa **Multi-tenancy compartido con discriminador entero**:
* Cada tabla de negocio incluye la columna `comercio_id INT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE`.
* **Comercio por defecto (Ferretería Central):** `comercio_id = 1`.
* Para dar de alta un nuevo comercio cliente en el SaaS:
  ```sql
  INSERT INTO comercios (nombre, razon_social, cuit) VALUES ('Ferretería San Martín', 'San Martín S.A.', '30-76543210-9');
  -- Retorna id = 2
  ```

#### Tablas Principales (`supabase/schema.sql`):
1. **`comercios`**: Inquilinos del SaaS con ID entero (`id SERIAL`).
2. **`usuarios`**: Enlaza usuarios de `auth.users` con su rol (`ADMIN`, `MANAGER`, `CASHIER`, `SELLER`), PIN y `comercio_id`.
3. **`categorias`** y **`marcas`**: Rubros y marcas únicas por comercio.
4. **`unidades_medida`**: Unidades con bandera `permite_decimales` (crucial para fracciones en metros/kg).
5. **`productos`**: Catálogo general con SKU único por comercio (`UNIQUE(comercio_id, codigo_sku)`), costo, venta, mayoreo y stock consolidado.
6. **`comprobantes_secuencias`**: Manejador de numeración correlativa atómica (`ultimo_numero`) para prevenir condiciones de carrera.
7. **`ventas`** y **`ventas_detalles`**: Cabecera y detalle de ventas. Congela el `precio_costo` histórico de cada ítem al momento de la transacción para auditoría exacta de margen.
8. **`stock_movimientos` (Kardex)**: Registro inmutable de cada entrada/salida de stock.
9. **`pedidos_preventa`** y **`pedidos_preventa_detalles`**: Pedidos de preventa en espera.
10. **`precios_historial`**: Auditoría de cada variación de costo y venta.

*(Para el detalle completo de cada columna y tipos, consultar [`docs/DICCIONARIO_BASE_DE_DATOS.md`](file:///Users/jferreyradev/projects/ag/NegoStock/docs/DICCIONARIO_BASE_DE_DATOS.md)).*

---

### 3. Transaccionalidad ACID: Función Almacenada en PostgreSQL

Para evitar estados inconsistentes (por ejemplo, descontar stock pero fallar al guardar la venta), el cierre de venta en mostrador se ejecuta en una única transacción atómica en PostgreSQL:

```sql
SELECT procesar_venta_mostrador(
    p_tenant_id INT,
    p_voucher_type TEXT,
    p_payment_method TEXT,
    p_price_mode TEXT,
    p_items JSONB,
    p_discount NUMERIC,
    p_customer_id UUID,
    p_offline_id TEXT,
    p_notes TEXT,
    p_point_of_sale INT
);
```

#### Mecanismos de seguridad dentro de la función:
1. **Idempotencia:** Si recibe `p_offline_id` y ya fue procesado, retorna el registro existente sin duplicar la venta ni re-descontar stock.
2. **Bloqueo a Nivel de Fila (`FOR UPDATE`):**
   * Bloquea la secuencia del comprobante en `voucher_sequences` para evitar números duplicados.
   * Bloquea cada producto involucrado para garantizar consistencia atómica del stock ante cobros simultáneos.
3. **Asiento Kardex Automático:** Inserta en `stock_movements` y actualiza `products.current_stock`.

---

### 4. Resiliencia Offline y Sincronización (`src/services/syncQueue.js`)

* **Event Listeners:** Escucha `window.addEventListener('online')` y `window.addEventListener('offline')`.
* **Cola de Salida:** Si la app detecta que no hay internet (o si la llamada RPC a Supabase falla por timeout), encola la venta en `localStorage` (`negostock_offline_sales_queue`) con estado `isSynced: false`.
* **Sincronización Transparente:** Apenas se dispara el evento `online`, recorre la cola y despacha cada venta pendiente a la función RPC `procesar_venta_mostrador`. Si el backend responde `success: true`, se purga de la cola local.

---

### 5. Estructura de Directorios del Frontend

```
src/
├── App.vue                  # Layout raíz: App bar, navigation drawer, usuario activo, banner offline
├── main.js                  # Entry point: Vue 3, Pinia, Router, Vuetify
├── plugins/
│   └── vuetify.js           # Configuración de tema, colores y MDI icons
├── router/
│   └── index.js             # Rutas: POS, Inventario, Precios, Ventas, Usuarios, Auditoría
├── services/
│   ├── excelService.js      # Parser y exportador SheetJS (.xlsx y .csv)
│   ├── supabase.js          # Cliente Supabase JS
│   └── syncQueue.js         # Administrador de cola offline y auto-sincronización
├── stores/
│   ├── authStore.js         # Estado de sesión, usuarios, PINs y matriz RBAC
│   ├── cartStore.js         # Carrito mostrador, cobro, preventas y persistencia
│   ├── priceHistoryStore.js # Historial de variaciones de costo y venta
│   └── productStore.js      # Catálogo, filtros, búsqueda, kardex y ajuste masivo %
├── utils/
│   └── audioFeedback.js     # Sintetizador Web Audio API (beeps de escaneo)
└── views/
    ├── PosView.vue              # Punto de Venta mostrador con atajos de teclado
    ├── InventoryView.vue        # Control de stock con ocultamiento de costos por rol
    ├── MassPriceUpdateView.vue  # Pestañas de Aumento %, Excel Import/Export e Historial
    ├── SalesHistoryView.vue     # Comprobantes emitidos y visor térmico
    ├── UsersView.vue            # Gestión de empleados y PINs
    └── AnomaliesView.vue        # Auditoría de inconsistencias de la planilla inicial
```

---

### 6. Políticas de Seguridad (Supabase RLS)

Todas las tablas cuentan con RLS activo:
* `get_auth_tenant_id()`: Extrae el `tenant_id` del usuario autenticado en `profiles`.
* `get_auth_role()`: Retorna `'ADMIN'`, `'MANAGER'`, `'CASHIER'` o `'SELLER'`.
* **Restricción de Modificación:** Solo usuarios `ADMIN` o `MANAGER` pueden ejecutar `UPDATE` sobre `products`.
* **Restricción de Ventas:** Solo `ADMIN`, `MANAGER` y `CASHIER` pueden insertar en `sales`.

---

### 7. Comandos de Desarrollo

```bash
# Servidor de desarrollo
npm run dev

# Compilar para producción (validación de bundle)
npm run build

# Previsualizar compilación de producción
npm run preview

# Regenerar seed de productos desde la planilla TSV
node scripts/seed_from_tsv.cjs
```
