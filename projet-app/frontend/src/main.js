import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

import { useAppStore } from './stores/app'
const store = useAppStore(pinia)
store.fetchWorkflow()
const params = new URLSearchParams(window.location.search)
const brand = params.get('brand')
if (brand) store.setBrand(brand)

app.mount('#app')
