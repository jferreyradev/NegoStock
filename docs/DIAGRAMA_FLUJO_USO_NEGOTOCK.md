# MANUAL OPERATIVO Y DIAGRAMAS DE FLUJO
## Ciclo de Vida de Presupuestos, Preventas y Facturación en NegoStock

---

## 1. Diagrama de Flujo General del Sistema

El siguiente diagrama describe el recorrido operativo de un artículo desde que se cotiza en el mostrador hasta que se factura en caja y se registra en la nube:

```mermaid
flowchart TD
    Inicio(["Cliente llega al mostrador"]) --> Operacion{"¿Qué tipo de operación se realiza?"}

    %% RAMA 1: PRESUPUESTO
    Operacion -->|"Cotización / Consulta"| Armador["Armador de Presupuestos / [F6]"]
    Armador --> AgregaItems["Carga de productos y/o Flete (VAR)"]
    AgregaItems --> DefineValidez["Define días de validez (ej: 15 días)"]
    DefineValidez --> GuardarPres["Guardar Presupuesto"]
    GuardarPres --> SubePresupuesto[("Sincroniza en Supabase\n(pedidos_preventa)")]
    SubePresupuesto --> ImprimePres["Imprime o descarga PDF"]
    ImprimePres --> EsperaCliente{"¿El cliente decide comprar?"}
    EsperaCliente -->|"No / Pasa el tiempo"| Expira["Presupuesto queda archivado o expira"]
    EsperaCliente -->|"Sí, vuelve a comprar"| CargaPresupuesto["Abre diálogo de Presupuestos y presiona 'Cargar'"]
    CargaPresupuesto --> PaseVenta["Convierte a Venta Directa"]

    %% RAMA 2: PREVENTA (Mostrador a Caja)
    Operacion -->|"Pedido de mostrador"| CargaPreventa["Carga artículos en mostrador [F6]"]
    CargaPreventa --> GuardaPreventa["Guardar Preventa (N° PED-XXX)"]
    GuardaPreventa --> SubePreventa[("Sincroniza en Supabase\n(pedidos_preventa)")]
    SubePreventa --> ClienteACaja["Cliente se dirige a la Caja de Cobro"]
    ClienteACaja --> CajaBusca["Cajero presiona [F7] y selecciona el Pedido"]
    CajaBusca --> PaseVenta

    %% RAMA 3: VENTA DIRECTA Y COBRO
    Operacion -->|"Venta rápida directa"| PaseVenta
    PaseVenta --> SeleccionaPago{"Medio de Pago"}
    SeleccionaPago -->|"Efectivo"| IngresaPaga["Ingresa monto abonado y calcula vuelto"]
    SeleccionaPago -->|"Tarjeta / Transferencia / Débito"| PagoDigital["Registra medio electrónico"]
    SeleccionaPago -->|"Cuenta Corriente"| CtaCte["Valida saldo de cliente"]

    IngresaPaga --> EjecutaVenta["Confirmar Venta / Checkout"]
    PagoDigital --> EjecutaVenta
    CtaCte --> EjecutaVenta

    %% PROCESO ATÓMICO EN SUPABASE
    EjecutaVenta --> Transaccion{"¿Hay conexión a Internet?"}
    Transaccion -->|"En Línea"| RpcVenta[("Ejecuta 'procesar_venta_mostrador'\nen Supabase")]
    Transaccion -->|"Modo Desconectado (Offline)"| ColaOffline["Encola venta con cifrado AES-256 en IndexedDB"]
    ColaOffline --> Reconexion["Al regresar la red, sincroniza automáticamente"]
    Reconexion --> RpcVenta

    RpcVenta --> DescuentaStock["Descuenta Stock físico en 'productos'"]
    RpcVenta --> RegistraKardex["Crea registro en 'stock_movimientos'"]
    RpcVenta --> AsignaSecuencia["Genera número correlativo oficial (0001-XXXXXXXX)"]
    RpcVenta --> CierraPreventa["Marca Preventa/Presupuesto como COBRADO"]
    RpcVenta --> EmiteTicket["Emite Ticket oficial y actualiza Reportes en vivo"]
```

---

## 2. Diagrama de Secuencia: Arquitectura Multi-Terminal

Este diagrama explica cómo interactúan varias computadoras al mismo tiempo sin pisarse ni perder información:

```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Mostrador 1 (Vendedor)
    actor Cajero as Mostrador 2 (Cajero)
    participant UI as NegoStock (Frontend)
    participant Cloud as Supabase Cloud (Servidor)

    Note over Vendedor, Cloud: ETAPA 1: Generación del Presupuesto
    Vendedor->>UI: Carga 3 ítems y 1 Flete (VAR)
    Vendedor->>UI: Clic en "Guardar Presupuesto"
    UI->>Cloud: INSERT en 'pedidos_preventa' (PRES-001)
    Cloud-->>UI: Confirmado (ID y estado PENDIENTE)

    Note over Cajero, Cloud: ETAPA 2: Consulta desde otra máquina
    Cajero->>UI: Abre diálogo de Preventas/Presupuestos [F7]
    UI->>Cloud: SELECT * FROM pedidos_preventa WHERE estado = 'PENDIENTE'
    Cloud-->>UI: Retorna PRES-001 con todos sus ítems
    UI-->>Cajero: Muestra PRES-001 en pantalla

    Note over Cajero, Cloud: ETAPA 3: Cobro y Cierre Atómico
    Cajero->>UI: Clic en "Cobrar Pedido"
    Cajero->>UI: Selecciona Efectivo ($15.000)
    UI->>Cloud: RPC 'procesar_venta_mostrador'
    Cloud->>Cloud: Descuenta stock físico de los 3 ítems
    Cloud->>Cloud: No altera stock para el Flete (VAR)
    Cloud->>Cloud: UPDATE pedidos_preventa SET estado = 'COBRADO'
    Cloud-->>UI: Ticket emitido: 0001-00543136 (200 OK)
    UI-->>Cajero: Imprime ticket de venta final

    Note over Vendedor, Cloud: ETAPA 4: Refresco en todos los mostradores
    Vendedor->>UI: Abre diálogo de Presupuestos
    UI->>Cloud: Consulta pendientes
    Cloud-->>UI: PRES-001 ya no figura (fue COBRADO)
```

---

## 3. Guía de Operación Rápida por Perfil

### A. Para el Vendedor de Mostrador (Atención al Cliente)
* **Atajo [F6] - Guardar Presupuesto / Preventa:**  
  Permite dejar el pedido listo para que el cliente pase por la caja a pagar, o imprimirle una cotización formal con validez de 15 o 30 días.
* **Ítems Libres y Fletes:**  
  Podés usar el botón **"+ Ítem Personalizado"** para agregar fletes, cortes de caño/cable o mano de obra sin necesidad de que el producto exista previamente en el inventario.
* **Atajo [F8] - Lista Mayorista:**  
  Alterna los precios entre tarifa minorista y mayorista con una sola tecla.

### B. Para el Cajero (Cobranzas y Facturación)
* **Atajo [F7] - Ver Preventas y Presupuestos Pendientes:**  
  Abre la lista de pedidos armados por los mostradores. Con un clic en **"Cargar"**, el carrito se llena con todos los artículos cotizados.
* **Cobro en Efectivo:**  
  Ingresá el monto que entrega el cliente; el sistema calcula el vuelto exacto y emite el ticket.
* **Comprobantes y Ventas Emitidas:**  
  Podés consultar cualquier venta realizada en el día o en fechas anteriores, reimprimir el ticket térmico o descargar el comprobante en formato PDF.

### C. Para el Encargado / Administrador (Auditoría)
* **Kardex Automático:** Cada venta efectiva genera automáticamente un movimiento negativo en el historial de stock. Los presupuestos no tocan el stock hasta que son efectivamente cobrados.
* **Anulación y Devolución con 1 Clic:**  
  Si un cliente devuelve mercadería o hubo un error de cobro, al pulsar **"Anular Venta"** en la pantalla de historial:
  1. La venta queda marcada como `ANULADA`.
  2. Todos los artículos vendidos regresan automáticamente al inventario físico.
  3. Queda registrada la auditoría con el nombre del operador que anuló y el motivo.

---

## 4. Tabla de Atajos de Teclado del Mostrador

| Tecla | Función Operativa | Descripción |
| :---: | :--- | :--- |
| **`F1`** | **Buscar Producto** | Lleva el cursor directo a la barra de búsqueda por nombre, SKU o código de barras. |
| **`F2`** | **Seleccionar Cliente** | Permite asignar cliente para factura, remito o cuenta corriente. |
| **`F4`** | **Cobrar / Checkout** | Abre el panel de cobro rápido para ingresar medio de pago y finalizar ticket. |
| **`F6`** | **Guardar Preventa** | Guarda el pedido para que el cliente abone en caja sin ocupar el mostrador. |
| **`F7`** | **Ver Pendientes** | Despliega la lista de presupuestos y pedidos listos para cobrar. |
| **`F8`** | **Precios Mayoristas** | Cambia entre precio minorista y mayorista para clientes gremio/taller. |
| **`ESC`** | **Cerrar Ventanas** | Cierra cualquier diálogo abierto y vuelve al mostrador principal. |
