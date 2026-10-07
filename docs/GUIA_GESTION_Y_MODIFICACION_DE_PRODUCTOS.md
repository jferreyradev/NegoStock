# Guía Operativa: Métodos para Agregar y Modificar Productos en NegoStock

Esta guía describe en detalle todos los mecanismos disponibles en el sistema **NegoStock** para dar de alta, importar, editar, ajustar stock, pausar y actualizar precios de forma masiva o individual.

---

## 1. Principios Fundamentales del Sistema

1. **Doble Persistencia Segura (Offline-First):**
   * Toda alta o modificación se guarda inmediatamente en el almacenamiento local cifrado del navegador (**IndexedDB AES-256**) a latencia cero (< 1 ms).
   * Al mismo tiempo, se sincroniza con las tablas relacionales de la nube en **Supabase PostgreSQL** (`public.productos`, `categorias`, `marcas`, `unidades_medida`, `stock_movimientos`, `precios_historial`).

2. **Cero Borrado Físico (Soft Delete):**
   * En NegoStock **nunca se eliminan filas de artículos** que ya hayan tenido actividad. Esto garantiza que las ventas, presupuestos, notas de crédito y balances contables históricos no queden huérfanos.
   * La mercadería se **pausa (No disponible)** o se desactiva automáticamente si su stock llega a 0.

3. **Trazabilidad y Auditoría Continua:**
   * Cualquier cambio de precio queda registrado en la tabla `precios_historial` con el costo viejo, costo nuevo, venta vieja, venta nueva, fecha, motivo y el usuario responsable.
   * Cualquier variación de stock genera un registro en el Kardex `stock_movimientos` con su tipo (`INICIAL`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `VENTA`, `COMPRA`, `ROTURA`).

---

## 2. Métodos para AGREGAR Productos

```
                               ┌─────────────────────────────────────────────────────────┐
                               │           FORMAS DE AGREGAR PRODUCTOS                   │
                               └───────────────────────────┬─────────────────────────────┘
                                                           │
              ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
              ▼                                            ▼                                            ▼
   [1. Alta Manual Individual]                  [2. Importación Masiva Excel/CSV]            [3. Restauración Backup]
   • Ficha completa                             • Planilla oficial estandarizada             • Archivo JSON / SQL
   • Cálculo dinámico de márgenes               • Detección automática de columnas           • Exclusivo SaaS Master
   • Generador EAN-13                           • Upsert por lotes de 50 registros           • Respaldo completo
```

---

### Método 1: Alta Manual Individual (Ficha de Producto)

Ideal para ingresar artículos nuevos en el día a día o cuando entra mercadería no catalogada.

* **Ubicación:** Pantalla de **Inventario** (`/inventario`) ➔ Botón verde **«Nuevo Artículo»** (o atajo de teclado).
* **Permisos requeridos:** `SUPERADMIN`, `ADMIN` o `MANAGER` (`canEditPrices`).

#### Paso a Paso:
1. Haga clic en **«Nuevo Artículo»**. Se abrirá el formulario modal.
2. Complete los campos comerciales:
   * **Código SKU:** Ingrese el código interno de ferretería (ej: `BUL-0042`) o déjelo en blanco para que el sistema le asigne uno único autogenerado.
   * **Código de Barras (EAN-13):** Escanee con lector óptico o presione el icono de recarga para generar un código EAN-13 válido con dígito verificador.
   * **Nombre / Descripción Comercial:** Nombre representativo y claro (ej: *Tornillo Autoperforante T1 8x1/2 Caja x 100*).
   * **Rubro / Departamento:** Seleccione una categoría existente del menú desplegable o escriba un nombre nuevo para crearla en el momento.
   * **Marca:** Seleccione o tipee la marca del fabricante.
   * **Unidad de Medida:** Seleccione unidad (`u`), metro (`m`), kilogramo (`kg`), rollo, juego, caja, etc.
3. Defina los valores económicos:
   * **Precio de Costo:** Costo de compra o reposición del proveedor.
   * **Margen (%):** Margen de rentabilidad deseado (ej: `100%`). El sistema calculará el **Precio de Venta** automáticamente.
   * *O bien*, ingrese el **Precio de Venta** final y el sistema deducirá el margen resultante en tiempo real.
   * **Precio Mayorista / Gremio:** Precio diferencial para compras por volumen o clientes de cuenta corriente.
   * **Alícuota IVA:** 21%, 10.5% o 0%.
4. Configure el inventario:
   * **Stock Inicial:** Cantidad física existente en góndola o depósito.
   * **Stock Mínimo:** Nivel de alerta para reposición.
   * **Disponibilidad:** Deje activo para que el artículo aparezca inmediatamente en el Punto de Venta.
5. Presione **«Guardar Artículo»**. El sistema guardará el producto en la base de datos, creará el movimiento `INICIAL` en el Kardex y registrará el precio base.

---

### Método 2: Importación Masiva desde Planilla Excel o CSV (.xlsx / .csv)

Ideal para puesta en marcha inicial, traspaso de sistemas antiguos o actualización general por lista de proveedor.

* **Ubicación:** Pantalla de **Inventario** (`/inventario`) ➔ Botón celeste **«Importar Excel»**.
* **Permisos requeridos:** `SUPERADMIN`, `ADMIN` o `MANAGER`.
* **Módulo:** Requiere tener activo el módulo `importacionExcel`.

#### Paso a Paso:
1. Haga clic en **«Importar Excel»**.
2. **Descargar Plantilla Oficial (Opcional pero recomendado):**
   * Presione **«Descargar Plantilla (.xlsx)»** o **«Descargar CSV»**.
   * La plantilla contiene las columnas oficiales con ejemplos prácticos de ferretería.
3. **Seleccionar el Archivo:**
   * Arrastre o seleccione su archivo Excel (`.xlsx`, `.xls`) o `.csv`.
   * El importador incluye un **analizador inteligente y tolerante**: reconoce sinónimos habituales como:
     * *Código*: `codigo_sku`, `codigo`, `sku`, `cod`, `código`.
     * *Descripción*: `descripcion`, `nombre`, `producto`, `articulo`, `detalle`.
     * *Costo*: `precio_costo`, `costo`, `p_costo`, `compra`.
     * *Venta*: `precio_venta`, `venta`, `p_venta`, `precio`.
     * *Stock*: `stock`, `cantidad`, `inventario`, `saldo`.
     * *Stock Mínimo*: `stock_minimo`, `minimo`, `inv. minimo`, `min`.
     * *Rubro*: `rubro`, `categoria`, `departamento`, `familia`.
     * *Marca*: `marca`, `fabricante`, `proveedor`.
4. **Previsualización y Auditoría Previa:**
   * El sistema analizará las filas antes de escribir en la base de datos y mostrará un resumen:
     * Filas totales y válidas detectadas.
     * Cuántos artículos son **Nuevos** (se crearán en el sistema).
     * Cuántos artículos son **Existentes** (ya existen por código SKU).
5. **Opciones de Procesamiento:**
   * ☑ **Actualizar artículos existentes que coincidan por SKU:** Si está marcado, refrescará costos, ventas y stock de los artículos existentes.
   * ☐ **Reemplazar catálogo completo:** Vacía el catálogo previo antes de importar (usar con precaución solo en arranques iniciales).
6. Presione **«Proceder a la Carga»**:
   * El sistema creará en Supabase las categorías, marcas y unidades que falten.
   * Enviará lotes de 50 registros utilizando `upsert` sobre la clave única `(comercio_id, codigo_sku)`.
   * Mapeará los identificadores UUID definitivos en el navegador.

---

### Método 3: Restauración desde Copia de Seguridad JSON / SQL

Exclusivo para contingencias o migraciones completas de servidor.

* **Ubicación:** Pantalla de **Inventario** (`/inventario`) ➔ Botón **«Copia de Seguridad»**.
* **Permisos requeridos:** Exclusivo `SUPERADMIN` (SaaS Master).
* **Módulo:** Requiere módulo `copiaSeguridad`.
* Permite cargar un archivo de volcado `.json` íntegro con catálogo, clientes, ventas y configuraciones de una fecha anterior.

---

## 3. Métodos para MODIFICAR Productos

```
                               ┌─────────────────────────────────────────────────────────┐
                               │          FORMAS DE MODIFICAR PRODUCTOS                  │
                               └───────────────────────────┬─────────────────────────────┘
                                                           │
         ┌───────────────────┬─────────────────────────────┼─────────────────────────────┬───────────────────┐
         ▼                   ▼                             ▼                             ▼                   ▼
 [1. Edición Ficha]  [2. Ajuste Stock]           [3. Pausado / Activar]        [4. Aumento Masivo]  [5. Auditoría]
 • Precios y datos   • Kardex directo            • Sin borrado físico          • % Inflación        • Corrección rápida
 • Historial precio  • Motivo físico             • Auto-pausa sin stock        • Por Rubro o Marca  • 1 clic sugerido
```

---

### Método 1: Edición Manual de la Ficha Individual

Permite modificar cualquiera de los parámetros comerciales o técnicos de un producto.

* **Ubicación:** Pantalla de **Inventario** (`/inventario`) ➔ Buscar el producto ➔ Columna **Acciones** ➔ Botón lápiz **«Editar»**.
* **Permisos requeridos:** `SUPERADMIN`, `ADMIN` o `MANAGER`.

#### Funcionalidades al Editar:
* **Modificación de Precios:** Puede cambiar Costo, Margen % o Precio Venta.
* **Trazabilidad:** Dispone de un campo para ingresar el **Motivo del cambio de precio** (ej: *"Lista de precios proveedor Mayo"*). Este texto queda grabado en `precios_historial` y es visible en el historial del artículo.
* **Modificación de Clasificación:** Puede reasignar rubro, marca o unidad de medida.
* **Modificación de Stock:** Si se edita el valor de stock, el sistema registra un ajuste en el Kardex automáticamente.
* **Persistencia Inmediata:** Al presionar **«Guardar Cambios»**, se actualiza reactivamente la tabla, se persiste en IndexedDB y se envía a Supabase en segundo plano.

---

### Método 2: Ajuste Rápido de Stock Físico (Sin tocar precios)

Diseñado para recuentos de inventario físico, mermas o ingreso rápido de bultos sin abrir el formulario completo.

* **Ubicación:** Pantalla de **Inventario** (`/inventario`) ➔ Columna **Acciones** ➔ Botón caja **«Ajustar Stock»**.
* **Permisos requeridos:** `SUPERADMIN`, `ADMIN` o `MANAGER` (`canAdjustStock`).

#### Paso a Paso:
1. Haga clic en el botón de caja del producto.
2. Ingrese el **Nuevo Stock Real** contado en depósito o estantería.
3. Indique el **Motivo del Movimiento**:
   * *Conteo físico de inventario / Recuento periódico.*
   * *Mercadería rota o dañada (Merma).*
   * *Devolución de cliente.*
   * *Reingreso de proveedor.*
4. Presione **«Guardar Ajuste»**:
   * El sistema calcula la diferencia (positiva o negativa).
   * Genera el movimiento `AJUSTE_POSITIVO` o `AJUSTE_NEGATIVO` en el Kardex.
   * Si el stock resultante es `0`, el producto se desmarca de disponibilidad en el mostrador para evitar sobreventas accidentales.

---

### Método 3: Pausado / Reactivación de Disponibilidad (Soft Delete)

Permite ocultar un artículo del mostrador de ventas sin perder su historia ni romper estadísticas.

* **Ubicación:** Pantalla de **Inventario** (`/inventario`) ➔ Columna **Disponibilidad** ➔ Interruptor o botón de ojo.
* **Comportamiento:**
  * **Artículo Disponible (Verde):** Aparece en el buscador del Punto de Venta (POS) y en el Armador de Presupuestos.
  * **Artículo No Disponible (Gris):** Queda oculto del mostrador para los cajeros y vendedores, pero sigue visible en el Inventario para que el Administrador o Encargado puedan gestionarlo o ver su historial contable.
  * **Auto-Pausa por Desabastecimiento:** Si se vende la última unidad de un producto, el sistema lo pasa a *No Disponible* en forma automática. Al registrar un nuevo ingreso de mercadería (> 0), vuelve a estar disponible para la venta de inmediato.

---

### Método 4: Actualizador Masivo de Precios por Inflación o Lista General

Permite actualizar cientos de artículos de forma simultánea aplicando porcentajes de aumento o ajuste.

* **Ubicación:** Menú Lateral ➔ **«Actualización Masiva»** (`/actualizacion-precios`).
* **Permisos requeridos:** `SUPERADMIN` o `ADMIN` (`canMassUpdatePrices`).
* **Módulo:** Requiere módulo `actualizacionMasiva`.

#### Paso a Paso:
1. **Filtro de Alcance:**
   * Seleccione el **Rubro / Departamento** a afectar (ej: *TODOS*, o solo *BULONERIA*).
   * Seleccione la **Marca** específica o *TODAS*.
2. **Porcentaje de Aumento:**
   * Ingrese el porcentaje (ej: `15` para +15% o `-5` para una promoción de descuento).
3. **Criterio de Aplicación:**
   * **Costo y Precio de Venta (Recomendado):** Aumenta ambos valores en la misma proporción, manteniendo intacto el margen porcentual de ganancia.
   * **Solo Precio de Venta:** Incrementa únicamente el valor al público (aumenta el margen de rentabilidad).
   * **Solo Precio de Costo:** Refleja la suba del proveedor sin trasladarla al cliente (reduce el margen).
4. **Regla de Redondeo Comercial:**
   * Sin redondeo (decimales exactos).
   * Redondeo a \$10 (ej: \$1.234 ➔ \$1.240).
   * Redondeo a \$50 (ej: \$1.234 ➔ \$1.250).
   * Redondeo a \$100 (ej: \$1.234 ➔ \$1.300).
5. **Simulador Previo:**
   * La pantalla muestra una tabla comparativa en tiempo real con los precios actuales versus los precios resultantes antes de confirmar.
6. Presione **«Aplicar Aumento Masivo»**:
   * El sistema actualiza los artículos, registra el cambio en el historial de precios con el motivo `AUMENTO_MASIVO_X%` y ejecuta el procedimiento remoto en Supabase.

---

### Método 5: Corrección Directa desde la Planilla de Auditoría

Diseñado específicamente para subsanar errores de carga, márgenes negativos o fallas tipográficas detectadas por el sistema.

* **Ubicación:** Menú Lateral ➔ **«Auditoría de Planilla»** (`/auditoria`).
* **Permisos requeridos:** `SUPERADMIN`, `ADMIN` o `MANAGER`.
* **Módulo:** Requiere módulo `auditoriaCostos`.

#### Modos de Corrección Disponibles:
1. **Corrección Rápida de 1 Clic («⚡ Aplicar \$...»):**
   * El sistema calcula automáticamente un precio de venta equilibrado (+50% o +100% sobre el costo real).
   * Haciendo clic en el botón verde **«Aplicar \$X»**, el artículo se corrige inmediatamente en IndexedDB y Supabase.
2. **Modal de Edición Directa en Auditoría:**
   * Presionando el botón azul **«Editar»**, se abre un formulario sin salir de la planilla de auditoría.
   * Permite ajustar costo, margen, venta, stock y registrar el motivo de la corrección.
3. **Enlace Directo con Inventario («🔗 Ver en Inventario»):**
   * Presionando el icono de enlace externo, el sistema redirige automáticamente a la pantalla de `/inventario`, prefiltra por el código SKU y abre la ficha completa de edición.

---

### Método 6: Actualización Masiva vía Re-importación de Planilla

Si un proveedor entrega una planilla actualizada en formato Excel o CSV con nuevos costos o precios:
1. Diríjase a **Inventario** ➔ **«Importar Excel»**.
2. Cargue la nueva planilla.
3. Asegúrese de mantener tildada la opción:
   > ☑ **Actualizar artículos existentes que coincidan por SKU**
4. Presione **«Proceder a la Carga»**.
5. Todos los artículos cuyos códigos SKU coincidan con los de la base de datos se actualizarán con los nuevos valores de costos y precios, mientras que los artículos con códigos no existentes se crearán como nuevos productos.

---

## 4. Matriz de Permisos por Rol (RBAC)

| Operación / Acción | Superusuario | Administrador | Encargado | Cajero | Vendedor |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Alta manual de producto** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Importación masiva Excel/CSV** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edición de ficha (Precios/Costos)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Ajuste rápido de Stock (Kardex)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Pausar / Activar disponibilidad** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Aumento masivo por inflación** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Corregir en Planilla de Auditoría** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Vaciar catálogo completo** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Restaurar backup JSON/SQL** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Descontar stock por venta** | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 5. Preguntas Frecuentes y Buenas Prácticas

### ¿Qué ocurre si se corta la conexión a internet al modificar o dar de alta un producto?
El sistema trabaja en modo **Offline-First**. El producto o modificación se guarda inmediatamente en la base de datos local del navegador (IndexedDB) con cifrado AES-256. El negocio puede seguir operando con normalidad. En cuanto el navegador detecte que se restableció internet, o cuando presione el botón **«Subir a Supabase»**, los cambios se enviarán automáticamente a la nube.

### ¿Cómo forzar la sincronización completa del inventario con la nube?
En la pantalla de **Inventario**, en la barra superior junto al botón de *Importar Excel*, haga clic en **«☁️ Subir a Supabase»**. El sistema verificará que existan las categorías, marcas y unidades en la nube y subirá todo el catálogo relacional en lotes protegidos de 50 registros.

### ¿Por qué no existe un botón de "Eliminar Producto"?
Por diseño contable y seguridad tributaria. Eliminar un producto físicamente corrompería las ventas pasadas, reportes de recaudación, balances históricos y kardex de inventario. En su lugar, utilice el botón de **Desactivar / Pausar**, el cual retira el artículo del mostrador inmediatamente pero conserva los registros de auditoría intactos.
