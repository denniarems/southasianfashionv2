import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB per file
const ALLOWED_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'])

function getFileKey(file: File) {
	const candidate = (file as File & { webkitRelativePath?: string }).webkitRelativePath
	if (typeof candidate === 'string' && candidate.trim().length > 0) {
		return candidate
	}
	return file.name
}

function getSafeBlobExtension(file: File) {
	const ext = file.name.split('.').pop()?.toLowerCase() || ''
	if (ALLOWED_IMAGE_EXT.has(ext)) return ext
	if (ext === 'txt') return 'txt'
	return ''
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
		const entries = formData.getAll('files') as File[]

		if (!entries.length) {
			return NextResponse.json({ error: 'No files provided' }, { status: 400 })
		}

		const results: Record<string, string> = {}
		const errors: string[] = []

		for (const file of entries) {
			const ext = getSafeBlobExtension(file)
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
