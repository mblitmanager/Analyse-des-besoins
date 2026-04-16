import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import axios from 'axios'
import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const app = createApp(App)
const pinia = createPinia()
let isHandlingUnauthorized = false

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      localStorage.getItem('admin_token') &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true

      const auth = useAuthStore(pinia)
      auth.logout()

      if (router.currentRoute.value.path !== '/admin/login') {
        router.push('/admin/login')
      }

      setTimeout(() => {
        isHandlingUnauthorized = false
      }, 0)
    }

    return Promise.reject(error)
  }
)

app.use(pinia)
app.use(router)

async function bootstrap() {
  const store = useAppStore(pinia)
  const auth = useAuthStore(pinia)

  store.fetchWorkflow()
  await auth.init()

  const params = new URLSearchParams(window.location.search)
  const brand = params.get('brand')
  if (brand) store.setBrand(brand)

  app.mount('#app')
}

bootstrap()
