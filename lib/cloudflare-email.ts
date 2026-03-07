import { EmailMessage } from 'cloudflare:email'
import { env } from 'cloudflare:workers'
import { getSenderEmail } from '@/lib/runtime-env'

function createOtpEmailMarkup(otp: string) {
	return {
		subject: 'SouthAsianFashion Admin - Your Login Code',
		text: [
			'SouthAsianFashion Admin Portal',
			'',
			`Your verification code is: ${otp}`,
			'',
			'This code expires in 10 minutes.',
		].join('\n'),
		html: `
<div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px; text-align: center;">
	<h1 style="color: #1c1917; font-size: 24px; margin-bottom: 8px;">SouthAsianFashion</h1>
	<p style="color: #a16207; font-style: italic; margin-bottom: 32px;">Admin Portal</p>
	<p style="color: #57534e; font-size: 14px;">Your verification code is:</p>
	<h2 style="color: #1c1917; font-size: 36px; letter-spacing: 8px; margin: 16px 0;">${otp}</h2>
	<p style="color: #a8a29e; font-size: 12px;">This code expires in 10 minutes.</p>
</div>`.trim(),
	}
}

function createRawEmail(input: {
	from: string
	to: string
	subject: string
	text: string
	html: string
}) {
	const boundary = `saf-boundary-${crypto.randomUUID()}`
	const messageId = `<${crypto.randomUUID()}@southasianfashion.ca>`
	const date = new Date().toUTCString()

	return [
		`From: SouthAsianFashion <${input.from}>`,
		`To: ${input.to}`,
		`Subject: ${input.subject}`,
		`Message-ID: ${messageId}`,
		`Date: ${date}`,
		'MIME-Version: 1.0',
		`Content-Type: multipart/alternative; boundary="${boundary}"`,
		'',
		`--${boundary}`,
		'Content-Type: text/plain; charset=UTF-8',
		'Content-Transfer-Encoding: 7bit',
		'',
		input.text,
		'',
		`--${boundary}`,
		'Content-Type: text/html; charset=UTF-8',
		'Content-Transfer-Encoding: 7bit',
		'',
		input.html,
		'',
		`--${boundary}--`,
		'',
	].join('\r\n')
}

export async function sendOtpEmail(to: string, otp: string) {
	const from = getSenderEmail()
	const payload = createOtpEmailMarkup(otp)
	const rawEmail = createRawEmail({
		from,
		to,
		subject: payload.subject,
		text: payload.text,
		html: payload.html,
	})

	await env.OTP_EMAIL.send(new EmailMessage(from, to, rawEmail))
}
