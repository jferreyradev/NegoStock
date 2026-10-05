import * as XLSX from 'xlsx';

/**
 * Exporta el catálogo completo a un archivo Excel (.xlsx) o CSV
 */
export function exportCatalogToExcel(products, format = 'xlsx') {
  const data = products.map(p => ({
    'Codigo (SKU)': p.sku,
    'Descripcion': p.name,
    'Rubro': p.dept || 'GENERAL',
    'Marca': p.brand || 'GENÉRICO',
    'Precio Costo': Number(p.costPrice || 0),
    'Precio Venta': Number(p.sellingPrice || 0),
    'Precio Mayoreo': Number(p.wholesalePrice || 0),
    'Stock Actual': Number(p.stock || 0),
    'Unidad': p.unit || 'u'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ancho estimado de columnas
  worksheet['!cols'] = [
    { wch: 14 }, // SKU
    { wch: 45 }, // Descripcion
    { wch: 18 }, // Rubro
    { wch: 16 }, // Marca
    { wch: 16 }, // Costo
    { wch: 16 }, // Venta
    { wch: 16 }, // Mayoreo
    { wch: 12 }, // Stock
    { wch: 10 }  // Unidad
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Precios_NegoStock');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `NegoStock_Precios_${dateStr}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}

/**
 * Lee un archivo .xlsx, .xls o .csv subido por el usuario
 */
export function parseUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsedItems = jsonRows.map((row) => {
          const keys = Object.keys(row);

          const findKey = (candidates) => {
            const found = keys.find(k => candidates.includes(k.toLowerCase().trim()));
            return found ? row[found] : null;
          };

          const cleanNum = (val) => {
            if (val === null || val === undefined || val === '') return 0;
            if (typeof val === 'number') return val;
            const str = String(val).replace(/[$\s]/g, '').replace(/,/g, '.');
            const n = parseFloat(str);
            return isNaN(n) ? 0 : n;
          };

          const skuRaw = findKey(['codigo', 'sku', 'cod', 'código', 'codigo (sku)']);
          const nameRaw = findKey(['descripcion', 'descripción', 'nombre', 'producto', 'articulo']);
          const costRaw = findKey(['precio costo', 'costo', 'cost', 'precio_costo', 'p. costo']);
          const sellingRaw = findKey(['precio venta', 'venta', 'precio', 'price', 'precio_venta', 'p. venta']);
          const wholesaleRaw = findKey(['precio mayoreo', 'mayoreo', 'mayorista', 'precio_mayoreo', 'p. mayoreo']);

          return {
            sku: skuRaw ? String(skuRaw).trim() : '',
            name: nameRaw ? String(nameRaw).trim() : '',
            costPrice: cleanNum(costRaw),
            sellingPrice: cleanNum(sellingRaw),
            wholesalePrice: cleanNum(wholesaleRaw)
          };
        }).filter(item => Boolean(item.sku));

        resolve(parsedItems);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exporta el Reporte Ejecutivo de Ventas (Día, Hora, Mes, Pagos, Vendedores) a Excel
 */
export function exportSalesReportToExcel(reportData) {
  const workbook = XLSX.utils.book_new();

  // 1. Hoja: Resumen Diario
  if (reportData.daily && reportData.daily.length > 0) {
    const dailyData = reportData.daily.map(d => ({
      'Fecha': d.dateFormatted,
      'Día': d.dayName,
      'Total Facturado ($)': Number(d.total.toFixed(2)),
      'Cantidad Tickets': d.count,
      'Ticket Promedio ($)': Number(d.avgTicket.toFixed(2)),
      'Unidades Vendidas': d.units
    }));
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    wsDaily['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, wsDaily, 'Por_Dia');
  }

  // 2. Hoja: Resumen Horario
  if (reportData.hourly && reportData.hourly.length > 0) {
    const hourlyData = reportData.hourly.map(h => ({
      'Franja Horaria': h.label,
      'Total Facturado ($)': Number(h.total.toFixed(2)),
      'Cantidad Tickets': h.count,
      'Ticket Promedio ($)': Number(h.avgTicket.toFixed(2)),
      'Participación (%)': Number(h.percentage.toFixed(1))
    }));
    const wsHourly = XLSX.utils.json_to_sheet(hourlyData);
    wsHourly['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, wsHourly, 'Por_Hora');
  }

  // 3. Hoja: Resumen Mensual
  if (reportData.monthly && reportData.monthly.length > 0) {
    const monthlyData = reportData.monthly.map(m => ({
      'Período': m.label,
      'Total Facturado ($)': Number(m.total.toFixed(2)),
      'Cantidad Tickets': m.count,
      'Ticket Promedio ($)': Number(m.avgTicket.toFixed(2)),
      'Días con Venta': m.activeDays,
      'Promedio Diario ($)': Number(m.dailyAvg.toFixed(2))
    }));
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyData);
    wsMonthly['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsMonthly, 'Por_Mes');
  }

  // 4. Hoja: Medios de Pago
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    const payData = reportData.paymentMethods.map(p => ({
      'Medio de Pago': p.name,
      'Total Recaudado ($)': Number(p.total.toFixed(2)),
      'Cantidad Operaciones': p.count,
      'Participación (%)': Number(p.percentage.toFixed(1))
    }));
    const wsPay = XLSX.utils.json_to_sheet(payData);
    wsPay['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, wsPay, 'Medios_De_Pago');
  }

  // 5. Hoja: Vendedores
  if (reportData.operators && reportData.operators.length > 0) {
    const opData = reportData.operators.map(o => ({
      'Vendedor / Operador': o.name,
      'Rol': o.role,
      'Total Vendido ($)': Number(o.total.toFixed(2)),
      'Cantidad Tickets': o.count,
      'Ticket Promedio ($)': Number(o.avgTicket.toFixed(2))
    }));
    const wsOp = XLSX.utils.json_to_sheet(opData);
    wsOp['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsOp, 'Por_Vendedor');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `NegoStock_Reporte_Ventas_${dateStr}.xlsx`, { bookType: 'xlsx' });
}
