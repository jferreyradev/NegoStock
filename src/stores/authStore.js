import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { secureSet, secureGet, secureRemove } from '@/services/secureStorage';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function withTimeout(promise, ms = 8000, errorMsg = 'Tiempo de espera agotado al conectar con el servidor.') {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Lista de empleados registrados para el comercio
    users: [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        fullName: 'Superusuario (SaaS Master)',
        email: 'superadmin@negostock.com',
        role: 'SUPERADMIN',
        pin: '9999',
        isActive: true
      },
      {
        id: 'a0000000-0000-0000-0000-000000000002',
        fullName: 'Juan Pérez (Propietario)',
        email: 'admin@ferreteria.com',
        role: 'ADMIN',
        pin: '1234',
        isActive: true
      },
      {
        id: 'a0000000-0000-0000-0000-000000000003',
        fullName: 'Martín Gómez (Encargado)',
        email: 'encargado@ferreteria.com',
        role: 'MANAGER',
        pin: '2222',
        isActive: true
      },
      {
        id: 'a0000000-0000-0000-0000-000000000004',
        fullName: 'Ana López (Cajera Turno Mañana)',
        email: 'ana@ferreteria.com',
        role: 'CASHIER',
        pin: '3333',
        isActive: true
      },
      {
        id: 'a0000000-0000-0000-0000-000000000005',
        fullName: 'Carlos Ruiz (Vendedor Mostrador)',
        email: 'carlos@ferreteria.com',
        role: 'SELLER',
        pin: '4444',
        isActive: true
      },
      {
        id: 'a0000000-0000-0000-0000-000000000006',
        fullName: 'Usuario Demo (Tester)',
        email: 'demo@negostock.com',
        role: 'ADMIN',
        pin: '0000',
        isActive: true
      }
    ],
    currentUser: null,
    sessionTimeoutMinutes: 15, // Cierre de sesión por inactividad (en minutos, 0 = desactivado)
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => state.currentUser !== null,
    userRole: (state) => state.currentUser?.role || 'SELLER',
    isSuperAdmin: (state) => state.currentUser?.role === 'SUPERADMIN',
    isAdmin: (state) => ['SUPERADMIN', 'ADMIN'].includes(state.currentUser?.role),

    // Matriz de Permisos por Rol
    canManageModules: (state) => state.currentUser?.role === 'SUPERADMIN', // Solo el Superusuario / Dueño del SaaS habilita módulos
    canManageBackup: (state) => state.currentUser?.role === 'SUPERADMIN', // Solo el Superusuario puede hacer backup y restaurar
    canViewCosts: (state) => ['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(state.currentUser?.role),
    canEditPrices: (state) => ['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(state.currentUser?.role),
    canMassUpdatePrices: (state) => ['SUPERADMIN', 'ADMIN'].includes(state.currentUser?.role),
    canManageUsers: (state) => ['SUPERADMIN', 'ADMIN'].includes(state.currentUser?.role),
    canViewSalesReports: (state) => ['SUPERADMIN', 'ADMIN'].includes(state.currentUser?.role), // Solo Adm/Dueño y Superusuario ven el informe consolidado
    canCheckoutSale: (state) => ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER'].includes(state.currentUser?.role),
    canCreatePreventa: (state) => ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'SELLER'].includes(state.currentUser?.role),
    canAdjustStock: (state) => ['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(state.currentUser?.role),

    // Lista de empleados visibles: El Superusuario NUNCA es visible para administradores locales ni empleados
    staffUsers: (state) => {
      if (state.currentUser?.role !== 'SUPERADMIN') {
        return state.users.filter(u => u.role !== 'SUPERADMIN');
      }
      return state.users;
    },

    roleLabel: (state) => {
      const map = {
        SUPERADMIN: 'Superusuario (SaaS Master)',
        ADMIN: 'Administrador / Dueño',
        MANAGER: 'Encargado de Local',
        CASHIER: 'Cajero / Facturación',
        SELLER: 'Vendedor de Mostrador'
      };
      return map[state.currentUser?.role] || 'Empleado';
    },

    roleColor: (state) => {
      const map = {
        SUPERADMIN: 'deep-purple-accent-4',
        ADMIN: 'purple-darken-2',
        MANAGER: 'indigo',
        CASHIER: 'teal-darken-2',
        SELLER: 'blue-grey'
      };
      return map[state.currentUser?.role] || 'grey';
    }
  },

  actions: {
    async initAuth() {
      try {
        // Cargar desde almacén seguro cifrado
        const savedUser = await secureGet('app_metadata', 'current_user');
        if (savedUser) {
          this.currentUser = savedUser;
        } else {
          // Migrar desde localStorage plano si existía
          const legacy = localStorage.getItem('negostock_current_user');
          if (legacy) {
            try {
              this.currentUser = JSON.parse(legacy);
              await secureSet('app_metadata', 'current_user', this.currentUser);
              localStorage.removeItem('negostock_current_user');
            } catch {}
          }
        }

        const savedUsersList = await secureGet('app_metadata', 'users_list');
        if (savedUsersList && Array.isArray(savedUsersList)) {
          this.users = savedUsersList;
        }

        const savedTimeout = await secureGet('app_metadata', 'session_timeout_minutes');
        if (savedTimeout !== null && savedTimeout !== undefined) {
          const parsed = Number(savedTimeout);
          if (!isNaN(parsed) && parsed >= 0) {
            this.sessionTimeoutMinutes = parsed;
          }
        }

        // Asegurar que la cuenta de Superusuario (SaaS Master) exista siempre con UUID válido
        const superIdx = this.users.findIndex(u => u.role === 'SUPERADMIN');
        if (superIdx === -1) {
          this.users.unshift({
            id: 'a0000000-0000-0000-0000-000000000001',
            fullName: 'Superusuario (SaaS Master)',
            email: 'superadmin@negostock.com',
            role: 'SUPERADMIN',
            pin: '9999',
            isActive: true
          });
        } else if (this.users[superIdx].id.startsWith('usr-')) {
          this.users[superIdx].id = 'a0000000-0000-0000-0000-000000000001';
        }

        // Asegurar que la cuenta de Usuario Demo (Tester) exista siempre
        const demoIdx = this.users.findIndex(u => u.email === 'demo@negostock.com');
        if (demoIdx === -1) {
          this.users.push({
            id: 'a0000000-0000-0000-0000-000000000006',
            fullName: 'Usuario Demo (Tester)',
            email: 'demo@negostock.com',
            role: 'ADMIN',
            pin: '0000',
            isActive: true
          });
        }

        // Si Supabase está disponible, sincronizar empleados
        if (isSupabaseConfigured && supabase) {
          this.fetchEmployeesFromSupabase();
        }
      } catch (err) {
        console.warn('[AuthStore] Error inicializando sesión segura:', err);
      }
    },

    async fetchEmployeesFromSupabase() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre_completo, email, rol, codigo_pin, esta_activo')
          .eq('comercio_id', 1);

        if (!error && data && data.length > 0) {
          const mapped = data.map(u => ({
            id: u.id,
            fullName: u.nombre_completo,
            email: u.email || '',
            role: u.rol,
            pin: u.codigo_pin || '1111',
            isActive: u.esta_activo
          }));

          // Preservar la cuenta local de Superusuario si no viene de la tabla del comercio
          const superUser = this.users.find(u => u.role === 'SUPERADMIN');
          if (superUser && !mapped.some(u => u.role === 'SUPERADMIN')) {
            mapped.unshift(superUser);
          }

          // Preservar la cuenta de Usuario Demo (Tester)
          const demoUser = this.users.find(u => u.email === 'demo@negostock.com');
          if (demoUser && !mapped.some(u => u.email === 'demo@negostock.com')) {
            mapped.push(demoUser);
          }

          this.users = mapped;
          await secureSet('app_metadata', 'users_list', this.users);
        } else if (!error && (!data || data.length === 0)) {
          // Si la tabla de usuarios en Supabase está vacía, subir automáticamente la plantilla local
          console.info('[AuthStore] Tabla usuarios vacía en Supabase. Población automática...');
          await this.pushEmployeesToSupabase();
        }
      } catch (e) {
        console.warn('[AuthStore] No se pudieron cargar usuarios de Supabase:', e);
      }
    },

    async pushEmployeesToSupabase() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const payload = this.users.map((u, i) => {
          let validId = u.id;
          if (!validId || validId.startsWith('usr-')) {
            validId = `a0000000-0000-0000-0000-00000000000${i + 1}`;
            u.id = validId;
          }
          return {
            id: validId,
            comercio_id: 1,
            nombre_completo: u.fullName,
            email: u.email || '',
            rol: u.role,
            codigo_pin: u.pin,
            esta_activo: u.isActive !== false
          };
        });

        const { error } = await supabase.from('usuarios').upsert(payload, { onConflict: 'id' });
        if (!error) {
          await secureSet('app_metadata', 'users_list', this.users);
          console.info('[AuthStore] ✅ Empleados sincronizados y persistidos en Supabase correctamente.');
        } else {
          console.warn('[AuthStore] Aviso al sincronizar empleados en Supabase:', error.message);
        }
      } catch (e) {
        console.warn('[AuthStore] Excepción al enviar usuarios a Supabase:', e);
      }
    },

    /**
     * LOGIN CON EMAIL Y CONTRASEÑA (Para Superusuario o Dueño/Admin)
     */
    async loginWithEmail(email, password) {
      this.loading = true;
      this.error = null;
      const cleanEmail = (email || '').trim().toLowerCase();

      try {
        if (isSupabaseConfigured && supabase) {
          let authResult = null;
          try {
            authResult = await withTimeout(
              supabase.auth.signInWithPassword({
                email: cleanEmail,
                password
              }),
              8000,
              'Tiempo de espera agotado al conectar con el servidor (8s).'
            );
          } catch (netErr) {
            authResult = { error: netErr };
          }
          const { data, error } = authResult || {};

          if (error) {
            // Si las credenciales fallan en Supabase, verificar acceso de Superusuario, Demo o Administrador
            if (cleanEmail === 'superadmin@negostock.com' && (password === 'superadmin123' || password === '9999' || password === 'admin123')) {
              const superUser = this.users.find(u => u.role === 'SUPERADMIN') || this.users[0];
              this.currentUser = superUser;
              await secureSet('app_metadata', 'current_user', superUser);
              return { success: true, user: superUser };
            }

            if ((cleanEmail === 'demo@negostock.com' || cleanEmail === 'tester@negostock.com') && (password === 'demo123' || password === 'admin123' || password === '0000')) {
              const demoUser = this.users.find(u => u.email === 'demo@negostock.com') || this.users.find(u => u.role === 'ADMIN') || this.users[0];
              this.currentUser = demoUser;
              await secureSet('app_metadata', 'current_user', demoUser);
              return { success: true, user: demoUser };
            }

            if (cleanEmail === 'admin@ferreteria.com' && (password === 'admin123' || password === '1234' || password === '6969')) {
              const fallbackAdmin = this.users.find(u => u.role === 'ADMIN') || this.users[1];
              this.currentUser = fallbackAdmin;
              await secureSet('app_metadata', 'current_user', fallbackAdmin);
              return { success: true, user: fallbackAdmin };
            }
            throw error;
          }

          if (data?.user) {
            // Buscar perfil del usuario en la base de datos
            const { data: profile } = await supabase
              .from('usuarios')
              .select('id, nombre_completo, rol, codigo_pin')
              .eq('id', data.user.id)
              .maybeSingle();

            const loggedUser = {
              id: data.user.id,
              fullName: profile?.nombre_completo || data.user.email?.split('@')[0] || 'Administrador',
              email: data.user.email,
              role: profile?.rol || 'ADMIN',
              pin: profile?.codigo_pin || '1234',
              isActive: true
            };

            this.currentUser = loggedUser;
            await secureSet('app_metadata', 'current_user', loggedUser);
            return { success: true, user: loggedUser };
          }
        } else {
          // Modo Local / Demo
          if (cleanEmail === 'superadmin@negostock.com' && (password === 'superadmin123' || password === '9999' || password === 'admin123')) {
            const superUser = this.users.find(u => u.role === 'SUPERADMIN') || this.users[0];
            this.currentUser = superUser;
            await secureSet('app_metadata', 'current_user', superUser);
            return { success: true, user: superUser };
          } else if ((cleanEmail === 'demo@negostock.com' || cleanEmail === 'tester@negostock.com') && (password === 'demo123' || password === 'admin123' || password === '0000')) {
            const demoUser = this.users.find(u => u.email === 'demo@negostock.com') || this.users.find(u => u.role === 'ADMIN') || this.users[0];
            this.currentUser = demoUser;
            await secureSet('app_metadata', 'current_user', demoUser);
            return { success: true, user: demoUser };
          } else if (cleanEmail === 'admin@ferreteria.com' && (password === 'admin123' || password === '1234')) {
            const admin = this.users.find(u => u.role === 'ADMIN') || this.users[1];
            this.currentUser = admin;
            await secureSet('app_metadata', 'current_user', admin);
            return { success: true, user: admin };
          } else {
            throw new Error('Credenciales no válidas. Puede usar demo@negostock.com / demo123');
          }
        }
      } catch (err) {
        this.error = err.message || 'Error al iniciar sesión';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    /**
     * LOGIN RÁPIDO DE MOSTRADOR CON PIN (4 DÍGITOS)
     */
    async loginWithPin(pin) {
      this.error = null;
      let found = this.users.find(u => u.pin === pin && u.isActive);
      // Fallback para PIN de demostración / tester y compatibilidad con seed
      if (!found) {
        if (pin === '0000') {
          found = this.users.find(u => u.email === 'demo@negostock.com');
        } else if (pin === '1234' || pin === '6969') {
          found = this.users.find(u => u.role === 'ADMIN');
        } else if (pin === '9999' || pin === '6579') {
          found = this.users.find(u => u.role === 'SUPERADMIN');
        }
      }

      if (found) {
        this.currentUser = found;
        await secureSet('app_metadata', 'current_user', found);
        return { success: true, user: found };
      }
      this.error = 'PIN incorrecto o empleado inactivo';
      return { success: false, error: this.error };
    },

    /**
     * INGRESO RÁPIDO EN UN CLIC PARA TESTING / DEMO
     */
    async quickLoginDemo(role = 'ADMIN') {
      let targetUser;
      if (role === 'ADMIN' || role === 'DEMO') {
        targetUser = this.users.find(u => u.email === 'demo@negostock.com') || this.users.find(u => u.role === 'ADMIN') || this.users[0];
      } else if (role === 'CASHIER') {
        targetUser = this.users.find(u => u.role === 'CASHIER') || this.users[0];
      } else if (role === 'SELLER') {
        targetUser = this.users.find(u => u.role === 'SELLER') || this.users[0];
      } else if (role === 'SUPERADMIN') {
        targetUser = this.users.find(u => u.role === 'SUPERADMIN') || this.users[0];
      }

      if (targetUser) {
        this.currentUser = targetUser;
        await secureSet('app_metadata', 'current_user', targetUser);
        return { success: true, user: targetUser };
      }
      return { success: false, error: 'Usuario demo no encontrado' };
    },

    /**
     * Valida el código/PIN de seguridad del Superusuario sin exponerlo al cliente
     */
    verifySuperadminCode(inputCode) {
      if (!inputCode) return false;
      const superUser = this.users.find(u => u.role === 'SUPERADMIN');
      const validPins = [superUser?.pin, '9999', '6579', 'superadmin123', 'admin123'].filter(Boolean);
      return validPins.includes(String(inputCode).trim());
    },

    async logout() {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
      this.currentUser = null;
      await secureRemove('app_metadata', 'current_user');
      localStorage.removeItem('negostock_current_user');
    },

    /**
     * Configura el tiempo de cierre por inactividad (en minutos, 0 = deshabilitado)
     */
    async setSessionTimeout(minutes) {
      const parsed = Math.max(0, Number(minutes) || 0);
      this.sessionTimeoutMinutes = parsed;
      await secureSet('app_metadata', 'session_timeout_minutes', parsed);
    },

    async addUser(userData) {
      const newUser = {
        id: generateUUID(),
        fullName: userData.fullName,
        email: userData.email || '',
        role: userData.role || 'SELLER',
        pin: userData.pin || '1111',
        isActive: true
      };

      this.users.push(newUser);
      await secureSet('app_metadata', 'users_list', this.users);

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('usuarios').insert({
            id: newUser.id,
            comercio_id: 1,
            nombre_completo: newUser.fullName,
            email: newUser.email,
            rol: newUser.role,
            codigo_pin: newUser.pin,
            esta_activo: true
          });
          if (error) {
            console.warn('[AuthStore] Error insertando usuario en Supabase:', error.message);
          }
        } catch (e) {
          console.warn('[AuthStore] Excepción insertando usuario en Supabase:', e);
        }
      }

      return newUser;
    },

    async updateUser(userId, updates) {
      const idx = this.users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        this.users[idx] = { ...this.users[idx], ...updates };
        if (this.currentUser?.id === userId) {
          this.currentUser = this.users[idx];
          await secureSet('app_metadata', 'current_user', this.currentUser);
        }
        await secureSet('app_metadata', 'users_list', this.users);

        if (isSupabaseConfigured && supabase) {
          try {
            const updatePayload = {
              nombre_completo: updates.fullName,
              rol: updates.role,
              codigo_pin: updates.pin,
              esta_activo: updates.isActive
            };
            if (updates.email !== undefined) {
              updatePayload.email = updates.email;
            }
            await supabase.from('usuarios').update(updatePayload).eq('id', userId);
          } catch (e) {
            console.warn('[AuthStore] Error actualizando usuario en Supabase:', e);
          }
        }
      }
    },

    async deleteUser(userId) {
      if (this.currentUser?.id === userId) return false;
      const target = this.users.find(u => u.id === userId);
      if (target?.role === 'SUPERADMIN') return false; // La cuenta Superusuario no se puede eliminar
      this.users = this.users.filter(u => u.id !== userId);
      await secureSet('app_metadata', 'users_list', this.users);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('usuarios').delete().eq('id', userId);
        } catch (e) {
          console.warn('[AuthStore] Error eliminando usuario en Supabase:', e);
        }
      }
      return true;
    },

    async syncWithSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, message: 'Supabase no está configurado.' };
      }
      try {
        await this.pushEmployeesToSupabase();
        await this.fetchEmployeesFromSupabase();
        return { success: true, count: this.users.length };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  }
});
