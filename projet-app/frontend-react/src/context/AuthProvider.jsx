import React, { createContext, useEffect, useState } from 'react'
import api from '../api'

export const AuthContext = createContext({})

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      localStorage.removeItem('token')
      return
    }

    localStorage.setItem('token', token)
    setLoading(true)
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [token])

  const login = (newToken) => setToken(newToken)
  const logout = () => setToken(null)

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
