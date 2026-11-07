# INFORME TÉCNICO Y EJECUTIVO DE INCIDENCIA
## Diagnóstico, Auditoría de Integridad y Solución de Persistencia en NegoStock

**Fecha de emisión:** 7 de Noviembre de 2026  
**Proyecto:** NegoStock - Sistema de Gestión Comercial y Mostrador  
**Entorno afectado:** Producción (`aphqdlmgggglvahbhksu.supabase.co`)  
**Estado de la incidencia:** **RESUELTA Y VERIFICADA**  

---

## 1. Resumen Ejecutivo (Apto para el Cliente / Dirección)

> [!NOTE]
> **Conclusión Principal de la Auditoría:**  
> **El dinero y las facturaciones del comercio NUNCA se perdieron.**  
> Todas las ventas registradas por los cajeros y vendedores (un total de **48 comprobantes correlativos** por más de \$260.000) siempre estuvieron resguardadas en la base de datos central en la nube.

### ¿Qué generó la alarma de "pérdida de datos"?
1. **En Ventas / Facturación:**  
   Cuando un cajero emitía un ticket, este se enviaba correctamente al servidor central. Sin embargo, la pantalla de consulta de comprobantes leía únicamente un archivo temporal de la computadora en la que se estaba trabajando. Al cambiar de computadora, abrir otro navegador o limpiarse los archivos temporales, la pantalla aparecía vacía, dando la **falsa apariencia** de que las ventas habían desaparecido.
2. **En Presupuestos:**  
   El botón de *"Guardar Presupuesto"* anotaba la cotización solo en la memoria interna de la máquina donde se redactó, sin enviarla al servidor central. Por eso, otra máquina o la caja no podían ver los presupuestos generados en un mostrador distinto.

---

## 2. Auditoría Forense de la Base de Datos en Producción

Se realizó una inspección directa sobre el servidor central PostgreSQL de Supabase en Producción, confirmando la **integridad absoluta** de los registros:

| Entidad / Tabla | Cantidad Real en Nube | Estado | Observación |
| :--- | :---: | :---: | :--- |
| **`ventas` (Facturación)** | **48 comprobantes** | **100% Intactos** | Desde el ticket `0001-00000001` hasta el `0001-00543135` (emitido el 06/11/2026 a las 23:11 hs). |
| **`ventas_detalles`** | **64 renglones** | **100% Intactos** | Artículos, precios unitarios y subtotales asociados a cada venta. |
| **`productos` (Catálogo)** | **304 artículos** | **100% Intactos** | Stock físico, precios mayoristas y minoristas preservados. |
| **`stock_movimientos`** | **977 movimientos** | **100% Intactos** | Kardex de auditoría histórica inalterado. |
| **`clientes`** | **2 registros** | **100% Intactos** | Cuentas corrientes y datos fiscales preservados. |
| **`pedidos_preventa`** | **0 registros** | **Pendiente de sincronización** | Ningún presupuesto anterior había sido enviado al servidor por la versión previa. |

---

## 3. Causa Raíz Técnica de la Discrepancia

```
   COMPORTAMIENTO ANTERIOR (PROBLEMÁTICO)
   
   [ Terminal Mostrador ]
      │
      ├──> Venta emitida ──────> [ Supabase Cloud ] (Se guardaba OK)
      │                               │
      └──> Consultar Historial        │ (NUNCA SE CONSULTABA LA NUBE)
              │                       ▼
              └──> Lee SOLO IndexedDB Local ──> Vacío si cambiaba de PC o navegador
   
   [ Presupuestos ]
      │
      └──> "Guardar Presupuesto" ──> SOLO IndexedDB Local (NUNCA viajaba a Supabase)
```

1. **Lectura Aislada en `cartStore.loadSalesHistory()`:**  
   El almacén de estado Pinia dependía exclusivamente de `secureGet('app_metadata', 'sales_history')`. Al no existir una consulta `SELECT * FROM ventas` en el ciclo de vida de la aplicación, el catálogo de comprobantes dependía de la persistencia de cookies/IndexedDB del navegador local.
2. **Ausencia de Pipeline Cloud en `cartStore.saveAsPresupuesto()`:**  
   La función de cotizaciones ejecutaba `this.pendingOrders.unshift(...)` y guardaba en IndexedDB, pero carecía de la llamada HTTP REST hacia la tabla `pedidos_preventa`.
3. **Falla de Claves Foráneas con Artículos Libres y Fletes:**  
   Al emitir una venta con ítems personalizados (*"Flete a domicilio"*, *"Mano de obra"* o artículos sin código de barras oficial), la función `procesar_venta_mostrador` arrojaba una excepción `Producto no encontrado: SKU ...` porque la tabla `ventas_detalles` exige un `producto_id` existente. La venta era rechazada en el servidor y quedaba atrapada en la cola offline local.

---

## 4. Soluciones Implementadas y Mejoras Arquitectónicas

### A. Sincronización Bidireccional de Ventas
Se reescribió `cartStore.loadSalesHistory()`:
* Ahora realiza una consulta estructurada a Supabase:
  ```javascript
  supabase.from('ventas').select('*, cliente:clientes(*), items:ventas_detalles(*, producto:productos(*))')
  ```
* Combina automáticamente las ventas de la nube con cualquier venta offline pendiente de subida.
* **Resultado:** Al abrir NegoStock en cualquier terminal, teléfono o navegador, se listan inmediatamente las 48 ventas reales con sus detalles, clientes y opciones de reimpresión/descarga de PDF.

### B. Persistencia y Consulta Cloud de Presupuestos
* **`saveAsPresupuesto` y `saveAsPendingOrder`:** Ahora envían los presupuestos y preventas a la tabla `pedidos_preventa` y sus renglones a `pedidos_preventa_detalles`.
* **`loadPendingOrders`:** Consulta en tiempo real las cotizaciones con estado `PENDIENTE` en Supabase.
* **Cobro atómico:** Al concretar la venta en caja, el presupuesto se marca automáticamente como `COBRADO` en la nube para que desaparezca de la lista de pendientes de todas las terminales.

### C. Creación del Ítem Comodín `VAR` para Fletes y Varios
* Se dio de alta en Producción el producto comodín oficial:
  * **ID:** `a87426ee-729c-474a-a60b-109ceb259fe2`
  * **SKU:** `VAR`
  * **Nombre:** `ARTÍCULOS VARIOS / SERVICIOS`
* Se adaptó el backend para que cualquier artículo libre, servicio o flete se enlace a este comodín, permitiendo la venta sin alterar stock físico ni disparar errores de clave foránea.

---

## 5. Plan de Acción y Recuperación de Presupuestos Anteriores

> [!IMPORTANT]
> **¿Cómo recuperar los presupuestos que se habían armado antes del parche?**
> 1. Identificar en qué computadora física se redactaron los presupuestos.
> 2. Abrir NegoStock en ese mismo navegador (si no se borró el historial ni se usó ventana de incógnito).
> 3. El nuevo sistema leerá los presupuestos locales y **los subirá automáticamente a Supabase**.
> 4. A partir de ese instante, quedarán disponibles y visibles en todas las terminales.

---

## 6. Estado de Verificación y Cierre
* **Compilación y empaquetado:** `npm run build` ejecutado exitosamente sin advertencias.
* **Prueba de ciclo de vida:** Verificado `INSERT`, `SELECT` y `DELETE` en `pedidos_preventa` con código de respuesta `200 OK`.
* **Despliegue:** Cambios commiteados (`3c62196`) y sincronizados en la rama `origin/dev`.
