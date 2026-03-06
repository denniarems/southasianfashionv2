# GEMINI.md - South Asian Fashion

This document serves as the foundational context and instructional mandate for all AI interactions within the South Asian Fashion codebase.

## Project Overview

South Asian Fashion is a premium, modern e-commerce platform for curated luxury fashion. It is built using the latest web technologies to ensure high performance, SEO optimization, and a seamless user experience.

### Core Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with [Radix UI](https://www.radix-ui.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **Email**: [Resend](https://resend.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) and [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling.
- **Linting/Formatting**: [oxlint](https://oxc-project.github.io/) and [oxfmt](https://oxc-project.github.io/)

---

## Architecture & Conventions

### 1. Server-First Mentality
- **Server Components (RSC)**: Use by default for data fetching and static layout. Fetch data directly using Drizzle ORM within RSCs whenever possible.
- **Server Actions**: Located in `app/actions/`. Use for all mutations (POST/PATCH/DELETE) and complex, parameter-driven data fetching.
- **Data Fetching**: Prefer parallel fetching using `Promise.all` in Server Components to minimize waterfall delays.

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
- **Components**: UI components are located in `components/ui/` and follow the Radix/Shadcn pattern but are customized for the brand's aesthetic.

### 4. Database & Schemas
- **Drizzle ORM**: Defined in `db/schema.ts`.
- **Relationships**: Properly define foreign keys and use Drizzle's relational query API if needed, though standard SQL-like syntax is preferred for clarity.
- **Migrations**: Use `bun run db:push` for local development and schema syncing.

### 5. Business Logic
- **Discounts**: Complex discount logic (bundle, tiered, flat, percentage) is centralized in `lib/discounts.ts`. Always use `previewProductPrice` or `computeCartDiscounts` to ensure consistent pricing calculations.
- **Currency**: Default currency is CAD. Formatting utilities are in `lib/currency.ts`.

---

## Development Workflow

### Key Commands

- **Start Dev**: `bun run dev`
- **Build**: `bun run build`
- **Lint**: `bun run lint` (uses oxlint)
- **Format**: `bun run fmt` (uses oxfmt)
- **Database Push**: `bun run db:push`
- **Seed Data**: `bun run db:seed`
- **Type Check**: `bun run type-check`

### Contribution Guidelines

1. **Surgical Updates**: When modifying existing components, maintain the minimalist, luxury aesthetic.
2. **SEO**: Ensure every page has a properly configured `generateMetadata` function.
3. **Accessibility**: All interactive elements must follow Radix UI's accessibility standards.
4. **Performance**: Optimize images using `next/image` and ensure proper `remotePatterns` are configured in `next.config.ts`.
5. **Testing**: Add or update tests in the relevant directories when introducing new features.

---

## Directory Map

- `app/`: Next.js App Router (Pages, Layouts, Actions, API Routes)
- `components/`:
  - `ui/`: Fundamental UI primitives
  - `cart/`: Cart-specific logic and components
- `db/`: Database configuration and Drizzle schema
- `lib/`: Business logic, utilities, and third-party integrations
- `public/`: Static assets (icons, logo)
- `types/`: Global TypeScript type definitions
