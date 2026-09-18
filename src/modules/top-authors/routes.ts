import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/top-authors', name: 'top-authors', component: () => import('./TopAuthorsView.vue') },
]

export default routes