# Design Document - Mail Configuration Backoffice

## Architecture Overview

Cette feature ajoute une page dédiée `/admin/mail-config` dans le back-office, organisée en trois sections (SMTP, Templates, Test). Elle réutilise les modules existants (`SettingsModule`, `EmailTemplatesModule`, `EmailModule`) et introduit un nouveau module `MailConfigModule` qui orchestre la configuration SMTP dynamique, le chiffrement des credentials, et les opérations de test.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3 + Tailwind)                    │
├─────────────────────────────────────────────────────────────────┤
│  MailConfigView.vue                                              │
│  ├── SmtpConfigSection.vue (form + test connexion)               │
│  ├── TemplateEditorSection.vue (liste + WYSIWYG + preview)       │
│  └── TestEmailSection.vue (envoi email test)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (JWT Bearer)
┌──────────────────────────▼──────────────────────────────────────┐
│                    Backend (NestJS)                               │
├─────────────────────────────────────────────────────────────────┤
│  MailConfigModule (NOUVEAU)                                      │
│  ├── MailConfigController      (REST endpoints)                  │
│  ├── SmtpConfigService         (CRUD + encryption + hot-reload)  │
│  ├── SmtpConnectionTester      (verify SMTP connectivity)        │
│  ├── TestEmailSender           (send test email)                 │
│  └── CryptoUtil                (AES encryption helper)           │
├─────────────────────────────────────────────────────────────────┤
│  Modules existants réutilisés:                                   │
│  ├── SettingsModule            (Settings_Repository)             │
│  ├── EmailTemplatesModule      (EmailTemplate CRUD + rendering)  │
│  └── EmailModule               (MailerService - transport)       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  PostgreSQL (TypeORM)                                            │
│  ├── settings (key/value) — stocke SMTP config chiffrée          │
│  └── email_templates — templates email existants                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Backend Components

#### 1. MailConfigModule (`src/mail-config/mail-config.module.ts`)

Module NestJS qui regroupe tous les composants de configuration mail. Importe `SettingsModule`, `EmailTemplatesModule`, et `EmailModule`.

#### 2. SmtpConfigService (`src/mail-config/smtp-config.service.ts`)

Responsable de la lecture/écriture des paramètres SMTP dans la table `settings`, avec chiffrement du mot de passe.

```typescript
@Injectable()
export class SmtpConfigService {
  private readonly SMTP_KEYS = {
    host: 'SMTP_HOST',
    port: 'SMTP_PORT',
    username: 'SMTP_USERNAME',
    password: 'SMTP_PASSWORD',
    encryption: 'SMTP_ENCRYPTION', // 'ssl' | 'tls' | 'none'
  };

  constructor(
    private readonly settingsService: SettingsService,
    private readonly mailerService: MailerService,
    private readonly cryptoUtil: CryptoUtil,
  ) {}

  async getConfig(): Promise<SmtpConfigDto> { /* ... */ }
  async getConfigForDisplay(): Promise<SmtpDisplayDto> { /* masked password */ }
  async saveConfig(dto: UpdateSmtpConfigDto): Promise<void> { /* encrypt + save + hot-reload */ }
  async applyTransport(): Promise<void> { /* reconfigure MailerService transport */ }
}
```

#### 3. CryptoUtil (`src/mail-config/crypto.util.ts`)

Utilitaire de chiffrement AES-256-GCM pour le mot de passe SMTP.

```typescript
@Injectable()
export class CryptoUtil {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer; // Derived from env ENCRYPTION_KEY

  encrypt(plaintext: string): string { /* returns base64(iv:authTag:ciphertext) */ }
  decrypt(encrypted: string): string { /* returns plaintext */ }
}
```

#### 4. SmtpConnectionTester (`src/mail-config/smtp-connection-tester.service.ts`)

Vérifie la connectivité SMTP via `nodemailer.createTransport().verify()`.

```typescript
@Injectable()
export class SmtpConnectionTester {
  async testConnection(config: SmtpConfigDto): Promise<{ success: boolean; error?: string }> {
    const transport = nodemailer.createTransport({ /* config */ });
    try {
      await transport.verify();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      transport.close();
    }
  }
}
```

#### 5. TestEmailSender (`src/mail-config/test-email-sender.service.ts`)

Envoie un email de test en utilisant la configuration SMTP actuelle.

```typescript
@Injectable()
export class TestEmailSender {
  constructor(private readonly mailerService: MailerService) {}

  async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: '[AB] Email de test',
        html: '<p>Ceci est un email de test envoyé depuis le back-office Analyses des besoins.</p>',
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

#### 6. MailConfigController (`src/mail-config/mail-config.controller.ts`)

Expose les endpoints REST protégés par JWT.

```typescript
@ApiTags('mail-config')
@Controller('mail-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MailConfigController {
  // GET  /mail-config/smtp         → getSmtpConfig (masked)
  // PUT  /mail-config/smtp         → saveSmtpConfig
  // POST /mail-config/smtp/test    → testSmtpConnection
  // POST /mail-config/test-email   → sendTestEmail
}
```

### Frontend Components

#### 7. MailConfigView.vue (`src/views/admin/MailConfigView.vue`)

Page principale avec onglets/sections pour SMTP, Templates, et Test Email.

#### 8. SmtpConfigSection.vue (`src/components/admin/SmtpConfigSection.vue`)

Formulaire SMTP avec champs host, port, username, password (masqué), encryption (select). Boutons "Enregistrer" et "Tester la connexion".

#### 9. TemplateEditorSection.vue (`src/components/admin/TemplateEditorSection.vue`)

Liste des templates à gauche, éditeur WYSIWYG à droite avec panneau de preview en temps réel. Utilise une bibliothèque WYSIWYG comme TipTap ou Quill.

#### 10. TestEmailSection.vue (`src/components/admin/TestEmailSection.vue`)

Input email + bouton "Envoyer" avec feedback de succès/erreur.

## Interfaces

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/mail-config/smtp` | Récupère la config SMTP (password masqué) | JWT |
| PUT | `/mail-config/smtp` | Sauvegarde la config SMTP | JWT |
| POST | `/mail-config/smtp/test` | Teste la connexion SMTP | JWT |
| POST | `/mail-config/test-email` | Envoie un email de test | JWT |

### DTOs

```typescript
// Input DTO pour sauvegarde SMTP
export class UpdateSmtpConfigDto {
  @IsString() @IsNotEmpty() host: string;
  @IsNumber() @Min(1) @Max(65535) port: number;
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsOptional() password?: string; // Optional si pas de changement
  @IsIn(['ssl', 'tls', 'none']) encryption: string;
}

// Output DTO pour affichage (password masqué)
export class SmtpDisplayDto {
  host: string;
  port: number;
  username: string;
  password: string; // '••••••••' (masqué)
  encryption: string;
  hasPassword: boolean; // indique si un mot de passe est configuré
}

// DTO interne (password déchiffré)
export class SmtpConfigDto {
  host: string;
  port: number;
  username: string;
  password: string; // plaintext déchiffré
  encryption: string;
}

// Input DTO pour test email
export class SendTestEmailDto {
  @IsEmail() to: string;
}

// Response DTO pour test connexion / envoi
export class OperationResultDto {
  success: boolean;
  message?: string;
  error?: string;
}
```

## Data Models

### Settings Repository Keys (table `settings`)

| Key | Value | Description |
|-----|-------|-------------|
| `SMTP_HOST` | `smtp.example.com` | Hôte SMTP |
| `SMTP_PORT` | `587` | Port SMTP |
| `SMTP_USERNAME` | `user@example.com` | Identifiant SMTP |
| `SMTP_PASSWORD` | `<encrypted_base64>` | Mot de passe chiffré AES-256-GCM |
| `SMTP_ENCRYPTION` | `tls` | Méthode de chiffrement (ssl/tls/none) |

### EmailTemplate Entity (existante, pas de modification)

```typescript
{
  id: string;          // UUID
  slug: string;        // Identifiant unique (e.g. 'welcome')
  name: string;        // Nom affiché
  subject: string;     // Sujet avec {{placeholders}}
  htmlContent: string; // Contenu HTML avec {{placeholders}}
  description: string; // Description admin
  availableVariables: string[]; // Variables disponibles
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Backend Error Handling

| Situation | HTTP Status | Response |
|-----------|-------------|----------|
| JWT absent ou invalide | 401 | `{ statusCode: 401, message: 'Unauthorized' }` |
| Validation DTO échouée (champs manquants) | 400 | `{ statusCode: 400, message: ['field must not be empty'], error: 'Bad Request' }` |
| Format email invalide | 400 | `{ statusCode: 400, message: ['to must be an email'], error: 'Bad Request' }` |
| Connexion SMTP échouée | 200 | `{ success: false, error: 'Connection timeout...' }` |
| Envoi email échoué | 200 | `{ success: false, error: 'SMTP auth failed...' }` |
| Clé de chiffrement manquante | 500 | `{ statusCode: 500, message: 'Encryption key not configured' }` |

### Frontend Error Handling

- **Erreurs réseau** : notification toast avec message d'erreur et bouton "Réessayer"
- **Erreurs de validation** : messages inline sous les champs concernés en rouge
- **Timeout SMTP** : message explicite indiquant un problème de connectivité
- **Sessions expirées** : redirection vers `/admin/login`

## Dynamic Transport Reconfiguration

Lorsque la configuration SMTP est sauvegardée, le `SmtpConfigService` met à jour le transport du `MailerService` dynamiquement :

```typescript
async applyTransport(): Promise<void> {
  const config = await this.getConfig();
  const transportOptions = {
    host: config.host,
    port: config.port,
    secure: config.encryption === 'ssl',
    auth: {
      user: config.username,
      pass: config.password,
    },
  };

  if (config.encryption === 'tls') {
    transportOptions['requireTLS'] = true;
    transportOptions['secure'] = false;
  }

  // Accès au transport interne de nodemailer via MailerService
  const mailer = this.mailerService as any;
  mailer.transporter = nodemailer.createTransport(transportOptions);
}
```

## WYSIWYG Editor Integration

L'éditeur WYSIWYG choisi est **TipTap** (basé sur ProseMirror) pour sa compatibilité Vue 3 et sa flexibilité :

- Extensions utilisées : StarterKit, Link, Image, TextAlign, Placeholder
- Le contenu est synchronisé comme HTML brut (`editor.getHTML()`)
- Les placeholders `{{variable}}` sont affichés comme des nodes inline non-éditables (extension custom) pour éviter leur corruption accidentelle
- Le preview panel utilise la fonction `renderTemplate()` existante du `EmailTemplatesService` avec des valeurs d'exemple

## Security Considerations

1. **Chiffrement AES-256-GCM** : Le mot de passe SMTP est chiffré avant stockage. La clé de chiffrement est définie dans `process.env.ENCRYPTION_KEY` (32 bytes hex).
2. **Masquage systématique** : Le endpoint GET ne retourne jamais le mot de passe en clair, uniquement `'••••••••'`.
3. **Mot de passe optionnel** : Le PUT n'exige pas le password si l'admin ne souhaite pas le modifier (le champ est optionnel dans le DTO).
4. **Protection JWT** : Tous les endpoints sont protégés par `@UseGuards(JwtAuthGuard)`.
5. **Validation des entrées** : class-validator appliqué sur tous les DTOs.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SMTP Configuration Round-Trip

*For any* valid SMTP configuration (host, port, username, password, encryption), saving it via `SmtpConfigService.saveConfig()` and then retrieving it via `SmtpConfigService.getConfig()` SHALL return an object with identical host, port, username, password (decrypted), and encryption values.

**Validates: Requirements 1.2, 1.5**

### Property 2: SMTP Validation Rejects Incomplete Configurations

*For any* SMTP configuration object where at least one required field (host, port, username, encryption) is missing or empty, the `UpdateSmtpConfigDto` validation SHALL reject the input with an appropriate error message indicating the missing field(s).

**Validates: Requirements 1.6**

### Property 3: Email Address Format Validation

*For any* string that does not conform to a valid email address format (missing @, missing domain, invalid characters), the `SendTestEmailDto` validation SHALL reject the input.

**Validates: Requirements 3.5**

### Property 4: Template List Rendering Completeness

*For any* list of `EmailTemplate` entities, the template list section SHALL render each template displaying its name, slug, and isActive status without omission.

**Validates: Requirements 4.1**

### Property 5: Template Save/Load Round-Trip

*For any* valid template update (non-empty htmlContent and subject), saving it via `EmailTemplatesService.update()` and then retrieving it via `EmailTemplatesService.findOne()` SHALL return an object with identical htmlContent and subject values.

**Validates: Requirements 4.2, 4.5**

### Property 6: Placeholder Preservation Invariant

*For any* template HTML content containing placeholder variables in the format `{{variableName}}`, storing and retrieving the content SHALL preserve all placeholder strings unchanged (same count, same names, same positions).

**Validates: Requirements 4.4**

### Property 7: Template Placeholder Rendering

*For any* template HTML string containing `{{key}}` placeholders and a complete variable map where each key has a corresponding value, calling `renderTemplate(template, variables)` SHALL produce output where no `{{key}}` placeholders remain and each placeholder is replaced by its corresponding value.

**Validates: Requirements 5.3**

### Property 8: Empty Template Content Validation

*For any* string that is empty or composed entirely of whitespace, attempting to save it as `htmlContent` of an EmailTemplate SHALL be rejected with a validation error.

**Validates: Requirements 4.6**

### Property 9: Password Encryption Round-Trip

*For any* non-empty password string, `CryptoUtil.encrypt(password)` SHALL produce a ciphertext that is NOT equal to the original password, and `CryptoUtil.decrypt(encrypt(password))` SHALL return the original password.

**Validates: Requirements 7.1**

### Property 10: Password Masking for Display

*For any* stored SMTP configuration with a non-empty password, calling `SmtpConfigService.getConfigForDisplay()` SHALL return a `password` field that does NOT contain the actual plaintext password and consists only of mask characters.

**Validates: Requirements 7.2**
