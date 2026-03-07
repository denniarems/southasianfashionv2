import { env } from 'cloudflare:workers'

type RuntimeKey =
	| 'ADMIN_EMAIL'
	| 'JWT_SECRET'
	| 'SENDER_EMAIL'
	| 'R2_PUBLIC_URL'
	| 'CLOUDFLARE_IMAGES_DELIVERY_HOST'
	| 'NEXT_PUBLIC_SITE_URL'
	| 'NODE_ENV'

const workerEnv = env as unknown as Record<string, unknown>

export function getOptionalRuntimeEnv(key: RuntimeKey): string | undefined {
	const workerValue = workerEnv[key]
	if (typeof workerValue === 'string' && workerValue.trim().length > 0) {
		return workerValue
	}

	const processValue = process.env[key]
	if (typeof processValue === 'string' && processValue.trim().length > 0) {
		return processValue
	}

	return undefined
}

export function getRequiredRuntimeEnv(key: RuntimeKey): string {
	const value = getOptionalRuntimeEnv(key)
	if (!value) {
		throw new Error(`Missing required runtime environment value: ${key}`)
	}
	return value
}

export function getAdminEmails() {
	return (getOptionalRuntimeEnv('ADMIN_EMAIL') || '[email protected]')
		.split(',')
		.map((email) => email.trim())
		.filter(Boolean)
}

export function getJwtSecret() {
	return getOptionalRuntimeEnv('JWT_SECRET') || 'saf_default_secret'
}

export function getSenderEmail() {
	return getOptionalRuntimeEnv('SENDER_EMAIL') || '[email protected]'
}

export function getNodeEnv() {
	return getOptionalRuntimeEnv('NODE_ENV') || process.env.NODE_ENV || 'development'
}
