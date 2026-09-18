import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/authors/:id', name: 'author', component: () => import('./AuthorView.vue'), props: true },
]

export default routes