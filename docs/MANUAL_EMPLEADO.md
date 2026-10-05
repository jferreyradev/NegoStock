# Manual de Usuario - Empleado de Mostrador y Caja
## Sistema NegoStock SaaS

Este manual está destinado al personal de atención al público, vendedores de mostrador y cajeros del comercio (ferretería, corralón, pinturería). El sistema está optimizado para facturación ágil, uso intensivo del teclado, pistola lectora de códigos de barras, gestión de clientes, emisión de presupuestos y remitos.

---

### 1. Inicio de Turno, Cuentas y Bloqueo de Sesión
* Para operar el mostrador, cada empleado ingresa con su **PIN personal de 4 dígitos** o credenciales:
  * 👑 **Superusuario (SaaS Master):** PIN `9999` | Email: `superadmin@negostock.com`
  * 👤 **Dueño / Administrador:** PIN `1234` (o `0000` en demo) | Email: `admin@ferreteria.com`
  * 🛡️ **Encargado de Local:** PIN `2222`
  * 💵 **Cajera Turno Mañana:** PIN `3333`
  * 🏷️ **Vendedor de Mostrador:** PIN `4444`
* **Seguridad de Sesión (Bloqueo de Cambio al Vuelo):**  
  Una vez que ingresás con tu usuario, **la sesión queda anclada a tu identidad**. No se permite cambiar de usuario directamente desde el menú para evitar suplantaciones o ventas cruzadas.
* **Cerrar Sesión para Cambio de Turno (Logout):**  
  Para entregar la caja a un compañero, relevar el turno o ausentarte del mostrador, hacé clic en el botón rojo **"Salir"** en la barra superior o en el ícono de cerrar sesión del menú lateral. Volverás a la pantalla de acceso con PIN para que el nuevo operador ingrese su clave personal.

---

### 2. Atajos de Teclado del Mostrador (POS)
Para atender con máxima velocidad sin tocar el mouse, memorizá estos atajos principales:

| Tecla | Acción en el Mostrador |
| :---: | :--- |
| <kbd>Enter</kbd> | Busca el código escaneado con la pistola o agrega el artículo seleccionado. |
| <kbd>F2</kbd> | **Cobrar / Concretar Venta:** En cualquier modo (incluso Presupuesto), abre el modal de cobro y medios de pago para cerrar la venta inmediatamente. |
| <kbd>F4</kbd> | **Limpiar Mostrador / Descartar:** Vacía el changuito actual y restablece el cotizador listo para la próxima atención. |
| <kbd>F6</kbd> | **Emitir / Guardar Presupuesto:** Abre el diálogo para guardar cotizaciones formales (`PRES-XXX`), definir días de validez y descargar PDF. |
| <kbd>F7</kbd> | **Ver Presupuestos y Pedidos:** Abre la lista para recuperar presupuestos guardados o cobrar pedidos en espera. |
| <kbd>F8</kbd> | **Alternar Precios:** Cambia entre precio **Mostrador** (minorista) y **Gremio/Mayoreo**. |
| <kbd>Esc</kbd> | Cierra cualquier ventana modal o cancela la búsqueda activa. |

---

### 3. Venta Rápida con Pistola de Código de Barras
1. Con el cursor en la barra de búsqueda superior, apuntá y dispará la pistola sobre el código de barras del producto.
2. El sistema emitirá un **pitido agudo de confirmación** y agregará el artículo al carrito.
3. Si disparás el mismo código varias veces, se incrementa la cantidad automáticamente.
4. **Artículos Pausados o No Disponibles:** Si un artículo fue marcado como *No Disponible* por el dueño (falta de stock o cambio de proveedor), el sistema emitirá un **tono grave de alerta** y te informará en pantalla que el artículo no puede venderse en mostrador.

---

### 4. Gestión y Selección de Clientes en Mostrador
En la parte superior del carrito de compras disponés de la barra de cliente activo:
* **Cliente Predeterminado:** Inicia siempre en `Consumidor Final`.
* **Buscar Cliente Existente:**  
  Hacé clic en **"Clientes"** para buscar por nombre, CUIT, DNI o teléfono (ej. contratistas, talleres o cuentas corrientes). Hacé clic en *"Seleccionar"* para asignarlo al carrito.
* **Alta Rápida de Cliente en Mostrador:**  
  Hacé clic en el botón **`+`** para cargar un cliente nuevo sin salir del mostrador:
  * Nombre o Razón Social (Obligatorio).
  * CUIT o DNI.
  * Condición de IVA (Consumidor Final, Monotributo, Responsable Inscripto).
  * Teléfono / WhatsApp para avisarle cuando llegue su pedido.
* **Volver a Consumidor Final:**  
  Hacé clic en la **`✖`** al lado del nombre del cliente para restablecer la venta rápida.

---

### 5. Circuito de Cotización y Venta: Presupuesto por Defecto y Cierre de Compra

En NegoStock, el mostrador inicia **por defecto en modo Presupuesto (Cotización)**. Esto permite armar cotizaciones libremente para clientes que consultan precios sin alterar las existencias de stock del local.

#### 5.1. Armar una Cotización y Pasarla a Venta Inmediata ("Me lo llevo")
1. Cargá los artículos pedidos por el cliente.
2. Verás el encabezado en color ámbar: **`Cotizador / Presupuesto`** y el total cotizado.
3. Si el cliente dice *"Me lo llevo ahora / te lo pago"*:
   * Hacé clic en el botón verde prominente **`CONCRETAR VENTA Y COBRAR [F2]`** (o presioná <kbd>F2</kbd>).
   * El sistema cambia automáticamente el comprobante a **Ticket X (Venta Mostrador)** y abre el modal de cobro.
   * Elegí el medio de pago (Efectivo, Débito, Transferencia, QR, Cta Cte), ingresá el importe recibido para calcular el vuelto y presioná **`Confirmar Cobro e Imprimir`**.
   * **Efecto en stock:** Se descuenta el inventario físico en tiempo real y se emite el comprobante.

#### 5.2. Guardar y Emitir Presupuesto Formal (Sin Descontar Stock)
Si el cliente solo quiere llevarse el presupuesto para evaluar o consultar con su arquitecto/empresa:
1. Hacé clic en el botón **`Guardar / Emitir Presupuesto [F6]`** (o tecla <kbd>F6</kbd>).
2. En la ventana modal:
   * **Plazo de validez:** Podés elegir 7, 15 o 30 días, o marcar la casilla **"Presupuesto sin fecha de caducidad"**.
   * **Notas:** Escribí observaciones (ej. *"Precios sujetos a variación de fábrica. Entrega inmediata"*).
3. Opciones de salida:
   * **Guardar:** Lo almacena en el sistema con un número correlativo (ej. `PRES-001`).
   * **Descargar PDF:** Descarga inmediatamente un PDF vectorial A4 profesional sin costo adicional.
   * **Imprimir:** Emite el presupuesto en la ticketera térmica del mostrador.
4. **Regla de oro:** El presupuesto queda guardado con estado `PENDIENTE` y **NO descuenta stock**.

#### 5.3. Recuperar un Presupuesto para Cobrarlo o Actualizarlo
Cuando el cliente regresa al local a concretar la compra o solicitar modificaciones:
1. Presioná **`[F7] Presupuestos`** (o el botón inferior *"Presupuestos"*).
2. Buscá por el número (`PRES-001`) o nombre del cliente y hacé clic en **"Cargar"**.
3. El mostrador cargará los artículos y mostrará la barra: `📋 Presupuesto PRES-001 cargado`.
4. **Si el cliente viene a pagar (Concretar Venta):**  
   Hacé clic en **`PASAR A VENTA Y COBRAR [F2]`** o cambiá el selector a *Ticket X*. Al confirmar el cobro, el presupuesto `PRES-001` se cierra automáticamente, se descuenta el stock y queda asentado en el historial de ventas.
5. **Si el cliente quiere agregar o quitar artículos (Actualizar Presupuesto):**  
   Modificá las cantidades en el changuito y hacé clic en **`Actualizar Presupuesto (PRES-001)`**. Los cambios se guardarán en la cotización existente sin duplicarla ni tocar el inventario.

#### 5.4. Armador Avanzado de Presupuestos y Pedidos (`/armar-presupuesto`)
Para cotizaciones complejas, licitaciones o pedidos detallados con conceptos libres:
1. Ingresá desde el menú lateral a **`Armador de Presupuesto`** o hacé clic en el botón **`Armador`** de la cabecera del carrito.
2. Esta vista te permite:
   * **Agregar Ítems Libres / Personalizados:** Fletes, cortes a medida, mano de obra o servicios no cargados en el inventario fijo (`+ Ítem Personalizado`).
   * **Editar Precios Unitarios en Vivo:** Ajustar el precio unitario pactado para cada renglón.
   * **Bonificaciones / Descuentos por Renglón:** Asignar un % de bonificación específico para cada ítem (ej. 10% en tornillería).
   * **Descuento Global del Pedido:** Aplicar 5%, 10%, 15% o un % personalizado sobre el total.
   * **Definir Validez Formal:** Establecer 7, 15, 30, 60 días o sin caducidad.
   * **Pasar a Venta Directa [F2]:** En 1 solo clic conmuta a Ticket X y abre el modal de cobro sin perder los artículos cargados.

---

### 6. Emisión de Remitos de Entrega
Para envíos a obra, fletes o entregas a domicilio:
1. En el desplegable de comprobante elegí **`Remito de Entrega`**.
2. Cargá los materiales y presioná **`EMITIR REMITO [F2]`**.
3. En el modal de confirmación completá:
   * **Dirección de Destino / Obra**.
   * **Transporte / Chofer / Patente**.
4. Hacé clic en **`Confirmar y Bajar PDF`**.
5. El sistema descuenta el stock de las existencias y descarga el remito oficial con el detalle de bultos y el espacio para firma de conformidad.

---

### 7. Calidad Vectorial en PDFs (Cero Superposición)
* Todos los presupuestos, comprobantes de venta y remitos descargados en PDF están maquetados milimétricamente en alta definición vectorial A4.
* Las descripciones largas de productos se dividen de forma automática en varios renglones sin pisar la columna de precios unitarios ni subtotales.
* Los totales y condiciones legales se presentan apilados en recuadros claros, garantizando una presentación formal e impecable ante tus clientes.

---

### 8. Flujo de Preventa (Salón $\rightarrow$ Caja)
En ferreterías con separación física entre vendedores de salón y la caja de cobro:
1. **El Vendedor:** Carga los materiales y presiona <kbd>F6</kbd> $\rightarrow$ *"Guardar como Preventa Mostrador"*. El pedido queda en espera con número `PED-XXX`.
2. **El Cajero:** Presiona <kbd>F7</kbd>, abre la pestaña *"Preventas"*, hace clic en *"Cargar"* y cobra con el medio de pago elegido (<kbd>F2</kbd>).

---

### 9. ¿Qué hacer si se corta Internet en el local?
* NegoStock cuenta con almacenamiento local cifrado de alta seguridad (AES-GCM de 256 bits).
* Si el indicador de la barra superior pasa a **"Sin Red"**:
  * Podés seguir presupuestando, cobrando e imprimiendo comprobantes con normalidad.
  * Todas las operaciones se guardan en la memoria segura de la PC.
  * Al regresar la señal (o al pulsar *"Sincronizar"* en la barra superior), todos los comprobantes se subirán a la nube automáticamente sin duplicarse.
