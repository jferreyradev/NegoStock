import { createRouter, createWebHistory } from 'vue-router';
import PosView from '@/views/PosView.vue';
import InventoryView from '@/views/InventoryView.vue';
import SalesHistoryView from '@/views/SalesHistoryView.vue';
import AnomaliesView from '@/views/AnomaliesView.vue';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
