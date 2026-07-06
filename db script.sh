#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="/var/www/Analyse-des-besoins"
BACKEND_DIR="$APP_ROOT/projet-app/backend"

# Fichier SQL à importer.
# Priorité :
# 1) variable SQL_FILE passée au lancement
# 2) fichier .sql le plus récent à la racine APP_ROOT
SQL_FILE="${SQL_FILE:-}"

if [ -z "$SQL_FILE" ]; then
  SQL_FILE="$(find "$APP_ROOT" -maxdepth 1 -type f -iname "*.sql" -printf "%T@ %p\\n" | sort -nr | head -n 1 | cut -d " " -f2-)"
fi

DB_NAME="${DB_NAME:-analyse_besoins}"
DB_USER="${DB_USER:-analyse_user}"
DB_PASS="${DB_PASS:-postgres}"

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="/root/${DB_NAME}_backup_before_drop_${STAMP}.sql"
CLEAN_SQL="/tmp/${DB_NAME}_wizzy_clean_${STAMP}.sql"

echo "============================================================"
echo "DROP + CREATE + IMPORT"
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
echo "SQL_FILE=$SQL_FILE"
echo "BACKUP_FILE=$BACKUP_FILE"
echo "============================================================"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERREUR: fichier SQL introuvable: $SQL_FILE"
  echo "Cherche avec:"
  echo "find /var/www/Analyse-des-besoins -name 'wizzy-06072026.sql' -type f"
  exit 1
fi

cd "$BACKEND_DIR"

echo "==> Stop backend PM2"
pm2 stop ab-back 2>/dev/null || true

echo "==> Backup ancienne base si elle existe"
if sudo -u postgres psql -lqt | cut -d '|' -f 1 | sed 's/^ *//;s/ *$//' | grep -qx "$DB_NAME"; then
  sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE"
  echo "Backup créé: $BACKUP_FILE"
else
  echo "Base $DB_NAME inexistante, pas de backup."
fi

echo "==> Nettoyage du dump SQL"
awk '
  /transaction_timeout/ { next }
  /^CREATE DATABASE / { next }
  /^ALTER DATABASE / { next }
  /^\\connect / { next }
  { print }
' "$SQL_FILE" > "$CLEAN_SQL"

echo "Dump nettoyé: $CLEAN_SQL"

echo "==> DROP + CREATE database"
sudo -u postgres psql <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME';

DROP DATABASE IF EXISTS "$DB_NAME";

DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE "$DB_USER" LOGIN PASSWORD '$DB_PASS';
  ELSE
    ALTER ROLE "$DB_USER" WITH LOGIN PASSWORD '$DB_PASS';
  END IF;
END
\$\$;

CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$DB_USER";
SQL

echo "==> Import SQL"
sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$CLEAN_SQL"

echo "==> Droits PostgreSQL"
sudo -u postgres psql -d "$DB_NAME" <<SQL
GRANT CONNECT ON DATABASE "$DB_NAME" TO "$DB_USER";
GRANT USAGE, CREATE ON SCHEMA public TO "$DB_USER";

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "$DB_USER";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "$DB_USER";
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "$DB_USER";

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO "$DB_USER";
SQL

echo "==> Patch compatibilité dernier code"
sudo -u postgres psql -d "$DB_NAME" <<'SQL'
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS "parcoursTitle" text;

ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS "stagiaireId" integer;

ALTER TABLE public.parcours_rules
ADD COLUMN IF NOT EXISTS "parcoursTitle" text;

ALTER TABLE public.p3_override_rules
ADD COLUMN IF NOT EXISTS "parcoursTitle" text;

ALTER TABLE public.sessions
ALTER COLUMN "brand" DROP NOT NULL,
ALTER COLUMN "civilite" DROP NOT NULL,
ALTER COLUMN "nom" DROP NOT NULL,
ALTER COLUMN "prenom" DROP NOT NULL,
ALTER COLUMN "telephone" DROP NOT NULL,
ALTER COLUMN "conseiller" DROP NOT NULL,
ALTER COLUMN "metier" DROP NOT NULL,
ALTER COLUMN "situation" DROP NOT NULL,
ALTER COLUMN "formationChoisie" DROP NOT NULL,
ALTER COLUMN "prerequisiteScore" DROP NOT NULL,
ALTER COLUMN "levelsScores" DROP NOT NULL,
ALTER COLUMN "positionnementAnswers" DROP NOT NULL,
ALTER COLUMN "scorePretest" DROP NOT NULL,
ALTER COLUMN "stopLevel" DROP NOT NULL,
ALTER COLUMN "stopLevelOrder" DROP NOT NULL,
ALTER COLUMN "finalRecommendation" DROP NOT NULL,
ALTER COLUMN "lastValidatedLevel" DROP NOT NULL,
ALTER COLUMN "bureautiqueSuite" DROP NOT NULL,
ALTER COLUMN "emailSentAt" DROP NOT NULL,
ALTER COLUMN "complementaryQuestions" DROP NOT NULL,
ALTER COLUMN "availabilities" DROP NOT NULL,
ALTER COLUMN "miseANiveauAnswers" DROP NOT NULL,
ALTER COLUMN "parrainNom" DROP NOT NULL,
ALTER COLUMN "parrainPrenom" DROP NOT NULL,
ALTER COLUMN "parrainEmail" DROP NOT NULL,
ALTER COLUMN "parrainTelephone" DROP NOT NULL,
ALTER COLUMN "explanationMessage" DROP NOT NULL,
ALTER COLUMN "parcoursTitle" DROP NOT NULL,
ALTER COLUMN "stagiaireId" DROP NOT NULL;
SQL

echo "==> Correction .env backend"
set_env () {
  KEY="$1"
  VALUE="$2"
  FILE=".env"

  if grep -q "^${KEY}=" "$FILE"; then
    sed -i "s|^${KEY}=.*|${KEY}=${VALUE}|" "$FILE"
  else
    echo "${KEY}=${VALUE}" >> "$FILE"
  fi
}

set_env NODE_ENV production
set_env PORT 3001

set_env DB_HOST 127.0.0.1
set_env DB_PORT 5432
set_env DB_USER "$DB_USER"
set_env DB_USERNAME "$DB_USER"
set_env DB_PASSWORD "$DB_PASS"
set_env DB_NAME "$DB_NAME"
set_env DB_DATABASE "$DB_NAME"
set_env DATABASE_NAME "$DB_NAME"
set_env DATABASE_URL "postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"
set_env TYPEORM_SYNCHRONIZE false

grep -q "^ENCRYPTION_KEY=" .env || echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env

echo "==> Redémarrage backend"
pm2 delete ab-back 2>/dev/null || true
pm2 start dist/main.js --name ab-back --update-env
pm2 save

sleep 5

echo "==> Tests"
curl -i http://127.0.0.1:3001/api/health || true

echo
curl -i http://127.0.0.1:3001/api/parcours || true

echo
curl -i -X POST http://127.0.0.1:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{}' || true

echo
echo "==> Logs récents"
pm2 logs ab-back --lines 80 --nostream || true

echo
echo "============================================================"
echo "Import terminé."
echo "Backup avant DROP: $BACKUP_FILE"
echo "DB importée: $DB_NAME"
echo "============================================================"
