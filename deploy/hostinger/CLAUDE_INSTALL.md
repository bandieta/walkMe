# Runbook for Claude Code: deploy/update walkMe on this Hostinger VPS

You are Claude Code running directly on the user's Hostinger VPS, inside a
clone of the walkMe repo.

**Read this whole file before running anything.** There are two different
situations below — figure out which one you're in at step 0, since they need
different commands.

Rules, in both situations:
- Show the user each command's result briefly; stop and ask on any failure
  you can't explain rather than improvising around it.
- Never print the contents of `server/.env` (it holds JWT secrets).
- Never set `ALLOW_DEV_LOGIN=true` — this server is public.
- Don't modify application code under `server/src` or `mobile/src` to make
  the deploy work; report the problem instead.
- Before touching Nginx or PM2, look at what's already configured — don't
  assume this file's placeholders (`<DOMAIN>` etc.) describe the live setup.

## 0. Preflight — which situation is this?

```bash
cat /etc/os-release | head -3; whoami; nproc; free -h; df -h /
git -C "$(git rev-parse --show-toplevel)" status --short --branch
pm2 list 2>/dev/null
sudo ls /etc/nginx/sites-enabled/ 2>/dev/null
```

- **If `pm2 list` already shows a `walkme-server` process, or an Nginx site
  already proxies to port 4000** — this is an **existing install**. Go to
  **Situation A**. As of writing, the known production install is
  `https://dagora.tech`, with Nginx proxying the path prefix `/walkMe/` to
  the API on `127.0.0.1:4000` (see `mobile/src/utils/env.ts` for the exact
  prefix the mobile app expects — don't change it without also rebuilding
  and redistributing the app). It is **not** a dedicated subdomain, so the
  generic `setup-nginx.sh` template (which expects `server_name <DOMAIN>` at
  the root path) does not describe it as-is.
- **If there's no existing PM2 process or Nginx site for this app** — this
  is a **fresh VPS**. Go to **Situation B**.

If `free` shows under ~1 GB RAM, warn the user that the TypeScript build may
be slow and suggest adding swap (`fallocate -l 2G /swapfile`…) — ask before
doing it.

---

## Situation A — updating an existing install (e.g. dagora.tech)

Goal: pull the latest code, get the server and admin panel live, without
guessing at Nginx config you haven't actually read.

### A1. Look at what's really there

```bash
sudo cat /etc/nginx/sites-enabled/*        # find the location block(s) for this app
pm2 describe walkme-server                 # cwd, script path, env
cat server/.env | grep -v SECRET           # PUBLIC_BASE_URL, PORT, etc. (never print secrets)
```
Work out: the public origin (e.g. `https://dagora.tech`), the path prefix if
any (e.g. `/walkMe`), and whether the Nginx block proxies that whole prefix
to the Node app (most likely) or does something more specific.

### A2. Pull and rebuild the server

```bash
cd ~/walkMe   # or wherever pm2 describe said the cwd is
git pull
npm ci --workspace=server --include-workspace-root=false --ignore-scripts --no-audit --no-fund
cd server
set -a; source ./.env; set +a
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts         # idempotent
npx tsx prisma/seed-admin.ts   # idempotent — only creates/updates an account if
                                # ADMIN_EMAIL/ADMIN_PASSWORD are set in .env
npm run build
pm2 restart walkme-server
curl -fsS http://127.0.0.1:4000/health
```
If `server/.env` is missing `JWT_ADMIN_SECRET`, `ADMIN_EMAIL`, or
`ADMIN_PASSWORD` (it will be, on an install from before the admin panel
existed): generate a secret the same way the others were generated
(`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
and append `JWT_ADMIN_SECRET=...`. Ask the user for the email/password they
want for their first admin login, append `ADMIN_EMAIL=...` and
`ADMIN_PASSWORD=...`, then re-run `npx tsx prisma/seed-admin.ts`.

### A3. Build the admin panel

The panel is a static React app; it needs `VITE_API_BASE_URL` baked in at
build time to match the real origin + prefix found in step A1
(`<origin><prefix>/api/v1/admin`, e.g. `https://dagora.tech/walkMe/api/v1/admin`),
and Vite's `base` (in `admin/vite.config.ts`, currently `/admin/`) needs to
match wherever Nginx will actually serve it from — if the app already lives
under a path prefix, the panel almost certainly needs to live under that same
prefix (e.g. `/walkMe/admin/`), not a bare `/admin/` at the domain root.
**Check this against what step A1 found before building** — get it wrong and
the panel loads a blank page with 404s in the console.

```bash
cd ~/walkMe/admin
npm ci --include=dev --ignore-scripts --no-audit --no-fund
# If the base path needs to change from the /admin/ default, edit
# admin/vite.config.ts's `base` first (ask the user to confirm the path).
VITE_API_BASE_URL="<origin><prefix>/api/v1/admin" npx vite build
```

### A4. Wire it into Nginx

Add a `location` block for the admin panel's static files, placed **above**
(before) the existing proxy block in the same server block so it's matched
first, e.g.:
```nginx
location /walkMe/admin/ {
    alias /home/<user>/walkMe/admin/dist/;
    try_files $uri $uri/ /walkMe/admin/index.html;
}
```
(adjust the path to match both the real repo location from `pm2 describe`
and the base path from A3). Then:
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -fsSI https://<origin><prefix>/admin/ | head -1
```
If that 403s/404s, it's almost always Nginx (running as `www-data`) lacking
read+execute on a parent directory of the repo — `chmod o+x` the offending
directory (never the whole home directory without asking) or `chmod -R o+rX
admin/dist`.

### A5. Report

Tell the user: the server is updated and healthy, whether the admin panel
was newly built or updated, its URL, whether a first admin account was
created (and to change that password after first login if you generated
one), and the exact Nginx edit you made (so they can review it).

---

## Situation B — fresh VPS, no existing install

This is what `deploy/hostinger/setup-vps.sh` / `deploy.sh` / `setup-nginx.sh`
are built for: a dedicated subdomain (e.g. `api.example.com`) with the API
mounted at the root, no path prefix. Use this when standing up a *new*
environment (staging, a second install, etc.) — not for updating dagora.tech.

The user should have given you `DOMAIN`, `EMAIL` (for Let's Encrypt), and
optionally `ADMIN_EMAIL`/`ADMIN_PASSWORD` for the first admin account. If
not, ask before step B3.

### B1. System packages (one-time)
```bash
sudo bash deploy/hostinger/setup-vps.sh
```
Verify: `node -v` (v20+), `pm2 -v`, `nginx -v`.

### B2. App install + start
```bash
DOMAIN=<DOMAIN> bash deploy/hostinger/deploy.sh
```
Must end with `{"status":"ok",...}`, "walkMe server is up.", and "Admin
panel built -> .../admin/dist". If it fails, `pm2 logs walkme-server --lines
50 --nostream`.

If the user gave you `ADMIN_EMAIL`/`ADMIN_PASSWORD`, set them in
`server/.env` now and re-run `deploy.sh` once more — idempotent, this just
adds the admin account and rebuilds the panel.

### B3. HTTPS
Confirm DNS first — it must print this VPS's public IP (`curl -4s ifconfig.me`):
```bash
getent hosts <DOMAIN>
```
If it doesn't match, stop and tell the user to fix the A record in hPanel →
Domains → DNS; propagation can take a few minutes.
```bash
sudo DOMAIN=<DOMAIN> EMAIL=<EMAIL> bash deploy/hostinger/setup-nginx.sh
```

### B4. Survive reboots
```bash
pm2 startup systemd -u "$(whoami)" --hp "$HOME"
```
Run the `sudo env PATH=... pm2 startup ...` line it prints, then `pm2 save`.

### B5. Backups
```bash
( crontab -l 2>/dev/null | grep -v deploy/hostinger/backup.sh; \
  echo "0 3 * * * bash $(pwd)/deploy/hostinger/backup.sh >> \$HOME/walkme-backups/backup.log 2>&1" ) | crontab -
mkdir -p ~/walkme-backups && bash deploy/hostinger/backup.sh
```

### B6. Final check & report
```bash
curl -fsS https://<DOMAIN>/health
curl -fsSI https://<DOMAIN>/api/docs/ | head -1
curl -fsSI https://<DOMAIN>/admin/ | head -1
pm2 status
sudo ufw status
```
Report the public URL, that `/api/docs` and `/admin/` work, that
`server/.env` still has placeholder `GOOGLE_CLIENT_ID`/`FACEBOOK_APP_ID`/
`FACEBOOK_APP_SECRET` (list which) for the user to fill in, the admin
panel's login state, and that `mobile/src/utils/env.ts` needs pointing at
this new origin if it's meant to replace dagora.tech.
