import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { AuthContext } from '../context/AuthProvider'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const errs = {}
    if (!email) errs.email = 'Email requis'
    if (!password) errs.password = 'Mot de passe requis'
    if (Object.keys(errs).length) return setErrors(errs)
    setMessage('Connexion...')
    setSubmitting(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const token = res.data?.token
      if (token) {
        login(token)
        navigate('/dashboard')
      } else {
        setMessage(res.data?.message || 'Impossible de récupérer le token')
      }
    } catch (err) {
      setMessage('Erreur de connexion')
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <label>
          Email
          <input className={errors.email ? 'invalid' : ''} value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <small className="error">{errors.email}</small>}
        </label>
        <label>
          Mot de passe
          <input type="password" className={errors.password ? 'invalid' : ''} value={password} onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <small className="error">{errors.password}</small>}
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Connexion...' : 'Se connecter'}</button>
      </form>
      {message && <p>{message}</p>}
    </section>
  )
}
