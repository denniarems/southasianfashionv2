# Project Guidelines

## Code Style

- Use TypeScript with strict typing (`tsconfig.json` has `strict: true`).
- Prefer path alias imports with `@/*` (maps to repo root).
- Keep existing naming and style patterns used in `app/`, `db/`, and `components/ui/`.
- Use `oxlint`/`oxfmt` conventions. Avoid introducing ESLint/Prettier-specific patterns unless requested.
- For React event handlers, use explicit event types when needed.

## Architecture

- Framework: Next.js 16 App Router + React 19.
- Data layer: PostgreSQL with Drizzle ORM via `getDb()` from `db/index.ts` (singleton).
- Server actions live in `app/actions/` (`auth.ts`, `dashboard.ts`) and handle mutations.
- Upload endpoint is `app/api/upload/route.ts` (Vercel Blob).
- Auth flow:
  - OTP request/verify in `app/actions/auth.ts`
  - Session cookie: `saf_admin_session`
  - Route guarding via `proxy.ts` for `/admin/*` except `/admin/login`
- Admin dashboard pattern:
  - Server page fetches data in parallel (`app/admin/dashboard/page.tsx`)
  - Client UI in `DashboardClient.tsx` handles dialogs/forms/actions.

## Build and Test

- Install/develop with Bun.
- Common commands:
  - `bun run dev`
  - `bun run build`
  - `bun run start`
  - `bun run type-check`
  - `bun run lint` / `bun run lint:fix`
  - `bun run fmt` / `bun run fmt:check`
  - `bun run db:push`
  - `bun run db:seed`
- When changing schema or server actions, run `bun run type-check` at minimum.

## Conventions

- Default to Server Components. Add `'use client'` only when hooks/browser-only APIs/interactive UI are required.
- Prefer parallel data fetching with `Promise.all()` in server components and pages (see `app/page.tsx`).
- Use `revalidatePath()` after data mutations in server actions (see `app/actions/dashboard.ts`).
- Product routing is slug-first with ID fallback:
  - Query pattern: `or(eq(products.slug, slug), eq(products.id, slug))`
  - Link pattern: `/products/${product.slug ?? product.id}`
- Product slugs must be unique and generated via `generateUniqueProductSlug()` + `slugify()` (`app/actions/dashboard.ts`, `lib/slug.ts`).
- DB IDs are stored as text (UUID-style) and timestamps are ISO strings (`createdAt`).
- For Next.js dynamic route pages, keep params as async and await them:
  - `params: Promise<{ slug: string }>`
  - `const { slug } = await params`
- Use `next/image` with meaningful `sizes` values for responsive rendering.

## Environment

- Required env vars (see `.env`):
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `RESEND_API_KEY`
  - `SENDER_EMAIL`
  - `ADMIN_EMAIL` (comma-separated allowlist)
  - `NODE_ENV`
- `proxy.ts` only checks cookie presence; JWT validation happens in server actions/RSC context.
