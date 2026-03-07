'use server'

import { getDb } from '@/db'
import { otpCodes } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendOtpEmail } from '@/lib/cloudflare-email'
import { getAdminEmails, getJwtSecret, getNodeEnv } from '@/lib/runtime-env'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function requestOtp(email: string) {
	if (!getAdminEmails().includes(email)) {
		return { error: 'Not authorized' }
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString()
	const expiresAt = new Date(Date.now() + 10 * 60000).toISOString()

	const db = getDb()

	await db.delete(otpCodes).where(eq(otpCodes.email, email))
	await db.insert(otpCodes).values({
		email,
		otp,
		createdAt: new Date().toISOString(),
		expiresAt,
	})

	try {
		await sendOtpEmail(email, otp)
		return { success: true }
	} catch (e) {
		console.error(e)
		return { error: 'Failed to send OTP' }
	}
}

export async function verifyOtp(email: string, otp: string) {
	const db = getDb()

	const [record] = await db
		.select()
		.from(otpCodes)
		.where(and(eq(otpCodes.email, email), eq(otpCodes.otp, otp)))
		.limit(1)

	if (!record) {
		return { error: 'Invalid OTP' }
	}

	if (new Date(record.expiresAt) < new Date()) {
		return { error: 'OTP expired' }
	}

	await db.delete(otpCodes).where(eq(otpCodes.email, email))

	const token = jwt.sign({ email }, getJwtSecret(), { expiresIn: '24h' })

	const cookieStore = (await cookies()) as any
	cookieStore.set('saf_admin_session', token, {
		httpOnly: true,
		secure: getNodeEnv() === 'production',
		sameSite: 'lax',
		maxAge: 86400, // 24 hours
	})

	return { success: true }
}

export async function logout() {
	const cookieStore = (await cookies()) as any
	cookieStore.delete('saf_admin_session')
}
