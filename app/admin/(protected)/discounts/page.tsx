import { getDb } from '@/db'
import { discounts } from '@/db/schema'
import { desc } from 'drizzle-orm'
import DiscountsClient from './DiscountsClient'
// Import other tables if they are needed by ItemDialog (which requires products, collections, categories, sizeGuides)
import { products, collections, categories, sizeGuides } from '@/db/schema'

export default async function DiscountsPage() {
	const db = getDb()

	const [
		items,
		allProducts,
		allCollections,
		allCategories,
		allSizeGuides,
	] = await Promise.all([
		db.select().from(discounts).orderBy(desc(discounts.createdAt)),
		db.select().from(products).orderBy(desc(products.createdAt)),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(categories).orderBy(desc(categories.createdAt)),
		db.select().from(sizeGuides).orderBy(desc(sizeGuides.createdAt)),
	])

	return (
		<DiscountsClient
			items={items}
			initialProducts={allProducts}
			initialCollections={allCollections}
			initialCategories={allCategories}
			initialSizeGuides={allSizeGuides}
		/>
	)
}
