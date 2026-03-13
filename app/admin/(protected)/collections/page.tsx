import { getDb } from '@/db'
import { desc } from 'drizzle-orm'
import CollectionsClient from './CollectionsClient'
// Import other tables if they are needed by ItemDialog (which requires products, collections, categories, sizeGuides)
import { products, collections, categories, sizeGuides } from '@/db/schema'

export default async function CollectionsPage() {
	const db = getDb()

	const [
		items,
		allProducts,
		allCollections,
		allCategories,
		allSizeGuides,
	] = await Promise.all([
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(products).orderBy(desc(products.createdAt)),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(categories).orderBy(desc(categories.createdAt)),
		db.select().from(sizeGuides).orderBy(desc(sizeGuides.createdAt)),
	])

	return (
		<CollectionsClient
			items={items}
			initialProducts={allProducts}
			initialCollections={allCollections}
			initialCategories={allCategories}
			initialSizeGuides={allSizeGuides}
		/>
	)
}
