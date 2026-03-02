'use server'

import { getDb } from '@/db'
import { products } from '@/db/schema'
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
	const rows = await db
		.selectDistinct({ category: products.category })
		.from(products)
		.where(isNotNull(products.category))
		.orderBy(asc(products.category))

	return rows
		.map((r: { category: string | null }) => r.category)
		.filter((c: string | null): c is string => Boolean(c))
}
