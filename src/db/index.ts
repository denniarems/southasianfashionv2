import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

const getBoundDatabase = createServerOnlyFn(async () => {
	const { env } = await import('cloudflare:workers')
	return env.DB
})

export async function getDb(database?: D1Database) {
	return drizzle(database ?? (await getBoundDatabase()), { schema })
}
