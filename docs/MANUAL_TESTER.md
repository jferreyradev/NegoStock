# Manual de Pruebas y Validación (QA / Tester)
## Sistema NegoStock SaaS — Control de Calidad y Puesta en Marcha

Este manual está diseñado para evaluadores, testers de aseguramiento de calidad (QA) y clientes de prueba. Describe paso a paso cómo verificar cada flujo crítico del sistema antes y después de publicar el servicio en producción.

---

### 1. Entorno de Pruebas y Credenciales Oficiales

El sistema dispone de cuentas preparadas para evaluar todos los niveles de privilegios:

| Perfil / Rol | Correo Electrónico | Contraseña | PIN Mostrador | Alcance de Prueba |
| :--- | :--- | :--- | :---: | :--- |
| **🧪 Usuario Demo (Tester / Dueño)** | `demo@negostock.com` | `demo123` | **`0000`** *(o `1234`)* | **Acceso total de gestión:** POS, Inventario, Costos, Aumento masivo de precios, Stock, Clientes, Historial y Usuarios. |
| **🛒 Cajera Turno Mañana** | `ana@ferreteria.com` | — | **`3333`** | **Operación de caja:** Cobro de ventas, calculadora de vuelto, tickets internos y remitos. |
| **📋 Vendedor Mostrador** | `carlos@ferreteria.com` | — | **`4444`** | **Atención al público:** Cotizaciones y presupuestos rápidos (sin cobro ni descuento de stock). |
| **🛡️ Encargado de Local** | `encargado@ferreteria.com`| — | **`2222`** | **Supervisión:** Modificación de precios unitarios y ajustes de stock. |
| **👑 Superusuario (SaaS Master)** | `superadmin@negostock.com` | `superadmin123` | **`9999`** | **Dueño de la plataforma:** Habilitación de módulos del SaaS, Backup y Restauración de base de datos. |

#### Formas de Acceso en la Pantalla de Login (`/login`):
1. **Acceso Rápido en 1 Clic (Recomendado para testing):** En la pantalla de login, hacer clic directamente en `[Probar como Dueño (Demo)]` o `[Probar como Cajera]`.
2. **Terminal Mostrador (PIN):** Tipear `0000` o `1234` en el teclado numérico en pantalla o con el teclado físico de la computadora.
3. **Administración Corporativa (Email):** Ingresar con `demo@negostock.com` y contraseña `demo123`.

---

### 2. Matriz de Casos de Prueba Paso a Paso (Test Cases)

---

#### 🧪 CASO 01: Venta Efectiva (Ticket X) con Modal de Cobro y Cálculo de Vuelto
* **Objetivo:** Comprobar que el sistema nunca descuenta stock sin confirmación previa y valida el pago en efectivo.
* **Pasos:**
  1. Ingresar como **Usuario Demo** (`PIN 0000`) o **Cajera** (`PIN 3333`).
  2. En el Mostrador (`/`), buscar un artículo (ej. SKU `2030` o escribir *"alicate"*) y agregarlo al carrito.
  3. Presionar el botón verde **`COBRAR [F2]`** o presionar la tecla **`F2`**.
  4. **Verificación intermedia:** Comprobar que se abre el **Modal de Confirmación y Cobro de Venta** con cabecera azul (`TICKET X`), listado de artículos y total a pagar. **El stock aún no debe haberse modificado.**
  5. Probar presionar `Cancelar [ESC]`: El diálogo debe cerrarse y el carrito quedar intacto.
  6. Volver a presionar `COBRAR [F2]`:
     - Seleccionar forma de pago **Efectivo**.
     - En el campo *"Paga con ($)"*, probar hacer clic en los chips de billetes sugeridos o tipear un monto superior al total.
     - Verificar que el recuadro verde calcule exactamente el **"Vuelto a entregar"**.
  7. Hacer clic en **`Confirmar Cobro e Imprimir [Enter]`** o presionar `Enter`.
* **Resultado Esperado:**
  - Se reproduce el tono de éxito.
  - El stock del artículo se descuenta inmediatamente del inventario (visible en `/inventory`).
  - Se abre el ticket final con el detalle de pago y vuelto.
  - El carrito se vacía automáticamente para la próxima atención.

---

#### 🚚 CASO 02: Emisión y Despacho de Remito de Entrega
* **Objetivo:** Verificar la generación de remitos comerciales para entrega de mercadería en obra o a domicilio.
* **Pasos:**
  1. En el selector superior del carrito, cambiar el tipo de comprobante de *"Ticket X"* a **`Remito de Entrega`**.
  2. Asignar un cliente con dirección o seleccionar uno existente (ej. *"Constructora del Valle"*).
  3. Cargar 2 o más artículos al carrito.
  4. Presionar **`COBRAR [F2]`**.
  5. **Verificación intermedia:** Comprobar que el modal de confirmación ahora tiene **estética naranja/ámbar**, badge **`REMITO DE ENTREGA`** y muestra los campos especiales:
     - *Dirección de Destino / Obra*.
     - *Transporte / Chofer / Patente*.
  6. Completar los datos de envío y hacer clic en **`Confirmar y Bajar PDF`**.
* **Resultado Esperado:**
  - El stock se descuenta del inventario.
  - Se descarga automáticamente un archivo PDF vectorial profesional con el título **"REMITO DE ENTREGA"**, los datos del transporte, dirección de obra y la leyenda legal de conformidad de recepción.

---

#### 📄 CASO 03: Circuito de Presupuestos: Modo Predeterminado y Conversión a Venta [F2]
* **Objetivo:** Verificar que el sistema inicia en modo Presupuesto por defecto, que las cotizaciones **NO descuentan stock**, y que se pueden transformar en ventas efectivas en 1 solo clic o con `[F2]`.
* **Pasos de Prueba:**
  1. Abrir el mostrador (`/`) o vaciar el carrito:
     - Comprobar que en el selector superior de comprobante figura **`PRESUPUESTO`** como tipo predeterminado.
     - El botón de acción rápida muestra **`Guardar / Emitir Presupuesto [F6]`** y el botón primario muestra **`PASAR A VENTA Y COBRAR [F2]`**.
  2. Ir a `/inventory` y anotar el stock actual de un artículo (ej. Producto A tiene `10` unidades).
  3. Cargar `5` unidades del Producto A al carrito en mostrador.
  4. Presionar el botón ámbar **`Guardar / Emitir Presupuesto [F6]`** (o tecla `F6`):
     - Establecer `15` días de validez o marcar *"Sin fecha de caducidad"*.
     - Presionar *"Guardar y Descargar PDF"*.
  5. **Verificación de Stock:** Ir a `/inventory` y verificar que el Producto A **sigue teniendo exactamente `10` unidades** (el presupuesto no reservó ni descontó existencias).
  6. Volver a mostrador y presionar **`[F7] Presupuestos`**:
     - Localizar el presupuesto recién guardado con estado `PENDIENTE`.
     - Hacer clic en el botón verde **`Cargar al Carrito`**.
  7. **Conversión a Venta:**
     - En el carrito, el botón principal indica claramente: **`CONCRETAR VENTA Y COBRAR [F2]`**.
     - Presionar **`[F2]`** o hacer clic en el botón verde.
     - Verificar que el tipo de comprobante conmuta a **`Ticket X`** y se abre inmediatamente el **Modal de Cobro** con las opciones de pago.
  8. Confirmar el cobro en efectivo.
* **Resultado Esperado:**
  - El stock del Producto A ahora sí se descuenta del inventario (pasa de `10` a `5` unidades).
  - El presupuesto en `[F7]` cambia automáticamente su estado a `COMPLETADO`.
  - El carrito se resetea y vuelve a quedar listo en modo **`PRESUPUESTO`** predeterminado.

---

#### 🚫 CASO 04: Regla de Agotamiento de Stock ("Sin Stock / No Disponible")
* **Objetivo:** Validar que al agotarse un artículo, el sistema lo desactive para mostrador sin eliminarlo de la base de datos.
* **Pasos:**
  1. Localizar un producto que tenga pocas existencias (ej. `1` unidad en stock).
  2. Cargar esa unidad al carrito y cobrarla como venta efectiva.
  3. El stock ahora pasa a `0`.
  4. Observar la tarjeta del producto en mostrador: Debe mostrar el badge rojo **`SIN STOCK (NO DISPONIBLE)`**.
  5. Intentar hacer clic en el producto o pistolear su código SKU:
* **Resultado Esperado:**
  - El sistema emite un **tono de alerta grave** y muestra el mensaje: *"El artículo está SIN STOCK (No disponible para mostrador)"*.
  - El artículo **NO** se agrega al carrito.
  - El producto sigue existiendo en el catálogo de `/inventory` con stock 0 (nunca se borra) a la espera de una nueva compra a proveedores.

---

#### 🔄 CASO 05: Anulación / Devolución de Venta y Reintegro al Kardex
* **Objetivo:** Verificar la auditoría de stock mediante el Kardex ante cancelaciones o devoluciones de clientes.
* **Pasos:**
  1. Ir a la pantalla de **Historial de Ventas** (`/sales-history`).
  2. Localizar una venta cobrada recientemente y hacer clic en el botón de **`Anular / Devolución`**.
  3. Indicar el motivo de la anulación (ej. *"Devolución de mercadería por cambio de medida"*).
  4. Confirmar la operación.
  5. Ir a `/inventory` y abrir el Kardex del producto devuelto.
* **Resultado Esperado:**
  - La venta pasa al estado `ANULADA` (en rojo).
  - El stock del producto se incrementa automáticamente devolviendo las unidades al inventario.
  - El Kardex registra el movimiento con tipo `DEVOLUCION_VENTA`, fecha, hora y el operador responsable.

---

#### 🏷️ CASO 06: Doble Modalidad de Precios (Minorista vs Mayorista [F8])
* **Objetivo:** Comprobar la alternancia de tarifas en mostrador para ventas al gremio o instaladores.
* **Pasos:**
  1. En el mostrador, presionar la tecla **`F8`** o hacer clic en el botón superior **`Minorista [F8]`**.
  2. Verificar que cambia a color morado con la etiqueta **`Mayorista [F8]`**.
  3. Agregar productos que tengan configurado *"Precio Mayorista"*.
* **Resultado Esperado:**
  - El carrito aplica automáticamente la tarifa mayorista para los productos configurados.
  - Si un producto no tiene precio mayorista (está en `$0`), mantiene su precio de venta estándar de forma transparente.

---

#### 🔒 CASO 07: Matriz de Roles y Seguridad de Privilegios
* **Objetivo:** Comprobar que los cajeros y vendedores no puedan ver costos, alterar configuraciones ni acceder a backups.
* **Pasos de Verificación:**
  1. **Iniciar sesión como Cajera (`PIN 3333`):**
     - En Inventario, no deben aparecer los precios de costo ni márgenes de ganancia.
     - En Usuarios, no debe tener permisos para crear ni editar personal.
     - No debe existir acceso a Copias de Seguridad ni activación de módulos.
  2. **Iniciar sesión como Dueño / Admin (`PIN 0000` / `1234`):**
     - Puede ver costos, editar precios unitarios y masivos, y administrar empleados locales.
     - En la lista de usuarios, el PIN del Superusuario está completamente oculto o protegido.
  3. **Iniciar sesión como Superusuario (`PIN 9999`):**
     - Tiene acceso al switch de activación/desactivación de módulos (Preventas, Clientes, Kardex, etc.).
     - Tiene acceso exclusivo al panel de Backup & Restore de base de datos.

---

#### 💾 CASO 08: Respaldo y Restauración de Base de Datos (Superadmin)
* **Objetivo:** Verificar la integridad de los datos para puntos de restauración ante auditorías o migraciones.
* **Pasos:**
  1. Iniciar sesión como **Superusuario** (`PIN 9999`).
  2. Ir a `/inventory` y hacer clic en **`Copias de Seguridad (Backup)`**.
  3. Ingresar el PIN de seguridad cuando lo solicite.
  4. Presionar **`Descargar Copia de Seguridad Completa (JSON)`**.
* **Resultado Esperado:**
  - Se descarga un archivo `.json` estructurado con todas las tablas: comercios, categorías, marcas, unidades, productos, clientes, ventas y usuarios.
  - La opción de restauración permite restablecer el estado inicial en caso de contingencia.

---

#### 📶 CASO 09: Funcionamiento Offline (Modo Autónomo Local)
* **Objetivo:** Asegurar que la ferretería nunca deje de facturar si se corta internet.
* **Pasos:**
  1. En el menú superior o de configuración, observar el indicador de estado.
  2. Desconectar la conexión a internet (modo avión) o cambiar el modo a *"Modo Local"*.
  3. Emitir una venta efectiva en mostrador.
* **Resultado Esperado:**
  - La venta se emite sin demoras ni bloqueos en pantalla.
  - El comprobante se imprime y el stock local se descuenta.
  - La venta se almacena en la cola de sincronización segura (`sales_queue`).
---

#### 📊 CASO 10: Informe y Resumen de Ventas (Día, Horas Pico y Mes)
* **Objetivo:** Comprobar que el Administrador/Dueño y el Superusuario disponen de un centro de analítica con gráficos y tablas de facturación por día, franja horaria y mes, inaccesible para empleados comunes.
* **Pasos:**
  1. Iniciar sesión como **Cajera** (`PIN 3333`) o **Vendedor** (`PIN 4444`):
     - Comprobar que en el menú lateral **NO** figura la opción *"Resumen de Ventas"*.
     - Intentar ingresar a la ruta `/reportes-ventas`: El sistema debe denegar el acceso y redirigir al mostrador.
  2. Cerrar sesión e ingresar como **Dueño / Tester** (`PIN 0000` o `demo@negostock.com`) o **Superusuario** (`PIN 9999`):
     - En el menú lateral o desde *"Ventas y Comprobantes"*, hacer clic en **`Resumen de Ventas`** (`/reportes-ventas`).
  3. Si la base no tiene ventas suficientes, hacer clic en **`Cargar Ventas Demo`** para poblar automáticamente 45 días de transacciones realistas.
  4. Evaluar las 4 pestañas de análisis:
     - **📅 Resumen por Día:** Gráfico evolutivo de barras diarias, tabla con facturación neta, % del período, cantidad de tickets, ticket promedio y mejor día de recaudación.
     - **⏰ Resumen por Horas (Horas Pico):** Análisis de 00:00 a 23:00 hs, detección automática de la *Hora Pico de Facturación ($)* y la *Hora Pico de Clientes (Tickets)* para optimizar los turnos de atención.
     - **📊 Resumen por Mes:** Comparativa mensual, variación porcentual (+% / -%), días activos y promedio diario de ventas.
     - **💳 Medios de Pago & Vendedores:** Gráficos de participación por medio de pago (Efectivo, Débito, Transferencia, Crédito, Cta Cte) y ranking de ventas por operador.
  5. Probar los botones de acción:
     - **Exportar Excel:** Descarga un archivo `.xlsx` estructurado con hojas separadas para cada análisis.
     - **Imprimir:** Genera el informe ejecutivo en formato limpio para impresión o guardado en PDF.
* **Resultado Esperado:**
  - Las métricas se calculan en tiempo real sin recargar la página.
  - La visualización es clara y exclusiva para roles de gestión (`ADMIN` y `SUPERADMIN`).

---

#### 📑 CASO 11: Generación de Comprobantes PDF Vectoriales Sin Superposición de Textos
* **Objetivo:** Comprobar que los PDFs descargados (Ticket X, Presupuesto, Remito) poseen alineación milimétrica perfecta sin encimamiento de textos ni desbordes.
* **Pasos de Prueba:**
  1. En Mostrador, cargar al menos un artículo con descripción muy larga (más de 60 caracteres, ej: *"Disco Diamantado Segmentado Profesional 115mm para Corte de Concreto y Mampostería"*).
  2. Asignar un cliente con nombre extenso y dirección detallada.
  3. Emitir y descargar el comprobante en formato PDF tanto para **Ticket X**, **Presupuesto** y **Remito de Entrega**.
  4. Abrir los PDFs descargados en el visor del navegador o lector PDF y verificar:
     - **Cabecera Comercial:** La razón social y datos fiscales no invaden el recuadro derecho del comprobante.
     - **Fila de Productos:** La descripción larga se ajusta en múltiples líneas dentro de su columna (`X=59mm` a `X=134mm`), dejando al menos 5mm de margen limpio antes del Precio Unitario (`X=163mm`).
     - **Totales Apilados:** El recuadro del total muestra la etiqueta arriba y el importe en negrita abajo (`$ 123.456,00`), evitando colisiones horizontales.
     - **Remito:** La dirección de obra y datos de transporte se imprimen con espaciado prolijo y la cláusula de conformidad al pie.
* **Resultado Esperado:**
  - Ningún texto se encima sobre otro en ninguna resolución ni nivel de zoom.
  - Si el comprobante supera 15 ítems, se genera automáticamente una segunda página con numeración *"Página X de Y"* y pie institucional.

---

#### 📱 CASO 12: Diseño Compacto de Tablas y Columna de Acciones Flotante (Sticky)
* **Objetivo:** Verificar que en pantallas de computadoras portátiles o ventanas reducidas, las tablas de gestión no se deformen y los botones de acción permanezcan siempre accesibles.
* **Pasos de Prueba:**
  1. Reducir el ancho de la ventana del navegador a unos 1024px o 1280px (simulando una notebook de mostrador).
  2. Navegar por las pantallas de tablas:
     - **Historial de Ventas** (`/sales-history`).
     - **Catálogo de Inventario** (`/inventory`).
     - **Resumen de Ventas** (`/reportes-ventas`).
  3. Observar la densidad visual de las filas:
     - Deben presentar padding reducido (`v-table--density-compact`) y tipografía condensada para ver más filas simultáneamente.
  4. Desplazar la tabla horizontalmente hacia la izquierda:
     - Observar la última columna de **"Acciones"** (botones de Ver Detalle, Anular, PDF, Editar).
* **Resultado Esperado:**
  - La columna de **Acciones** permanece fija (*sticky*) contra el borde derecho de la pantalla con una sutil sombra de elevación y fondo blanco opaco.
  - El usuario puede accionar cualquier fila inmediatamente sin tener que scrollear hacia el final cada vez.

---

### 3. Checklist de Aprobación para Publicación (Go-Live)

| Ítem | Criterio de Aceptación | Estado |
| :---: | :--- | :---: |
| 1 | El Mostrador inicia en modo Presupuesto por defecto y permite conversión directa a Venta con `[F2]`. | [ ] |
| 2 | El botón Cobrar abre el modal de confirmación y resumen antes de emitir cualquier venta o remito. | [ ] |
| 3 | Presionar Cancelar o Escape en el modal de cobro no descuenta stock ni borra el carrito. | [ ] |
| 4 | La calculadora de vuelto en efectivo funciona con billetes sugeridos y cálculo en tiempo real. | [ ] |
| 5 | Los presupuestos **NO** descuentan stock del inventario bajo ninguna circunstancia. | [ ] |
| 6 | Los remitos incluyen destino de entrega, chofer/transporte y cláusula de conformidad en el PDF. | [ ] |
| 7 | Los artículos sin stock quedan como No Disponibles y nunca se eliminan de la base de datos. | [ ] |
| 8 | Las devoluciones / anulaciones reintegran las unidades vendidas y se asientan en el Kardex. | [ ] |
| 9 | Los atajos de teclado (`F2`, `F4`, `F6`, `F7`, `F8`, `Enter`, `Esc`) responden ágilmente. | [ ] |
| 10 | Los usuarios sin privilegios (cajeros) no pueden ver costos ni editar precios ni acceder a usuarios. | [ ] |
| 11 | El Superusuario es el único con acceso a Backup & Restore y habilitación de módulos del SaaS. | [ ] |
| 12 | El informe y resumen de ventas (día, horas pico y mes) es exclusivo de Admin y Superusuario. | [ ] |
| 13 | Los comprobantes PDF vectoriales garantizan cero superposición de textos en descripciones y totales. | [ ] |
| 14 | Las tablas del sistema son compactas y mantienen visible la columna de acciones flotante (sticky). | [ ] |
