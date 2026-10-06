# NegoStock — Sistema SaaS de Gestión de Stock, Ventas y Ferretería

Sistema modular y multi-inquilino (*multi-tenant*) desarrollado para control integral de inventario (Kardex inmutable), ventas en mostrador (POS), emisión de comprobantes internos y comerciales (Presupuestos, Tickets X, Remitos de Entrega), analítica gerencial de ventas y administración de comercios de ferretería, pinturerías y corralones.

---

## 🚀 Módulos y Capacidades Principales

* **🛒 Mostrador Ágil (POS) con Circuito Presupuesto $\rightarrow$ Venta:**
  - Inicia por defecto en modo **`PRESUPUESTO`** para prevenir cobros accidentales o deducciones de stock no confirmadas.
  - Conversión directa en 1 clic o con atajo de teclado **`[F2]`** a venta en firme (`Ticket X`), abriendo el modal de cobro y medios de pago.
  - Modal de confirmación previa con calculadora de vuelto en efectivo y billetes sugeridos.
  - Al completar la venta, descuenta stock atómicamente, asienta el Kardex, cierra el presupuesto cargado y resetea el carrito a modo presupuesto.
* **📑 Generador de Comprobantes PDF Vectoriales de Alta Precisión:**
  - Renderizado milimétrico en A4 portrait con `jsPDF`.
  - Cero superposición de textos: Bounding box de 75 mm para descripciones largas con ajuste dinámico de altura de fila (`rowH`).
  - Recuadro de Totales apilados (stacked) con separación vertical limpia entre rótulo e importe.
  - Soporte multi-página automático con encabezados continuos y pie institucional numerado (*"Página X de Y"*).
* **📊 Centro de Resumen de Ventas y Analítica Ejecutiva (`/reportes-ventas`):**
  - **Por Día:** Gráfico evolutivo de recaudación diaria, tickets emitidos, ticket promedio y mejor día de ventas.
  - **Por Horas (Horas Pico):** Análisis de 24 horas (`00:00` a `23:59`) con detección automática de la *Hora Pico de Facturación ($)* y *Hora Pico de Clientes (Tickets)*.
  - **Por Mes:** Facturación consolidada, variación porcentual intermensual (+% / -%) y promedio diario.
  - **Medios de Pago y Vendedores:** Participación porcentual por forma de cobro y ranking por operador.
  - Exportación estructurada multi-hoja a Excel (`.xlsx`) y modo de impresión limpio para gerencia.
* **📱 Interfaz Compacta y Responsiva con Columnas Flotantes (Sticky):**
  - Tablas densas de alta productividad (`v-table--density-compact`) optimizadas para notebooks de mostrador (1024px / 1366px).
  - Columna de **Acciones** flotante fijada a la derecha con sombra y fondo opaco, permitiendo accionar cualquier registro sin perderse al scrollear horizontalmente.
* **📥 Importación Masiva, Plantilla Oficial y Vaciado Seguro de Tablas:**
  - Descarga de plantilla oficial estructurada (`.xlsx` / `.csv`) con columnas oficiales y hoja de instrucciones.
  - Lector inteligente y tolerante a puntuación, mayúsculas y acentos (`Inv. Minimo`, `Precio Costo`, etc.).
  - Botón de **Vaciar Tablas** con confirmación de seguridad para arrancar desde cero sin datos de prueba.
  - Carga inmediata en 1 clic del catálogo base original de ferretería (171 artículos reales).
* **🧩 Arquitectura Modular SaaS (Feature Flags Exclusivo Desarrollador):**
  - Control de licenciamiento protegido para el **Superusuario / Desarrollador (PIN `9999`)**.
  - Presets en 1 clic (*Modo Esencial*, *Modo Comercial*, *Modo Gestión Total*) o interruptores individuales para 12 módulos desacoplados.
* **🔒 Seguridad de Privilegios (RBAC), Timeout y Modo Offline Cifrado:**
  - Roles jerárquicos: `SUPERADMIN`, `ADMIN`, `ENCARGADO`, `CAJERO`, `VENDEDOR`.
  - Cierre automático de sesión por inactividad de la terminal y bloqueo de 30s ante 5 intentos fallidos de PIN.
  - Almacén local encriptado mediante IndexedDB y **AES-GCM 256 bits** con PBKDF2 (100.000 iteraciones).
  - Funcionamiento offline ininterrumpido con sincronización transparente bidireccional.

---

## 🧪 Credenciales para Testing y Demostración

| Perfil / Rol | Correo Electrónico | Contraseña | PIN Mostrador | Alcance de Prueba |
| :--- | :--- | :--- | :---: | :--- |
| **🧪 Usuario Demo (Tester / Dueño)** | `demo@negostock.com` | `demo123` | **`0000`** *(o `1234`)* | **Acceso total de gestión:** POS, Inventario, Costos, Aumento masivo de precios, Stock, Clientes, Historial y Usuarios. |
| **🛒 Cajera Turno Mañana** | `ana@ferreteria.com` | — | **`3333`** | **Operación de caja:** Cobro de ventas, calculadora de vuelto, tickets internos y remitos. |
| **📋 Vendedor Mostrador** | `carlos@ferreteria.com` | — | **`4444`** | **Atención al público:** Cotizaciones y presupuestos rápidos (sin cobro ni descuento de stock). |
| **🛡️ Encargado de Local** | `encargado@ferreteria.com`| — | **`2222`** | **Supervisión:** Modificación de precios unitarios y ajustes de stock. |
| **👑 Superusuario (SaaS Master)** | `superadmin@negostock.com` | `superadmin123` | **`9999`** | **Dueño de la plataforma:** Habilitación de módulos del SaaS, Backup y Restauración de base de datos. |

> **Tip de Acceso Rápido:** En la pantalla de login (`/login`), hacé clic directamente en `[Probar como Dueño (Demo)]` o `[Probar como Cajera]` para ingresar en 1 solo clic.

---

## 📚 Documentación Técnica y Manuales de Usuario

* **[Manual del Empleado (Cajeros y Vendedores)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_EMPLEADO.md):**  
  Guía operativa diaria de mostrador, atajos de teclado (`F2`, `F4`, `F6`, `F7`, `F8`), cobro con vuelto, emisión de presupuestos, remitos, timeout de terminal y consulta de Kardex.
* **[Manual del Administrador (Dueño y Encargados)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_ADMINISTRADOR.md):**  
  Gestión integral de precios, vaciado de tablas, aumento masivo porcentual, control de márgenes, auditoría de Kardex, Resumen de Ventas y administración de personal.
* **[Manual de Pruebas y Validación (QA / Tester)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_TESTER.md):**  
  Matriz de 16 casos de prueba paso a paso con resultados esperados y checklist de 18 puntos para aprobación de puesta en producción (*Go-Live*).  
  📄 **Versión en PDF lista para descarga:** [`docs/MANUAL_TESTER.pdf`](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_TESTER.pdf) y accesible desde la web en `/MANUAL_TESTER.pdf`.
* **[Manual Técnico del Desarrollador](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_DESARROLLADOR.md):**  
  Arquitectura del stack Vue 3 + Pinia + Supabase, arquitectura modular SaaS (Feature Flags), importador Excel, cifrado AES-GCM 256 en IndexedDB, motor de PDFs vectoriales y seguridad de terminal.
* **[Diccionario de Base de Datos](file:///Users/jferreyradev/projects/ag/NegoStock/docs/DICCIONARIO_BASE_DE_DATOS.md):**  
  Estructura relacional completa en español, claves foráneas, índices y funciones almacenadas PL/pgSQL.
* **[Manual de Puesta en Marcha y Despliegue](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_PUESTA_EN_MARCHA.md):**  
  Configuración en Supabase, verificación de escritura RLS, carga de catálogo base y despliegue a producción.

---

## 🛠️ Comandos de Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build

# 4. Regenerar Manual del Tester en PDF
node scripts/generate_manual_tester_pdf.cjs
```

### Configuración con Supabase (Opcional):
Copia `.env.example` a `.env` y coloca las credenciales de tu proyecto:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```
Ejecuta el script `supabase/schema.sql` y luego `supabase/seed.sql` en el SQL Editor de tu panel de Supabase.
