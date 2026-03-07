import { env } from 'cloudflare:workers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { buildR2ObjectUrl, deleteR2ObjectByUrl } from '@/lib/cloudflare-r2'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB
const MIME_TYPES: Record<string, string> = {
	avif: 'image/avif',
	gif: 'image/gif',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	png: 'image/png',
	svg: 'image/svg+xml',
	webp: 'image/webp',
}

function getUploadErrorCode(message: string) {
	if (/binding|bucket|auth|unauthori[sz]ed|forbidden|permission/i.test(message)) {
		return 'storage_auth_error'
	}

	if (/too large|payload|413|entity too large|size/i.test(message)) {
		return 'file_too_large'
	}

	if (/timeout|timed out|max duration/i.test(message)) {
		return 'upload_timeout'
	}

	return 'upload_failed'
}

export async function POST(request: Request) {
	try {
		if (!env.PRODUCT_MEDIA) {
			return NextResponse.json(
				{ error: 'R2 bucket binding is not configured', code: 'missing_r2_binding' },
				{ status: 500 },
			)
		}

		const formData = await request.formData()
		const file = formData.get('file') as File
		const existingImageUrl = formData.get('existingImageUrl')
		const previousImageUrl = typeof existingImageUrl === 'string' ? existingImageUrl : null

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 })
		}

		const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
		const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif']

		if (!allowed.includes(ext)) {
			return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
		}

		if (file.size > MAX_UPLOAD_BYTES) {
			return NextResponse.json(
				{
					error: `File too large. Max allowed size is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB`,
					code: 'file_too_large',
				},
				{ status: 413 },
			)
		}

		const objectKey = `products/${crypto.randomUUID()}.${ext}`
		const contentType = file.type || MIME_TYPES[ext] || 'application/octet-stream'

		await env.PRODUCT_MEDIA.put(objectKey, await file.arrayBuffer(), {
			httpMetadata: {
				contentType,
			},
			customMetadata: {
				originalName: file.name,
			},
		})

		await deleteR2ObjectByUrl(previousImageUrl, 'image replacement upload')

		const publicUrl = buildR2ObjectUrl(objectKey)

		return NextResponse.json({
			url: publicUrl,
			filename: objectKey,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown upload error'
		const code = getUploadErrorCode(message)
		const status = code === 'file_too_large' ? 413 : 500

		console.error('Upload error:', {
			code,
			message,
			nodeEnv: process.env.NODE_ENV,
		})

		return NextResponse.json(
			{
				error: 'Upload failed',
				code,
				details: process.env.NODE_ENV === 'development' ? message : undefined,
			},
			{ status },
		)
	}
}
