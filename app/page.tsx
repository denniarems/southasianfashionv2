import { getDb } from '@/db'
import { heroBanners, collections, products, settings } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Metadata } from 'next'

import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import Collections from './components/Collections'
import Featured from './components/Featured'
import NewArrivals from './components/NewArrivals'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import { fetchProductCategories } from './actions/products'
import { previewProductPrice } from '@/lib/discounts'

export const metadata: Metadata = {
	title: 'Home',
	description:
		'Discover curated luxury South Asian fashion collections, featured pieces, and new arrivals.',
	alternates: {
		canonical: '/',
	},
}

export default async function Home() {
	const db = getDb()

	// Parallel fetch for homepage data
	const [
		[heroData],
		allCollections,
		featuredProducts,
		newArrivalProducts,
		[siteSettings],
		productCategories,
	] = await Promise.all([
		db.select().from(heroBanners).where(eq(heroBanners.isActive, true)).limit(1),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(products).where(eq(products.isFeatured, true)).limit(1),
		db
			.select()
			.from(products)
			.where(eq(products.isNew, true))
			.orderBy(desc(products.createdAt))
			.limit(3),
		db.select().from(settings).limit(1),
		fetchProductCategories(),
	])

	const currentYear = new Date().getFullYear()

	const [featuredProductsWithPricing, newArrivalProductsWithPricing] = await Promise.all([
		Promise.all(
			featuredProducts.map(async (product: typeof products.$inferSelect) => ({
				...product,
				pricing: await previewProductPrice(product),
			})),
		),
		Promise.all(
			newArrivalProducts.map(async (product: typeof products.$inferSelect) => ({
				...product,
				pricing: await previewProductPrice(product),
			})),
		),
	])

	return (
		<>
			<Navbar
				settings={siteSettings}
				collections={allCollections}
				categories={productCategories}
				transparent={true}
			/>

			<main>
				<HeroSection hero={heroData} />
				<Collections collections={allCollections} />
				<Featured products={featuredProductsWithPricing} settings={siteSettings} />
				<NewArrivals products={newArrivalProductsWithPricing} settings={siteSettings} />
			</main>

			<Footer settings={siteSettings} year={currentYear} />
			<WhatsAppButton settings={siteSettings} />
		</>
	)
}
