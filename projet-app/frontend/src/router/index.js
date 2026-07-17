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
      path: '/mise-a-niveau',
      name: 'mise-a-niveau',
      component: () => import('../views/MiseANiveauView.vue')
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
      path: '/mentions-legales',
      name: 'legal-mentions',
      component: () => import('../views/LegalMentionsView.vue')
    },
    {
      path: '/respect-vie-privee',
      name: 'privacy-policy',
      component: () => import('../views/PrivacyPolicyView.vue')
    },
    {
      path: '/politique-confidentialite',
      name: 'confidentiality-policy',
      component: () => import('../views/ConfidentialityPolicyView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => import('../views/DocsView.vue')
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/LoginView.vue')
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'), // I will create this
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard'
        },
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
          path: 'workflow',
          name: 'admin-workflow',
          component: () => import('../views/admin/WorkflowManagerView.vue')
        },
        {
          path: 'parcours',
          name: 'admin-parcours',
          component: () => import('../views/admin/ParcoursManagerView.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/AdminUsersView.vue')
        },
        {
          path: 'question-rules',
          name: 'admin-question-rules',
          component: () => import('../views/admin/QuestionRulesManagerView.vue')
        },
        {
          path: 'p3-rules',
          name: 'admin-p3-rules',
          component: () => import('../views/admin/P3FilterRulesManagerView.vue')
        },
        {
          path: 'p3-override',
          name: 'admin-p3-override',
          component: () => import('../views/admin/P3OverrideConfigView.vue')
        },
        {
          path: 'email-templates',
          name: 'admin-email-templates',
          component: () => import('../views/admin/EmailTemplatesManagerView.vue')
        },
        {
          path: 'mail-config',
          name: 'admin-mail-config',
          component: () => import('../views/admin/MailConfigView.vue')
        },
        {
          path: 'test-validation',
          name: 'admin-test-validation',
          component: () => import('../views/admin/TestValidationView.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  // Routes admin : accès uniquement avec token ET si la navigation vient d'une URL directe
  // (from.name === null = navigation directe par URL, pas depuis l'app)
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      // Pas de token → login
      next('/admin/login')
    } else if (from.name !== null && !from.path.startsWith('/admin')) {
      // Navigation depuis l'app publique vers l'admin → interdite
      // L'admin n'est accessible que par saisie directe de l'URL
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
