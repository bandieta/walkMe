#!/usr/bin/env bash
# Install the Nginx site for the API and get a free Let's Encrypt certificate.
# The domain's DNS A record must already point at this VPS.
# Usage: sudo DOMAIN=api.example.com EMAIL=you@example.com bash deploy/hostinger/setup-nginx.sh
set -euo pipefail
: "${DOMAIN:?Set DOMAIN, e.g. DOMAIN=api.example.com}"
: "${EMAIL:?Set EMAIL for certificate expiry notices}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE=/etc/nginx/sites-available/walkme-api

sed "s|__DOMAIN__|$DOMAIN|g" "$HERE/nginx-walkme.conf" > "$SITE"
ln -sf "$SITE" /etc/nginx/sites-enabled/walkme-api
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
echo "https://$DOMAIN/health ->"
curl -fsS "https://$DOMAIN/health" && echo
