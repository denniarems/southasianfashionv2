'use client'

import { useMemo, useRef, useState } from 'react'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar'
import RulerIcon from 'lucide-react/dist/esm/icons/ruler'
import { trackAnalyticsEvent } from '@/lib/analytics'

type CustomizationForm = {
	eventDate: string
	measurements: string
	preferredSize: string
	blouseNotes: string
	generalNotes: string
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
	const [form, setForm] = useState<CustomizationForm>({
		eventDate: '',
		measurements: '',
		preferredSize: '',
		blouseNotes: '',
		generalNotes: '',
	})
	const trackedStart = useRef(false)
	const whatsapp = whatsappNumber?.replace(/[^0-9]/g, '') || ''

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
			`Hello! I would like to customize ${productName}.`,
			`Product: ${productUrl}`,
			form.eventDate ? `Event date: ${form.eventDate}` : '',
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
		setForm((prev) => ({ ...prev, [field]: value }))
	}

	return (
		<div className="mt-8 border border-stone-200 bg-stone-50 p-5 md:p-6">
			<div className="mb-5">
				<p className="font-heading text-xl text-stone-900">Customization Inquiry</p>
				<p className="mt-1 text-sm leading-relaxed text-stone-500">
					Event, fit, and finishing details for a tailored conversation.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label className="block">
					<span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
						<CalendarIcon size={14} />
						Event Date
					</span>
					<input
						type="date"
						value={form.eventDate}
						onChange={(event) => updateField('eventDate', event.target.value)}
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
				className="mt-5 inline-flex w-full items-center justify-center gap-3 bg-stone-900 px-8 py-4 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-yellow-700 sm:w-auto"
			>
				<MessageCircleIcon size={16} />
				Send Custom Inquiry
			</a>
		</div>
	)
}
