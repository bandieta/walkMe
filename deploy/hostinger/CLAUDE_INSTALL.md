# Runbook for Claude Code: install the walkMe server on this VPS

You are Claude Code running directly on the user's Hostinger VPS, inside a
clone of the walkMe repo. Goal: the API from `server/` is live at
`https://<DOMAIN>` behind Nginx, managed by PM2, surviving reboots — and the
`admin/` panel is live at `https://<DOMAIN>/admin/` with its first admin
account created.

The user should have given you `DOMAIN` (e.g. `api.example.com`), `EMAIL`
(for Let's Encrypt), and an `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the first
admin account. If not, ask before step 2 (the admin account can be added
later by re-running `deploy.sh`, so don't block on it if the user wants to
come back to it).

Rules:
- Show the user each command's result briefly; stop and ask on any failure you
  can't explain rather than improvising around it.
- Never print the contents of `server/.env` (it holds JWT secrets).
- Never set `ALLOW_DEV_LOGIN=true` — this server is public.
- Don't modify application code under `server/src` to make the deploy work;
  report the problem instead.

## 0. Preflight

```bash
cat /etc/os-release | head -3; whoami; nproc; free -h; df -h /
git -C "$(git rev-parse --show-toplevel)" status --short --branch
```
Expect Ubuntu/Debian. If `free` shows under ~1 GB RAM, warn the user that the
TypeScript build may be slow and suggest adding swap (`fallocate -l 2G /swapfile`…)
— ask before doing it.

## 1. System packages (one-time)

```bash
sudo bash deploy/hostinger/setup-vps.sh
```
Verify: `node -v` (v20+), `pm2 -v`, `nginx -v`.

## 2. App install + start

```bash
DOMAIN=<DOMAIN> bash deploy/hostinger/deploy.sh
```
Must end with `{"status":"ok",...}`, "walkMe server is up.", and "Admin panel
built -> .../admin/dist". If it fails, `pm2 logs walkme-server --lines 50
--nostream`.

If the user gave you `ADMIN_EMAIL`/`ADMIN_PASSWORD`, this first run created
`server/.env` without them (it's templated from `.env.example`, which leaves
those blank). Set them in `server/.env` now and re-run `deploy.sh` once —
it's idempotent, so this just adds the admin account and rebuilds the panel.

## 3. HTTPS

Confirm DNS first — it must print this VPS's public IP (`curl -4s ifconfig.me`):
```bash
getent hosts <DOMAIN>
```
If it doesn't match, stop and tell the user to create/fix the A record in
hPanel → Domains → DNS; propagation can take a few minutes.

```bash
sudo DOMAIN=<DOMAIN> EMAIL=<EMAIL> bash deploy/hostinger/setup-nginx.sh
```

## 4. Survive reboots

```bash
pm2 startup systemd -u "$(whoami)" --hp "$HOME"
```
It prints a `sudo env PATH=... pm2 startup ...` line — run that line, then `pm2 save`.

## 5. Backups

Add to the user's crontab (show it to them, then install):
```bash
( crontab -l 2>/dev/null | grep -v deploy/hostinger/backup.sh; \
  echo "0 3 * * * bash $(pwd)/deploy/hostinger/backup.sh >> \$HOME/walkme-backups/backup.log 2>&1" ) | crontab -
mkdir -p ~/walkme-backups && bash deploy/hostinger/backup.sh
```

## 6. Final check & report

```bash
curl -fsS https://<DOMAIN>/health
curl -fsSI https://<DOMAIN>/api/docs/ | head -1
curl -fsSI https://<DOMAIN>/admin/ | head -1
pm2 status
sudo ufw status
```
If the `/admin/` check comes back 403/404, it's almost always Nginx (running
as `www-data`) lacking read+execute on a parent directory of the repo — see
the permissions row in `deploy/hostinger/README.md`'s troubleshooting table
before guessing further.

Report to the user:
- the public URL and that `/api/docs` works,
- that `server/.env` still has placeholder `GOOGLE_CLIENT_ID` /
  `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` (list which), which they need to fill
  in for real sign-in, followed by `bash deploy/hostinger/deploy.sh`,
- the admin panel URL (`https://<DOMAIN>/admin/`) and whether its first
  account was created (only happens once `ADMIN_EMAIL`/`ADMIN_PASSWORD` are
  set in `server/.env`),
- that `mobile/src/utils/env.ts` → `PROD_API_HOST` should be set to `https://<DOMAIN>`,
- how to update later: `git pull && bash deploy/hostinger/deploy.sh` (rebuilds
  both the server and the admin panel).
