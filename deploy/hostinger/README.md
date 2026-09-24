# Deploying the walkMe server to a Hostinger VPS

Everything needed to run `server/` (Express + Prisma/SQLite + Socket.io) on a
single Hostinger VPS behind Nginx with HTTPS. Background and scaling notes live
in [`server/DEPLOY.md`](../../server/DEPLOY.md); this folder is the runnable
version of it.

| File | What it does | Run as |
|------|--------------|--------|
| `setup-vps.sh` | One-time: Node 20, PM2, Nginx, Certbot, sqlite3, UFW firewall | `sudo` |
| `deploy.sh` | Install deps, create `server/.env` (first run), migrate, seed, build, start/reload in PM2, health check | app user |
| `setup-nginx.sh` | Nginx reverse proxy (with WebSocket upgrade) + Let's Encrypt cert | `sudo` |
| `ecosystem.config.cjs` | PM2 process definition (single fork instance, logs in `server/logs/`) | — |
| `nginx-walkme.conf` | Nginx site template (`__DOMAIN__` placeholder) | — |
| `backup.sh` | Nightly SQLite snapshot + uploads archive, 14-day retention | app user (cron) |
| `CLAUDE_INSTALL.md` | Step-by-step runbook for Claude Code running on the VPS | — |

## Before you start

1. **A VPS plan** (KVM, Ubuntu 22.04/24.04). Shared/"Web hosting" plans can't
   run a long-lived Node process with WebSockets — you need the VPS.
2. **A domain / subdomain** for the API, e.g. `api.yourdomain.com`, with an
   **A record pointing at the VPS IP** (hPanel → Domains → DNS). Needed for HTTPS.
3. **SSH access** — hPanel → VPS → your server shows the IP and root password;
   adding your SSH key there is recommended.
4. **Repo access from the VPS** — the repo is private, so either add a
   deploy key (`ssh-keygen -t ed25519` on the VPS, paste the `.pub` into
   GitHub → repo Settings → Deploy keys, read-only) or use
   `gh auth login`.

## Option A — let Claude Code on the VPS do it

```bash
ssh root@<vps-ip>
git clone git@github.com:bandieta/walkMe.git ~/walkMe
cd ~/walkMe && git checkout hostinger-server
claude
```

Then tell it:

> Read `deploy/hostinger/CLAUDE_INSTALL.md` and follow it. Domain: `api.yourdomain.com`, email: `you@example.com`.

It will stop and ask before anything it can't decide for you (DNS not
pointing yet, OAuth credentials, etc.).

## Option B — by hand

```bash
ssh root@<vps-ip>
git clone git@github.com:bandieta/walkMe.git ~/walkMe && cd ~/walkMe
git checkout hostinger-server

sudo bash deploy/hostinger/setup-vps.sh
DOMAIN=api.yourdomain.com bash deploy/hostinger/deploy.sh
sudo DOMAIN=api.yourdomain.com EMAIL=you@example.com bash deploy/hostinger/setup-nginx.sh
pm2 startup          # run the command it prints, so the app survives reboots
```

Check: `https://api.yourdomain.com/health` → `{"status":"ok",...}` and
`https://api.yourdomain.com/api/docs` shows Swagger.

Then edit `server/.env` for real social login (`GOOGLE_CLIENT_ID`,
`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `APPLE_BUNDLE_ID`) and re-run
`deploy.sh`. `ALLOW_DEV_LOGIN` is set to `false` — keep it that way on a public
server.

## Updating later

```bash
cd ~/walkMe && git pull && bash deploy/hostinger/deploy.sh
```

## Backups

```bash
crontab -e
# add:
0 3 * * * bash $HOME/walkMe/deploy/hostinger/backup.sh >> $HOME/walkme-backups/backup.log 2>&1
```

The whole database is `server/prisma/prod.db`; uploads are `server/uploads/`.
Copy `~/walkme-backups` off the box occasionally (or enable Hostinger's VPS
snapshots in hPanel).

## Pointing the mobile app at the server

In `mobile/src/utils/env.ts` set `PROD_API_HOST` to `https://api.yourdomain.com`.
Release builds use it; debug builds keep talking to your local dev server.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| 502 Bad Gateway | `pm2 status`, `pm2 logs walkme-server` |
| Chat works but only via polling | Nginx `Upgrade`/`Connection` headers (already in the template) |
| Certbot fails | `dig +short api.yourdomain.com` must return the VPS IP; port 80 open (`ufw status`) |
| Upload fails with 413 | `client_max_body_size` in `/etc/nginx/sites-available/walkme-api` |
| Seed error "DATABASE_URL not found" | run seed through `deploy.sh`, which exports `server/.env` first |
