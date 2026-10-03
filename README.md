# NegoStock - Sistema de Gestión de Stock, Ventas y Ferretería (SaaS)

Sistema modular y multi-inquilino (*multi-tenant*) desarrollado para control de inventario (Kardex), ventas en mostrador (POS), emisión de comprobantes genéricos (Tickets, Presupuestos, Remitos) y compras para comercios del rubro ferretería y afines.

---

## 🚀 Arquitectura Tecnológica

* **Frontend**: Vue 3 + Vite + Vuetify 3 (Material Design) + Pinia (Gestor de Estado) + Vue Router.
* **Base de Datos**: PostgreSQL / Supabase en la nube con soporte nativo de multi-inquilino (`tenant_id`) y Row Level Security (RLS).
* **Modo Offline / Local Demo**: Incluye fallback automático a `localStorage` para pruebas y desarrollo sin necesidad de configurar Supabase inmediatamente.
* **País & Negocio**: Adaptado para Argentina (IVA 21%, 10.5%, CUIT/DNI, Cuentas Corrientes, comprobantes internos y venta por fracciones/metros).

---

## 🗄️ Esquema de Base de Datos (`supabase/schema.sql`)

El diseño relacional está estandarizado **100% en Español** con discriminador multi-inquilino simple (`comercio_id = 1, 2, 3...`):

1. **`comercios`**: Inquilinos del SaaS (Razón social, CUIT, teléfono, dirección).
2. **`categorias`** y **`marcas`**: Rubros (Herramientas, Electricidad, Bulonería, etc.) y marcas comerciales.
3. **`unidades_medida`**: Soporte de unidades (unidad, metro, kilo, litro, rollo, bolsa) con bandera de decimales.
4. **`productos`**:
   - Código interno (`codigo_sku`), código de barras (`codigo_barras`), descripción.
   - Precio de Costo, Precio de Venta (Minorista) y **Precio Mayoreo (Gremio/Obra)**.
   - Stock actual y alertas de stock mínimo.
5. **`stock_movimientos` (Kardex)**:
   - Registro inmutable de cada movimiento: VENTA, COMPRA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO, ROTURA.
   - Trigger automático en PostgreSQL que actualiza el stock consolidado.
6. **`clientes`** y **`proveedores`**: Cuentas corrientes, límites de crédito, condición tributaria.
7. **`ventas`** y **`ventas_detalles`**: Ventas en mostrador, cálculo de rentabilidad neta congelando el costo al momento de venta, numeración correlativa (`0001-XXXXXXXX`).
8. **`precios_historial`**: Auditoría de cada variación de costo y venta.
9. **`pedidos_preventa`**: Flujo de preventa Mostrador $\rightarrow$ Caja.

📘 *Consultar el documento completo: [`docs/DICCIONARIO_BASE_DE_DATOS.md`](file:///Users/jferreyradev/projects/ag/NegoStock/docs/DICCIONARIO_BASE_DE_DATOS.md).*

---

## 🔍 Análisis de la Planilla Inicial de Productos

Al procesar los 171 artículos provistos se detectaron **8 rubros limpios** y **12 marcas**:
* **Rubros**: HERRAMIENTAS, SEGURIDAD, BULONERIA, ELECTRICIDAD, PINTURERIA, ALBAÑIL, MANGUERAS, GENERAL.
* **Marcas**: MOTA, RAPTOR, SICA, TACSA, GORYL, SAYLENS, CANOR, AWE, PIM, UCU, GKA, GKS.

### ⚠️ 5 Inconsistencias Críticas Detectadas en la Planilla:
1. **SKU 2028 - LLAVE AJUSTABLE LLC12**: Costo `$38.040,00` vs Venta `$68,04` *(Error tipográfico: se omitieron ceros al cargar el precio de venta; sugerido: `$76.080,00`)*.
2. **SKU 6000 - MANGUERA CRISTAL 3/4 X METRO**: Costo `$36.700,00` vs Venta `$3.000,00` *(Disparidad de unidad: costo por rollo de 25m/50m vs venta por metro fraccionado)*.
3. **SKU 12000 - BARBIJO KN95**: Costo `$1.735,00` vs Venta `$1.000,00` *(Margen negativo: costo supera la venta en un 42%)*.
4. **SKU 20 - DISCO DE CORTE 115X6 RAPTOR**: Costo `$8.700,00` vs Venta `$3.400,00` *(Margen negativo: costo supera la venta en un 60%)*.
5. **SKU 21 - DISCO DIAMANTADO TURBO 115MM RAPTOR**: Costo `$18.900,00` vs Venta `$9.400,00` *(Costo cargado duplicado o paquete vs individual)*.

---

## 🛠️ Comandos de Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Regenerar seed SQL desde la planilla TSV
node scripts/seed_from_tsv.js
```

### Configuración con Supabase (Opcional):
Copia `.env.example` a `.env` y coloca las credenciales de tu proyecto:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```
Ejecuta el script `supabase/schema.sql` y luego `supabase/seed.sql` en el SQL Editor de tu panel de Supabase.
