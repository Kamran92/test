import { createRouter, createWebHistory } from 'vue-router'
import catalogRoutes from './modules/catalog/routes'
import authorRoutes from './modules/author/routes'
import topAuthorsRoutes from './modules/top-authors/routes'
import loginRoutes from './modules/login/routes'
import notFoundRoutes from './modules/not-found/routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...catalogRoutes,
    ...authorRoutes,
    ...topAuthorsRoutes,
    ...loginRoutes,
    ...notFoundRoutes,
  ],
})

export default router