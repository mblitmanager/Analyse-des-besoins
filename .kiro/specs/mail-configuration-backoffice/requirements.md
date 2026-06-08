# Requirements Document

## Introduction

Cette feature ajoute une page dédiée de configuration email dans le back-office d'administration. Elle permet aux administrateurs de gérer la configuration SMTP, d'éditer visuellement les templates d'email via un éditeur WYSIWYG, de tester la connectivité SMTP et d'envoyer des emails de test — le tout sans redémarrage du serveur. La page est autonome et séparée de la page Settings existante.

## Glossary

- **Mail_Configuration_Page**: Page autonome dédiée dans le menu admin regroupant les sections SMTP, Templates et Test
- **SMTP_Configuration_Service**: Service backend NestJS responsable de la lecture, validation et application dynamique des paramètres SMTP
- **Template_Editor**: Éditeur WYSIWYG intégré dans le back-office permettant l'édition visuelle des templates email
- **SMTP_Connection_Tester**: Composant backend vérifiant la connectivité SMTP avec le serveur configuré
- **Test_Email_Sender**: Composant permettant l'envoi d'un email de test à une adresse saisie par l'administrateur
- **Settings_Repository**: Table settings (key/value) existante dans PostgreSQL via TypeORM
- **Email_Template_Entity**: Entité existante EmailTemplate (slug, name, subject, htmlContent, availableVariables, isActive)
- **Administrator**: Utilisateur authentifié par JWT disposant des droits d'accès au back-office

## Requirements

### Requirement 1: Configuration SMTP depuis le back-office

**User Story:** As an Administrator, I want to configure the SMTP settings from the back-office interface, so that I can manage email delivery without modifying environment files or restarting the server.

#### Acceptance Criteria

1. THE Mail_Configuration_Page SHALL display a SMTP configuration form with fields for host, port, username, password, and encryption method (SSL/TLS/None)
2. WHEN the Administrator submits the SMTP configuration form with valid values, THE SMTP_Configuration_Service SHALL persist the values in the Settings_Repository
3. WHEN SMTP configuration values are saved in the Settings_Repository, THE SMTP_Configuration_Service SHALL apply the new configuration to the mailer transport without requiring a server restart
4. WHILE the SMTP password field is displayed, THE Mail_Configuration_Page SHALL mask the password value with asterisks
5. WHEN the Mail_Configuration_Page loads, THE SMTP_Configuration_Service SHALL retrieve current SMTP settings from the Settings_Repository and populate the form fields
6. IF the Administrator submits the SMTP configuration form with missing required fields, THEN THE Mail_Configuration_Page SHALL display a validation error message indicating the missing fields

### Requirement 2: Test de connectivité SMTP

**User Story:** As an Administrator, I want to test the SMTP connection, so that I can verify that the configured SMTP settings are correct before relying on them for email delivery.

#### Acceptance Criteria

1. THE Mail_Configuration_Page SHALL display a "Tester la connexion" button in the SMTP configuration section
2. WHEN the Administrator clicks the "Tester la connexion" button, THE SMTP_Connection_Tester SHALL attempt a connection to the SMTP server using the currently saved configuration
3. WHEN the SMTP_Connection_Tester successfully connects to the SMTP server, THE Mail_Configuration_Page SHALL display a success indicator with a confirmation message
4. IF the SMTP_Connection_Tester fails to connect to the SMTP server, THEN THE Mail_Configuration_Page SHALL display an error indicator with the failure reason
5. WHILE the SMTP_Connection_Tester is performing the connectivity check, THE Mail_Configuration_Page SHALL display a loading state on the "Tester la connexion" button

### Requirement 3: Envoi d'email de test

**User Story:** As an Administrator, I want to send a test email to a specific address, so that I can confirm that the full email delivery pipeline works end-to-end.

#### Acceptance Criteria

1. THE Mail_Configuration_Page SHALL display a test email section with an input field for the recipient email address and a "Envoyer" button
2. WHEN the Administrator enters a valid email address and clicks "Envoyer", THE Test_Email_Sender SHALL send a test email to the specified address using the current SMTP configuration
3. WHEN the Test_Email_Sender successfully sends the test email, THE Mail_Configuration_Page SHALL display a success notification with the recipient address
4. IF the Test_Email_Sender fails to send the test email, THEN THE Mail_Configuration_Page SHALL display an error notification with the failure reason
5. IF the Administrator clicks "Envoyer" with an invalid email address format, THEN THE Mail_Configuration_Page SHALL display a validation error on the email input field
6. WHILE the Test_Email_Sender is processing the send request, THE Mail_Configuration_Page SHALL display a loading state on the "Envoyer" button

### Requirement 4: Édition visuelle des templates email

**User Story:** As an Administrator, I want to edit email templates visually using a WYSIWYG editor, so that I can customize email content without writing HTML manually.

#### Acceptance Criteria

1. THE Mail_Configuration_Page SHALL display a templates section listing all Email_Template_Entity records with their name, slug, and active status
2. WHEN the Administrator selects a template from the list, THE Template_Editor SHALL load the template htmlContent into the WYSIWYG editor
3. THE Template_Editor SHALL support rich text editing including bold, italic, underline, headings, links, images, and text alignment
4. THE Template_Editor SHALL preserve and display template placeholder variables in the format {{variable}} within the editor content
5. WHEN the Administrator saves a template, THE SMTP_Configuration_Service SHALL persist the updated htmlContent and subject to the Email_Template_Entity
6. IF the Administrator attempts to save a template with empty htmlContent, THEN THE Template_Editor SHALL display a validation error indicating content is required

### Requirement 5: Prévisualisation des templates

**User Story:** As an Administrator, I want to preview email templates before saving, so that I can verify the rendered output matches my expectations.

#### Acceptance Criteria

1. THE Template_Editor SHALL display a preview panel showing the rendered HTML output of the template being edited
2. WHEN the Administrator modifies content in the WYSIWYG editor, THE Template_Editor SHALL update the preview panel in real-time
3. THE Template_Editor SHALL render placeholder variables as sample values in the preview panel to demonstrate the final email appearance
4. THE Template_Editor SHALL display the template subject field above the preview panel as editable text

### Requirement 6: Navigation et page autonome

**User Story:** As an Administrator, I want to access mail configuration from a dedicated menu entry, so that I can find and manage all email-related settings in one consolidated location.

#### Acceptance Criteria

1. THE Mail_Configuration_Page SHALL be accessible via a dedicated entry in the admin navigation menu, separate from the existing Settings page
2. THE Mail_Configuration_Page SHALL organize content into distinct sections: SMTP Configuration, Templates, and Test
3. WHEN an unauthenticated user attempts to access the Mail_Configuration_Page, THE Mail_Configuration_Page SHALL redirect the user to the login page
4. THE Mail_Configuration_Page SHALL apply the existing admin back-office design system using Tailwind CSS classes consistent with other admin pages

### Requirement 7: Sécurité des données SMTP

**User Story:** As an Administrator, I want SMTP credentials to be stored securely, so that sensitive connection details are protected from unauthorized access.

#### Acceptance Criteria

1. WHEN the SMTP_Configuration_Service persists SMTP credentials, THE SMTP_Configuration_Service SHALL encrypt the password value before storing it in the Settings_Repository
2. WHEN the SMTP_Configuration_Service retrieves SMTP credentials for display, THE SMTP_Configuration_Service SHALL return a masked representation of the password
3. THE SMTP_Configuration_Service SHALL expose SMTP configuration endpoints only to authenticated Administrators with valid JWT tokens
4. WHEN the SMTP_Configuration_Service receives a request without a valid JWT token, THE SMTP_Configuration_Service SHALL respond with a 401 Unauthorized status
