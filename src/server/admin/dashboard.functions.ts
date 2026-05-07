import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import {
	categories,
	collections,
	analyticsEvents,
	discounts,
	discountUsages,
	heroBanners,
	occasions,
	productImages,
	products,
	settings,
	sizeGuides,
} from '@/db/schema'
import { computeCartDiscounts } from '@/lib/discounts'
import { slugify } from '@/lib/slug'
import { deleteR2ObjectByUrl } from '@/server/storage/r2'
import {
	asRecord,
	booleanValue,
	dateValue,
	enumValue,
	isoStringValue,
	jsonArrayString,
	numberValue,
	optionalNumber,
	optionalString,
	requiredString,
	stringArrayValue,
	stringWithDefault,
	type UnknownRecord,
} from './input-validators'
import { requireAdmin } from './auth.server'

const SAVE_ITEM_TYPES = [
	'products',
	'collections',
	'categories',
	'occasions',
	'hero',
	'size-guides',
	'discounts',
] as const
const DELETE_ITEM_TYPES = SAVE_ITEM_TYPES
const DISCOUNT_TYPES = ['flat', 'percentage', 'tiered', 'bundle'] as const

type SaveItemInput = {
	type: (typeof SAVE_ITEM_TYPES)[number]
	mode: 'add' | 'edit'
	data: UnknownRecord
}

type DeleteItemInput = {
	type: (typeof DELETE_ITEM_TYPES)[number]
	id: string
}

type ApplyDiscountsInput = {
	items: Array<{ productId: string; quantity: number }>
	userKey?: string
	commitUsage?: boolean
}

function parseSaveItemInput(value: unknown): SaveItemInput {
	const input = asRecord(value, 'Save item request')

	return {
		type: enumValue(input.type, SAVE_ITEM_TYPES, 'Item type'),
		mode: enumValue(input.mode, ['add', 'edit'] as const, 'Save mode'),
		data: asRecord(input.data, 'Item data'),
	}
}

function parseDeleteItemInput(value: unknown): DeleteItemInput {
	const input = asRecord(value, 'Delete item request')

	return {
		type: enumValue(input.type, DELETE_ITEM_TYPES, 'Item type'),
		id: requiredString(input.id, 'Item ID'),
	}
}

function parseSettingsInput(value: unknown) {
	const input = asRecord(value, 'Settings')

	return {
		whatsappNumber: stringWithDefault(input.whatsappNumber),
		whatsappMessage: stringWithDefault(input.whatsappMessage),
		brandName: stringWithDefault(input.brandName, 'SouthAsianFashion'),
		brandTagline: stringWithDefault(input.brandTagline),
		contactEmail: stringWithDefault(input.contactEmail),
		instagramUrl: stringWithDefault(input.instagramUrl),
		facebookUrl: stringWithDefault(input.facebookUrl),
	}
}

function parseApplyDiscountsInput(value: unknown): ApplyDiscountsInput {
	const input = asRecord(value, 'Discount application request')
	const items = Array.isArray(input.items)
		? input.items.map((item) => {
				const row = asRecord(item, 'Cart item')
				return {
					productId: requiredString(row.productId, 'Product ID'),
					quantity: numberValue(row.quantity, 'Quantity', { min: 1 }),
				}
			})
		: []

	if (items.length === 0) {
		throw new Error('At least one cart item is required')
	}

	return {
		items,
		userKey: optionalString(input.userKey),
		commitUsage: booleanValue(input.commitUsage),
	}
}

function idForMode(input: UnknownRecord, mode: SaveItemInput['mode'], label: string) {
	const id = optionalString(input.id)
	if (mode === 'edit' && !id) {
		throw new Error(`${label} ID is required`)
	}
	return id || crypto.randomUUID()
}

function requirePositivePrice(value: unknown) {
	return numberValue(value, 'Price', { min: 0.01 })
}

function normalizeProductPayload(input: UnknownRecord, mode: SaveItemInput['mode'], slug: string) {
	const availabilityStatus = optionalString(input.availabilityStatus) || 'made-to-order'

	return {
		id: idForMode(input, mode, 'Product'),
		name: requiredString(input.name, 'Product name'),
		description: stringWithDefault(input.description),
		price: requirePositivePrice(input.price),
		currency: 'CAD',
		category: optionalString(input.category) || null,
		occasion: optionalString(input.occasion) || null,
		fabric: optionalString(input.fabric) || null,
		color: optionalString(input.color) || null,
		availabilityStatus,
		isReadyToShip:
			booleanValue(input.isReadyToShip) || availabilityStatus.toLowerCase() === 'ready-to-ship',
		displayOrder: numberValue(input.displayOrder, 'Display order', { fallback: 0 }),
		imageUrl: stringWithDefault(input.imageUrl),
		collectionId: optionalString(input.collectionId) || null,
		sizeGuideId: optionalString(input.sizeGuideId) || null,
		createdAt: mode === 'add' ? new Date().toISOString() : isoStringValue(input.createdAt),
		updatedAt: new Date().toISOString(),
		slug,
		isNew: booleanValue(input.isNew, true),
		isFeatured: booleanValue(input.isFeatured),
	}
}

function normalizeCollectionPayload(input: UnknownRecord, mode: SaveItemInput['mode']) {
	return {
		id: idForMode(input, mode, 'Collection'),
		name: requiredString(input.name, 'Collection name'),
		description: stringWithDefault(input.description),
		imageUrl: stringWithDefault(input.imageUrl),
		slug: optionalString(input.slug) || slugify(requiredString(input.name, 'Collection name')),
		displayOrder: numberValue(input.displayOrder, 'Display order', { fallback: 0 }),
		seoTitle: stringWithDefault(input.seoTitle),
		seoDescription: stringWithDefault(input.seoDescription),
		createdAt: mode === 'add' ? new Date().toISOString() : isoStringValue(input.createdAt),
		updatedAt: new Date().toISOString(),
	}
}

async function recordAdminMerchandisingEvent(
	db: Awaited<ReturnType<typeof getDb>>,
	data: {
		route: string
		productId?: string | null
		productSlug?: string | null
		collectionId?: string | null
		collectionSlug?: string | null
		category?: string | null
	},
) {
	try {
		const now = new Date()
		now.setUTCMinutes(0, 0, 0)
		await db
			.insert(analyticsEvents)
			.values({
				id: crypto.randomUUID(),
				eventName: 'admin_merchandising_action',
				route: data.route,
				productId: data.productId || null,
				productSlug: data.productSlug || null,
				collectionId: data.collectionId || null,
				collectionSlug: data.collectionSlug || null,
				category: data.category || null,
				filterKeys: '',
				deviceClass: 'admin',
				timestampBucket: now.toISOString(),
				value: 1,
				createdAt: new Date().toISOString(),
			})
			.run()
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (!message.includes('analytics_events')) {
			console.warn({
				level: 'warn',
				source: 'analytics',
				message: 'admin_analytics_write_failed',
				route: data.route,
				error: message,
			})
		}
	}
}

function normalizeCategoryPayload(input: UnknownRecord, mode: SaveItemInput['mode']) {
	return {
		id: idForMode(input, mode, 'Category'),
		name: requiredString(input.name, 'Category name'),
		slug: optionalString(input.slug) || slugify(requiredString(input.name, 'Category name')),
		description: stringWithDefault(input.description),
		createdAt: mode === 'add' ? new Date().toISOString() : isoStringValue(input.createdAt),
	}
}

function normalizeOccasionPayload(input: UnknownRecord, mode: SaveItemInput['mode']) {
	const name = requiredString(input.name, 'Occasion name')

	return {
		id: idForMode(input, mode, 'Occasion'),
		name,
		slug: optionalString(input.slug) || slugify(name),
		description: stringWithDefault(input.description),
		imageUrl: stringWithDefault(input.imageUrl),
		displayOrder: numberValue(input.displayOrder, 'Display order', { fallback: 0 }),
		createdAt: mode === 'add' ? new Date().toISOString() : isoStringValue(input.createdAt),
		updatedAt: new Date().toISOString(),
	}
}

function normalizeHeroPayload(input: UnknownRecord, mode: SaveItemInput['mode']) {
	return {
		id: idForMode(input, mode, 'Hero banner'),
		title: requiredString(input.title, 'Hero title'),
		subtitle: stringWithDefault(input.subtitle),
		imageUrl: stringWithDefault(input.imageUrl),
		ctaText: stringWithDefault(input.ctaText, 'Explore Collection'),
		ctaLink: stringWithDefault(input.ctaLink, '#new-arrivals'),
		isActive: booleanValue(input.isActive, true),
		createdAt: mode === 'add' ? new Date().toISOString() : isoStringValue(input.createdAt),
	}
}

function normalizeSizeGuidePayload(input: UnknownRecord, mode: SaveItemInput['mode']) {
	return {
		id: idForMode(input, mode, 'Size guide'),
		name: requiredString(input.name, 'Size guide name'),
		productType: stringWithDefault(input.productType),
		unit: enumValue(input.unit || 'in', ['in', 'cm'] as const, 'Measurement unit'),
		note: stringWithDefault(input.note),
		columnsJson: jsonArrayString(input.columnsJson, 'Columns JSON'),
		rowsJson: jsonArrayString(input.rowsJson, 'Rows JSON'),
		isActive: booleanValue(input.isActive, true),
		createdAt: mode === 'add' ? new Date().toISOString() : isoStringValue(input.createdAt),
	}
}

function normalizeTierRulesJson(input: unknown): string {
	const normalized = jsonArrayString(input, 'Tier rules JSON')
	const parsed = JSON.parse(normalized) as unknown[]

	for (const rule of parsed) {
		const row = asRecord(rule, 'Tier rule')
		numberValue(row.minCartValue, 'Tier minimum cart value', { min: 0.01 })
		numberValue(row.discountValue, 'Tier discount value', { min: 0.01 })
		if (row.discountType !== undefined) {
			enumValue(row.discountType, ['flat', 'percentage'] as const, 'Tier discount type')
		}
	}

	return normalized
}

function normalizeDiscountPayload(input: UnknownRecord, mode: SaveItemInput['mode']) {
	const discountType = enumValue(input.discountType || 'flat', DISCOUNT_TYPES, 'Discount type')
	const startDate = dateValue(input.startDate, 'Start date', new Date())
	const endDate = input.endDate ? dateValue(input.endDate, 'End date') : null
	if (endDate && endDate <= startDate) {
		throw new Error('End date must be after start date')
	}

	const legacyProductId = optionalString(input.productId)
	const applicableProductIds = stringArrayValue(input.applicableProductIds)
	const maxUses = optionalNumber(input.maxUses, 'Max uses', 1)

	return {
		id: idForMode(input, mode, 'Discount'),
		name: requiredString(input.name, 'Discount name'),
		description: stringWithDefault(input.description),
		discountType,
		discountValue: numberValue(input.discountValue, 'Discount value', { min: 0.01 }),
		originalPrice: optionalNumber(input.originalPrice, 'Original price', 0.01),
		startDate,
		endDate,
		minCartValue: numberValue(input.minCartValue, 'Minimum cart value', { min: 0, fallback: 0 }),
		applicableProductIds:
			applicableProductIds.length > 0
				? applicableProductIds
				: legacyProductId
					? [legacyProductId]
					: [],
		applicableCategories: stringArrayValue(input.applicableCategories),
		stackable: booleanValue(input.stackable),
		maxUses,
		priority: numberValue(input.priority, 'Priority', { fallback: 0 }),
		isActive: booleanValue(input.isActive, true),
		productId: null,
		bundleProductIds: stringArrayValue(input.bundleProductIds),
		tierRulesJson: discountType === 'tiered' ? normalizeTierRulesJson(input.tierRulesJson) : '[]',
		wording: stringWithDefault(input.wording, 'Instant Price Drop'),
		updatedAt: new Date().toISOString(),
		createdAt: mode === 'add' ? new Date().toISOString() : isoStringValue(input.createdAt),
	}
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
	.inputValidator(parseDeleteItemInput)
	.handler(async ({ data }) => {
		await requireAdmin()
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
				case 'occasions': {
					const existing = await db
						.select({ imageUrl: occasions.imageUrl })
						.from(occasions)
						.where(eq(occasions.id, data.id))
						.limit(1)

					await deleteR2ObjectByUrl(existing[0]?.imageUrl, 'occasion deletion')
					await db.delete(occasions).where(eq(occasions.id, data.id)).run()
					break
				}
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
	.inputValidator(parseSettingsInput)
	.handler(async ({ data }) => {
		await requireAdmin()
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

export const fetchProductImagesForAdminFn = createServerFn({ method: 'GET' }).handler(
	async (): Promise<Record<string, string[]>> => {
		await requireAdmin()
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
	},
)

export const saveItemFn = createServerFn({ method: 'POST' })
	.inputValidator(parseSaveItemInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		const db = await getDb()

		try {
			let merchandisingEvent: Parameters<typeof recordAdminMerchandisingEvent>[1] | undefined

			switch (data.type) {
				case 'products': {
					const productId = idForMode(data.data, data.mode, 'Product')
					const productName = requiredString(data.data.name, 'Product name')
					const productData = normalizeProductPayload(
						{ ...data.data, id: productId },
						data.mode,
						await generateUniqueProductSlug(
							db,
							productName,
							data.mode === 'edit' ? productId : undefined,
						),
					)
					const additionalImages = stringArrayValue(data.data.additionalImages)

					if (data.mode === 'add') {
						await db.insert(products).values(productData).run()
					} else {
						await db.update(products).set(productData).where(eq(products.id, productId)).run()
					}
					merchandisingEvent = {
						route: `/admin/products/${data.mode}`,
						productId,
						productSlug: productData.slug,
						category: productData.category,
					}

					try {
						const existingImgs = await db
							.select({ imageUrl: productImages.imageUrl })
							.from(productImages)
							.where(eq(productImages.productId, productId))

						const newUrlSet = new Set(additionalImages)
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
									additionalImages.map((url, i) => ({
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
					break
				}
				case 'collections': {
					const payload = normalizeCollectionPayload(data.data, data.mode)
					if (data.mode === 'add') {
						await db.insert(collections).values(payload).run()
					} else {
						await db.update(collections).set(payload).where(eq(collections.id, payload.id)).run()
					}
					merchandisingEvent = {
						route: `/admin/collections/${data.mode}`,
						collectionId: payload.id,
						collectionSlug: payload.slug,
					}
					break
				}
				case 'hero': {
					const payload = normalizeHeroPayload(data.data, data.mode)
					if (data.mode === 'add') {
						await db.insert(heroBanners).values(payload).run()
					} else {
						await db.update(heroBanners).set(payload).where(eq(heroBanners.id, payload.id)).run()
					}
					merchandisingEvent = {
						route: `/admin/hero/${data.mode}`,
					}
					break
				}
				case 'categories': {
					const payload = normalizeCategoryPayload(data.data, data.mode)
					if (data.mode === 'add') {
						await db.insert(categories).values(payload).run()
					} else {
						await db.update(categories).set(payload).where(eq(categories.id, payload.id)).run()
					}
					break
				}
				case 'occasions': {
					const payload = normalizeOccasionPayload(data.data, data.mode)
					if (data.mode === 'add') {
						await db.insert(occasions).values(payload).run()
					} else {
						await db.update(occasions).set(payload).where(eq(occasions.id, payload.id)).run()
					}
					merchandisingEvent = {
						route: `/admin/occasions/${data.mode}`,
					}
					break
				}
				case 'discounts': {
					const payload = normalizeDiscountPayload(data.data, data.mode)
					if (data.mode === 'add') {
						await db.insert(discounts).values(payload).run()
					} else {
						await db.update(discounts).set(payload).where(eq(discounts.id, payload.id)).run()
					}
					merchandisingEvent = {
						route: `/admin/discounts/${data.mode}`,
					}
					break
				}
				case 'size-guides': {
					const payload = normalizeSizeGuidePayload(data.data, data.mode)
					if (data.mode === 'add') {
						await db.insert(sizeGuides).values(payload).run()
					} else {
						await db.update(sizeGuides).set(payload).where(eq(sizeGuides.id, payload.id)).run()
					}
					break
				}
				default:
					throw new Error('Invalid type')
			}

			if (merchandisingEvent) {
				await recordAdminMerchandisingEvent(db, merchandisingEvent)
			}

			return { success: true }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to save item' }
		}
	})

export const applyAdminDiscountsToCartFn = createServerFn({ method: 'POST' })
	.inputValidator(parseApplyDiscountsInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
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
