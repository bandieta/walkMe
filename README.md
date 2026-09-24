# WalkMe

A community walking app for iOS & Android built with React Native and Node.js.

## Architecture

```
walkMe/
├── mobile/          # React Native app (iOS + Android)
├── server/          # Current backend — Express + Prisma + SQLite (see server/README.md)
├── admin/           # Admin panel — React + Vite (see admin/README.md)
├── backend/         # Future, larger-scale backend — NestJS + PostgreSQL + Redis (not wired up yet)
├── shared/          # Shared TypeScript types
└── docker-compose.yml
```

`server/` is what the mobile app talks to today: a small, real backend covering
every screen in the app, simple enough to run locally or on a single
Hostinger VPS. `backend/` is a heavier NestJS/Postgres/Redis stack scaffolded
for when the app outgrows a single SQLite file — see `server/DEPLOY.md` for
the migration path (swap the Prisma datasource, nothing in `server/src`
needs to change).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.74, Redux Toolkit, React Navigation |
| Server | Express, Prisma, SQLite (`server/`) |
| Real-time | Socket.io (WebSockets) |
| Auth | Google / Facebook / Apple sign-in only (no passwords) — server verifies the native provider token and issues its own JWT |
| Maps | Google Maps SDK (react-native-maps) |
| Storage | Local disk uploads (`server/uploads/`), swappable for S3/Azure later |

## Quick Start

### 1. Server
```bash
cd server
cp .env.example .env
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```
API docs at http://localhost:4000/api/docs. `ALLOW_DEV_LOGIN=true` (the
default in `.env.example`) enables `POST /auth/dev-login`, a test-only
endpoint the automated backend tests use to sign in without real provider
credentials (see `server/test/helpers.ts`).

### 2. Mobile
```bash
cd mobile
npm install
npx pod-install ios      # iOS only
npm run ios              # or: npm run android
```

### 3. Admin panel
```bash
cd admin
cp .env.example .env.local
npm install    # admin/ has its own package-lock.json — not a root npm workspace,
                # so this never touches mobile/backend/server's dependency tree
npm run dev
```
Sign in with the account `server/prisma/seed-admin.ts` creates — see
[`admin/README.md`](admin/README.md) for what the panel covers (users, dogs,
walks, events, places, matches, chat moderation, uploads, audit log).

## Setting up real social login

The LoginScreen's Google/Facebook/Apple buttons are fully wired to the
native SDKs, but each needs a real developer app before it can complete a
sign-in:

1. **Google** — [Google Cloud Console](https://console.cloud.google.com/) →
   APIs & Services → Credentials → create an OAuth client ID of type "Web
   application" (used for token verification) plus one of type "iOS" /
   "Android" matching your bundle ID (`com.walkme`) / SHA-1. Put the **Web**
   client ID in `mobile/src/utils/authConfig.ts` (`GOOGLE_WEB_CLIENT_ID`)
   *and* in `server/.env` (`GOOGLE_CLIENT_ID`) — they must match.
2. **Facebook** — [developers.facebook.com](https://developers.facebook.com/)
   → create an app → Settings → Basic for the App ID, Settings → Advanced
   for the Client Token. Fill these into
   `mobile/src/utils/authConfig.ts`, `mobile/android/app/src/main/res/values/strings.xml`,
   and `mobile/ios/WalkMe/Info.plist` (search for `YOUR_FACEBOOK_APP_ID`).
3. **Apple** — in your Apple Developer account, enable "Sign in with Apple"
   for your App ID (the entitlement is already added at
   `mobile/ios/WalkMe/WalkMe.entitlements`). Set `APPLE_BUNDLE_ID` in
   `server/.env` to your real bundle ID if it differs from `com.walkme`.
   Apple Sign-In only appears on iOS — Apple doesn't require it on Android.

Until these are filled in, the buttons will fail with a clear error.

## API Endpoints

See the full, always-up-to-date list at http://localhost:4000/api/docs once
the server is running, or [`server/README.md`](server/README.md) for a
summary of every resource.

## WebSocket Events

Connect to `ws://localhost:4000` with `{ auth: { token: '<accessToken>' } }`.

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:room:join` | Client → Server | Join a walk room |
| `chat:message:send` | Client → Server | Send a message |
| `chat:message:receive` | Server → Client | Receive a message |
| `location:update` | Client → Server | Send GPS location |

## Environment Variables

See [`server/.env.example`](server/.env.example) for the server, and
[`backend/.env.example`](backend/.env.example) for the (not yet wired up)
larger-scale backend.
