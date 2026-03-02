# SouthAsianFashion Migration Plan

This document outlines the plan to migrate the legacy React SPA + FastAPI/MongoDB application to a modern Next.js App Router application optimized for Cloudflare Workers, utilizing Cloudflare D1 for the database and Cloudflare R2 for asset storage.

## Background & Architecture Shift

The old application was split into two separate projects:

1. **Frontend**: Create React App (CRA) using Craco, TailwindCSS, Framer Motion, and React Router.
2. **Backend**: Python FastAPI with MongoDB (`motor`), serving an API prefix `/api/*` and handling local file uploads at `/api/uploads/*`.

We are unifying this into a single full-stack Next.js application running on `vinext` (Vite-based Next.js for Cloudflare Workers).

### Key Transitions

- **MongoDB -> Cloudflare D1 (SQLite)**: We will recreate the schema (Products, Categories, Collections, Hero Banners, Settings, OTPs) in D1 using Drizzle ORM.
- **Local File Uploads -> Cloudflare R2**: Image uploads for products will be handled via Cloudflare R2 instead of the local filesystem.
- **FastAPI Routes -> Next.js Server Actions & API Routes**:
  - Read operations (fetching products, categories) will happen via React Server Components (RSC) fetching directly from D1 (or caching layers).
  - Write operations (mutations, admin crud, OTP generation via Resend) will be executed using Next.js Server Actions.
- **Client-Side Rendering -> Server-Side Rendering (SSR/SSG)**: We will leverage Next.js App Router to server-render pages for better SEO and performance, strictly adhering to the `React 19` rule of no `useMemo`/`useCallback` on the client side.

## Proposed Changes

### 1. Database & ORM (Cloudflare D1 + Drizzle)

We will switch from MongoDB to a relational schema using Cloudflare D1.

> See [schema.md](file:///C:/Users/denni/.gemini/antigravity/brain/4dbfd556-a434-4f62-b1c8-fcfbb13296d8/schema.md) for the exact SQLite table definitions mapping the old MongoDB collections.

### 2. Backend Logic (Server Actions & Utils)

Instead of FastAPI routes, we create modular Server Actions.

> See [auth.md](file:///C:/Users/denni/.gemini/antigravity/brain/4dbfd556-a434-4f62-b1c8-fcfbb13296d8/auth.md) for the detailed flow replacing the JWT `Authorization` header with HttpOnly secure cookies.

### 3. Frontend Pages & Components

Migrate the CRA components into the Next.js App Router structure. The [design_guidelines.json](file:///d:/code/southasianfashion/old-code/design_guidelines.json) specifies strict aesthetic rules (Playfair Display, Manrope, light mode only, specific Framer Motion rules).

### 4. Deployment Pipeline (Alchemy.run)

Instead of manually managing `wrangler.toml`, we will use `alchemy.run`, an Infrastructure-as-Code library for Cloudflare in TypeScript.

- Define the infrastructure in an `alchemy.ts` (or similar).
- Automate the provisioning of the D1 Database and R2 Bucket.
- Deploy the `vinext` built worker using Alchemy.

## Step-by-Step Implementation Guide

1. **Initialize Infrastructure & ORM**:
   - Install `drizzle-orm`, `drizzle-kit`, and `@alchemy/core` (or equivalent alchemy.run package).
   - Create the `schema.ts` file mapping out the SQLite database.
   - Run local migrations to establish the local D1 emulator database.
   - Write a `seed.ts` script to populate D1 with the sample data from [server.py](file:///d:/code/southasianfashion/old-code/backend/server.py).

2. **Setup Alchemy IaC**:
   - Create the infrastructure definition file using `alchemy.run` to provision the Cloudflare worker, D1 database, and R2 bucket.

3. **Migrate Authentication & API Routes**:
   - Implement `middleware.ts` for route protection `/admin/*`.
   - Implement Server Actions for `requestOtp` and `verifyOtp` using `resend`.
   - Set up the R2 upload utility (via pre-signed URLs or direct ArrayBuffer uploads).

4. **Migrate Frontend Layout & Assets**:
   - Move old CSS from [index.css](file:///d:/code/southasianfashion/old-code/frontend/src/index.css) to [app/globals.css](file:///d:/code/southasianfashion/app/globals.css).
   - Configure Tailwind with the brand colors (Zinc/Stone, Gold Accents).
   - Setup `lenis` for smooth scrolling in a `ClientWrapper` component.
   - Setup `next/font/google` for Playfair Display, Manrope, and Cormorant Garamond.

5. ** JSX to TSX Component Migration (Crucial Step)**:
   - Carefully migrate components from `old-code/frontend/src`.
   - **CRITICAL: DO NOT change any Tailwind classes, CSS modules, or Framer Motion animation values. The UI must look and feel exactly identical to the old CRA application.**
   - Determine if the component should be a React Server Component (default) or a Client Component (`"use client"` required for hooks like `useState`, event listeners, or `framer-motion`).
   - Define strict `interface`s for all Component Props.
   - Enforce the React 19 policy by completely removing `useMemo` and `useCallback`.
   - Type all Event Handlers (e.g., `React.ChangeEvent<HTMLInputElement>`) and ambiguous hooks (e.g., `useState<number | null>(null)`).

6. **Rebuild Pages using RSC**:
   - `app/page.tsx`: Fetch Hero Banners and Collections from D1, render static HTML, pass to Client Components for Framer Motion reveals.
   - `app/products/page.tsx` & `app/products/[slug]/page.tsx`: Fetch from D1.
7. **Rebuild Admin Dashboard**:
   - Recreate the CRUD forms for Products, Categories, Collections, and Settings using Next.js Form Actions.
   - Ensure image uploads bridge correctly to the R2 bucket.

8. **Verify & Deploy**:
   - Test locally with `vinext dev`.
   - Run `alchemy deploy` (or the respective script) to launch to Cloudflare.

## Verification Plan

### Automated / Local Verification

1. **Local D1 & R2**: Run the project using Wrangler's local emulation (`bunx wrangler dev` or strictly `vinext dev` with Cloudflare Miniflare bindings) to ensure D1 queries and R2 uploads work locally.
2. **Seeding**: Write a script (`db/seed.ts`) equivalent to the old `server.py`'s `run_seed` function. Run it locally via `bunx drizzle-kit push` and `bun run db/seed.ts` to ensure the database schema and sample data populate successfully.
3. **Linting & TS Check**: Ensure `bun run lint` (oxlint) and `tsc --noEmit` pass flawlessly. Verify no `useMemo` or `useCallback` sneaks into the client components.

### Manual Verification

1. Navigate to `/` and verify the Hero Banners and Collections load quickly via SSR.
2. Verify Framer Motion animations trigger correctly.
3. Test the Admin Login flow: Attempt to access `/admin`, get redirected to `/admin/login`. Ensure the OTP email is received via Resend. Login successfully.
4. Test Product CRUD in the Admin dashboard, including uploading an image (which should successfully store it in the local R2 emulator).

## User Review Required

> [!IMPORTANT]
> **Database Shift**: Moving from MongoDB (NoSQL) to D1 (SQL/SQLite) requires defining a strict relational schema. Are there any specific relations or indexing strategies you want prioritized?
>
> **Authentication**: The old system used a JWT returned to the client and placed in an `Authorization` header. I recommend switching to an **HttpOnly Cookie** set by the Next.js server for better security and easier SSR authentication. Does this approach work for you?
>
> **Cloudflare Setup**: Have you already provisioned a D1 Database and R2 Bucket on your Cloudflare account, or should I proceed with local emulation for now?
