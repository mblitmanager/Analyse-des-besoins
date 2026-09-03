# Vérification des règles de parcours en base

Le fichier `verify-current-parcours-rules.js` compare les couples `formation1` / `formation2` actifs de `parcours_rules` avec les 29 parcours exploitables extraits du tableau fourni le 02 juillet 2026.

## Exécution

Depuis `projet-app/backend` :

```bash
node verify-current-parcours-rules.js
```

Le script charge `DATABASE_URL` depuis `.env` et retourne :

- `0` si aucun parcours attendu ne manque, n’est inactif ou dupliqué ;
- `1` si des règles attendues manquent, sont inactives ou sont dupliquées ;
- `2` si la connexion ou la structure de base est indisponible.

## Contrôles réalisés

Le script vérifie :

- la présence de `formations`, `parcours_rules`, `p3_override_rules` et `p3_filter_rule` ;
- les couples de modules attendus dans `parcours_rules` ;
- les règles désactivées alors qu’elles sont attendues ;
- les doublons actifs d’un même couple ;
- la présence approximative des libellés dans le catalogue `formations`.

## Limites importantes

Le tableau contient aussi des codes certificateurs, des volumes horaires et une proposition de module 3. Ces informations ne sont pas des colonnes de `parcours_rules` dans les entités actuelles. Elles ne peuvent donc pas être déclarées conformes à partir de cette table seule.

Elles doivent être contrôlées dans `formations.programme`, `formations.modaliteDuree`, `formations.certificateur`, ou dans une table catalogue dédiée. Les libellés composites comme `GOOGLE DOCS/SLIDES` et les alternatives « ou » nécessitent une décision de modélisation avant comparaison automatique.

## Accès à la base

Si le script reste bloqué ou retourne une erreur de connexion, vérifier depuis la machine où PostgreSQL est installé :

```bash
psql "$DATABASE_URL" -c 'select now();'
```

Ne pas exécuter ce contrôle contre la production sans compte de lecture dédié et sans exporter les données sensibles.
