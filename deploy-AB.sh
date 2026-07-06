#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/var/www/Analyse-des-besoins}"
BACKEND_DIR="$APP_ROOT/projet-app/backend"
FRONTEND_DIR="$APP_ROOT/projet-app/frontend"

BACKEND_DOMAIN="${BACKEND_DOMAIN:-ab-back.mbl-service.com}"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-ns-conseil-ab.mbl-service.com}"
BACKEND_PORT="${BACKEND_PORT:-3001}"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-analyse_user}"
DB_PASS="${DB_PASS:-postgres}"

RUN_GIT_PULL="${RUN_GIT_PULL:-1}"
RUN_CERTBOT="${RUN_CERTBOT:-1}"

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="/root/ab-deploy-backup-$STAMP"

log() {
  echo
  echo "============================================================"
  echo "==> $*"
  echo "============================================================"
}

warn() {
  echo
  echo "⚠️  $*"
}

fail() {
  echo
  echo "❌ $*"
  exit 1
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    fail "Lance ce script en root."
  fi
}

cmd_exists() {
  command -v "$1" >/dev/null 2>&1
}

get_env_value() {
  local file="$1"
  local key="$2"

  if [ -f "$file" ]; then
    grep -E "^${key}=" "$file" | tail -1 | cut -d= -f2- || true
  fi
}

set_env() {
  local file="$1"
  local key="$2"
  local value="$3"

  touch "$file"

  if grep -qE "^${key}=" "$file"; then
    awk -v k="$key" -v v="$value" '
      BEGIN { FS="=" }
      $1 == k { print k "=" v; next }
      { print }
    ' "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

db_exists() {
  local db="$1"
  sudo -u postgres psql -lqt 2>/dev/null | cut -d '|' -f 1 | sed 's/^ *//;s/ *$//' | grep -qx "$db"
}

detect_db_name() {
  local env_file="$BACKEND_DIR/.env"
  local db=""

  db="$(get_env_value "$env_file" "DB_DATABASE")"
  [ -z "$db" ] && db="$(get_env_value "$env_file" "DB_NAME")"
  [ -z "$db" ] && db="$(get_env_value "$env_file" "DATABASE_NAME")"

  if [ -z "$db" ]; then
    local url
    url="$(get_env_value "$env_file" "DATABASE_URL")"
    if [ -n "$url" ]; then
      db="$(echo "$url" | sed -E 's#.*:5432/([^?]+).*#\1#')"
    fi
  fi

  if [ -z "$db" ]; then
    db="analyse_besoins"
  fi

  if ! db_exists "$db"; then
    warn "La base détectée '$db' n'existe pas. Recherche d'une base existante connue..."
    for candidate in analyse_besoins wizzylearn postgres; do
      if db_exists "$candidate"; then
        db="$candidate"
        break
      fi
    done
  fi

  echo "$db"
}

require_root

log "Vérification des dossiers"
[ -d "$APP_ROOT" ] || fail "Dossier projet introuvable: $APP_ROOT"
[ -d "$BACKEND_DIR" ] || fail "Dossier backend introuvable: $BACKEND_DIR"
[ -d "$FRONTEND_DIR" ] || fail "Dossier frontend introuvable: $FRONTEND_DIR"

mkdir -p "$BACKUP_DIR"

log "Installation/vérification des dépendances système"
apt-get update -y
apt-get install -y apache2 certbot python3-certbot-apache postgresql-client curl git

if ! cmd_exists node; then
  fail "Node.js n'est pas installé. Installe Node.js avant de continuer."
fi

if ! cmd_exists npm; then
  fail "npm n'est pas installé."
fi

if ! cmd_exists pm2; then
  npm install -g pm2
fi

log "Backup des fichiers .env"
[ -f "$BACKEND_DIR/.env" ] && cp -a "$BACKEND_DIR/.env" "$BACKUP_DIR/backend.env"
[ -f "$FRONTEND_DIR/.env" ] && cp -a "$FRONTEND_DIR/.env" "$BACKUP_DIR/frontend.env"
[ -f "$FRONTEND_DIR/.env.production" ] && cp -a "$FRONTEND_DIR/.env.production" "$BACKUP_DIR/frontend.env.production"

log "Git pull"
cd "$APP_ROOT"

if [ "$RUN_GIT_PULL" = "1" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    git stash push -u -m "deploy-auto-$STAMP" || true
  fi

  git pull --ff-only origin main
else
  warn "RUN_GIT_PULL=0, git pull ignoré."
fi

log "Restauration des .env serveur"
[ -f "$BACKUP_DIR/backend.env" ] && cp -a "$BACKUP_DIR/backend.env" "$BACKEND_DIR/.env"
[ -f "$BACKUP_DIR/frontend.env" ] && cp -a "$BACKUP_DIR/frontend.env" "$FRONTEND_DIR/.env"

log "Détection de la base PostgreSQL"
DB_NAME="${DB_NAME:-$(detect_db_name)}"
echo "Base utilisée: $DB_NAME"

if ! db_exists "$DB_NAME"; then
  fail "La base '$DB_NAME' n'existe pas. Corrige DB_NAME ou restaure la base avant de relancer."
fi

log "Correction .env backend"
BACKEND_ENV="$BACKEND_DIR/.env"

set_env "$BACKEND_ENV" "NODE_ENV" "production"
set_env "$BACKEND_ENV" "PORT" "$BACKEND_PORT"

set_env "$BACKEND_ENV" "DB_HOST" "$DB_HOST"
set_env "$BACKEND_ENV" "DB_PORT" "$DB_PORT"
set_env "$BACKEND_ENV" "DB_USER" "$DB_USER"
set_env "$BACKEND_ENV" "DB_USERNAME" "$DB_USER"
set_env "$BACKEND_ENV" "DB_PASSWORD" "$DB_PASS"
set_env "$BACKEND_ENV" "DB_NAME" "$DB_NAME"
set_env "$BACKEND_ENV" "DB_DATABASE" "$DB_NAME"
set_env "$BACKEND_ENV" "DATABASE_NAME" "$DB_NAME"
set_env "$BACKEND_ENV" "DATABASE_URL" "postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

set_env "$BACKEND_ENV" "FRONTEND_URL" "https://$FRONTEND_DOMAIN"
set_env "$BACKEND_ENV" "CORS_ORIGIN" "https://$FRONTEND_DOMAIN"
set_env "$BACKEND_ENV" "TYPEORM_SYNCHRONIZE" "false"

if ! grep -qE '^ENCRYPTION_KEY=' "$BACKEND_ENV"; then
  set_env "$BACKEND_ENV" "ENCRYPTION_KEY" "$(openssl rand -hex 32)"
fi

grep -E '^NODE_ENV=|^PORT=|^DB_|^DATABASE_|^FRONTEND_URL=|^CORS_ORIGIN=|^TYPEORM_SYNCHRONIZE=|^ENCRYPTION_KEY=' "$BACKEND_ENV"

log "Correction TypeORM synchronize:false"
cd "$BACKEND_DIR"

node <<'NODE'
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      files = files.concat(walk(full));
    } else if (full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

for (const file of walk('src')) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(/synchronize\s*:\s*true/g, 'synchronize: false');
  content = content.replace(
    /synchronize\s*:\s*process\.env\.NODE_ENV\s*!==\s*['"`]production['"`]/g,
    'synchronize: false'
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('patched synchronize:', file);
  }
}
NODE

grep -R "synchronize" -n src || true

log "Correction tsconfig pour build propre"
node <<'NODE'
const fs = require('fs');

for (const file of ['tsconfig.json', 'tsconfig.build.json']) {
  if (!fs.existsSync(file)) continue;

  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.compilerOptions = json.compilerOptions || {};
  json.compilerOptions.incremental = false;
  json.compilerOptions.noEmit = false;

  if (file === 'tsconfig.build.json') {
    json.compilerOptions.outDir = './dist';
    json.compilerOptions.rootDir = './src';
    json.include = json.include || ['src/**/*'];
    json.exclude = json.exclude || ['node_modules', 'test', 'dist', '**/*spec.ts'];
  }

  delete json.compilerOptions.tsBuildInfoFile;

  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  console.log('patched tsconfig:', file);
}
NODE

log "Droits PostgreSQL sur la base $DB_NAME"
sudo -u postgres psql -d "$DB_NAME" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE "$DB_USER" LOGIN PASSWORD '$DB_PASS';
  ELSE
    ALTER ROLE "$DB_USER" WITH LOGIN PASSWORD '$DB_PASS';
  END IF;
END
\$\$;

GRANT CONNECT ON DATABASE "$DB_NAME" TO "$DB_USER";
GRANT USAGE, CREATE ON SCHEMA public TO "$DB_USER";

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "$DB_USER";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "$DB_USER";
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "$DB_USER";

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO "$DB_USER";
SQL

log "Build backend"
cd "$BACKEND_DIR"

rm -rf dist
find . -name "*.tsbuildinfo" -delete

npm ci || npm install
npm run build

[ -f "$BACKEND_DIR/dist/main.js" ] || fail "dist/main.js introuvable après build."

log "Scripts post-déploiement backend si présents"
cd "$BACKEND_DIR"

for script in add_p3_settings.js update_parcours_rules_2026.js update_anglais_levels.js; do
  if [ -f "$script" ]; then
    echo "Exécution: node $script"
    node "$script" || warn "Script $script terminé avec erreur. Vérifier s'il est idempotent ou dépendant de données."
  fi
done

log "Configuration frontend env"
cd "$FRONTEND_DIR"

cat > .env.production <<EOF
VITE_API_URL=https://$BACKEND_DOMAIN/api
REACT_APP_API_URL=https://$BACKEND_DOMAIN/api
EOF

log "Build frontend"
npm ci || npm install
npm run build

[ -f "$FRONTEND_DIR/dist/index.html" ] || fail "dist/index.html introuvable après build frontend."

log "Configuration Apache"
a2enmod proxy proxy_http headers rewrite ssl >/dev/null

cat > "/etc/apache2/sites-available/$BACKEND_DOMAIN.conf" <<EOF
<VirtualHost *:80>
    ServerName $BACKEND_DOMAIN

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:$BACKEND_PORT/
    ProxyPassReverse / http://127.0.0.1:$BACKEND_PORT/

    RequestHeader set X-Forwarded-Proto "http"

    ErrorLog \${APACHE_LOG_DIR}/$BACKEND_DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$BACKEND_DOMAIN-access.log combined
</VirtualHost>
EOF

cat > "/etc/apache2/sites-available/$FRONTEND_DOMAIN.conf" <<EOF
<VirtualHost *:80>
    ServerName $FRONTEND_DOMAIN

    DocumentRoot $FRONTEND_DIR/dist

    <Directory $FRONTEND_DIR/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-access.log combined
</VirtualHost>
EOF

a2ensite "$BACKEND_DOMAIN.conf" >/dev/null
a2ensite "$FRONTEND_DOMAIN.conf" >/dev/null

apachectl configtest
systemctl reload apache2

log "Redémarrage PM2 backend"
cd "$BACKEND_DIR"

pm2 delete ab-back 2>/dev/null || true
pm2 start dist/main.js --name ab-back --update-env --time
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
pm2 save

sleep 5

log "Test backend local"
curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" || {
  pm2 logs ab-back --lines 120 --nostream || true
  fail "Healthcheck local KO."
}

echo
echo "Backend local OK."

log "Certbot SSL"
if [ "$RUN_CERTBOT" = "1" ]; then
  certbot --apache \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    -d "$BACKEND_DOMAIN" \
    -d "$FRONTEND_DOMAIN" || warn "Certbot a échoué. Vérifie DNS/Apache, puis relance certbot manuellement."

  systemctl reload apache2 || true
else
  warn "RUN_CERTBOT=0, certbot ignoré."
fi

log "Tests finaux"
echo
echo "1) Backend local:"
curl -i "http://127.0.0.1:$BACKEND_PORT/api/health" || true

echo
echo "2) Backend HTTPS:"
curl -i "https://$BACKEND_DOMAIN/api/health" || true

echo
echo "3) Frontend HTTPS:"
curl -I "https://$FRONTEND_DOMAIN" || true

echo
echo "4) Endpoints applicatifs:"
for endpoint in workflow settings/ENABLE_REFERRAL contacts; do
  echo
  echo "GET /api/$endpoint"
  curl -sS -o /tmp/ab_endpoint.out -w "HTTP %{http_code}\n" "https://$BACKEND_DOMAIN/api/$endpoint" || true
  head -c 500 /tmp/ab_endpoint.out || true
  echo
done

log "Statut PM2"
pm2 status

log "Déploiement terminé"
echo "Backup .env: $BACKUP_DIR"
echo "Backend:  https://$BACKEND_DOMAIN/api/health"
echo "Frontend: https://$FRONTEND_DOMAIN"
