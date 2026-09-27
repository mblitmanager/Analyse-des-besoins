#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose -p analyse-e2e -f "$ROOT_DIR/docker-compose.e2e.yml")
SOURCE_POSTGRES_CONTAINER="${SOURCE_POSTGRES_CONTAINER:-aopia_postgres}"
API_URL="http://localhost:3003/api"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_DIR="test-results/e2e-screenshots-$RUN_ID"
REPORT_DIR="playwright-report/e2e-screenshots-$RUN_ID"

if ! docker inspect "$SOURCE_POSTGRES_CONTAINER" >/dev/null 2>&1; then
  printf 'Source PostgreSQL container not found: %s\n' "$SOURCE_POSTGRES_CONTAINER" >&2
  exit 1
fi

cleanup() {
  local status=$?
  trap - EXIT
  if [[ $status -ne 0 ]]; then
    "${COMPOSE[@]}" logs --no-color e2e-backend >&2 || true
  fi
  "${COMPOSE[@]}" down --volumes --remove-orphans >/dev/null
  exit "$status"
}
trap cleanup EXIT

"${COMPOSE[@]}" up -d --wait e2e-postgres

docker exec "$SOURCE_POSTGRES_CONTAINER" sh -c \
  'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --schema-only --no-owner --no-privileges' |
  "${COMPOSE[@]}" exec -T e2e-postgres psql --set ON_ERROR_STOP=1 --username=e2e --dbname=e2e

docker exec "$SOURCE_POSTGRES_CONTAINER" sh -c \
  'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --data-only --no-owner --no-privileges --table=public.formations --table=public.levels --table=public.questions --table=public.workflow_steps --table=public.parcours_rules --table=public.question_rules --table=public.p3_filter_rule --table=public.p3_override_rules' |
  "${COMPOSE[@]}" exec -T e2e-postgres psql --set ON_ERROR_STOP=1 --username=e2e --dbname=e2e

"${COMPOSE[@]}" exec -T e2e-postgres psql --set ON_ERROR_STOP=1 --username=e2e --dbname=e2e --command \
  "INSERT INTO settings (key, value, description) VALUES
    ('AUTO_SEND_EMAIL', 'false', 'E2E: disable outbound mail'),
    ('ENABLE_P3', 'true', 'E2E: enable the third journey'),
    ('AUTO_SKIP_PREREQUIS', 'false', 'E2E: exercise prerequisites'),
    ('AUTO_SKIP_MISE_A_NIVEAU', 'true', 'E2E: skip empty leveling step'),
    ('AUTO_SKIP_POSITIONNEMENT', 'false', 'E2E: exercise positioning'),
    ('AUTO_SKIP_COMPLEMENTARY', 'false', 'E2E: exercise complementary questions'),
    ('AUTO_SKIP_AVAILABILITIES', 'false', 'E2E: exercise availability questions')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description"

"${COMPOSE[@]}" up -d --build --wait e2e-backend

cd "$ROOT_DIR/projet-app/frontend"
API_BASE_URL="$API_URL" \
VITE_API_BASE_URL="$API_URL" \
PLAYWRIGHT_HTML_OUTPUT_DIR="$REPORT_DIR" \
PLAYWRIGHT_HTML_OPEN=never \
  npx playwright test tests/e2e-p3-flow.spec.ts \
    --project=chromium \
    --workers=1 \
    --output="$OUTPUT_DIR"

printf '\nCaptures: %s/%s\nRapport: %s/%s/index.html\n' \
  "$ROOT_DIR/projet-app/frontend" "$OUTPUT_DIR" \
  "$ROOT_DIR/projet-app/frontend" "$REPORT_DIR"