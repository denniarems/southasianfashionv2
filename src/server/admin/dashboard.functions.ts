import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import {
	categories,
	collections,
	discounts,
	discountUsages,
	heroBanners,
	productImages,
	products,
	settings,
	sizeGuides,
} from '@/db/schema'
import { computeCartDiscounts } from '@/lib/discounts'
import { slugify } from '@/lib/slug'
import { deleteR2ObjectByUrl } from '@/server/storage/r2'
import { adminOnly } from './middleware'

type SaveItemInput = {
	type: string
	mode: 'add' | 'edit'
	data: any
}

type DeleteItemInput = {
	type: string
	id: string
}

type ApplyDiscountsInput = {
	items: Array<{ productId: string; quantity: number }>
	userKey?: string
	commitUsage?: boolean
}

function parseStringArray(input: unknown): string[] {
	if (Array.isArray(input)) {
		return input.filter((value): value is string => typeof value === 'string').map((v) => v.trim())
	}

	if (typeof input === 'string') {
		const trimmed = input.trim()
		if (!trimmed) return []

		try {
			const parsed = JSON.parse(trimmed)
			if (!Array.isArray(parsed)) return []
			return parsed
				.filter((value): value is string => typeof value === 'string')
				.map((v) => v.trim())
		} catch {
			return trimmed
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean)
		}
	}

	return []
}

function normalizeTierRulesJson(input: unknown): string {
	if (typeof input === 'string') {
		const trimmed = input.trim()
		if (!trimmed) return '[]'

		try {
			return JSON.stringify(JSON.parse(trimmed))
		} catch {
			return '[]'
		}
	}

	if (Array.isArray(input)) {
		return JSON.stringify(input)
	}

	return '[]'
}

function isMissingProductImagesTableError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes('product_images') &&
		(message.includes('does not exist') || message.includes('no such table'))
	)
}

async function generateUniqueProductSlug(
	db: Awaited<ReturnType<typeof getDb>>,
	name: string,
	excludeId?: string,
) {
	const base = slugify(name)
	let candidate = base
	let counter = 2

	while (true) {
		const whereClause = excludeId
			? and(eq(products.slug, candidate), ne(products.id, excludeId))
			: eq(products.slug, candidate)

		const existing = await db.select({ id: products.id }).from(products).where(whereClause).limit(1)

		if (existing.length === 0) return candidate

		candidate = `${base}-${counter}`
		counter += 1
	}
}

export const deleteItemFn = createServerFn({ method: 'POST' })
	.middleware([adminOnly])
	.inputValidator((data: DeleteItemInput) => data)
	.handler(async ({ data }) => {
		const db = await getDb()

		try {
			switch (data.type) {
				case 'products': {
					const existing = await db
						.select({ imageUrl: products.imageUrl })
						.from(products)
						.where(eq(products.id, data.id))
						.limit(1)

					let additionalImgs: Array<{ imageUrl: string }> = []
					try {
						additionalImgs = await db
							.select({ imageUrl: productImages.imageUrl })
							.from(productImages)
							.where(eq(productImages.productId, data.id))
					} catch (error) {
						if (!isMissingProductImagesTableError(error)) {
							throw error
						}
					}

					for (const img of additionalImgs) {
						await deleteR2ObjectByUrl(img.imageUrl, 'product additional image deletion')
					}

					await deleteR2ObjectByUrl(existing[0]?.imageUrl, 'product deletion')
					try {
						await db.delete(productImages).where(eq(productImages.productId, data.id)).run()
					} catch (error) {
						if (!isMissingProductImagesTableError(error)) {
							throw error
						}
					}
					await db.delete(products).where(eq(products.id, data.id)).run()
					break
				}
				case 'collections': {
					const existing = await db
						.select({ imageUrl: collections.imageUrl })
						.from(collections)
						.where(eq(collections.id, data.id))
						.limit(1)

					await deleteR2ObjectByUrl(existing[0]?.imageUrl, 'collection deletion')
					await db.delete(collections).where(eq(collections.id, data.id)).run()
					break
				}
				case 'hero': {
					const existing = await db
						.select({ imageUrl: heroBanners.imageUrl })
						.from(heroBanners)
						.where(eq(heroBanners.id, data.id))
						.limit(1)

					await deleteR2ObjectByUrl(existing[0]?.imageUrl, 'hero banner deletion')
					await db.delete(heroBanners).where(eq(heroBanners.id, data.id)).run()
					break
				}
				case 'categories':
					await db.delete(categories).where(eq(categories.id, data.id)).run()
					break
				case 'discounts':
					await db.delete(discounts).where(eq(discounts.id, data.id)).run()
					break
				case 'size-guides':
					await db.delete(sizeGuides).where(eq(sizeGuides.id, data.id)).run()
					break
				default:
					throw new Error('Invalid type')
			}

			return { success: true }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to delete item' }
		}
	})

export const saveSettingsFn = createServerFn({ method: 'POST' })
	.middleware([adminOnly])
	.inputValidator((data: any) => data)
	.handler(async ({ data }) => {
		const db = await getDb()

		try {
			const existing = await db.select().from(settings).limit(1)

			if (existing.length > 0) {
				await db.update(settings).set(data).where(eq(settings.id, existing[0].id)).run()
			} else {
				await db.insert(settings).values(data).run()
			}

			return { success: true }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to save settings' }
		}
	})

export const fetchProductImagesForAdminFn = createServerFn({ method: 'GET' })
	.middleware([adminOnly])
	.handler(async (): Promise<Record<string, string[]>> => {
		const db = await getDb()
		let allImages: Array<typeof productImages.$inferSelect> = []

		try {
			allImages = await db.select().from(productImages).orderBy(asc(productImages.sortOrder))
		} catch (error) {
			if (isMissingProductImagesTableError(error)) {
				return {}
			}
			throw error
		}

		const map: Record<string, string[]> = {}
		for (const img of allImages) {
			if (!map[img.productId]) {
				map[img.productId] = []
			}
			map[img.productId].push(img.imageUrl)
		}
		return map
	})

export const saveItemFn = createServerFn({ method: 'POST' })
	.middleware([adminOnly])
	.inputValidator((data: SaveItemInput) => data)
	.handler(async ({ data }) => {
		const db = await getDb()

		try {
			switch (data.type) {
				case 'products': {
					const { additionalImages, ...productFields } = data.data
					const productData = {
						...productFields,
						currency: 'CAD',
						collectionId: productFields.collectionId || null,
						sizeGuideId: productFields.sizeGuideId || null,
						slug: await generateUniqueProductSlug(
							db,
							data.data?.name || 'product',
							data.mode === 'edit' ? data.data.id : undefined,
						),
					}

					if (data.mode === 'add') {
						await db.insert(products).values(productData).run()
					} else {
						await db.update(products).set(productData).where(eq(products.id, data.data.id)).run()
					}

					if (Array.isArray(additionalImages)) {
						const productId = productData.id || data.data.id

						try {
							const existingImgs = await db
								.select({ imageUrl: productImages.imageUrl })
								.from(productImages)
								.where(eq(productImages.productId, productId))

							const newUrlSet = new Set(additionalImages as string[])
							for (const img of existingImgs) {
								if (!newUrlSet.has(img.imageUrl)) {
									await deleteR2ObjectByUrl(img.imageUrl, 'product image removed')
								}
							}

							await db.delete(productImages).where(eq(productImages.productId, productId)).run()

							if (additionalImages.length > 0) {
								await db
									.insert(productImages)
									.values(
										(additionalImages as string[]).map((url, i) => ({
											id: crypto.randomUUID(),
											productId,
											imageUrl: url,
											sortOrder: i,
											createdAt: new Date().toISOString(),
										})),
									)
									.run()
							}
						} catch (error) {
							if (!isMissingProductImagesTableError(error)) {
								throw error
							}
						}
					}
					break
				}
				case 'collections':
					if (data.mode === 'add') {
						await db.insert(collections).values(data.data).run()
					} else {
						await db
							.update(collections)
							.set(data.data)
							.where(eq(collections.id, data.data.id))
							.run()
					}
					break
				case 'hero':
					if (data.mode === 'add') {
						await db.insert(heroBanners).values(data.data).run()
					} else {
						await db
							.update(heroBanners)
							.set(data.data)
							.where(eq(heroBanners.id, data.data.id))
							.run()
					}
					break
				case 'categories':
					if (data.mode === 'add') {
						await db.insert(categories).values(data.data).run()
					} else {
						await db.update(categories).set(data.data).where(eq(categories.id, data.data.id)).run()
					}
					break
				case 'discounts': {
					const startDate = data.data.startDate ? new Date(data.data.startDate) : new Date()
					const endDate = data.data.endDate ? new Date(data.data.endDate) : null
					const legacyProductId =
						typeof data.data.productId === 'string' ? data.data.productId.trim() : ''
					const applicableProductIds = parseStringArray(data.data.applicableProductIds)
					const payload = {
						id: data.data.id,
						name: data.data.name || 'Untitled Discount',
						description: data.data.description || '',
						discountType: data.data.discountType || 'flat',
						discountValue: Number(data.data.discountValue) || 0,
						originalPrice:
							data.data.originalPrice === undefined || data.data.originalPrice === ''
								? null
								: Number(data.data.originalPrice),
						startDate,
						endDate,
						minCartValue: Number(data.data.minCartValue) || 0,
						applicableProductIds:
							applicableProductIds.length > 0
								? applicableProductIds
								: legacyProductId
									? [legacyProductId]
									: [],
						applicableCategories: parseStringArray(data.data.applicableCategories),
						stackable: Boolean(data.data.stackable),
						maxUses:
							data.data.maxUses === undefined || data.data.maxUses === ''
								? null
								: Number(data.data.maxUses),
						priority: Number(data.data.priority) || 0,
						isActive: data.data.isActive !== false,
						productId: null,
						bundleProductIds: parseStringArray(data.data.bundleProductIds),
						tierRulesJson: normalizeTierRulesJson(data.data.tierRulesJson),
						wording: data.data.wording || 'Instant Price Drop',
						updatedAt: new Date().toISOString(),
						createdAt: data.mode === 'add' ? new Date().toISOString() : data.data.createdAt,
					}

					if (data.mode === 'add') {
						await db.insert(discounts).values(payload).run()
					} else {
						await db.update(discounts).set(payload).where(eq(discounts.id, data.data.id)).run()
					}
					break
				}
				case 'size-guides': {
					const payload = {
						...data.data,
						unit: data.data.unit || 'in',
						note: data.data.note || '',
						productType: data.data.productType || '',
						columnsJson: data.data.columnsJson || '[]',
						rowsJson: data.data.rowsJson || '[]',
					}

					if (data.mode === 'add') {
						await db.insert(sizeGuides).values(payload).run()
					} else {
						await db.update(sizeGuides).set(payload).where(eq(sizeGuides.id, data.data.id)).run()
					}
					break
				}
				default:
					throw new Error('Invalid type')
			}

			return { success: true }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to save item' }
		}
	})

export const applyAdminDiscountsToCartFn = createServerFn({ method: 'POST' })
	.middleware([adminOnly])
	.inputValidator((data: ApplyDiscountsInput) => data)
	.handler(async ({ data }) => {
		try {
			if (!data?.items || !Array.isArray(data.items)) {
				return { error: 'Invalid cart payload' }
			}

			const summary = await computeCartDiscounts(data.items, data.userKey)

			if (data.commitUsage && data.userKey && summary.appliedDiscountIds.length > 0) {
				const db = await getDb()
				const now = new Date().toISOString()

				await Promise.all(
					summary.appliedDiscountIds.map((discountId) =>
						db
							.insert(discountUsages)
							.values({
								discountId,
								userKey: data.userKey as string,
								useCount: 1,
								lastUsedAt: now,
							})
							.onConflictDoUpdate({
								target: [discountUsages.discountId, discountUsages.userKey],
								set: {
									useCount: sql`${discountUsages.useCount} + 1`,
									lastUsedAt: now,
								},
							})
							.run(),
					),
				)

				await db
					.update(discounts)
					.set({
						usageCount: sql`${discounts.usageCount} + 1`,
						updatedAt: now,
					})
					.where(inArray(discounts.id, summary.appliedDiscountIds))
					.run()
			}

			return { success: true, summary }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to apply discounts' }
		}
	})
