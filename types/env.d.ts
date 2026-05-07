import type { website } from '../alchemy.run'

export type CloudflareEnv = typeof website.Env

declare global {
	type Env = CloudflareEnv
}

declare module 'cloudflare:workers' {
	namespace Cloudflare {
		interface Env extends CloudflareEnv {}
	}
}
