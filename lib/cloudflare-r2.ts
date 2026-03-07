import { env } from 'cloudflare:workers'
import { getOptionalRuntimeEnv } from '@/lib/runtime-env'

function getConfiguredBaseUrl() {
	const value = getOptionalRuntimeEnv('R2_PUBLIC_URL')
	if (!value) return null

	try {
		return new URL(value.endsWith('/') ? value : `${value}/`)
	} catch {
		return null
	}
}

export function buildR2ObjectUrl(objectKey: string) {
	const baseUrl = getConfiguredBaseUrl()
	if (!baseUrl) {
		throw new Error('R2_PUBLIC_URL must be configured to generate public upload URLs')
	}

	const normalizedKey = objectKey.replace(/^\/+/, '')
	return new URL(normalizedKey, baseUrl).toString()
}

export function extractR2ObjectKeyFromUrl(imageUrl?: string | null): string | null {
	if (!imageUrl) return null

	try {
		const parsed = new URL(imageUrl)
		const baseUrl = getConfiguredBaseUrl()
		if (baseUrl) {
			if (parsed.origin !== baseUrl.origin) return null

			const basePath = baseUrl.pathname.replace(/\/+$/, '')
			const pathname = parsed.pathname.replace(/\/+$/, '')
			const relativePath = basePath ? pathname.replace(new RegExp(`^${basePath}`), '') : pathname
			const key = relativePath.replace(/^\/+/, '')
			return key ? decodeURIComponent(key) : null
		}

		if (!parsed.hostname.endsWith('.r2.dev')) {
			return null
		}

		const key = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
		return key ? decodeURIComponent(key) : null
	} catch {
		return null
	}
}

export async function deleteR2ObjectByUrl(imageUrl: string | null | undefined, context: string) {
	const objectKey = extractR2ObjectKeyFromUrl(imageUrl)
	if (!objectKey) return

	try {
		await env.PRODUCT_MEDIA.delete(objectKey)
	} catch (error) {
		console.error(`[r2-delete] Failed to delete object during ${context}`, {
			imageUrl,
			objectKey,
			error,
		})
	}
}
