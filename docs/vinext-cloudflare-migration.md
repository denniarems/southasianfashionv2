# vinext + Cloudflare Workers migration guide

This repository now targets Cloudflare Workers with `vinext`, Cloudflare D1, Cloudflare R2, and Cloudflare Email Workers.

## Phase 1: Framework migration

- Verified the project uses the App Router via the root `app/` directory.
- Ran `bunx vinext check` and confirmed the codebase is 95% compatible.
- Ran `bunx vinext init`, which kept the existing `vite.config.ts` and confirmed vinext setup.
- Updated `package.json` so the primary lifecycle scripts now use `vinext`:
  - `bun run dev`
  - `bun run build`
  - `bun run start`
  - `bun run deploy`

## Phase 2: Cloudflare runtime setup

1. Create a D1 database in Cloudflare and replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc`.
2. Create an R2 bucket named `southasianfashion-media` or update the bucket name in `wrangler.jsonc`.
3. Enable Cloudflare Images and keep the `IMAGES` binding in `wrangler.jsonc`.
4. Enable Email Routing and verify the destination inboxes and sender address used by `OTP_EMAIL`.
5. Add your JWT secret with Wrangler:

```bash
bunx wrangler secret put JWT_SECRET
```

6. Generate Worker binding types:

```bash
bun run cf:types
```

## Phase 3: Database migration (PostgreSQL -> D1)

Code changes already applied:

- `db/index.ts` now uses `import { env } from 'cloudflare:workers'` and `drizzle-orm/d1`.
- `db/schema.ts` now uses `drizzle-orm/sqlite-core`.
- PostgreSQL array columns were migrated to SQLite JSON text columns.
- Timestamp columns used by discounts now store ISO strings for D1-safe comparisons.
- `drizzle.config.ts` now targets the SQLite dialect and outputs migrations into `migrations/`.

Run the migration workflow:

```bash
bun run db:generate
bun run db:migrate:local
bun run db:migrate:remote
```

If you need to move existing PostgreSQL data, export it first and transform array/timestamp values into D1-compatible JSON/text before importing.

## Phase 4: Storage migration (Vercel Blob -> R2)

Code changes already applied:

- `app/api/upload/route.ts` now writes uploads to the `PRODUCT_MEDIA` R2 binding.
- `lib/cloudflare-r2.ts` generates public URLs from `R2_PUBLIC_URL` and deletes replaced images from R2.
- `app/actions/dashboard.ts` now deletes media from R2 when products, collections, hero banners, or gallery images are removed.

Set a public bucket URL or custom domain in both `.env` and `wrangler.jsonc`:

```text
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

## Phase 5: Email migration (Resend -> Cloudflare Email Workers)

Code changes already applied:

- `app/actions/auth.ts` no longer uses Resend.
- `lib/cloudflare-email.ts` builds a multipart OTP email and sends it through `env.OTP_EMAIL.send(...)`.
- Admin allow-list, sender email, and JWT secret are now read from Cloudflare runtime variables / secrets.

Cloudflare setup checklist:

1. Turn on Email Routing for your domain.
2. Verify the destination inboxes that should receive OTP emails.
3. Verify the sender address in your domain.
4. Update `send_email` in `wrangler.jsonc` to match your verified addresses.

## Phase 6: Image delivery

Code changes already applied:

- `next.config.ts` now accepts Cloudflare R2 public URLs and Cloudflare Images delivery URLs.
- `wrangler.jsonc` includes the `IMAGES` binding for future server-side image transformations.

Notes:

- vinext uses remote image rendering via the `next/image` compatibility layer and `@unpic`.
- Build-time local optimization is not available.
- Prefer Cloudflare Images delivery URLs or your R2 public domain for uploaded media.

## Phase 7: Verification

### Local

```bash
bun run cf:types
bun run db:migrate:local
bun run dev
```

Then verify:

- Catalog pages load.
- Admin login sends OTP email.
- Admin CRUD writes to D1.
- File uploads succeed and persist to R2.
- Uploaded images load through the configured public URL.

### Production

```bash
bun run db:migrate:remote
bun run deploy
```

After deployment, verify the production Worker URL:

- OTP login works.
- D1 reads/writes succeed.
- Uploads create public R2 URLs.
- Remote images load through Cloudflare delivery.

## Operational notes

- Use `bun run deploy:dry-run` before the first real deployment if you want to inspect the generated output.
- Do not use `getPlatformProxy()` or custom worker entries for bindings; this repository now relies on `cloudflare:workers` imports.
- If local email sends are tested through Wrangler, inspect the generated `.eml` files in the local Wrangler temp output.
