# South Asian Fashion

A modern e-commerce platform for South Asian fashion, built with TanStack Start and Cloudflare.

## Features

- Product catalog with collections
- Admin dashboard for inventory management
- Image upload support via Cloudflare R2
- Email notifications via Resend
- Smooth animations with Framer Motion

## Tech Stack

- **Framework**: TanStack Start with Vite
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 with Drizzle ORM
- **Authentication**: JWT with cookies
- **Styling**: Tailwind CSS with Radix UI components
- **Storage**: Cloudflare R2
- **Email**: Resend

## Getting Started

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `bun run dev` - Start the Vite/TanStack Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview the production build locally
- `bun run deploy` - Deploy Cloudflare infrastructure and the Worker with Alchemy
- `bun run deploy:wrangler` - Build and deploy with Wrangler directly
- `bun run destroy` - Destroy the Alchemy-managed Cloudflare stack
- `bun run cf:configure` - Configure an Alchemy Cloudflare profile
- `bun run cf:login` - Refresh Alchemy Cloudflare authentication
- `bun run lint` - Run linter
- `bun run fmt` - Format code
- `bun run db:migrate:local` - Apply D1 migrations to the local database
- `bun run db:seed` - Seed initial storefront/admin data into the local D1 database
- `bun run db:seed:remote` - Seed initial data into the remote D1 database

## Project Structure

- `src/routes/` - TanStack Router routes, API handlers, and metadata endpoints
- `src/features/` - Feature-owned UI for storefront and admin surfaces
- `src/components/` - Shared UI, cart, and router compatibility components
- `src/server/` - Server functions, auth middleware, and storage integrations
- `src/db/` - Drizzle schema, D1 client, and seed script
- `src/lib/` - Shared business logic and utilities
- `src/styles/` - Global Tailwind styles
- `migrations-d1/` - Cloudflare D1 migrations
- `scripts/seed-d1.sql` - Initial local/remote D1 seed data

## Cloudflare Deployment

Deployment is managed by [Alchemy](https://alchemy.run/getting-started/) in [alchemy.run.ts](./alchemy.run.ts). The stack provisions or adopts:

- Cloudflare D1 database `southasianfashion-prod` with migrations from `migrations-d1/`
- Cloudflare R2 bucket `southasianfashion-media`
- TanStack Start Worker `southasianfashion`
- Runtime bindings for D1, R2, admin auth, Resend, OpenRouter, and canonical site/media URLs

Before the first deploy, copy `.env.example` values into your local `.env`, set real secrets, and authenticate:

```bash
bun run cf:configure
bun run cf:login
bun run deploy
```

For token-based deploys, `CLOUDFLARE_API_TOKEN` must have edit access for Workers, Workers routes/custom domains, D1, R2, and DNS in the `southasianfashion.ca` zone. A D1/R2-only token can create the database and bucket but will fail when Alchemy creates the Worker assets upload session.

Custom Worker domains are opt-in with `ALCHEMY_ENABLE_CUSTOM_DOMAINS=true`. Leave this disabled until `southasianfashion.ca` is ready to move from Vercel to the Cloudflare Worker.
