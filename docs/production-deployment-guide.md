# Production deployment guide

This app deploys to Cloudflare Workers with `vinext deploy`, while `alchemy.run.ts` provisions or adopts the Cloudflare resources and regenerates `wrangler.jsonc`.

## 1. Prerequisites

Before deploying, make sure you have:

- Bun installed
- Access to the correct Cloudflare account
- Workers, D1, R2, Images, and Email Routing enabled in Cloudflare
- A verified sender address: `no-reply@southasianfashion.ca`
- The current admin allowlist:
  - `denniarems@gmail.com`
  - `binumv1998@gmail.com`
  - `binumv19982023@gmail.com`
  - `babusimon30@gmail.com`

## 2. Authenticate with Cloudflare

Use Wrangler authentication before running Alchemy or deploying:

```powershell
bunx wrangler login
```

If your team uses API tokens instead of interactive login, make sure your Cloudflare credentials are already available in the shell before continuing.

## 3. Set deployment environment values

`alchemy.run.ts` reads these values from the current shell and writes them into the generated `wrangler.jsonc`.

In PowerShell, set them like this:

```powershell
$env:ADMIN_EMAIL = "denniarems@gmail.com,binumv1998@gmail.com,binumv19982023@gmail.com,babusimon30@gmail.com"
$env:SENDER_EMAIL = "no-reply@southasianfashion.ca"
$env:R2_PUBLIC_URL = "https://pub-<your-r2-public-host>.r2.dev"
$env:CLOUDFLARE_IMAGES_DELIVERY_HOST = "imagedelivery.net"
$env:NEXT_PUBLIC_SITE_URL = "https://southasianfashion.ca"
```

Important notes:

- Set `NEXT_PUBLIC_SITE_URL` to the real production domain, not `localhost`
- Set `R2_PUBLIC_URL` to the real public R2 domain or custom media domain
- `JWT_SECRET` is **not** stored in `wrangler.jsonc`; it must be added as a Wrangler secret

## 4. Provision or sync Cloudflare infrastructure

Run:

```powershell
bun run alchemy:deploy
```

This step:

- Adopts or creates the D1 database `southasianfashion`
- Adopts or creates the R2 bucket `southasianfashion-media`
- Keeps the Images binding
- Generates a local `wrangler.jsonc` file (which is git-ignored) using the values from `alchemy.run.ts`

After it finishes, you can optionally inspect the generated `wrangler.jsonc` to confirm it looks correct:

- `d1_databases[0].database_id` contains a real Cloudflare UUID
- `vars.ADMIN_EMAIL` matches the full admin allowlist
- `vars.SENDER_EMAIL` is `no-reply@southasianfashion.ca`
- `send_email[0].allowed_destination_addresses` contains the same 4 admin emails
- `send_email[0].allowed_sender_addresses` contains `no-reply@southasianfashion.ca`

## 5. Refresh generated Cloudflare types

Run:

```powershell
bun run cf:types
```

This updates `worker-configuration.d.ts` so local typing matches the deployed bindings and vars.

## 6. Add the production secret

Set the JWT secret in Wrangler:

```powershell
bunx wrangler secret put JWT_SECRET
```

Use a strong production secret. Do not rely on the fallback value in application code.

## 7. Apply remote database migrations

For the first production deploy, or whenever migrations change, run:

```powershell
bun run db:migrate:remote
```

If you changed the Drizzle schema and have not generated a migration yet, run `bun run db:generate` first.

## 8. Run optional pre-deploy checks

Recommended checks before the real deploy:

```powershell
bun run lint
bun run type-check
bun run deploy:dry-run
```

## 9. Deploy the app

Run the full production deployment flow:

```powershell
bun run deploy:production
```

This command runs:

1. `bun run alchemy:deploy`
2. `bun run deploy`

Use this as the default production command.

## 10. Verify the deployment

After deployment, verify all of the following in production:

- The storefront loads successfully
- Product and collection pages render
- Admin login only accepts the allowlisted admin emails
- OTP email sends from `no-reply@southasianfashion.ca`
- D1 reads and writes succeed in admin flows
- Product uploads succeed and produce public R2 URLs
- Uploaded images load from the configured public media domain
- `robots.txt`, sitemap, and metadata point to the real production domain

## 11. Repeat deployment checklist

For later releases, use this shorter flow:

1. Pull the latest code
2. Set the deployment environment values in your shell
3. Run `bun run alchemy:deploy` if infra or runtime vars changed
4. Run `bun run db:migrate:remote` if migrations changed
5. Run `bun run deploy:production`
6. Smoke test OTP login, uploads, and the storefront

## Troubleshooting

- If `wrangler.jsonc` fails to generate or does not contain real Cloudflare IDs, rerun `bun run alchemy:deploy` after confirming Cloudflare auth
- If OTP email fails, verify Email Routing is enabled and the sender/destination addresses are allowed in `send_email`
- If uploads work but images do not load, verify `R2_PUBLIC_URL` and `CLOUDFLARE_IMAGES_DELIVERY_HOST`
- If production metadata or sitemap points to localhost, reset `NEXT_PUBLIC_SITE_URL`, rerun `bun run alchemy:deploy`, and redeploy