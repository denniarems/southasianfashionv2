import { getDb } from '@/db'
import { products, collections, categories, discounts } from '@/db/schema'
import { desc, count, eq } from 'drizzle-orm'
import DashboardOverviewClient from './DashboardOverviewClient'

export default async function DashboardOverviewPage() {
	const db = getDb()

	const [
		totalProductsResult,
		totalCollectionsResult,
		totalCategoriesResult,
		activeDiscountsResult,
		recentProducts,
		recentCollections,
	] = await Promise.all([
		db.select({ count: count() }).from(products),
		db.select({ count: count() }).from(collections),
		db.select({ count: count() }).from(categories),
		db.select({ count: count() }).from(discounts).where(eq(discounts.isActive, true)),
		db.select().from(products).orderBy(desc(products.createdAt)).limit(5),
		db.select().from(collections).orderBy(desc(collections.createdAt)).limit(5),
	])

	const stats = {
		totalProducts: totalProductsResult[0]?.count || 0,
		totalCollections: totalCollectionsResult[0]?.count || 0,
		totalCategories: totalCategoriesResult[0]?.count || 0,
		activeDiscounts: activeDiscountsResult[0]?.count || 0,
	}

	return (
		<DashboardOverviewClient
			stats={stats}
			recentProducts={recentProducts}
			recentCollections={recentCollections}
		/>
	)
}