import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Dashboard() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/contacts')
      .then((res) => setItems(res.data))
      .catch(() => setError('Impossible de récupérer les contacts'))
  }, [])

  return (
    <section>
      <h2>Dashboard</h2>
      {error && <p>{error}</p>}
      {!error && !items && <p>Chargement...</p>}
      {items && Array.isArray(items) && (
        <ul>
          {items.map((c) => (
            <li key={c.id || c.email || JSON.stringify(c)}>{c.name || c.email || JSON.stringify(c)}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
