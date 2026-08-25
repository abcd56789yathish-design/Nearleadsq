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

### 1. Switch to Postgres (recommended for production)

The default SQLite file database is great locally but doesn't survive
serverless/multi-instance deploys. To move to Postgres:

1. Provision a managed Postgres (Neon, Supabase, RDS…)
2. In `prisma/schema.prisma` change `provider = "sqlite"` → `"postgresql"`
3. Set `DATABASE_URL` to your connection string (`?sslmode=require` where needed)
4. Run `npx prisma db push` against the new database and redeploy

### 2. Deploy

**Vercel (or any Node host):**

- Push the repo, import it into Vercel
- Add env vars: `DATABASE_URL`, `AUTH_SECRET` (32+ random chars)
- Run `npx prisma db push` once from your machine/CI against the prod DB
  (or add a release step if your platform supports one)

**Docker / VPS:**

```bash
docker build -t nearleadsq .
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://…" \
  -e AUTH_SECRET="…" \
  nearleadsq
# first time only — apply the schema:
docker exec <container> npx prisma db push
```

### 3. Environment variables

- `DATABASE_URL`, `AUTH_SECRET` — required
- Billing (optional): `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`,
  `STRIPE_WEBHOOK_SECRET`; point a Stripe webhook at
  `/api/stripe/webhook` (events: `checkout.session.completed`,
  `customer.subscription.*`)

## Compliance notes

Business data comes from OpenStreetMap (ODbL) — attribute OSM if you
redistribute it. The tool only generates WhatsApp deep links; messages are
sent manually from the user's own account. Respect local anti-spam laws
when contacting leads.
