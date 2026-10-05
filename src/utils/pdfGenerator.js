import { jsPDF } from 'jspdf';

/**
 * Formatea un número como moneda en formato argentino ($ 1.234,56)
 */
function formatCurrency(num) {
  return Number(num || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formatea fecha y hora DD/MM/AAAA HH:MM
 */
function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formatea solo fecha DD/MM/AAAA
 */
function formatDateOnly(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-AR');
}

/**
 * Genera y descarga el comprobante o presupuesto comercial en formato PDF vectorial A4 de alta calidad.
 * Con cálculo dinámico de dimensiones y envoltura de texto para evitar cualquier tipo de superposición.
 * 
 * @param {Object} voucher Objeto de la venta, ticket o presupuesto
 * @param {Object} business Configuración del comercio (nombre, cuit, dirección, teléfono, etc.)
 * @returns {jsPDF} Instancia del documento PDF generado
 */
export function generateVoucherPdf(voucher, business = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isPresupuesto = voucher.voucherType === 'PRESUPUESTO' || voucher.type === 'PRESUPUESTO';
  const isRemito = voucher.voucherType === 'REMITO' || voucher.type === 'REMITO';
  const isAnulada = voucher.estado === 'ANULADA';
  const voucherNum = voucher.voucherNumber || voucher.orderNumber || '0001-00000001';

  // Paleta de colores profesional
  const primaryColor = isPresupuesto 
    ? [217, 119, 6] 
    : (isRemito 
        ? [194, 65, 12] 
        : (isAnulada ? [220, 38, 38] : [24, 76, 120]));
  const darkTextColor = [30, 41, 59];
  const mutedTextColor = [100, 116, 139];

  let currentY = 14;

  // 1. Encabezado superior con contención de texto
  function drawHeader() {
    // Barra de acento superior
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 4.5, 'F');

    // Columna Izquierda: Datos del Comercio (Ancho acotado: X=15 a X=115 -> 100mm)
    const maxBusinessWidth = 100;
    let bSize = 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(bSize);
    const bName = (business.nombre || 'NegoStock').toUpperCase();
    while (doc.getTextWidth(bName) > maxBusinessWidth && bSize > 10.5) {
      bSize -= 0.5;
      doc.setFontSize(bSize);
    }
    const bNameLines = doc.splitTextToSize(bName, maxBusinessWidth);
    doc.setTextColor(...darkTextColor);
    
    let leftY = currentY + 3.5;
    bNameLines.forEach(line => {
      doc.text(line, 15, leftY);
      leftY += (bSize * 0.35) + 1.2;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);

    const sub1Parts = [
      business.razonSocial,
      business.cuit ? `CUIT: ${business.cuit}` : '',
      business.condicionIva ? business.condicionIva.replace(/_/g, ' ') : ''
    ].filter(Boolean);
    if (sub1Parts.length > 0) {
      const sub1Lines = doc.splitTextToSize(sub1Parts.join(' • '), maxBusinessWidth);
      sub1Lines.forEach(l => {
        doc.text(l, 15, leftY);
        leftY += 3.8;
      });
    }

    const sub2Parts = [
      business.direccion,
      business.telefono ? `Tel: ${business.telefono}` : '',
      business.email
    ].filter(Boolean);
    if (sub2Parts.length > 0) {
      const sub2Lines = doc.splitTextToSize(sub2Parts.join(' • '), maxBusinessWidth);
      sub2Lines.forEach(l => {
        doc.text(l, 15, leftY);
        leftY += 3.8;
      });
    }

    // Columna Derecha: Caja de Identificación del Comprobante (X = 120, W = 75)
    const boxX = 120;
    const boxY = 9;
    const boxW = 75;
    const boxH = isPresupuesto ? 27 : 23;

    if (isPresupuesto) {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(217, 119, 6);
    } else if (isRemito) {
      doc.setFillColor(255, 237, 213);
      doc.setDrawColor(194, 65, 12);
    } else if (isAnulada) {
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(220, 38, 38);
    } else {
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(37, 99, 235);
    }
    doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

    // Título del Comprobante adaptativo
    let voucherTitle = isPresupuesto 
      ? 'PRESUPUESTO / COTIZACIÓN' 
      : (isRemito
          ? 'REMITO DE ENTREGA'
          : (voucher.voucherType === 'TICKET_X' ? 'TICKET X (COMPROBANTE)' : (voucher.voucherType ? voucher.voucherType.replace(/_/g, ' ') : 'COMPROBANTE DE VENTA')));
    
    if (isAnulada) {
      voucherTitle += ' (ANULADA)';
    }

    let vTitleSize = 9.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(vTitleSize);
    while (doc.getTextWidth(voucherTitle) > (boxW - 6) && vTitleSize > 7) {
      vTitleSize -= 0.5;
      doc.setFontSize(vTitleSize);
    }
    doc.setTextColor(...primaryColor);
    doc.text(voucherTitle, boxX + boxW / 2, boxY + 5.5, { align: 'center' });

    // Número de Comprobante
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...darkTextColor);
    doc.text(`N° ${voucherNum}`, boxX + boxW / 2, boxY + 12.5, { align: 'center' });

    // Fecha de Emisión
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    doc.text(`Fecha: ${formatDate(voucher.createdAt)}`, boxX + boxW / 2, boxY + 17.5, { align: 'center' });

    // Validez para Presupuesto
    if (isPresupuesto) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (voucher.validUntil) {
        doc.setTextColor(180, 83, 9);
        doc.text(`Válido hasta: ${formatDateOnly(voucher.validUntil)}`, boxX + boxW / 2, boxY + 23, { align: 'center' });
      } else {
        doc.setTextColor(71, 85, 105);
        doc.text(`Validez: Sin fecha de caducidad`, boxX + boxW / 2, boxY + 23, { align: 'center' });
      }
    }

    // Asegurar separación vertical limpia para la siguiente sección
    currentY = Math.max(leftY + 2, boxY + boxH + 5);
  }

  // 2. Ficha de Datos del Cliente y Operación con alturas dinámicas
  function drawCustomerCard() {
    const cust = voucher.customer || { name: 'Consumidor Final', taxCondition: 'Consumidor Final' };
    const leftW = 88;
    const rightW = 80;

    // Calcular líneas del lado izquierdo
    const rawCustName = cust.name || cust.nombre || 'Consumidor Final';
    let custFontSize = 9.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(custFontSize);
    while (doc.getTextWidth(rawCustName) > leftW && custFontSize > 8) {
      custFontSize -= 0.5;
      doc.setFontSize(custFontSize);
    }
    const custLines = doc.splitTextToSize(rawCustName, leftW);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const docText = cust.docNumber || cust.numero_documento ? `Doc: ${cust.docNumber || cust.numero_documento}` : '';
    const condText = (cust.taxCondition || cust.condicion_iva || 'Consumidor Final').replace(/_/g, ' ');
    const taxDocLines = doc.splitTextToSize([condText, docText].filter(Boolean).join(' • '), leftW);

    // Calcular líneas del lado derecho
    const opName = voucher.userName || (voucher.createdBy?.name) || 'Mostrador';
    const opRole = voucher.userRole || (voucher.createdBy?.role) || 'Vendedor';
    const opLines = doc.splitTextToSize(`Atendido por: ${opName} (${opRole})`, rightW);

    const contactParts = [];
    if (cust.phone || cust.telefono) contactParts.push(`Tel: ${cust.phone || cust.telefono}`);
    if (cust.address || cust.direccion) contactParts.push(`Dir: ${cust.address || cust.direccion}`);
    const contactLines = contactParts.length > 0 ? doc.splitTextToSize(contactParts.join(' • '), rightW) : [];

    const priceModeText = voucher.priceMode === 'wholesale' ? 'Tarifa: Mayorista' : 'Tarifa: Minorista estándar';

    // Altura adaptativa de la ficha
    const leftHeight = 5 + (custLines.length * 4) + (taxDocLines.length * 3.8);
    const rightHeight = (opLines.length * 3.8) + (contactLines.length ? contactLines.length * 3.8 : 0) + 4.5;
    const cardH = Math.max(21, Math.max(leftHeight, rightHeight) + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, currentY, 180, cardH, 2, 2, 'FD');

    // Imprimir Columna Izquierda (X = 19)
    let lY = currentY + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedTextColor);
    doc.text('CLIENTE / DESTINATARIO:', 19, lY);

    lY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(custFontSize);
    doc.setTextColor(...darkTextColor);
    custLines.forEach(l => {
      doc.text(l, 19, lY);
      lY += 4;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    taxDocLines.forEach(l => {
      doc.text(l, 19, lY);
      lY += 3.8;
    });

    // Imprimir Columna Derecha (X = 112)
    let rY = currentY + 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    opLines.forEach(l => {
      doc.text(l, 112, rY);
      rY += 3.8;
    });

    if (contactLines.length > 0) {
      contactLines.forEach(l => {
        doc.text(l, 112, rY);
        rY += 3.8;
      });
    }

    doc.text(priceModeText, 112, rY);

    currentY += cardH + 4;
  }

  // 3. Encabezado de la Tabla de Ítems
  function drawTableHeader() {
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, 180, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(15, currentY + 7, 195, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkTextColor);

    doc.text('CANT.', 17, currentY + 5);
    doc.text('CÓDIGO / SKU', 35, currentY + 5);
    doc.text('DESCRIPCIÓN DEL ARTÍCULO', 59, currentY + 5);
    doc.text('P. UNITARIO', 163, currentY + 5, { align: 'right' });
    doc.text('SUBTOTAL', 193, currentY + 5, { align: 'right' });

    currentY += 7;
  }

  // 4. Detalle de Ítems con envoltura dinámica y espaciado protegido
  function drawItems() {
    const items = voucher.items || [];
    const maxDescW = 75; // Ocupa de 59 a 134 mm. Columna precio empieza en ~140 mm.

    items.forEach((item, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      const itemName = item.name || item.descripcion || 'Artículo';
      const descLines = doc.splitTextToSize(itemName, maxDescW);
      const rowH = Math.max(6.5, (descLines.length * 4.2) + 2.5);

      // Salto de página preventivo con acento de cabecera
      if (currentY + rowH > 265) {
        doc.addPage();
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 3.5, 'F');
        currentY = 14;
        drawTableHeader();
      }

      const isWholesale = voucher.priceMode === 'wholesale' && item.wholesalePrice > 0;
      const unitPrice = isWholesale ? item.wholesalePrice : (item.sellingPrice || item.price || 0);
      const subtotal = (item.quantity || 1) * unitPrice;

      // Sombreado alternado
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, rowH, 'F');
      }

      const textY = currentY + 4.5;
      doc.setTextColor(...darkTextColor);

      // Cantidad + unidad
      const qtyStr = `${item.quantity || 1} ${item.unit || 'u.'}`;
      doc.text(qtyStr, 17, textY);

      // SKU
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text((item.sku || '-').substring(0, 12), 35, textY);

      // Descripción multilínea sin desborde
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkTextColor);
      doc.text(descLines, 59, textY);

      // P. Unitario alineado a la derecha en 163 (completamente separado)
      doc.text(`$ ${formatCurrency(unitPrice)}`, 163, textY, { align: 'right' });

      // Subtotal alineado a la derecha en 193
      doc.setFont('helvetica', 'bold');
      doc.text(`$ ${formatCurrency(subtotal)}`, 193, textY, { align: 'right' });

      // Línea divisoria tenue
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + rowH, 195, currentY + rowH);

      currentY += rowH;
    });

    currentY += 4;
  }

  // 5. Totales y Condiciones (Diseño apilado con separación absoluta de textos)
  function drawTotals() {
    const leftX = 15;
    const leftW = 100;
    const totX = 120;
    const totW = 75;

    // Recolectar condiciones y notas
    const bullets = [];
    if (isPresupuesto) {
      if (voucher.validUntil) {
        bullets.push(`• Presupuesto válido hasta el ${formatDateOnly(voucher.validUntil)}.`);
      } else {
        bullets.push('• Cotización comercial sin fecha de vencimiento.');
      }
      bullets.push('• Sujeto a disponibilidad de stock al momento de compra.');
      bullets.push('• La presente cotización no reserva stock en el inventario.');
    } else if (isRemito) {
      bullets.push('• Remito de traslado y entrega de mercadería.');
      if (voucher.remitoDeliveryAddress) {
        bullets.push(`• Destino: ${voucher.remitoDeliveryAddress}`);
      }
      if (voucher.remitoCarrier) {
        bullets.push(`• Transporte: ${voucher.remitoCarrier}`);
      } else {
        bullets.push('• Mercadería entregada en perfecto estado de conformidad.');
      }
    } else {
      bullets.push(`• Medio de Cobro: ${voucher.paymentMethod || 'Efectivo'}`);
      if (voucher.cashReceived && voucher.cashChange > 0) {
        bullets.push(`• Pagó con: $ ${formatCurrency(voucher.cashReceived)} • Vuelto: $ ${formatCurrency(voucher.cashChange)}`);
      } else {
        bullets.push(`• Estado del Comprobante: ${voucher.estado || 'PAGADO'}`);
      }
      if (business.pieTicket) {
        bullets.push(`• ${business.pieTicket}`);
      }
    }

    let noteLines = [];
    if (voucher.notes) {
      noteLines = doc.splitTextToSize(`Nota: ${voucher.notes}`, leftW - 8);
    }

    const renderedBulletLines = [];
    bullets.forEach(b => {
      const wrapped = doc.splitTextToSize(b, leftW - 8);
      wrapped.forEach(w => renderedBulletLines.push(w));
    });

    const leftContentH = 7 + (renderedBulletLines.length * 3.8) + (noteLines.length ? noteLines.length * 3.8 + 2 : 0);
    const hasDiscount = voucher.discount && voucher.discount > 0;
    const rightContentH = (hasDiscount ? 11 : 0) + 16;
    const boxH = Math.max(30, Math.max(leftContentH + 4, rightContentH + 3));

    // Salto de página seguro si el cuadro de totales no cabe holgadamente antes del pie
    if (currentY + boxH > 268) {
      doc.addPage();
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 3.5, 'F');
      currentY = 16;
    }

    const startY = currentY;

    // Dibujar tarjeta izquierda (Condiciones y Notas)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(leftX, startY, leftW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryColor);
    doc.text(
      isPresupuesto 
        ? 'CONDICIONES DEL PRESUPUESTO:' 
        : (isRemito ? 'DATOS DE TRASLADO Y ENTREGA:' : 'INFORMACIÓN DE VENTA / OBSERVACIONES:'),
      leftX + 4,
      startY + 5
    );

    let bY = startY + 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkTextColor);
    renderedBulletLines.forEach(line => {
      doc.text(line, leftX + 4, bY);
      bY += 3.8;
    });

    if (noteLines.length > 0) {
      bY += 1;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...mutedTextColor);
      noteLines.forEach(nl => {
        doc.text(nl, leftX + 4, bY);
        bY += 3.8;
      });
    }

    // Dibujar Columna Derecha: Totales
    let rY = startY + 2;
    if (hasDiscount) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...mutedTextColor);
      doc.text('Subtotal:', totX + 4, rY + 3);
      doc.text(`$ ${formatCurrency(voucher.subtotal)}`, totX + totW - 4, rY + 3, { align: 'right' });
      rY += 5;

      doc.setTextColor(220, 38, 38);
      doc.text('Descuento:', totX + 4, rY + 3);
      doc.text(`-$ ${formatCurrency(voucher.discount)}`, totX + totW - 4, rY + 3, { align: 'right' });
      rY += 6;
    }

    // Cuadro de Total DESTACADO APILADO (Sin superposición horizontal)
    const totBoxH = 15;
    doc.setFillColor(...primaryColor);
    doc.roundedRect(totX, rY, totW, totBoxH, 2, 2, 'F');

    // Label en parte superior
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const totalLabel = isRemito
      ? 'TOTAL ARTÍCULOS EN REMITO'
      : (isPresupuesto ? 'IMPORTE TOTAL ESTIMADO' : 'TOTAL FINAL A ABONAR');
    doc.text(totalLabel, totX + 5, rY + 5.2);

    // Importe en parte inferior
    doc.setFontSize(13);
    const totalStr = `$ ${formatCurrency(voucher.total)}`;
    doc.text(totalStr, totX + totW - 5, rY + 12, { align: 'right' });

    currentY = startY + boxH + 6;
  }

  // 6. Pie de Página uniforme en todas las hojas
  function applyFooters() {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageH = 297;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, pageH - 14, 195, pageH - 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedTextColor);

      const thanksMsg = business.mensajeAgradecimiento || '¡Gracias por su preferencia!';
      doc.text(thanksMsg, 15, pageH - 9);

      const disclaimer = isPresupuesto 
        ? 'Documento de cotización comercial emitido por NegoStock. No válido como factura fiscal.' 
        : (isRemito
            ? 'Remito de traslado de mercadería emitido por NegoStock. No válido como factura fiscal.'
            : 'Documento comercial emitido por NegoStock. No válido como factura fiscal.');
      doc.text(disclaimer, 15, pageH - 5);

      doc.text(`Página ${i} de ${totalPages}`, 193, pageH - 9, { align: 'right' });
    }
  }

  // Generación secuencial
  drawHeader();
  drawCustomerCard();
  drawTableHeader();
  drawItems();
  drawTotals();
  applyFooters();

  // Nombre de archivo seguro
  const cleanVoucherType = (voucher.voucherType || voucher.type || 'COMPROBANTE').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanVoucherNum = (voucherNum || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanVoucherType}_${cleanVoucherNum}.pdf`;

  // Descarga directa en el navegador
  if (typeof window !== 'undefined' && doc.save) {
    doc.save(fileName);
  }

  return doc;
}

export default {
  generateVoucherPdf
};
