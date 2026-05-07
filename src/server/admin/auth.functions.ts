import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { Resend } from 'resend'
import { getDb } from '@/db'
import { otpCodes } from '@/db/schema'
import { AdminAuthError, getAllowedAdminEmails, requireAdmin, useAdminSession } from './auth.server'

type EmailInput = {
	email: string
}

type VerifyOtpInput = EmailInput & {
	otp: string
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase()
}

export const requireAdminFn = createServerFn({ method: 'GET' }).handler(async () => {
	try {
		return await requireAdmin()
	} catch (error) {
		if (error instanceof AdminAuthError) {
			return null
		}

		throw error
	}
})

export const requestOtpFn = createServerFn({ method: 'POST' })
	.inputValidator((data: EmailInput) => data)
	.handler(async ({ data }) => {
		const email = normalizeEmail(data.email)
		const allowedEmails = getAllowedAdminEmails()

		if (!allowedEmails.includes(email)) {
			return { error: 'Not authorized' }
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString()
		const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
		const db = await getDb()

		await db.delete(otpCodes).where(eq(otpCodes.email, email)).run()
		await db
			.insert(otpCodes)
			.values({
				email,
				otp,
				createdAt: new Date().toISOString(),
				expiresAt,
			})
			.run()

		try {
			const resend = new Resend(process.env.RESEND_API_KEY)

			await resend.emails.send({
				from: `SouthAsianFashion Login Code <${process.env.SENDER_EMAIL}>`,
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
		} catch (error) {
			console.error(error)
			return { error: 'Failed to send OTP' }
		}
	})

export const verifyOtpFn = createServerFn({ method: 'POST' })
	.inputValidator((data: VerifyOtpInput) => data)
	.handler(async ({ data }) => {
		const email = normalizeEmail(data.email)
		const db = await getDb()

		const record = await db.query.otpCodes.findFirst({
			where: and(eq(otpCodes.email, email), eq(otpCodes.otp, data.otp.trim())),
		})

		if (!record) {
			return { error: 'Invalid OTP' }
		}

		if (new Date(record.expiresAt) < new Date()) {
			return { error: 'OTP expired' }
		}

		await db.delete(otpCodes).where(eq(otpCodes.email, email)).run()

		const session = await useAdminSession()
		await session.update({ email })

		return { success: true }
	})

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
	const session = await useAdminSession()
	await session.clear()

	return { success: true }
})
