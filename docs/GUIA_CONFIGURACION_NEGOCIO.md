# Guía de Configuración del Negocio, Tickets y Recibos
## NegoStock SaaS - Puesta en Marcha Operativa y Comercial

Esta guía detalla el **relevamiento exhaustivo de datos y requisitos** necesarios para parametrizar un nuevo comercio en **NegoStock**, configurar la identidad en pantalla, la emisión de tickets/recibos en mostrador y los periféricos de hardware en el local.

---

## 1. Relevamiento de Datos del Negocio (Checklist Comercial y Fiscal)

Para dar de alta o parametrizar el comercio en el sistema (tanto en la base de datos Supabase como desde el botón **"Datos del Negocio"** en la barra lateral del sistema), completá la siguiente ficha técnica:

### 1.1. Identidad de Marca y Mostrador
* **Nombre Comercial / Fantasía (Obligatorio):**  
  *Ejemplo:* `Ferretería Central` o `Bulonera San Martín`.  
  *Uso:* Se visualiza en la barra de navegación superior, pestaña del navegador y título principal en negrita de todos los tickets impresos.
* **Logotipo Comercial (Opcional):**  
  *Formato:* Imagen en formato PNG o JPG (fondo transparente o blanco, proporción horizontal o cuadrada, ej. 400x150 px).  
  *Uso:* Impresión gráfica en ticketera térmica y presupuestos digitales PDF.
* **Rubro Principal:**  
  *Ejemplo:* Ferretería Industrial, Corralón, Pinturería, Sanitaria y Electricidad.

### 1.2. Datos Legales y Fiscales (Impresos en Comprobantes)
* **Razón Social Legal (Obligatorio si emite comprobantes oficiales):**  
  *Ejemplo:* `Ferretería Central S.R.L.` o `Juan Carlos Pérez`.
* **Identificación Tributaria (CUIT / CUIL / RUT / RFC / NIF):**  
  *Ejemplo (Argentina):* `30-71234567-9`.
* **Condición frente al IVA:**  
  *Opciones en el sistema:*
  * `IVA Responsable Inscripto`
  * `Responsable Monotributo`
  * `IVA Exento`
  * `Consumidor Final`
* **Número de Ingresos Brutos (IIBB):**  
  *Ejemplo:* `901-123456-7` (Régimen Local o Convenio Multilateral).
* **Fecha de Inicio de Actividades:**  
  *Ejemplo:* `01/03/2018`.

### 1.3. Localización y Canales de Contacto
* **Domicilio Comercial:**  
  *Ejemplo:* `Av. San Martín 1240, Morón, Buenos Aires`.  
  *Uso:* Impreso en el encabezado del ticket para reclamos, retiros o garantías de clientes.
* **Teléfono de Atención / WhatsApp de Pedidos:**  
  *Ejemplo:* `011-4567-8900` o `+54 9 11 2345-6789`.  
  *Uso:* Para que el cliente pueda contactar al mostrador o enviar comprobantes de transferencias.
* **Correo Electrónico de Contacto:**  
  *Ejemplo:* `ventas@ferreteriacentral.com.ar`.
* **Sitio Web o Redes Sociales (Opcional):**  
  *Ejemplo:* `@ferreteriacentral`.

---

## 2. Configuración de Puntos de Venta y Comprobantes

### 2.1. Puntos de Venta (Cajas Físicas)
Cada mostrador, caja o tablet se identifica con un número entero de Punto de Venta:
* **Punto de Venta 1 (`0001`):** Caja Mostrador Principal / Facturación.
* **Punto de Venta 2 (`0002`):** Terminal Preventa / Vendedor de Salón (arma presupuestos y pedidos `PED-XXX`).
* **Punto de Venta 3 (`0003`):** Caja Secundaria / Turno Tarde o Despacho de Depósito.

### 2.2. Tipos de Comprobantes Disponibles en Mostrador
| Tipo de Comprobante | Código Sistema | Formato de Numeración | Validez Fiscal | Cuándo se usa |
| :--- | :--- | :--- | :--- | :--- |
| **Ticket X (Comprobante Interno)** | `TICKET_X` | `0001-00000142` | No válido como factura | Ventas al contado en mostrador, entregas rápidas de caja diaria. |
| **Presupuesto / Cotización** | `PRESUPUESTO` | `0001-00000028` | Informativo (Sin validez) | Cotizaciones para obras, talleres o contratistas con validez de 7/15 días. |
| **Remito de Entrega** | `REMITO` | `0001-00000015` | Respaldo de transporte/retiro | Salida de mercadería pesada, entrega a flete o acopio en depósito. |
| **Factura A / B / C** | `FACTURA_A/B/C` | `0001-XXXXXXXX` | Fiscal oficial | Conexión con Webservice AFIP/Fisco (en módulo de facturación electrónica). |

---

## 3. Estructura y Parametrización del Ticket Térmico

NegoStock emite comprobantes de impresión directa optimizados para impresoras térmicas de tickets. El ticket se compone de 4 secciones configurables:

```text
========================================
           FERRETERÍA CENTRAL          <-- [1. Nombre Comercial]
   CUIT: 30-71234567-9 | Resp. Inscripto<-- [2. CUIT y Condición IVA]
 Av. San Martín 1240 - Tel: 011-4567-8900<-- [3. Domicilio y Teléfono]
----------------------------------------
TICKET X                         N° 0001-00000142 <-- [4. Tipo y N° correlativo]
Fecha: 02/10/2026 19:45
Cliente: Consumidor Final (CF)
----------------------------------------
Cant   Detalle                     Total
----------------------------------------
2 u    CINTA AISLADORA NEGRA TACSA  $2.400,00
1 u    DESTORNILLADOR PHILLIPS MOTA $4.850,00
----------------------------------------
Subtotal:                           $7.250,00
Descuento (10%):                     -$725,00
TOTAL:                              $6.525,00 <-- [5. Total destacado]
Pago con: EFECTIVO
----------------------------------------
Comprobante no válido como factura fiscal <-- [6. Leyenda Legal Configurable]
¡Gracias por su compra! vuelva pronto  <-- [7. Mensaje de Despedida]
========================================
```

### 3.1. Campos Parametrizables del Ticket:
1. **Ancho de Papel:**
   * **80 mm (Recomendado):** Estándar en comercios, soporta descripciones de artículos de hasta 28-32 caracteres sin truncar.
   * **58 mm (Compacto):** Formato reducido para mini-impresoras portátiles o ticketeras bluetooth.
2. **Leyenda Fiscal al Pie:**
   * *Por defecto:* `"Comprobante no válido como factura fiscal"`.
   * *Opcional:* `"Documento interno de control - Solicite su factura en caja"`.
3. **Mensaje de Agradecimiento:**
   * *Por defecto:* `"¡Gracias por su compra!"`.
   * *Opcional:* `"Horarios de atención: Lun a Vie 8 a 19hs - Sáb 8 a 13hs"`.

---

## 4. Requisitos de Hardware y Periféricos en el Local

Para operar el sistema a máxima velocidad en mostrador de atención al público:

### 4.1. Computadora o Terminal de Cobro
* **Hardware Mínimo:** Cualquier PC, All-in-One, Notebook o Mini-PC con Intel Celeron / Core i3 o AMD equivalente, 4 GB de RAM.
* **Sistema Operativo:** Windows 10/11, macOS o Linux Ubuntu.
* **Navegador Web:** Google Chrome, Microsoft Edge, Brave o Mozilla Firefox (se recomienda fijar acceso directo en modo Kiosco / Pantalla Completa `F11`).

### 4.2. Impresora Térmica de Tickets (Ticketera)
* **Modelos Compatibles:**
  * Cualquier ticketera térmica ESC/POS estándar de 80mm o 58mm conectada por **USB**, **Ethernet (Red)** o **Bluetooth**.
  * Marcas habituales: Epson (TM-T20III, TM-T88), Hasar, Xprinter (XP-N160M, XP-58), Sam4s, Bixolon, 3nStar.
* **Configuración del Navegador:**
  1. Presionar `Ctrl + P` (o `Cmd + P` en Mac) en la pantalla de prueba de ticket.
  2. En Destino, elegir la impresora térmica.
  3. En **Márgenes**, seleccionar **"Ninguno"**.
  4. Desmarcar la casilla **"Encabezados y pies de página"** (para evitar que imprima la fecha y la URL del navegador).
  5. En tamaño de papel, elegir `80 x 297 mm` o `Roll Paper 80mm`.
  6. Para impresión en 1 clic sin ventana emergente: Iniciar Chrome con el flag `--kiosk --kiosk-printing`.

### 4.3. Lector de Código de Barras
* **Tipo:** Lector láser o imager USB / Inalámbrico (Plug & Play, emulación teclado HID).
* **Configuración del Lector:** Configurar para que envíe un sufijo **ENTER** (`CR`) tras cada lectura.
* **Funcionamiento en NegoStock:** Al escanear un código en el mostrador, el sistema busca inmediatamente el artículo, lo agrega al carrito con un pitido sonoro confirmatorio y enfoca el buscador listo para el siguiente producto.

### 4.4. Gaveta de Dinero (Cajón Portamonedas)
* Conexión estándar mediante cable telefónico RJ11 conectado directamente a la impresora térmica.
* La ticketera envía el pulso de apertura eléctrica automáticamente al finalizar el cobro.

---

## 5. Medios de Cobro y Cuentas Bancarias

Para registrar las cobranzas en caja y conciliar el cierre de turno:

1. **Efectivo:** Cobro directo con cálculo de vuelto.
2. **Transferencias Bancarias (Alias / CBU):**
   * *Requisito:* Tener a mano el cartel con **Alias**, **CBU/CVU** y **Titular** de la cuenta para mostrar en el mostrador.
3. **Tarjetas de Débito y Crédito:**
   * Terminal POSNet, Payway, Clover o Pos inalámbrico.
4. **Billeteras Virtuales (Mercado Pago, Modo, Cuenta DNI, BNA+):**
   * Cartel con código QR impreso en el mostrador.
5. **Cuentas Corrientes (Clientes Habituales / Gremio):**
   * Asignación del cliente por nombre o CUIT para diferir el cobro.

---

## 6. Personal, Turnos y Accesos (Matriz RBAC)

Relevar la nómina de empleados que utilizarán el sistema:

| Nombre y Apellido | Rol Asignado | PIN Mostrador | Correo Electrónico | Funciones Habilitadas |
| :--- | :--- | :--- | :--- | :--- |
| **Juan Pérez** | `ADMIN` (Dueño) | `1234` | `admin@ferreteria.com` | Control total, ver costos y márgenes, aumentos masivos, altas/bajas de personal, configuración del comercio. |
| **Martín Gómez** | `MANAGER` (Encargado) | `2222` | `encargado@ferreteria.com` | Modificar precios individuales, ajustar stock, ver costos de reposición, facturar y cobrar. |
| **Ana López** | `CASHIER` (Cajera) | `3333` | `ana@ferreteria.com` | Cobrar ventas en caja, imprimir tickets, ver historial de tickets del día. No ve costos de mercadería. |
| **Carlos Ruiz** | `SELLER` (Vendedor) | `4444` | `carlos@ferreteria.com` | Consultar stock, armar pedidos preventa (`F6`), atención en mostrador. No cobra ni modifica precios. |

---

## 7. Dónde se Configura en NegoStock

Disponés de 2 vías directas para cargar y modificar estos datos:

### Método 1: Desde la Interfaz Web (Recomendado para el Dueño)
1. Iniciar sesión con rol **ADMIN** (o PIN `1234`).
2. Abrir el menú lateral izquierdo.
3. Hacé clic en 🏪 **"Datos del Negocio"**.
4. Completá el formulario con los nombres, CUIT, teléfono, dirección y textos de tickets.
5. Hacé clic en **"Guardar Configuración"**.  
   *El cambio se aplicará de inmediato en todos los tickets emitidos y se respaldará tanto en Supabase como en el almacenamiento cifrado local.*

### Método 2: Directamente en la Base de Datos en Supabase
Si administrás la base central, podés ejecutar este comando SQL en el **SQL Editor**:
```sql
UPDATE comercios 
SET 
    nombre = 'Mi Nueva Ferretería',
    razon_social = 'Mi Nueva Ferretería S.R.L.',
    cuit = '30-99887766-5',
    iibb = '901-998877-6',
    condicion_iva = 'RESPONSABLE_INSCRIPTO',
    direccion = 'Av. Principal 500, Local 2',
    telefono = '011-5555-4444',
    email = 'contacto@minuevaferreteria.com'
WHERE id = 1;
```
