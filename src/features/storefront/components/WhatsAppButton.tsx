'use client'

import { useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'

interface Settings {
	whatsappNumber?: string | null
	whatsappMessage?: string | null
}

export default function WhatsAppButton({ settings }: { settings?: Settings }) {
	const [open, setOpen] = useState(false)
	const whatsapp = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || ''
	const message =
		settings?.whatsappMessage || 'Hello, I would like to start a private fitting with the atelier.'

	return (
		<div
			className="fixed bottom-4 right-4 z-50 sm:bottom-8 sm:right-8"
			data-testid="whatsapp-widget"
		>
			<AnimatePresence>
				{open && (
					<m.div
						initial={{ opacity: 0, y: 10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.95 }}
						transition={{ duration: 0.3 }}
						className="absolute bottom-14 right-0 mb-4 w-[calc(100vw-2rem)] max-w-72 border border-stone-200 bg-white p-5 shadow-lg sm:bottom-16 sm:w-72 sm:p-6"
					>
						<p className="font-heading text-lg text-stone-900 mb-2">Start a Private Fitting</p>
						<p className="text-stone-500 text-sm mb-4 leading-relaxed">
							Send your occasion, timeline, and fit notes directly to the atelier.
						</p>
						<a
							href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
							target="_blank"
							rel="noopener noreferrer"
							data-testid="whatsapp-chat-link"
							className="block bg-stone-900 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.13em] text-white transition-colors duration-300 hover:bg-yellow-700 sm:text-xs sm:tracking-widest"
						>
							Message the Atelier
						</a>
					</m.div>
				)}
			</AnimatePresence>

			<button
				data-testid="whatsapp-toggle-btn"
				onClick={() => setOpen(!open)}
				className="flex size-12 items-center justify-center bg-stone-900 text-white shadow-lg transition-colors duration-300 hover:bg-yellow-700 sm:h-14 sm:w-14"
			>
				{open ? <X size={20} /> : <MessageCircle size={20} />}
			</button>
		</div>
	)
}
