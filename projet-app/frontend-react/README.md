# Frontend React (WiziLearn)

Scaffold minimal Vite + React pour le projet.

Install et dev:

```bash
cd "projet-app/frontend-react"
npm install
npm run dev
```

Le frontend tente d'appeler `/api/health` pour vérifier le backend. Adaptez l'URL si nécessaire.

Proxy et backend
 - Le dev server Vite proxie `/api` vers `http://localhost:3001` par défaut. Si votre backend écoute sur un autre port, modifiez `vite.config.js`.

Dépendances ajoutées:
 - `react-router-dom` pour le routage
 - `axios` pour requêtes HTTP

Routes initiales:
 - `/` Accueil
 - `/login` Formulaire de connexion (POST `/api/auth/login`)
 - `/dashboard` Exemple de dashboard (GET `/api/contacts`)

Authentification
 - Le frontend attend un champ `token` dans la réponse de `POST /api/auth/login`.
 - Le token est stocké dans `localStorage` sous la clé `token` et ajouté automatiquement aux requêtes via l'en-tête `Authorization: Bearer ...`.
 - L'endpoint `GET /api/auth/me` est appelé pour récupérer les informations utilisateur après connexion (si présent côté backend).

Build & production
- Pour builder la version de production :

```bash
npm run build
```

- Pour prévisualiser le build localement :

```bash
npm run preview
```

Variables d'environnement
- Le dev server proxie `/api` vers `http://localhost:3001` par défaut (configurable dans `vite.config.js`).
- En production, configurez votre reverse-proxy ou `VITE_API_BASE` si vous souhaitez surcharger l'URL de base (ajoutez la logique dans `src/api.js` si nécessaire).

.env.example
- Ajoutez un fichier `.env` à la racine de `frontend-react` si vous avez besoin d'overrides (exemple disponible dans `.env.example`).

Personnalisation:
 - Adaptez les endpoints dans `src/pages/*` selon votre backend.
