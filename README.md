# sinaitaxi-hourly-web

Customer storefront + admin + partner hub for **Sinai Taxi Hourly Rental**, served at `hourly.sinaitaxi.com`.

Next.js 15 (App Router, RSC, server actions). Backed by [`sinaitaxi-hourly-api`](../sinaitaxi-hourly-api/) on Railway.

## Develop

```bash
cp .env.local.example .env.local
# fill NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

npm install
npm run dev   # → http://localhost:3100
```

## Build

```bash
npm run typecheck
npm run build
```

## Routes (Phase 0 only)

- `/` — Hero + search form
- `/search` — placeholder results page (real offers in Phase 3)

See companion docs at `../sinaitaxi-hourly-api/BRD.md` and `PLAN.md`.
