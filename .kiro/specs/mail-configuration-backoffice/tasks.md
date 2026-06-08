# Implementation Plan: Mail Configuration Backoffice

## Overview

Implémentation d'une page dédiée `/admin/mail-config` dans le back-office, permettant la configuration SMTP dynamique, l'édition visuelle des templates email (WYSIWYG TipTap), le test de connectivité SMTP et l'envoi d'emails de test. Le tout repose sur les modules existants (`SettingsModule`, `EmailTemplatesModule`, `EmailModule`) et un nouveau `MailConfigModule`.

## Tasks

- [x] 1. Mise en place du module backend MailConfig
  - [x] 1.1 Créer le CryptoUtil (chiffrement AES-256-GCM)
    - Créer `src/mail-config/crypto.util.ts`
    - Implémenter les méthodes `encrypt(plaintext)` et `decrypt(ciphertext)` avec AES-256-GCM
    - La clé de chiffrement est lue depuis `process.env.ENCRYPTION_KEY` (32 bytes hex)
    - Le format de sortie est `base64(iv:authTag:ciphertext)`
    - _Requirements: 7.1_

  - [x]* 1.2 Écrire les property tests pour CryptoUtil
    - **Property 9: Password Encryption Round-Trip**
    - Pour toute chaîne non-vide, `decrypt(encrypt(password))` retourne le password original, et `encrypt(password) !== password`
    - **Validates: Requirements 7.1**

  - [x] 1.3 Créer les DTOs (UpdateSmtpConfigDto, SmtpDisplayDto, SmtpConfigDto, SendTestEmailDto, OperationResultDto)
    - Créer `src/mail-config/dto/` avec les fichiers de DTOs
    - Appliquer les décorateurs `class-validator` (@IsString, @IsNumber, @IsEmail, @IsIn, etc.)
    - `UpdateSmtpConfigDto` : host (required), port (1-65535), username (required), password (optional), encryption ('ssl'|'tls'|'none')
    - `SendTestEmailDto` : to (@IsEmail)
    - _Requirements: 1.6, 3.5_

  - [x]* 1.4 Écrire les property tests pour la validation des DTOs
    - **Property 2: SMTP Validation Rejects Incomplete Configurations**
    - Pour tout objet où un champ requis (host, port, username, encryption) manque, la validation doit échouer
    - **Property 3: Email Address Format Validation**
    - Pour toute chaîne ne respectant pas le format email, `SendTestEmailDto` doit être rejeté
    - **Validates: Requirements 1.6, 3.5**

  - [x] 1.5 Créer le SmtpConfigService
    - Créer `src/mail-config/smtp-config.service.ts`
    - Implémenter `getConfig()` : lit les clés SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_ENCRYPTION depuis SettingsService, déchiffre le password
    - Implémenter `getConfigForDisplay()` : retourne le password masqué (`'••••••••'`)
    - Implémenter `saveConfig(dto)` : chiffre le password si fourni, persiste via SettingsService, puis appelle `applyTransport()`
    - Implémenter `applyTransport()` : reconfigure le transport nodemailer du MailerService dynamiquement
    - _Requirements: 1.2, 1.3, 1.5, 7.1, 7.2_

  - [x]* 1.6 Écrire les property tests pour SmtpConfigService
    - **Property 1: SMTP Configuration Round-Trip**
    - Pour toute config SMTP valide, `saveConfig()` puis `getConfig()` retourne les mêmes valeurs (host, port, username, password déchiffré, encryption)
    - **Property 10: Password Masking for Display**
    - Pour toute config avec password non-vide, `getConfigForDisplay()` retourne un password masqué ne contenant jamais le vrai mot de passe
    - **Validates: Requirements 1.2, 1.5, 7.1, 7.2**

  - [x] 1.7 Créer le SmtpConnectionTester
    - Créer `src/mail-config/smtp-connection-tester.service.ts`
    - Implémenter `testConnection(config)` : crée un transport nodemailer temporaire, appelle `verify()`, retourne `{ success, error? }`
    - Fermer le transport dans un bloc `finally`
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 1.8 Créer le TestEmailSender
    - Créer `src/mail-config/test-email-sender.service.ts`
    - Implémenter `sendTestEmail(to)` : envoie un email via `mailerService.sendMail()` avec sujet et contenu de test
    - Retourner `{ success, error? }`
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 1.9 Créer le MailConfigController
    - Créer `src/mail-config/mail-config.controller.ts`
    - `GET /mail-config/smtp` → appelle `getConfigForDisplay()`
    - `PUT /mail-config/smtp` → appelle `saveConfig(dto)` avec validation `UpdateSmtpConfigDto`
    - `POST /mail-config/smtp/test` → appelle `testConnection()`
    - `POST /mail-config/test-email` → appelle `sendTestEmail(dto.to)` avec validation `SendTestEmailDto`
    - Protéger tous les endpoints avec `@UseGuards(JwtAuthGuard)` et `@ApiBearerAuth()`
    - _Requirements: 1.1, 2.1, 3.1, 7.3, 7.4_

  - [x] 1.10 Créer le MailConfigModule et l'enregistrer dans AppModule
    - Créer `src/mail-config/mail-config.module.ts`
    - Importer `SettingsModule`, `EmailTemplatesModule`, `EmailModule`
    - Déclarer les providers : SmtpConfigService, SmtpConnectionTester, TestEmailSender, CryptoUtil
    - Exporter le controller MailConfigController
    - Enregistrer le module dans `AppModule.imports`
    - _Requirements: 6.1_

- [x] 2. Checkpoint backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implémentation du frontend — Page MailConfig
  - [x] 3.1 Créer la route et la page MailConfigView
    - Ajouter la route `/admin/mail-config` dans le router Vue (guard JWT existant)
    - Créer `src/views/admin/MailConfigView.vue` avec structure en onglets/sections (SMTP, Templates, Test)
    - Ajouter l'entrée de menu dans la navigation admin
    - Appliquer le design system Tailwind CSS existant
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.2 Implémenter SmtpConfigSection.vue
    - Créer `src/components/admin/SmtpConfigSection.vue`
    - Formulaire avec champs : host, port, username, password (masqué par défaut), encryption (select ssl/tls/none)
    - Charger les valeurs existantes via `GET /mail-config/smtp` au montage
    - Bouton "Enregistrer" → `PUT /mail-config/smtp` avec feedback toast succès/erreur
    - Bouton "Tester la connexion" → `POST /mail-config/smtp/test` avec indicateur loading, succès/erreur
    - Validation côté client des champs requis avant soumission
    - Messages d'erreur inline sous les champs en cas de validation échouée
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Implémenter TestEmailSection.vue
    - Créer `src/components/admin/TestEmailSection.vue`
    - Input email avec validation format, bouton "Envoyer"
    - Appel `POST /mail-config/test-email` avec loading state
    - Notification succès avec adresse destinataire, ou erreur avec raison
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.4 Implémenter TemplateEditorSection.vue — Liste et sélection
    - Créer `src/components/admin/TemplateEditorSection.vue`
    - Charger la liste des templates via l'API EmailTemplates existante
    - Afficher chaque template avec nom, slug, statut actif/inactif
    - Clic sur un template → charger son `htmlContent` dans l'éditeur
    - _Requirements: 4.1, 4.2_

  - [x] 3.5 Intégrer l'éditeur WYSIWYG TipTap
    - Installer les dépendances TipTap (`@tiptap/vue-3`, `@tiptap/starter-kit`, extensions link, image, text-align, placeholder)
    - Configurer l'éditeur avec les extensions : StarterKit, Link, Image, TextAlign, Placeholder
    - Créer une extension custom pour rendre les placeholders `{{variable}}` comme des nodes inline non-éditables
    - Synchroniser le contenu HTML via `editor.getHTML()`
    - Supporter bold, italic, underline, headings, links, images, text alignment
    - _Requirements: 4.3, 4.4_

  - [x] 3.6 Implémenter le panneau de preview et la sauvegarde des templates
    - Ajouter un panneau de preview à droite de l'éditeur
    - Le preview se met à jour en temps réel lors de l'édition
    - Utiliser des valeurs d'exemple pour rendre les placeholders dans le preview
    - Afficher le champ subject éditable au-dessus du preview
    - Bouton "Enregistrer" → PUT via l'API EmailTemplates existante
    - Validation : empêcher la sauvegarde si htmlContent est vide
    - _Requirements: 4.5, 4.6, 5.1, 5.2, 5.3, 5.4_

  - [x]* 3.7 Écrire les tests unitaires frontend
    - Tests pour SmtpConfigSection : soumission formulaire, validation, affichage erreurs
    - Tests pour TestEmailSection : validation email, états loading/succès/erreur
    - Tests pour TemplateEditorSection : chargement liste, sélection template
    - _Requirements: 1.1, 3.1, 4.1_

- [x] 4. Checkpoint frontend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Intégration et câblage final
  - [x] 5.1 Câbler le hot-reload SMTP au démarrage de l'application
    - Au démarrage du `MailConfigModule`, appeler `SmtpConfigService.applyTransport()` si une config existe en BDD
    - S'assurer que la config BDD prend le pas sur la config .env si elle est présente
    - _Requirements: 1.3_

  - [x] 5.2 Vérifier la protection JWT sur tous les endpoints
    - S'assurer que tous les endpoints `/mail-config/*` retournent 401 sans token valide
    - Vérifier la redirection frontend vers `/admin/login` si session expirée
    - _Requirements: 7.3, 7.4, 6.3_

  - [x]* 5.3 Écrire les tests d'intégration end-to-end
    - Test flux complet : sauvegarder config SMTP → tester connexion → envoyer email test
    - Test protection JWT : accès sans token → 401
    - Test template : charger → éditer → sauvegarder → vérifier persistance
    - _Requirements: 1.2, 1.3, 2.2, 3.2, 4.5, 7.3_

- [x] 6. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The frontend uses the existing API patterns and design system (Tailwind CSS)
- TipTap is chosen as WYSIWYG editor per design decision (Vue 3 compatible, ProseMirror-based)
- The `ENCRYPTION_KEY` env variable must be configured (32 bytes hex) before running

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6", "1.7", "1.8"] },
    { "id": 3, "tasks": ["1.9", "1.10"] },
    { "id": 4, "tasks": ["3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 6, "tasks": ["3.5"] },
    { "id": 7, "tasks": ["3.6", "3.7"] },
    { "id": 8, "tasks": ["5.1", "5.2"] },
    { "id": 9, "tasks": ["5.3"] }
  ]
}
```
