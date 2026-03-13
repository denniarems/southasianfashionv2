import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { desc } from 'drizzle-orm'
import SettingsClient from './SettingsClient'
// Import other tables if they are needed by ItemDialog (which requires products, collections, categories, sizeGuides)
import { products, collections, categories, sizeGuides } from '@/db/schema'

export default async function SettingsPage() {
	const db = getDb()

	const [
		items,
		allProducts,
		allCollections,
		allCategories,
		allSizeGuides,
	] = await Promise.all([
		db.select().from(settings).limit(1),
		db.select().from(products).orderBy(desc(products.createdAt)),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(categories).orderBy(desc(categories.createdAt)),
		db.select().from(sizeGuides).orderBy(desc(sizeGuides.createdAt)),
	])

	return (
		<SettingsClient
			items={items}
			initialProducts={allProducts}
			initialCollections={allCollections}
			initialCategories={allCategories}
			initialSizeGuides={allSizeGuides}
		/>
	)
}
