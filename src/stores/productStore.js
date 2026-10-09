import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import initialSeed from '@/data/seedData.json';
import {
  secureSet,
  secureGet,
  secureGetAll,
  secureRemove,
  secureClear
} from '@/services/secureStorage';
import { useSyncModeStore } from './syncModeStore';
import { useAuthStore } from './authStore';
import { syncState } from '@/services/syncQueue';

async function getOrCreateCategory(comercioId, catName) {
  if (!catName || !isSupabaseConfigured || !supabase) return null;
  try {
    const clean = catName.trim().toUpperCase();
    const { data: existing } = await supabase
      .from('categorias')
      .select('id')
      .eq('comercio_id', comercioId)
      .ilike('nombre', clean)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('categorias')
      .insert({ comercio_id: comercioId, nombre: clean })
      .select('id')
      .single();

    return created ? created.id : null;
  } catch {
    return null;
  }
}

async function getOrCreateBrand(comercioId, brandName) {
  if (!brandName || !isSupabaseConfigured || !supabase) return null;
  try {
    const clean = brandName.trim().toUpperCase();
    const { data: existing } = await supabase
      .from('marcas')
      .select('id')
      .eq('comercio_id', comercioId)
      .ilike('nombre', clean)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('marcas')
      .insert({ comercio_id: comercioId, nombre: clean })
      .select('id')
      .single();

    return created ? created.id : null;
  } catch {
    return null;
  }
}

async function getOrCreateUnit(comercioId, unitAbbr) {
  if (!unitAbbr || !isSupabaseConfigured || !supabase) return null;
  try {
    const clean = unitAbbr.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('unidades_medida')
      .select('id')
      .eq('comercio_id', comercioId)
      .ilike('abreviatura', clean)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('unidades_medida')
      .insert({ comercio_id: comercioId, nombre: clean.toUpperCase(), abreviatura: clean })
      .select('id')
      .single();

    return created ? created.id : null;
  } catch {
    return null;
  }
}

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    categories: ['TODOS'],
    brands: ['TODAS'],
    anomalies: initialSeed.anomalies || [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedCategory: null,
    filterOnlyLowStock: false,
    filterAvailability: 'TODOS', // 'TODOS', 'DISPONIBLES', 'NO_DISPONIBLES'
  }),

  getters: {
    // Productos disponibles para venta en mostrador (con existencia y activos)
    availableProducts: (state) => {
      return state.products.filter(p => p.isActive !== false && Number(p.stock) > 0);
    },

    outOfStockCount: (state) => {
      return state.products.filter(p => p.isActive === false || Number(p.stock) <= 0).length;
    },

    filteredProducts: (state) => {
      let list = state.products;

      // Filtro de disponibilidad
      if (state.filterAvailability === 'DISPONIBLES') {
        list = list.filter(p => p.isActive !== false && Number(p.stock) > 0);
      } else if (state.filterAvailability === 'NO_DISPONIBLES') {
        list = list.filter(p => p.isActive === false || Number(p.stock) <= 0);
      }

      if (state.selectedCategory && state.selectedCategory !== 'TODOS') {
        list = list.filter(p => p.dept === state.selectedCategory);
      }

      if (state.filterOnlyLowStock) {
        list = list.filter(p => Number(p.stock) <= Number(p.minStock));
      }

      if (state.searchQuery && state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase().trim();
        list = list.filter(p => 
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.barcode && p.barcode.toLowerCase().includes(query)) ||
          (p.brand && p.brand.toLowerCase().includes(query))
        );
      }

      return list;
    },

    lowStockCount: (state) => {
      return state.products.filter(p => p.isActive !== false && Number(p.stock) <= Number(p.minStock)).length;
    },

    inactiveProductsCount: (state) => {
      return state.products.filter(p => p.isActive === false).length;
    },

    totalInventoryValue: (state) => {
      return state.products
        .filter(p => p.isActive !== false)
        .reduce((acc, p) => acc + (Number(p.costPrice) * Number(p.stock)), 0);
    },

    totalSalesValue: (state) => {
      return state.products
        .filter(p => p.isActive !== false)
        .reduce((acc, p) => acc + (Number(p.sellingPrice) * Number(p.stock)), 0);
    }
  },

  actions: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;

      try {
        let loadedFromSupabase = false;

        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('productos')
              .select(`
                id, codigo_sku, codigo_barras, nombre, descripcion, precio_costo, margen_ganancia,
                precio_venta, precio_mayoreo, alicuota_iva, stock_actual, stock_minimo, esta_activo,
                categorias ( nombre ),
                marcas ( nombre ),
                unidades_medida ( abreviatura )
              `)
              .eq('comercio_id', 1)
              .order('nombre');

            if (!error && data) {
              if (data.length > 0) {
                this.products = data.map(p => ({
                  id: p.id,
                  sku: p.codigo_sku,
                  barcode: p.codigo_barras || '',
                  name: p.nombre,
                  description: p.descripcion || '',
                  costPrice: Number(p.precio_costo || 0),
                  margin: Number(p.margen_ganancia || 100),
                  sellingPrice: Number(p.precio_venta || 0),
                  wholesalePrice: Number(p.precio_mayoreo || 0),
                  ivaRate: Number(p.alicuota_iva || 21),
                  stock: Number(p.stock_actual || 0),
                  minStock: Number(p.stock_minimo || 0),
                  isActive: p.esta_activo !== false,
                  dept: p.categorias?.nombre || 'GENERAL',
                  brand: p.marcas?.nombre || 'GENÉRICO',
                  unit: p.unidades_medida?.abreviatura || 'u'
                }));
                loadedFromSupabase = true;
                await secureSet('app_metadata', 'catalog_is_cleared', false);
                await this.cacheAllProductsToSecureStorage();
              } else {
                // Supabase respondió con 0 filas: el ambiente remoto está vacío o recién creado
                this.products = [];
                loadedFromSupabase = true;
                await secureClear('products_catalog');
                await secureSet('app_metadata', 'catalog_is_cleared', true);
              }
            }
          } catch (supErr) {
            console.warn('[ProductStore] Falla conectando a Supabase. Cargando caché cifrada local:', supErr);
          }
        }

        if (!loadedFromSupabase) {
          // Cargar desde almacén seguro cifrado IndexedDB
          const isCleared = await secureGet('app_metadata', 'catalog_is_cleared');
          const cachedProds = await secureGetAll('products_catalog');
          if (cachedProds && cachedProds.length > 0) {
            this.products = cachedProds.map(p => ({
              ...p,
              isActive: p.isActive !== false
            }));
          } else if (isCleared) {
            // El usuario limpió intencionalmente el catálogo para comenzar desde cero
            this.products = [];
          } else {
            // Semilla inicial
            this.products = initialSeed.products.map((p, idx) => ({
              id: 'local-' + (idx + 1),
              description: '',
              margin: 100,
              ivaRate: 21,
              isActive: true,
              ...p
            }));
            await this.cacheAllProductsToSecureStorage();
          }
        }

        // Actualizar listas dinámicas de categorías y marcas
        this.refreshCategoriesAndBrands();

      } catch (err) {
        console.error('Error cargando productos:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    refreshCategoriesAndBrands() {
      const depts = new Set(this.products.map(p => p.dept).filter(Boolean));
      this.categories = ['TODOS', ...Array.from(depts).sort()];

      const brands = new Set(this.products.map(p => p.brand).filter(Boolean));
      this.brands = ['TODAS', ...Array.from(brands).sort()];
    },

    async cacheAllProductsToSecureStorage() {
      try {
        for (const p of this.products) {
          await secureSet('products_catalog', p.id, p);
        }
      } catch (err) {
        console.warn('[ProductStore] Error cacheando productos de forma segura:', err);
      }
    },

    /**
     * ALTA DE PRODUCTO (NUEVO ARTÍCULO)
     */
    async createProduct(productData) {
      this.loading = true;
      try {
        const sku = productData.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;
        const name = productData.name?.trim();
        const costPrice = Number(productData.costPrice || 0);
        const margin = Number(productData.margin || 100);
        const sellingPrice = Number(productData.sellingPrice || (costPrice * (1 + margin / 100)));
        const wholesalePrice = Number(productData.wholesalePrice || 0);
        const stock = Number(productData.stock || 0);
        const minStock = Number(productData.minStock || 0);
        const ivaRate = Number(productData.ivaRate || 21);
        const isActive = productData.isActive !== false;
        const dept = (productData.dept || 'GENERAL').trim().toUpperCase();
        const brand = (productData.brand || 'GENÉRICO').trim().toUpperCase();
        const unit = (productData.unit || 'u').trim().toLowerCase();

        const syncModeStore = useSyncModeStore();
        let newId = `local-${Date.now()}`;

        const basePayload = {
          comercio_id: 1,
          codigo_sku: sku,
          codigo_barras: productData.barcode?.trim() || null,
          nombre: name,
          descripcion: productData.description?.trim() || null,
          precio_costo: costPrice,
          margen_ganancia: margin,
          precio_venta: sellingPrice,
          precio_mayoreo: wholesalePrice,
          alicuota_iva: ivaRate,
          stock_actual: stock,
          stock_minimo: minStock,
          esta_activo: isActive
        };

        if (syncModeStore.isLocalOnly) {
          // MODO LOCAL: Guardar en cola de pendientes de productos y continuar localmente
          await syncModeStore.enqueueProductChange('CREATE', basePayload);
          console.log(`[ProductStore] Producto "${name}" guardado en MODO LOCAL para sincronizar luego.`);
        } else if (syncModeStore.isOnlineOnly) {
          // MODO SÓLO EN LÍNEA: Requiere Supabase obligatoriamente
          if (!isSupabaseConfigured || !supabase) {
            throw new Error('Modo "Sólo en Línea" activo: Supabase no está configurado.');
          }

          const [catId, brandId, unitId] = await Promise.all([
            getOrCreateCategory(1, dept),
            getOrCreateBrand(1, brand),
            getOrCreateUnit(1, unit)
          ]);

          const insertPayload = {
            ...basePayload,
            categoria_id: catId,
            marca_id: brandId,
            unidad_id: unitId
          };

          const { data, error } = await supabase
            .from('productos')
            .insert(insertPayload)
            .select('id')
            .single();

          if (error) throw error;
          if (data) newId = data.id;

          const authStore = useAuthStore();
          const opName = authStore.currentUser?.fullName || 'Administrador';
          const opRole = authStore.currentUser?.role || 'ADMIN';
          const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

          if (stock > 0) {
            await supabase.from('stock_movimientos').insert({
              comercio_id: 1,
              producto_id: newId,
              tipo_movimiento: 'INICIAL',
              cantidad: stock,
              saldo_posterior: stock,
              costo_unitario: costPrice,
              notas: `Stock inicial por alta de producto [por ${operatorBadge}]`
            });
          }

          await supabase.from('precios_historial').insert({
            comercio_id: 1,
            producto_id: newId,
            costo_anterior: costPrice,
            costo_nuevo: costPrice,
            venta_anterior: sellingPrice,
            venta_nueva: sellingPrice,
            mayoreo_anterior: wholesalePrice,
            mayoreo_nuevo: wholesalePrice,
            motivo_cambio: 'MANUAL',
            usuario_nombre: operatorBadge
          });
        } else {
          // MODO AUTOMÁTICO (HÍBRIDO): Intenta nube; si falla, encola offline
          let uploaded = false;
          if (isSupabaseConfigured && supabase) {
            try {
              const [catId, brandId, unitId] = await Promise.all([
                getOrCreateCategory(1, dept),
                getOrCreateBrand(1, brand),
                getOrCreateUnit(1, unit)
              ]);

              const insertPayload = {
                ...basePayload,
                categoria_id: catId,
                marca_id: brandId,
                unidad_id: unitId
              };

              const { data, error } = await supabase
                .from('productos')
                .insert(insertPayload)
                .select('id')
                .single();

              if (!error && data) {
                newId = data.id;
                uploaded = true;

                const authStore = useAuthStore();
                const opName = authStore.currentUser?.fullName || 'Administrador';
                const opRole = authStore.currentUser?.role || 'ADMIN';
                const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

                if (stock > 0) {
                  await supabase.from('stock_movimientos').insert({
                    comercio_id: 1,
                    producto_id: newId,
                    tipo_movimiento: 'INICIAL',
                    cantidad: stock,
                    saldo_posterior: stock,
                    costo_unitario: costPrice,
                    notas: `Stock inicial por alta de producto [por ${operatorBadge}]`
                  });
                }

                await supabase.from('precios_historial').insert({
                  comercio_id: 1,
                  producto_id: newId,
                  costo_anterior: costPrice,
                  costo_nuevo: costPrice,
                  venta_anterior: sellingPrice,
                  venta_nueva: sellingPrice,
                  mayoreo_anterior: wholesalePrice,
                  mayoreo_nuevo: wholesalePrice,
                  motivo_cambio: 'MANUAL',
                  usuario_nombre: operatorBadge
                });
              }
            } catch (err) {
              console.warn('[ProductStore] Falla al conectar a Supabase en modo automático. Encolando producto...', err);
            }
          }

          if (!uploaded) {
            await syncModeStore.enqueueProductChange('CREATE', basePayload);
          }
        }

        const authStore = useAuthStore();
        const opName = authStore.currentUser?.fullName || 'Administrador';
        const opRole = authStore.currentUser?.role || 'ADMIN';
        const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

        const newProduct = {
          id: newId,
          sku,
          barcode: productData.barcode?.trim() || '',
          name,
          description: productData.description?.trim() || '',
          costPrice,
          margin,
          sellingPrice,
          wholesalePrice,
          ivaRate,
          stock,
          minStock,
          isActive,
          dept,
          brand,
          unit,
          createdBy: {
            id: authStore.currentUser?.id,
            name: opName,
            role: opRole,
            at: new Date().toISOString()
          }
        };

        this.products.unshift(newProduct);
        this.refreshCategoriesAndBrands();
        await secureSet('products_catalog', newId, newProduct);

        // Guardar registro en historial local
        await this.logLocalPriceChange(newId, 0, costPrice, 0, sellingPrice, 'ALTA_PRODUCTO', operatorBadge);
        if (stock > 0) {
          await this.logLocalStockMovement(newId, 'INICIAL', stock, stock, `Stock inicial por alta de producto [por ${operatorBadge}]`, operatorBadge);
        }

        return { success: true, product: newProduct };
      } catch (err) {
        console.error('Error creando producto:', err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * MODIFICACIÓN DE PRODUCTO EXISTENTE CON HISTORIAL
     */
    async updateProduct(productId, updates) {
      this.loading = true;
      try {
        const idx = this.products.findIndex(p => p.id === productId);
        if (idx === -1) throw new Error('Producto no encontrado');

        const prev = this.products[idx];
        const costPrice = updates.costPrice !== undefined ? Number(updates.costPrice) : prev.costPrice;
        const margin = updates.margin !== undefined ? Number(updates.margin) : prev.margin;
        const sellingPrice = updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : prev.sellingPrice;
        const wholesalePrice = updates.wholesalePrice !== undefined ? Number(updates.wholesalePrice) : prev.wholesalePrice;
        const stock = updates.stock !== undefined ? Number(updates.stock) : prev.stock;
        const minStock = updates.minStock !== undefined ? Number(updates.minStock) : prev.minStock;
        const ivaRate = updates.ivaRate !== undefined ? Number(updates.ivaRate) : prev.ivaRate;
        const isActive = updates.isActive !== undefined ? updates.isActive : prev.isActive;
        const dept = updates.dept ? updates.dept.trim().toUpperCase() : prev.dept;
        const brand = updates.brand ? updates.brand.trim().toUpperCase() : prev.brand;
        const unit = updates.unit ? updates.unit.trim().toLowerCase() : prev.unit;

        const pricesChanged = prev.costPrice !== costPrice || prev.sellingPrice !== sellingPrice || prev.wholesalePrice !== wholesalePrice;
        const stockChanged = prev.stock !== stock;

        const syncModeStore = useSyncModeStore();

        const updatePayload = {
          codigo_sku: updates.sku !== undefined ? updates.sku.trim() : prev.sku,
          codigo_barras: updates.barcode !== undefined ? (updates.barcode.trim() || null) : (prev.barcode || null),
          nombre: updates.name !== undefined ? updates.name.trim() : prev.name,
          descripcion: updates.description !== undefined ? (updates.description.trim() || null) : (prev.description || null),
          precio_costo: costPrice,
          margen_ganancia: margin,
          precio_venta: sellingPrice,
          precio_mayoreo: wholesalePrice,
          alicuota_iva: ivaRate,
          stock_actual: stock,
          stock_minimo: minStock,
          esta_activo: isActive,
          actualizado_en: new Date().toISOString()
        };

        if (syncModeStore.isLocalOnly) {
          // MODO LOCAL: Encolar cambio para sincronización por lote posterior
          await syncModeStore.enqueueProductChange('UPDATE', { id: productId, updates: updatePayload });
          console.log(`[ProductStore] Modificación de "${prev.name}" encolada en MODO LOCAL.`);
        } else if (syncModeStore.isOnlineOnly) {
          // MODO SÓLO EN LÍNEA: Obligatorio Supabase
          if (!isSupabaseConfigured || !supabase || productId.startsWith('local-')) {
            throw new Error('Modo "Sólo en Línea" activo: No se puede actualizar en la nube (verifique conexión con Supabase).');
          }

          const [catId, brandId, unitId] = await Promise.all([
            getOrCreateCategory(1, dept),
            getOrCreateBrand(1, brand),
            getOrCreateUnit(1, unit)
          ]);
          updatePayload.categoria_id = catId;
          updatePayload.marca_id = brandId;
          updatePayload.unidad_id = unitId;

          const { data: updatedRows, error } = await supabase
            .from('productos')
            .update(updatePayload)
            .eq('id', productId)
            .select();

          if (error) throw error;
          if (!updatedRows || updatedRows.length === 0) {
            throw new Error('Supabase no permitió actualizar el artículo (bloqueo RLS). Ejecutá el script desbloquear_escritura_supabase.sql en el SQL Editor.');
          }

          const authStore = useAuthStore();
          const opName = authStore.currentUser?.fullName || 'Administrador';
          const opRole = authStore.currentUser?.role || 'ADMIN';
          const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

          if (pricesChanged) {
            await supabase.from('precios_historial').insert({
              comercio_id: 1,
              producto_id: productId,
              costo_anterior: prev.costPrice,
              costo_nuevo: costPrice,
              venta_anterior: prev.sellingPrice,
              venta_nueva: sellingPrice,
              mayoreo_anterior: prev.wholesalePrice,
              mayoreo_nuevo: wholesalePrice,
              motivo_cambio: 'MANUAL',
              usuario_nombre: operatorBadge
            });
          }

          if (stockChanged) {
            const diff = stock - prev.stock;
            await supabase.from('stock_movimientos').insert({
              comercio_id: 1,
              producto_id: productId,
              tipo_movimiento: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
              cantidad: diff,
              saldo_posterior: stock,
              costo_unitario: costPrice,
              notas: updates.stockReason
                ? `${updates.stockReason} [por ${operatorBadge}]`
                : `Ajuste desde edición de artículo [por ${operatorBadge}]`
            });
          }
        } else {
          // MODO AUTOMÁTICO (HÍBRIDO): Intenta nube; si falla, encola offline
          let uploaded = false;
          if (isSupabaseConfigured && supabase && !productId.startsWith('local-')) {
            try {
              const [catId, brandId, unitId] = await Promise.all([
                getOrCreateCategory(1, dept),
                getOrCreateBrand(1, brand),
                getOrCreateUnit(1, unit)
              ]);
              updatePayload.categoria_id = catId;
              updatePayload.marca_id = brandId;
              updatePayload.unidad_id = unitId;

              const { data: updatedRows, error } = await supabase
                .from('productos')
                .update(updatePayload)
                .eq('id', productId)
                .select();

              if (!error && updatedRows && updatedRows.length > 0) {
                uploaded = true;

                const authStore = useAuthStore();
                const opName = authStore.currentUser?.fullName || 'Administrador';
                const opRole = authStore.currentUser?.role || 'ADMIN';
                const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

                if (pricesChanged) {
                  await supabase.from('precios_historial').insert({
                    comercio_id: 1,
                    producto_id: productId,
                    costo_anterior: prev.costPrice,
                    costo_nuevo: costPrice,
                    venta_anterior: prev.sellingPrice,
                    venta_nueva: sellingPrice,
                    mayoreo_anterior: prev.wholesalePrice,
                    mayoreo_nuevo: wholesalePrice,
                    motivo_cambio: 'MANUAL',
                    usuario_nombre: operatorBadge
                  });
                }

                if (stockChanged) {
                  const diff = stock - prev.stock;
                  await supabase.from('stock_movimientos').insert({
                    comercio_id: 1,
                    producto_id: productId,
                    tipo_movimiento: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
                    cantidad: diff,
                    saldo_posterior: stock,
                    costo_unitario: costPrice,
                    notas: updates.stockReason
                      ? `${updates.stockReason} [por ${operatorBadge}]`
                      : `Ajuste desde edición de artículo [por ${operatorBadge}]`
                  });
                }
              }
            } catch (err) {
              console.warn('[ProductStore] Falla al actualizar en nube en modo automático. Encolando...', err);
            }
          }

          if (!uploaded) {
            await syncModeStore.enqueueProductChange('UPDATE', { id: productId, updates: updatePayload });
          }
        }

        const authStore = useAuthStore();
        const opName = authStore.currentUser?.fullName || 'Administrador';
        const opRole = authStore.currentUser?.role || 'ADMIN';
        const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

        // Registrar en historial local cifrado
        if (pricesChanged) {
          await this.logLocalPriceChange(productId, prev.costPrice, costPrice, prev.sellingPrice, sellingPrice, updates.priceReason || 'MODIFICACION_FICHA', operatorBadge);
        }
        if (stockChanged) {
          const diff = stock - prev.stock;
          const noteText = updates.stockReason
            ? `${updates.stockReason} [por ${operatorBadge}]`
            : `Ajuste desde edición de artículo [por ${operatorBadge}]`;
          await this.logLocalStockMovement(productId, diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO', diff, stock, noteText, operatorBadge);
        }

        const updatedProduct = {
          ...prev,
          ...updates,
          costPrice,
          margin,
          sellingPrice,
          wholesalePrice,
          stock,
          minStock,
          ivaRate,
          isActive,
          dept,
          brand,
          unit,
          lastModifiedBy: {
            id: authStore.currentUser?.id,
            name: opName,
            role: opRole,
            at: new Date().toISOString()
          }
        };

        this.products.splice(idx, 1, updatedProduct);
        this.refreshCategoriesAndBrands();
        await secureSet('products_catalog', productId, updatedProduct);

        return { success: true, product: updatedProduct };
      } catch (err) {
        console.error('Error actualizando producto:', err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * CAMBIAR DISPONIBILIDAD (DISPONIBLE / NO DISPONIBLE)
     * No hay borrado físico: el artículo simplemente se pausa o se reactiva.
     */
    async toggleProductAvailability(productId) {
      const prod = this.products.find(p => p.id === productId);
      if (!prod) return { success: false, error: 'Producto no encontrado' };

      const newStatus = !prod.isActive;
      const syncModeStore = useSyncModeStore();

      if (syncModeStore.isLocalOnly) {
        // MODO LOCAL
        await syncModeStore.enqueueProductChange('TOGGLE_AVAILABILITY', { id: productId, isActive: newStatus });
      } else if (syncModeStore.isOnlineOnly) {
        // MODO SÓLO EN LÍNEA
        if (!isSupabaseConfigured || !supabase || productId.startsWith('local-')) {
          return { success: false, error: 'Modo "Sólo en Línea" activo: No se puede conectar con Supabase.' };
        }
        try {
          const { data: updatedRows, error } = await supabase
            .from('productos')
            .update({ esta_activo: newStatus, actualizado_en: new Date().toISOString() })
            .eq('id', productId)
            .select();

          if (error) throw error;
          if (!updatedRows || updatedRows.length === 0) {
            return { success: false, error: 'Supabase no permitió actualizar la disponibilidad (bloqueo RLS). Ejecutá el script desbloquear_escritura_supabase.sql.' };
          }
        } catch (e) {
          return { success: false, error: e.message };
        }
      } else {
        // MODO AUTOMÁTICO (HÍBRIDO)
        let uploaded = false;
        if (isSupabaseConfigured && supabase && !productId.startsWith('local-')) {
          try {
            const { data: updatedRows, error } = await supabase
              .from('productos')
              .update({ esta_activo: newStatus, actualizado_en: new Date().toISOString() })
              .eq('id', productId)
              .select();

            if (!error && updatedRows && updatedRows.length > 0) {
              uploaded = true;
            }
          } catch (e) {
            console.warn('[ProductStore] Falla al actualizar disponibilidad en nube. Encolando...', e);
          }
        }
        if (!uploaded) {
          await syncModeStore.enqueueProductChange('TOGGLE_AVAILABILITY', { id: productId, isActive: newStatus });
        }
      }

      const authStore = useAuthStore();
      prod.isActive = newStatus;
      prod.lastModifiedBy = {
        id: authStore.currentUser?.id,
        name: authStore.currentUser?.fullName || 'Administrador',
        role: authStore.currentUser?.role || 'ADMIN',
        at: new Date().toISOString()
      };
      await secureSet('products_catalog', prod.id, prod);
      return { success: true, isActive: newStatus, name: prod.name };
    },

    /**
     * OBTENER HISTORIA COMPLETA DE UN ARTÍCULO (PRECIOS Y KARDEX DE STOCK)
     */
    async fetchProductHistory(productId) {
      let priceHistory = [];
      let stockHistory = [];

      // 1. Consultar Supabase si está disponible
      if (isSupabaseConfigured && supabase && !productId.startsWith('local-')) {
        try {
          const [pRes, sRes] = await Promise.all([
            supabase
              .from('precios_historial')
              .select('id, costo_anterior, costo_nuevo, venta_anterior, venta_nueva, mayoreo_anterior, mayoreo_nuevo, motivo_cambio, usuario_nombre, creado_en')
              .eq('producto_id', productId)
              .order('creado_en', { ascending: false }),
            supabase
              .from('stock_movimientos')
              .select('id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, notas, creado_en')
              .eq('producto_id', productId)
              .order('creado_en', { ascending: false })
          ]);

          if (pRes.data && pRes.data.length > 0) priceHistory = pRes.data;
          if (sRes.data && sRes.data.length > 0) stockHistory = sRes.data;
        } catch (e) {
          console.warn('[ProductStore] Error consultando historial en Supabase:', e);
        }
      }

      // 2. Si no hay en Supabase o estamos offline, consultar almacén seguro local
      if (priceHistory.length === 0) {
        const localPrices = await secureGet('app_metadata', `hist_precios_${productId}`);
        if (localPrices) priceHistory = localPrices;
      }
      if (stockHistory.length === 0) {
        const localStock = await secureGet('app_metadata', `hist_stock_${productId}`);
        if (localStock) stockHistory = localStock;
      }

      return { priceHistory, stockHistory };
    },

    async logLocalPriceChange(productId, oldCost, newCost, oldSelling, newSelling, reason, operatorName = null) {
      try {
        const authStore = useAuthStore();
        const userName = operatorName || `${authStore.currentUser?.fullName || 'Administrador'} (${authStore.roleLabel || authStore.currentUser?.role || 'ADMIN'})`;
        const key = `hist_precios_${productId}`;
        const existing = (await secureGet('app_metadata', key)) || [];
        existing.unshift({
          id: 'p-hist-' + Date.now(),
          costo_anterior: oldCost,
          costo_nuevo: newCost,
          venta_anterior: oldSelling,
          venta_nueva: newSelling,
          motivo_cambio: reason,
          usuario_nombre: userName,
          creado_en: new Date().toISOString()
        });
        await secureSet('app_metadata', key, existing);
      } catch {}
    },

    async logLocalStockMovement(productId, tipo, cantidad, saldo, notas, operatorName = null) {
      try {
        const authStore = useAuthStore();
        const userName = operatorName || `${authStore.currentUser?.fullName || 'Operador'} (${authStore.roleLabel || authStore.currentUser?.role || 'CASHIER'})`;
        const key = `hist_stock_${productId}`;
        const existing = (await secureGet('app_metadata', key)) || [];
        existing.unshift({
          id: 's-hist-' + Date.now(),
          tipo_movimiento: tipo,
          cantidad,
          saldo_posterior: saldo,
          notas,
          usuario_nombre: userName,
          creado_en: new Date().toISOString()
        });
        await secureSet('app_metadata', key, existing);
      } catch {}
    },

    async updateStock(productId, newStock, movementType = 'AJUSTE', customNotes = null) {
      const prod = this.products.find(p => p.id === productId);
      if (!prod) return;

      const authStore = useAuthStore();
      const opName = `${authStore.currentUser?.fullName || 'Encargado'} (${authStore.roleLabel || authStore.currentUser?.role || 'MANAGER'})`;

      const parsedStock = Math.max(0, Number(newStock));
      const diff = parsedStock - prod.stock;
      prod.stock = parsedStock;

      // REGLA FUNDAMENTAL: Si se acaba el stock, pasa a no disponible sin stock.
      // Si entra mercadería (> 0), vuelve a estar disponible automáticamente.
      // NUNCA SE ELIMINA EL PRODUCTO.
      if (prod.stock <= 0) {
        prod.isActive = false;
      } else {
        prod.isActive = true;
      }

      prod.lastModifiedBy = {
        id: authStore.currentUser?.id,
        name: authStore.currentUser?.fullName,
        role: authStore.currentUser?.role,
        at: new Date().toISOString()
      };
      await secureSet('products_catalog', prod.id, prod);

      const noteText = customNotes || `Ajuste rápido de stock (${movementType}) [por ${opName}]`;

      // Registrar Kardex local
      await this.logLocalStockMovement(
        productId,
        movementType || (diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO'),
        diff,
        prod.stock,
        noteText,
        opName
      );

      if (isSupabaseConfigured && supabase && !productId.startsWith('local-')) {
        await supabase
          .from('productos')
          .update({ stock_actual: prod.stock, esta_activo: prod.isActive })
          .eq('id', productId);

        await supabase
          .from('stock_movimientos')
          .insert({
            comercio_id: 1,
            producto_id: productId,
            tipo_movimiento: movementType || (diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO'),
            cantidad: diff,
            saldo_posterior: prod.stock,
            notas: noteText
          });
      }
    },

    async adjustStock(productId, newStock, movementType = 'AJUSTE', customNotes = null) {
      return this.updateStock(productId, newStock, movementType, customNotes);
    },

    async deductStockForSale(items, saleId = null) {
      const authStore = useAuthStore();
      const opName = `${authStore.currentUser?.fullName || 'Cajero'} (${authStore.roleLabel || authStore.currentUser?.role || 'CASHIER'})`;

      for (const item of items) {
        const prod = this.products.find(p => p.id === item.id || p.sku === item.sku);
        if (prod) {
          prod.stock = Math.max(0, Number(prod.stock) - Number(item.quantity));

          // Si el stock llega a 0, pasa automáticamente a NO DISPONIBLE (nunca se borra)
          if (prod.stock <= 0) {
            prod.isActive = false;
          }

          await secureSet('products_catalog', prod.id, prod);
          await this.logLocalStockMovement(
            prod.id,
            'VENTA',
            -item.quantity,
            prod.stock,
            `Venta mostrador #${saleId || 'local'} [por ${opName}]`,
            opName
          );
        }
      }

      if (isSupabaseConfigured && supabase) {
        for (const item of items) {
          const prod = this.products.find(p => p.id === item.id || p.sku === item.sku);
          if (prod && !prod.id.startsWith('local-')) {
            await supabase.from('productos').update({
              stock_actual: prod.stock,
              esta_activo: prod.isActive
            }).eq('id', prod.id);

            await supabase.from('stock_movimientos').insert({
              comercio_id: 1,
              producto_id: prod.id,
              tipo_movimiento: 'VENTA',
              cantidad: -item.quantity,
              saldo_posterior: prod.stock,
              referencia_id: saleId?.startsWith('sale-offline') ? null : saleId,
              notas: `Venta mostrador #${saleId || 'local'} [por ${opName}]`
            });
          }
        }
      }
    },

    /**
     * ACTUALIZADOR MASIVO DE PRECIOS POR INFLACIÓN CON HISTORIAL
     */
    async applyMassPriceUpdate({ category, brand, percentage, target = 'selling', rounding = 0 }) {
      const authStore = useAuthStore();
      const opName = `${authStore.currentUser?.fullName || 'Administrador'} (${authStore.roleLabel || authStore.currentUser?.role || 'ADMIN'})`;

      const factor = 1 + (percentage / 100);
      let updatedCount = 0;
      const roundValue = (val) => {
        if (!rounding || rounding <= 0) return Math.round(val * 100) / 100;
        return Math.ceil(val / rounding) * rounding;
      };

      for (const prod of this.products) {
        const matchesCategory = !category || category === 'TODOS' || prod.dept === category;
        const matchesBrand = !brand || brand === 'TODAS' || prod.brand === brand;

        if (matchesCategory && matchesBrand) {
          updatedCount++;
          const oldCost = prod.costPrice;
          const oldSelling = prod.sellingPrice;

          if (target === 'cost_and_selling') {
            prod.costPrice = roundValue(prod.costPrice * factor);
            const margin = oldCost > 0 ? (prod.sellingPrice / oldCost) : 2;
            prod.sellingPrice = roundValue(prod.costPrice * margin);
            if (prod.wholesalePrice > 0) {
              prod.wholesalePrice = roundValue(prod.wholesalePrice * factor);
            }
          } else if (target === 'selling') {
            prod.sellingPrice = roundValue(prod.sellingPrice * factor);
            if (prod.wholesalePrice > 0) {
              prod.wholesalePrice = roundValue(prod.wholesalePrice * factor);
            }
          } else if (target === 'cost_only') {
            prod.costPrice = roundValue(prod.costPrice * factor);
          }

          prod.lastModifiedBy = {
            id: authStore.currentUser?.id,
            name: authStore.currentUser?.fullName,
            role: authStore.currentUser?.role,
            at: new Date().toISOString()
          };

          await secureSet('products_catalog', prod.id, prod);
          await this.logLocalPriceChange(
            prod.id,
            oldCost,
            prod.costPrice,
            oldSelling,
            prod.sellingPrice,
            `AUMENTO_MASIVO_${percentage}%`,
            opName
          );
        }
      }

      if (isSupabaseConfigured && supabase && updatedCount > 0) {
        try {
          await supabase.rpc('actualizar_precios_masivo', {
            p_comercio_id: 1,
            p_categoria_nombre: category === 'TODOS' ? null : category,
            p_marca_nombre: brand === 'TODAS' ? null : brand,
            p_porcentaje: percentage,
            p_criterio: target,
            p_redondeo: rounding
          });
        } catch (e) {
          console.error('Error aplicando actualización masiva en Supabase:', e);
        }
      }

      return { updatedCount };
    },

    /**
     * VACIAR COMPLETAMENTE EL CATÁLOGO DE PRODUCTOS (REINICIO LIMPIO)
     */
    async clearProductsCatalog({ clearSales = false, clearHistory = true } = {}) {
      this.loading = true;
      try {
        this.products = [];
        this.categories = ['TODOS'];
        this.brands = ['TODAS'];

        // Limpiar almacén seguro IndexedDB cifrado
        await secureClear('products_catalog');
        await secureSet('app_metadata', 'catalog_is_cleared', true);

        if (clearSales) {
          await secureClear('sales_queue');
        }

        // Si Supabase está conectado, eliminar de la tabla remota
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('productos').delete().eq('comercio_id', 1);
          } catch (supErr) {
            console.warn('[ProductStore] Aviso eliminando productos en Supabase:', supErr);
          }
        }

        return { success: true };
      } catch (err) {
        console.error('[ProductStore] Error vaciando catálogo:', err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * IMPORTACIÓN MASIVA DE PRODUCTOS (DESDE EXCEL / CSV)
     */
    async importProductsBatch(items, { updateExisting = true, replaceAll = false } = {}) {
      if (!items || items.length === 0) {
        return { success: false, error: 'No se recibieron productos para importar.' };
      }

      this.loading = true;

      if (replaceAll) {
        await this.clearProductsCatalog({ clearSales: false, clearHistory: false });
      }
      let createdCount = 0;
      let updatedCount = 0;

      const authStore = useAuthStore();
      const opName = authStore.currentUser?.fullName || 'Administrador';
      const opRole = authStore.currentUser?.role || 'ADMIN';
      const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

      try {
        // Pre-cargar y mapear categorías, marcas y unidades en memoria para rendimiento óptimo
        const catMap = new Map();
        const brandMap = new Map();
        const unitMap = new Map();

        if (isSupabaseConfigured && supabase) {
          try {
            const { data: cData } = await supabase.from('categorias').select('id, nombre').eq('comercio_id', 1);
            cData?.forEach(c => catMap.set(c.nombre.toUpperCase(), c.id));

            const { data: bData } = await supabase.from('marcas').select('id, nombre').eq('comercio_id', 1);
            bData?.forEach(b => brandMap.set(b.nombre.toUpperCase(), b.id));

            const { data: uData } = await supabase.from('unidades_medida').select('id, abreviatura').eq('comercio_id', 1);
            uData?.forEach(u => unitMap.set(u.abreviatura.toLowerCase(), u.id));

            // Asegurar creación de categorías necesarias en Supabase
            const distinctCats = [...new Set(items.map(it => (it.dept || 'GENERAL').trim().toUpperCase()))];
            for (const catName of distinctCats) {
              if (catName && !catMap.has(catName)) {
                const id = await getOrCreateCategory(1, catName);
                if (id) catMap.set(catName, id);
              }
            }

            // Asegurar creación de marcas necesarias en Supabase
            const distinctBrands = [...new Set(items.map(it => (it.brand || 'GENÉRICO').trim().toUpperCase()))];
            for (const brandName of distinctBrands) {
              if (brandName && !brandMap.has(brandName)) {
                const id = await getOrCreateBrand(1, brandName);
                if (id) brandMap.set(brandName, id);
              }
            }

            // Asegurar creación de unidades necesarias en Supabase
            const distinctUnits = [...new Set(items.map(it => (it.unit || 'u').trim().toLowerCase()))];
            for (const unitAbbr of distinctUnits) {
              if (unitAbbr && !unitMap.has(unitAbbr)) {
                const id = await getOrCreateUnit(1, unitAbbr);
                if (id) unitMap.set(unitAbbr, id);
              }
            }
          } catch (metaErr) {
            console.warn('[ProductStore] Falla precargando metadatos para importación:', metaErr);
          }
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const skuClean = item.sku ? item.sku.trim() : '';

          // 1. Buscar si ya existe por SKU
          let existingIdx = -1;
          if (skuClean) {
            existingIdx = this.products.findIndex(
              p => p.sku && p.sku.toLowerCase().trim() === skuClean.toLowerCase()
            );
          }

          if (existingIdx !== -1 && updateExisting) {
            // Actualizar producto existente
            const prod = this.products[existingIdx];
            const oldCost = prod.costPrice;
            const oldSelling = prod.sellingPrice;

            if (item.name) prod.name = item.name.trim();
            if (item.barcode) prod.barcode = item.barcode.trim();
            if (item.dept) prod.dept = item.dept.trim().toUpperCase();
            if (item.brand) prod.brand = item.brand.trim().toUpperCase();
            if (item.unit) prod.unit = item.unit.trim().toLowerCase();

            if (item.costPrice > 0) prod.costPrice = item.costPrice;
            if (item.margin > 0) prod.margin = item.margin;
            if (item.sellingPrice > 0) prod.sellingPrice = item.sellingPrice;
            if (item.wholesalePrice > 0) prod.wholesalePrice = item.wholesalePrice;
            if (item.stock !== undefined && item.stock !== null && !isNaN(item.stock)) {
              prod.stock = Number(item.stock);
            }
            if (item.minStock !== undefined && item.minStock !== null && !isNaN(item.minStock)) {
              prod.minStock = Number(item.minStock);
            }
            if (item.ivaRate > 0) prod.ivaRate = item.ivaRate;
            prod.isActive = true;

            await secureSet('products_catalog', prod.id, prod);

            if (oldCost !== prod.costPrice || oldSelling !== prod.sellingPrice) {
              await this.logLocalPriceChange(
                prod.id,
                oldCost,
                prod.costPrice,
                oldSelling,
                prod.sellingPrice,
                'IMPORTACION_EXCEL',
                operatorBadge
              );
            }

            updatedCount++;
          } else {
            // Crear nuevo producto
            const finalSku = skuClean || `SKU-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;
            const newId = `local-${Date.now()}-${i}`;
            const costPrice = Number(item.costPrice || 0);
            const margin = Number(item.margin || 100);
            const sellingPrice = Number(item.sellingPrice || (costPrice > 0 ? Math.round(costPrice * (1 + margin / 100)) : 0));
            const wholesalePrice = Number(item.wholesalePrice || 0);
            const stock = Number(item.stock || 0);
            const minStock = Number(item.minStock || 0);
            const ivaRate = Number(item.ivaRate || 21);

            const newProd = {
              id: newId,
              sku: finalSku,
              barcode: item.barcode?.trim() || '',
              name: item.name.trim(),
              description: item.description?.trim() || '',
              costPrice,
              margin,
              sellingPrice,
              wholesalePrice,
              stock,
              minStock,
              ivaRate,
              isActive: true,
              dept: (item.dept || 'GENERAL').trim().toUpperCase(),
              brand: (item.brand || 'GENÉRICO').trim().toUpperCase(),
              unit: (item.unit || 'u').trim().toLowerCase(),
              createdBy: {
                id: authStore.currentUser?.id,
                name: opName,
                role: opRole,
                at: new Date().toISOString()
              }
            };

            this.products.unshift(newProd);
            await secureSet('products_catalog', newId, newProd);

            if (stock > 0) {
              await this.logLocalStockMovement(
                newId,
                'INICIAL',
                stock,
                stock,
                `Stock inicial por importación Excel [por ${operatorBadge}]`,
                operatorBadge
              );
            }

            createdCount++;
          }
        }

        // Marcar que el catálogo ya contiene datos válidos
        await secureSet('app_metadata', 'catalog_is_cleared', false);

        // Actualizar categorías y marcas dinámicas
        this.refreshCategoriesAndBrands();

        // Si Supabase está disponible, sincronizar lote importado en la nube con las FKs resueltas
        let cloudSynced = false;
        if (isSupabaseConfigured && supabase) {
          try {
            const supabaseBatch = this.products.map(p => ({
              comercio_id: 1,
              codigo_sku: p.sku,
              codigo_barras: p.barcode || null,
              nombre: p.name,
              descripcion: p.description || null,
              categoria_id: catMap.get((p.dept || 'GENERAL').trim().toUpperCase()) || null,
              marca_id: brandMap.get((p.brand || 'GENÉRICO').trim().toUpperCase()) || null,
              unidad_id: unitMap.get((p.unit || 'u').trim().toLowerCase()) || null,
              precio_costo: Number(p.costPrice || 0),
              margen_ganancia: Number(p.margin || 100),
              precio_venta: Number(p.sellingPrice || 0),
              precio_mayoreo: Number(p.wholesalePrice || 0),
              stock_actual: Number(p.stock || 0),
              stock_minimo: Number(p.minStock || 0),
              alicuota_iva: Number(p.ivaRate || 21),
              esta_activo: p.isActive !== false
            }));

            const initialMovements = [];

            for (let chunkIdx = 0; chunkIdx < supabaseBatch.length; chunkIdx += 50) {
              const chunk = supabaseBatch.slice(chunkIdx, chunkIdx + 50);
              const { data: upsertedRows, error: upsertErr } = await supabase
                .from('productos')
                .upsert(chunk, { onConflict: 'comercio_id,codigo_sku' })
                .select('id, codigo_sku, stock_actual, precio_costo');

              if (upsertErr) {
                console.error('[ProductStore] Error subiendo lote a Supabase:', upsertErr.message);
                break;
              }

              // Mapear los IDs generados por Supabase de vuelta a this.products
              if (upsertedRows && upsertedRows.length > 0) {
                for (const row of upsertedRows) {
                  const target = this.products.find(p => p.sku === row.codigo_sku);
                  if (target) {
                    target.id = row.id;
                  }
                  if (Number(row.stock_actual) > 0) {
                    initialMovements.push({
                      comercio_id: 1,
                      producto_id: row.id,
                      tipo_movimiento: 'INICIAL',
                      cantidad: Number(row.stock_actual),
                      saldo_posterior: Number(row.stock_actual),
                      costo_unitario: Number(row.precio_costo || 0),
                      notas: `Stock inicial por importación [por ${operatorBadge}]`
                    });
                  }
                }
              }
            }

            // Registrar movimientos de stock inicial en Supabase
            if (initialMovements.length > 0) {
              for (let sIdx = 0; sIdx < initialMovements.length; sIdx += 50) {
                const sChunk = initialMovements.slice(sIdx, sIdx + 50);
                await supabase.from('stock_movimientos').insert(sChunk);
              }
            }

            cloudSynced = true;
          } catch (supBatchErr) {
            console.warn('[ProductStore] Falla sincronizando lote con Supabase:', supBatchErr);
          }
        }

        // Re-guardar réplica en IndexedDB con los IDs definitivos
        await this.cacheAllProductsToSecureStorage();

        return {
          success: true,
          createdCount,
          updatedCount,
          total: items.length,
          cloudSynced
        };
      } catch (err) {
        console.error('[ProductStore] Error en importProductsBatch:', err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * SUBIR / SINCRONIZAR CATÁLOGO LOCAL COMPLETO HACIA SUPABASE
     * Toma todos los productos actualmente cargados en memoria o IndexedDB,
     * resuelve y crea las categorías, marcas y unidades en Supabase,
     * e inserta/actualiza todos los productos en public.productos con sus relaciones.
     * Al terminar, actualiza los IDs de Supabase en IndexedDB.
     */
    async syncCatalogToCloud() {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase no está configurado o no hay credenciales.' };
      }

      // Asegurar tener los productos cargados
      if (!this.products || this.products.length === 0) {
        const cached = await secureGetAll('products_catalog');
        if (cached && cached.length > 0) {
          this.products = cached;
        } else {
          return { success: false, error: 'No hay productos en el catálogo local para sincronizar.' };
        }
      }

      this.loading = true;
      try {
        const authStore = useAuthStore();
        const opName = authStore.currentUser?.fullName || 'Administrador';
        const opRole = authStore.currentUser?.role || 'ADMIN';
        const operatorBadge = `${opName} (${authStore.roleLabel || opRole})`;

        const catMap = new Map();
        const brandMap = new Map();
        const unitMap = new Map();

        const { data: cData } = await supabase.from('categorias').select('id, nombre').eq('comercio_id', 1);
        cData?.forEach(c => catMap.set(c.nombre.toUpperCase(), c.id));

        const { data: bData } = await supabase.from('marcas').select('id, nombre').eq('comercio_id', 1);
        bData?.forEach(b => brandMap.set(b.nombre.toUpperCase(), b.id));

        const { data: uData } = await supabase.from('unidades_medida').select('id, abreviatura').eq('comercio_id', 1);
        uData?.forEach(u => unitMap.set(u.abreviatura.toLowerCase(), u.id));

        // 1. Asegurar categorías en Supabase
        const distinctCats = [...new Set(this.products.map(it => (it.dept || 'GENERAL').trim().toUpperCase()))];
        for (const catName of distinctCats) {
          if (catName && !catMap.has(catName)) {
            const id = await getOrCreateCategory(1, catName);
            if (id) catMap.set(catName, id);
          }
        }

        // 2. Asegurar marcas en Supabase
        const distinctBrands = [...new Set(this.products.map(it => (it.brand || 'GENÉRICO').trim().toUpperCase()))];
        for (const brandName of distinctBrands) {
          if (brandName && !brandMap.has(brandName)) {
            const id = await getOrCreateBrand(1, brandName);
            if (id) brandMap.set(brandName, id);
          }
        }

        // 3. Asegurar unidades en Supabase
        const distinctUnits = [...new Set(this.products.map(it => (it.unit || 'u').trim().toLowerCase()))];
        for (const unitAbbr of distinctUnits) {
          if (unitAbbr && !unitMap.has(unitAbbr)) {
            const id = await getOrCreateUnit(1, unitAbbr);
            if (id) unitMap.set(unitAbbr, id);
          }
        }

        // 4. Preparar payload para Supabase
        const supabaseBatch = this.products.map(p => ({
          comercio_id: 1,
          codigo_sku: p.sku,
          codigo_barras: p.barcode || null,
          nombre: p.name,
          descripcion: p.description || null,
          categoria_id: catMap.get((p.dept || 'GENERAL').trim().toUpperCase()) || null,
          marca_id: brandMap.get((p.brand || 'GENÉRICO').trim().toUpperCase()) || null,
          unidad_id: unitMap.get((p.unit || 'u').trim().toLowerCase()) || null,
          precio_costo: Number(p.costPrice || 0),
          margen_ganancia: Number(p.margin || 100),
          precio_venta: Number(p.sellingPrice || 0),
          precio_mayoreo: Number(p.wholesalePrice || 0),
          stock_actual: Number(p.stock || 0),
          stock_minimo: Number(p.minStock || 0),
          alicuota_iva: Number(p.ivaRate || 21),
          esta_activo: p.isActive !== false
        }));

        let syncedRowsCount = 0;
        const initialMovements = [];

        for (let chunkIdx = 0; chunkIdx < supabaseBatch.length; chunkIdx += 50) {
          const chunk = supabaseBatch.slice(chunkIdx, chunkIdx + 50);
          const { data: upsertedRows, error: upsertErr } = await supabase
            .from('productos')
            .upsert(chunk, { onConflict: 'comercio_id,codigo_sku' })
            .select('id, codigo_sku, stock_actual, precio_costo');

          if (upsertErr) {
            console.error('[ProductStore] Error subiendo lote a Supabase:', upsertErr.message);
            throw new Error(`Error en lote: ${upsertErr.message}`);
          }

          if (upsertedRows && upsertedRows.length > 0) {
            syncedRowsCount += upsertedRows.length;
            for (const row of upsertedRows) {
              const target = this.products.find(p => p.sku === row.codigo_sku);
              if (target) {
                target.id = row.id;
              }
              if (Number(row.stock_actual) > 0) {
                initialMovements.push({
                  comercio_id: 1,
                  producto_id: row.id,
                  tipo_movimiento: 'INICIAL',
                  cantidad: Number(row.stock_actual),
                  saldo_posterior: Number(row.stock_actual),
                  costo_unitario: Number(row.precio_costo || 0),
                  notas: `Stock inicial por sincronización con la nube [por ${operatorBadge}]`
                });
              }
            }
          }
        }

        // 5. Registrar movimientos de stock inicial si no existen
        if (initialMovements.length > 0) {
          try {
            for (let sIdx = 0; sIdx < initialMovements.length; sIdx += 50) {
              const sChunk = initialMovements.slice(sIdx, sIdx + 50);
              await supabase.from('stock_movimientos').insert(sChunk);
            }
          } catch (smErr) {
            console.warn('[ProductStore] Aviso insertando stock_movimientos iniciales:', smErr);
          }
        }

        // 6. Re-guardar réplica en IndexedDB con los IDs definitivos
        await this.cacheAllProductsToSecureStorage();
        await secureSet('app_metadata', 'catalog_is_cleared', false);

        return {
          success: true,
          syncedCount: syncedRowsCount,
          total: this.products.length
        };
      } catch (err) {
        console.error('[ProductStore] Error en syncCatalogToCloud:', err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    }
  }
});
