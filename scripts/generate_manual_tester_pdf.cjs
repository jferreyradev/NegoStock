const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

function generateTesterPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = 182;
  let currentY = 16;

  const primary = [24, 76, 120];     // Azul corporativo #184C78
  const amber = [217, 119, 6];       // Ámbar #D97706
  const teal = [15, 118, 110];       // Verde azulado #0F766E
  const dark = [30, 41, 59];         // Pizarra oscuro #1E293B
  const muted = [100, 116, 139];     // Gris medio #64748B
  const lightBg = [248, 250, 252];   // Gris claro #F8FAFC
  const borderCol = [226, 232, 240]; // Borde #E2E8F0

  function checkPageBreak(neededHeight = 20) {
    if (currentY + neededHeight > 275) {
      doc.addPage();
      currentY = 18;
      drawPageHeaderLine();
    }
  }

  function drawPageHeaderLine() {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 4, 'F');
  }

  // --- 1. PORTADA / ENCABEZADO PRINCIPAL ---
  drawPageHeaderLine();

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderCol);
  doc.roundedRect(marginX, currentY, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primary);
  doc.text('NEGOTOCK — MANUAL DE PRUEBAS Y VALIDACIÓN (QA)', marginX + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...dark);
  doc.text('Guía paso a paso para evaluadores, testers de aseguramiento de calidad y clientes de prueba.', marginX + 6, currentY + 16);
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text('Sistema SaaS para Ferreterías, Pinturerías y Corralones • Documentación Técnica Oficial', marginX + 6, currentY + 22);
  doc.text('Fecha de emisión: Octubre 2026 • Versión 1.0 (Ready to Publish)', marginX + 6, currentY + 27);

  currentY += 38;

  // --- 2. SECCIÓN: CREDENCIALES OFICIALES ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text('1. Credenciales y Cuentas de Acceso para Pruebas', marginX, currentY);
  currentY += 6;

  // Tabla de Credenciales
  const creds = [
    { role: 'Usuario Demo (Tester/Admin)', email: 'demo@negostock.com', pass: 'demo123', pin: '0000 / 1234', desc: 'Acceso total: POS, Inventario, Costos, Precios, Kardex, Usuarios' },
    { role: 'Cajera Mostrador', email: 'ana@ferreteria.com', pass: '—', pin: '3333', desc: 'Ventas efectivas, cobros, calculadora de vuelto, tickets y remitos' },
    { role: 'Vendedor Mostrador', email: 'carlos@ferreteria.com', pass: '—', pin: '4444', desc: 'Emisión de presupuestos y cotizaciones (sin descontar stock)' },
    { role: 'Encargado de Local', email: 'encargado@ferreteria.com', pass: '—', pin: '2222', desc: 'Ajuste de stock manual y edición de precios de venta unitarios' },
    { role: 'Superusuario (SaaS Master)', email: 'superadmin@negostock.com', pass: 'superadmin123', pin: '9999', desc: 'Habilitación de módulos del SaaS, Backup y Restauración' }
  ];

  // Encabezado de tabla
  doc.setFillColor(...primary);
  doc.rect(marginX, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('PERFIL / ROL', marginX + 3, currentY + 4.8);
  doc.text('CORREO / CONTRASEÑA', marginX + 50, currentY + 4.8);
  doc.text('PIN MOSTRADOR', marginX + 105, currentY + 4.8);
  doc.text('ALCANCE DE PRUEBA', marginX + 135, currentY + 4.8);
  currentY += 7;

  creds.forEach((c, idx) => {
    checkPageBreak(12);
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, contentWidth, 9.5, 'F');
    }
    doc.setDrawColor(...borderCol);
    doc.line(marginX, currentY + 9.5, marginX + contentWidth, currentY + 9.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...dark);
    doc.text(c.role, marginX + 3, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    const emailText = c.pass !== '—' ? `${c.email} (${c.pass})` : c.email;
    doc.text(emailText, marginX + 50, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...amber);
    doc.text(c.pin, marginX + 105, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    doc.text(doc.splitTextToSize(c.desc, 44), marginX + 135, currentY + 3.5);

    currentY += 9.5;
  });

  currentY += 4;

  // Botones de 1 clic callout
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('TIP PARA TESTING EN 1 CLIC:', marginX + 4, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('En la pantalla de Login (/login) podés pulsar directamente "[Probar como Dueño (Demo)]" o "[Probar como Cajera]" sin tipear.', marginX + 4, currentY + 8.5);

  currentY += 18;

  // --- 3. SECCIÓN: MATRIZ DE CASOS DE PRUEBA ---
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text('2. Casos de Prueba Críticos y Reglas de Negocio', marginX, currentY);
  currentY += 7;

  const testCases = [
    {
      id: 'CASO 01',
      title: 'Venta Efectiva (Ticket X) con Modal de Cobro y Cálculo de Vuelto',
      obj: 'Verificar que el sistema NO descuenta stock antes de confirmar y valida el pago en efectivo.',
      steps: [
        '1. Ingresar como Usuario Demo (PIN 0000) o Cajera (PIN 3333).',
        '2. En Mostrador (/), agregar cualquier artículo con stock (ej. SKU 2030) al carrito.',
        '3. Presionar el botón COBRAR [F2] o la tecla F2.',
        '4. Verificar que se abre el Modal de Confirmación con cabecera azul y total a cobrar. El stock aún no fue tocado.',
        '5. Probar Cancelar [ESC]: El modal se cierra y el carrito queda intacto.',
        '6. Volver a presionar COBRAR [F2], elegir Efectivo y seleccionar un billete sugerido (ej. $50.000).',
        '7. Verificar que calcula automáticamente el Vuelto a entregar en verde.',
        '8. Hacer clic en Confirmar Cobro e Imprimir [Enter].'
      ],
      result: 'El stock se descuenta, se abre el ticket final con desglose de pago y vuelto, y el carrito se vacía para el próximo cliente.'
    },
    {
      id: 'CASO 02',
      title: 'Emisión y Despacho de Remito de Entrega de Mercadería',
      obj: 'Comprobar la generación de remitos para envíos a obra/domicilio con datos de chofer y transporte.',
      steps: [
        '1. En el selector superior del carrito, cambiar el tipo de comprobante a "Remito de Entrega".',
        '2. Seleccionar un cliente (ej. Constructora del Valle) y agregar 2 artículos al carrito.',
        '3. Presionar COBRAR [F2].',
        '4. Verificar que el modal adopta estética naranja/ámbar con badge REMITO DE ENTREGA.',
        '5. Completar los campos logísticos: "Dirección de Destino / Obra" y "Transporte / Chofer / Patente".',
        '6. Hacer clic en Confirmar y Bajar PDF.'
      ],
      result: 'El stock se descuenta del inventario y se descarga un PDF vectorial formal con el título REMITO DE ENTREGA, datos de obra, transporte y conformidad de recepción.'
    },
    {
      id: 'CASO 03',
      title: 'Circuito de Presupuestos: Modo Predeterminado y Conversión a Venta [F2]',
      obj: 'Verificar que el mostrador inicia en modo Presupuesto, NO descuenta stock y se convierte a venta en 1 clic.',
      steps: [
        '1. Al abrir Mostrador o vaciar carrito, el selector indica automáticamente "PRESUPUESTO".',
        '2. Anotar el stock de un producto (ej. 10 u) y cargar 5 unidades al carrito.',
        '3. Presionar Guardar / Emitir Presupuesto [F6] y descargar el comprobante.',
        '4. Verificar en Inventario que el stock sigue intacto en 10 unidades.',
        '5. Presionar [F7] Presupuestos, localizar la cotización y pulsar "Cargar al Carrito".',
        '6. En el carrito, presionar CONCRETAR VENTA Y COBRAR [F2]: Conmuta a Ticket X y abre el modal de cobro.',
        '7. Confirmar el cobro en efectivo.'
      ],
      result: 'El stock ahora sí se descuenta (pasa a 5 u), el presupuesto en [F7] queda COMPLETADO y el carrito se resetea a modo PRESUPUESTO.'
    },
    {
      id: 'CASO 04',
      title: 'Regla de Agotamiento de Stock (Sin Stock / No Disponible)',
      obj: 'Verificar que al llegar a stock 0, el artículo pasa a No Disponible y nunca se elimina del catálogo.',
      steps: [
        '1. Localizar un producto con 1 unidad disponible y venderlo en mostrador.',
        '2. El stock del artículo ahora pasa a 0.',
        '3. Observar la tarjeta del producto en Mostrador: debe mostrar el badge rojo "SIN STOCK (NO DISPONIBLE)".',
        '4. Intentar agregarlo al carrito haciendo clic o pistoleando su código SKU.'
      ],
      result: 'El sistema emite un pitido de alerta grave y bloquea la venta indicando que no hay existencias. El producto sigue existiendo en el catálogo de Inventario con stock 0 (nunca se borra).'
    },
    {
      id: 'CASO 05',
      title: 'Anulación / Devolución de Venta y Reintegro al Kardex',
      obj: 'Verificar la trazabilidad y devolución de stock ante reclamos o cancelaciones de clientes.',
      steps: [
        '1. Ingresar a Historial de Ventas (/sales-history).',
        '2. Seleccionar una venta previamente cobrada y hacer clic en el botón "Anular / Devolución".',
        '3. Ingresar el motivo (ej. "Devolución por cambio de medida") y confirmar.',
        '4. Ir a /inventory y consultar el Kardex del producto devuelto.'
      ],
      result: 'La venta pasa al estado ANULADA (en rojo), el stock se restituye automáticamente en el inventario y el Kardex registra el asiento DEVOLUCION_VENTA con fecha, hora y operador.'
    },
    {
      id: 'CASO 06',
      title: 'Alternancia de Tarifas: Minorista vs Mayorista [F8]',
      obj: 'Comprobar la venta a instaladores o gremios con tarifa mayorista preferencial.',
      steps: [
        '1. En Mostrador, presionar la tecla F8 o hacer clic en "Minorista [F8]".',
        '2. Verificar que el botón cambia a color morado con el texto "Mayorista [F8]".',
        '3. Agregar artículos con precio mayoreo configurado (ej. productos con tarifa gremio).'
      ],
      result: 'El carrito aplica instantáneamente la tarifa mayorista para los productos configurados. Si un artículo no tiene precio mayorista ($0), respeta el precio estándar.'
    },
    {
      id: 'CASO 07',
      title: 'Matriz de Roles y Seguridad de Privilegios',
      obj: 'Asegurar que ningún cajero o vendedor pueda acceder a costos, edición masiva ni backups.',
      steps: [
        '1. Iniciar sesión como Cajera (PIN 3333): Verificar que en Inventario no se muestran costos ni márgenes, y no puede acceder a Usuarios ni Copias de Seguridad.',
        '2. Iniciar sesión como Dueño / Admin (PIN 0000): Puede ver costos, actualizar precios masivamente y gestionar empleados. El PIN del Superusuario permanece protegido.',
        '3. Iniciar sesión como Superusuario (PIN 9999): Dispone del switch maestro para habilitar/deshabilitar módulos del SaaS y gestionar Backups.'
      ],
      result: 'Cada perfil cuenta con los permisos restringidos estrictamente a su rol, salvaguardando la información financiera del comercio.'
    },
    {
      id: 'CASO 08',
      title: 'Respaldo y Restauración de Base de Datos (Superadmin)',
      obj: 'Verificar la integridad de las copias de seguridad de datos ante contingencias.',
      steps: [
        '1. Iniciar sesión como Superusuario (PIN 9999).',
        '2. Ir a /inventory y hacer clic en "Copias de Seguridad (Backup)".',
        '3. Ingresar la clave de seguridad del Superadmin cuando sea requerida.',
        '4. Presionar "Descargar Copia de Seguridad Completa (JSON)".'
      ],
      result: 'Se descarga un archivo .json íntegro con el catálogo de productos, clientes, ventas y configuraciones listo para ser restaurado en cualquier momento.'
    },
    {
      id: 'CASO 09',
      title: 'Funcionamiento Offline (Modo Autónomo Local)',
      obj: 'Garantizar que el mostrador siga cobrando e imprimiendo comprobantes si se corta internet.',
      steps: [
        '1. Desconectar la conexión a internet (modo avión) o colocar la app en Modo Local.',
        '2. Emitir una venta efectiva en mostrador con cobro en efectivo.',
        '3. Reconectar la conexión a internet.'
      ],
      result: 'La venta se emite sin trabas, descuenta el stock local y se almacena en la cola segura. Al volver internet, se sincroniza en segundo plano con Supabase automáticamente.'
    },
    {
      id: 'CASO 10',
      title: 'Informe y Resumen Ejecutivo de Ventas (Día, Horas Pico y Mes)',
      obj: 'Verificar que solo el Administrador/Dueño y Superusuario pueden auditar la facturación consolidada por día, franja horaria y mes.',
      steps: [
        '1. Ingresar como Cajera (PIN 3333) o Vendedor (PIN 4444) y verificar que NO tienen acceso a "Resumen de Ventas" ni a la URL /reportes-ventas.',
        '2. Iniciar sesión como Dueño/Tester (PIN 0000) o Superusuario (PIN 9999).',
        '3. En el menú lateral ingresar a "Resumen de Ventas" (o presionar el botón en /ventas).',
        '4. Probar las pestañas: Resumen por Día, Horas Pico (detección de mayor facturación y tickets), Resumen por Mes y Medios de Pago & Vendedores.',
        '5. Probar la exportación estructurada a Excel (.xlsx) y la vista de impresión/PDF.'
      ],
      result: 'El sistema calcula en tiempo real métricas clave (total facturado, ticket promedio, unidades, hora pico), exporta a Excel y protege la privacidad financiera ante empleados.'
    },
    {
      id: 'CASO 11',
      title: 'Comprobantes PDF Vectoriales Sin Superposición de Textos',
      obj: 'Verificar la alineación milimétrica en PDFs (Ticket, Presupuesto, Remito) con descripciones largas.',
      steps: [
        '1. En Mostrador, cargar un artículo con descripción superior a 60 caracteres y cliente con dirección.',
        '2. Emitir y descargar el comprobante en PDF (Ticket X, Presupuesto y Remito de Entrega).',
        '3. Verificar que la razón social no invade el recuadro superior derecho.',
        '4. Verificar que la descripción se divide prolijamente en renglones sin tocar el Precio Unitario.',
        '5. Verificar que el Total apila verticalmente etiqueta arriba e importe abajo sin encimarse.'
      ],
      result: 'Diseño vectorial nítido con cero colisiones de texto, márgenes seguros de 5mm y paginación automática si supera 15 ítems.'
    },
    {
      id: 'CASO 12',
      title: 'Diseño Compacto de Tablas y Columna de Acciones Flotante (Sticky)',
      obj: 'Comprobar que en pantallas reducidas las tablas no se rompen y los botones de acción están siempre a mano.',
      steps: [
        '1. Reducir el ancho de la ventana del navegador a 1024px o 1280px (simulación notebook mostrador).',
        '2. Navegar por Historial de Ventas, Inventario y Resumen de Ventas.',
        '3. Verificar la densidad compacta de filas (v-table--density-compact).',
        '4. Desplazar la tabla horizontalmente hacia la izquierda.'
      ],
      result: 'La columna "Acciones" permanece fija (sticky) al margen derecho con fondo sólido y sombra, permitiendo operar cada fila sin desplazarse.'
    },
    {
      id: 'CASO 13',
      title: 'Armador Avanzado de Presupuestos y Pedidos (/armar-presupuesto)',
      obj: 'Verificar la vista completa de cotizaciones con ítems personalizados libres, descuentos por renglón y pase a venta.',
      steps: [
        '1. Desde Mostrador hacer clic en "Armador" o ingresar a /armar-presupuesto desde el menú lateral.',
        '2. Agregar un ítem libre con "+ Ítem Personalizado" (ej. Flete, Mano de Obra, Corte a medida).',
        '3. Ajustar el precio unitario pactado en la tabla y aplicar un 10% de bonificación de línea.',
        '4. Definir validez a 30 días, guardar como presupuesto [F6] y descargar PDF vectorial.',
        '5. Probar "Pasar a Venta y Cobrar [F2]": conmuta a Ticket X y liquida la venta con descuento de stock.'
      ],
      result: 'El armador permite cotizaciones detalladas y conceptos no catalogados sin trabar el stock. La conversión de presupuesto a venta es fluida y sincronizada.'
    }
  ];

  testCases.forEach((tc) => {
    // Calcular altura estimada del caso de prueba completo para evitar cortes
    const objLines = doc.splitTextToSize(`Objetivo: ${tc.obj}`, contentWidth - 6);
    let totalStepLines = 0;
    tc.steps.forEach(step => {
      totalStepLines += doc.splitTextToSize(step, contentWidth - 10).length;
    });
    const resLines = doc.splitTextToSize(tc.result, contentWidth - 14);
    const boxH = Math.max(10, resLines.length * 3.6 + 8);
    const estimatedHeight = 9 + (objLines.length * 3.8) + (totalStepLines * 3.6) + boxH + 6;

    checkPageBreak(estimatedHeight > 65 ? 45 : estimatedHeight);

    // Caja de Título de Caso de Prueba
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderCol);
    doc.roundedRect(marginX, currentY, contentWidth, 7, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primary);
    doc.text(`${tc.id}: ${tc.title}`, marginX + 4, currentY + 4.8);

    currentY += 9;

    // Objetivo
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text(objLines, marginX + 3, currentY);
    currentY += (objLines.length * 3.8) + 1;

    // Pasos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...dark);
    tc.steps.forEach(step => {
      checkPageBreak(7);
      const lines = doc.splitTextToSize(step, contentWidth - 10);
      doc.text(lines, marginX + 5, currentY);
      currentY += (lines.length * 3.6);
    });

    currentY += 2;

    // Resultado Esperado (Recuadro verde menta elegante, texto ASCII limpio sin desbordes)
    checkPageBreak(boxH + 4);
    doc.setFillColor(240, 253, 250); // Verde menta tenue #F0FDFA
    doc.setDrawColor(13, 148, 136);  // Borde verde azulado #0D9488
    doc.roundedRect(marginX + 2, currentY, contentWidth - 4, boxH, 1.2, 1.2, 'FD');

    // Título dentro de la caja
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...teal);
    doc.text('CRITERIO DE EXITO / RESULTADO ESPERADO:', marginX + 5, currentY + 4.8);

    // Texto de resultado (100% dentro de márgenes)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...dark);
    doc.text(resLines, marginX + 5, currentY + 8.8);

    currentY += (boxH + 5);
  });

  // --- 4. CHECKLIST FINAL DE PUBLICACIÓN ---
  checkPageBreak(55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text('3. Checklist de Aprobación para Publicación (Go-Live)', marginX, currentY);
  currentY += 6;

  const checklistItems = [
    'El Mostrador inicia en modo Presupuesto por defecto y permite conversión directa a Venta con [F2].',
    'El botón Cobrar abre el modal de confirmación y resumen antes de emitir cualquier comprobante.',
    'Cancelar o presionar Escape en el modal de cobro no descuenta stock ni borra el carrito.',
    'La calculadora de vuelto en efectivo funciona con billetes sugeridos y cálculo en tiempo real.',
    'Los presupuestos NO descuentan stock del inventario bajo ninguna circunstancia.',
    'Los remitos incluyen destino de entrega, transportista/chofer y leyenda de conformidad en PDF.',
    'Los artículos sin stock quedan como No Disponibles y nunca se eliminan de la base de datos.',
    'Las devoluciones y anulaciones reintegran las unidades vendidas y se asientan en el Kardex.',
    'Los atajos de teclado (F2, F4, F6, F7, F8, Enter, Esc) responden ágilmente en mostrador.',
    'Los usuarios sin privilegios (cajeros) no pueden ver costos, editar precios ni tocar usuarios.',
    'El Superusuario es el único con acceso a Backup & Restore y habilitación de módulos del SaaS.',
    'El informe y resumen de ventas (día, horas pico y mes) es exclusivo de Admin/Dueño y Superusuario.',
    'Los comprobantes PDF vectoriales garantizan cero superposición de textos en descripciones y totales.',
    'Las tablas del sistema son compactas y mantienen visible la columna de acciones flotante (sticky).',
    'El Armador de Presupuestos (/armar-presupuesto) gestiona ítems libres, bonificaciones y pase a venta.'
  ];

  doc.setFillColor(...primary);
  doc.rect(marginX, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTADO', marginX + 3, currentY + 4.2);
  doc.text('CRITERIO DE ACEPTACIÓN / CONTROL DE CALIDAD', marginX + 28, currentY + 4.2);
  currentY += 6;

  checklistItems.forEach((item, idx) => {
    const itemLines = doc.splitTextToSize(item, contentWidth - 32);
    const rowHeight = Math.max(6.5, itemLines.length * 3.6 + 2.5);

    checkPageBreak(rowHeight + 1);
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');
    }
    doc.setDrawColor(...borderCol);
    doc.line(marginX, currentY + rowHeight, marginX + contentWidth, currentY + rowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...teal);
    doc.text('[ CONFORME ]', marginX + 3, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(...dark);
    doc.text(itemLines, marginX + 28, currentY + 4.2);

    currentY += rowHeight;
  });

  // --- 5. NUMERACIÓN DE PÁGINAS Y PIE UNIFORME ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...borderCol);
    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text('NEGOTOCK SAAS — Documentación Técnica de Control de Calidad (QA)', marginX, pageHeight - 7.5);
    doc.text(`Página ${i} de ${totalPages}`, marginX + contentWidth, pageHeight - 7.5, { align: 'right' });
  }

  // Guardar en archivos
  const outputPdfBuffer = Buffer.from(doc.output('arraybuffer'));

  // 1. Guardar en docs/MANUAL_TESTER.pdf
  const docsPath = path.join(__dirname, '..', 'docs', 'MANUAL_TESTER.pdf');
  fs.writeFileSync(docsPath, outputPdfBuffer);
  console.log(`✅ PDF generado exitosamente en: ${docsPath}`);

  // 2. Guardar en public/MANUAL_TESTER.pdf para descarga directa desde web
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicPath = path.join(publicDir, 'MANUAL_TESTER.pdf');
  fs.writeFileSync(publicPath, outputPdfBuffer);
  console.log(`✅ PDF copiado en public/ para descarga web en: ${publicPath}`);

  // 3. Guardar en directorio de artefactos si existe
  const artifactDir = '/Users/jferreyradev/.gemini/antigravity/brain/48eafd0f-9ea0-4085-a572-bbaf3751ff59';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'MANUAL_TESTER.pdf');
    fs.writeFileSync(artifactPath, outputPdfBuffer);
    console.log(`✅ PDF copiado en directorio de artefactos: ${artifactPath}`);
  }
}

generateTesterPdf();
