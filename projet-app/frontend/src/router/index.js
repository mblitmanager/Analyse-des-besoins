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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
