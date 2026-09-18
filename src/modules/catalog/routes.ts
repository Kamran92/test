import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'catalog', component: () => import('./CatalogView.vue') },
]

export default routes