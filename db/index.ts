import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

const createDb = () => drizzle(env.SAF_DB, { schema })

let dbInstance: ReturnType<typeof createDb> | null = null

export function getDb() {
	if (!dbInstance) {
		dbInstance = createDb()
	}
	return dbInstance
}
