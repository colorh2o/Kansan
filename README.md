# Kansan
# Kansan

A full-stack Kanban board with a Next.js interface, API routes, and Supabase Postgres storage. Create, move, and delete cards across To do, Doing, and Done. The board is open without sign-in; anyone with its URL can read and change every task.

## Run locally

1. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from your Supabase project settings.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. If you already ran the earlier authenticated-only schema, run this updated version to allow public board access.
3. Install dependencies and start Next.js:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the board. No Supabase Auth setup is needed.

## Deploy to Vercel

Import this repository into Vercel and add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as environment variables. Apply the Supabase schema before deploying. The board API uses an anonymous RLS-scoped client; it does not need a secret key.

## Supabase server skill

Install the optional repository skill with `npx skills add supabase/server`.

## API

- `GET /api/cards` lists all board cards publicly.
- `POST /api/cards` creates a card with a title and optional status.
- `PATCH /api/cards/:id` updates a card's status.
- `DELETE /api/cards/:id` deletes a card.
