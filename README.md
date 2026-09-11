# NearLeadsQ

Local lead generation for small businesses and solo sales teams.
Search a location + category, get business listings from OpenStreetMap,
filter them, find public emails on their websites, and reach out via
WhatsApp click-to-chat — all from one dashboard.

## Features

- **Search** any location with 25+ curated categories (restaurants, dentists,
  gyms, trades, professional services…) within a radius
- **Filter** leads by name, status, website / phone / email presence
- **Email finder** crawls each business's website (homepage → contact pages)
  for publicly listed emails; bulk enrichment with progress tracking
- **WhatsApp outreach** with reusable message templates and `{{variables}}`;
  opens wa.me click-to-chat links and auto-marks leads as contacted
- **Pipeline statuses** (New → Contacted → Replied → Won/Lost), notes, CSV export

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + SQLite ·
Auth.js v5 · OpenStreetMap (Nominatim + Overpass API)

## Getting started

```bash
npm install
cp .env.example .env        # then fill in AUTH_SECRET
npx prisma db push          # create the database
npm run db:seed             # optional: demo account + sample data
npm run dev                 # http://localhost:3000
```

Sign up at `/signup`, or log in with the seeded demo account
(`demo@nearleadsq.app` / `demo1234`), then run your first search.

## Project layout

```
src/
  app/
    (auth)/login|signup     auth pages
    (app)/dashboard         stats, follow-ups, recent searches
    (app)/search            search form
    (app)/leads             lead table workspace (+ map preview)
    (app)/leads/[id]        lead detail: notes, follow-ups, activity log
    (app)/templates         WhatsApp message template CRUD
    (app)/billing           plan, usage & Stripe upgrade
    api/                    route handlers (search, leads, import, enrich,
                            templates, stripe)
    actions/                server actions (auth, workspaces)
  lib/                      overpass, geocode, email-finder, phone, csv,
                            plans, stripe, workspace, db…
prisma/schema.prisma        data model
prisma/seed.mjs             demo data seeder
```

## Deployment notes

### 1. Database (Postgres required on serverless)

The schema uses Postgres. Provision a managed instance (Neon, Supabase, RDS…),
set `DATABASE_URL` to your connection string (`?sslmode=require` where needed),
then run `npx prisma db push && npm run db:seed` once against the new DB.

### 2. Background enrichment (Vercel / serverless)

Email enrichment runs as an **Inngest** background job (it can't run
fire-and-forget inside a serverless function). On Vercel:

- Add `src/app/api/inngest/route.ts` (already present) — the Inngest endpoint.
- Set `INNGEST_SIGNING_KEY` / `INNGEST_EVENT_KEY`.
- In the **Inngest dashboard**, register your app so the `enrich/run` function
  is picked up and executed by Inngest's workers.

### 3. Deploy

**Vercel:**

- Push and import the repo into Vercel.
- Add env vars: `DATABASE_URL`, `AUTH_SECRET`, `INNGEST_SIGNING_KEY`,
  `INNGEST_EVENT_KEY` (plus Dodo vars if enabled).
- Run `npx prisma db push` once from your machine/CI against the prod DB.

**Docker / VPS (non-serverless):**

```bash
docker build -t nearleadsq .
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://…" \
  -e AUTH_SECRET="…" \
  nearleadsq
# first time only — apply the schema:
docker exec <container> npx prisma db push
```

### 4. Environment variables

- `DATABASE_URL`, `AUTH_SECRET` — required
- `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` — required for enrichment
- Billing (optional): `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`,
  `DODO_PRODUCT_GROWTH`, `DODO_PRODUCT_AGENCY`, `DODO_ENV`;
  point a Dodo webhook at `/api/dodo/webhook` (events:
  `subscription.active`, `subscription.updated`, `subscription.plan_changed`,
  `subscription.renewed`, `subscription.cancelled`, `subscription.on_hold`,
  `subscription.failed`, `subscription.expired`)

## Compliance notes

Business data comes from OpenStreetMap (ODbL) — attribute OSM if you
redistribute it. The tool only generates WhatsApp deep links; messages are
sent manually from the user's own account. Respect local anti-spam laws
when contacting leads.
