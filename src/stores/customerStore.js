import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { syncState } from '@/services/syncQueue';
import { secureGet, secureSet } from '@/services/secureStorage';

export const DEFAULT_CUSTOMER = {
  id: 'cf-default',
  name: 'Consumidor Final',
  nombre: 'Consumidor Final',
  documentType: 'CF',
  documentNumber: '',
  numero_documento: '',
  taxCondition: 'CONSUMIDOR_FINAL',
  condicion_iva: 'CONSUMIDOR_FINAL',
  phone: '',
  telefono: '',
  email: '',
  address: '',
  direccion: '',
  isDefault: true
};

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [
      {
        id: 'cf-default',
        nombre: 'Consumidor Final',
        name: 'Consumidor Final',
        tipo_documento: 'CF',
        documentNumber: '',
        condicion_iva: 'CONSUMIDOR_FINAL',
        taxCondition: 'CONSUMIDOR_FINAL',
        telefono: '',
        email: '',
        direccion: '',
        isDefault: true
      },
      {
        id: 'cli-sample-1',
        nombre: 'Taller Mecánico El Cruce',
        name: 'Taller Mecánico El Cruce',
        tipo_documento: 'CUIT',
        numero_documento: '30-70891234-5',
        documentNumber: '30-70891234-5',
        condicion_iva: 'RESPONSABLE_INSCRIPTO',
        taxCondition: 'RESPONSABLE_INSCRIPTO',
        telefono: '11-4567-8901',
        email: 'tallerelcruce@gmail.com',
        direccion: 'Av. Vergara 2340, Hurlingham'
      },
      {
        id: 'cli-sample-2',
        nombre: 'Construcciones & Reformas San Martín',
        name: 'Construcciones & Reformas San Martín',
        tipo_documento: 'CUIT',
        numero_documento: '30-65432198-7',
        documentNumber: '30-65432198-7',
        condicion_iva: 'MONOTRIBUTO',
        taxCondition: 'MONOTRIBUTO',
        telefono: '11-6789-1234',
        email: 'obras@reformas-sm.com.ar',
        direccion: 'Calle Mitre 450, San Martín'
      },
      {
        id: 'cli-sample-3',
        nombre: 'Carlos Gómez (Instalador Electricista)',
        name: 'Carlos Gómez (Instalador Electricista)',
        tipo_documento: 'DNI',
        numero_documento: '28.456.789',
        documentNumber: '28.456.789',
        condicion_iva: 'CONSUMIDOR_FINAL',
        taxCondition: 'CONSUMIDOR_FINAL',
        telefono: '11-5544-3322',
        email: 'carlos.electricidad@gmail.com',
        direccion: 'Independencia 1120, Morón'
      }
    ],
    selectedCustomer: { ...DEFAULT_CUSTOMER },
    isLoading: false,
    searchQuery: ''
  }),

  getters: {
    filteredCustomers: (state) => {
      const q = (state.searchQuery || '').trim().toLowerCase();
      if (!q) return state.customers;
      return state.customers.filter(c =>
        (c.nombre || c.name || '').toLowerCase().includes(q) ||
        (c.numero_documento || c.documentNumber || '').toLowerCase().includes(q) ||
        (c.telefono || c.phone || '').toLowerCase().includes(q)
      );
    }
  },

  actions: {
    async fetchCustomers() {
      this.isLoading = true;
      try {
        // 1. Cargar desde almacenamiento cifrado local
        const cached = await secureGet('app_metadata', 'customers_list');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.customers = cached;
        }

        // 2. Si Supabase está disponible, consultar en la nube
        if (isSupabaseConfigured && supabase && syncState.isOnline) {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('comercio_id', 1)
            .eq('esta_activo', true)
            .order('nombre', { ascending: true });

          if (!error && data && data.length > 0) {
            const mapped = data.map(c => ({
              id: c.id,
              nombre: c.nombre,
              name: c.nombre,
              tipo_documento: c.tipo_documento || 'DNI',
              documentType: c.tipo_documento || 'DNI',
              numero_documento: c.numero_documento || '',
              documentNumber: c.numero_documento || '',
              condicion_iva: c.condicion_iva || 'CONSUMIDOR_FINAL',
              taxCondition: c.condicion_iva || 'CONSUMIDOR_FINAL',
              telefono: c.telefono || '',
              phone: c.telefono || '',
              email: c.email || '',
              direccion: c.direccion || '',
              address: c.direccion || '',
              saldo_cuenta_corriente: c.saldo_cuenta_corriente || 0
            }));

            // Asegurar que Consumidor Final siempre esté primero
            this.customers = [
              DEFAULT_CUSTOMER,
              ...mapped.filter(m => m.nombre.toLowerCase() !== 'consumidor final')
            ];
            await secureSet('app_metadata', 'customers_list', this.customers);
          }
        }
      } catch (err) {
        console.warn('[customerStore] Error al cargar clientes:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async addCustomer(customerData) {
      this.isLoading = true;
      try {
        const localId = 'cli-' + Date.now();
        const newCustomer = {
          id: localId,
          nombre: customerData.nombre.trim(),
          name: customerData.nombre.trim(),
          tipo_documento: customerData.tipo_documento || 'DNI',
          documentType: customerData.tipo_documento || 'DNI',
          numero_documento: customerData.numero_documento?.trim() || '',
          documentNumber: customerData.numero_documento?.trim() || '',
          condicion_iva: customerData.condicion_iva || 'CONSUMIDOR_FINAL',
          taxCondition: customerData.condicion_iva || 'CONSUMIDOR_FINAL',
          telefono: customerData.telefono?.trim() || '',
          phone: customerData.telefono?.trim() || '',
          email: customerData.email?.trim() || '',
          direccion: customerData.direccion?.trim() || '',
          address: customerData.direccion?.trim() || '',
          saldo_cuenta_corriente: 0,
          isDefault: false
        };

        // Si hay Supabase en línea, insertar en la nube
        if (isSupabaseConfigured && supabase && syncState.isOnline) {
          const { data, error } = await supabase
            .from('clientes')
            .insert({
              comercio_id: 1,
              nombre: newCustomer.nombre,
              tipo_documento: newCustomer.tipo_documento,
              numero_documento: newCustomer.numero_documento,
              condicion_iva: newCustomer.condicion_iva,
              telefono: newCustomer.telefono,
              email: newCustomer.email,
              direccion: newCustomer.direccion,
              esta_activo: true
            })
            .select()
            .single();

          if (!error && data) {
            newCustomer.id = data.id;
          }
        }

        this.customers.unshift(newCustomer);
        await secureSet('app_metadata', 'customers_list', this.customers);
        this.selectedCustomer = { ...newCustomer };
        return { success: true, customer: newCustomer };
      } catch (err) {
        console.error('[customerStore] Error agregando cliente:', err);
        return { success: false, error: err.message };
      } finally {
        this.isLoading = false;
      }
    },

    selectCustomer(cust) {
      if (!cust) {
        this.resetToDefault();
        return;
      }
      this.selectedCustomer = {
        id: cust.id,
        name: cust.nombre || cust.name || 'Consumidor Final',
        nombre: cust.nombre || cust.name || 'Consumidor Final',
        documentType: cust.tipo_documento || cust.documentType || 'CF',
        documentNumber: cust.numero_documento || cust.documentNumber || '',
        taxCondition: cust.condicion_iva || cust.taxCondition || 'CONSUMIDOR_FINAL',
        condicion_iva: cust.condicion_iva || cust.taxCondition || 'CONSUMIDOR_FINAL',
        phone: cust.telefono || cust.phone || '',
        email: cust.email || '',
        address: cust.direccion || cust.address || '',
        isDefault: cust.isDefault || false
      };
    },

    resetToDefault() {
      this.selectedCustomer = { ...DEFAULT_CUSTOMER };
    }
  }
});
