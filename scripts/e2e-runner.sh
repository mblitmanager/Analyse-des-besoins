#!/usr/bin/env bash
# Runs the E2E campaigns requested from admin > Tests (/admin/test-validation).
# The backend only writes request files into e2e-requests/; this script, run every
# minute by cron on the host, runs them one at a time and reports its state in
# e2e-results/runner-status.json (read by the backend).
#
#   * * * * * /var/www/Analyse-v2/scripts/e2e-runner.sh >> /var/www/Analyse-v2/e2e-results/runner.log 2>&1
set -uo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUESTS_DIR="$ROOT_DIR/e2e-requests"
RESULTS_DIR="$ROOT_DIR/e2e-results"
STATUS_FILE="$RESULTS_DIR/runner-status.json"
mkdir -p "$REQUESTS_DIR" "$RESULTS_DIR"

# One runner at a time (cron starts one every minute).
exec 9>"$RESULTS_DIR/.runner.lock"
flock -n 9 || exit 0

request="$(ls -1 "$REQUESTS_DIR"/*.json 2>/dev/null | head -1 || true)"
[ -n "$request" ] || exit 0

# Writes runner-status.json; values come from validated JSON, never evaluated by a shell.
write_status() {
  STATUS_FILE="$STATUS_FILE" node -e '
    const fs = require("fs");
    const file = process.env.STATUS_FILE;
    let current = {};
    try { current = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
    const update = JSON.parse(process.argv[1]);
    fs.writeFileSync(file + ".tmp", JSON.stringify({ ...current, ...update, updatedAt: new Date().toISOString() }, null, 2));
    fs.renameSync(file + ".tmp", file);
  ' "$1"
}

# Request values, validated again here (slugs only, boolean P3).
parsed="$(node -e '
  const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const slugs = (Array.isArray(r.formations) ? r.formations : []).filter((s) => /^[\w-]{1,60}$/.test(s));
  console.log(JSON.stringify({ id: String(r.id || "").replace(/[^\w]/g, ""), requestedBy: String(r.requestedBy || "").slice(0, 120), formations: slugs, p3: r.p3 !== false }));
' "$request" 2>/dev/null)" || { rm -f "$request"; exit 0; }

# The isolated stack (API :3003) and the Vite dev server (:5173) are shared: wait if busy.
if ss -ltn 2>/dev/null | grep -qE ':(3003|5173)\s'; then
  write_status "$(node -e 'const p=JSON.parse(process.argv[1]); console.log(JSON.stringify({ state: "waiting", request: p, message: "Environnement de test occupé, démarrage dès qu’il se libère" }))' "$parsed")"
  exit 0
fi

run_id="$(date -u +%Y%m%dT%H%M%SZ)"
formations="$(node -e 'console.log(JSON.parse(process.argv[1]).formations.join(","))' "$parsed")"
p3="$(node -e 'console.log(JSON.parse(process.argv[1]).p3 ? "1" : "0")' "$parsed")"
log="$RESULTS_DIR/runner-$run_id.log"
rm -f "$request"

write_status "$(node -e 'const p=JSON.parse(process.argv[1]); console.log(JSON.stringify({ state: "running", request: p, runId: process.argv[2], startedAt: new Date().toISOString(), finishedAt: null, exitCode: null, progress: null, message: null }))' "$parsed" "$run_id")"

# Progress "[done/total]" from the Playwright line reporter.
(
  while sleep 20; do
    progress="$(sed 's/\x1b\[[0-9;]*[mAK]//g' "$log" 2>/dev/null | grep -oE '^\[[0-9]+/[0-9]+\]' | tail -1 | tr -d '[]')"
    [ -n "$progress" ] && write_status "{\"progress\":{\"done\":${progress%/*},\"total\":${progress#*/}}}"
  done
) &
progress_pid=$!

E2E_RUN_ID="$run_id" E2E_SPEC="e2e-matrix.spec.ts e2e-scenarios.spec.ts" E2E_WORKERS=2 E2E_FORMATIONS="$formations" E2E_P3="$p3" \
  bash "$ROOT_DIR/scripts/run-e2e-screenshots.sh" > "$log" 2>&1
status=$?

kill "$progress_pid" 2>/dev/null
wait "$progress_pid" 2>/dev/null
state=done
[ -f "$RESULTS_DIR/$run_id/run.json" ] || state=failed
write_status "{\"state\":\"$state\",\"finishedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"exitCode\":$status}"
