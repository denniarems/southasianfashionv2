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
- `bun run deploy` - Build and deploy with Wrangler
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
