'use server'

import { getDb } from '@/db'
import { models } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import sharp from 'sharp'
import { OpenRouter } from '@openrouter/sdk'

export async function saveModel(data: any) {
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
	ethnicity: string
) {
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
					image_size : '1K',
					aspectRatio: '9:16'
				},
				modalities: ['image', 'text'],
			}
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
