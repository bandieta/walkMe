#!/usr/bin/env bash
# Install / update the walkMe server and (re)start it under PM2.
# First run creates server/.env with random JWT secrets. Re-run after every `git pull`.
#
# Usage (from anywhere inside the repo):
#   DOMAIN=api.example.com bash deploy/hostinger/deploy.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
ADMIN_DIR="$REPO_ROOT/admin"
cd "$REPO_ROOT"

# 1. server/.env — created once, never overwritten.
if [[ ! -f "$SERVER_DIR/.env" ]]; then
  : "${DOMAIN:?First deploy needs DOMAIN, e.g. DOMAIN=api.example.com bash $0}"
  secret() { node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"; }
  sed \
    -e "s|^NODE_ENV=.*|NODE_ENV=production|" \
    -e "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://$DOMAIN|" \
    -e "s|^DATABASE_URL=.*|DATABASE_URL=\"file:./prod.db\"|" \
    -e "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$(secret)|" \
    -e "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(secret)|" \
    -e "s|^JWT_ADMIN_SECRET=.*|JWT_ADMIN_SECRET=$(secret)|" \
    -e "s|^ALLOW_DEV_LOGIN=.*|ALLOW_DEV_LOGIN=false|" \
    "$SERVER_DIR/.env.example" > "$SERVER_DIR/.env"
  chmod 600 "$SERVER_DIR/.env"
  echo "Created server/.env — fill in GOOGLE_CLIENT_ID / FACEBOOK_* / APPLE_BUNDLE_ID / RESEND_API_KEY / ADMIN_EMAIL / ADMIN_PASSWORD, then re-run this script."
fi

# 2. Install only the server workspace. --ignore-scripts skips the root `husky`
#    prepare hook (a dev tool not installed here); Prisma is generated explicitly.
npm ci --workspace=server --include-workspace-root=false --ignore-scripts --no-audit --no-fund

cd "$SERVER_DIR"
mkdir -p uploads logs

# Prisma CLI reads .env itself, but the seed script (tsx) doesn't — export it.
set -a; source ./.env; set +a

npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts        # idempotent: skips when places already exist
npx tsx prisma/seed-admin.ts  # idempotent: no-op unless ADMIN_EMAIL/ADMIN_PASSWORD are set in .env
npm run build

# 3. Start or zero-downtime reload.
pm2 startOrReload "$REPO_ROOT/deploy/hostinger/ecosystem.config.cjs" --update-env
pm2 save

sleep 2
curl -fsS "http://127.0.0.1:${PORT:-4000}/health" && echo && echo "walkMe server is up."

# 4. Build the admin panel as static files, pointed at this same server's API.
# Nginx serves admin/dist at /admin/ (see setup-nginx.sh) — no PM2 process needed.
# admin/ has its own package-lock.json (deliberately not an npm workspace of
# the repo root, so installing it never touches mobile/backend/server's tree).
# --include=dev: NODE_ENV=production is exported into this shell by sourcing
# server/.env above, which would otherwise make npm skip devDependencies —
# and vite/@vitejs/plugin-react (needed just to build) live there.
(cd "$ADMIN_DIR" && npm ci --include=dev --ignore-scripts --no-audit --no-fund && VITE_API_BASE_URL="${PUBLIC_BASE_URL}/api/v1/admin" npx vite build)
echo "Admin panel built -> $ADMIN_DIR/dist (served at ${PUBLIC_BASE_URL}/admin/)."
