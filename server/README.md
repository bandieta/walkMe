# walkMe server

A small, real backend for the walkMe app: Express + Prisma + SQLite,
covering every screen the mobile app has, with Google/Facebook/Apple as the
only sign-in methods. Designed to be simple enough to run on a single
Hostinger VPS today, and to swap for a bigger database/infra later without
touching any route or service code (see `DEPLOY.md`).

## Running locally

```bash
cp .env.example .env
npm install
npx prisma migrate deploy   # or `npx prisma migrate dev` while iterating on the schema
npx tsx prisma/seed.ts      # seeds the Places table
npm run dev                 # http://localhost:4000, docs at /api/docs
```

## Testing

```bash
npm test
```

Runs the full Jest + Supertest suite (23 tests) against a throwaway SQLite
file — one suite per resource, plus a real Socket.io round-trip test for
chat. See `test/globalSetup.js` for how the test database is provisioned.

## Resources

All routes are versioned under `/api/v1` and (except `/auth/*`) require
`Authorization: Bearer <accessToken>`. Full interactive docs (OpenAPI) are
served at `/api/docs` whenever the server is running.

| Domain | What it covers |
|---|---|
| Auth | Google/Facebook/Apple sign-in, dev-login (test-only), refresh, logout |
| Users | Profile get/update |
| Dogs | Add/edit/remove dogs on a profile |
| Walks | Create, list (with radius filter), join/leave, host-only status changes |
| Events | Create, list, join/leave |
| Chat | Per-walk message history (REST) + Socket.io for real-time delivery |
| Matches / Discover | Swipe deck, mutual-swipe matching, per-match messaging with unread counts |
| Places | Dog-friendly places (seeded fixtures for now) |
| Storage | Image upload to local disk, served back over HTTP |

## Auth model

There are no passwords. The mobile app does the native Google/Facebook/Apple
sign-in, gets a provider token, and sends it to `POST /auth/social`; the
server verifies that token directly with the provider and issues its own
short-lived access token (2h) plus a longer-lived refresh token (30d, stored
hashed). `POST /auth/dev-login` is a test-only bypass, disabled unless
`ALLOW_DEV_LOGIN=true` — never enable it in production.

## Scaling up

Everything talks to the database through Prisma. To move off SQLite:
change `provider` in `prisma/schema.prisma` to `postgresql`, point
`DATABASE_URL` at a real database, run `prisma migrate deploy` — nothing
under `src/modules` changes. Local-disk file uploads are similarly isolated
behind the single route in `src/modules/storage/routes.ts`, ready to be
swapped for an S3/Azure-backed implementation later.
