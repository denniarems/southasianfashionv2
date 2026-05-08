'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar'
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle'
import MailIcon from 'lucide-react/dist/esm/icons/mail'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import PhoneIcon from 'lucide-react/dist/esm/icons/phone'
import RulerIcon from 'lucide-react/dist/esm/icons/ruler'
import SendIcon from 'lucide-react/dist/esm/icons/send'
import UserIcon from 'lucide-react/dist/esm/icons/user'
import { toast } from 'sonner'
import { trackAnalyticsEvent } from '@/lib/analytics'
import { submitCustomEnquiryFn } from '@/server/custom-enquiries.functions'

type CustomizationForm = {
	customerName: string
	customerEmail: string
	customerPhone: string
	requestedStartLocal: string
	requestedTimezone: string
	measurements: string
	preferredSize: string
	blouseNotes: string
	generalNotes: string
}

const DEFAULT_TIMEZONE = 'America/Toronto'

function currentLocalDateTimeValue() {
	const now = new Date()
	now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
	return now.toISOString().slice(0, 16)
}

export default function CustomizationInquiry({
	productId,
	productSlug,
	productName,
	productUrl,
	whatsappNumber,
	category,
}: {
	productId: string
	productSlug?: string | null
	productName: string
	productUrl: string
	whatsappNumber?: string | null
	category?: string | null
}) {
	const submitCustomEnquiry = useServerFn(submitCustomEnquiryFn)
	const [form, setForm] = useState<CustomizationForm>({
		customerName: '',
		customerEmail: '',
		customerPhone: '',
		requestedStartLocal: '',
		requestedTimezone: DEFAULT_TIMEZONE,
		measurements: '',
		preferredSize: '',
		blouseNotes: '',
		generalNotes: '',
	})
	const [minimumStart, setMinimumStart] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const trackedStart = useRef(false)
	const whatsapp = whatsappNumber?.replace(/[^0-9]/g, '') || ''

	useEffect(() => {
		setMinimumStart(currentLocalDateTimeValue())
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
		if (timezone) {
			setForm((prev) => ({ ...prev, requestedTimezone: timezone }))
		}
	}, [])

	const markStarted = () => {
		if (trackedStart.current) return
		trackedStart.current = true
		trackAnalyticsEvent({
			eventName: 'customization_start',
			productId,
			productSlug: productSlug || undefined,
			category: category || undefined,
		})
	}

	const message = useMemo(() => {
		const lines = [
			`Hello, I submitted a private fitting request for ${productName}.`,
			`Product: ${productUrl}`,
			form.requestedStartLocal ? `Appointment time: ${form.requestedStartLocal}` : '',
			form.preferredSize ? `Preferred size: ${form.preferredSize}` : '',
			form.measurements ? `Measurements: ${form.measurements}` : '',
			form.blouseNotes ? `Blouse/sleeve/neckline notes: ${form.blouseNotes}` : '',
			form.generalNotes ? `Additional notes: ${form.generalNotes}` : '',
		].filter(Boolean)
		return lines.join('\n')
	}, [form, productName, productUrl])

	const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : '#'

	const updateField = (field: keyof CustomizationForm, value: string) => {
		markStarted()
		setSubmitted(false)
		setForm((prev) => ({ ...prev, [field]: value }))
	}

	const submitForm = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		markStarted()

		if (!form.customerName.trim() || !form.customerEmail.trim() || !form.requestedStartLocal) {
			toast.error('Name, email, and appointment time are required')
			return
		}

		setSubmitting(true)
		try {
			const result = await submitCustomEnquiry({
				data: {
					...form,
					productId,
					productSlug: productSlug || '',
					productName,
					productUrl,
				},
			})

			if (result.error) {
				toast.error(result.error)
				return
			}

			setSubmitted(true)
			if (result.warning) {
				toast.warning(`Private fitting request saved. ${result.warning}`)
			} else {
				toast.success('Private fitting request sent for atelier review')
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to submit private fitting request')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form onSubmit={submitForm} className="mt-8 border border-stone-200 bg-stone-50 p-5 md:p-6">
			<div className="mb-5">
				<p className="font-heading text-xl text-stone-900">Private Fitting Request</p>
				<p className="mt-1 text-sm leading-relaxed text-stone-500">
					Share your appointment time, fit notes, and maker-review details.
				</p>
			</div>

			{submitted ? (
				<div className="mb-5 flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
					<CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
					<p>
						Your private fitting request is saved. The atelier will review it and confirm the
						appointment.
					</p>
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label className="block">
					<span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						<UserIcon size={14} />
						Name
					</span>
					<input
						type="text"
						value={form.customerName}
						onChange={(event) => updateField('customerName', event.target.value)}
						placeholder="Your full name"
						required
						className="h-11 w-full border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
				<label className="block">
					<span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						<MailIcon size={14} />
						Email
					</span>
					<input
						type="email"
						value={form.customerEmail}
						onChange={(event) => updateField('customerEmail', event.target.value)}
						placeholder="you@example.com"
						required
						className="h-11 w-full border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
				<label className="block">
					<span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						<PhoneIcon size={14} />
						Phone / Direct Message
					</span>
					<input
						type="tel"
						value={form.customerPhone}
						onChange={(event) => updateField('customerPhone', event.target.value)}
						placeholder="+1 555 000 0000"
						className="h-11 w-full border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
				<label className="block">
					<span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						<CalendarIcon size={14} />
						Appointment Time
					</span>
					<input
						type="datetime-local"
						value={form.requestedStartLocal}
						min={minimumStart}
						onChange={(event) => updateField('requestedStartLocal', event.target.value)}
						required
						className="h-11 w-full border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
				<label className="block">
					<span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						<RulerIcon size={14} />
						Preferred Size
					</span>
					<input
						type="text"
						value={form.preferredSize}
						onChange={(event) => updateField('preferredSize', event.target.value)}
						placeholder="XS, S, M, L, custom"
						className="h-11 w-full border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
			</div>

			<div className="mt-4 space-y-4">
				<label className="block">
					<span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						Measurements
					</span>
					<textarea
						value={form.measurements}
						onChange={(event) => updateField('measurements', event.target.value)}
						placeholder="Bust, waist, hip, length, shoulder, or garment reference"
						rows={3}
						className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
				<label className="block">
					<span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						Blouse, Sleeve, Neckline
					</span>
					<textarea
						value={form.blouseNotes}
						onChange={(event) => updateField('blouseNotes', event.target.value)}
						placeholder="Sleeve length, neckline depth, lining, back closure, or modesty notes"
						rows={3}
						className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
				<label className="block">
					<span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						General Notes
					</span>
					<textarea
						value={form.generalNotes}
						onChange={(event) => updateField('generalNotes', event.target.value)}
						placeholder="Color preference, styling ideas, timeline, or matching jewelry"
						rows={3}
						className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors focus:border-stone-500"
					/>
				</label>
			</div>

			<div className="mt-5 flex flex-col gap-3 sm:flex-row">
				<button
					type="submit"
					disabled={submitting}
					className="inline-flex w-full items-center justify-center gap-3 bg-stone-900 px-8 py-4 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
				>
					<SendIcon size={16} />
					{submitting ? 'Sending...' : 'Send Private Fitting Request'}
				</button>
				<a
					href={whatsappHref}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(event) => {
						if (!whatsapp) {
							event.preventDefault()
							return
						}
						trackAnalyticsEvent({
							eventName: 'whatsapp_click',
							productId,
							productSlug: productSlug || undefined,
							category: category || undefined,
						})
					}}
					className="inline-flex w-full items-center justify-center gap-3 border border-stone-300 bg-white px-8 py-4 text-xs font-semibold uppercase tracking-widest text-stone-900 transition-colors hover:border-stone-900 hover:bg-stone-100 sm:w-auto"
				>
					<MessageCircleIcon size={16} />
					Message Atelier
				</a>
			</div>
		</form>
	)
}
