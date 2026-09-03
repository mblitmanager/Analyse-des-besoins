import { defineStore } from 'pinia'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export const useAuthStore = defineStore('auth', {
  state: () => {
    // Restore from localStorage immediately on store creation
    const token = localStorage.getItem('admin_token')
    const userStr = localStorage.getItem('admin_user')
    let user = null
    
    if (userStr) {
      try {
        user = JSON.parse(userStr)
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e)
      }
    }
    
    // Set axios header immediately if token exists
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    return {
      token,
      user,
      isInitializing: false,
      isValidated: !!token, // Consider validated if token exists in localStorage
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    restoreFromStorage() {
      const token = localStorage.getItem('admin_token')
      const user = localStorage.getItem('admin_user')
      
      if (token) {
        this.token = token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      if (user) {
        try {
          this.user = JSON.parse(user)
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e)
        }
      }
    },
    async login(email, password) {
      try {
        const response = await axios.post(`${apiBaseUrl}/auth/login`, { email, password })
        this.token = response.data.access_token
        this.user = response.data.user
        this.isValidated = true
        
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
      this.isValidated = false
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      delete axios.defaults.headers.common['Authorization']
    },
    async init() {
      // First restore from localStorage synchronously
      this.restoreFromStorage()
      
      if (!this.token) {
        return false
      }

      // Avoid multiple simultaneous validations
      if (this.isInitializing) {
        // Wait for existing initialization to complete
        while (this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        return this.isValidated
      }

      this.isInitializing = true

      try {
        const response = await axios.get(`${apiBaseUrl}/auth/me`)
        this.user = response.data
        this.isValidated = true
        localStorage.setItem('admin_user', JSON.stringify(this.user))
        return true
      } catch (error) {
        console.error('Auth validation failed:', error)
        this.logout()
        return false
      } finally {
        this.isInitializing = false
      }
    }
  }
})
