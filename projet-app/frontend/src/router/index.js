import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/prerequis',
      name: 'prerequis',
      component: () => import('../views/PrerequisView.vue')
    },
    {
      path: '/formations',
      name: 'formations',
      component: () => import('../views/FormationSelectionView.vue')
    },
    {
      path: '/positionnement',
      name: 'positionnement',
      component: () => import('../views/PositionnementView.vue')
    },
    {
      path: '/resultats',
      name: 'resultats',
      component: () => import('../views/ResultatsView.vue')
    },
    {
      path: '/complementary',
      name: 'complementary',
      component: () => import('../views/ComplementaryQuestionsView.vue')
    },
    {
      path: '/availabilities',
      name: 'availabilities',
      component: () => import('../views/AvailabilitiesView.vue')
    },
    {
      path: '/validation',
      name: 'validation',
      component: () => import('../views/FinalValidationView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/LoginView.vue')
    },
    {
      path: '/admin/signup',
      name: 'admin-signup',
      component: () => import('../views/admin/SignupView.vue')
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'), // I will create this
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('../views/admin/DashboardView.vue')
        },
        {
          path: 'sessions',
          name: 'admin-sessions',
          component: () => import('../views/admin/SessionsListView.vue')
        },
        {
          path: 'questions',
          name: 'admin-questions',
          component: () => import('../views/admin/QuestionsManagerView.vue')
        },
        {
          path: 'contacts',
          name: 'admin-contacts',
          component: () => import('../views/admin/ContactsManagerView.vue')
        },
        {
          path: 'formations',
          name: 'admin-formations',
          component: () => import('../views/admin/FormationsManagerView.vue')
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('../views/admin/SettingsManagerView.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/AdminUsersView.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/admin/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
