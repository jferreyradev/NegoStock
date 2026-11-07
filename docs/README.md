# 📚 Centro de Documentación y Manuales Oficiales — NegoStock

Índice central de manuales operativos, técnicos, informes de auditoría y diagramas de flujo del sistema NegoStock.

---

## 📑 Informes Técnicos y Diagramas Operativos Recientes

* **[Informe Técnico de Incidencia y Auditoría de Datos](file:///Users/jferreyradev/projects/ag/NegoStock/docs/INFORME_TECNICO_INCIDENCIA_PERSISTENCIA.md):**  
  Auditoría forense sobre el servidor de Producción (`aphqdlmgggglvahbhksu.supabase.co`), verificación de integridad de las 48 ventas reales, diagnóstico de la causa raíz de la persistencia de presupuestos y solución definitiva implementada.
* **[Diagramas de Flujo y Manual de Operación](file:///Users/jferreyradev/projects/ag/NegoStock/docs/DIAGRAMA_FLUJO_USO_NEGOTOCK.md):**  
  Diagramas interactivos Mermaid del ciclo de vida comercial (Mostrador $\rightarrow$ Presupuesto $\rightarrow$ Preventa $\rightarrow$ Cobro en Caja $\rightarrow$ Supabase), diagrama de secuencia multi-terminal y tabla de atajos de teclado (`F1` a `F8`).

---

## 👤 Manuales por Perfil de Usuario

* **[Manual del Empleado (Cajeros y Vendedores de Mostrador)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_EMPLEADO.md):**  
  Guía diaria para la atención al público: búsqueda de artículos, cálculo de vuelto en efectivo, emisión de presupuestos, cobro de preventas y emisión de remitos.
* **[Manual del Administrador (Dueño y Supervisores)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_ADMINISTRADOR.md):**  
  Control general del comercio: modificación y aumento porcentual masivo de precios, auditoría del Kardex inmutable, control de cajas, análisis del Centro de Ventas y administración de empleados.
* **[Matriz de Perfiles y Permisos (RBAC)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MATRIZ_DE_PERFILES_Y_PERMISOS.md):**  
  Detalle exhaustivo de roles (`SUPERADMIN`, `ADMIN`, `MANAGER`, `CASHIER`, `SELLER`), matriz de acceso por vista y políticas de seguridad.

---

## ⚙️ Guías de Configuración y Gestión de Negocio

* **[Guía de Configuración del Negocio](file:///Users/jferreyradev/projects/ag/NegoStock/docs/GUIA_CONFIGURACION_NEGOCIO.md):**  
  Configuración de datos fiscales, razón social, CUIT, dirección, logotipo para tickets y personalización de comprobantes.
* **[Guía de Gestión y Modificación de Productos](file:///Users/jferreyradev/projects/ag/NegoStock/docs/GUIA_GESTION_Y_MODIFICACION_DE_PRODUCTOS.md):**  
  Alta, baja y modificación de artículos, asignación de categorías, marcas, unidades de medida, costos y márgenes de ganancia.
* **[Manual de Configuración del Sistema](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_CONFIGURACION_SISTEMA.md):**  
  Parámetros generales de terminal, tiempo de bloqueo por inactividad y configuración de hardware (impresoras térmicas).

---

## 💻 Manuales Técnicos y de Desarrollo

* **[Manual del Desarrollador](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_DESARROLLADOR.md):**  
  Arquitectura del stack Vue 3 + Pinia + Supabase + Vuetify, diseño multi-inquilino, sistema de cola offline con cifrado AES-GCM 256 bits y generador vectorial de PDFs con `jsPDF`.
* **[Diccionario de Base de Datos](file:///Users/jferreyradev/projects/ag/NegoStock/docs/DICCIONARIO_BASE_DE_DATOS.md):**  
  Esquema relacional detallado de las 18 tablas de PostgreSQL, claves foráneas, restricciones check, índices y funciones almacenadas PL/pgSQL.
* **[Manual de Puesta en Marcha y Despliegue](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_PUESTA_EN_MARCHA.md):**  
  Guía paso a paso para configurar proyectos en Supabase, ejecutar migraciones SQL, habilitar RLS y desplegar en Vercel/Netlify.

---

## 🧪 Control de Calidad y Pruebas (QA)

* **[Manual del Tester (Markdown)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_TESTER.md):**  
  Matriz de 16 casos de prueba paso a paso con resultados esperados y checklist de 18 puntos para homologación y pase a producción.
* **[Manual del Tester (Versión PDF)](file:///Users/jferreyradev/projects/ag/NegoStock/docs/MANUAL_TESTER.pdf):**  
  Documento PDF exportable listo para impresión y entrega formal a evaluadores o clientes.
