# Manual de Puesta en Marcha y Despliegue a Producción
## NegoStock SaaS - Guía de Operaciones

Esta guía detalla los pasos exactos para configurar el entorno de base de datos en Supabase, iniciar el sistema en local y desplegarlo en la nube para acceso público de tus clientes.

---

### 1. Requisitos Previos

* **Node.js**: Versión 18 o superior (v20+ recomendada).
* **Navegador Web**: Chrome, Edge, Safari o Firefox.
* **Cuenta en Supabase**: Gratuita o de pago en [supabase.com](https://supabase.com).

---

### 2. Puesta en Marcha en Local (Desarrollo y Pruebas)

1. **Clonar o abrir el proyecto:**
   ```bash
   cd /Users/jferreyradev/projects/ag/NegoStock
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor web:**
   ```bash
   npm run dev
   ```
   *La app estará disponible de inmediato en `http://localhost:5173/`.*

---

### 3. Puesta en Marcha de la Base de Datos en Supabase

#### Paso 3.1: Crear el Proyecto en la Nube
1. Ingresá a [supabase.com](https://supabase.com) y hacé clic en **"New Project"**.
2. Asigná un nombre (ej. `NegoStock-Produccion`), una contraseña segura para la base de datos y seleccioná la región más cercana (ej. `Sao Paulo / South America`).
3. Aguardá aproximadamente 60 segundos hasta que la base de datos esté lista.

#### Paso 3.2: Ejecutar los Scripts SQL
1. En el menú lateral de tu proyecto en Supabase, ingresá al **SQL Editor** (ícono `>_`).
2. Creá una nueva consulta (`+ New Query`).
3. Abrí el archivo [supabase/schema.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/schema.sql), copiá todo su contenido, pegalo en el editor de Supabase y hacé clic en **Run** (botón verde).
   *Esto creará todas las tablas con `tenant_id INT`, secuencias correlativas, funciones transaccionales, triggers y políticas RLS.*
4. Creá otra pestaña en el SQL Editor, abrí el archivo [supabase/seed.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/seed.sql), pegalo y hacé clic en **Run**.
   *Esto insertará la Ferretería Central (`tenant_id = 1`) y sus 171 productos iniciales.*

#### Paso 3.3: Obtener las Credenciales y Configurar el Frontend
1. En Supabase, andá al engranaje abajo a la izquierda: **Project Settings** $\rightarrow$ **API**.
2. Copiá:
   * **Project URL** (ej. `https://xyzcompany.supabase.co`)
   * **Project API Keys (`anon` / `public`)**
3. Creá un archivo `.env` en la raíz de tu proyecto local con esos valores:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```
4. Al recargar la app en tu navegador, la etiqueta superior pasará automáticamente a:  
   🟩 **"Supabase Nube"**.

---

### 4. Despliegue del Frontend a Producción (SaaS en Internet)

Para que el dueño de la ferretería y sus empleados puedan acceder desde cualquier PC, tablet o celular del local sin depender de que tu computadora personal esté encendida:

#### Opción Recomendada: Despliegue en Vercel (Gratuito)
1. Subí tu repositorio a GitHub (ej. `github.com/tu-usuario/negostock`).
2. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con GitHub.
3. Hacé clic en **"Add New..."** $\rightarrow$ **Project** y seleccioná el repositorio `negostock`.
4. En la sección **Environment Variables**, agregá las dos variables:
   * `VITE_SUPABASE_URL` = Tu URL de Supabase
   * `VITE_SUPABASE_ANON_KEY` = Tu clave anon de Supabase
5. Clic en **Deploy**.
6. En menos de 1 minuto tendrás tu enlace público de producción:  
   👉 `https://negostock.vercel.app` (o podés vincularle tu propio dominio personalizado como `app.negostock.com`).

---

### 5. Guía de Reseteo y Mantenimiento

En la carpeta `supabase/` disponés de 2 scripts específicos para mantenimiento:

| Situación | Archivo a Ejecutar | Qué hace |
| :--- | :--- | :--- |
| **Limpiar datos de prueba** | [supabase/truncate_tables.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/truncate_tables.sql) | Vacía todas las ventas y productos de prueba en cascada, pero **mantiene la estructura, tablas y funciones intactas**. Ideal para volver a cargar `seed.sql`. |
| **Empezar de cero total** | [supabase/drop_all.sql](file:///Users/jferreyradev/projects/ag/NegoStock/supabase/drop_all.sql) | **Destruye todo el esquema público** y lo recrea virgen como si recién crearas la base de Supabase. |
| **Limpiar navegador local** | Ejecutar en la consola: `localStorage.clear()` | Elimina las ventas y pedidos de preventa guardados en la memoria del navegador. |
