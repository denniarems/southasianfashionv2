import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, gte, isNotNull, lte, or, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { occasions, products } from '@/db/schema'
import { previewProductPrice, type ProductPricePreview } from '@/lib/discounts'
import { occasionLabelForSlug } from '@/lib/merchandising'

const PAGE_SIZE = 12

export type ProductRow = typeof products.$inferSelect & {
	pricing?: ProductPricePreview
}

interface FetchProductsParams {
	search?: string
	category?: string
	occasion?: string
	fabric?: string
	color?: string
	availability?: string
	priceMin?: number | string
	priceMax?: number | string
	sort?: string
	offset: number
}

export interface FetchProductsResult {
	products: ProductRow[]
	total: number
	hasMore: boolean
}

function isMissingOccasionsTableError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes('occasions') &&
		(message.includes('does not exist') ||
			message.includes('no such table') ||
			message.includes('Failed query'))
	)
}

async function occasionFilterValues(db: Awaited<ReturnType<typeof getDb>>, value: string) {
	const normalized = value.trim().toLowerCase()
	const values = new Set([normalized, occasionLabelForSlug(value).toLowerCase()])

	try {
		const rows = await db
			.select({ slug: occasions.slug, name: occasions.name })
			.from(occasions)
			.where(
				or(
					sql`lower(${occasions.slug}) = ${normalized}`,
					sql`lower(${occasions.name}) = ${normalized}`,
				),
			)
			.limit(1)

		if (rows[0]) {
			values.add(rows[0].slug.toLowerCase())
			values.add(rows[0].name.toLowerCase())
		}
	} catch (error) {
		if (!isMissingOccasionsTableError(error)) {
			throw error
		}
	}

	return Array.from(values)
}

export const fetchProductsFn = createServerFn({ method: 'GET' })
	.inputValidator((data: FetchProductsParams) => data)
	.handler(async ({ data }): Promise<FetchProductsResult> => {
		const db = await getDb()
		const conditions = []
		const normalizedSearch = data.search?.trim() || ''

		if (normalizedSearch) {
			const pattern = `%${normalizedSearch.toLowerCase()}%`
			conditions.push(
				or(
					sql`lower(${products.name}) like ${pattern}`,
					sql`lower(${products.description}) like ${pattern}`,
					sql`lower(${products.category}) like ${pattern}`,
					sql`lower(${products.occasion}) like ${pattern}`,
					sql`lower(${products.fabric}) like ${pattern}`,
					sql`lower(${products.color}) like ${pattern}`,
				),
			)
		}

		if (data.category) {
			conditions.push(eq(products.category, data.category))
		}

		if (data.occasion) {
			const values = await occasionFilterValues(db, data.occasion)
			conditions.push(or(...values.map((value) => sql`lower(${products.occasion}) = ${value}`)))
		}

		if (data.fabric) {
			conditions.push(sql`lower(${products.fabric}) = ${data.fabric.trim().toLowerCase()}`)
		}

		if (data.color) {
			conditions.push(sql`lower(${products.color}) = ${data.color.trim().toLowerCase()}`)
		}

		if (data.availability) {
			const availability = data.availability.trim().toLowerCase()
			conditions.push(
				or(
					sql`lower(${products.availabilityStatus}) = ${availability}`,
					...(availability === 'ready-to-ship' ? [eq(products.isReadyToShip, true)] : []),
				),
			)
		}

		const priceMin = Number(data.priceMin)
		const priceMax = Number(data.priceMax)
		if (Number.isFinite(priceMin) && priceMin > 0) {
			conditions.push(gte(products.price, priceMin))
		}
		if (Number.isFinite(priceMax) && priceMax > 0) {
			conditions.push(lte(products.price, priceMax))
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined

		let orderBy = [asc(products.displayOrder), desc(products.createdAt)]
		switch (data.sort) {
			case 'price-asc':
				orderBy = [asc(products.price), asc(products.displayOrder)]
				break
			case 'price-desc':
				orderBy = [desc(products.price), asc(products.displayOrder)]
				break
			case 'name-asc':
				orderBy = [asc(products.name)]
				break
			case 'featured':
				orderBy = [desc(products.isFeatured), asc(products.displayOrder), desc(products.createdAt)]
				break
			default:
				orderBy = [asc(products.displayOrder), desc(products.createdAt)]
		}

		const [items, [{ total }]] = await Promise.all([
			db
				.select()
				.from(products)
				.where(whereClause)
				.orderBy(...orderBy)
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

		return rows.flatMap((row: { category: string | null }) => (row.category ? [row.category] : []))
	},
)
