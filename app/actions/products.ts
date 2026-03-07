'use server'

import { getDb } from '@/db'
import { categories, products } from '@/db/schema'
import { and, asc, count, desc, eq, ilike, isNotNull, or } from 'drizzle-orm'
import { previewProductPrice, type ProductPricePreview } from '@/lib/discounts'

const PAGE_SIZE = 12

export type ProductRow = typeof products.$inferSelect & {
	pricing?: ProductPricePreview
}

interface FetchProductsParams {
	search: string
	category: string
	sort: string
	offset: number
}

export interface FetchProductsResult {
	products: ProductRow[]
	total: number
	hasMore: boolean
}

export async function fetchProducts({
	search,
	category,
	sort,
	offset,
}: FetchProductsParams): Promise<FetchProductsResult> {
	const db = getDb()

	const conditions = []

	if (search.trim()) {
		const pattern = `%${search.trim()}%`
		conditions.push(
			or(
				ilike(products.name, pattern),
				ilike(products.description, pattern),
				ilike(products.category, pattern),
			),
		)
	}

	if (category) {
		conditions.push(eq(products.category, category))
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined

	let orderBy
	switch (sort) {
		case 'price-asc':
			orderBy = asc(products.price)
			break
		case 'price-desc':
			orderBy = desc(products.price)
			break
		case 'name-asc':
			orderBy = asc(products.name)
			break
		default:
			orderBy = desc(products.createdAt)
	}

	const [items, [{ total }]] = await Promise.all([
		db.select().from(products).where(whereClause).orderBy(orderBy).offset(offset).limit(PAGE_SIZE),
		db.select({ total: count() }).from(products).where(whereClause),
	])

	const productsWithPricing = await Promise.all(
		items.map(async (product: typeof products.$inferSelect) => ({
			...product,
			pricing: await previewProductPrice(product),
		})),
	)

	return {
		products: productsWithPricing,
		total,
		hasMore: offset + productsWithPricing.length < total,
	}
}

export async function fetchProductCategories(): Promise<string[]> {
	const db = getDb()
	const configuredCategories = await db
		.select({ name: categories.name })
		.from(categories)
		.orderBy(asc(categories.name))

	if (configuredCategories.length > 0) {
		return configuredCategories
			.map((row: { name: string | null }) => row.name?.trim() ?? '')
			.filter((name: string) => name.length > 0)
	}

	const productCategoryRows = await db
		.select({ category: products.category })
		.from(products)
		.where(isNotNull(products.category))
		.groupBy(products.category)
		.orderBy(asc(products.category))

	return productCategoryRows
		.map((row: { category: string | null }) => row.category?.trim() ?? '')
		.filter((category: string) => category.length > 0)
}
