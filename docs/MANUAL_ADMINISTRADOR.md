# Manual de Usuario - Administrador (Dueño de Ferretería)
## Sistema NegoStock SaaS

Este manual está diseñado para el propietario o administrador general del comercio. El rol **`ADMIN`** cuenta con acceso irrestricto a costos de compra, márgenes de ganancia, auditoría de precios, actualización por inflación y gestión de empleados.

---

### 1. Acceso al Sistema y PIN de Seguridad
* **PIN predeterminado de Administrador:** `1234`
* **Cambio de usuario en mostrador:** En cualquier momento podés hacer clic sobre el nombre del usuario (arriba a la derecha) y seleccionar *"Ingresar con PIN"* o alternar el turno.
* **Privacidad de Costos:** Al iniciar sesión como Administrador, el sistema muestra la valuación de inventario al costo y la columna de costos de reposición. Si un empleado no autorizado usa la terminal, basta con cambiar al usuario Cajero o Vendedor para ocultar los costos inmediatamente.

---

### 2. Control de Inventario y Valuación del Negocio (`/inventario`)
En el menú **Control de Stock**:
1. **Tarjetas de Valuación Superior**:
   * **Valuación al Costo:** Monto exacto de dinero inmovilizado en mercadería según el último costo de compra.
   * **Valuación a la Venta:** Ingreso proyectado al vender todo el stock al precio minorista actual.
   * **Stock Crítico / Mínimo:** Alerta en rojo con la cantidad de artículos por debajo del stock de seguridad.
2. **Filtros Rápidos**:
   * Interruptor **"Sólo Stock Bajo"**: Filtra instantáneamente los productos que necesitan reposición con el proveedor.
   * Filtro por **Rubro** (Electricidad, Bulonería, Herramientas, etc.).
3. **Ajuste Manual de Stock**:
   * Hacé clic en el lápiz al final de cualquier fila para registrar conteos físicos, roturas o mermas con su respectiva justificación.

---

### 3. Aumento Masivo de Precios por Inflación (`/actualizar-precios`)
Diseñado para aplicar aumentos de listas de proveedores en segundos:
1. Andá a **Aumento Masivo Precios** $\rightarrow$ Pestaña **"Aumento por %"**.
2. **Seleccioná el Rubro** (ej. `BULONERIA`) o la **Marca** (ej. `TACSA` o `MOTA`).
3. **Ingresá el porcentaje:** Podés usar los botones rápidos (`+5%`, `+8%`, `+10%`, `+15%`, `+20%`) o ingresar un valor manual.
4. **Redondeo Inteligente en Efectivo:** Seleccioná si deseás redondear a múltiplos de **$10, $50 o $100** para agilizar los vueltos en caja.
5. **Criterio del aumento:**
   * *Sobre Precio de Venta:* Modifica directamente los precios de mostrador y mayoreo.
   * *Sobre Costo con margen:* Actualiza el costo de reposición y recalcula la venta respetando tu porcentaje de ganancia.
6. Revisá la **Vista Previa en Vivo** y presioná **"Aplicar Cambios"**.

---

### 4. Trabajo con Planillas Excel (.xlsx / .csv)
Si preferís trabajar los precios en tu casa con Microsoft Excel:
1. Entrá a **Aumento Masivo Precios** $\rightarrow$ Pestaña **"Importar / Exportar Excel"**.
2. **Descargar Planilla:** Hacé clic en **"Descargar Excel (.xlsx)"**. Se descargará un archivo con tus 171 artículos ordenados con sus columnas de costo, venta y mayoreo.
3. **Modificar en Excel:** Abrí el archivo en tu computadora y modificá los valores que desees. *(Importante: no cambies la columna de Código SKU)*.
4. **Cargar Planilla:** Arrastrá el archivo modificado al recuadro de carga.
5. **Comparador Automático:** El sistema te mostrará una tabla previa indicando exactamente qué artículos cambiaron, el precio anterior y el precio nuevo.
6. Presioná **"Aplicar Cambios al Sistema"**.

---

### 5. Historial y Auditoría de Precios
En la pestaña **"Historial y Auditoría"**:
* Podés consultar la evolución histórica de cualquier artículo buscando por código SKU o nombre.
* Cada cambio registra: fecha, hora, costo viejo $\rightarrow$ nuevo, venta vieja $\rightarrow$ nueva, origen (Excel, Aumento % o Manual) y qué usuario realizó la modificación.

---

### 6. Gestión de Personal y Empleados (`/usuarios`)
1. Andá al menú **Personal y Permisos**.
2. Hacé clic en **"Nuevo Empleado"**.
3. Completá:
   * **Nombre y Apellido**
   * **Rol:**
     * `ADMIN`: Dueño (Acceso total).
     * `MANAGER`: Encargado (Stock, compras, ve costos).
     * `CASHIER`: Cajera (Cobra preventas, emite tickets. **No ve costos**).
     * `SELLER`: Vendedor (Arma preventas con F6. **No cobra ni ve costos**).
   * **PIN de Mostrador:** Código de 4 dígitos que usará el empleado en la terminal.
