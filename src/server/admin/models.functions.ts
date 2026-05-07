import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { OpenRouter } from '@openrouter/sdk'
import { getDb } from '@/db'
import { models } from '@/db/schema'
import { adminOnly } from './middleware'

export type PhotoshootShotType = 'front' | 'side' | 'back' | 'walking' | 'close-up'

interface PhotoshootModelDetails {
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

function getOpenRouter() {
	if (!process.env.OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not set')
	}

	return new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
}

function parseDataUrl(dataUrl: string) {
	const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

	if (!match) {
		throw new Error('AI provider returned an unsupported image format')
	}

	const mimeType = match[1]
	const binary = atob(match[2])
	const bytes = new Uint8Array(binary.length)

	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i)
	}

	return {
		mimeType,
		body: new Blob([bytes], { type: mimeType }),
		extension: mimeType.split('/')[1] || 'png',
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
		demographics ? `Model: ${demographics}.` : null,
		model.description ? `Model details: ${model.description}.` : null,
		model.promptUsed ? `Visual style: ${model.promptUsed}.` : null,
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
	const filename = `${keyPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${image.extension}`
	return putR2Object(filename, image.body, image.mimeType)
}

export async function generateModelPhotoshootImageInternal(params: GenerateModelPhotoshootInput) {
	if (!params?.clothingImageUrl) {
		throw new Error('clothingImageUrl is required')
	}

	const openrouter = getOpenRouter()
	const fullPrompt = buildPhotoshootPrompt(params.model, params.shotType)

	const result = await openrouter.chat.send({
		chatGenerationParams: {
			model: 'google/gemini-3.1-flash-image-preview',
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
				image_size: '1K',
				aspectRatio: '9:16',
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
	.middleware([adminOnly])
	.inputValidator((data: any) => data)
	.handler(async ({ data }) => {
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
	.middleware([adminOnly])
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
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
	.middleware([adminOnly])
	.inputValidator((data: GenerateModelImageInput) => data)
	.handler(async ({ data }) => {
		try {
			const fullPrompt = `Generate a high-quality fashion model image. Subject: ${data.ageRange} ${data.ethnicity} ${data.gender}.${data.prompt ? ` ${data.prompt}.` : ''} Style: ${data.style}, sharp focus.`
			const openrouter = getOpenRouter()

			const result = await openrouter.chat.send({
				chatGenerationParams: {
					model: 'google/gemini-3.1-flash-image-preview',
					messages: [
						{
							role: 'user',
							content: fullPrompt,
						},
					],
					imageConfig: {
						image_size: '1K',
						aspectRatio: '9:16',
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
	.middleware([adminOnly])
	.inputValidator((data: { url: string; filename: string }) => data)
	.handler(async ({ data }) => {
		try {
			const response = await fetch(data.url)
			if (!response.ok) throw new Error('Failed to fetch external image')

			const contentType = response.headers.get('content-type') || undefined
			const { putR2Object } = await import('@/server/storage/r2')
			const uploaded = await putR2Object(data.filename, await response.arrayBuffer(), contentType)

			return { url: uploaded.url }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to upload image' }
		}
	})

export const generateModelPhotoshootImageFn = createServerFn({ method: 'POST' })
	.middleware([adminOnly])
	.inputValidator((data: GenerateModelPhotoshootInput) => data)
	.handler(async ({ data }) => {
		try {
			return await generateModelPhotoshootImageInternal(data)
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : 'Failed to generate model photoshoot image',
			}
		}
	})
