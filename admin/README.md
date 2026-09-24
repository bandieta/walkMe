# walkMe Admin

A small React + Vite single-page app for maintaining users and in-app
content — the operational panel behind `server/`. Signs in with its own
email + password (the `AdminUser` table), never the app's Google/Facebook/
Apple login.

Visual design reuses the mobile app's "Nocturne" tokens (`mobile/src/utils/theme.ts`,
ported to CSS variables in `src/styles/theme.css`) so the panel reads as the
same product: dark ground, one blurple accent, Inter, 8px radii.

Deliberately **not** part of the repo root's npm workspaces — it has its own
`package-lock.json`, so installing or building it never re-resolves
`mobile/`, `backend/`, or `server/`'s dependency tree.

## What it covers

| Area | What you can do |
|---|---|
| Dashboard | User/dog/walk/event/match/message counts, 30-day signup trend |
| Users | Search/filter, view profile + activity, suspend/ban/reinstate, delete |
| Dogs | Search, remove a listing |
| Walks | Search/filter by status, view participants, force status, delete |
| Events | Same as walks |
| Places | Full CRUD (name, category, address, coordinates, tags, open/closed) |
| Matches | Search, unmatch a pair |
| Messages | Search, delete a message (moderation) |
| Uploads | Browse `server/uploads`, delete a file |
| Audit log | Every admin action — who, what, when |
| Admin accounts | Superadmin-only: invite/remove other admins |

## Local development

```bash
cd server && npm run dev            # API on :4000
cd admin
cp .env.example .env.local          # points at http://localhost:4000/api/v1/admin
npm install
npm run dev                         # panel on :5173
```

Sign in with the account `server/prisma/seed-admin.ts` creates (set
`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `server/.env`, then `npm run seed:admin`
inside `server/`).

## Production

Built as static files and served by Nginx alongside the API — see
[`deploy/hostinger/README.md`](../deploy/hostinger/README.md). `deploy.sh`
builds it automatically with `VITE_API_BASE_URL` pointed at the deployed
server; that value is baked in at build time, so a URL/domain change needs a
rebuild, not just an `.env` edit.

## Architecture notes

- No state library — `usePaginated` (a small hook) drives every list page's
  search/filter/pagination against the admin API; `DataTable` renders the
  result generically from a `columns` config, so adding a new resource page
  is mostly copy-and-adjust from `pages/Walks/`.
- No charting dependency — the dashboard's signup trend is a hand-rolled
  inline-SVG sparkline (`components/Sparkline.tsx`), since it's one accent-
  colored series.
- Auth token lives in `localStorage`; an axios interceptor attaches it and
  bounces to `/login` on a 401.
