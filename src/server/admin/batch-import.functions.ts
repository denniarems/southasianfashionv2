import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { OpenRouter } from '@openrouter/sdk'
import { getDb } from '@/db'
import { categories, collections, models, productImages, products } from '@/db/schema'
import { slugify } from '@/lib/slug'
import { generateModelPhotoshootImageInternal, type PhotoshootShotType } from './models.functions'
import { adminOnly } from './middleware'

export interface BatchProductRow {
	index: number
	name: string
	price: number
	category: string
	collection?: string
	isNew: boolean
	isFeatured: boolean
	descriptionRaw: string
	referenceImageUrls: string[]
}

export interface BatchImportResult {
	created: number
	skipped: number
	errors: string[]
	generatedImages: number
	descriptions: number
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
	.middleware([adminOnly])
	.inputValidator((data: ProductDescriptionInput) => data)
	.handler(async ({ data }) => {
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
	.middleware([adminOnly])
	.inputValidator((data: BatchImportInput) => data)
	.handler(async ({ data }): Promise<BatchImportResult> => {
		if (!data?.modelId || !Array.isArray(data.rows) || data.rows.length === 0) {
			return {
				created: 0,
				skipped: 0,
				errors: ['No rows provided or modelId missing'],
				generatedImages: 0,
				descriptions: 0,
			}
		}

		const db = await getDb()
		const result: BatchImportResult = {
			created: 0,
			skipped: 0,
			errors: [],
			generatedImages: 0,
			descriptions: 0,
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

				let description = row.descriptionRaw
				if (row.descriptionRaw.trim()) {
					try {
						description = await generateProductDescriptionInternal({
							name: row.name,
							category: row.category,
							price: row.price,
							rawNotes: row.descriptionRaw,
						})
						result.descriptions++
					} catch {
						description = row.descriptionRaw
					}
				}

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

				if (row.referenceImageUrls.length > 0) {
					const productContext = [row.name, description].filter(Boolean).join('. ')
					const shotTypes: PhotoshootShotType[] = ['front', 'side', 'walking', 'close-up']

					const generationTasks = row.referenceImageUrls.flatMap((clothingImageUrl) =>
						shotTypes.map((shotType) =>
							generateModelPhotoshootImageInternal({
								model: {
									name: model.name,
									description: [
										model.description,
										productContext ? `Wearing: ${productContext}` : '',
									]
										.filter(Boolean)
										.join('. '),
									ageRange: model.ageRange || '',
									gender: model.gender || '',
									ethnicity: model.ethnicity || '',
									promptUsed: model.promptUsed || '',
								},
								clothingImageUrl,
								shotType,
							}),
						),
					)

					const imageResults = await Promise.all(generationTasks)
					const generatedUrls = imageResults
						.filter((item) => item.imageUrl)
						.map((item) => item.imageUrl as string)

					result.generatedImages += generatedUrls.length

					if (generatedUrls.length > 0) {
						await db
							.update(products)
							.set({ imageUrl: generatedUrls[0] })
							.where(eq(products.id, productId))
							.run()

						if (generatedUrls.length > 1) {
							await db
								.insert(productImages)
								.values(
									generatedUrls.slice(1).map((url, index) => ({
										id: crypto.randomUUID(),
										productId,
										imageUrl: url,
										sortOrder: index,
										createdAt: new Date().toISOString(),
									})),
								)
								.run()
						}
					}
				}

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
