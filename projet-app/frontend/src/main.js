import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import axios from 'axios'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'
const store = useAppStore(pinia)
const auth = useAuthStore(pinia)
store.fetchWorkflow()
auth.init()
const params = new URLSearchParams(window.location.search)
const brand = params.get('brand')
if (brand) store.setBrand(brand)

app.mount('#app')
