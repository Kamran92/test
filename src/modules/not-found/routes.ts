import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./NotFoundView.vue') },
]

export default routes