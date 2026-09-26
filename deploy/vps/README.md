# Continuous deployment to the dagora.tech VPS

```
push to main ──► GitHub Actions "CI/CD" (.github/workflows/ci-cd.yml)
                   Test ─┬─► Android APK      (artifact: android-apk)
                         └─► iOS simulator    (artifact: ios-simulator)
                                   │
   VPS: walkme-deploy.timer (every 2 min) polls GitHub for the newest
   completed run on main whose Test job passed, then deploys that commit:
     server  → npm install, prisma generate, build, DB backup, migrate,
               restart walkme.service, health check (auto-rollback on failure)
     admin   → vite build → /var/www/walkme-admin   (https://dagora.tech/walkMe/admin/)
     builds  → /var/www/walkme-downloads           (https://dagora.tech/walkMe/downloads/)
   and posts a "deploy/dagora.tech" commit status back to GitHub.
```

Why pull-based: the repo is public, so a self-hosted runner could run code from
anyone's pull request on the VPS, and SSH is only reachable over Tailscale. The
agent only ever deploys commits that are already on `main` and passed CI, and
GitHub holds no credentials for the server.

## Files

| File | Installed as |
|---|---|
| `walkme-deploy.sh` | run in place by the service (it copies itself to /tmp first, so a deploy can safely update it) |
| `render-downloads.sh` | run in place; regenerates the downloads page |
| `walkme-deploy.service`, `walkme-deploy.timer` | `/etc/systemd/system/` |
| — | `/etc/walkme-deploy.env` (mode 600): `GH_TOKEN=<token with repo scope>` |

State lives in `/var/lib/walkme-deploy/` (`deployed_sha`, `failed_sha`), DB
backups in `/root/walkme-backups/` (last 30), and the last 5 builds are kept on
the downloads page.

## Install (one-time, as root)

```bash
install -m 600 /dev/null /etc/walkme-deploy.env && echo "GH_TOKEN=..." > /etc/walkme-deploy.env
cp deploy/vps/walkme-deploy.{service,timer} /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now walkme-deploy.timer
```
Nginx serves the downloads page from the existing dagora.tech server block:
```nginx
location = /walkMe/downloads { return 301 /walkMe/downloads/; }
location /walkMe/downloads/ {
    alias /var/www/walkme-downloads/;
    index index.html;
    types { application/vnd.android.package-archive apk; application/zip zip; text/html html; }
    add_header Cache-Control "no-cache";
}
```

## Operating it

```bash
journalctl -u walkme-deploy -f              # watch deploys
systemctl start walkme-deploy               # check for a new build right now
rm /var/lib/walkme-deploy/failed_sha        # retry a commit whose deploy failed
```
The agent refuses to deploy if `/root/walkMe` has uncommitted changes — commit
or stash them first. After a failed deploy it stays on the last good commit and
waits for the next commit on `main`.

## iOS on a real iPhone

The iOS job produces an unsigned **Simulator** build, which proves the app
compiles but can't be installed on a phone. Installable builds need an Apple
Developer Program membership; then the job can be extended to archive, sign and
upload to TestFlight (App Store Connect API key + signing certificate stored as
GitHub secrets).
