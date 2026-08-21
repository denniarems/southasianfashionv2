import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { categories, collections, models, occasions, productImages, products } from '@/db/schema'
import { slugify } from '@/lib/slug'
import { generateImageWithRetry, getOpenRouter } from './ai-image'
import {
	asRecord,
	numberValue,
	optionalString,
	requiredString,
	stringArrayValue,
	stringWithDefault,
} from './input-validators'
import { requireAdmin } from './auth.server'

const CATALOG_TEXT_MODEL = 'google/gemini-2.5-flash'
const SHOWCASE_IMAGE_MODEL = 'bytedance-seed/seedream-5-0-pro'
const SHOWCASE_IMAGE_SIZE = '1K'
const MAX_PRODUCTS_PER_RUN = 25
const MAX_CATEGORY_COUNT = 5
const IMAGE_GENERATION_CONCURRENCY = 2
const SHOT_COUNT = 3

export const SHOWCASE_SHOT_KEYS = ['studio', 'macro', 'lifestyle'] as const
export type ShowcaseShotKey = (typeof SHOWCASE_SHOT_KEYS)[number]

export interface ShowcaseCategoryInput {
	name: string
	spec: string
	count: number
	personaHint: string
	priceBand: string
}

export interface ShowcaseProduct {
	catalogId: string
	title: string
	category: string
	price: number
	fabric: string
	color: string
	description: string
	tags: string[]
	keywords: string[]
	imagePrompts: string[]
}

export interface ShowcaseImportedProduct {
	catalogId: string
	productId: string
	title: string
	category: string
	imagePrompts: string[]
}

export interface ShowcaseImportResult {
	created: number
	errors: string[]
	occasionSlug: string
	collectionId: string | null
	products: ShowcaseImportedProduct[]
}

export interface ShowcaseImagesResult {
	productId: string
	generatedImages: number
	imageUrls: string[]
	errors: string[]
}

type GenerateCatalogInput = {
	occasion: string
	collectionName: string
	trendBrief: string
	categories: ShowcaseCategoryInput[]
}

type ImportCatalogInput = {
	occasion: string
	collectionName: string
	products: ShowcaseProduct[]
}

type GenerateShowcaseImagesInput = {
	productId: string
	modelId?: string
	prompts: string[]
}

const SHOT_CONFIG: Record<
	ShowcaseShotKey,
	{ aspectRatio: string; usesIdentityReference: boolean }
> = {
	studio: { aspectRatio: '9:16', usesIdentityReference: true },
	macro: { aspectRatio: '1:1', usesIdentityReference: false },
	lifestyle: { aspectRatio: '9:16', usesIdentityReference: true },
}

function parseCategoryInput(value: unknown): ShowcaseCategoryInput {
	const input = asRecord(value, 'Showcase category')
	const count = numberValue(input.count, 'Category product count', { min: 1 })

	if (count > MAX_CATEGORY_COUNT) {
		throw new Error(`Category product count is limited to ${MAX_CATEGORY_COUNT}`)
	}

	return {
		name: requiredString(input.name, 'Category name'),
		spec: requiredString(input.spec, 'Category spec'),
		count,
		personaHint: stringWithDefault(input.personaHint),
		priceBand: stringWithDefault(input.priceBand),
	}
}

function parseGenerateCatalogInput(value: unknown): GenerateCatalogInput {
	const input = asRecord(value, 'Showcase catalog request')
	const categories = Array.isArray(input.categories) ? input.categories.map(parseCategoryInput) : []

	if (categories.length === 0) {
		throw new Error('At least one category is required')
	}

	const total = categories.reduce((sum, category) => sum + category.count, 0)
	if (total > MAX_PRODUCTS_PER_RUN) {
		throw new Error(`A showcase run is limited to ${MAX_PRODUCTS_PER_RUN} products`)
	}

	return {
		occasion: requiredString(input.occasion, 'Occasion'),
		collectionName: stringWithDefault(input.collectionName),
		trendBrief: stringWithDefault(input.trendBrief),
		categories,
	}
}

function parseShowcaseProduct(value: unknown, index: number): ShowcaseProduct {
	const input = asRecord(value, `Product ${index + 1}`)
	const title = requiredString(input.title, `Product ${index + 1} title`)
	const promptsSource = Array.isArray(input.imagePrompts) ? input.imagePrompts : input.image_prompts
	const imagePrompts = stringArrayValue(promptsSource)

	if (imagePrompts.length !== SHOT_COUNT) {
		throw new Error(`Product "${title}" must have exactly ${SHOT_COUNT} image prompts`)
	}

	return {
		catalogId:
			optionalString(input.catalogId) ?? `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`,
		title,
		category: requiredString(input.category, `Product "${title}" category`),
		price: numberValue(input.price, `Product "${title}" price`, { min: 0.01 }),
		fabric: stringWithDefault(input.fabric),
		color: stringWithDefault(input.color),
		description: requiredString(input.description, `Product "${title}" description`),
		tags: stringArrayValue(input.tags),
		keywords: stringArrayValue(input.keywords),
		imagePrompts,
	}
}

function parseImportCatalogInput(value: unknown): ImportCatalogInput {
	const input = asRecord(value, 'Showcase import')
	const rawProducts = Array.isArray(input.products) ? input.products : []

	if (rawProducts.length === 0) {
		throw new Error('At least one product is required')
	}

	if (rawProducts.length > MAX_PRODUCTS_PER_RUN) {
		throw new Error(`A showcase import is limited to ${MAX_PRODUCTS_PER_RUN} products`)
	}

	return {
		occasion: requiredString(input.occasion, 'Occasion'),
		collectionName: stringWithDefault(input.collectionName),
		products: rawProducts.map(parseShowcaseProduct),
	}
}

function parseGenerateShowcaseImagesInput(value: unknown): GenerateShowcaseImagesInput {
	const input = asRecord(value, 'Showcase image request')
	const prompts = stringArrayValue(input.prompts)

	if (prompts.length !== SHOT_COUNT) {
		throw new Error(`Exactly ${SHOT_COUNT} shot prompts are required`)
	}

	return {
		productId: requiredString(input.productId, 'Product ID'),
		modelId: optionalString(input.modelId),
		prompts,
	}
}

async function runWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<R>,
) {
	const results: R[] = []
	let nextIndex = 0

	const runNext = async (): Promise<void> => {
		const index = nextIndex
		nextIndex += 1
		if (index >= items.length) return

		results[index] = await worker(items[index])
		await runNext()
	}

	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runNext()))

	return results
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

async function generateUniqueCollectionSlug(db: Awaited<ReturnType<typeof getDb>>, name: string) {
	const base = slugify(name)
	let candidate = base
	let counter = 2

	while (true) {
		const existing = await db
			.select({ id: collections.id })
			.from(collections)
			.where(eq(collections.slug, candidate))
			.limit(1)

		if (existing.length === 0) return candidate

		candidate = `${base}-${counter}`
		counter += 1
	}
}

async function ensureCategory(
	db: Awaited<ReturnType<typeof getDb>>,
	categoryName: string,
	cache: Map<string, string>,
) {
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

	await db
		.insert(categories)
		.values({
			id: crypto.randomUUID(),
			name: categoryName,
			slug: slugify(categoryName),
			description: '',
			createdAt: new Date().toISOString(),
		})
		.run()
}

async function ensureOccasion(db: Awaited<ReturnType<typeof getDb>>, occasionName: string) {
	const slug = slugify(occasionName)
	const existing = await db
		.select({ id: occasions.id })
		.from(occasions)
		.where(eq(occasions.slug, slug))
		.limit(1)

	if (existing.length === 0) {
		await db
			.insert(occasions)
			.values({
				id: crypto.randomUUID(),
				name: occasionName,
				slug,
				description: '',
				imageUrl: '',
				displayOrder: 0,
				createdAt: new Date().toISOString(),
			})
			.run()
	}

	return slug
}

async function ensureCollectionId(
	db: Awaited<ReturnType<typeof getDb>>,
	collectionName: string,
): Promise<string | null> {
	const key = collectionName.trim()
	if (!key) return null

	const existing = await db
		.select({ id: collections.id })
		.from(collections)
		.where(eq(collections.name, key))
		.limit(1)

	if (existing.length > 0) return existing[0].id

	const id = crypto.randomUUID()
	const slug = await generateUniqueCollectionSlug(db, key)
	await db
		.insert(collections)
		.values({
			id,
			name: key,
			description: '',
			imageUrl: '',
			slug,
			displayOrder: 0,
			createdAt: new Date().toISOString(),
		})
		.run()

	return id
}

function extractJsonObject(raw: string) {
	const withoutFences = raw.replace(/```(?:json)?/gi, '')
	const start = withoutFences.indexOf('{')
	const end = withoutFences.lastIndexOf('}')

	if (start === -1 || end === -1 || end <= start) {
		throw new Error('AI response did not contain a JSON object')
	}

	return withoutFences.slice(start, end + 1)
}

function buildCatalogPrompt(input: GenerateCatalogInput) {
	const categoryLines = input.categories
		.map(
			(category, index) =>
				`${index + 1}. ${category.name} — garment types: ${category.spec}. Generate exactly ${
					category.count
				} products. Persona for on-model shots: ${category.personaHint}. Suggested retail price band: ${
					category.priceBand
				}.`,
		)
		.join('\n')

	return `You are a luxury South Asian fashion buyer, SEO copywriter, and AI image-prompt engineer for a Canada-based boutique launching an "${input.occasion}" showcase.

Research brief and trends to apply:
${input.trendBrief || 'No additional trend brief provided; rely on authentic, current Kerala festive wear trends.'}

Generate a product catalog covering these categories:
${categoryLines}

For EVERY product return:
- title: boutique-grade product name (mention the garment type, e.g. "Kasavu Saree", "Double Mundu Set").
- category: EXACTLY one of these values, copied character-for-character: ${input.categories
		.map((category) => `"${category.name}"`)
		.join(
			', ',
		)}. This field is the storefront department name only — never put garment types or specs in it.
- price: suggested retail price in CAD (number only) inside the category band.
- fabric: primary fabric (e.g. "Handloom cotton-silk Kasavu").
- color: dominant colors (e.g. "Ivory with gold zari").
- description: 2-3 sentence elegant e-commerce description. No price, no markdown, no bullet points.
- tags: 5-8 merchandising tags.
- keywords: 5-8 SEO keywords.
- image_prompts: EXACTLY 3 prompts, one per shot below.

Image prompt rules — every prompt must follow this blueprint:
[Subject & pose] + [Specific garment details: fabric, weave, border width, color codes] + [Model persona: age, South Asian Keralite ethnicity, skin tone] + [Environment/backdrop] + [Lighting & camera specs: camera body, lens, aperture, lighting style] + a final "Avoid: ..." sentence listing negative constraints (distorted hands, extra fingers, blurry fabric, western clothing, text, watermark, CGI, 3d render). Never use "--no" flags or the words "beautiful"/"high quality".

The 3 shots, in order:
1. STUDIO: full-body front-angle e-commerce lookbook studio shot on the persona model, high-key lighting, seamless light beige background, 85mm f/1.8, 9:16 portrait framing.
2. MACRO: extreme close-up of the fabric weave, zari border, and embroidery detail. No person. 100mm macro f/2.8, shallow depth of field, sharp focus on the border edge, 1:1 framing.
3. LIFESTYLE: the persona model in a warm festive Onam setting — pookalam (floral rangoli), banana leaves, brass nilavilakku lamps, Kerala verandah, golden-hour natural light, 50mm f/1.4, natural bokeh, 9:16 portrait framing.

Return ONLY a JSON object of this exact shape, no prose, no markdown fences:
{"products":[{"title":"...","category":"...","price":0,"fabric":"...","color":"...","description":"...","tags":["..."],"keywords":["..."],"image_prompts":["...","...","..."]}]}`
}

export const getShowcaseDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	await requireAdmin()
	const db = await getDb()
	const [allModels, allOccasions, allCollections] = await Promise.all([
		db.select().from(models).orderBy(desc(models.updatedAt)),
		db.select().from(occasions).orderBy(asc(occasions.displayOrder), asc(occasions.name)),
		db.select().from(collections).orderBy(asc(collections.name)),
	])

	return {
		models: allModels,
		occasions: allOccasions,
		collections: allCollections,
	}
})

export const generateShowcaseCatalogFn = createServerFn({ method: 'POST' })
	.inputValidator(parseGenerateCatalogInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
			const result = await getOpenRouter().chat.send({
				chatGenerationParams: {
					model: CATALOG_TEXT_MODEL,
					messages: [{ role: 'user', content: buildCatalogPrompt(data) }],
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

			const parsed = JSON.parse(extractJsonObject(text))
			const rawProducts = asRecord(parsed, 'Showcase catalog').products
			if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
				throw new Error('AI response did not contain any products')
			}

			const requestedNames = data.categories.map((category) => category.name)
			const catalog: ShowcaseProduct[] = rawProducts.map((item, index) => {
				const product = parseShowcaseProduct(item, index)
				const matched = requestedNames.find(
					(name) => name.toLowerCase() === product.category.toLowerCase(),
				)
				return matched ? { ...product, category: matched } : product
			})
			return { products: catalog }
		} catch (error) {
			return {
				products: [] as ShowcaseProduct[],
				error: error instanceof Error ? error.message : 'Failed to generate catalog',
			}
		}
	})

export const importShowcaseCatalogFn = createServerFn({ method: 'POST' })
	.inputValidator(parseImportCatalogInput)
	.handler(async ({ data }): Promise<ShowcaseImportResult> => {
		await requireAdmin()
		const db = await getDb()
		const result: ShowcaseImportResult = {
			created: 0,
			errors: [],
			occasionSlug: slugify(data.occasion),
			collectionId: null,
			products: [],
		}

		try {
			result.occasionSlug = await ensureOccasion(db, data.occasion)
			result.collectionId = await ensureCollectionId(db, data.collectionName)
		} catch (error) {
			result.errors.push(
				error instanceof Error ? error.message : 'Failed to prepare occasion and collection',
			)
			return result
		}

		const categoryCache = new Map<string, string>()

		for (const product of data.products) {
			try {
				await ensureCategory(db, product.category, categoryCache)

				const productId = crypto.randomUUID()
				const slug = await generateUniqueProductSlug(db, product.title)

				await db
					.insert(products)
					.values({
						id: productId,
						name: product.title,
						slug,
						description: product.description,
						price: product.price,
						currency: 'CAD',
						category: product.category,
						occasion: result.occasionSlug,
						fabric: product.fabric,
						color: product.color,
						imageUrl: '',
						isNew: true,
						isFeatured: false,
						collectionId: result.collectionId,
						createdAt: new Date().toISOString(),
					})
					.run()

				result.products.push({
					catalogId: product.catalogId,
					productId,
					title: product.title,
					category: product.category,
					imagePrompts: product.imagePrompts,
				})
				result.created++
			} catch (error) {
				result.errors.push(
					`"${product.title}": ${error instanceof Error ? error.message : 'Unknown import error'}`,
				)
			}
		}

		return result
	})

export const generateShowcaseImagesFn = createServerFn({ method: 'POST' })
	.inputValidator(parseGenerateShowcaseImagesInput)
	.handler(async ({ data }): Promise<ShowcaseImagesResult> => {
		await requireAdmin()
		const db = await getDb()
		const [[product], [model]] = await Promise.all([
			db.select().from(products).where(eq(products.id, data.productId)).limit(1),
			data.modelId
				? db.select().from(models).where(eq(models.id, data.modelId)).limit(1)
				: Promise.resolve([]),
		])

		if (!product) {
			return {
				productId: data.productId,
				generatedImages: 0,
				imageUrls: [],
				errors: ['Product not found'],
			}
		}

		const identityImageUrl = model?.imageUrl || ''
		const errors: string[] = []

		const shots = SHOWCASE_SHOT_KEYS.map((key, index) => ({
			key,
			prompt: data.prompts[index],
			...SHOT_CONFIG[key],
		}))

		const imageResults = await runWithConcurrency(
			shots,
			IMAGE_GENERATION_CONCURRENCY,
			async (shot) => {
				try {
					const useIdentity = shot.usesIdentityReference && Boolean(identityImageUrl)

					const uploaded = await generateImageWithRetry({
						model: SHOWCASE_IMAGE_MODEL,
						prompt: shot.prompt,
						aspectRatio: shot.aspectRatio,
						resolution: SHOWCASE_IMAGE_SIZE,
						keyPrefix: `showcase-${shot.key}`,
						inputReferences: useIdentity ? [identityImageUrl] : [],
					})
					return uploaded.url
				} catch (error) {
					errors.push(
						`${shot.key} image failed: ${
							error instanceof Error ? error.message : 'Unknown image generation error'
						}`,
					)
					return null
				}
			},
		)

		const generatedUrls = imageResults.flatMap((url) => (url ? [url] : []))

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
			productId: data.productId,
			generatedImages: generatedUrls.length,
			imageUrls: generatedUrls,
			errors,
		}
	})
