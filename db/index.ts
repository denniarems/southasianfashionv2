import type { D1Database } from "@cloudflare/workers-types";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// `env` is provided by @cloudflare/vite-plugin (via Miniflare) in dev mode,
// and by the Cloudflare Workers runtime in production.
export function getDb() {
  const db = (env as unknown as { DB: D1Database }).DB;
  if (!db) {
    throw new Error(
      "D1 binding 'DB' is not available. Ensure wrangler.json has the DB binding configured.",
    );
  }
  return drizzle(db, { schema });
}
