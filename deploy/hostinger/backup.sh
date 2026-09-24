#!/usr/bin/env bash
# Consistent SQLite snapshot + uploads archive, keeping the last 14 days.
# Cron (crontab -e):  0 3 * * * bash /path/to/walkMe/deploy/hostinger/backup.sh >> ~/walkme-backups/backup.log 2>&1
set -euo pipefail
SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../server" && pwd)"
DEST="${BACKUP_DIR:-$HOME/walkme-backups}"
STAMP="$(date +%F-%H%M)"
mkdir -p "$DEST"

# .backup is safe while the server is writing, unlike a plain cp.
sqlite3 "$SERVER_DIR/prisma/prod.db" ".backup '$DEST/prod-$STAMP.db'"
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C "$SERVER_DIR" uploads

find "$DEST" -name 'prod-*.db' -mtime +14 -delete
find "$DEST" -name 'uploads-*.tar.gz' -mtime +14 -delete
echo "$(date -Is) backup ok -> $DEST"
