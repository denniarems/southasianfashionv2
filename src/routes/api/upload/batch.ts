import { createFileRoute } from '@tanstack/react-router'
import { AdminAuthError, requireAdmin } from '@/lib/admin-auth'
import {
	ALLOWED_IMAGE_EXTENSIONS,
	getFileExtension,
	isValidImageFile,
	isValidTextFile,
} from '@/lib/upload-validation'
import { putR2Object } from '@/server/storage/r2'

const MAX_FILE_BYTES = 10 * 1024 * 1024

function getFileKey(file: File) {
	const candidate = (file as File & { webkitRelativePath?: string }).webkitRelativePath
	if (typeof candidate === 'string' && candidate.trim().length > 0) {
		return candidate
	}
	return file.name
}

async function getSafeExtension(file: File) {
	const ext = getFileExtension(file.name)
	if (ALLOWED_IMAGE_EXTENSIONS.has(ext) && (await isValidImageFile(file, ext))) return ext
	if (isValidTextFile(file, ext)) return 'txt'
	return ''
}

export const Route = createFileRoute('/api/upload/batch')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					await requireAdmin()
				} catch (error) {
					if (!(error instanceof AdminAuthError)) {
						console.error('Batch upload auth configuration error:', error)
						return Response.json({ error: 'Upload auth is not configured' }, { status: 500 })
					}
					return Response.json({ error: 'Unauthorized' }, { status: 401 })
				}

				try {
					const formData = await request.formData()
					const entries = formData
						.getAll('files')
						.filter((entry): entry is File => entry instanceof File)

					if (!entries.length) {
						return Response.json({ error: 'No files provided' }, { status: 400 })
					}

					const results: Record<string, string> = {}
					const errors: string[] = []

					for (const file of entries) {
						const ext = await getSafeExtension(file)
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
							const objectName = `batch-${crypto.randomUUID()}.${ext}`
							const uploaded = await putR2Object(objectName, file, file.type || undefined)
							results[key] = uploaded.url
						} catch {
							errors.push(`${key}: upload failed`)
						}
					}

					return Response.json({ files: results, errors })
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Batch upload failed'
					console.error('Batch upload error:', message)
					return Response.json({ error: message }, { status: 500 })
				}
			},
		},
	},
})
