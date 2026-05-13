import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, isNotNull, ne, or } from 'drizzle-orm'
import { getDb } from '@/db'
import {
	collections,
	heroBanners,
	occasions,
	productImages,
	products,
	settings,
	sizeGuides,
} from '@/db/schema'
import { previewProductPrice, type ProductPricePreview } from '@/lib/discounts'
import { DEFAULT_OCCASION_LINKS, type OccasionLink } from '@/lib/merchandising'
import type { ProductRow } from './products.functions'

function isMissingOccasionsTableError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes('occasions') &&
		(message.includes('does not exist') ||
			message.includes('no such table') ||
			message.includes('Failed query'))
	)
}

async function getProductCategories() {
	const db = await getDb()
	const rows = await db
		.selectDistinct({ category: products.category })
		.from(products)
		.where(isNotNull(products.category))
		.orderBy(asc(products.category))

	return rows.flatMap((row) => (row.category ? [row.category] : []))
}

async function getProductFacets() {
	const db = await getDb()
	const [occasionRows, fabricRows, colorRows] = await Promise.all([
		db
			.selectDistinct({ value: products.occasion })
			.from(products)
			.where(isNotNull(products.occasion))
			.orderBy(asc(products.occasion)),
		db
			.selectDistinct({ value: products.fabric })
			.from(products)
			.where(isNotNull(products.fabric))
			.orderBy(asc(products.fabric)),
		db
			.selectDistinct({ value: products.color })
			.from(products)
			.where(isNotNull(products.color))
			.orderBy(asc(products.color)),
	])

	const clean = (rows: Array<{ value: string | null }>) =>
		rows.flatMap((row) => {
			const value = row.value?.trim()
			return value ? [value] : []
		})

	return {
		occasions: clean(occasionRows),
		fabrics: clean(fabricRows),
		colors: clean(colorRows),
	}
}

async function getOccasionLinks(): Promise<OccasionLink[]> {
	const db = await getDb()
	try {
		const rows = await db
			.select()
			.from(occasions)
			.orderBy(asc(occasions.displayOrder), asc(occasions.name))

		if (rows.length === 0) {
			return [...DEFAULT_OCCASION_LINKS]
		}

		return rows.map((occasion) => ({
			slug: occasion.slug,
			label: occasion.name,
			description: occasion.description || '',
			imageUrl: occasion.imageUrl || '',
			displayOrder: occasion.displayOrder,
		}))
	} catch (error) {
		if (isMissingOccasionsTableError(error)) {
			return [...DEFAULT_OCCASION_LINKS]
		}
		throw error
	}
}

async function getStoreShellData() {
	const db = await getDb()
	const [allCollections, [siteSettings], productCategories, productFacets, occasionLinks] =
		await Promise.all([
			db
				.select()
				.from(collections)
				.orderBy(asc(collections.displayOrder), desc(collections.createdAt)),
			db.select().from(settings).limit(1),
			getProductCategories(),
			getProductFacets(),
			getOccasionLinks(),
		])

	return {
		allCollections,
		siteSettings,
		productCategories,
		productFacets,
		occasionLinks,
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
		occasionLinks,
	] = await Promise.all([
		db.select().from(heroBanners).where(eq(heroBanners.isActive, true)).limit(1),
		db
			.select()
			.from(collections)
			.orderBy(asc(collections.displayOrder), desc(collections.createdAt)),
		db
			.select()
			.from(products)
			.where(eq(products.isFeatured, true))
			.orderBy(asc(products.displayOrder), desc(products.createdAt))
			.limit(1),
		db
			.select()
			.from(products)
			.where(eq(products.isNew, true))
			.orderBy(asc(products.displayOrder), desc(products.createdAt))
			.limit(3),
		db.select().from(settings).limit(1),
		getProductCategories(),
		getOccasionLinks(),
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
		occasionLinks,
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
							.orderBy(asc(products.displayOrder), desc(products.createdAt))
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
			.orderBy(asc(products.displayOrder), desc(products.createdAt))

		return {
			...shell,
			collection,
			collectionProducts: await withPricing(collectionProducts),
		}
	})

export const getSitemapDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	const db = await getDb()
	const [allProducts, allCollections, occasionLinks] = await Promise.all([
		db
			.select({
				slug: products.slug,
				id: products.id,
				createdAt: products.createdAt,
				updatedAt: products.updatedAt,
			})
			.from(products),
		db
			.select({
				slug: collections.slug,
				createdAt: collections.createdAt,
				updatedAt: collections.updatedAt,
			})
			.from(collections),
		getOccasionLinks(),
	])

	return {
		siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
		products: allProducts,
		collections: allCollections,
		occasionLinks,
	}
})
