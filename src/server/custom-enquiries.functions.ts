import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { Resend, type CreateEmailOptions } from 'resend'
import { getDb } from '@/db'
import { customEnquiries } from '@/db/schema'
import {
	asRecord,
	optionalString,
	requiredString,
	stringWithDefault,
} from './admin/input-validators'
import { getAllowedAdminEmails, requireAdmin } from './admin/auth.server'

const DEFAULT_TIMEZONE = 'America/Toronto'
const APPOINTMENT_DURATION_MINUTES = 30
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const intlWithSupportedValues = Intl as typeof Intl & {
	supportedValuesOf?: (key: 'timeZone') => string[]
}
const SUPPORTED_TIMEZONES = new Set([
	...(typeof intlWithSupportedValues.supportedValuesOf === 'function'
		? intlWithSupportedValues.supportedValuesOf('timeZone')
		: [DEFAULT_TIMEZONE]),
	'UTC',
	DEFAULT_TIMEZONE,
])

type PublicCustomEnquiryInput = {
	customerName: string
	customerEmail: string
	customerPhone: string
	productId: string
	productSlug: string
	productName: string
	productUrl: string
	requestedStartLocal: string
	requestedTimezone: string
	preferredSize: string
	measurements: string
	blouseNotes: string
	generalNotes: string
}

type AdminEnquiryActionInput = {
	id: string
	adminNote: string
}

type CustomEnquiryRow = typeof customEnquiries.$inferSelect

export type CustomEnquiryAdminRow = CustomEnquiryRow

function normalizeEmail(value: unknown, label: string) {
	const email = requiredString(value, label).toLowerCase()
	if (!EMAIL_PATTERN.test(email)) {
		throw new Error(`${label} must be a valid email address`)
	}
	return email
}

function normalizeTimezone(value: unknown) {
	const timezone = optionalString(value) || DEFAULT_TIMEZONE
	if (!SUPPORTED_TIMEZONES.has(timezone)) {
		throw new Error('Appointment timezone is invalid')
	}

	return timezone
}

function normalizeLocalDateTime(value: unknown) {
	const dateTime = requiredString(value, 'Appointment date and time')
	const match = LOCAL_DATE_TIME_PATTERN.exec(dateTime)
	if (!match) {
		throw new Error('Appointment date and time is required')
	}

	const [, year, month, day, hour, minute] = match
	const parsed = new Date(
		Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)),
	)

	if (
		parsed.getUTCFullYear() !== Number(year) ||
		parsed.getUTCMonth() !== Number(month) - 1 ||
		parsed.getUTCDate() !== Number(day) ||
		parsed.getUTCHours() !== Number(hour) ||
		parsed.getUTCMinutes() !== Number(minute)
	) {
		throw new Error('Appointment date and time is invalid')
	}

	if (Number(hour) > 23 || Number(minute) > 59) {
		throw new Error('Appointment date and time is invalid')
	}

	return `${year}-${month}-${day}T${hour}:${minute}`
}

function assertNotPastAppointment(dateTime: string) {
	const parsed = new Date(dateTime)
	if (Number.isNaN(parsed.getTime())) {
		throw new Error('Appointment date and time is invalid')
	}

	if (parsed.getTime() < Date.now() - 60_000) {
		throw new Error('Appointment date and time must be in the future')
	}
}

function parsePublicCustomEnquiryInput(value: unknown): PublicCustomEnquiryInput {
	const input = asRecord(value, 'Private fitting request')
	const requestedStartLocal = normalizeLocalDateTime(input.requestedStartLocal)
	assertNotPastAppointment(requestedStartLocal)

	return {
		customerName: requiredString(input.customerName, 'Customer name'),
		customerEmail: normalizeEmail(input.customerEmail, 'Customer email'),
		customerPhone: stringWithDefault(input.customerPhone),
		productId: requiredString(input.productId, 'Product ID'),
		productSlug: stringWithDefault(input.productSlug),
		productName: requiredString(input.productName, 'Product name'),
		productUrl: requiredString(input.productUrl, 'Product URL'),
		requestedStartLocal,
		requestedTimezone: normalizeTimezone(input.requestedTimezone),
		preferredSize: stringWithDefault(input.preferredSize),
		measurements: stringWithDefault(input.measurements),
		blouseNotes: stringWithDefault(input.blouseNotes),
		generalNotes: stringWithDefault(input.generalNotes),
	}
}

function parseAdminEnquiryActionInput(value: unknown): AdminEnquiryActionInput {
	const input = asRecord(value, 'Private fitting request action')
	return {
		id: requiredString(input.id, 'Request ID'),
		adminNote: stringWithDefault(input.adminNote),
	}
}

function escapeHtml(value: unknown) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function escapeIcs(value: unknown) {
	return String(value ?? '')
		.replace(/\\/g, '\\\\')
		.replace(/\r?\n/g, '\\n')
		.replace(/,/g, '\\,')
		.replace(/;/g, '\\;')
}

function foldIcsLine(line: string) {
	const lines = []
	let remaining = line

	while (remaining.length > 75) {
		lines.push(remaining.slice(0, 75))
		remaining = ` ${remaining.slice(75)}`
	}

	lines.push(remaining)
	return lines.join('\r\n')
}

function formatIcsDateTime(localDateTime: string) {
	return `${localDateTime.replace(/[-:]/g, '')}00`
}

function formatIcsUtc(date: Date) {
	return date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}Z$/, 'Z')
}

function addMinutesToLocalDateTime(localDateTime: string, minutesToAdd: number) {
	const match = LOCAL_DATE_TIME_PATTERN.exec(localDateTime)
	if (!match) return localDateTime

	const [, year, month, day, hour, minute] = match
	const parsed = new Date(
		Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)),
	)
	parsed.setUTCMinutes(parsed.getUTCMinutes() + minutesToAdd)

	const pad = (value: number) => String(value).padStart(2, '0')
	return [
		parsed.getUTCFullYear(),
		'-',
		pad(parsed.getUTCMonth() + 1),
		'-',
		pad(parsed.getUTCDate()),
		'T',
		pad(parsed.getUTCHours()),
		':',
		pad(parsed.getUTCMinutes()),
	].join('')
}

function formatLocalDateTimeForEmail(
	enquiry: Pick<CustomEnquiryRow, 'requestedStartLocal' | 'requestedTimezone'>,
) {
	const [date, time] = enquiry.requestedStartLocal.split('T')
	return `${date} at ${time}`
}

function senderFromAddress() {
	const configured = process.env.SENDER_EMAIL?.trim() || 'admin@example.com'
	return configured.includes('<') ? configured : `SouthAsianFashion <${configured}>`
}

function senderEmailAddress() {
	const configured = process.env.SENDER_EMAIL?.trim() || 'admin@example.com'
	const match = /<([^>]+)>/.exec(configured)
	return match?.[1]?.trim() || configured
}

function siteUrl() {
	return (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function adminEnquiriesUrl() {
	return `${siteUrl()}/admin/custom-enquiries`
}

async function sendEmail(payload: CreateEmailOptions) {
	const apiKey = process.env.RESEND_API_KEY?.trim()
	if (!apiKey || apiKey.includes('replace-with')) {
		throw new Error('RESEND_API_KEY is not configured')
	}

	const result = await new Resend(apiKey).emails.send(payload)
	if (result.error) {
		throw new Error(result.error.message)
	}

	return result.data?.id || ''
}

function enquiryDetailsHtml(enquiry: CustomEnquiryRow, adminNote?: string) {
	const rows = [
		['Customer', enquiry.customerName],
		['Email', enquiry.customerEmail],
		['Phone', enquiry.customerPhone || 'Not provided'],
		['Product', enquiry.productName],
		['Appointment', formatLocalDateTimeForEmail(enquiry)],
		['Preferred size', enquiry.preferredSize || 'Not provided'],
		['Measurements', enquiry.measurements || 'Not provided'],
		['Blouse notes', enquiry.blouseNotes || 'Not provided'],
		['General notes', enquiry.generalNotes || 'Not provided'],
		['Admin note', adminNote || enquiry.adminNote || 'Not provided'],
	]

	return `
		<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
			${rows
				.map(
					([label, value]) => `
						<tr>
							<td style="width:150px; padding:10px 0; color:#78716c; font-size:12px; text-transform:uppercase; letter-spacing:1px; vertical-align:top;">${escapeHtml(label)}</td>
							<td style="padding:10px 0; color:#1c1917; font-size:14px; line-height:1.5; white-space:pre-wrap;">${escapeHtml(value)}</td>
						</tr>
					`,
				)
				.join('')}
		</table>
	`
}

function emailShell(title: string, intro: string, body: string) {
	return `
		<div style="font-family:Georgia, serif; max-width:640px; margin:0 auto; padding:40px; background:#fff;">
			<p style="margin:0 0 8px; color:#a16207; font-size:12px; letter-spacing:3px; text-transform:uppercase;">SouthAsianFashion</p>
			<h1 style="margin:0 0 16px; color:#1c1917; font-size:28px; line-height:1.2;">${escapeHtml(title)}</h1>
			<p style="margin:0 0 28px; color:#57534e; font-family:Arial, sans-serif; font-size:14px; line-height:1.6;">${escapeHtml(intro)}</p>
			${body}
		</div>
	`
}

function buildCalendarInvite(enquiry: CustomEnquiryRow, adminNote?: string) {
	const start = formatIcsDateTime(enquiry.requestedStartLocal)
	const end = formatIcsDateTime(
		addMinutesToLocalDateTime(enquiry.requestedStartLocal, APPOINTMENT_DURATION_MINUTES),
	)
	const description = [
		`Private fitting request for ${enquiry.productName}`,
		`Product: ${enquiry.productUrl}`,
		enquiry.preferredSize ? `Preferred size: ${enquiry.preferredSize}` : '',
		enquiry.measurements ? `Measurements: ${enquiry.measurements}` : '',
		enquiry.blouseNotes ? `Blouse notes: ${enquiry.blouseNotes}` : '',
		enquiry.generalNotes ? `General notes: ${enquiry.generalNotes}` : '',
		adminNote ? `Admin note: ${adminNote}` : '',
	].filter(Boolean)

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//SouthAsianFashion//Private Fitting//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:REQUEST',
		'BEGIN:VEVENT',
		`UID:${escapeIcs(enquiry.id)}@southasianfashion.ca`,
		`DTSTAMP:${formatIcsUtc(new Date())}`,
		`DTSTART;TZID=${escapeIcs(enquiry.requestedTimezone)}:${start}`,
		`DTEND;TZID=${escapeIcs(enquiry.requestedTimezone)}:${end}`,
		`SUMMARY:${escapeIcs(`SouthAsianFashion private fitting - ${enquiry.productName}`)}`,
		`DESCRIPTION:${escapeIcs(description.join('\n'))}`,
		`URL:${escapeIcs(enquiry.productUrl)}`,
		`ORGANIZER;CN=SouthAsianFashion:mailto:${senderEmailAddress()}`,
		`ATTENDEE;CN=${escapeIcs(enquiry.customerName)};RSVP=TRUE:mailto:${enquiry.customerEmail}`,
		'STATUS:CONFIRMED',
		'SEQUENCE:0',
		'END:VEVENT',
		'END:VCALENDAR',
	]

	return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

async function sendNewEnquiryAdminNotification(enquiry: CustomEnquiryRow) {
	const adminEmails = getAllowedAdminEmails()
	if (adminEmails.length === 0) {
		throw new Error('ADMIN_EMAIL is not configured')
	}

	return sendEmail({
		from: senderFromAddress(),
		to: adminEmails,
		subject: `New private fitting request - ${enquiry.productName}`,
		html: emailShell(
			'New private fitting request',
			'A customer submitted a private fitting request from the storefront.',
			`
				${enquiryDetailsHtml(enquiry)}
				<p style="margin-top:24px; font-family:Arial, sans-serif; font-size:14px;">
					<a href="${escapeHtml(adminEnquiriesUrl())}" style="color:#a16207;">Review in admin</a>
				</p>
			`,
		),
	})
}

async function sendApprovedCustomerInvite(enquiry: CustomEnquiryRow, adminNote?: string) {
	const invite = buildCalendarInvite(enquiry, adminNote)

	return sendEmail({
		from: senderFromAddress(),
		to: enquiry.customerEmail,
		subject: 'Your SouthAsianFashion private fitting is confirmed',
		html: emailShell(
			'Your private fitting is confirmed',
			`Your private fitting is scheduled for ${formatLocalDateTimeForEmail(enquiry)}. A calendar invite is attached to this email.`,
			enquiryDetailsHtml(enquiry, adminNote),
		),
		attachments: [
			{
				filename: 'southasianfashion-private-fitting.ics',
				content: invite,
				contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
			},
		],
	})
}

async function sendApprovalAdminNotification(enquiry: CustomEnquiryRow, adminNote?: string) {
	const adminEmails = getAllowedAdminEmails()
	if (adminEmails.length === 0) return ''

	return sendEmail({
		from: senderFromAddress(),
		to: adminEmails,
		subject: `Private fitting request approved - ${enquiry.productName}`,
		html: emailShell(
			'Private fitting request approved',
			'The customer has been sent a calendar invite for the approved private fitting.',
			enquiryDetailsHtml(enquiry, adminNote),
		),
	})
}

async function getEnquiryById(id: string, existingDb?: Awaited<ReturnType<typeof getDb>>) {
	const db = existingDb ?? (await getDb())
	const [enquiry] = await db
		.select()
		.from(customEnquiries)
		.where(eq(customEnquiries.id, id))
		.limit(1)

	return enquiry || null
}

function isMissingCustomEnquiriesTable(error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes('custom_enquiries') &&
		(message.includes('does not exist') ||
			message.includes('no such table') ||
			message.includes('Failed query'))
	)
}

export const submitCustomEnquiryFn = createServerFn({ method: 'POST' })
	.inputValidator(parsePublicCustomEnquiryInput)
	.handler(async ({ data }) => {
		const db = await getDb()
		const now = new Date().toISOString()
		const id = crypto.randomUUID()
		const enquiry: CustomEnquiryRow = {
			id,
			status: 'pending',
			...data,
			productId: data.productId,
			customerPhone: data.customerPhone,
			adminNote: '',
			approvedAt: null,
			approvedByEmail: null,
			rejectedAt: null,
			rejectedByEmail: null,
			invitationSentAt: null,
			invitationMessageId: null,
			adminNotificationSentAt: null,
			createdAt: now,
			updatedAt: now,
		}

		try {
			await db.insert(customEnquiries).values(enquiry).run()

			try {
				await sendNewEnquiryAdminNotification(enquiry)
				await db
					.update(customEnquiries)
					.set({
						adminNotificationSentAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					})
					.where(eq(customEnquiries.id, id))
					.run()
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Admin email notification failed'
				return { success: true, id, warning: message }
			}

			return { success: true, id }
		} catch (error) {
			if (isMissingCustomEnquiriesTable(error)) {
				return { error: 'Private fitting requests are not available yet' }
			}
			return {
				error: error instanceof Error ? error.message : 'Failed to submit private fitting request',
			}
		}
	})

export const getCustomEnquiriesAdminDataFn = createServerFn({ method: 'GET' }).handler(async () => {
	await requireAdmin()
	const db = await getDb()

	try {
		return {
			enquiries: await db.select().from(customEnquiries).orderBy(desc(customEnquiries.createdAt)),
		}
	} catch (error) {
		if (isMissingCustomEnquiriesTable(error)) {
			return { enquiries: [] as CustomEnquiryRow[], migrationMissing: true }
		}
		throw error
	}
})

export const approveCustomEnquiryFn = createServerFn({ method: 'POST' })
	.inputValidator(parseAdminEnquiryActionInput)
	.handler(async ({ data }) => {
		const [admin, db] = await Promise.all([requireAdmin(), getDb()])
		const enquiry = await getEnquiryById(data.id, db)

		if (!enquiry) return { error: 'Private fitting request not found' }
		if (enquiry.status === 'approved' && enquiry.invitationSentAt) {
			return { error: 'Private fitting request is already approved' }
		}
		if (enquiry.status === 'rejected') {
			return { error: 'Rejected requests cannot be approved' }
		}

		try {
			const messageId = await sendApprovedCustomerInvite(enquiry, data.adminNote)
			const now = new Date().toISOString()
			await db
				.update(customEnquiries)
				.set({
					status: 'approved',
					adminNote: data.adminNote,
					approvedAt: now,
					approvedByEmail: admin.email,
					rejectedAt: null,
					rejectedByEmail: null,
					invitationSentAt: now,
					invitationMessageId: messageId,
					updatedAt: now,
				})
				.where(eq(customEnquiries.id, data.id))
				.run()

			try {
				await sendApprovalAdminNotification({ ...enquiry, status: 'approved' }, data.adminNote)
			} catch (error) {
				const warning = error instanceof Error ? error.message : 'Admin approval email failed'
				return { success: true, warning }
			}

			return { success: true }
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : 'Failed to approve private fitting request',
			}
		}
	})

export const rejectCustomEnquiryFn = createServerFn({ method: 'POST' })
	.inputValidator(parseAdminEnquiryActionInput)
	.handler(async ({ data }) => {
		const [admin, db] = await Promise.all([requireAdmin(), getDb()])
		const enquiry = await getEnquiryById(data.id, db)

		if (!enquiry) return { error: 'Private fitting request not found' }
		if (enquiry.status === 'approved') {
			return { error: 'Approved requests cannot be rejected after an invite is sent' }
		}
		if (enquiry.status === 'rejected') {
			return { error: 'Private fitting request is already rejected' }
		}

		const now = new Date().toISOString()
		await db
			.update(customEnquiries)
			.set({
				status: 'rejected',
				adminNote: data.adminNote,
				rejectedAt: now,
				rejectedByEmail: admin.email,
				updatedAt: now,
			})
			.where(eq(customEnquiries.id, data.id))
			.run()

		return { success: true }
	})

export const resendCustomEnquiryInviteFn = createServerFn({ method: 'POST' })
	.inputValidator((value: unknown) => {
		const input = asRecord(value, 'Resend private fitting invite')
		return { id: requiredString(input.id, 'Request ID') }
	})
	.handler(async ({ data }) => {
		const [, db] = await Promise.all([requireAdmin(), getDb()])
		const enquiry = await getEnquiryById(data.id, db)

		if (!enquiry) return { error: 'Private fitting request not found' }
		if (enquiry.status !== 'approved') {
			return { error: 'Only approved requests can be resent' }
		}

		try {
			const messageId = await sendApprovedCustomerInvite(enquiry, enquiry.adminNote || undefined)
			const now = new Date().toISOString()
			await db
				.update(customEnquiries)
				.set({
					invitationSentAt: now,
					invitationMessageId: messageId,
					updatedAt: now,
				})
				.where(eq(customEnquiries.id, data.id))
				.run()

			return { success: true }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to resend invite' }
		}
	})
