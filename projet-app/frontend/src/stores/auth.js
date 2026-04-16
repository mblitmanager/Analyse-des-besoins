import { defineStore } from 'pinia'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || null,
    user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    async login(email, password) {
      try {
        const response = await axios.post(`${apiBaseUrl}/auth/login`, { email, password })
        this.token = response.data.access_token
        this.user = response.data.user
        
        localStorage.setItem('admin_token', this.token)
        localStorage.setItem('admin_user', JSON.stringify(this.user))
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        return true
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      delete axios.defaults.headers.common['Authorization']
    },
    async init() {
      if (!this.token) {
        return false
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

      try {
        const response = await axios.get(`${apiBaseUrl}/auth/me`)
        this.user = response.data
        localStorage.setItem('admin_user', JSON.stringify(this.user))
        return true
      } catch (error) {
        this.logout()
        return false
      }
    }
  }
})
