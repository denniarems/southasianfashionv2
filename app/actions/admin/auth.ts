'use server'

import { getDb } from '@/db'
import { otpCodes } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { Resend } from 'resend'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin-auth'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAILS_CONFIG = process.env.ADMIN_EMAIL || 'denniarems@gmail.com'
const ADMIN_EMAILS = ADMIN_EMAILS_CONFIG.split(',').map((e) => e.trim())

export async function requestOtp(email: string) {
	if (!ADMIN_EMAILS.includes(email)) {
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
		await resend.emails.send({
			from: process.env.SENDER_EMAIL || 'onboarding@resend.dev',
			to: email,
			subject: 'SouthAsianFashion Admin - Your Login Code',
			html: `
        <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px; text-align: center;">
            <h1 style="color: #1c1917; font-size: 24px; margin-bottom: 8px;">SouthAsianFashion</h1>
            <p style="color: #a16207; font-style: italic; margin-bottom: 32px;">Admin Portal</p>
            <p style="color: #57534e; font-size: 14px;">Your verification code is:</p>
            <h2 style="color: #1c1917; font-size: 36px; letter-spacing: 8px; margin: 16px 0;">${otp}</h2>
            <p style="color: #a8a29e; font-size: 12px;">This code expires in 10 minutes.</p>
        </div>
      `,
		})
		return { success: true }
	} catch (e) {
		console.error(e)
		return { error: 'Failed to send OTP' }
	}
}

export async function verifyOtp(email: string, otp: string) {
	const db = getDb()

	const record = await db.query.otpCodes.findFirst({
		where: and(eq(otpCodes.email, email), eq(otpCodes.otp, otp)),
	})

	if (!record) {
		return { error: 'Invalid OTP' }
	}

	if (new Date(record.expiresAt) < new Date()) {
		return { error: 'OTP expired' }
	}

	await db.delete(otpCodes).where(eq(otpCodes.email, email))

	const token = createAdminSessionToken(email)

	const cookieStore = (await cookies()) as any
	cookieStore.set(ADMIN_SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 86400, // 24 hours
	})

	return { success: true }
}

export async function logout() {
	const cookieStore = (await cookies()) as any
	cookieStore.delete(ADMIN_SESSION_COOKIE)
	redirect('/admin/login')
}
