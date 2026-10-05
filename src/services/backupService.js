import { supabase, isSupabaseConfigured } from '@/services/supabase';

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function downloadBlob(content, fileName, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const TABLES_ORDER = [
  { name: 'comercios', pkey: 'id' },
  { name: 'unidades_medida', pkey: 'id' },
  { name: 'categorias', pkey: 'id' },
  { name: 'marcas', pkey: 'id' },
  { name: 'clientes', pkey: 'id' },
  { name: 'proveedores', pkey: 'id' },
  { name: 'usuarios', pkey: 'id' },
  { name: 'productos', pkey: 'id' },
  { name: 'precios_historial', pkey: 'id' },
  { name: 'stock_movimientos', pkey: 'id' },
  { name: 'comprobantes_secuencias', pkey: 'comercio_id, punto_venta, tipo_comprobante' },
  { name: 'ventas', pkey: 'id' },
  { name: 'ventas_detalles', pkey: 'id' },
  { name: 'pedidos_preventa', pkey: 'id' },
  { name: 'pedidos_preventa_detalles', pkey: 'id' }
];

export async function fetchFullDatabasePayload(fallbackState = {}) {
  const payload = {};

  if (isSupabaseConfigured && supabase) {
    for (const t of TABLES_ORDER) {
      try {
        const { data, error } = await supabase.from(t.name).select('*');
        if (!error && data) {
          payload[t.name] = data;
        } else {
          payload[t.name] = [];
        }
      } catch {
        payload[t.name] = [];
      }
    }
  }

  // Si alguna tabla quedó vacía o no hay Supabase, complementar con el estado local
  if (!payload.productos || payload.productos.length === 0) {
    if (fallbackState.products && fallbackState.products.length > 0) {
      payload.productos = fallbackState.products.map(p => ({
        id: p.id,
        comercio_id: 1,
        codigo_sku: p.sku,
        codigo_barras: p.barcode,
        nombre: p.name,
        precio_costo: p.costPrice,
        precio_venta: p.price,
        precio_mayoreo: p.wholesalePrice,
        stock_actual: p.stock,
        stock_minimo: p.minStock,
        esta_activo: p.isActive !== false
      }));
    }
  }

  if (!payload.usuarios || payload.usuarios.length === 0) {
    if (fallbackState.users && fallbackState.users.length > 0) {
      payload.usuarios = fallbackState.users.map(u => ({
        id: u.id,
        comercio_id: 1,
        nombre_completo: u.fullName,
        email: u.email,
        rol: u.role,
        codigo_pin: u.pin,
        esta_activo: u.isActive !== false
      }));
    }
  }

  return payload;
}

export async function generateSqlBackupContent(fallbackState = {}) {
  const dbData = await fetchFullDatabasePayload(fallbackState);
  const now = new Date().toISOString();

  const lines = [
    '--',
    '-- ============================================================================== ',
    '-- NEGOTOCK: BACKUP COMPLETO DE BASE DE DATOS (POSTGRESQL / SUPABASE)',
    `-- Fecha de generación: ${now}`,
    '-- Listo para restaurar en cualquier servidor PostgreSQL o Supabase.',
    '-- ============================================================================== ',
    '--',
    'BEGIN;',
    'SET client_encoding = \'UTF8\';',
    ''
  ];

  let totalCount = 0;

  for (const tableInfo of TABLES_ORDER) {
    const rows = dbData[tableInfo.name] || [];
    if (rows.length === 0) continue;

    totalCount += rows.length;
    lines.push(`-- ------------------------------------------------------------------------------`);
    lines.push(`-- TABLA: ${tableInfo.name} (${rows.length} registros)`);
    lines.push(`-- ------------------------------------------------------------------------------`);

    const columns = Object.keys(rows[0]);
    const columnsList = columns.join(', ');

    for (const row of rows) {
      const valuesList = columns.map(c => escapeSqlValue(row[c])).join(', ');

      if (tableInfo.pkey.includes(',')) {
        lines.push(`INSERT INTO public.${tableInfo.name} (${columnsList}) VALUES (${valuesList}) ON CONFLICT DO NOTHING;`);
      } else {
        lines.push(`INSERT INTO public.${tableInfo.name} (${columnsList}) VALUES (${valuesList}) ON CONFLICT (${tableInfo.pkey}) DO UPDATE SET`);
        const updates = columns
          .filter(c => c !== tableInfo.pkey)
          .map(c => `    ${c} = EXCLUDED.${c}`)
          .join(',\n');
        if (updates) {
          lines[lines.length - 1] += '\n' + updates + ';';
        } else {
          lines[lines.length - 1] = `INSERT INTO public.${tableInfo.name} (${columnsList}) VALUES (${valuesList}) ON CONFLICT (${tableInfo.pkey}) DO NOTHING;`;
        }
      }
    }
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');
  lines.push(`SELECT '✅ Copia de seguridad restaurada exitosamente. Total de filas: ${totalCount}' AS resultado;`);

  return { sql: lines.join('\n'), totalCount };
}

export function generateProductsCsv(products = [], canViewCosts = false) {
  const headers = ['SKU', 'Nombre', 'Rubro', 'Marca', 'Unidad'];
  if (canViewCosts) headers.push('Precio Costo');
  headers.push('Precio Venta', 'Precio Mayoreo', 'Stock Actual', 'Stock Mínimo', 'Estado');

  const rows = [headers.join(';')];

  for (const p of products) {
    const row = [
      `"${p.sku || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || 'GENERAL').replace(/"/g, '""')}"`,
      `"${(p.brand || 'GENÉRICO').replace(/"/g, '""')}"`,
      `"${p.unit || 'u'}"`
    ];

    if (canViewCosts) row.push(String(p.costPrice || 0));
    row.push(
      String(p.price || 0),
      String(p.wholesalePrice || 0),
      String(p.stock || 0),
      String(p.minStock || 0),
      p.isActive ? 'Disponible' : 'Pausado'
    );

    rows.push(row.join(';'));
  }

  // Incluir BOM UTF-8 (\uFEFF) para que Excel lo abra perfecto sin romper tildes
  return '\uFEFF' + rows.join('\r\n');
}

export async function restoreDatabaseFromJson(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('El archivo no contiene un formato de backup válido.');
  }

  let totalRestored = 0;

  if (isSupabaseConfigured && supabase) {
    for (const tableInfo of TABLES_ORDER) {
      const rows = jsonData[tableInfo.name] || [];
      if (rows.length === 0) continue;

      const CHUNK_SIZE = 50;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from(tableInfo.name).upsert(chunk);
        if (error) {
          console.warn(`[backupService] Error restaurando ${tableInfo.name}:`, error.message);
        }
      }
      totalRestored += rows.length;
    }
  }

  return { success: true, totalRestored };
}

