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
