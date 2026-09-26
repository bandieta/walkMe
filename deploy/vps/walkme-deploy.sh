#!/usr/bin/env bash
# Pull-based deployer for the walkMe VPS (see README.md next to this file).
#
# Run by walkme-deploy.timer. Each run looks up the newest completed run of the
# CI/CD workflow on main. If its "Test" job passed and that commit isn't
# deployed yet, it deploys exactly that commit: server (migrations, build,
# restart, health check, automatic rollback), admin panel, and the Android/iOS
# build artifacts onto the downloads page. The result is posted back to GitHub
# as a commit status ("deploy/dagora.tech").
set -euo pipefail

# This file lives in the checkout that a deploy updates, and bash reads scripts
# lazily — so run from a private copy, never from the file git may rewrite.
if [ -z "${WALKME_DEPLOY_COPY:-}" ]; then
  self_copy="$(mktemp /tmp/walkme-deploy.XXXXXX)"
  cp "$0" "$self_copy"
  WALKME_DEPLOY_COPY="$self_copy" exec bash "$self_copy" "$@"
fi
trap 'rm -f "$WALKME_DEPLOY_COPY"' EXIT

REPO="${WALKME_REPO:-bandieta/walkMe}"
WORKFLOW="${WALKME_WORKFLOW:-ci-cd.yml}"
APP_DIR="${WALKME_DIR:-/root/walkMe}"
SERVICE="${WALKME_SERVICE:-walkme}"
PUBLIC_URL="${WALKME_PUBLIC_URL:-https://dagora.tech/walkMe}"
ADMIN_WWW="${WALKME_ADMIN_WWW:-/var/www/walkme-admin}"
DOWNLOADS_WWW="${WALKME_DOWNLOADS_WWW:-/var/www/walkme-downloads}"
STATE_DIR="${WALKME_STATE_DIR:-/var/lib/walkme-deploy}"
BACKUP_DIR="${WALKME_BACKUP_DIR:-/root/walkme-backups}"
KEEP_BUILDS=5

log() { echo "[$(date -u +%FT%TZ)] $*"; }

# Only one deploy at a time; a timer tick that overlaps a running deploy just exits.
exec 9>/run/walkme-deploy.lock
flock -n 9 || { log "another deploy is running — skipping"; exit 0; }

mkdir -p "$STATE_DIR" "$BACKUP_DIR"
deployed_sha="$(cat "$STATE_DIR/deployed_sha" 2>/dev/null || true)"
failed_sha="$(cat "$STATE_DIR/failed_sha" 2>/dev/null || true)"

if ! run="$(gh run list -R "$REPO" --workflow "$WORKFLOW" --branch main --status completed --limit 1 \
  --json databaseId,headSha,number,event -q '.[0] | select(.event != "pull_request") | "\(.databaseId) \(.headSha) \(.number)"' 2>&1)"; then
  # e.g. the workflow isn't on main yet, or GitHub is unreachable — try again next tick.
  log "can't list $WORKFLOW runs: $run"
  exit 0
fi
[ -n "$run" ] || exit 0   # no completed run on main yet
read -r run_id sha run_number <<<"$run"

[ "$sha" != "$deployed_sha" ] || exit 0          # already live
[ "$sha" != "$failed_sha" ] || exit 0            # already tried and failed; wait for a new commit

test_result="$(gh run view "$run_id" -R "$REPO" --json jobs -q '.jobs[] | select(.name == "Test") | .conclusion')"
if [ "$test_result" != "success" ]; then
  log "run #$run_number (${sha:0:7}): Test job is '$test_result' — not deploying"
  echo "$sha" >"$STATE_DIR/failed_sha"
  exit 0
fi

run_url="https://github.com/$REPO/actions/runs/$run_id"
status() {
  gh api -X POST "repos/$REPO/statuses/$sha" -f state="$1" -f context="deploy/dagora.tech" \
    -f description="$2" -f target_url="$run_url" >/dev/null 2>&1 || true
}
fail() {
  log "DEPLOY FAILED: $*"
  echo "$sha" >"$STATE_DIR/failed_sha"
  status failure "$*"
  exit 1
}

log "deploying ${sha:0:7} (CI/CD run #$run_number)"
status pending "Deploying to dagora.tech"

cd "$APP_DIR"
git diff --quiet && git diff --cached --quiet || fail "working tree in $APP_DIR has local changes"
git fetch -q origin main
git cat-file -e "$sha^{commit}" 2>/dev/null || fail "commit $sha not found after fetch"
prev_sha="$(git rev-parse HEAD)"
git checkout -q main
git merge -q --ff-only "$sha" || fail "local main can't fast-forward to ${sha:0:7}"

rebuild_server() {
  # Chained with && on purpose: errexit is off inside functions called from `a || b`.
  npm install --no-audit --no-fund --loglevel=error &&
    { git checkout -q -- package-lock.json 2>/dev/null || true; } &&   # npm reshuffles metadata; keep the tree clean
    (cd server && npx prisma generate >/dev/null && npm run build --silent)
}
healthy() {
  for _ in $(seq 1 20); do
    curl -fsS -o /dev/null "http://127.0.0.1:4000/health" && return 0
    sleep 1
  done
  return 1
}

# ── Server ──────────────────────────────────────────────────────────────────
# Build while the old version keeps serving; stop only for backup + migrations.
rebuild_server || { git reset -q --hard "$prev_sha"; rebuild_server || true; fail "server build failed on ${sha:0:7}; still running ${prev_sha:0:7}"; }

db_backup="$BACKUP_DIR/dev.db.$(date -u +%Y%m%d%H%M%S).${sha:0:7}"
systemctl stop "$SERVICE"
cp server/prisma/dev.db "$db_backup"
ls -1t "$BACKUP_DIR"/dev.db.* 2>/dev/null | tail -n +31 | xargs -r rm -f   # keep the last 30

if ! { (cd server && npx prisma migrate deploy >/dev/null) && systemctl start "$SERVICE" && healthy; }; then
  log "server failed to come up on ${sha:0:7} — rolling back to ${prev_sha:0:7}"
  systemctl stop "$SERVICE" || true
  cp "$db_backup" server/prisma/dev.db
  git reset -q --hard "$prev_sha"
  { rebuild_server && systemctl start "$SERVICE" && healthy; } || log "ROLLBACK ALSO FAILED — server needs attention"
  fail "server did not pass its health check; rolled back to ${prev_sha:0:7}"
fi
log "server is up on ${sha:0:7}"

# ── Admin panel ─────────────────────────────────────────────────────────────
(
  cd admin
  npm ci --include=dev --no-audit --no-fund --loglevel=error
  VITE_API_BASE_URL="$PUBLIC_URL/api/v1/admin" npx vite build --base /walkMe/admin/ --logLevel error
) || fail "admin panel build failed (server is deployed)"
mkdir -p "$ADMIN_WWW"
rsync -a --delete admin/dist/ "$ADMIN_WWW/"
log "admin panel published"

# ── Mobile builds → downloads page ──────────────────────────────────────────
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp" "$WALKME_DEPLOY_COPY"' EXIT
gh run download "$run_id" -R "$REPO" -D "$tmp" >/dev/null 2>&1 || log "no build artifacts on run #$run_number"
build_dir="$DOWNLOADS_WWW/builds/$run_number"
mkdir -p "$build_dir"
find "$tmp" -type f \( -name '*.apk' -o -name '*.zip' \) -exec cp {} "$build_dir/" \;
printf '%s\n%s\n%s\n' "$sha" "$(date -u '+%Y-%m-%d %H:%M UTC')" "$run_url" >"$build_dir/BUILD_INFO"
ls -1dt "$DOWNLOADS_WWW"/builds/*/ | tail -n +$((KEEP_BUILDS + 1)) | xargs -r rm -rf
"$APP_DIR/deploy/vps/render-downloads.sh" "$DOWNLOADS_WWW" "$REPO"
log "downloads page updated ($(ls "$build_dir" | grep -cv BUILD_INFO) files)"

echo "$sha" >"$STATE_DIR/deployed_sha"
rm -f "$STATE_DIR/failed_sha"
status success "Live on dagora.tech (run #$run_number)"
log "deploy of ${sha:0:7} complete"
