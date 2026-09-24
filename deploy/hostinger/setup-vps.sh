#!/usr/bin/env bash
# One-time VPS bootstrap for the walkMe server (Ubuntu/Debian, Hostinger VPS).
# Installs Node.js 20, PM2, Nginx, Certbot and opens the firewall for SSH + HTTP(S).
# Safe to re-run. Usage: sudo bash deploy/hostinger/setup-vps.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git build-essential nginx certbot python3-certbot-nginx sqlite3 ufw

if ! command -v node >/dev/null || [[ "$(node -v)" != v20.* && "$(node -v)" != v22.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

command -v pm2 >/dev/null || npm install -g pm2

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

systemctl enable --now nginx

echo
echo "Done: node $(node -v), npm $(npm -v), pm2 $(pm2 -v), $(nginx -v 2>&1)"
echo "Next: bash deploy/hostinger/deploy.sh   (as the user that will run the app, not root)"
