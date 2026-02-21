import React, { useEffect, useState } from 'react'
import api from '../api'
import Card from '../components/ui/Card'

export default function Contacts() {
  const [contacts, setContacts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/contacts')
      .then((res) => setContacts(res.data))
      .catch(() => setError('Impossible de récupérer les contacts'))
  }, [])

  return (
    <section>
      <h2>Contacts</h2>
      {error && <p>{error}</p>}
      {!contacts && !error && <p>Chargement...</p>}
      {contacts && (
        <div className="grid gap-3">
          {contacts.map((c) => (
            <Card key={c.id || c.email}>{c.name || c.email}</Card>
          ))}
        </div>
      )}
    </section>
  )
}
