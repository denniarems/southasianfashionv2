'use server'

import { getDb } from '@/db'
import { models } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import sharp from 'sharp'
import { OpenRouter } from '@openrouter/sdk'
import { requireAdmin } from '@/lib/admin-auth'

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
			pose: 'Upper body or waist-up framing, model posed to highlight garment details — lapels, collar, embroidery, or texture.',
			camera:
				'Macro or 85mm portrait lens perspective, shallow depth of field with garment in sharp focus.',
			lighting:
				'Controlled soft-box lighting to reveal fabric texture, weave, and surface detail without glare.',
		},
	}

	const shot = shotInstructions[shotType]
	const demographics = [model.ageRange, model.ethnicity, model.gender].filter(Boolean).join(', ')

	const segments = [
		// Intent
		'Photorealistic high-fashion editorial photograph, indistinguishable from a professional studio shoot.',

		// Model profile
		demographics ? `Model: ${demographics}.` : null,
		model.description ? `Model details: ${model.description}.` : null,

		// Style guidance
		model.promptUsed ? `Visual style: ${model.promptUsed}.` : null,
		model.customPrompt ? `Custom product direction: ${model.customPrompt}.` : null,

		// Shot type block
		`Shot type: ${shotType.toUpperCase()}.`,
		shot.pose,
		shot.camera,
		shot.lighting,

		// Garment fidelity — critical
		'Garment accuracy is paramount: replicate the exact colors, cut, silhouette, fabric texture, embroidery, buttons, seams, and any graphic elements from the reference image. Do not alter or stylize the clothing.',

		// Output quality anchors
		'Skin texture is natural and photorealistic. Proportions are anatomically accurate. Background is clean and non-distracting.',
		'Final image quality: editorial magazine standard, sharp focus, no artifacts, no distortion.',
	]

	return segments.filter(Boolean).join(' ')
}

export async function saveModel(data: any) {
	await requireAdmin()
	try {
		const db = getDb()
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

		revalidatePath('/admin/models')
		return { success: true }
	} catch (e: any) {
		return { error: e.message }
	}
}

export async function deleteModel(id: string) {
	await requireAdmin()
	try {
		const db = getDb()

		// 1. Fetch the model to get its imageUrl
		const [model] = await db.select().from(models).where(eq(models.id, id))

		if (model?.imageUrl) {
			// 2. Delete from Vercel Blob
			try {
				await del(model.imageUrl, { token: process.env.BLOB_READ_WRITE_TOKEN })
			} catch (blobError) {
				console.error('Failed to delete blob:', blobError)
				// Continue to delete the DB record even if blob deletion fails
			}
		}

		// 3. Delete from database
		await db.delete(models).where(eq(models.id, id))

		revalidatePath('/admin/models')
		return { success: true }
	} catch (e: any) {
		return { error: e.message }
	}
}

export async function generateModelImage(
	prompt: string,
	style: string,
	ageRange: string,
	gender: string,
	ethnicity: string,
) {
	await requireAdmin()
	try {
		const apiKey = process.env.OPENROUTER_API_KEY
		if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

		const fullPrompt = `Generate a high-quality fashion model image. Subject: ${ageRange} ${ethnicity} ${gender}.${prompt ? ` ${prompt}.` : ''} Style: ${style}, sharp focus.`

		const openrouter = new OpenRouter({
			apiKey,
		})

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

		const message = result.choices[0]?.message
		if (message?.images && message.images.length > 0) {
			const base64Data = message.images[0].imageUrl.url
			const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '')
			const buffer = Buffer.from(base64WithoutPrefix, 'base64')

			const webpBuffer = await sharp(buffer).webp({ quality: 75 }).toBuffer()

			const filename = `model-${Date.now()}.webp`
			const { url: blobUrl } = await put(filename, webpBuffer, {
				access: 'public',
				token: process.env.BLOB_READ_WRITE_TOKEN,
			})

			return { imageUrl: String(blobUrl) }
		}

		throw new Error('No image returned from the AI.')
	} catch (e: any) {
		return { error: e.message }
	}
}

export async function uploadExternalImageToBlob(url: string, filename: string) {
	await requireAdmin()
	try {
		const response = await fetch(url)
		if (!response.ok) throw new Error('Failed to fetch external image')
		const arrayBuffer = await response.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)
		const { url: blobUrl } = await put(filename, buffer, {
			access: 'public',
			token: process.env.BLOB_READ_WRITE_TOKEN,
		})
		return { url: blobUrl }
	} catch (e: any) {
		return { error: e.message }
	}
}

export async function generateModelPhotoshootImage(params: {
	model: PhotoshootModelDetails
	clothingImageUrl: string
	shotType: PhotoshootShotType
}) {
	await requireAdmin()
	try {
		const apiKey = process.env.OPENROUTER_API_KEY
		if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')
		if (!params?.clothingImageUrl) throw new Error('clothingImageUrl is required')

		const fullPrompt = buildPhotoshootPrompt(params.model, params.shotType)

		const openrouter = new OpenRouter({
			apiKey,
		})

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

		const message = result.choices[0]?.message
		if (message?.images && message.images.length > 0) {
			const base64Data = message.images[0].imageUrl.url
			const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '')
			const buffer = Buffer.from(base64WithoutPrefix, 'base64')

			const webpBuffer = await sharp(buffer).webp({ quality: 75 }).toBuffer()

			const filename = `photoshoot-${params.shotType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
			const { url: blobUrl } = await put(filename, webpBuffer, {
				access: 'public',
				token: process.env.BLOB_READ_WRITE_TOKEN,
			})

			return { imageUrl: String(blobUrl) }
		}

		throw new Error('No image returned from the AI.')
	} catch (e: any) {
		return { error: e.message }
	}
}
