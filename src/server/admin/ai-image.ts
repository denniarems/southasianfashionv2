import { OpenRouter } from '@openrouter/sdk'
import {
	getAllowedImageExtensionForMimeType,
	isValidImageBytes,
	normalizeImageContentType,
} from '@/lib/upload-validation'

export function getOpenRouter() {
	if (!process.env.OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not set')
	}

	return new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
}

const OPENROUTER_IMAGES_URL = 'https://openrouter.ai/api/v1/images'
const IMAGE_REQUEST_MAX_ATTEMPTS = 3

export type GenerateImageInput = {
	model: string
	prompt: string
	aspectRatio: string
	keyPrefix: string
	inputReferences?: string[]
	resolution?: '1K' | '2K'
}

function base64ToBytes(base64: string) {
	const binary = atob(base64.replace(/\s/g, ''))
	const bytes = new Uint8Array(new ArrayBuffer(binary.length))

	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i)
	}

	return bytes
}

async function uploadAiImageBytes(bytes: Uint8Array<ArrayBuffer>, mediaType: string, keyPrefix: string) {
	const mimeType = normalizeImageContentType(mediaType)
	const extension = getAllowedImageExtensionForMimeType(mimeType)
	if (!extension) {
		throw new Error('AI provider returned an unsupported image type')
	}

	if (!isValidImageBytes(bytes.slice(0, 32), mimeType)) {
		throw new Error('AI provider returned image data that does not match its type')
	}

	const { putR2Object } = await import('@/server/storage/r2')
	const filename = `${keyPrefix}-${crypto.randomUUID()}.${extension}`
	return putR2Object(filename, new Blob([bytes], { type: mimeType }), mimeType)
}

export async function generateImageWithRetry(input: GenerateImageInput) {
	if (!process.env.OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not set')
	}

	let lastError: unknown

	for (let attempt = 1; attempt <= IMAGE_REQUEST_MAX_ATTEMPTS; attempt += 1) {
		try {
			const response = await fetch(OPENROUTER_IMAGES_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: input.model,
					prompt: input.prompt,
					n: 1,
					aspect_ratio: input.aspectRatio,
					resolution: input.resolution ?? '1K',
					...(input.inputReferences?.length
						? {
								input_references: input.inputReferences.map((url) => ({
									type: 'image_url',
									image_url: { url },
								})),
							}
						: {}),
				}),
			})

			const text = await response.text()
			if (!response.ok) {
				throw new Error(`Image API request failed (${response.status}): ${text.slice(0, 200)}`)
			}

			const parsed = JSON.parse(text)
			const image = parsed?.data?.[0]
			if (!image?.b64_json) {
				throw new Error('No image returned from the AI')
			}

			return await uploadAiImageBytes(
				base64ToBytes(image.b64_json),
				image.media_type || 'image/png',
				input.keyPrefix,
			)
		} catch (error) {
			lastError = error
			if (attempt < IMAGE_REQUEST_MAX_ATTEMPTS) {
				await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
			}
		}
	}

	throw lastError instanceof Error ? lastError : new Error('Image generation request failed')
}
