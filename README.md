# TotalCore

Construction project management: drawings, RFIs, submittals, photos and daily logs, built on a shared platform of companies, projects, directory permissions, file storage and change history.

## Run it locally

You need Node 22+ and Docker (or any Postgres 16).

```bash
cp .env.example .env
docker compose up -d          # starts Postgres on localhost:5432
npm install
npm run db:migrate            # creates the tables
npm run db:seed               # optional: demo company, sign in as admin@example.com / password123
npm run dev                   # http://localhost:3000
```

Or open http://localhost:3000/signup to create your own company.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |

## How it's organised

- `src/db/schema.ts` holds every table. Shared building blocks used by all tools live at the bottom: `files`, `attachments` (attach a file to any item), `item_links` (link any item to any other) and `audit_events` (field-level change history).
- `src/lib/auth.ts` is the data access layer. Pages and server actions call `requireUser`, `getProjectAccess` or `requireTool(projectId, tool, level)` so authorization always happens next to the data.
- `src/lib/permissions.ts` defines the tools, the access levels (None, Read, Standard, Admin) and the permission templates used when adding people to a project. Company admins have Admin on every tool.
- `src/lib/storage.ts` stores uploads on local disk in development, behind an interface so S3-compatible storage can be plugged in.
- `src/app/(app)/projects/[projectId]/[tool]` is a placeholder for tools that aren't built yet. A tool gets its own folder (e.g. `rfis/`), which takes priority over the placeholder.

## Stack

Next.js 16 (App Router, server actions), React 19, Tailwind CSS 4, Drizzle ORM with Postgres, Zod, Vitest.

## Deploying to Cloudflare

The app runs on Cloudflare Workers through the [OpenNext adapter](https://opennext.js.org/cloudflare), with uploads in an R2 bucket and Postgres hosted elsewhere (for example Neon).

One-time setup:

```bash
npx wrangler login
npx wrangler r2 bucket create totalcore-files
npx wrangler secret put DATABASE_URL     # paste the Postgres connection string
DATABASE_URL=<same string> npm run db:migrate
```

Then deploy with `npm run deploy`. To try the Cloudflare build locally first, copy `.dev.vars.example` to `.dev.vars` and run `npm run preview`.

After changing `wrangler.jsonc`, run `npm run cf-typegen` to refresh `cloudflare-env.d.ts`.
