import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { deleteVercelBlobByUrl } from '@/lib/vercel-blob'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB

function getUploadErrorCode(message: string) {
	if (/token|auth|unauthori[sz]ed|forbidden/i.test(message)) {
		return 'blob_auth_error'
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
		if (!process.env.BLOB_READ_WRITE_TOKEN) {
			return NextResponse.json(
				{ error: 'Blob token is not configured', code: 'missing_blob_token' },
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

		const filename = `${crypto.randomUUID()}.${ext}`

		const blob = await put(filename, file, { access: 'public' })

		await deleteVercelBlobByUrl(previousImageUrl, 'image replacement upload')

		return NextResponse.json({
			url: blob.url,
			filename, // you can store this in the db if needed
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
