import { createRouter, createWebHistory } from 'vue-router';
import PosView from '@/views/PosView.vue';
import InventoryView from '@/views/InventoryView.vue';
import SalesHistoryView from '@/views/SalesHistoryView.vue';
import MassPriceUpdateView from '@/views/MassPriceUpdateView.vue';
import AnomaliesView from '@/views/AnomaliesView.vue';
import UsersView from '@/views/UsersView.vue';
import LoginView from '@/views/LoginView.vue';
import SalesReportsView from '@/views/SalesReportsView.vue';
import QuoteBuilderView from '@/views/QuoteBuilderView.vue';
import { useAuthStore } from '@/stores/authStore';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Iniciar Sesión - NegoStock', public: true }
  },
  {
    path: '/',
    name: 'pos',
    component: PosView,
    meta: { title: 'Punto de Venta (Mostrador)' }
  },
  {
    path: '/armar-presupuesto',
    name: 'quote-builder',
    alias: ['/carrito', '/cotizador'],
    component: QuoteBuilderView,
    meta: { title: 'Armador de Presupuesto y Pedidos - NegoStock' }
  },
  {
    path: '/inventario',
    name: 'inventory',
    component: InventoryView,
    meta: { title: 'Control de Stock e Inventario' }
  },
  {
    path: '/actualizar-precios',
    name: 'mass-price-update',
    component: MassPriceUpdateView,
    meta: { title: 'Actualizador Masivo de Precios', requiresAdmin: true }
  },
  {
    path: '/ventas',
    name: 'sales',
    component: SalesHistoryView,
    meta: { title: 'Comprobantes y Ventas' }
  },
  {
    path: '/reportes-ventas',
    name: 'sales-reports',
    component: SalesReportsView,
    meta: { title: 'Informe y Resumen de Ventas', requiresAdmin: true }
  },
  {
    path: '/auditoria',
    name: 'anomalies',
    component: AnomaliesView,
    meta: { title: 'Auditoría de Planilla' }
  },
  {
    path: '/usuarios',
    name: 'users',
    component: UsersView,
    meta: { title: 'Gestión de Personal y Permisos', requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guardián de Navegación (Protección de Rutas)
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.currentUser) {
    await authStore.initAuth();
  }

  // 1. Si no está autenticado y la ruta no es pública, redirigir a /login
  if (!authStore.isAuthenticated && !to.meta.public) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  // 2. Si ya está autenticado y quiere ingresar a /login, llevarlo al mostrador
  if (authStore.isAuthenticated && to.path === '/login') {
    return next({ path: '/' });
  }

  // 3. Si la ruta requiere ADMIN y el usuario no tiene rol SUPERADMIN ni ADMIN, redirigir al mostrador
  if (to.meta.requiresAdmin && !['SUPERADMIN', 'ADMIN'].includes(authStore.currentUser?.role)) {
    console.warn(`[Router] Acceso denegado a ${to.path} para rol ${authStore.currentUser?.role}`);
    return next({ path: '/' });
  }

  next();
});

export default router;
