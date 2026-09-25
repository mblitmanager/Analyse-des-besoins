# Variables d'Environnement - Documentation

## 📋 Vue d'ensemble

Ce document décrit toutes les variables d'environnement utilisées dans le projet Analyse-v2 pour le backend NestJS et le frontend Vue.js.

## 🔐 Variables de Sécurité (Critiques)

### Backend
- `ENCRYPTION_KEY` - Clé de chiffrement pour les données sensibles (64 caractères hexadécimaux)
  - **Format**: 64 caractères hexadécimaux
  - **Exemple**: `829b056abf7dec413df2e807465b5869e4f475c0645438e34a338f857c90eba2`
  - **IMPORTANT**: Ne jamais utiliser la valeur par défaut `0000000000000000000000000000000000000000000000000000000000000000`

### Base de Données
- `DATABASE_URL` - URL de connexion PostgreSQL complète
  - **Format**: `postgresql://user:password@host:port/database`
  - **Exemple**: `postgresql://aopia_user:aopia_secure_password_2024!@postgres:5432/analyse`
- `POSTGRES_USER` - Nom d'utilisateur PostgreSQL
- `POSTGRES_PASSWORD` - Mot de passe PostgreSQL (doit être fort)
- `POSTGRES_DB` - Nom de la base de données

## 🌐 Configuration Backend

### Environnement
- `NODE_ENV` - Environnement d'exécution
  - **Valeurs**: `development`, `production`, `test`
  - **Défaut**: `development`

### Serveur
- `PORT` - Port d'écoute du backend
  - **Défaut**: `3001`
  - **Docker**: `3002` (mapping externe)

### Base de Données (Alternative)
Si `DATABASE_URL` n'est pas défini, ces variables sont utilisées :
- `DATABASE_HOST` - Hôte de la base de données (défaut: `localhost`)
- `DATABASE_PORT` - Port PostgreSQL (défaut: `5432`)
- `DATABASE_USER` - Utilisateur (défaut: `user`)
- `DATABASE_PASSWORD` - Mot de passe (défaut: `password`)
- `DATABASE_NAME` - Nom de la base (défaut: `Wizilearn`)

### TypeORM
- `TYPEORM_SYNCHRONIZE` - Synchronisation automatique du schéma
  - **Production**: `false` (jamais `true` en production!)
  - **Développement**: `true` (peut être `true` pour le dev)

### Frontend
- `FRONTEND_URL` - URL du frontend pour CORS
  - **Exemple**: `https://ns-conseil-ab.mbl-service.com`

## 📧 Configuration Email

### SMTP
- `SMTP_HOST` - Serveur SMTP
- `SMTP_PORT` - Port SMTP (défaut: `587`)
- `SMTP_USER` - Utilisateur SMTP
- `SMTP_PASSWORD` - Mot de passe SMTP
- `SMTP_FROM` - Adresse email d'envoi par défaut
- `SMTP_FROM_NAME` - Nom de l'expéditeur

### Alternatives
- `RESEND_API_KEY` - Clé API Resend (si utilisé)
- `SENDGRID_API_KEY` - Clé API SendGrid (si utilisé)

## 🔐 Authentification

### JWT
- `JWT_SECRET` - Secret pour la signature des tokens JWT
  - **Format**: Chaîne aléatoire longue (minimum 32 caractères)
  - **IMPORTANT**: Doit être unique et forte
- `JWT_EXPIRATION` - Durée d'expiration des tokens
  - **Défaut**: `7d` (7 jours)

## 📁 Fichiers de Configuration

### `.env` (Backend)
Variables locales pour le développement backend. **NE PAS COMMITTER**.

### `.env.docker` (Docker)
Variables spécifiques pour Docker. **NE PAS COMMITTER**.

### `.env.production` (Frontend)
Variables pour la production frontend. **NE PAS COMMITTER**.

## 🔒 Sécurité

### Règles de sécurité
1. **Jamais committer** les fichiers `.env*` dans le dépôt git
2. **Toujours utiliser** des valeurs fortes pour les secrets
3. **Régénérer** les clés après une compromission
4. **Utiliser** des gestionnaires de secrets en production (Vault, AWS Secrets Manager, etc.)
5. **Limiter** les permissions des variables d'environnement

### Exemples de valeurs fortes
```bash
# Mauvais (à éviter)
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
POSTGRES_PASSWORD=postgres
JWT_SECRET=secret

# Bons (à utiliser)
ENCRYPTION_KEY=829b056abf7dec413df2e807465b5869e4f475c0645438e34a338f857c90eba2
POSTGRES_PASSWORD=aopia_secure_password_2024!@#$%
JWT_SECRET=your_very_long_random_secret_key_minimum_32_characters
```

## 🚀 Déploiement

### Docker
Utiliser le fichier `.env.docker` pour les secrets Docker :
```bash
# docker-compose.yml utilise les variables depuis .env.docker
env_file:
  - .env.docker
```

### Production
- Utiliser des secrets Kubernetes ou Docker Secrets
- Ne jamais stocker les secrets dans le code source
- Utiliser des variables d'environnement injectées par l'infrastructure

## 📝 Checklist avant déploiement

- [ ] Clé de chiffrement générée et sécurisée
- [ ] Mots de passe PostgreSQL forts
- [ ] JWT secret unique et fort
- [ ] `TYPEORM_SYNCHRONIZE=false` en production
- [ ] CORS restreint aux origines autorisées
- [ ] Configuration SMTP sécurisée
- [ ] Fichiers `.env*` dans `.gitignore`
- [ ] Secrets non stockés dans le code source

## 🔧 Génération de secrets

### Clé de chiffrement (64 caractères hex)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Mot de passe fort
```bash
openssl rand -base64 32
```

## 📚 Ressources

- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)