import React, { useEffect, useState } from 'react'

export default function Welcome() {
  const [message, setMessage] = useState('Chargement...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => setMessage(t))
      .catch(() => setMessage('Backend non disponible'))
  }, [])

  return (
    <section>
      <h2>Bienvenue</h2>
      <p>{message}</p>
    </section>
  )
}
