'use server'

import { getDb } from '@/db'
import {
	products,
	collections,
	heroBanners,
	categories,
	settings,
	productImages,
	sizeGuides,
} from '@/db/schema'
import { and, asc, eq, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/slug'
import { deleteVercelBlobByUrl } from '@/lib/vercel-blob'
import crypto from 'crypto'

function isMissingProductImagesTableError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes('relation "product_images" does not exist') ||
		message.includes('relation "product_images"')
	)
}

async function generateUniqueProductSlug(
	db: ReturnType<typeof getDb>,
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

export async function deleteItem(type: string, id: string) {
	const db = getDb()

	try {
		switch (type) {
			case 'products': {
				const existing = await db
					.select({ imageUrl: products.imageUrl })
					.from(products)
					.where(eq(products.id, id))
					.limit(1)

				let additionalImgs: Array<{ imageUrl: string }> = []
				try {
					additionalImgs = await db
						.select({ imageUrl: productImages.imageUrl })
						.from(productImages)
						.where(eq(productImages.productId, id))
				} catch (error) {
					if (!isMissingProductImagesTableError(error)) {
						throw error
					}
				}

				for (const img of additionalImgs) {
					await deleteVercelBlobByUrl(img.imageUrl, 'product additional image deletion')
				}

				await deleteVercelBlobByUrl(existing[0]?.imageUrl, 'product deletion')
				try {
					await db.delete(productImages).where(eq(productImages.productId, id))
				} catch (error) {
					if (!isMissingProductImagesTableError(error)) {
						throw error
					}
				}
				await db.delete(products).where(eq(products.id, id))
				break
			}
			case 'collections': {
				const existing = await db
					.select({ imageUrl: collections.imageUrl })
					.from(collections)
					.where(eq(collections.id, id))
					.limit(1)

				await deleteVercelBlobByUrl(existing[0]?.imageUrl, 'collection deletion')
				await db.delete(collections).where(eq(collections.id, id))
				break
			}
			case 'hero': {
				const existing = await db
					.select({ imageUrl: heroBanners.imageUrl })
					.from(heroBanners)
					.where(eq(heroBanners.id, id))
					.limit(1)

				await deleteVercelBlobByUrl(existing[0]?.imageUrl, 'hero banner deletion')
				await db.delete(heroBanners).where(eq(heroBanners.id, id))
				break
			}
			case 'categories':
				await db.delete(categories).where(eq(categories.id, id))
				break
				case 'size-guides':
					await db.delete(sizeGuides).where(eq(sizeGuides.id, id))
					break
			default:
				throw new Error('Invalid type')
		}
		revalidatePath('/admin/dashboard')
		return { success: true }
	} catch (error: any) {
		return { error: error.message }
	}
}

export async function saveSettings(data: any) {
	const db = getDb()
	try {
		// Upsert logic for settings (since there is only one row)
		const existing = await db.select().from(settings).limit(1)
		if (existing.length > 0) {
			await db.update(settings).set(data).where(eq(settings.id, existing[0].id))
		} else {
			await db.insert(settings).values(data)
		}
		revalidatePath('/admin/dashboard')
		return { success: true }
	} catch (error: any) {
		return { error: error.message }
	}
}

export async function fetchProductImagesForAdmin(): Promise<Record<string, string[]>> {
	const db = getDb()
	let allImages: Awaited<ReturnType<typeof db.select>> = []

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
}

export async function saveItem(type: string, mode: 'add' | 'edit', data: any) {
	const db = getDb()

	try {
		switch (type) {
			case 'products': {
				const { additionalImages, ...productFields } = data
				const productData = {
					...productFields,
						collectionId: productFields.collectionId || null,
						sizeGuideId: productFields.sizeGuideId || null,
					slug: await generateUniqueProductSlug(
						db,
						data?.name || 'product',
						mode === 'edit' ? data.id : undefined,
					),
				}

				if (mode === 'add') {
					await db.insert(products).values(productData)
				} else {
					await db.update(products).set(productData).where(eq(products.id, data.id))
				}

				if (Array.isArray(additionalImages)) {
					const productId = productData.id || data.id

					try {
						const existingImgs = await db
							.select({ imageUrl: productImages.imageUrl })
							.from(productImages)
							.where(eq(productImages.productId, productId))

						const newUrlSet = new Set(additionalImages as string[])
						for (const img of existingImgs) {
							if (!newUrlSet.has(img.imageUrl)) {
								await deleteVercelBlobByUrl(img.imageUrl, 'product image removed')
							}
						}

						await db.delete(productImages).where(eq(productImages.productId, productId))

						if (additionalImages.length > 0) {
							await db.insert(productImages).values(
								(additionalImages as string[]).map((url, i) => ({
									id: crypto.randomUUID(),
									productId,
									imageUrl: url,
									sortOrder: i,
									createdAt: new Date().toISOString(),
								})),
							)
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
				if (mode === 'add') {
					await db.insert(collections).values(data)
				} else {
					await db.update(collections).set(data).where(eq(collections.id, data.id))
				}
				break
			case 'hero':
				if (mode === 'add') {
					await db.insert(heroBanners).values(data)
				} else {
					await db.update(heroBanners).set(data).where(eq(heroBanners.id, data.id))
				}
				break
			case 'categories':
				if (mode === 'add') {
					await db.insert(categories).values(data)
				} else {
					await db.update(categories).set(data).where(eq(categories.id, data.id))
				}
				break
				case 'size-guides': {
					const payload = {
						...data,
						unit: data.unit || 'in',
						note: data.note || '',
						productType: data.productType || '',
						columnsJson: data.columnsJson || '[]',
						rowsJson: data.rowsJson || '[]',
					}

					if (mode === 'add') {
						await db.insert(sizeGuides).values(payload)
					} else {
						await db.update(sizeGuides).set(payload).where(eq(sizeGuides.id, data.id))
					}
					break
				}
			default:
				throw new Error('Invalid type')
		}
		revalidatePath('/admin/dashboard')
		return { success: true }
	} catch (error: any) {
		return { error: error.message }
	}
}
