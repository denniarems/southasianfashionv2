import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, isNotNull, ne, or } from 'drizzle-orm'
import { getDb } from '@/db'
import {
	collections,
	heroBanners,
	productImages,
	products,
	settings,
	sizeGuides,
} from '@/db/schema'
import { previewProductPrice, type ProductPricePreview } from '@/lib/discounts'
import type { ProductRow } from './products.functions'

async function getProductCategories() {
	const db = await getDb()
	const rows = await db
		.selectDistinct({ category: products.category })
		.from(products)
		.where(isNotNull(products.category))
		.orderBy(asc(products.category))

	return rows.map((row) => row.category).filter((category): category is string => Boolean(category))
}

async function getStoreShellData() {
	const db = await getDb()
	const [allCollections, [siteSettings], productCategories] = await Promise.all([
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(settings).limit(1),
		getProductCategories(),
	])

	return {
		allCollections,
		siteSettings,
		productCategories,
		currentYear: new Date().getFullYear(),
	}
}

async function getProductBySlug(slug: string) {
	const db = await getDb()
	const productQuery = await db
		.select()
		.from(products)
		.where(or(eq(products.slug, slug), eq(products.id, slug)))
		.limit(1)

	return productQuery[0] ?? null
}

async function withPricing(productRows: Array<typeof products.$inferSelect>) {
	return Promise.all(
		productRows.map(async (product) => ({
			...product,
			pricing: (await previewProductPrice(product)) as ProductPricePreview,
		})),
	)
}

export const getHomePageDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	const db = await getDb()

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
		getProductCategories(),
	])

	const [featuredProductsWithPricing, newArrivalProductsWithPricing] = await Promise.all([
		withPricing(featuredProducts),
		withPricing(newArrivalProducts),
	])

	return {
		heroData,
		allCollections,
		featuredProducts: featuredProductsWithPricing,
		newArrivalProducts: newArrivalProductsWithPricing,
		siteSettings,
		productCategories,
		currentYear: new Date().getFullYear(),
	}
})

export const getProductsShellDataFn = createServerFn({ method: 'GET' }).handler(getStoreShellData)

export const getCollectionsPageDataFn = createServerFn({ method: 'GET' }).handler(getStoreShellData)

export const getProductDetailDataFn = createServerFn({ method: 'GET' })
	.inputValidator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		const db = await getDb()
		const shell = await getStoreShellData()
		const product = await getProductBySlug(data.slug)

		if (!product) {
			return {
				...shell,
				product: null,
				relatedProducts: [] as ProductRow[],
				productImages: [] as string[],
				sizeGuide: null,
				pricingPreview: null,
				siteUrl: process.env.SITE_URL || 'http://localhost:3000',
			}
		}

		const relatedConditions = []
		if (product.category) relatedConditions.push(eq(products.category, product.category))
		if (product.collectionId)
			relatedConditions.push(eq(products.collectionId, product.collectionId))

		const [relatedProducts, productImageRows, selectedSizeGuide, pricingPreview] =
			await Promise.all([
				relatedConditions.length > 0
					? db
							.select()
							.from(products)
							.where(and(ne(products.id, product.id), or(...relatedConditions)))
							.orderBy(desc(products.createdAt))
							.limit(4)
					: [],
				db
					.select()
					.from(productImages)
					.where(eq(productImages.productId, product.id))
					.orderBy(asc(productImages.sortOrder)),
				product.sizeGuideId
					? db
							.select()
							.from(sizeGuides)
							.where(eq(sizeGuides.id, product.sizeGuideId))
							.limit(1)
							.then((rows) => rows[0] || null)
					: Promise.resolve(null),
				previewProductPrice(product),
			])

		const allImages = [
			...(product.imageUrl ? [product.imageUrl] : []),
			...productImageRows.map((img) => img.imageUrl),
		]

		return {
			...shell,
			product,
			relatedProducts: await withPricing(relatedProducts),
			productImages: allImages,
			sizeGuide: selectedSizeGuide,
			pricingPreview,
			siteUrl: process.env.SITE_URL || 'http://localhost:3000',
		}
	})

export const getCollectionDetailDataFn = createServerFn({ method: 'GET' })
	.inputValidator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		const db = await getDb()
		const shell = await getStoreShellData()
		const [collection] = await db
			.select()
			.from(collections)
			.where(eq(collections.slug, data.slug))
			.limit(1)

		if (!collection) {
			return {
				...shell,
				collection: null,
				collectionProducts: [] as ProductRow[],
			}
		}

		const collectionProducts = await db
			.select()
			.from(products)
			.where(eq(products.collectionId, collection.id))
			.orderBy(desc(products.createdAt))

		return {
			...shell,
			collection,
			collectionProducts: await withPricing(collectionProducts),
		}
	})

export const getSitemapDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	const db = await getDb()
	const [allProducts, allCollections] = await Promise.all([
		db
			.select({
				slug: products.slug,
				id: products.id,
				createdAt: products.createdAt,
			})
			.from(products),
		db
			.select({
				slug: collections.slug,
				createdAt: collections.createdAt,
			})
			.from(collections),
	])

	return {
		siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
		products: allProducts,
		collections: allCollections,
	}
})
