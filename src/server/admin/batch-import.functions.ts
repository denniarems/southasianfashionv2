import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { OpenRouter } from '@openrouter/sdk'
import { getDb } from '@/db'
import { categories, collections, models, productImages, products } from '@/db/schema'
import { slugify } from '@/lib/slug'
import {
	generateModelPhotoshootImageInternal,
	type PhotoshootModelDetails,
	type PhotoshootShotType,
} from './models.functions'
import {
	asRecord,
	booleanValue,
	numberValue,
	requiredString,
	stringWithDefault,
} from './input-validators'
import { requireAdmin } from './auth.server'

export interface BatchProductRow {
	index: number
	name: string
	price: number
	category: string
	collection?: string
	isNew: boolean
	isFeatured: boolean
	descriptionRaw: string
	descriptionGenerated?: boolean
	referenceImageUrls: string[]
}

export interface BatchCreatedProduct {
	rowIndex: number
	productId: string
	name: string
	description: string
	referenceImageUrls: string[]
}

export interface BatchImportResult {
	created: number
	skipped: number
	errors: string[]
	generatedImages: number
	descriptions: number
	products: BatchCreatedProduct[]
}

type ProductDescriptionInput = {
	name: string
	category: string
	price: number
	rawNotes: string
}

type BatchImportInput = {
	rows: BatchProductRow[]
	modelId: string
}

type BatchProductImagesInput = {
	rowIndex: number
	productId: string
	modelId: string
	name: string
	description: string
	referenceImageUrls: string[]
}

export interface BatchProductImagesResult {
	rowIndex: number
	productId: string
	generatedImages: number
	errors: string[]
}

const BATCH_SHOT_TYPES: PhotoshootShotType[] = ['front', 'side', 'walking', 'close-up']
const IMAGE_GENERATION_CONCURRENCY = 2
const MAX_BATCH_ROWS = 100
const MAX_REFERENCE_IMAGES_PER_PRODUCT = 4

function parseProductDescriptionInput(value: unknown): ProductDescriptionInput {
	const input = asRecord(value, 'Product description request')

	return {
		name: requiredString(input.name, 'Product name'),
		category: requiredString(input.category, 'Category'),
		price: numberValue(input.price, 'Price', { min: 0 }),
		rawNotes: requiredString(input.rawNotes, 'Raw notes'),
	}
}

function parseReferenceImageUrls(value: unknown) {
	if (!Array.isArray(value)) return []

	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean)
}

function parseBatchProductRow(value: unknown): BatchProductRow {
	const input = asRecord(value, 'Batch product row')

	return {
		index: numberValue(input.index, 'Row index', { min: 1 }),
		name: requiredString(input.name, 'Product name'),
		price: numberValue(input.price, 'Price', { min: 0.01 }),
		category: requiredString(input.category, 'Category'),
		collection: stringWithDefault(input.collection),
		isNew: booleanValue(input.isNew, true),
		isFeatured: booleanValue(input.isFeatured),
		descriptionRaw: requiredString(input.descriptionRaw, 'Product description'),
		descriptionGenerated: booleanValue(input.descriptionGenerated),
		referenceImageUrls: parseReferenceImageUrls(input.referenceImageUrls),
	}
}

function parseBatchImportInput(value: unknown): BatchImportInput {
	const input = asRecord(value, 'Batch import')
	const rows = Array.isArray(input.rows) ? input.rows.map(parseBatchProductRow) : []

	if (rows.length === 0) {
		throw new Error('At least one batch row is required')
	}

	if (rows.length > MAX_BATCH_ROWS) {
		throw new Error(`Batch imports are limited to ${MAX_BATCH_ROWS} rows at a time`)
	}

	return {
		rows,
		modelId: requiredString(input.modelId, 'Model ID'),
	}
}

function parseBatchProductImagesInput(value: unknown): BatchProductImagesInput {
	const input = asRecord(value, 'Batch product image request')
	const referenceImageUrls = parseReferenceImageUrls(input.referenceImageUrls)

	if (referenceImageUrls.length === 0) {
		throw new Error('At least one reference image is required')
	}

	return {
		rowIndex: numberValue(input.rowIndex, 'Row index', { min: 1 }),
		productId: requiredString(input.productId, 'Product ID'),
		modelId: requiredString(input.modelId, 'Model ID'),
		name: requiredString(input.name, 'Product name'),
		description: stringWithDefault(input.description),
		referenceImageUrls,
	}
}

async function runWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<R>,
) {
	const results: R[] = []
	let nextIndex = 0

	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (nextIndex < items.length) {
				const index = nextIndex
				nextIndex += 1
				results[index] = await worker(items[index])
			}
		}),
	)

	return results
}

function getOpenRouter() {
	if (!process.env.OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not set')
	}

	return new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
}

async function generateUniqueProductSlug(db: Awaited<ReturnType<typeof getDb>>, name: string) {
	const base = slugify(name)
	let candidate = base
	let counter = 2

	while (true) {
		const existing = await db
			.select({ id: products.id })
			.from(products)
			.where(eq(products.slug, candidate))
			.limit(1)

		if (existing.length === 0) return candidate

		candidate = `${base}-${counter}`
		counter += 1
	}
}

async function generateProductDescriptionInternal(params: ProductDescriptionInput) {
	const prompt = `You are a luxury South Asian fashion copywriter for a premium e-commerce brand. Generate a polished, SEO-friendly product description (2-3 sentences, no bullet points) from the raw notes below.

Product Name: ${params.name}
Category: ${params.category}
Price: ${params.price} CAD
Raw Notes:
${params.rawNotes}

Rules:
- Write in an elegant, aspirational tone suitable for luxury fashion.
- Mention key details: fabric, color, embroidery/embellishment, silhouette, and occasion.
- Keep it concise (2-3 sentences max).
- Do NOT include the price in the description.
- Do NOT use markdown, bullet points, or headings.
- Return ONLY the description text, nothing else.`

	const result = await getOpenRouter().chat.send({
		chatGenerationParams: {
			model: 'google/gemini-2.5-flash',
			messages: [{ role: 'user', content: prompt }],
			stream: false,
		},
	})

	const content = result.choices[0]?.message?.content
	const text =
		typeof content === 'string'
			? content
			: Array.isArray(content)
				? content
						.map((item: any) => (typeof item?.text === 'string' ? item.text : ''))
						.join(' ')
						.trim()
				: ''

	if (!text) {
		throw new Error('Empty response from AI')
	}

	return text.trim()
}

async function ensureCategory(
	db: Awaited<ReturnType<typeof getDb>>,
	categoryName: string,
	cache: Map<string, string>,
): Promise<void> {
	const key = categoryName.toLowerCase().trim()
	if (cache.has(key)) return

	const existing = await db
		.select({ id: categories.id })
		.from(categories)
		.where(eq(categories.name, categoryName))
		.limit(1)

	if (existing.length > 0) {
		cache.set(key, existing[0].id)
		return
	}

	const id = crypto.randomUUID()
	await db
		.insert(categories)
		.values({
			id,
			name: categoryName,
			slug: slugify(categoryName),
			description: '',
			createdAt: new Date().toISOString(),
		})
		.run()
	cache.set(key, id)
}

async function findCollectionId(
	db: Awaited<ReturnType<typeof getDb>>,
	collectionName: string,
	cache: Map<string, string | null>,
): Promise<string | null> {
	const key = collectionName.toLowerCase().trim()
	if (!key) return null
	if (cache.has(key)) return cache.get(key) ?? null

	const existing = await db
		.select({ id: collections.id })
		.from(collections)
		.where(eq(collections.name, collectionName))
		.limit(1)

	const id = existing.length > 0 ? existing[0].id : null
	cache.set(key, id)
	return id
}

export const generateProductDescriptionFn = createServerFn({ method: 'POST' })
	.inputValidator(parseProductDescriptionInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
			return { description: await generateProductDescriptionInternal(data) }
		} catch (error) {
			return {
				description: data.rawNotes,
				error: error instanceof Error ? error.message : 'Failed to generate description',
			}
		}
	})

export const batchImportProductsFn = createServerFn({ method: 'POST' })
	.inputValidator(parseBatchImportInput)
	.handler(async ({ data }): Promise<BatchImportResult> => {
		await requireAdmin()
		if (!data?.modelId || !Array.isArray(data.rows) || data.rows.length === 0) {
			return {
				created: 0,
				skipped: 0,
				errors: ['No rows provided or modelId missing'],
				generatedImages: 0,
				descriptions: 0,
				products: [],
			}
		}

		const db = await getDb()
		const result: BatchImportResult = {
			created: 0,
			skipped: 0,
			errors: [],
			generatedImages: 0,
			descriptions: 0,
			products: [],
		}

		const [model] = await db.select().from(models).where(eq(models.id, data.modelId)).limit(1)

		if (!model) {
			result.errors.push('Selected model not found')
			return result
		}

		const categoryCache = new Map<string, string>()
		const collectionCache = new Map<string, string | null>()

		for (const row of data.rows) {
			try {
				if (!row.name?.trim()) {
					throw new Error('Missing product name')
				}

				if (!row.category?.trim()) {
					throw new Error('Missing category')
				}

				if (!Number.isFinite(row.price) || row.price <= 0) {
					throw new Error('Invalid price')
				}

				await ensureCategory(db, row.category, categoryCache)

				const collectionId = await findCollectionId(db, row.collection || '', collectionCache)

				const description = row.descriptionRaw.trim()
				if (row.descriptionGenerated) result.descriptions++

				const productId = crypto.randomUUID()
				const slug = await generateUniqueProductSlug(db, row.name.trim())

				await db
					.insert(products)
					.values({
						id: productId,
						name: row.name.trim(),
						slug,
						description,
						price: row.price,
						currency: 'CAD',
						category: row.category.trim(),
						imageUrl: '',
						isNew: row.isNew,
						isFeatured: row.isFeatured,
						collectionId,
						createdAt: new Date().toISOString(),
					})
					.run()

				result.products.push({
					rowIndex: row.index,
					productId,
					name: row.name.trim(),
					description,
					referenceImageUrls: row.referenceImageUrls,
				})
				result.created++
			} catch (error) {
				result.errors.push(
					`Row ${row.index}: ${error instanceof Error ? error.message : 'Unknown import error'}`,
				)
				result.skipped++
			}
		}

		return result
	})

export const generateBatchProductImagesFn = createServerFn({ method: 'POST' })
	.inputValidator(parseBatchProductImagesInput)
	.handler(async ({ data }): Promise<BatchProductImagesResult> => {
		await requireAdmin()
		const db = await getDb()
		const [[product], [model]] = await Promise.all([
			db.select().from(products).where(eq(products.id, data.productId)).limit(1),
			db.select().from(models).where(eq(models.id, data.modelId)).limit(1),
		])

		if (!product) {
			return {
				rowIndex: data.rowIndex,
				productId: data.productId,
				generatedImages: 0,
				errors: ['Product not found'],
			}
		}

		if (!model) {
			return {
				rowIndex: data.rowIndex,
				productId: data.productId,
				generatedImages: 0,
				errors: ['Selected model not found'],
			}
		}

		const productContext = [data.name, data.description].filter(Boolean).join('. ')
		const modelDetails: PhotoshootModelDetails = {
			name: model.name,
			description: [model.description, productContext ? `Wearing: ${productContext}` : '']
				.filter(Boolean)
				.join('. '),
			ageRange: model.ageRange || '',
			gender: model.gender || '',
			ethnicity: model.ethnicity || '',
			imageUrl: model.imageUrl || '',
			promptUsed: model.promptUsed || '',
		}
		const errors: string[] = []
		const referenceImageUrls = data.referenceImageUrls.slice(0, MAX_REFERENCE_IMAGES_PER_PRODUCT)
		if (data.referenceImageUrls.length > referenceImageUrls.length) {
			errors.push(
				`Only the first ${MAX_REFERENCE_IMAGES_PER_PRODUCT} reference images were used for photoshoot generation`,
			)
		}

		const tasks = referenceImageUrls.flatMap((clothingImageUrl) =>
			BATCH_SHOT_TYPES.map((shotType) => ({ clothingImageUrl, shotType })),
		)

		const imageResults = await runWithConcurrency(
			tasks,
			IMAGE_GENERATION_CONCURRENCY,
			async ({ clothingImageUrl, shotType }) => {
				try {
					return await generateModelPhotoshootImageInternal({
						model: modelDetails,
						clothingImageUrl,
						shotType,
					})
				} catch (error) {
					errors.push(
						`${shotType} image failed: ${
							error instanceof Error ? error.message : 'Unknown image generation error'
						}`,
					)
					return null
				}
			},
		)

		const generatedUrls = imageResults
			.filter((item): item is { imageUrl: string } => Boolean(item?.imageUrl))
			.map((item) => item.imageUrl)

		if (generatedUrls.length > 0) {
			const [primaryImageUrl, ...additionalImageUrls] = product.imageUrl
				? ['', ...generatedUrls]
				: generatedUrls

			if (primaryImageUrl) {
				await db
					.update(products)
					.set({ imageUrl: primaryImageUrl })
					.where(eq(products.id, data.productId))
					.run()
			}

			if (additionalImageUrls.length > 0) {
				const existingImages = await db
					.select({ id: productImages.id })
					.from(productImages)
					.where(eq(productImages.productId, data.productId))

				await db
					.insert(productImages)
					.values(
						additionalImageUrls.map((url, index) => ({
							id: crypto.randomUUID(),
							productId: data.productId,
							imageUrl: url,
							sortOrder: existingImages.length + index,
							createdAt: new Date().toISOString(),
						})),
					)
					.run()
			}
		}

		return {
			rowIndex: data.rowIndex,
			productId: data.productId,
			generatedImages: generatedUrls.length,
			errors,
		}
	})
