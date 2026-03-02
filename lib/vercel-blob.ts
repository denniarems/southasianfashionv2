import { del } from '@vercel/blob'

const BLOB_HOST_FRAGMENT = 'blob.vercel-storage.com'

export function extractVercelBlobFilename(imageUrl?: string | null): string | null {
	if (!imageUrl) return null

	try {
		const parsed = new URL(imageUrl)
		if (!parsed.hostname.includes(BLOB_HOST_FRAGMENT)) return null

		const segments = parsed.pathname.split('/').filter(Boolean)
		const filename = segments.at(-1)

		if (!filename) return null

		return decodeURIComponent(filename)
	} catch {
		return null
	}
}

export async function deleteVercelBlobByUrl(imageUrl: string | null | undefined, context: string) {
	const filename = extractVercelBlobFilename(imageUrl)
	if (!filename) return

	try {
		await del(filename)
	} catch (error) {
		console.error(`[blob-delete] Failed to delete blob during ${context}`, {
			imageUrl,
			filename,
			error,
		})
	}
}