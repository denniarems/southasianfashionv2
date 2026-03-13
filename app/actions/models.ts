'use server'

import { getDb } from '@/db'
import { models } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'

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

		const fullPrompt = `Generate a high-quality fashion model image. Subject: ${ageRange} ${ethnicity} ${gender}. ${prompt}. Style: ${style}.`

		// Call Nano Banana OpenRouter API
		// Assuming OpenRouter chat/completions endpoint returning an image URL for the requested model.
		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'meta-llama/llama-3-8b-instruct:free', // Replace with specific Nano Banana model if applicable
				messages: [
					{
						role: 'user',
						content: `${fullPrompt} Please output ONLY a direct image URL (starting with http) in your response, no other text.`,
					},
				],
			}),
		})

		if (!res.ok) {
			const err = await res.text()
			throw new Error(`OpenRouter API error: ${err}`)
		}

		const data = await res.json()
		const textResponse = data.choices?.[0]?.message?.content || ''

		const urlMatch = textResponse.match(/https?:\/\/[^\s)\]"']+/)
		if (!urlMatch) {
			throw new Error('No image URL returned from the AI. Response was: ' + textResponse)
		}

		return { imageUrl: urlMatch[0] }
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
