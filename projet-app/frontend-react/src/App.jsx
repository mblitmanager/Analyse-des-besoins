import React, { useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Welcome from './components/Welcome'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Formations from './pages/Formations'
import './App.css'
import AuthProvider, { AuthContext } from './context/AuthProvider'
import NavBar from './components/NavBar'

function RequireAuth({ children }) {
  const { token, loading } = useContext(AuthContext)
  if (loading) return <p>Vérification...</p>
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <header>
            <NavBar />
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/contacts" element={<RequireAuth><Contacts /></RequireAuth>} />
              <Route path="/formations" element={<RequireAuth><Formations /></RequireAuth>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

function HeaderLinks() {
  const { token, logout, user } = useContext(AuthContext)
  return (
    <>
      <h1>WiziLearn — Front React</h1>
      <nav style={{ marginTop: 8 }}>
        <Link to="/" style={{ marginRight: 12 }}>
          Accueil
        </Link>
        <Link to="/dashboard" style={{ marginRight: 12 }}>
          Dashboard
        </Link>
        {!token ? (
          <Link to="/login">Connexion</Link>
        ) : (
          <button onClick={logout}>Déconnexion{user ? ` (${user.email || user.name || ''})` : ''}</button>
        )}
      </nav>
    </>
  )
}
