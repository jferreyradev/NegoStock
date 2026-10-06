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

/**
 * Genera y descarga la Plantilla Oficial de Carga de Productos (.xlsx o .csv)
 */
export function downloadProductImportTemplate(format = 'xlsx') {
  const sampleProducts = [
    {
      'Codigo_SKU': 'HER-1001',
      'Codigo_Barras': '779812345671',
      'Descripcion': 'Martillo Galponero 500g Mango Fibra',
      'Rubro': 'HERRAMIENTAS',
      'Marca': 'STANLEY',
      'Unidad': 'u',
      'Precio_Costo': 12500,
      'Margen_Ganancia': 40,
      'Precio_Venta': 17500,
      'Precio_Mayoreo': 15000,
      'Stock_Actual': 20,
      'Stock_Minimo': 5,
      'Alicuota_IVA': 21
    },
    {
      'Codigo_SKU': 'PIN-2005',
      'Codigo_Barras': '779812345672',
      'Descripcion': 'Látex Interior / Exterior Blanco 20 Lts',
      'Rubro': 'PINTURERÍA',
      'Marca': 'ALBA',
      'Unidad': 'u',
      'Precio_Costo': 45000,
      'Margen_Ganancia': 45,
      'Precio_Venta': 65250,
      'Precio_Mayoreo': 58000,
      'Stock_Actual': 12,
      'Stock_Minimo': 3,
      'Alicuota_IVA': 21
    },
    {
      'Codigo_SKU': 'BUL-3010',
      'Codigo_Barras': '779812345673',
      'Descripcion': 'Tornillo Autoperforante T1 Punta Aguja x 100u',
      'Rubro': 'BULONERÍA',
      'Marca': 'TEL',
      'Unidad': 'caja',
      'Precio_Costo': 3200,
      'Margen_Ganancia': 50,
      'Precio_Venta': 4800,
      'Precio_Mayoreo': 4200,
      'Stock_Actual': 45,
      'Stock_Minimo': 10,
      'Alicuota_IVA': 21
    },
    {
      'Codigo_SKU': 'ELE-4015',
      'Codigo_Barras': '779812345674',
      'Descripcion': 'Cable Unipolar Normalizado 2.5mm Rojo',
      'Rubro': 'ELECTRICIDAD',
      'Marca': 'PRYSMIAN',
      'Unidad': 'mt',
      'Precio_Costo': 480,
      'Margen_Ganancia': 35,
      'Precio_Venta': 650,
      'Precio_Mayoreo': 580,
      'Stock_Actual': 350,
      'Stock_Minimo': 50,
      'Alicuota_IVA': 21
    }
  ];

  const wsProducts = XLSX.utils.json_to_sheet(sampleProducts);
  wsProducts['!cols'] = [
    { wch: 15 }, // Codigo_SKU
    { wch: 16 }, // Codigo_Barras
    { wch: 46 }, // Descripcion
    { wch: 18 }, // Rubro
    { wch: 16 }, // Marca
    { wch: 10 }, // Unidad
    { wch: 14 }, // Precio_Costo
    { wch: 16 }, // Margen_Ganancia
    { wch: 14 }, // Precio_Venta
    { wch: 16 }, // Precio_Mayoreo
    { wch: 14 }, // Stock_Actual
    { wch: 14 }, // Stock_Minimo
    { wch: 14 }  // Alicuota_IVA
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsProducts, 'Plantilla_Productos');

  if (format === 'xlsx') {
    const instructions = [
      { 'CAMPO / COLUMNA': 'Codigo_SKU', 'OBLIGATORIO': 'NO', 'FORMATO': 'Texto / Alfanumérico', 'DESCRIPCIÓN': 'Código único interno del producto (ej. FER-001). Si lo dejás vacío, el sistema le asignará un SKU correlativo automáticamente.' },
      { 'CAMPO / COLUMNA': 'Codigo_Barras', 'OBLIGATORIO': 'NO', 'FORMATO': 'Números / EAN-13', 'DESCRIPCIÓN': 'Código de barras de la etiqueta del fabricante. Útil para el lector de código de barras en mostrador.' },
      { 'CAMPO / COLUMNA': 'Descripcion', 'OBLIGATORIO': 'SÍ', 'FORMATO': 'Texto', 'DESCRIPCIÓN': 'Nombre completo del artículo, medidas o presentación. Es el campo principal de búsqueda.' },
      { 'CAMPO / COLUMNA': 'Rubro', 'OBLIGATORIO': 'NO', 'FORMATO': 'Texto', 'DESCRIPCIÓN': 'Categoría o departamento (ej. HERRAMIENTAS, PINTURERÍA, ELECTRICIDAD). Si no existe, se crea automáticamente.' },
      { 'CAMPO / COLUMNA': 'Marca', 'OBLIGATORIO': 'NO', 'FORMATO': 'Texto', 'DESCRIPCIÓN': 'Marca del fabricante (ej. STANLEY, ALBA, GENÉRICO). Si se omite, se asigna GENÉRICO.' },
      { 'CAMPO / COLUMNA': 'Unidad', 'OBLIGATORIO': 'NO', 'FORMATO': 'Texto', 'DESCRIPCIÓN': 'Unidad de medida (ej. u, mt, kg, litro, par, caja). Por defecto se asigna "u".' },
      { 'CAMPO / COLUMNA': 'Precio_Costo', 'OBLIGATORIO': 'NO', 'FORMATO': 'Número', 'DESCRIPCIÓN': 'Costo neto de compra del proveedor sin signos ($ ni comas). Ej: 12500' },
      { 'CAMPO / COLUMNA': 'Margen_Ganancia', 'OBLIGATORIO': 'NO', 'FORMATO': 'Porcentaje (Número)', 'DESCRIPCIÓN': 'Porcentaje de recargo sobre el costo (ej. 40 para 40%). Si no se especifica y hay Precio_Venta, se calcula automáticamente.' },
      { 'CAMPO / COLUMNA': 'Precio_Venta', 'OBLIGATORIO': 'RECOMENDADO', 'FORMATO': 'Número', 'DESCRIPCIÓN': 'Precio final al público. Si se omite, se calcula: Costo * (1 + Margen / 100).' },
      { 'CAMPO / COLUMNA': 'Precio_Mayoreo', 'OBLIGATORIO': 'NO', 'FORMATO': 'Número', 'DESCRIPCIÓN': 'Precio mayorista o gremio para clientes especiales o compras en volumen.' },
      { 'CAMPO / COLUMNA': 'Stock_Actual', 'OBLIGATORIO': 'NO', 'FORMATO': 'Número entero', 'DESCRIPCIÓN': 'Cantidad física inicial en depósito / góndola. Si se omite, se carga en 0.' },
      { 'CAMPO / COLUMNA': 'Stock_Minimo', 'OBLIGATORIO': 'NO', 'FORMATO': 'Número entero', 'DESCRIPCIÓN': 'Umbral mínimo de existencia para que el sistema avise de Stock Crítico.' },
      { 'CAMPO / COLUMNA': 'Alicuota_IVA', 'OBLIGATORIO': 'NO', 'FORMATO': 'Número (21 o 10.5)', 'DESCRIPCIÓN': 'Tasa impositiva de IVA. Por defecto 21%.' }
    ];
    const wsHelp = XLSX.utils.json_to_sheet(instructions);
    wsHelp['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 75 }];
    XLSX.utils.book_append_sheet(workbook, wsHelp, 'Instrucciones');
  }

  const filename = `NegoStock_Plantilla_Carga_Productos.${format}`;
  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}

/**
 * Lee un archivo .xlsx, .xls o .csv para importación completa de catálogo de productos
 */
export function parseProductImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Tomar la hoja de productos (preferir 'Plantilla_Productos' o la primera hoja)
        const targetSheetName = workbook.SheetNames.includes('Plantilla_Productos')
          ? 'Plantilla_Productos'
          : workbook.SheetNames[0];

        const worksheet = workbook.Sheets[targetSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          throw new Error('La planilla subida está vacía o no contiene filas con datos.');
        }

        const cleanNum = (val, fallback = 0) => {
          if (val === null || val === undefined || val === '') return fallback;
          if (typeof val === 'number') return isNaN(val) ? fallback : val;
          const str = String(val).replace(/[$\s]/g, '').replace(/,/g, '.');
          const n = parseFloat(str);
          return isNaN(n) ? fallback : n;
        };

        const parsedProducts = [];
        let ignoredCount = 0;

        for (let i = 0; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          const keys = Object.keys(row);

          const findKey = (candidates) => {
            const found = keys.find(k => {
              const norm = k.toLowerCase().trim();
              const normNoUnderscore = norm.replace(/_/g, ' ');
              const normWithUnderscore = norm.replace(/\s+/g, '_');
              return candidates.some(c => {
                const cNorm = c.toLowerCase().trim();
                return norm === cNorm || normNoUnderscore === cNorm || normWithUnderscore === cNorm;
              });
            });
            return found ? row[found] : null;
          };

          const nameRaw = findKey([
            'descripcion', 'descripción', 'nombre', 'producto',
            'articulo', 'artículo', 'detalle', 'descripcion del producto'
          ]);

          // Si no tiene descripción/nombre, ignorar la fila (fila de cabecera repetida o vacía)
          if (!nameRaw || !String(nameRaw).trim()) {
            ignoredCount++;
            continue;
          }

          const skuRaw = findKey([
            'codigo_sku', 'codigo (sku)', 'codigo', 'sku', 'cod', 'código', 'id_producto', 'codigo sku'
          ]);
          const barcodeRaw = findKey([
            'codigo_barras', 'codigo de barras', 'cod_barras', 'barcode', 'ean', 'ean13', 'barras', 'código de barras'
          ]);
          const deptRaw = findKey([
            'rubro', 'categoria', 'categoría', 'departamento', 'dept', 'grupo', 'familia'
          ]);
          const brandRaw = findKey([
            'marca', 'brand', 'fabricante', 'proveedor'
          ]);
          const unitRaw = findKey([
            'unidad', 'unidad_medida', 'u.m.', 'um', 'unit', 'medida', 'unidad de medida'
          ]);
          const costRaw = findKey([
            'precio_costo', 'precio costo', 'costo', 'cost', 'p. costo', 'p_costo', 'costo unitario'
          ]);
          const marginRaw = findKey([
            'margen_ganancia', 'margen ganancia', 'margen', 'margin', '% margen', 'utilidad', '% ganancia', 'margen %'
          ]);
          const sellingRaw = findKey([
            'precio_venta', 'precio venta', 'venta', 'precio', 'price', 'pvp', 'p. venta', 'p_venta', 'precio al publico', 'precio publico'
          ]);
          const wholesaleRaw = findKey([
            'precio_mayoreo', 'precio mayoreo', 'precio_mayorista', 'mayoreo', 'mayorista', 'precio mayorista', 'p. mayoreo', 'p. mayorista'
          ]);
          const stockRaw = findKey([
            'stock_actual', 'stock actual', 'stock', 'cantidad', 'existencia', 'existencias', 'cant', 'stock_inicial', 'stock inicial', 'inventario'
          ]);
          const minStockRaw = findKey([
            'stock_minimo', 'stock minimo', 'stock_mínimo', 'minimo', 'mínimo', 'min_stock', 'alerta_stock', 'stock min'
          ]);
          const ivaRaw = findKey([
            'alicuota_iva', 'iva', 'alicuota', 'alícuota', 'tasa_iva', '% iva', 'iva %'
          ]);

          let costPrice = cleanNum(costRaw, 0);
          let margin = cleanNum(marginRaw, 0);
          let sellingPrice = cleanNum(sellingRaw, 0);
          const wholesalePrice = cleanNum(wholesaleRaw, 0);
          const stock = cleanNum(stockRaw, 0);
          const minStock = cleanNum(minStockRaw, 0);
          const ivaRate = cleanNum(ivaRaw, 21);

          // Lógica de autocalculado recíproco
          if (sellingPrice <= 0 && costPrice > 0 && margin > 0) {
            sellingPrice = Math.round(costPrice * (1 + margin / 100));
          } else if (margin <= 0 && costPrice > 0 && sellingPrice > costPrice) {
            margin = Math.round(((sellingPrice - costPrice) / costPrice) * 100 * 10) / 10;
          } else if (margin <= 0 && sellingPrice > 0 && costPrice <= 0) {
            margin = 100;
          }

          parsedProducts.push({
            sku: skuRaw ? String(skuRaw).trim() : '',
            barcode: barcodeRaw ? String(barcodeRaw).trim() : '',
            name: String(nameRaw).trim(),
            description: '',
            dept: deptRaw ? String(deptRaw).trim().toUpperCase() : 'GENERAL',
            brand: brandRaw ? String(brandRaw).trim().toUpperCase() : 'GENÉRICO',
            unit: unitRaw ? String(unitRaw).trim().toLowerCase() : 'u',
            costPrice,
            margin,
            sellingPrice,
            wholesalePrice,
            stock,
            minStock,
            ivaRate,
            isActive: true
          });
        }

        resolve({
          products: parsedProducts,
          totalRows: jsonRows.length,
          validCount: parsedProducts.length,
          ignoredCount
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
