# Manual de Configuración del Sistema para el Administrador
## NegoStock SaaS - Guía Paso a Paso para la Puesta a Punto del Comercio

Este manual está destinado al **Administrador y Propietario del Comercio** (ferretería, bulonera, corralón, pinturería o sanitarios). Detalla el procedimiento integral para parametrizar el sistema desde cero, configurar los datos fiscales y comerciales, personalizar la impresión de tickets térmicos, cargar el catálogo de productos con sus stocks mínimos, organizar al personal con sus respectivos permisos y definir las políticas operativas del negocio.

---

## Índice Rápido
1. [Primer Acceso y Seguridad de Cuenta](#1-primer-acceso-y-seguridad-de-cuenta)
2. [Paso 1: Configuración de Datos del Negocio y Fiscales](#2-paso-1-configuración-de-datos-del-negocio-y-fiscales)
3. [Paso 2: Ticketera Térmica, Impresión y Periféricos](#3-paso-2-ticketera-térmica-impresión-y-periféricos)
4. [Paso 3: Seguridad de Terminal y Cierre por Inactividad (Timeout)](#4-paso-3-seguridad-de-terminal-y-cierre-por-inactividad-timeout)
5. [Paso 4: Puesta a Punto del Catálogo de Productos](#5-paso-4-puesta-a-punto-del-catálogo-de-productos)
   - 5.1 [Opción A: Vaciar Datos de Prueba para Iniciar en Limpio](#51-opción-a-vaciar-datos-de-prueba-para-iniciar-en-limpio)
   - 5.2 [Opción B: Carga Masiva desde Excel / CSV](#52-opción-b-carga-masiva-desde-excel--csv)
   - 5.3 [Uso del Inventario Mínimo y Alertas de Stock Crítico](#53-uso-del-inventario-mínimo-y-alertas-de-stock-crítico)
6. [Paso 5: Configuración de Personal, Roles y PINs](#6-paso-5-configuración-de-personal-roles-y-pins)
7. [Paso 6: Selección del Modo de Conectividad y Sincronización](#7-paso-6-selección-del-modo-de-conectividad-y-sincronización)
8. [Paso 7: Aumento Masivo de Precios por Inflación](#8-paso-7-aumento-masivo-de-precios-por-inflación)
9. [Paso 8: Módulos del Sistema y Licenciamiento](#9-paso-8-módulos-del-sistema-y-licenciamiento)
10. [Checklist Diario de Operaciones](#10-checklist-diario-de-operaciones)

---

## 1. Primer Acceso y Seguridad de Cuenta

1. Abrí el navegador en la terminal del negocio (Google Chrome, Microsoft Edge o Brave recomendados).
2. Ingresá a la dirección del sistema (`http://localhost:5173` en entorno local o la URL web del SaaS).
3. En la pantalla de bienvenida (`/login`), disponés de dos vías de acceso:
   * **Pestaña Dueño / Administrador:** Ingresá con correo electrónico y clave.
     * *Credencial Administrador de Fábrica:* `admin@ferreteria.com` / `admin123`
     * *Entorno Demo / Pruebas:* `demo@negostock.com` / `demo123`
   * **Pestaña PIN Mostrador:** Teclado táctil para ingreso ágil. El PIN predeterminado de Administrador es **`1234`** (o **`0000`** en modo demo).
4. **Política de Seguridad Anti-Suplantación:** Una vez dentro, la sesión queda fijada a tu usuario. Para cambiar de operador, se debe presionar el botón rojo **"Salir"**.

---

## 2. Paso 1: Configuración de Datos del Negocio y Fiscales

Para que los tickets, remitos, presupuestos y encabezados muestren la información real de tu negocio:

1. Hacé clic en el menú lateral en el botón **"Datos del Negocio"** (o en la barra de herramientas superior).
2. Se abrirá la ventana modal **"Configuración de Datos del Negocio"**.
3. Completá los campos solicitados:
   * **Nombre Fantasía / Comercial (Obligatorio):** El nombre visible de tu comercio (ej. *Ferretería Central* o *Bulonera San Martín*). Aparece en la barra superior y en el título principal en negrita de los tickets.
   * **Razón Social:** Nombre legal de la empresa o titular (ej. *Ferretería Central S.R.L.* o *Juan Carlos Pérez*).
   * **CUIT / CUIL:** Número tributario con guiones (ej. *30-71234567-9*).
   * **Número de Ingresos Brutos (IIBB):** Número de inscripción en rentas local o convenio multilateral.
   * **Condición frente al IVA:** Seleccioná tu condición fiscal:
     * `IVA Responsable Inscripto`
     * `Responsable Monotributo`
     * `IVA Exento`
     * `Consumidor Final`
   * **Inicio de Actividades:** Fecha fiscal de apertura (ej. *01/03/2018*).
   * **Domicilio Comercial:** Calle, número, localidad y provincia. Se imprime en el encabezado de los comprobantes.
   * **Teléfono / WhatsApp:** Canal de contacto impreso para consultas o reclamos de clientes.
   * **Email de Contacto:** Casilla de correo del negocio.
4. Presioná **"Guardar Configuración"**. Los datos se persisten de inmediato en el almacenamiento seguro local y en la nube (Supabase).

---

## 3. Paso 2: Ticketera Térmica, Impresión y Periféricos

### 3.1 Formato de Papel en NegoStock
Dentro de la misma ventana de **"Datos del Negocio"**, configurá la sección de comprobantes:
* **Ancho de Papel Ticketera:**
  * **Térmica 80 mm (Estándar POS - Recomendado):** Brinda mayor espacio horizontal para descripciones largas de productos sin cortar nombres.
  * **Térmica 58 mm (Compacta):** Para ticketeras de tamaño pequeño o impresoras portátiles bluetooth.
* **Leyenda Fiscal al pie del ticket:** Texto aclaratorio al final del comprobante (ej. `"Comprobante no válido como factura fiscal"` o `"Documento de control interno - Solicite su factura en caja"`).
* **Mensaje de Agradecimiento:** Frase de cierre (ej. `"¡Gracias por su compra! Horario: Lun a Sáb 8 a 20hs"`).

### 3.2 Calibración del Navegador (Google Chrome / Edge)
1. Presioná `Ctrl + P` (o `Cmd + P` en Mac) en cualquier comprobante emitido.
2. En **Destino**, seleccioná tu impresora térmica instalada (Epson, Hasar, Xprinter, 3nStar, etc.).
3. En **Márgenes**, elegí **"Ninguno"**.
4. Desmarcá la casilla **"Encabezados y pies de página"** para que no imprima la URL ni la fecha del explorador web.
5. En **Tamaño de Papel**, seleccioná `80 x 297 mm` o `Roll Paper 80mm`.
6. *(Opcional para modo Kiosco sin confirmación emergente):* Creá un acceso directo en el escritorio de Chrome con el parámetro `--kiosk-printing` para imprimir al instante con 1 solo clic.

### 3.3 Lector de Código de Barras y Gaveta
* **Lector USB / Inalámbrico:** Conectalo al puerto USB. Verificá que en el manual del lector tenga configurado el sufijo **ENTER** (`CR`). Al leer cualquier producto en el mostrador, se emitirá un pitido sonoro confirmatorio y se cargará al changuito en menos de 50 milisegundos.
* **Cajón Portamonedas:** Conectalo mediante cable telefónico RJ11 a la ticketera. Se abrirá automáticamente al confirmar cada cobro en efectivo.

---

## 4. Paso 3: Seguridad de Terminal y Cierre por Inactividad (Timeout)

En mostradores con alto tránsito, si el cajero se aleja de la terminal, la caja podría quedar expuesta. Para prevenirlo:

1. Abrí **Datos del Negocio**.
2. Ubicá la sección **"Seguridad de la Terminal y Sesiones"**.
3. Seleccioná el **Cierre automático por inactividad (Timeout)**:
   * **5 minutos:** Máxima seguridad en mostradores abiertos al público.
   * **10 minutos:** Seguridad estándar para negocios comerciales.
   * **15 minutos (Predeterminado recomendado):** Equilibrio óptimo entre agilidad y protección.
   * **30 minutos:** Para oficinas administrativas o comercios con baja rotación.
   * **60 minutos (1 hora)**
   * **Desactivado:** La sesión permanecerá abierta indefinidamente hasta que el usuario pulse "Salir".
4. Presioná **Guardar Configuración**. Si no se detecta movimiento de mouse o teclado en el tiempo elegido, la terminal bloqueará la pantalla y requerirá el PIN para reanudar la actividad.

---

## 5. Paso 4: Puesta a Punto del Catálogo de Productos

NegoStock te brinda total flexibilidad para arrancar desde cero con tu propio archivo de ferretería o cargar productos manualmente.

### 5.1 Opción A: Vaciar Datos de Prueba para Iniciar en Limpio
Si tu sistema viene con artículos o ventas de demostración y querés comenzar tu inventario desde cero:
1. Dirigite a **Control de Stock e Inventario** (`/inventario`).
2. En la barra superior, hacé clic en el botón rojo **"Vaciar Tablas"** (solo visible para Administrador o Superusuario).
3. Se abrirá una ventana de advertencia de seguridad.
4. Escribí exactamente la palabra de confirmación: `VACIAR`.
5. *(Opcional):* Marcá la casilla *"Vaciar también el historial de ventas y comprobantes emitidos"* si deseás dejar la caja en cero transacciones.
6. Hacé clic en **"Vaciar y Reiniciar Catálogo"**. En un instante el inventario quedará en blanco (0 productos), listo para la importación oficial.

---

### 5.2 Opción B: Carga Masiva desde Excel / CSV
Podés cargar cientos o miles de artículos en pocos segundos:
1. En **Control de Stock e Inventario**, hacé clic en el botón verde **"Importar Excel"**.
2. El asistente de importación presenta 3 pasos guiados:
   * **Paso 1: Descargar Plantilla Oficial:**
     - Podés presionar **"Bajar Plantilla (.xlsx)"** o **"Bajar Plantilla (.csv)"**.
     - La plantilla contiene columnas estándar: `Codigo_SKU`, `Codigo_Barras`, `Descripcion`, `Rubro`, `Marca`, `Unidad`, `Precio_Costo`, `Margen_Ganancia`, `Precio_Venta`, `Precio_Mayoreo`, `Stock_Actual`, `Stock_Minimo` y `Alicuota_IVA`.
   * **Paso 2: Subir Planilla:**
     - Arrastrá tu archivo `.xlsx`, `.xls` o `.csv` al casillero de carga.
     - **Acceso Directo con tu Archivo Base:** Si deseás cargar el catálogo de 171 productos de ferretería base, podés hacer clic directamente en **"Cargar mi archivo base original (171 productos)"**.
     - **Opciones de Importación:**
       - Tildá *"Actualizar datos de productos existentes si el SKU ya existe"* para actualizar precios y stocks de artículos previos.
       - Tildá *"Vaciar catálogo actual antes de importar (Reemplazo total desde cero)"* si querés un reemplazo integral y limpio.
   * **Paso 3: Vista Previa y Resumen:**
     - La ventana te mostrará un resumen claro: artículos **Nuevos** a dar de alta y artículos a **Actualizar**.
     - La tabla previa te muestra en tiempo real cómo fueron interpretadas las columnas: SKU, Descripción, Rubro, Marca, Costo, Venta, **Stock Actual** y **Stock Mínimo**.
3. Presioná el botón **"Proceder a la Carga (X Productos)"** (disponible tanto en la barra superior de la vista previa como en el pie del diálogo).
4. El sistema creará los productos, asentará los movimientos iniciales de stock en el **Kardex de trazabilidad** y refrescará el inventario al instante.

---

### 5.3 Uso del Inventario Mínimo y Alertas de Stock Crítico
El control del punto de reposición es vital para que nunca te falte mercadería en el salón:
* **Definición de Stock Mínimo (`minStock`):** Podés definirlo en el Excel de carga (columna `Inv. Minimo` o `Stock_Minimo`) o al crear/editar cada producto en el campo **"Stock Mínimo"**.
* **Alerta Visual en la Tabla:** Cuando el stock físico de un artículo sea menor o igual a su stock mínimo (`Stock <= Mínimo`), el chip de stock se pintará de **color naranja/amarillo** de advertencia y la fila tendrá un fondo rojizo. Si llega a 0, figurará en **rojo "Sin stock"**.
* **Tarjeta KPI Interactiva "STOCK CRÍTICO / MÍNIMO":**
  - En la parte superior de Inventario verás la tarjeta roja que contabiliza todos los artículos que necesitan reposición.
  - **Filtro Inmediato con 1 Clic:** Hacé clic directamente sobre la tarjeta **STOCK CRÍTICO / MÍNIMO** para filtrar la tabla y ver exclusivamente los artículos con stock bajo. Volvé a hacer clic para restaurar la vista completa.
* **Alertas en Mostrador (Caja / POS):** Cuando un cajero o vendedor selecciona un producto al límite de stock, el sistema le muestra un marco de advertencia en la pantalla de cobro para anticipar la reposición al cliente.

---

## 6. Paso 5: Configuración de Personal, Roles y PINs

Para delegar la atención al público con tranquilidad y resguardar la confidencialidad de tus números de compra:

1. Ingresá desde el menú lateral a **"Personal y Permisos"** (`/usuarios`).
2. Podrás visualizar la nómina completa de operadores del local.
3. Para dar de alta un nuevo colaborador, hacé clic en **"Nuevo Empleado"**:
   * **Nombre Completo:** (ej. *Martín Gómez*).
   * **Correo Electrónico:** (ej. *martin@ferreteria.com*).
   * **Rol Operativo:**
     * **Cajero / Facturación:** Abre y cierra caja, cobra en mostrador, emite tickets y remitos. **No tiene acceso a los costos de compra ni a los reportes de ganancias**.
     * **Vendedor de Salón / Preventa:** Arma carritos y cotizaciones en el mostrador para enviarlas a cobrar a la caja. **Costos ocultos**.
     * **Encargado de Local:** Administra stock, recibe compras de proveedores y ajusta cantidades en Kardex. Ve costos de compra pero no puede vaciar el sistema ni ver reportes ejecutivos anuales.
   * **PIN de 4 Dígitos:** Clave numérica rápida para iniciar sesión en la pantalla táctil de mostrador (ej. `2222`).
   * **Estado:** Marcar *"Usuario Activo"*.
4. Presioná **"Dar de Alta Empleado"**.
5. Los cajeros y vendedores podrán comenzar a operar de inmediato utilizando su PIN desde la pantalla de login.

---

## 7. Paso 6: Selección del Modo de Conectividad y Sincronización

En la barra de herramientas superior de NegoStock verás el selector de conectividad con tres modalidades pensadas para la realidad del comercio:

1. **⚡ Automático (Híbrido - Predeterminado y Recomendado):**
   * Trabaja contra la nube de Supabase.
   * Si la conexión a internet se corta o tiene microcortes, almacena automáticamente en la base de datos local cifrada sin interrumpir la atención al cliente.
   * Al regresar internet, sincroniza en segundo plano de manera transparente.
2. **🌐 Sólo en Línea (Nube Directa):**
   * Exclusivo para sucursales interconectadas que requieren verificar stock centralizado en tiempo real. Si no hay internet, emite un aviso para prevenir ventas desfasadas.
3. **💻 Modo Local (Offline con Sincronización por Lote):**
   * Pensado para máxima velocidad de respuesta local (< 1 ms por venta) o comercios con internet inestable.
   * Guarda todo en la terminal. Al final del turno o cuando lo desees, hacés clic en el botón superior **"Sincronizar (X)"** y presionás **"Sincronizar Todo Ahora"** para volcar las ventas y artículos a la nube en un solo lote.

---

## 8. Paso 7: Aumento Masivo de Precios por Inflación

Cuando los proveedores actualizan sus listas de precios, actualizar artículo por artículo es inviable. NegoStock resuelve esto en 3 clics:

1. Ingresá a **Aumento Masivo Precios** (`/actualizar-precios`).
2. **Pestaña "Aumento por %":**
   * **Filtro de Alcance:** Podés aplicar el aumento a un **Rubro entero** (ej. *PINTURERÍA*), a una **Marca específica** (ej. *ALBA* o *STANLEY*) o a todo el catálogo.
   * **Porcentaje:** Usá los botones rápidos (`+5%`, `+8%`, `+10%`, `+15%`, `+20%`, `+30%`) o escribí el porcentaje exacto deseado.
   * **Criterio de Cálculo:**
     - *Sobre Precio de Venta:* Sube el precio al público directamente.
     - *Sobre Precio de Costo con Margen:* Actualiza el costo de reposición y recalcula el precio al público manteniendo intacto tu margen de ganancia.
   * **Redondeo Inteligente en Efectivo:** Seleccioná si deseás redondear a múltiplos de **$10, $50 o $100** para evitar la escasez de monedas y billetes chicos en el vuelto de caja.
3. Observá la **Vista Previa de Impacto:** Verás la tabla con el precio anterior, el nuevo precio y la diferencia calculada.
4. Presioná **"Aplicar Aumento a X Artículos"**. Los precios se actualizan de inmediato en el mostrador y cada modificación queda asentada en el **Historial de Precios** indicando fecha, hora y el nombre del Administrador.

---

## 9. Paso 8: Módulos del Sistema y Licenciamiento

NegoStock está diseñado con arquitectura modular para que el comercio comience con lo esencial y pueda liberar funciones avanzadas según su crecimiento:

* **Módulos Disponibles:**
  1. *Inventario y Stock:* Control de existencias, costos, márgenes y Kardex.
  2. *Punto de Venta (POS):* Venta rápida de mostrador, tickets y preventas.
  3. *Aumento Masivo de Precios:* Ajuste por inflación y listas de proveedores.
  4. *Gestión de Clientes y Cuentas Corrientes:* Saldos, pagos a cuenta y límites de crédito.
  5. *Cotizaciones y Presupuestos:* Armado de presupuestos imprimibles en PDF con validez temporal.
  6. *Reportes Ejecutivos:* Analítica de facturación, horas pico y ranking de ventas.
  7. *Detección de Anomalías:* Auditoría de descuentos no autorizados o mermas de stock.
* **Control de Activación:** Para garantizar la estabilidad del servicio y el esquema de abonos comerciales, la habilitación de módulos adicionales es administrada por el **Desarrollador / Licenciatario del SaaS (Superusuario)** a solicitud del dueño del comercio.

---

## 10. Checklist Diario de Operaciones

| Momento | Tarea Operativa | Perfil Responsable |
| :--- | :--- | :--- |
| **Inicio del Día** | Verificar modo de sincronización (Automático o Local) y papel en ticketera. | Cajero / Encargado |
| **Durante el Turno** | Emitir ventas de mostrador y registrar entradas de compras en Kardex. | Cajeros y Vendedores |
| **Aviso de Stock** | Revisar la tarjeta interactiva **"Stock Crítico / Mínimo"** para preparar pedidos de compra. | Encargado / Administrador |
| **Cierre de Turno** | Realizar arqueo de caja física comparando el total en efectivo y medios digitales. | Cajero / Administrador |
| **Fin de Jornada** | Si se operó en Modo Local, presionar **"Sincronizar Nube"** para consolidar el día. | Administrador |
| **Mensual** | Revisar el **Reporte Ejecutivo de Ventas** y horas pico para planificar compras y personal. | Administrador / Dueño |

---
*Manual verificado para la versión 1.0 de NegoStock. Última actualización: Octubre 2026.*
