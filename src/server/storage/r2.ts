import { createServerOnlyFn } from '@tanstack/react-start'

const getWorkerEnv = createServerOnlyFn(async () => {
	const { env } = await import('cloudflare:workers')
	return env
})

type R2ObjectBody = string | Blob | ArrayBuffer | ArrayBufferView | ReadableStream | null

export async function putR2Object(key: string, body: R2ObjectBody, contentType?: string) {
	const env = await getWorkerEnv()

	await env.MEDIA_BUCKET.put(key, body, {
		httpMetadata: contentType ? { contentType } : undefined,
	})

	return {
		key,
		url: `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`,
	}
}

export async function deleteR2ObjectByUrl(url?: string | null, _reason?: string) {
	if (!url) {
		return
	}

	const env = await getWorkerEnv()
	const base = env.R2_PUBLIC_URL.replace(/\/$/, '')

	if (!url.startsWith(base)) {
		return
	}

	const key = new URL(url).pathname.replace(/^\/+/, '')

	if (key) {
		await env.MEDIA_BUCKET.delete(key)
	}
}
