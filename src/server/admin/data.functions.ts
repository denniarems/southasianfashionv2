import { createServerFn } from '@tanstack/react-start'
import { asc, count, desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import {
	categories,
	collections,
	discounts,
	heroBanners,
	models,
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
	const [allProducts, allCollections, allCategories, allSizeGuides] = await Promise.all([
		db.select().from(products).orderBy(desc(products.createdAt)),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(categories).orderBy(desc(categories.createdAt)),
		db.select().from(sizeGuides).orderBy(desc(sizeGuides.createdAt)),
	])

	return {
		initialProducts: allProducts,
		initialCollections: allCollections,
		initialCategories: allCategories,
		initialSizeGuides: allSizeGuides,
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
	] = await Promise.all([
		db.select({ count: count() }).from(products),
		db.select({ count: count() }).from(collections),
		db.select({ count: count() }).from(categories),
		db.select({ count: count() }).from(discounts).where(eq(discounts.isActive, true)),
		db.select().from(products).orderBy(desc(products.createdAt)).limit(5),
		db.select().from(collections).orderBy(desc(collections.createdAt)).limit(5),
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
					items: await db.select().from(products).orderBy(desc(products.createdAt)),
					...references,
				}
			case 'collections':
				return {
					items: await db.select().from(collections).orderBy(desc(collections.createdAt)),
					...references,
				}
			case 'categories':
				return {
					items: await db.select().from(categories).orderBy(desc(categories.createdAt)),
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
	const [allCollections, allCategories, allSizeGuides, allModels] = await Promise.all([
		db.select().from(collections).orderBy(asc(collections.name)),
		db.select().from(categories).orderBy(asc(categories.name)),
		db.select().from(sizeGuides).orderBy(asc(sizeGuides.name)),
		db.select().from(models).orderBy(desc(models.updatedAt)),
	])

	return {
		collections: allCollections,
		categories: allCategories,
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
