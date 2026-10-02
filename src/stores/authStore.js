import { defineStore } from 'pinia';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Usuarios predeterminados para la demo y estructura inicial
    users: [
      {
        id: 'usr-admin',
        fullName: 'Juan Pérez (Propietario)',
        email: 'admin@ferreteria.com',
        role: 'ADMIN',
        pin: '1234',
        isActive: true
      },
      {
        id: 'usr-mgr',
        fullName: 'Martín Gómez (Encargado)',
        email: 'encargado@ferreteria.com',
        role: 'MANAGER',
        pin: '2222',
        isActive: true
      },
      {
        id: 'usr-cashier',
        fullName: 'Ana López (Cajera Turno Mañana)',
        email: 'ana@ferreteria.com',
        role: 'CASHIER',
        pin: '3333',
        isActive: true
      },
      {
        id: 'usr-seller',
        fullName: 'Carlos Ruiz (Vendedor Mostrador)',
        email: 'carlos@ferreteria.com',
        role: 'SELLER',
        pin: '4444',
        isActive: true
      }
    ],
    currentUser: null,
    loading: false,
    error: null
  }),

  getters: {
    userRole: (state) => state.currentUser?.role || 'SELLER',

    // Matriz de Permisos por Rol
    canViewCosts: (state) => ['ADMIN', 'MANAGER'].includes(state.currentUser?.role),
    canEditPrices: (state) => ['ADMIN', 'MANAGER'].includes(state.currentUser?.role),
    canMassUpdatePrices: (state) => ['ADMIN'].includes(state.currentUser?.role),
    canManageUsers: (state) => ['ADMIN'].includes(state.currentUser?.role),
    canCheckoutSale: (state) => ['ADMIN', 'MANAGER', 'CASHIER'].includes(state.currentUser?.role),
    canCreatePreventa: (state) => ['ADMIN', 'MANAGER', 'CASHIER', 'SELLER'].includes(state.currentUser?.role),
    canAdjustStock: (state) => ['ADMIN', 'MANAGER'].includes(state.currentUser?.role),

    roleLabel: (state) => {
      const map = {
        ADMIN: 'Administrador / Dueño',
        MANAGER: 'Encargado de Local',
        CASHIER: 'Cajero / Facturación',
        SELLER: 'Vendedor de Mostrador'
      };
      return map[state.currentUser?.role] || 'Empleado';
    },

    roleColor: (state) => {
      const map = {
        ADMIN: 'purple-darken-2',
        MANAGER: 'indigo',
        CASHIER: 'teal-darken-2',
        SELLER: 'blue-grey'
      };
      return map[state.currentUser?.role] || 'grey';
    }
  },

  actions: {
    initAuth() {
      const savedUser = localStorage.getItem('negostock_current_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
        } catch {
          this.currentUser = this.users[0];
        }
      } else {
        // Por defecto arranca como Admin para configurar todo
        this.currentUser = this.users[0];
      }

      const savedUsersList = localStorage.getItem('negostock_users_list');
      if (savedUsersList) {
        try {
          this.users = JSON.parse(savedUsersList);
        } catch {}
      }
    },

    // Cambio rápido de usuario en el mostrador mediante PIN de 4 dígitos
    loginWithPin(pin) {
      const found = this.users.find(u => u.pin === pin && u.isActive);
      if (found) {
        this.currentUser = found;
        localStorage.setItem('negostock_current_user', JSON.stringify(found));
        return { success: true, user: found };
      }
      return { success: false, error: 'PIN incorrecto o empleado inactivo' };
    },

    switchUser(userId) {
      const found = this.users.find(u => u.id === userId);
      if (found) {
        this.currentUser = found;
        localStorage.setItem('negostock_current_user', JSON.stringify(found));
      }
    },

    addUser(userData) {
      const newUser = {
        id: 'usr-' + Date.now(),
        fullName: userData.fullName,
        email: userData.email,
        role: userData.role || 'SELLER',
        pin: userData.pin || '1111',
        isActive: true
      };

      this.users.push(newUser);
      localStorage.setItem('negostock_users_list', JSON.stringify(this.users));
      return newUser;
    },

    updateUser(userId, updates) {
      const idx = this.users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        this.users[idx] = { ...this.users[idx], ...updates };
        if (this.currentUser?.id === userId) {
          this.currentUser = this.users[idx];
          localStorage.setItem('negostock_current_user', JSON.stringify(this.currentUser));
        }
        localStorage.setItem('negostock_users_list', JSON.stringify(this.users));
      }
    },

    deleteUser(userId) {
      if (this.currentUser?.id === userId) return false;
      this.users = this.users.filter(u => u.id !== userId);
      localStorage.setItem('negostock_users_list', JSON.stringify(this.users));
      return true;
    }
  }
});
