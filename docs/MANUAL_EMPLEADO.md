# Manual de Usuario - Empleados (Cajeros y Vendedores de Mostrador)
## Sistema NegoStock SaaS

Este manual está destinado al personal de atención al público, despachantes de mostrador y cajeros de la ferretería. El sistema está optimizado para operar **100% con teclado y lector de código de barras**, reduciendo el uso del mouse al mínimo.

---

### 1. Inicio de Turno y Cambio de Usuario
1. En la esquina superior derecha de la pantalla, hacé clic en el botón de usuario o seleccioná **"Ingresar con PIN"**.
2. Ingresá tu código de 4 dígitos asignado:
   * **Cajera (Turno Mañana):** PIN `3333`
   * **Vendedor de Mostrador:** PIN `4444`
3. El sistema adaptará las opciones disponibles según tus tareas diarias.

---

### 2. Atajos de Teclado del Mostrador (Para memorizar)

| Tecla | Acción | Descripción |
| :---: | :--- | :--- |
| <kbd>Enter</kbd> | **Pistolear / Agregar** | Al escanear un código de barras o escribir un SKU, lo agrega al carrito automáticamente. |
| <kbd>F2</kbd> | **Cobrar Venta** | Abre la pantalla de cobro directo y emite el ticket. |
| <kbd>F4</kbd> | **Cancelar / Limpiar** | Vacía el carrito actual para atender a un nuevo cliente. |
| <kbd>F6</kbd> | **Guardar Preventa** | Guarda el pedido del cliente en espera y genera un ticket de preventa (`PED-001`). |
| <kbd>F7</kbd> | **Ver Preventas** | Abre el listado de pedidos pendientes para cargarlos en caja. |
| <kbd>F8</kbd> | **Alternar Precios** | Cambia entre precio **Minorista (Mostrador)** y precio **Mayorista (Gremio/Obra)**. |
| <kbd>ESC</kbd> | **Cerrar Ventana** | Cierra cualquier diálogo emergente o visor de ticket y regresa el cursor al buscador. |

---

### 3. Uso del Lector de Códigos de Barras y Búsqueda
* **Pistoleo Directo:** El cursor siempre está listo en la barra de búsqueda. Al pasar el producto por el lector de código de barras:
  * 🔔 **Bip agudo:** Confirmación de que el artículo fue reconocido y sumado al carrito.
  * ⚠️ **Tono grave:** Alerta sonora de que el código no existe o no tiene stock.
* **Búsqueda por Nombre:** Si el artículo no tiene código pegado (ej. clavos sueltos, manguera, alambre), podés escribir parte del nombre (ej. `manguera 3/4` o `alicate`) y presionar <kbd>Enter</kbd> o hacer clic en el botón `+`.

---

### 4. Fraccionamiento de Unidades (Metros, Kilos, Fracciones)
En ferretería muchos artículos se venden fraccionados:
* En la columna de cantidad del carrito podés ingresar números decimales directamente:
  * `0.5` para medio metro de cable.
  * `2.25` para 2 metros y cuarto de caño o manguera.
  * `1.50` para un kilo y medio de clavos.
* El sistema calculará el precio exacto proporcionalmente.

---

### 5. Flujo de Trabajo en la Ferretería

#### Caso A: Venta Rápida en Caja Única (Carga y Cobro en el mismo puesto)
1. Escaneás o buscás los artículos del cliente.
2. Si el cliente es gremio/constructor, presionás <kbd>F8</kbd> para activar la lista Mayorista.
3. Presionás <kbd>F2</kbd> (**Cobrar**).
4. Seleccionás la forma de pago (Efectivo, Débito, Transferencia/Alias, Mercado Pago QR o Cuenta Corriente).
5. Presionás <kbd>Enter</kbd> para imprimir el comprobante térmico o entregar el ticket.

#### Caso B: Despacho en Mostrador y Cobro en Caja Central (Preventa)
1. **El Vendedor en su terminal de mostrador:**
   * Carga los 5 o 10 materiales que el cliente necesita.
   * Presiona <kbd>F6</kbd> (**Guardar Preventa**).
   * El sistema le asigna un número corto (ej. `PED-004`).
   * El vendedor le dice al cliente: *"Pasá por la caja con el pedido número 4"*.
   * La pantalla del vendedor queda limpia al instante para atender al siguiente cliente en la fila.
2. **La Cajera en la terminal de cobro:**
   * El cliente dice: *"Vengo a pagar el pedido 4"*.
   * La cajera presiona <kbd>F7</kbd> (**Ver Preventas**).
   * Hace clic en **"Cargar a Caja"** en el pedido `PED-004`.
   * El pedido se vuelca automáticamente a la pantalla de cobro.
   * La cajera presiona <kbd>F2</kbd>, cobra y entrega el ticket sellado al cliente para que retire en depósito.

---

### 6. ¿Qué hacer si se corta Internet en el local?
* **No te preocupes:** NegoStock cuenta con tecnología *Offline-Resilient*.
* En la barra superior verás un cartel naranja: **"Modo Desconectado Activado"**.
* **Podés seguir vendiendo, cobrando y emitiendo comprobantes normalmente.**
* Las ventas quedarán guardadas en la memoria de la computadora y verás un indicador diciendo: `3 por sincronizar`.
* Cuando vuelva la conexión a internet o el WiFi, **el sistema subirá automáticamente todas las ventas a la nube** sin que tengas que hacer nada.
