# Manual de Puesta en Marcha y Despliegue a Producción
## NegoStock SaaS - Guía de Operaciones y Práctica Real

Esta guía detalla los pasos exactos para configurar el entorno de base de datos en **Supabase**, verificar permisos de escritura RLS, iniciar el sistema y operar en mostrador real con cualquiera de sus 3 modos de funcionamiento (**En Línea**, **Local Desconectado** o **Automático**).

---

### 1. Requisitos Previos

* **Node.js**: Versión 18 o superior (v20+ recomendada).
* **Navegador Web**: Chrome, Edge, Safari o Firefox.
* **Cuenta en Supabase**: Proyecto activo en [supabase.com](https://supabase.com).

---

### 2. Puesta en Marcha de la Base de Datos en Supabase

#### Paso 2.1: Crear el Proyecto en la Nube
1. Ingresá a [supabase.com](https://supabase.com) y hacé clic en **"New Project"**.
2. Asigná un nombre (ej. `NegoStock-Produccion`), una contraseña segura para la base de datos y seleccioná la región más cercana (ej. `Sao Paulo / South America`).
3. Aguardá aproximadamente 60 segundos hasta que la base de datos esté lista.

#### Paso 2.2: Ejecutar los Scripts SQL Esenciales (En este orden exacto)
En el menú lateral de tu proyecto en Supabase, ingresá al **SQL Editor** (ícono `>_`):

1. **Esquema Relacional Inicial:**  
   Copiá todo el contenido de [supabase/schema.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/schema.sql), pegalo en una pestaña nueva y presioná **Run**.  
   *Crea las 12 tablas principales, tipos de datos, secuencias correlativas, funciones transaccionales y triggers.*

2. **Carga del Catálogo Base:**  
   Copiá todo el contenido de [supabase/seed.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/seed.sql) y ejecutalo con **Run**.  
   *Carga los 171 artículos reales de ferretería con rubros, marcas y costos de reposición.*

3. **Desbloqueo de Escritura RLS (¡Fundamental para Producción!):**  
   Copiá y ejecutá el script [supabase/desbloquear_escritura_supabase.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/desbloquear_escritura_supabase.sql).  
   *Este script garantiza que los cajeros y administradores puedan dar de alta artículos, editar precios, registrar auditoría de Kardex (`stock_movimientos`), registrar historial de precios (`precios_historial`) y actualizar datos de comercio sin ser bloqueados por el motor de seguridad RLS.*

#### Paso 2.3: Configurar las Credenciales en el Entorno
1. En Supabase, andá al engranaje abajo a la izquierda: **Project Settings** $\rightarrow$ **API**.
2. Copiá:
   * **Project URL** (ej. `https://aphqdlmgggglvahbhksu.supabase.co`)
   * **Project API Keys (`anon` / `public`)**
3. Creá un archivo `.env` en la raíz de tu proyecto local con esos valores:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

---

### 3. Verificación de Conexión y Escritura en Tiempo Real

Para verificar que la base de datos está 100% operativa y lista para recibir modificaciones del mostrador, ejecutá el script de verificación automatizada:

```bash
node scripts/test_crud.cjs
```

El script ejecuta 4 pruebas en tiempo real contra tu nube:
1. `INSERT` de un producto de prueba en la tabla `productos`.
2. `UPDATE` del precio de venta y de costo.
3. Asiento de auditoría en la tabla `precios_historial`.
4. Asiento de movimiento Kardex en la tabla `stock_movimientos`.

Al finalizar debe mostrar: `✅ TODOS LOS TESTS DE ESCRITURA EN SUPABASE PASARON CON ÉXITO`.

---

### 4. Modos de Operación para la Práctica Real

NegoStock cuenta con un selector en la barra superior que permite alternar entre 3 modos según las condiciones del local comercial:

```
[ Selector en Barra Superior ]
├── 1. Automático (Híbrido)   --> Guarda en nube; si se corta la red, encola en IndexedDB (AES-GCM 256 bits).
├── 2. Sólo en Línea          --> Exige conexión con Supabase; rechaza ventas si no hay respuesta de la nube.
└── 3. Modo Local             --> Trabaja 100% desconectado en el navegador; acumula ventas y cambios en cola local.
```

#### Botón de Sincronización Manual:
Cuando se opera en **Modo Local** o cuando vuelve la señal tras un corte:
1. El botón **"Sincronizar (X)"** en la barra superior muestra el total de operaciones pendientes (ventas y cambios de productos).
2. Al hacer clic, se abre una ventana con el resumen detallado.
3. Al presionar **"Sincronizar Todo Ahora"**, el sistema procesa por lotes los comprobantes en Supabase, genera sus correlativos oficiales y descuenta el stock definitivo.

---

### 5. Configuración de Identidad Comercial y Recibos

Para que los tickets impresos lleven el nombre real del negocio, CUIT y datos de contacto:
1. Iniciar sesión como **ADMIN** (PIN `1234`).
2. En el menú lateral, seleccionar **"Datos del Negocio"**.
3. Completar la razón social, CUIT, teléfono, dirección y el ancho de impresora (80 mm o 58 mm).
4. Presionar **"Guardar Configuración"**.
5. Consultar la guía completa de relevamiento en [docs/GUIA_CONFIGURACION_NEGOCIO.md](file:///Users/jferreyradev/projects/ag/NegoStock/docs/GUIA_CONFIGURACION_NEGOCIO.md).

---

### 6. Despliegue del Frontend a Producción (SaaS en Internet)

Para que el personal pueda ingresar desde cualquier computadora o tablet del local:

#### Despliegue en Vercel (Recomendado):
1. Subí tu repositorio a GitHub.
2. Ingresá a [vercel.com](https://vercel.com) y vinculá el proyecto.
3. En la sección **Environment Variables**, agregá:
   * `VITE_SUPABASE_URL` = URL de tu proyecto
   * `VITE_SUPABASE_ANON_KEY` = Clave pública anon
4. Clic en **Deploy**. Tendrás disponible de inmediato tu URL pública segura `https://tu-comercio.vercel.app` con certificado SSL automático.

---

### 7. Comandos de Mantenimiento y Reseteo

| Situación | Archivo a Ejecutar | Qué hace |
| :--- | :--- | :--- |
| **Limpiar datos de prueba** | [supabase/truncate_tables.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/truncate_tables.sql) | Vacía todas las ventas y productos de prueba en cascada, pero **mantiene la estructura, tablas y funciones intactas**. |
| **Empezar de cero total** | [supabase/drop_all.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/drop_all.sql) | Destruye todo el esquema público y lo recrea virgen como si recién crearas la base. |
| **Re-verificar Escritura** | `node scripts/test_crud.cjs` | Ejecuta el test de ciclo completo de altas, modificaciones e historial. |
| **Limpiar datos locales** | `localStorage.clear()` + borrar base `negostock_secure_db` en DevTools (F12) $\rightarrow$ Application. | Elimina la memoria local segura del navegador. |
