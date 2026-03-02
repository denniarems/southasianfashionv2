import { getDb } from '@/db'
import { settings, collections } from '@/db/schema'
import { desc } from 'drizzle-orm'
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductsGrid from '../components/ProductsGrid'
import { fetchProducts, fetchProductCategories } from '../actions/products'

export const metadata: Metadata = {
	title: 'Products',
	description:
		'Browse all available South Asian Fashion products and discover your next statement piece.',
	alternates: {
		canonical: '/products',
	},
}

export default async function ProductsPage({
	searchParams,
}: {
	searchParams: Promise<{ category?: string }>
}) {
	const db = getDb()
	const currentYear = new Date().getFullYear()
	const { category: categoryParam } = await searchParams
	const initialCategory = categoryParam ?? ''

	const [initialResult, allCollections, [siteSettings], productCategories] = await Promise.all([
		fetchProducts({ search: '', category: initialCategory, sort: 'newest', offset: 0 }),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(settings).limit(1),
		fetchProductCategories(),
	])

	return (
		<>
			<Navbar
				settings={siteSettings}
				collections={allCollections}
				categories={productCategories}
				transparent={false}
			/>

			<ProductsGrid
				initialProducts={initialResult.products}
				initialTotal={initialResult.total}
				initialHasMore={initialResult.hasMore}
				categories={productCategories}
				initialCategory={initialCategory}
			/>

			<Footer settings={siteSettings} year={currentYear} />
		</>
	)
}
