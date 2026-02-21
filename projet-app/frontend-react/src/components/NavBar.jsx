import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'

export default function NavBar() {
  const { token, logout, user } = useContext(AuthContext)
  return (
    <div className="flex items-center justify-between">
      <div>
        <Link to="/" className="text-lg font-semibold text-blue-600">WizzyLearn</Link>
      </div>
      <nav className="flex items-center gap-4">
        <Link to="/contacts" className="text-sm">Contacts</Link>
        <Link to="/formations" className="text-sm">Formations</Link>
        <Link to="/dashboard" className="text-sm">Dashboard</Link>
        {!token ? (
          <Link to="/login" className="text-sm">Connexion</Link>
        ) : (
          <button onClick={logout} className="text-sm">Déconnexion</button>
        )}
      </nav>
    </div>
  )
}
