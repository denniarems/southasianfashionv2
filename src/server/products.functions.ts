import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, isNotNull, or, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { products } from '@/db/schema'
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

export const fetchProductsFn = createServerFn({ method: 'GET' })
	.inputValidator((data: FetchProductsParams) => data)
	.handler(async ({ data }): Promise<FetchProductsResult> => {
		const db = await getDb()
		const conditions = []

		if (data.search.trim()) {
			const pattern = `%${data.search.trim().toLowerCase()}%`
			conditions.push(
				or(
					sql`lower(${products.name}) like ${pattern}`,
					sql`lower(${products.description}) like ${pattern}`,
					sql`lower(${products.category}) like ${pattern}`,
				),
			)
		}

		if (data.category) {
			conditions.push(eq(products.category, data.category))
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined

		let orderBy
		switch (data.sort) {
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
			db
				.select()
				.from(products)
				.where(whereClause)
				.orderBy(orderBy)
				.offset(data.offset)
				.limit(PAGE_SIZE),
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
			hasMore: data.offset + productsWithPricing.length < total,
		}
	})

export const fetchProductCategoriesFn = createServerFn({ method: 'GET' }).handler(
	async (): Promise<string[]> => {
		const db = await getDb()
		const rows = await db
			.selectDistinct({ category: products.category })
			.from(products)
			.where(isNotNull(products.category))
			.orderBy(asc(products.category))

		return rows
			.map((row: { category: string | null }) => row.category)
			.filter((category: string | null): category is string => Boolean(category))
	},
)
