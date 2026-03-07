# South Asian Fashion

A modern e-commerce platform for South Asian fashion, migrated to vinext for Cloudflare Workers deployment.

## Features

- Product catalog with collections
- Admin dashboard for inventory management
- Image upload support via Cloudflare R2
- OTP email notifications via Cloudflare Email Workers
- Smooth animations with Framer Motion

## Tech Stack

- **Framework**: vinext (Next.js-compatible App Router on Vite)
- **Database**: Cloudflare D1 with Drizzle ORM
- **Authentication**: JWT with cookies
- **Styling**: Tailwind CSS with Radix UI components
- **Storage**: Cloudflare R2
- **Email**: Cloudflare Email Workers
- **Deployment**: Cloudflare Workers via Wrangler + `vinext deploy`

## Getting Started

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build vinext for production
- `bun run start` - Start vinext production server
- `bun run deploy` - Build and deploy to Cloudflare Workers
- `bun run alchemy:deploy` - Provision/adopt Cloudflare infrastructure and refresh `wrangler.jsonc`
- `bun run deploy:production` - Sync infrastructure with Alchemy, then deploy the vinext app
- `bun run cf:types` - Generate Cloudflare binding types
- `bun run db:generate` - Generate D1 migrations from Drizzle schema
- `bun run db:migrate:local` - Apply D1 migrations locally
- `bun run db:migrate:remote` - Apply D1 migrations remotely
- `bun run db:seed:local` - Seed the local D1 database from `db/seed.sql`
- `bun run lint` - Run linter
- `bun run fmt` - Format code

For a fresh local database, run migrations before seeding:

```bash
bun run db:migrate:local
bun run db:seed:local
```

## Production deployment with Alchemy

Use `alchemy.run.ts` to keep production infrastructure and `wrangler.jsonc` in sync:

1. Authenticate Cloudflare for Wrangler/Alchemy.
2. Set the production env values used by `alchemy.run.ts`.
3. Run `bun run alchemy:deploy` to adopt/create D1 + R2 and regenerate `wrangler.jsonc`.
4. Set `JWT_SECRET` as a Wrangler secret.
5. Run `bun run db:migrate:remote` if migrations changed.
6. Run `bun run deploy:production` for the full production flow.

Notes:

- The app deploy still uses `vinext deploy` so the `vinext/server/app-router-entry` runtime stays intact.
- The OTP `send_email` binding is preserved through generated Wrangler config because Alchemy does not yet expose it as a first-class Worker binding.
- For the full checklist, see [`docs/production-deployment-guide.md`](docs/production-deployment-guide.md).

## Project Structure

- `app/` - Next.js App Router pages and components
- `db/` - Database schemas and configuration
- `lib/` - Utility functions and helpers
