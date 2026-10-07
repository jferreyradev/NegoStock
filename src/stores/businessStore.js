import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { syncState } from '@/services/syncQueue';
import { secureGet, secureSet } from '@/services/secureStorage';

export const useBusinessStore = defineStore('business', {
  state: () => ({
    comercio: {
      id: 1,
      nombre: 'Ferretería Central',
      razonSocial: 'Ferretería Central S.R.L.',
      cuit: '30-71234567-9',
      iibb: '901-123456-7',
      condicionIva: 'RESPONSABLE_INSCRIPTO',
      inicioActividades: '01/03/2018',
      direccion: 'Av. San Martín 1240, Morón, Buenos Aires',
      telefono: '011-4567-8900',
      email: 'contacto@ferreteriacentral.com.ar',
      puntoVenta: 1,
      tipoImpresora: '80mm', // 80mm o 58mm
      pieTicket: 'Comprobante no válido como factura fiscal',
      mensajeAgradecimiento: '¡Gracias por su compra!',
      logoUrl: ''
    },
    isLoading: false
  }),

  getters: {
    nombreComercial: (state) => state.comercio.nombre || 'Mi Comercio',
    cuitFormateado: (state) => state.comercio.cuit || 'Sin CUIT',
    condicionIvaLabel: (state) => {
      const mapa = {
        'RESPONSABLE_INSCRIPTO': 'IVA Responsable Inscripto',
        'MONOTRIBUTO': 'Responsable Monotributo',
        'EXENTO': 'IVA Exento',
        'CONSUMIDOR_FINAL': 'Consumidor Final'
      };
      return mapa[state.comercio.condicionIva] || state.comercio.condicionIva;
    },
    encabezadoTicket: (state) => ({
      nombre: state.comercio.nombre,
      razonSocial: state.comercio.razonSocial,
      cuit: state.comercio.cuit,
      iibb: state.comercio.iibb,
      condicionIva: state.comercio.condicionIva,
      direccion: state.comercio.direccion,
      telefono: state.comercio.telefono
    })
  },

  actions: {
    async initBusiness() {
      this.isLoading = true;
      try {
        // 1. Cargar desde almacenamiento cifrado local IndexedDB
        let cached = await secureGet('app_metadata', 'business_config');

        // 1b. Fallback de contingencia: si el salt cambió o IndexedDB falló, recuperar de localStorage
        if (!cached || typeof cached !== 'object') {
          try {
            const rawBackup = localStorage.getItem('negostock_business_config_backup');
            if (rawBackup) {
              const parsedBackup = JSON.parse(rawBackup);
              if (parsedBackup && typeof parsedBackup === 'object') {
                cached = parsedBackup;
                // Re-sincronizar en IndexedDB con la clave actual
                await secureSet('app_metadata', 'business_config', cached);
              }
            }
          } catch (e) {
            console.warn('[businessStore] Advertencia leyendo backup local de comercio:', e);
          }
        }

        if (cached && typeof cached === 'object') {
          this.comercio = { ...this.comercio, ...cached };
        }

        // 2. Intentar refrescar desde Supabase si hay conexión
        if (isSupabaseConfigured && supabase && syncState.isOnline) {
          const { data, error } = await supabase
            .from('comercios')
            .select('*')
            .eq('id', this.comercio.id || 1)
            .maybeSingle();

          if (!error && data) {
            this.comercio = {
              ...this.comercio,
              id: data.id,
              nombre: data.nombre || this.comercio.nombre,
              razonSocial: data.razon_social || this.comercio.razonSocial,
              cuit: data.cuit || this.comercio.cuit,
              iibb: data.iibb || this.comercio.iibb,
              condicionIva: data.condicion_iva || this.comercio.condicionIva,
              direccion: data.direccion || this.comercio.direccion,
              telefono: data.telefono || this.comercio.telefono,
              email: data.email || this.comercio.email,
              logoUrl: data.logo_url || this.comercio.logoUrl
            };
            await secureSet('app_metadata', 'business_config', this.comercio);
            try {
              localStorage.setItem('negostock_business_config_backup', JSON.stringify(this.comercio));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('[businessStore] Advertencia al sincronizar datos del comercio:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async updateBusiness(nuevosDatos) {
      this.isLoading = true;
      let cloudSynced = false;
      let cloudError = null;

      try {
        this.comercio = { ...this.comercio, ...nuevosDatos };

        // 1. Guardar local seguro en IndexedDB cifrado
        await secureSet('app_metadata', 'business_config', this.comercio);

        // 2. Guardar copia de seguridad redundante en localStorage
        try {
          localStorage.setItem('negostock_business_config_backup', JSON.stringify(this.comercio));
        } catch (storageErr) {
          console.warn('[businessStore] No se pudo escribir copia espejo en localStorage:', storageErr);
        }

        // 3. Si hay Supabase, actualizar en la base de datos en la nube
        if (isSupabaseConfigured && supabase && syncState.isOnline) {
          const dbPayload = {
            id: this.comercio.id || 1,
            nombre: this.comercio.nombre,
            razon_social: this.comercio.razonSocial,
            cuit: this.comercio.cuit,
            iibb: this.comercio.iibb,
            condicion_iva: this.comercio.condicionIva,
            direccion: this.comercio.direccion,
            telefono: this.comercio.telefono,
            email: this.comercio.email,
            logo_url: this.comercio.logoUrl,
            actualizado_en: new Date().toISOString()
          };

          const { error } = await supabase
            .from('comercios')
            .upsert(dbPayload, { onConflict: 'id' });

          if (error) {
            console.warn('[businessStore] Aviso al guardar en Supabase (verificar RLS):', error);
            cloudError = error.message;
          } else {
            cloudSynced = true;
          }
        }

        return { success: true, cloudSynced, cloudError };
      } catch (error) {
        console.error('[businessStore] Error crítico actualizando negocio:', error);
        return { success: false, error: error.message };
      } finally {
        this.isLoading = false;
      }
    }
  }
});
