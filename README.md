# AOPIA (WizzyLearn) Project

## Project Overview

This project, "WizzyLearn" for AOPIA and LIKE Formation, addresses the regulatory changes in CPF (Compte Personnel de Formation) that capped formation costs at €1,500. To adapt, this tool provides a needs analysis that guides candidates through a combined two-formation pathway (2 x €1,500 = €3,000). The process is traceable, secure, and timestamped to meet Caisse des Dépôts audit requirements.

## Key Features & User Journey

The application guides users through a 5-step process:

1.  **Identification**: Collects candidate information and associates them with a commercial advisor.
2.  **Situation & Prerequisites**: Diagnoses professional background and general digital skills.
3.  **Formation Selection**: Allows the candidate to choose a target formation (e.g., English TOEIC, Excel, Google Sheets).
4.  **Placement Test**: A progressive and adaptive test by level (A1, A2, B1, B2). Based on success or failure, an appropriate recommendation is generated.
5.  **Results & Validation**: Provides an automated pathway recommendation (P1, P2, P1 & P2, or P3), generates a high-fidelity PDF report, sends it via email to the advisor, and archives it in the database.

## Technical Architecture

The application utilizes a modern, decoupled architecture:

| Layer         | Technologies                                     | Main Role                                                                                              |
| :------------ | :----------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Frontend**  | Vue.js 3 (Composition API), Vite, Pinia, Tailwind CSS, Axios | Premium, responsive-first SPA interface, fluid animations, reactive user workflow management.            |
| **Backend**   | NestJS (TypeScript), TypeORM                     | Modular RESTful API, business logic management, PDF generation, automatic email sending.               |
| **Persistence** | PostgreSQL (Prod), SQLite (Dev)                  | Storage for questions, sessions, admin users, filtering rules.                                           |
| **Engines**   | PDFKit, Nodemailer                               | High-quality document generation services and integrated SMTP for reporting.                           |

## Project Structure

The project is organized into several key directories:

*   **Documentation & Utilities**: Markdown files (`CDC_Fonctionnel_WizzyLearn.md`, `CDC_Technique_WizzyLearn.md`, `FIL_DARIANE.md`, `CHANGELOG.md`, `ANALYSIS_P3_FILTER_RULES.md`, `P3_IMPLEMENTATION_COMPLETE.md`) and utility scripts (`convert_docs.py`, `convert_msg.py`).
*   **Backend (`/projet-app/backend/`)**: A NestJS application structured with autonomous modules for admin, authentication, contacts, email, entities, formations, PDF generation, questions, sessions, and settings.
*   **Frontend (`/projet-app/frontend/`)**: A Vue 3 application using Vite, with components (`src/components/`), state managers (`src/stores/`), and views (`src/views/`) for the candidate journey and administrative dashboard.

For a more detailed breakdown of the project structure and technical skills, please refer to `PROJECT_INDEX_AND_SKILLS.md`.

## Setup and Installation

This project uses Docker for containerization. To set up the project locally, you will need Docker installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mblitmanager/Analyse-des-besoins.git
    cd Analyse-des-besoins
    ```

2.  **Start Docker containers:**
    The `docker-compose.yml` file defines services for the backend and frontend.
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker images for the backend and frontend and start the services.

## Usage

Once the Docker containers are running:

*   **Backend API**: Accessible on `http://localhost:3001`
*   **Frontend Application**: Accessible on `http://localhost:8080`

The frontend application provides the user interface for the 5-step candidate journey, while the backend handles the business logic, PDF generation, and email services.
