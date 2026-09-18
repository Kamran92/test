import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('./LoginView.vue') },
]

export default routes