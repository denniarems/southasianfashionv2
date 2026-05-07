# GEMINI.md - South Asian Fashion

This document serves as the foundational context and instructional mandate for all AI interactions within the South Asian Fashion codebase.

## Project Overview

South Asian Fashion is a premium, modern e-commerce platform for curated luxury fashion. It is built using the latest web technologies to ensure high performance, SEO optimization, and a seamless user experience.

### Core Tech Stack

- **Framework**: TanStack Start with TanStack Router and Vite
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with [Radix UI](https://www.radix-ui.com/)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 with [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: Cloudflare R2
- **Email**: [Resend](https://resend.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) and [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling.
- **Linting/Formatting**: [oxlint](https://oxc-project.github.io/) and [oxfmt](https://oxc-project.github.io/)

---

## Architecture & Conventions

### 1. TanStack Start Data Boundaries

- **Routes**: Place filesystem routes in `src/routes/`. Use loaders for route-level data and `head` for route metadata.
- **Server Functions**: Place server functions in `src/server/`. Use TanStack Start server functions for mutations and parameter-driven server reads.
- **API Handlers**: Place HTTP handlers in `src/routes/api/` using TanStack route server handlers.
- **Data Fetching**: Prefer parallel fetching with `Promise.all` where it avoids waterfalls.

### 2. React 19 Idioms

- **No `useMemo`/`useCallback`**: As per repository policy (see global context), avoid micro-memoization unless performance profiling proves it necessary.
- **`use` Hook**: Employ the React 19 `use` hook for consuming contexts and handling promises in client components.
- **Transitions**: Use `useTransition` for state updates that might trigger slow re-renders.

### 3. Styling & UI

- **Typography**: The design uses a mix of:
  - `Playfair Display`: Primary headings (`--font-heading`)
  - `Manrope`: Body text (`--font-body`)
  - `Cormorant Garamond`: Accents and italicized text (`--font-accent`)
- **Colors**: Primarily Stone/Neutral palette (`stone-900`, `stone-500`, `white`) with luxury accents like `yellow-700`.
- **Components**: Shared UI components are located in `src/components/ui/` and follow the Radix/Shadcn pattern but are customized for the brand's aesthetic.

### 4. Database & Schemas

- **Drizzle ORM**: Defined in `src/db/schema.ts`.
- **Relationships**: Properly define foreign keys and use Drizzle's relational query API if needed, though standard SQL-like syntax is preferred for clarity.
- **Migrations**: Use `bun run db:generate` to generate migrations and `bun run db:migrate:local` or `bun run db:migrate:remote` to apply D1 migrations.

### 5. Business Logic

- **Discounts**: Complex discount logic (bundle, tiered, flat, percentage) is centralized in `src/lib/discounts.ts`. Always use `previewProductPrice` or `computeCartDiscounts` to ensure consistent pricing calculations.
- **Currency**: Default currency is CAD. Formatting utilities are in `src/lib/currency.ts`.

---

## Development Workflow

### Key Commands

- **Start Dev**: `bun run dev`
- **Build**: `bun run build`
- **Lint**: `bun run lint` (uses oxlint)
- **Format**: `bun run fmt` (uses oxfmt)
- **Generate D1 Migration**: `bun run db:generate`
- **Apply Local D1 Migration**: `bun run db:migrate:local`
- **Apply Remote D1 Migration**: `bun run db:migrate:remote`
- **Seed Local Data**: `bun run db:seed`
- **Seed Remote Data**: `bun run db:seed:remote`
- **Type Check**: `bun run type-check`

### Contribution Guidelines

1. **Surgical Updates**: When modifying existing components, maintain the minimalist, luxury aesthetic.
2. **SEO**: Ensure each route uses TanStack route `head` metadata where needed.
3. **Accessibility**: All interactive elements must follow Radix UI's accessibility standards.
4. **Performance**: Keep image rendering lightweight, avoid layout shift, and use browser-native loading/fetch priority controls through `src/components/ui/image.tsx`.
5. **Testing**: Add or update tests in the relevant directories when introducing new features.

---

## Directory Map

- `src/routes/`: TanStack Router routes, API handlers, sitemap, and robots endpoints
- `src/features/`:
  - `admin/`: Admin dashboard UI
  - `storefront/`: Storefront UI
- `src/components/`:
  - `ui/`: Fundamental UI primitives
  - `cart/`: Cart-specific logic and components
- `src/server/`: Server functions, auth middleware, and Cloudflare integrations
- `src/db/`: Database configuration and Drizzle schema
- `src/lib/`: Business logic and utilities
- `src/styles/`: Global Tailwind styles
- `scripts/seed-d1.sql`: Initial D1 seed data used by `bun run db:seed` and `bun run db:seed:remote`
- `public/`: Static assets (icons, logo)
- `src/types/`: Global TypeScript type definitions
