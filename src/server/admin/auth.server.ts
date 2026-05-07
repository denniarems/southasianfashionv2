import { useSession } from '@tanstack/react-start/server'

export const ADMIN_SESSION_COOKIE = 'saf_admin_session'

export class AdminAuthError extends Error {
	constructor(message = 'Admin authentication required') {
		super(message)
		this.name = 'AdminAuthError'
	}
}

type AdminSession = {
	email?: string
}

function getSessionSecret() {
	const secret = process.env.JWT_SECRET?.trim()

	if (!secret) {
		throw new Error('JWT_SECRET is required')
	}

	if (secret.length < 32) {
		if (process.env.NODE_ENV !== 'production') {
			return secret.padEnd(32, '0')
		}

		throw new Error('JWT_SECRET must be at least 32 characters')
	}

	return secret
}

export async function useAdminSession() {
	return useSession<AdminSession>({
		name: ADMIN_SESSION_COOKIE,
		password: getSessionSecret(),
		maxAge: 60 * 60 * 24,
		cookie: {
			httpOnly: true,
			secure: process.env.SITE_URL?.startsWith('https://') ?? true,
			sameSite: 'lax',
			path: '/',
		},
	})
}

export async function requireAdmin() {
	const session = await useAdminSession()
	const email = session.data.email

	if (!email) {
		throw new AdminAuthError()
	}

	return { email }
}

export function getAllowedAdminEmails() {
	return (process.env.ADMIN_EMAIL || '')
		.split(',')
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean)
}
