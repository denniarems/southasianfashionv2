import { cookies } from 'next/headers'
import jwt, { type JwtPayload } from 'jsonwebtoken'

export const ADMIN_SESSION_COOKIE = 'saf_admin_session'

export class AdminAuthError extends Error {
	constructor(message = 'Admin authentication required') {
		super(message)
		this.name = 'AdminAuthError'
	}
}

export function getAdminJwtSecret() {
	const secret = process.env.JWT_SECRET?.trim()
	if (!secret) {
		throw new Error('JWT_SECRET is required')
	}
	return secret
}

export function createAdminSessionToken(email: string) {
	return jwt.sign({ email }, getAdminJwtSecret(), { expiresIn: '24h' })
}

export function verifyAdminSessionToken(token: string | undefined) {
	if (!token) {
		throw new AdminAuthError()
	}

	const payload = jwt.verify(token, getAdminJwtSecret())
	if (typeof payload === 'string' || typeof (payload as JwtPayload).email !== 'string') {
		throw new AdminAuthError('Invalid admin session')
	}

	return payload as JwtPayload & { email: string }
}

export async function requireAdmin() {
	const cookieStore = await cookies()
	const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
	return verifyAdminSessionToken(token)
}
