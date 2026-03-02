# Migration Execution Plan

## 1. Initialization & DB Setup

- [ ] Initialize Next.js environment with `vinext` if not fully set up.
- [ ] Install Drizzle ORM, Drizzle Kit, and `@alchemy/core` (or placeholder for alchemy).
- [ ] Create `db/schema.ts` based on [schema.md](file:///C:/Users/denni/.gemini/antigravity/brain/4dbfd556-a434-4f62-b1c8-fcfbb13296d8/schema.md).
- [ ] Write `db/seed.ts` script to populate D1.
- [ ] Run initial migrations for local D1 emulator.

## 2. Infrastructure as Code (Alchemy.run)

- [ ] Define alchemy configuration for Cloudflare worker, D1, and R2.

## 3. Auth & Backend API

- [ ] Setup `middleware.ts`.
- [ ] Implement `requestOtp` and `verifyOtp` server actions (`app/actions/auth.ts`).
- [ ] Implement `app/api/upload/route.ts` for Cloudflare R2 uploads.

## 4. Layout & Global Assets

- [ ] Migrate [index.css](file:///d:/code/southasianfashion/old-code/frontend/src/index.css) to [app/globals.css](file:///d:/code/southasianfashion/app/globals.css).
- [ ] Setup fonts (Playfair, Manrope, Cormorant).
- [ ] Migrate [tailwind.config.js](file:///d:/code/southasianfashion/old-code/frontend/tailwind.config.js) colors and settings.
- [ ] Create the global [layout.tsx](file:///d:/code/southasianfashion/app/layout.tsx) with Lenis Provider.

## 5. Component Migration (JSX -> TSX)

- [ ] Migrate UI components (`Button.tsx`, `Card.tsx`, inputs). Ensure NO style changes.
- [ ] Migrate `HeroBanner.tsx`, `ProductGrid.tsx`, `MegaMenu.tsx`.

## 6. Page Construction

- [ ] Build [app/page.tsx](file:///d:/code/southasianfashion/app/page.tsx) (RSC fetching from D1).
- [ ] Build `app/products/page.tsx`.
- [ ] Build `app/products/[slug]/page.tsx`.

## 7. Admin Dashboard

- [ ] Migrate `/admin/login`.
- [ ] Migrate `/admin/dashboard` and CRUD interfaces.

## 8. Final Verification

- [ ] Test the entire flow locally.
- [ ] Check console for hydration/framer-motion errors.
