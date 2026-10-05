# Manual de Usuario - Administrador (Dueño del Comercio)
## Sistema NegoStock SaaS

Este manual está diseñado para el propietario o administrador general del comercio (ferretería, corralón, pinturería). El rol **`ADMIN`** cuenta con acceso irrestricto a costos de reposición, márgenes de ganancia, reportes ejecutivos de facturación, actualización masiva de precios, gestión de empleados y auditoría de inventario.

---

### 1. Acceso al Sistema, Cuentas y Seguridad de Sesión
* **Cuentas Principales con Acceso Total:**
  * 👑 **Superusuario (SaaS Master):** Cuenta maestra diseñada para la etapa de escalabilidad, soporte, activación de módulos y resguardo integral del sistema.
    * Email: `superadmin@negostock.com` | Clave: `superadmin123` | PIN: `9999`
  * 👤 **Administrador (Dueño del Comercio):** Cuenta operativa del propietario para administrar inventario, precios, reportes de ventas y personal.
    * Email: `admin@ferreteria.com` (o `demo@negostock.com` en entorno de prueba) | Clave: `admin123` (`demo123`) | PIN: `1234` (`0000`)
* **Pantalla de Acceso (`/login`):**
  * **Pestaña Dueño / Superusuario:** Permite iniciar sesión con correo electrónico y contraseña.
  * **Pestaña PIN Mostrador:** Teclado táctil para ingreso ágil con PIN de 4 dígitos.
* **Bloqueo Estricto de Sesión (Prohibido Cambio al Vuelo):**
  Una vez que un usuario ingresa, **la sesión queda anclada a su cuenta**. No se permite cambiar de usuario sin cerrar sesión previa. Para cambiar de operador, se debe presionar el botón rojo **"Salir"** en la barra superior o en el menú lateral.
* **Privacidad de Costos (RBAC):** Al estar activo como Superusuario, Administrador o Encargado, el sistema muestra la valuación de inventario al costo y las columnas de reposición. Para cajeros o vendedores, estas columnas quedan automáticamente ocultas.
* **Protección del Código del Superusuario:** El código/PIN del Superusuario (`9999`) está resguardado y blindado contra visualización o edición por parte de otros operadores o administradores locales.

---

### 2. Modos de Operación y Sincronización (Barra Superior)
En la parte superior podés alternar entre tres modalidades de trabajo según tu necesidad operativa:

1. **⚡ Automático (Híbrido - Recomendado):**
   * Guarda directamente en Supabase en la nube.
   * Si se corta internet o hay microcortes, almacena de forma transparente en la base de datos segura local (cifrada con AES-256).
   * Apenas regresa la conexión, auto-sincroniza en segundo plano sin intervención del usuario.
2. **🌐 Sólo en Línea (Nube Directa):**
   * Opera exclusivamente contra la nube de Supabase.
   * Garantiza que todas las sucursales vean exactamente el mismo stock en tiempo real. Si no hay conexión a internet, bloquea la operación y emite una alerta para no desfasar stock.
3. **💻 Modo Local (Offline con Sincronización Manual):**
   * **Velocidad máxima:** Todas las ventas, altas de productos y cambios de precios se guardan 100% en la computadora local (< 1 ms).
   * No transmite datos por la red durante el turno de mostrador.
   * **Sincronización por Lote:** En la barra superior verás el botón `Sincronizar (X)` con el número de pendientes. Al final del turno o cuando lo desees, abrís el modal y presionás **"Sincronizar Todo Ahora"** para subir en lote todas las ventas y productos a Supabase.

---

### 3. Control de Inventario y Alta / Modificación de Artículos (`/inventario`)

#### Métricas de Cabecera:
* **Valuación al Costo:** Monto exacto de dinero inmovilizado en mercadería al costo de reposición.
* **Valuación a la Venta:** Ingreso bruto proyectado al vender todo el stock al precio minorista actual.
* **Stock Crítico / Mínimo:** Alerta en rojo con la cantidad de artículos que alcanzaron el stock de seguridad.

#### Alta de Nuevo Artículo (Botón "Nuevo Artículo"):
1. Hacé clic en el botón verde **"Nuevo Artículo"** en la cabecera.
2. **Códigos:** Podés ingresar tu propio SKU o dejarlo vacío para autogenerar. Hacé clic en el botón de refrescar para generar un código de barras EAN-13 si el artículo no lo trae de fábrica.
3. **Nombre y Rubro:** Escribí la descripción comercial. En *Rubro* y *Marca* podés seleccionar una existente o escribir una nueva en el momento (el sistema la crea automáticamente en la base de datos).
4. **Calculadora Interactiva de Precios:**
   * Ingresá el **Precio de Costo** y el **Margen %** $\rightarrow$ se calcula instantáneamente el **Precio de Venta**.
   * O ingresá directamente el **Precio de Venta deseado** $\rightarrow$ se calcula el margen resultante.
5. **Disponibilidad:** Marcá el switch *"Artículo Disponible para venta"* (por defecto activo).
6. Presioná **"Dar de Alta Artículo"**.

#### Modificación de Artículos (Icono Lápiz):
* Permite corregir precios, códigos, alícuota de IVA (21%, 10.5%, 0%), stock mínimo o descripción técnica.
* Cada cambio de precio queda asentado automáticamente en la tabla de auditoría.

#### Política de "No Borrado" y Disponibilidad (Pausado / Activo):
* **No existe borrado destructivo:** Para no romper el historial de ventas pasadas ni el libro contable, los artículos no se eliminan.
* **Hacer No Disponible (Pausar):** Hacé clic en el icono del ojo en la fila del producto. El artículo pasará a estado *No disponible* (gris) y quedará bloqueado e invisible en el mostrador para evitar ventas accidentales.
* **Filtro de visualización:** En la cabecera podés filtrar por *"Todos los estados"*, *"Sólo Disponibles"* o *"No Disponibles"*.

#### Consulta de Historia, Auditoría y Trazabilidad (Icono Reloj):
Al presionar el botón azul **"Historia"** en cualquier producto, se abre la ventana con:
* **Pestaña Historial de Precios:** Muestra todas las variaciones de costo y venta en el tiempo, con el porcentaje de aumento/baja ($\pm X\%$), motivo y **Nombre y Rol del Operador/Autor** que ejecutó el cambio.
* **Pestaña Kardex de Stock:** Tabla cronológica inmutable con cada entrada, salida, venta de mostrador, rotura, compra o ajuste manual, detallando la cantidad, el saldo físico resultante y el **usuario responsable** de la acción.

---

### 4. Reporte Ejecutivo y Resumen de Ventas (`/reportes-ventas`)

NegoStock incorpora un **Tablero de Control de Analítica de Negocio**, accesible exclusivamente para el Dueño/Administrador y el Superusuario desde el menú lateral:

#### 4.1. Indicadores Clave en Tiempo Real (KPIs de Cabecera):
* **Facturación Neta:** Total recaudado en el período seleccionado libre de anulaciones.
* **Ventas Realizadas:** Cantidad de transacciones cobradas con ticket o remito.
* **Ticket Promedio:** Importe medio por compra en mostrador.
* **Margen Bruto Estimado:** Ganancia comercial neta sobre el costo de reposición (`$ Facturado - $ Costo de Mercadería Vendida`).

#### 4.2. Pestañas de Análisis Especializado:
1. **📅 Resumen por Día:**
   * Detalle día a día con facturación, cantidad de tickets, ticket promedio y % de peso sobre el total.
   * Detección automática del **Mejor Día de Ventas** del período.
2. **⏰ Resumen por Horas (Horas Pico de Tráfico):**
   * Gráfico y tabla horaria de 00:00 a 23:00 hs.
   * Identifica la **Hora Pico de Facturación ($)** y la **Hora Pico de Clientes (Tickets)** para coordinar refuerzos de personal en caja y mostrador.
3. **📊 Resumen por Mes:**
   * Comparativa intermensual de facturación, tickets emitidos, variación porcentual ($\pm \%$) y promedio de venta diaria.
4. **💳 Medios de Pago y Vendedores:**
   * Participación por canal de cobro: Efectivo, Débito, Transferencia bancaria, Tarjeta de Crédito, Mercado Pago/QR y Cuenta Corriente.
   * Ranking de ventas por operador con tickets atendidos y porcentaje de facturación generado por cada empleado.

#### 4.3. Exportación y Auditoría:
* **Exportar a Excel (.xlsx):** Descarga un libro de cálculo multilingüe con hojas independientes para Ventas Diarias, Horas Pico, Comparativa Mensual y Canales de Pago.
* **Cargar Ventas Demo:** Botón de demostración para poblar 45 días de ventas simuladas realistas con un solo clic en entornos de capacitación o prueba.

---

### 5. Aumento Masivo de Precios por Inflación (`/actualizar-precios`)
Diseñado para aplicar aumentos de listas de proveedores en segundos:
1. Andá a **Aumento Masivo Precios** $\rightarrow$ Pestaña **"Aumento por %"**.
2. **Seleccioná el Rubro** (ej. `BULONERIA`) o la **Marca** (ej. `TACSA` o `MOTA`).
3. **Ingresá el porcentaje:** Botones rápidos (`+5%`, `+8%`, `+10%`, `+15%`, `+20%`) o manual.
4. **Redondeo Inteligente en Efectivo:** Seleccioná si deseás redondear a múltiplos de **$10, $50 o $100** para agilizar los vueltos en caja.
5. **Criterio del aumento:**
   * *Sobre Precio de Venta:* Modifica directamente los precios de mostrador y mayoreo.
   * *Sobre Costo con margen:* Actualiza el costo de reposición y recalcula la venta respetando tu porcentaje de ganancia.
6. Revisá la **Vista Previa en Vivo** y presioná **"Aplicar Cambios"**.

---

### 6. Trabajo con Planillas Excel (.xlsx / .csv)
Si preferís actualizar listas completas de proveedores desde Excel:
1. Entrá a **Aumento Masivo Precios** $\rightarrow$ Pestaña **"Importar / Exportar Excel"**.
2. **Descargar Planilla:** Hacé clic en **"Descargar Excel (.xlsx)"**.
3. **Modificar en Excel:** Abrí el archivo y actualizá los precios que desees *(no modificar la columna SKU)*.
4. **Cargar Planilla:** Arrastrá el archivo modificado al recuadro de carga.
5. **Comparador Automático:** Verás una tabla previa indicando exactamente qué artículos cambiaron, el precio anterior y el precio nuevo.
6. Presioná **"Aplicar Cambios al Sistema"**.

---

### 7. Respaldo y Restauración de Base de Datos (Exclusivo Superusuario)
Para garantizar la máxima seguridad y resguardo contable:
* **Políticas de Privilegio:** La descarga y restauración de bases de datos completas está reservada **estrictamente al Superusuario (`PIN 9999`)**. Ningún empleado ni usuario regular puede generar ni restaurar backups.
* **Descarga de Copia de Seguridad:** Desde la vista de Inventario o mediante scripts CLI (`scripts/export_full_database.cjs`), se genera un volcado íntegro en formato JSON y SQL con todas las tablas del sistema: comercios, categorías, productos, stock, clientes, ventas y auditoría.
* **Punto de Restauración:** Permite restablecer un punto de inicio conocido en caso de contingencia o formateo de servidores locales (`scripts/restore_database.cjs`).

---

### 8. Diseño Compacto y Adaptabilidad en Pantallas Chicas
Todas las tablas del sistema han sido optimizadas para adaptarse a monitores estándar de mostrador (1366x768 o laptops):
* **Filas Compactas:** Altura reducida a 36px y tipografía monoespaciada para máxima densidad de información.
* **Columnas de Acciones Adhesivas (Sticky):** Los botones de acción (`Ver`, `PDF`, `Anular`, `Kardex`, `Editar`) permanecen fijados permanentemente al borde derecho de la pantalla con relieve visual, impidiendo que se oculten o desborden al achicar la ventana del navegador.
* **Panel de Mostrador Elástico:** El changuito del mostrador cuenta con alto elástico adaptativo para garantizar que el botón principal de cobro (**`COBRAR [F2]`**) permanezca siempre 100% visible en pantalla sin necesidad de hacer scroll vertical.
