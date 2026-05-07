import { createFileRoute } from '@tanstack/react-router'
import { AdminAuthError, requireAdmin } from '@/lib/admin-auth'
import {
	ALLOWED_IMAGE_EXTENSIONS,
	getFileExtension,
	isValidImageFile,
} from '@/lib/upload-validation'
import { putR2Object } from '@/server/storage/r2'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

function getUploadErrorCode(message: string) {
	if (/token|auth|unauthori[sz]ed|forbidden/i.test(message)) {
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

export const Route = createFileRoute('/api/upload')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					await requireAdmin()
				} catch (error) {
					if (!(error instanceof AdminAuthError)) {
						console.error('Upload auth configuration error:', error)
						return Response.json({ error: 'Upload auth is not configured' }, { status: 500 })
					}
					return Response.json({ error: 'Unauthorized' }, { status: 401 })
				}

				try {
					const formData = await request.formData()
					const file = formData.get('file')

					if (!(file instanceof File)) {
						return Response.json({ error: 'No file provided' }, { status: 400 })
					}

					const ext = getFileExtension(file.name)

					if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) || !(await isValidImageFile(file, ext))) {
						return Response.json({ error: 'Invalid file type' }, { status: 400 })
					}

					if (file.size > MAX_UPLOAD_BYTES) {
						return Response.json(
							{
								error: `File too large. Max allowed size is ${Math.floor(
									MAX_UPLOAD_BYTES / (1024 * 1024),
								)}MB`,
								code: 'file_too_large',
							},
							{ status: 413 },
						)
					}

					const filename = `${crypto.randomUUID()}.${ext}`
					const uploaded = await putR2Object(filename, file, file.type || undefined)

					return Response.json({
						url: uploaded.url,
						filename,
					})
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unknown upload error'
					const code = getUploadErrorCode(message)
					const status = code === 'file_too_large' ? 413 : 500

					console.error('Upload error:', { code, message })

					return Response.json(
						{
							error: 'Upload failed',
							code,
							details: import.meta.env.DEV ? message : undefined,
						},
						{ status },
					)
				}
			},
		},
	},
})
