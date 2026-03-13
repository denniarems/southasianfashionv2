import { getDb } from '@/db'
import { models } from '@/db/schema'
import { desc } from 'drizzle-orm'
import ModelsClient from './ModelsClient'

export default async function ModelsPage() {
	const db = getDb()

	const [allModels] = await Promise.all([
		db.select().from(models).orderBy(desc(models.createdAt)),
	])

	return <ModelsClient initialModels={allModels} />
}
