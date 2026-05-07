import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, gte, isNotNull, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import {
	analyticsEvents,
	categories,
	collections,
	discounts,
	heroBanners,
	models,
	occasions,
	productImages,
	products,
	settings,
	sizeGuides,
} from '@/db/schema'
import { asRecord, enumValue } from './input-validators'
import { requireAdmin } from './auth.server'

const CRUD_TYPES = [
	'products',
	'collections',
	'categories',
	'occasions',
	'hero',
	'size-guides',
	'discounts',
	'settings',
] as const

type CrudType = (typeof CRUD_TYPES)[number]

function parseCrudDataInput(value: unknown): { type: CrudType } {
	const input = asRecord(value, 'Admin CRUD data request')
	return {
		type: enumValue(input.type, CRUD_TYPES, 'Admin CRUD data type'),
	}
}

async function getAdminReferenceData() {
	const db = await getDb()
	const [allProducts, allCollections, allCategories, allOccasions, allSizeGuides] =
		await Promise.all([
			db.select().from(products).orderBy(asc(products.displayOrder), desc(products.createdAt)),
			db
				.select()
				.from(collections)
				.orderBy(asc(collections.displayOrder), desc(collections.createdAt)),
			db.select().from(categories).orderBy(desc(categories.createdAt)),
			db.select().from(occasions).orderBy(asc(occasions.displayOrder), desc(occasions.createdAt)),
			db.select().from(sizeGuides).orderBy(desc(sizeGuides.createdAt)),
		])

	return {
		initialProducts: allProducts,
		initialCollections: allCollections,
		initialCategories: allCategories,
		initialOccasions: allOccasions,
		initialSizeGuides: allSizeGuides,
	}
}

const DASHBOARD_EVENT_NAMES = [
	'product_view',
	'add_to_cart',
	'whatsapp_click',
	'share_click',
	'wishlist_toggle',
] as const

async function getAnalyticsSummary(db: Awaited<ReturnType<typeof getDb>>) {
	const zeroCounts = Object.fromEntries(
		DASHBOARD_EVENT_NAMES.map((eventName) => [eventName, { sevenDay: 0, thirtyDay: 0 }]),
	) as Record<(typeof DASHBOARD_EVENT_NAMES)[number], { sevenDay: number; thirtyDay: number }>

	try {
		const now = new Date()
		const sevenDaysAgo = new Date(now)
		sevenDaysAgo.setDate(now.getDate() - 7)
		const thirtyDaysAgo = new Date(now)
		thirtyDaysAgo.setDate(now.getDate() - 30)

		const countEvent = async (eventName: string, since: Date) => {
			const [row] = await db
				.select({ value: count() })
				.from(analyticsEvents)
				.where(
					and(
						eq(analyticsEvents.eventName, eventName),
						gte(analyticsEvents.createdAt, since.toISOString()),
					),
				)
			return row?.value || 0
		}

		const eventCounts = { ...zeroCounts }
		await Promise.all(
			DASHBOARD_EVENT_NAMES.flatMap((eventName) => [
				countEvent(eventName, sevenDaysAgo).then((value) => {
					eventCounts[eventName].sevenDay = value
				}),
				countEvent(eventName, thirtyDaysAgo).then((value) => {
					eventCounts[eventName].thirtyDay = value
				}),
			]),
		)

		const topProducts = await db
			.select({
				productId: analyticsEvents.productId,
				productSlug: analyticsEvents.productSlug,
				views: count(),
			})
			.from(analyticsEvents)
			.where(
				and(
					eq(analyticsEvents.eventName, 'product_view'),
					gte(analyticsEvents.createdAt, thirtyDaysAgo.toISOString()),
					isNotNull(analyticsEvents.productId),
				),
			)
			.groupBy(analyticsEvents.productId, analyticsEvents.productSlug)
			.orderBy(desc(sql`count(*)`))
			.limit(5)

		return {
			available: true,
			counts: eventCounts,
			topProducts,
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (!message.includes('analytics_events')) {
			console.warn({
				level: 'warn',
				source: 'analytics',
				message: 'admin_analytics_query_failed',
				error: message,
			})
		}
		return {
			available: false,
			counts: zeroCounts,
			topProducts: [] as Array<{
				productId: string | null
				productSlug: string | null
				views: number
			}>,
		}
	}
}

async function getMerchandisingWarnings(db: Awaited<ReturnType<typeof getDb>>) {
	const allProducts = await db.select().from(products)
	let imageRows: Array<{ productId: string }> = []
	try {
		imageRows = await db.select({ productId: productImages.productId }).from(productImages)
	} catch {
		imageRows = []
	}

	const galleryCountByProduct = new Map<string, number>()
	for (const image of imageRows) {
		galleryCountByProduct.set(
			image.productId,
			(galleryCountByProduct.get(image.productId) || 0) + 1,
		)
	}

	const missingPrimaryImage = allProducts.filter((product) => !product.imageUrl?.trim()).length
	const lowImageCount = allProducts.filter(
		(product) => (product.imageUrl ? 1 : 0) + (galleryCountByProduct.get(product.id) || 0) < 2,
	).length
	const weakProductNames = allProducts.filter((product) => {
		const normalized = product.name.trim().toLowerCase()
		return normalized.length < 12 || normalized === 'untitled' || normalized.includes('test')
	}).length

	return {
		missingPrimaryImage,
		lowImageCount,
		weakProductNames,
	}
}

export const getDashboardOverviewDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	await requireAdmin()
	const db = await getDb()
	const [
		totalProductsResult,
		totalCollectionsResult,
		totalCategoriesResult,
		activeDiscountsResult,
		recentProducts,
		recentCollections,
		analyticsSummary,
		merchandisingWarnings,
	] = await Promise.all([
		db.select({ count: count() }).from(products),
		db.select({ count: count() }).from(collections),
		db.select({ count: count() }).from(categories),
		db.select({ count: count() }).from(discounts).where(eq(discounts.isActive, true)),
		db.select().from(products).orderBy(desc(products.createdAt)).limit(5),
		db.select().from(collections).orderBy(desc(collections.createdAt)).limit(5),
		getAnalyticsSummary(db),
		getMerchandisingWarnings(db),
	])

	return {
		stats: {
			totalProducts: totalProductsResult[0]?.count || 0,
			totalCollections: totalCollectionsResult[0]?.count || 0,
			totalCategories: totalCategoriesResult[0]?.count || 0,
			activeDiscounts: activeDiscountsResult[0]?.count || 0,
		},
		recentProducts,
		recentCollections,
		analyticsSummary,
		merchandisingWarnings,
	}
})

export const getAdminCrudDataFn = createServerFn({ method: 'GET' })
	.inputValidator(parseCrudDataInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		const db = await getDb()
		const references = await getAdminReferenceData()

		switch (data.type) {
			case 'products':
				return {
					items: await db
						.select()
						.from(products)
						.orderBy(asc(products.displayOrder), desc(products.createdAt)),
					...references,
				}
			case 'collections':
				return {
					items: await db
						.select()
						.from(collections)
						.orderBy(asc(collections.displayOrder), desc(collections.createdAt)),
					...references,
				}
			case 'categories':
				return {
					items: await db.select().from(categories).orderBy(desc(categories.createdAt)),
					...references,
				}
			case 'occasions':
				return {
					items: await db
						.select()
						.from(occasions)
						.orderBy(asc(occasions.displayOrder), desc(occasions.createdAt)),
					...references,
				}
			case 'hero':
				return {
					items: await db.select().from(heroBanners).orderBy(desc(heroBanners.createdAt)),
					...references,
				}
			case 'size-guides':
				return {
					items: await db.select().from(sizeGuides).orderBy(desc(sizeGuides.createdAt)),
					...references,
				}
			case 'discounts':
				return {
					items: await db.select().from(discounts).orderBy(desc(discounts.createdAt)),
					...references,
				}
			case 'settings':
				return {
					items: await db.select().from(settings).limit(1),
					...references,
				}
			default:
				return {
					items: [],
					...references,
				}
		}
	})

export const getModelsAdminDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	await requireAdmin()
	const db = await getDb()
	return {
		models: await db.select().from(models).orderBy(desc(models.createdAt)),
	}
})

export const getProductFormDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	await requireAdmin()
	const db = await getDb()
	const [allCollections, allCategories, allOccasions, allSizeGuides, allModels] = await Promise.all(
		[
			db.select().from(collections).orderBy(asc(collections.name)),
			db.select().from(categories).orderBy(asc(categories.name)),
			db.select().from(occasions).orderBy(asc(occasions.displayOrder), asc(occasions.name)),
			db.select().from(sizeGuides).orderBy(asc(sizeGuides.name)),
			db.select().from(models).orderBy(desc(models.updatedAt)),
		],
	)

	return {
		collections: allCollections,
		categories: allCategories,
		occasions: allOccasions,
		sizeGuides: allSizeGuides,
		models: allModels,
	}
})

export const getBatchImportDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	await requireAdmin()
	const db = await getDb()
	const [allCollections, allCategories, allModels] = await Promise.all([
		db.select().from(collections).orderBy(asc(collections.name)),
		db.select().from(categories).orderBy(asc(categories.name)),
		db.select().from(models).orderBy(desc(models.updatedAt)),
	])

	return {
		collections: allCollections,
		categories: allCategories,
		models: allModels,
	}
})
