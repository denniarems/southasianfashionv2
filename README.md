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
- `bun run cf:types` - Generate Cloudflare binding types
- `bun run db:generate` - Generate D1 migrations from Drizzle schema
- `bun run db:migrate:local` - Apply D1 migrations locally
- `bun run db:migrate:remote` - Apply D1 migrations remotely
- `bun run lint` - Run linter
- `bun run fmt` - Format code

## Project Structure

- `app/` - Next.js App Router pages and components
- `db/` - Database schemas and configuration
- `lib/` - Utility functions and helpers
