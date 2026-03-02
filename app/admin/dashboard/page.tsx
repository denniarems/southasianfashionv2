import { getDb } from '@/db'
import { products, collections, heroBanners, categories, settings, sizeGuides } from '@/db/schema'
import { desc } from 'drizzle-orm'
import DashboardClient from './DashboardClient'

export default async function AdminDashboardPage() {
	const db = getDb()

	const [allProducts, allCollections, allHeroes, allCategories, allSizeGuides, [siteSettings]] =
		await Promise.all(
		[
			db.select().from(products).orderBy(desc(products.createdAt)),
			db.select().from(collections).orderBy(desc(collections.createdAt)),
			db.select().from(heroBanners).orderBy(desc(heroBanners.createdAt)),
			db.select().from(categories).orderBy(desc(categories.createdAt)),
			db.select().from(sizeGuides).orderBy(desc(sizeGuides.createdAt)),
			db.select().from(settings).limit(1),
		],
		)

	return (
		<DashboardClient
			initialProducts={allProducts}
			initialCollections={allCollections}
			initialHeroes={allHeroes}
			initialCategories={allCategories}
			initialSizeGuides={allSizeGuides}
			initialSettings={siteSettings || {}}
		/>
	)
}
