# Migrations TypeORM

## Règle de sécurité

`TYPEORM_SYNCHRONIZE=false` doit rester la valeur par défaut. `synchronize=true` ne doit être utilisé que sur une base locale jetable, jamais sur une base contenant des données métier.

`src/data-source.ts` est la source de configuration utilisée par `migration-runner.ts`. Il charge les entités compilées dans `dist/**/*.entity.js` et les migrations dans `dist/migrations/*.js`.

## Première mise en place sur une base existante

1. Faire une sauvegarde PostgreSQL avant toute modification :

   ```bash
   pg_dump "$DATABASE_URL" --format=custom --file=backup-before-migrations.dump
   ```

2. Vérifier l’état du schéma actuel et comparer les tables avec les entités du projet.
3. Générer une migration de référence depuis une base de comparaison vide ou produire une migration SQL contrôlée. Ne pas exécuter automatiquement une migration générée sans la relire.
4. Placer la migration dans `src/migrations/` avec un nom horodaté, par exemple :

   ```text
   1710000000000-InitialSchema.ts
   ```

5. Si la base existante correspond déjà exactement à cette migration, marquer la migration comme exécutée selon la procédure TypeORM retenue par l’équipe, après validation du DBA. Sinon, appliquer la migration et traiter explicitement les écarts de données.

## Cycle de développement

Après une modification d’entité :

```bash
cd projet-app/backend
npm run build
npm run migration:run
```

Le runner est déjà configuré par les scripts suivants :

```bash
npm run migration:run
npm run migration:status
npm run migration:revert
```

Une migration doit être relue avant exécution et testée sur une copie de la base. Les migrations doivent être versionnées dans Git et ne doivent pas contenir de secrets.

## Développement local

Pour une base locale neuve, la procédure recommandée reste d’exécuter les migrations. Pour un prototype jetable uniquement, il est possible d’utiliser temporairement :

```env
TYPEORM_SYNCHRONIZE=true
```

Après cette phase, remettre immédiatement :

```env
TYPEORM_SYNCHRONIZE=false
```

## Production

Utiliser :

```env
NODE_ENV=production
TYPEORM_SYNCHRONIZE=false
```

Puis exécuter les migrations dans une étape contrôlée du déploiement, avant de redémarrer l’API. Ne jamais modifier directement le schéma de production depuis une session applicative.
