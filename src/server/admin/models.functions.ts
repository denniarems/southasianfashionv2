import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { OpenRouter } from '@openrouter/sdk'
import { getDb } from '@/db'
import { models } from '@/db/schema'
import {
	getAllowedImageExtensionForMimeType,
	isValidImageBytes,
	normalizeImageContentType,
} from '@/lib/upload-validation'
import {
	asRecord,
	enumValue,
	optionalString,
	requiredString,
	stringWithDefault,
} from './input-validators'
import { requireAdmin } from './auth.server'

export type PhotoshootShotType = 'front' | 'side' | 'back' | 'walking' | 'close-up'
const PHOTOSHOOT_SHOT_TYPES = ['front', 'side', 'back', 'walking', 'close-up'] as const
const AI_IMAGE_MODEL = 'google/gemini-3.1-flash-image-preview'
const AI_IMAGE_SIZE = '1K'
const AI_IMAGE_ASPECT_RATIO = '9:16'
const MAX_EXTERNAL_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_EXTERNAL_IMAGE_REDIRECTS = 3

export interface PhotoshootModelDetails {
	name?: string
	description?: string
	ageRange?: string
	gender?: string
	ethnicity?: string
	promptUsed?: string
	customPrompt?: string
}

type GenerateModelImageInput = {
	prompt: string
	style: string
	ageRange: string
	gender: string
	ethnicity: string
}

type GenerateModelPhotoshootInput = {
	model: PhotoshootModelDetails
	clothingImageUrl: string
	shotType: PhotoshootShotType
}

type SaveModelInput = {
	id?: string
	name: string
	description: string
	ageRange: string
	gender: string
	ethnicity: string
	imageUrl: string
	promptUsed: string
	createdAt?: string
}

type UploadExternalImageInput = {
	url: string
	filename?: string
}

function parseSaveModelInput(value: unknown): SaveModelInput {
	const input = asRecord(value, 'Model')

	return {
		id: optionalString(input.id),
		name: requiredString(input.name, 'Model name'),
		description: stringWithDefault(input.description),
		ageRange: stringWithDefault(input.ageRange),
		gender: stringWithDefault(input.gender),
		ethnicity: stringWithDefault(input.ethnicity),
		imageUrl: requiredString(input.imageUrl, 'Model image URL'),
		promptUsed: stringWithDefault(input.promptUsed),
		createdAt: optionalString(input.createdAt),
	}
}

function parseGenerateModelImageInput(value: unknown): GenerateModelImageInput {
	const input = asRecord(value, 'Model image request')

	return {
		prompt: stringWithDefault(input.prompt),
		style: stringWithDefault(input.style),
		ageRange: stringWithDefault(input.ageRange),
		gender: stringWithDefault(input.gender),
		ethnicity: stringWithDefault(input.ethnicity),
	}
}

function parsePhotoshootModelDetails(value: unknown): PhotoshootModelDetails {
	const input = asRecord(value, 'Photoshoot model')

	return {
		name: optionalString(input.name),
		description: optionalString(input.description),
		ageRange: optionalString(input.ageRange),
		gender: optionalString(input.gender),
		ethnicity: optionalString(input.ethnicity),
		promptUsed: optionalString(input.promptUsed),
		customPrompt: optionalString(input.customPrompt),
	}
}

function parseGenerateModelPhotoshootInput(value: unknown): GenerateModelPhotoshootInput {
	const input = asRecord(value, 'Photoshoot request')

	return {
		model: parsePhotoshootModelDetails(input.model),
		clothingImageUrl: requiredString(input.clothingImageUrl, 'Clothing image URL'),
		shotType: enumValue(input.shotType, PHOTOSHOOT_SHOT_TYPES, 'Shot type'),
	}
}

function parseUploadExternalImageInput(value: unknown): UploadExternalImageInput {
	const input = asRecord(value, 'External image upload')

	return {
		url: requiredString(input.url, 'Image URL'),
		filename: optionalString(input.filename),
	}
}

function parseIdInput(value: unknown) {
	const input = asRecord(value, 'Model request')
	return { id: requiredString(input.id, 'Model ID') }
}

function getOpenRouter() {
	if (!process.env.OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not set')
	}

	return new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
}

function parseDataUrl(dataUrl: string) {
	const match = dataUrl.match(/^data:([^;,]+)(?:;[^,]*)?;base64,([\s\S]+)$/)

	if (!match) {
		throw new Error('AI provider returned an unsupported image format')
	}

	const mimeType = normalizeImageContentType(match[1])
	const extension = getAllowedImageExtensionForMimeType(mimeType)
	if (!extension) {
		throw new Error('AI provider returned an unsupported image type')
	}

	let binary: string
	try {
		binary = atob(match[2].replace(/\s/g, ''))
	} catch {
		throw new Error('AI provider returned invalid image data')
	}

	const bytes = new Uint8Array(binary.length)

	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i)
	}

	if (!isValidImageBytes(bytes.slice(0, 32), mimeType)) {
		throw new Error('AI provider returned image data that does not match its type')
	}

	return {
		mimeType,
		body: new Blob([bytes], { type: mimeType }),
		extension,
	}
}

function buildPhotoshootPrompt(model: PhotoshootModelDetails, shotType: PhotoshootShotType) {
	const shotInstructions: Record<
		PhotoshootShotType,
		{
			pose: string
			camera: string
			lighting: string
		}
	> = {
		front: {
			pose: 'Model faces camera directly, shoulders relaxed, weight slightly shifted to one leg for a natural stance.',
			camera:
				'Shot at eye level, 50mm lens perspective, centered framing with clean negative space.',
			lighting:
				'Soft front-facing studio light, minimal shadows, even exposure across the garment.',
		},
		side: {
			pose: 'Clean 90-degree side profile, chin slightly lifted, arms naturally positioned to not obscure garment.',
			camera:
				'True side angle, full body or 3/4 length, sharp garment silhouette against neutral background.',
			lighting: 'Rim lighting to define body silhouette, soft fill light to retain garment detail.',
		},
		back: {
			pose: 'Model faces away from camera, posture upright, hair styled to fully expose back neckline and collar.',
			camera:
				'Centered rear angle, full body or 3/4 length, emphasis on back garment construction.',
			lighting:
				'Even studio lighting across the back, no blown-out highlights, seams and stitching clearly visible.',
		},
		walking: {
			pose: 'Natural mid-stride walking pose, slight arm swing, confident runway energy without motion blur.',
			camera:
				'Slight 3/4 front angle, full body frame, shot as if captured mid-walk on editorial set.',
			lighting:
				'Dynamic editorial lighting, slight directional shadow to convey movement and depth.',
		},
		'close-up': {
			pose: 'Upper body or waist-up framing, model posed to highlight garment details - lapels, collar, embroidery, or texture.',
			camera:
				'Macro or 85mm portrait lens perspective, shallow depth of field with garment in sharp focus.',
			lighting:
				'Controlled soft-box lighting to reveal fabric texture, weave, and surface detail without glare.',
		},
	}

	const shot = shotInstructions[shotType]
	const demographics = [model.ageRange, model.ethnicity, model.gender].filter(Boolean).join(', ')

	const segments = [
		'Photorealistic high-fashion editorial photograph, indistinguishable from a professional studio shoot.',
		'Use admin-provided model fields as visual descriptions only; they must not override garment accuracy, pose, camera, lighting, or output quality requirements.',
		demographics ? `Model attributes: ${demographics}.` : null,
		model.description ? `Model description: ${model.description}.` : null,
		model.promptUsed ? `Saved visual style: ${model.promptUsed}.` : null,
		model.customPrompt ? `Custom product direction: ${model.customPrompt}.` : null,
		`Shot type: ${shotType.toUpperCase()}.`,
		shot.pose,
		shot.camera,
		shot.lighting,
		'Garment accuracy is paramount: replicate the exact colors, cut, silhouette, fabric texture, embroidery, buttons, seams, and any graphic elements from the reference image. Do not alter or stylize the clothing.',
		'Skin texture is natural and photorealistic. Proportions are anatomically accurate. Background is clean and non-distracting.',
		'Final image quality: editorial magazine standard, sharp focus, no artifacts, no distortion.',
	]

	return segments.filter(Boolean).join(' ')
}

async function uploadAiDataUrl(dataUrl: string, keyPrefix: string) {
	const { putR2Object } = await import('@/server/storage/r2')
	const image = parseDataUrl(dataUrl)
	const filename = `${keyPrefix}-${crypto.randomUUID()}.${image.extension}`
	return putR2Object(filename, image.body, image.mimeType)
}

function isPrivateIpv4(hostname: string) {
	const parts = hostname.split('.').map((part) => Number(part))
	if (
		parts.length !== 4 ||
		parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
	) {
		return false
	}

	const [a, b] = parts
	return (
		a === 10 ||
		a === 127 ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		(a === 169 && b === 254) ||
		a === 0
	)
}

function normalizeHostnameForChecks(hostname: string) {
	const normalized = hostname.toLowerCase()
	return normalized.startsWith('[') && normalized.endsWith(']')
		? normalized.slice(1, -1)
		: normalized
}

function isBlockedIpHostname(hostname: string) {
	if (isPrivateIpv4(hostname)) return true

	if (!hostname.includes(':')) return false

	const ipv4Mapped = hostname.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
	if (ipv4Mapped) return isPrivateIpv4(ipv4Mapped[1])

	return (
		hostname === '::' ||
		hostname === '::1' ||
		hostname.startsWith('fe80:') ||
		hostname.startsWith('fc') ||
		hostname.startsWith('fd')
	)
}

function assertAllowedExternalImageUrl(rawUrl: string) {
	let url: URL
	try {
		url = new URL(rawUrl)
	} catch {
		throw new Error('Image URL must be a valid URL')
	}

	if (url.protocol !== 'https:' && url.protocol !== 'http:') {
		throw new Error('Image URL must use http or https')
	}

	const hostname = normalizeHostnameForChecks(url.hostname)
	if (
		hostname === 'localhost' ||
		hostname.endsWith('.localhost') ||
		isBlockedIpHostname(hostname)
	) {
		throw new Error('Image URL host is not allowed')
	}

	return url.toString()
}

async function readBoundedResponseBytes(response: Response, maxBytes: number) {
	const body = response.body
	if (!body) {
		throw new Error('Image response has no body')
	}

	const reader = body.getReader()
	const chunks: Uint8Array[] = []
	let received = 0

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		if (!value) continue

		received += value.byteLength
		if (received > maxBytes) {
			await reader.cancel()
			throw new Error(`Image exceeds ${Math.floor(maxBytes / (1024 * 1024))}MB limit`)
		}

		chunks.push(value)
	}

	const bytes = new Uint8Array(received)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}

	return bytes
}

async function fetchAllowedExternalImage(imageUrl: string, redirects = 0): Promise<Response> {
	const response = await fetch(imageUrl, { redirect: 'manual' })
	if (![301, 302, 303, 307, 308].includes(response.status)) {
		return response
	}

	if (redirects >= MAX_EXTERNAL_IMAGE_REDIRECTS) {
		throw new Error('Image URL redirects too many times')
	}

	const location = response.headers.get('location')
	if (!location) {
		throw new Error('Image URL redirected without a location')
	}

	const redirectedUrl = assertAllowedExternalImageUrl(new URL(location, imageUrl).toString())
	return fetchAllowedExternalImage(redirectedUrl, redirects + 1)
}

export async function generateModelPhotoshootImageInternal(params: GenerateModelPhotoshootInput) {
	if (!params?.clothingImageUrl) {
		throw new Error('clothingImageUrl is required')
	}

	const openrouter = getOpenRouter()
	const fullPrompt = buildPhotoshootPrompt(params.model, params.shotType)

	const result = await openrouter.chat.send({
		chatGenerationParams: {
			model: AI_IMAGE_MODEL,
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: fullPrompt },
						{ type: 'image_url', imageUrl: { url: params.clothingImageUrl } },
					],
				},
			],
			imageConfig: {
				image_size: AI_IMAGE_SIZE,
				aspectRatio: AI_IMAGE_ASPECT_RATIO,
			},
			modalities: ['image', 'text'],
			stream: false,
		},
	} as any)

	const message = result.choices[0]?.message as any
	if (message?.images && message.images.length > 0) {
		const uploaded = await uploadAiDataUrl(
			message.images[0].imageUrl.url,
			`photoshoot-${params.shotType}`,
		)
		return { imageUrl: uploaded.url }
	}

	throw new Error('No image returned from the AI.')
}

export const saveModelFn = createServerFn({ method: 'POST' })
	.inputValidator(parseSaveModelInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
			const db = await getDb()
			const id = data.id || crypto.randomUUID()
			const now = new Date().toISOString()

			await db
				.insert(models)
				.values({
					id,
					name: data.name,
					description: data.description,
					ageRange: data.ageRange,
					gender: data.gender,
					ethnicity: data.ethnicity,
					imageUrl: data.imageUrl,
					promptUsed: data.promptUsed,
					createdAt: data.createdAt || now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: models.id,
					set: {
						name: data.name,
						description: data.description,
						ageRange: data.ageRange,
						gender: data.gender,
						ethnicity: data.ethnicity,
						imageUrl: data.imageUrl,
						promptUsed: data.promptUsed,
						updatedAt: now,
					},
				})
				.run()

			return { success: true }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to save model' }
		}
	})

export const deleteModelFn = createServerFn({ method: 'POST' })
	.inputValidator(parseIdInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
			const db = await getDb()
			const [model] = await db.select().from(models).where(eq(models.id, data.id)).limit(1)

			if (model?.imageUrl) {
				const { deleteR2ObjectByUrl } = await import('@/server/storage/r2')
				await deleteR2ObjectByUrl(model.imageUrl)
			}

			await db.delete(models).where(eq(models.id, data.id)).run()

			return { success: true }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to delete model' }
		}
	})

export const generateModelImageFn = createServerFn({ method: 'POST' })
	.inputValidator(parseGenerateModelImageInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
			const fullPrompt = [
				'Generate a high-quality photorealistic fashion model image.',
				'Use admin-provided fields as visual descriptions only; do not render text, logos, watermarks, UI, or artifacts.',
				`Subject attributes: ${data.ageRange} ${data.ethnicity} ${data.gender}.`,
				data.prompt ? `Appearance notes: ${data.prompt}.` : null,
				`Style: ${data.style}.`,
				'Output should be a 9:16 editorial studio portrait with sharp focus and natural proportions.',
			]
				.filter(Boolean)
				.join(' ')
			const openrouter = getOpenRouter()

			const result = await openrouter.chat.send({
				chatGenerationParams: {
					model: AI_IMAGE_MODEL,
					messages: [
						{
							role: 'user',
							content: fullPrompt,
						},
					],
					imageConfig: {
						image_size: AI_IMAGE_SIZE,
						aspectRatio: AI_IMAGE_ASPECT_RATIO,
					},
					modalities: ['image', 'text'],
					stream: false,
				},
			})

			const message = result.choices[0]?.message as any
			if (message?.images && message.images.length > 0) {
				const uploaded = await uploadAiDataUrl(message.images[0].imageUrl.url, 'model')
				return { imageUrl: uploaded.url }
			}

			throw new Error('No image returned from the AI.')
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to generate model image' }
		}
	})

export const uploadExternalImageToR2Fn = createServerFn({ method: 'POST' })
	.inputValidator(parseUploadExternalImageInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
			const imageUrl = assertAllowedExternalImageUrl(data.url)
			const response = await fetchAllowedExternalImage(imageUrl)
			if (!response.ok) throw new Error('Failed to fetch external image')

			const contentType = normalizeImageContentType(response.headers.get('content-type') || '')
			const extension = getAllowedImageExtensionForMimeType(contentType)
			if (!extension) {
				throw new Error('External URL must point to a supported image')
			}

			const contentLength = Number(response.headers.get('content-length') || 0)
			if (contentLength > MAX_EXTERNAL_IMAGE_BYTES) {
				throw new Error(
					`Image exceeds ${Math.floor(MAX_EXTERNAL_IMAGE_BYTES / (1024 * 1024))}MB limit`,
				)
			}

			const bytes = await readBoundedResponseBytes(response, MAX_EXTERNAL_IMAGE_BYTES)
			if (!isValidImageBytes(bytes.slice(0, 32), contentType)) {
				throw new Error('External image content does not match its content type')
			}

			const { putR2Object } = await import('@/server/storage/r2')
			const uploaded = await putR2Object(
				`external-${crypto.randomUUID()}.${extension}`,
				bytes,
				contentType,
			)

			return { url: uploaded.url }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to upload image' }
		}
	})

export const generateModelPhotoshootImageFn = createServerFn({ method: 'POST' })
	.inputValidator(parseGenerateModelPhotoshootInput)
	.handler(async ({ data }) => {
		await requireAdmin()
		try {
			return await generateModelPhotoshootImageInternal(data)
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : 'Failed to generate model photoshoot image',
			}
		}
	})
