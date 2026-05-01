import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { AdminAuthError, requireAdmin } from '@/lib/admin-auth'
import {
	ALLOWED_IMAGE_EXTENSIONS,
	getFileExtension,
	isValidImageFile,
	isValidTextFile,
} from '@/lib/upload-validation'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB per file

function getFileKey(file: File) {
	const candidate = (file as File & { webkitRelativePath?: string }).webkitRelativePath
	if (typeof candidate === 'string' && candidate.trim().length > 0) {
		return candidate
	}
	return file.name
}

async function getSafeBlobExtension(file: File) {
	const ext = getFileExtension(file.name)
	if (ALLOWED_IMAGE_EXTENSIONS.has(ext) && (await isValidImageFile(file, ext))) return ext
	if (isValidTextFile(file, ext)) return 'txt'
	return ''
}

export async function POST(request: Request) {
	try {
		await requireAdmin()
	} catch (error) {
		if (!(error instanceof AdminAuthError)) {
			console.error('Batch upload auth configuration error:', error)
			return NextResponse.json({ error: 'Upload auth is not configured' }, { status: 500 })
		}
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		if (!process.env.BLOB_READ_WRITE_TOKEN) {
			return NextResponse.json(
				{ error: 'Blob token is not configured', code: 'missing_blob_token' },
				{ status: 500 },
			)
		}

		const formData = await request.formData()
		const entries = formData.getAll('files').filter((entry): entry is File => entry instanceof File)

		if (!entries.length) {
			return NextResponse.json({ error: 'No files provided' }, { status: 400 })
		}

		const results: Record<string, string> = {}
		const errors: string[] = []

		for (const file of entries) {
			const ext = await getSafeBlobExtension(file)
			const key = getFileKey(file)

			if (!ext) {
				errors.push(`${key}: invalid file type`)
				continue
			}

			if (file.size > MAX_FILE_BYTES) {
				errors.push(`${key}: exceeds 10MB limit`)
				continue
			}

			try {
				const blobName = `batch-${crypto.randomUUID()}.${ext}`
				const blob = await put(blobName, file, { access: 'public' })
				results[key] = blob.url
			} catch {
				errors.push(`${key}: upload failed`)
			}
		}

		return NextResponse.json({ files: results, errors })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Batch upload failed'
		console.error('Batch upload error:', message)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
