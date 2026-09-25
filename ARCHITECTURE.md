# Architecture Technique - Analyse-v2 (WizzyLearn)

## 📋 Vue d'ensemble

Analyse-v2 est une application web complète pour l'analyse des besoins de formation. L'architecture suit une approche moderne découplée avec une séparation claire entre frontend et backend, utilisant des technologies contemporaines et des meilleures pratiques de développement.

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        Utilisateur Final                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Nginx (Reverse Proxy)                       │
│                    - SSL/TLS Termination                         │
│                    - Static Files Serving                        │
│                    - Load Balancing                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────────────────┐
│   Frontend (Vue.js)   │   │      Backend (NestJS)                 │
│   - Port 8081         │   │      - Port 3001                      │
│   - Vue 3 + Vite      │   │      - REST API                       │
│   - Pinia (State)     │   │      - TypeORM                        │
│   - Tailwind CSS      │   │      - Business Logic                 │
│   - Playwright Tests  │   │      - PDF Generation                 │
└───────────┬───────────┘   │      - Email Services                 │
            │               └───────────────┬───────────────────────┘
            │                               │
            │ API Calls                     │
            │                               ▼
            │                   ┌───────────────────────────────────┐
            │                   │      PostgreSQL Database          │
            │                   │      - Port 5432                   │
            │                   │      - Formations                 │
            │                   │      - Questions                   │
            │                   │      - Sessions                   │
            │                   │      - Users                       │
            │                   └───────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Services Externes                             │
│                   - SMTP (Email)                                  │
│                   - Storage (si nécessaire)                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Stack Technique

### Frontend
- **Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite 7
- **State Management**: Pinia 3
- **Styling**: Tailwind CSS 4
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Testing**: Playwright (E2E)
- **Rich Text**: Tiptap Editor

### Backend
- **Framework**: NestJS 11 (TypeScript)
- **ORM**: TypeORM 0.3
- **Database**: PostgreSQL 17 (Prod) / SQLite (Dev)
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger/OpenAPI
- **PDF Generation**: PDFKit
- **Email**: Nodemailer / @nestjs-modules/mailer
- **Excel**: ExcelJS
- **Validation**: class-validator + class-transformer

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx
- **Process Manager**: PM2 (ecosystem.config.js)
- **Version Control**: Git
- **CI/CD**: GitHub Actions (workflows dans .github/)

## 📊 Structure de la Base de Données

### Entités Principales

#### Formation
```typescript
{
  id: number
  label: string
  slug: string
  category: string
  certifier: string
  description: string
  levels: Level[]
}
```

#### Level
```typescript
{
  id: number
  label: string
  order: number
  threshold: number
  formation: Formation
  questions: Question[]
}
```

#### Question
```typescript
{
  id: number
  text: string
  type: 'single' | 'multiple' | 'text'
  options: Option[]
  level: Level
  order: number
}
```

#### Session
```typescript
{
  id: number
  candidate: Stagiaire
  formation: Formation
  level: Level
  answers: Answer[]
  score: number
  status: 'in_progress' | 'completed'
  createdAt: Date
  completedAt: Date
}
```

#### ParcoursRule
```typescript
{
  id: number
  formation: Formation
  condition: string
  formation1: Formation
  formation2: Formation
  pathway: 'P1' | 'P2' | 'P3' | 'P1_P2'
}
```

#### P3FilterRule
```typescript
{
  id: number
  name: string
  mode: 'filter' | 'override'
  source: string
  target: string
  conditions: Condition[]
}
```

## 🌐 Structure API

### Endpoints Principaux

#### Authentification
- `POST /api/auth/login` - Connexion administrateur
- `POST /api/auth/register` - Inscription (si activé)
- `GET /api/auth/validate` - Validation token

#### Formations
- `GET /api/formations` - Liste des formations
- `GET /api/formations/:id` - Détails formation
- `GET /api/formations/:slug/levels` - Niveaux par formation

#### Questions
- `GET /api/questions` - Questions par niveau
- `GET /api/questions/workflow` - Questions du workflow candidat

#### Sessions
- `POST /api/sessions` - Créer session
- `GET /api/sessions/:id` - Récupérer session
- `PUT /api/sessions/:id` - Mettre à jour session
- `POST /api/sessions/:id/complete` - Finaliser session

#### Contacts
- `GET /api/contacts` - Liste conseillers
- `POST /api/contacts` - Créer conseiller

#### Admin
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/sessions` - Liste sessions
- `GET /api/admin/export` - Export données

## 🎨 Architecture Frontend

### Composants Principaux

#### Views (Pages)
- `HomeView.vue` - Page d'accueil
- `FormationSelectionView.vue` - Sélection formation
- `PositionnementView.vue` - Test de positionnement
- `ResultatsView.vue` - Résultats et recommandations
- `FinalValidationView.vue` - Validation finale
- `PrerequisView.vue` - Questionnaire prérequis
- `AvailabilitiesView.vue` - Disponibilités

#### Stores (Pinia)
- `formationStore` - Gestion formations
- `sessionStore` - Gestion sessions candidat
- `userStore` - Gestion utilisateur
- `uiStore` - État UI (loaders, notifications)

#### Services
- `apiService` - Communication avec backend
- `pdfService` - Génération PDF
- `emailService` - Envoi emails

### Flux Utilisateur

```
1. Accueil → 2. Identification → 3. Prérequis 
→ 4. Sélection Formation → 5. Test Positionnement 
→ 6. Résultats → 7. Validation → 8. Export PDF/Email
```

## 🔐 Sécurité

### Couches de Sécurité

1. **Transport Layer**
   - HTTPS/TLS obligatoire
   - Certificats SSL Let's Encrypt

2. **Application Layer**
   - CORS restreint
   - Validation des inputs
   - Rate limiting (à implémenter)
   - Headers de sécurité (Helmet)

3. **Authentication**
   - JWT tokens
   - Bcrypt pour mots de passe
   - Expiration des tokens

4. **Data Layer**
   - Chiffrement des données sensibles
   - Paramétrized queries (TypeORM)
   - Pas de synchronize en production

5. **Infrastructure**
   - Secrets management
   - Isolation des conteneurs Docker
   - Réseaux privés

## 📦 Déploiement

### Docker Compose Structure

```yaml
services:
  backend:
    - NestJS application
    - Port: 3001 (interne), 3002 (externe)
  
  frontend:
    - Vue.js application
    - Port: 80 (nginx interne), 8081 (externe)
  
  postgres:
    - PostgreSQL 17
    - Port: 5432
    - Volume persistant
```

### Processus de Build

1. **Backend**
   ```bash
   cd projet-app/backend
   npm install
   npm run build
   docker build -t aopia_backend .
   ```

2. **Frontend**
   ```bash
   cd projet-app/frontend
   npm install
   npm run build
   docker build -t aopia_frontend .
   ```

3. **Déploiement**
   ```bash
   docker-compose up -d --build
   ```

## 🔄 Flux de Données

### Création Session Candidat

```
Frontend (Vue.js)
    ↓ POST /api/sessions
Backend (NestJS)
    ↓ Validation
TypeORM
    ↓ INSERT sessions
PostgreSQL
    ↓ RETURN session
Backend
    ↓ Response
Frontend
    ↓ Store session in Pinia
UI Update
```

### Génération PDF

```
Backend receives completion request
    ↓ Fetch session data
PostgreSQL
    ↓ Return session
Backend (PDFKit)
    ↓ Generate PDF
    ↓ Email attachment
SMTP Service
    ↓ Send email
    ↓ Return success
Frontend displays confirmation
```

## 🧪 Tests

### Structure des Tests

1. **E2E Tests (Playwright)**
   - 171 tests couvrant 19 formations
   - Tests de navigation complète
   - Tests de formulaire
   - Localisation: `tests/` et `generated-tests/`

2. **Scripts de Test**
   - Scripts de diagnostic dans `scripts/tests/`
   - Tests d'API
   - Tests de base de données

### Exécution des Tests

```bash
# Tests E2E
cd projet-app/frontend
npx playwright test

# Tests backend
cd projet-app/backend
npm run test
```

## 📈 Performance

### Optimisations Actuelles
- Lazy loading des routes (à implémenter)
- Optimisation des assets (à faire)
- Cache côté serveur (à implémenter)

### Recommandations
- Implémenter Redis pour le cache
- CDN pour les assets statiques
- Compression Gzip/Brotli
- Optimisation des images

## 🔧 Maintenance

### Logs
- Structurer les logs avec Winston/Pino
- Centraliser les logs (ELK stack)
- Monitoring des erreurs

### Backups
- Backups PostgreSQL réguliers
- Backups des fichiers générés
- Rétention des backups

### Mises à jour
- Mises à jour de sécurité régulières
- Mises à jour des dépendances
- Tests de régression

## 🚀 Évolutions Possibles

### Court Terme
- [ ] Implémentation du monitoring
- [ ] Tests unitaires backend
- [ ] Optimisation performance frontend
- [ ] Rate limiting API

### Moyen Terme
- [ ] Microservices pour certains modules
- [ ] Cache distribué (Redis)
- [ ] CI/CD complet
- [ ] Tests de charge

### Long Terme
- [ ] Architecture event-driven
- [ ] GraphQL API
- [ ] Mobile app (React Native)
- [ ] Analytics avancé

## 📚 Documentation Complémentaire

- `README.md` - Guide d'installation
- `ENV_VARIABLES.md` - Variables d'environnement
- `DELIVERABLES_SUMMARY.md` - Livrables et tests
- `scripts/README.md` - Scripts utilitaires

## 👥 Équipe et Rôles

- **Développeurs Backend**: Maintenance API, logique métier
- **Développeurs Frontend**: Interface utilisateur, UX
- **DevOps**: Infrastructure, déploiement
- **QA**: Tests automatisés, validation

---

**Document maintenu par**: Équipe technique Analyse-v2  
**Dernière mise à jour**: 25 septembre 2026  
**Version**: 1.0