import alchemy from "alchemy";
import { D1Database, R2Bucket, Worker } from "alchemy/cloudflare";

// Initialize Alchemy app (alchemy v0.87+ uses function-based API)
const app = await alchemy("southasianfashion");

// Database
const db = await D1Database("saf-db", {
  name: "saf-db",
});

// Asset Bucket
const bucket = await R2Bucket("saf-bucket", {
  name: "saf-bucket",
});

// Main Worker
export const worker = await Worker("saf-worker", {
  name: "southasianfashion",
  entrypoint: "./dist/server.js", // Built by vinext
  compatibilityDate: "2024-04-05",
  bindings: {
    DB: db,
    BUCKET: bucket,
  },
});

// Finalize the alchemy app (triggers deletion of orphaned resources)
await app.finalize();
