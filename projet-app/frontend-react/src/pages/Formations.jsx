import React, { useEffect, useState } from 'react'
import api from '../api'
import Card from '../components/ui/Card'

export default function Formations() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/formations')
      .then((res) => setItems(res.data))
      .catch(() => setError('Impossible de récupérer les formations'))
  }, [])

  return (
    <section>
      <h2>Formations</h2>
      {error && <p>{error}</p>}
      {!items && !error && <p>Chargement...</p>}
      {items && (
        <div className="grid gap-3">
          {items.map((f) => (
            <Card key={f.id || f.title}>{f.title || JSON.stringify(f)}</Card>
          ))}
        </div>
      )}
    </section>
  )
}
