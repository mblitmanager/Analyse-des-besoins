# Scripts Utilitaires Backend

Ce dossier contient tous les scripts utilitaires, de développement et de migration organisés par catégorie.

## 📁 Structure

### `scripts/migrations/`
Scripts de migration de base de données et d'import de données.
- `migrate_db.js` - Migration principale de la base de données
- `migrate_db_v2.js` - Version améliorée de la migration
- `import_*.js` - Scripts d'importation de données (formations, questions, etc.)
- `seed_*.js` - Scripts de peuplement de la base de données (seed data)

### `scripts/dev/`
Scripts de développement et de diagnostic.
- `check_*.js` - Scripts de vérification et de diagnostic de la base de données
- `diagnose_*.js` - Scripts d'analyse des données et des structures

### `scripts/util/`
Scripts utilitaires généraux.
- `export_*.js` - Scripts d'exportation de données (Excel, JSON, etc.)
- `extract_*.js` - Scripts d'extraction de données de la base
- `generate_*.js` - Scripts de génération (tests, documentation, etc.)
- `fix_*.js` - Scripts de correction de données
- `update_*.js` - Scripts de mise à jour de données
- `verify_*.js` - Scripts de vérification de données
- `*.py` - Scripts Python utilitaires

### `scripts/tests/`
Scripts de tests et de validation.
- `test_*.js` - Scripts de tests unitaires et d'intégration

## 🚀 Utilisation

### Exécuter un script de migration
```bash
cd scripts/migrations
node migrate_db.js
```

### Exécuter un script de diagnostic
```bash
cd scripts/dev
node check_formations.js
```

### Exécuter un script utilitaire
```bash
cd scripts/util
node export_to_xlsx.js
```

## 📝 Notes

- Tous les scripts doivent être exécutés depuis le dossier backend
- Certains scripts nécessitent une connexion à la base de données
- Vérifiez les variables d'environnement avant d'exécuter les scripts
- Sauvegardez toujours votre base de données avant d'exécuter des scripts de migration

## 🔧 Maintenance

- Ajoutez un nouveau script dans le dossier approprié
- Documentez le script avec des commentaires au début du fichier
- Mettez à jour ce README si vous ajoutez une nouvelle catégorie