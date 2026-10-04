import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './composables/auth'
import DashboardPage from './pages/DashboardPage.vue'
import EditorPage from './pages/EditorPage.vue'
import HomePage from './pages/HomePage.vue'
import LoginPage from './pages/LoginPage.vue'
import PublicPortfolioPage from './pages/PublicPortfolioPage.vue'
import RegisterPage from './pages/RegisterPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage, meta: { guest: true } },
    { path: '/register', component: RegisterPage, meta: { guest: true } },
    { path: '/dashboard', component: DashboardPage, meta: { auth: true } },
    { path: '/editor/:id', component: EditorPage, meta: { auth: true } },
    { path: '/u/:username/:slug', component: PublicPortfolioPage },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.checkSession()
  if (to.meta.auth && !auth.user.value) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.guest && auth.user.value) return '/dashboard'
})

