# Configuration de production

Les domaines canoniques retenus par le script `deploy-AB.sh` sont :

- Frontend : `https://ns-conseil-ab.mbl-service.com`
- Backend API : `https://ab-back.mbl-service.com`

Le domaine frontend doit appeler l’API via son URL HTTPS publique, et non via `localhost`.

## Backend `.env`

```env
NODE_ENV=production
PORT=3001

FRONTEND_URL=https://ns-conseil-ab.mbl-service.com
CORS_ORIGIN=https://ns-conseil-ab.mbl-service.com

DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USER=analyse_user
DATABASE_PASSWORD=<mot-de-passe-fort>
DATABASE_NAME=analyse_besoins
# Ou, de préférence, une seule URL protégée :
# DATABASE_URL=postgresql://analyse_user:<mot-de-passe-url-encode>@127.0.0.1:5432/analyse_besoins

TYPEORM_SYNCHRONIZE=false
JWT_SECRET=<secret-long-aleatoire>
ENCRYPTION_KEY=<64-caracteres-hexadecimaux>
```

Si le proxy inverse termine TLS et transmet vers le backend local, l’API reste écoutée sur le port `3001`, mais son URL publique est `https://ab-back.mbl-service.com`.

## Frontend `.env.production`

```env
VITE_API_BASE_URL=https://ab-back.mbl-service.com/api
```

Cette variable est injectée au moment de `npm run build`; il faut donc reconstruire le frontend après toute modification.

## Vérifications avant redémarrage

```bash
curl -i https://ab-back.mbl-service.com/api/health
curl -i \
  -H 'Origin: https://ns-conseil-ab.mbl-service.com' \
  https://ab-back.mbl-service.com/api/health
```

La seconde réponse doit contenir :

```http
Access-Control-Allow-Origin: https://ns-conseil-ab.mbl-service.com
Access-Control-Allow-Credentials: true
```

Ne pas utiliser simultanément `nsconseil.mbl-service.com` et `ns-conseil-ab.mbl-service.com` comme domaines principaux sans les déclarer explicitement comme alias DNS et origines CORS. Si l’ancien domaine doit rester actif, ajoutez-le à `CORS_ORIGIN` sous forme de liste séparée par des virgules.
