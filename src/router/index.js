import { createRouter, createWebHistory } from 'vue-router';
import PosView from '@/views/PosView.vue';
import InventoryView from '@/views/InventoryView.vue';
import SalesHistoryView from '@/views/SalesHistoryView.vue';
import MassPriceUpdateView from '@/views/MassPriceUpdateView.vue';
import AnomaliesView from '@/views/AnomaliesView.vue';
import UsersView from '@/views/UsersView.vue';

const routes = [
  {
    path: '/',
    name: 'pos',
    component: PosView,
    meta: { title: 'Punto de Venta (Mostrador)' }
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
    meta: { title: 'Actualizador Masivo de Precios' }
  },
  {
    path: '/ventas',
    name: 'sales',
    component: SalesHistoryView,
    meta: { title: 'Comprobantes y Ventas' }
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
    meta: { title: 'Gestión de Personal y Permisos' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
