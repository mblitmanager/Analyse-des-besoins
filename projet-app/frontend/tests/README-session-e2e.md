# E2E du parcours complet

Les deux scénarios suivants ont été ajoutés :

- `session-complete.api.spec.ts` : crée une session, la complète, la soumet et relit ses résultats via l’API.
- `session-complete.ui.spec.ts` : exécute le parcours candidat dans un navigateur, de l’identification à la validation.

## Pré-requis

Les tests réels sont volontairement désactivés par défaut. Ils doivent utiliser une base de données et une API dédiées afin de ne jamais modifier les données de production.

Démarrer le frontend sur `http://localhost:5173` et le backend sur `http://localhost:3001`, puis lancer :

```bash
cd projet-app/frontend
RUN_REAL_E2E=1 npm run test:e2e:session
```

Sous PowerShell :

```powershell
$env:RUN_REAL_E2E="1"
$env:E2E_API_BASE_URL="http://localhost:3001/api"
npm run test:e2e:session
```

Pour lancer uniquement le scénario API :

```bash
RUN_REAL_E2E=1 npx playwright test tests/session-complete.api.spec.ts
```

Pour lancer uniquement le scénario navigateur :

```bash
RUN_REAL_E2E=1 npx playwright test tests/session-complete.ui.spec.ts
```

Le scénario API crée des données de test avec un e-mail unique. Prévoir une purge périodique de ces données dans la base E2E. Le scénario UI s’adapte aux étapes désactivées par la configuration du workflow, mais exige au moins une formation active et un parcours public accessible.
