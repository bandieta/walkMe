# Deploying to a Hostinger VPS

This server is a single Node.js process with a file-based SQLite database, so
deployment is just: get Node on the box, copy the code, run it under a process
manager, and put Nginx in front of it for HTTPS + WebSocket upgrades.

## 1. One-time VPS setup

SSH into the VPS (Hostinger gives you the IP/credentials in hPanel → VPS → your server).

```bash
# Node.js (via NodeSource — pick the LTS matching your dev machine)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Process manager
sudo npm install -g pm2

# Nginx (reverse proxy + TLS termination)
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

## 2. Deploy the code

```bash
git clone <your-repo-url> walkMe
cd walkMe/server
npm ci --omit=dev=false   # dev deps needed for the `build` step below
cp .env.example .env
# edit .env: real JWT secrets, GOOGLE_CLIENT_ID, APPLE_BUNDLE_ID,
# PUBLIC_BASE_URL=https://api.yourdomain.com, ALLOW_DEV_LOGIN=false
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run build
pm2 start dist/index.js --name walkme-server
pm2 save
pm2 startup   # follow the printed command so PM2 survives reboots
```

Redeploying later is: `git pull`, `npm ci`, `npx prisma migrate deploy`, `npm run build`, `pm2 restart walkme-server`.

## 3. Nginx reverse proxy (with WebSocket support for Socket.io)

`/etc/nginx/sites-available/walkme-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/walkme-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com   # free TLS cert, auto-renews
```

The `Upgrade`/`Connection` headers above are what let Socket.io's WebSocket
transport through the proxy — without them it silently falls back to polling.

## 4. Persistence & backups

The whole database is `server/prisma/dev.db` (one file). Back it up like any
file — e.g. a nightly cron copying it off the box:

```bash
0 3 * * * cp /path/to/walkMe/server/prisma/dev.db /path/to/backups/dev-$(date +\%F).db
```

## 5. Scaling up later

When SQLite/single-process stops being enough:

1. Point `DATABASE_URL` in `.env` at a managed Postgres instance and change
   `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
2. Run `npx prisma migrate deploy` against the new database.
3. Nothing else changes — every service/route in `src/modules/*` talks to
   Prisma, not to SQLite directly.

Swapping local-disk uploads for S3/Azure, or scaling to multiple server
instances behind a load balancer (Socket.io then needs a shared adapter, e.g.
`@socket.io/redis-adapter`), are the next steps after that.
