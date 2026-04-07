import { getDb } from '@/db'
import { collections, categories, models } from '@/db/schema'
import { asc, desc } from 'drizzle-orm'
import BatchImportClient from './BatchImportClient'

export default async function BatchImportPage() {
	const db = getDb()

	const [allCollections, allCategories, allModels] = await Promise.all([
		db.select().from(collections).orderBy(asc(collections.name)),
		db.select().from(categories).orderBy(asc(categories.name)),
		db.select().from(models).orderBy(desc(models.updatedAt)),
	])

	return (
		<div className="p-6 md:p-10 max-w-5xl mx-auto">
			<BatchImportClient
				collections={allCollections}
				categories={allCategories}
				models={allModels}
			/>
		</div>
	)
}
