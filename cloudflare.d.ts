// Ambient module declarations for Cloudflare Workers synthetic modules.
// These modules are provided by the Cloudflare Workers runtime and wrangler's
// miniflare emulation. TypeScript doesn't know about them natively so we declare
// them here to allow importing/dynamic-importing them without errors.

declare module "cloudflare:workers" {
  // The env object contains all bindings defined in wrangler.json.
  // We keep it as `any` since the shape varies per project.
  export const env: any;
}
