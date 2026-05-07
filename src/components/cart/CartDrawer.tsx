'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import MinusIcon from 'lucide-react/dist/esm/icons/minus'
import PlusIcon from 'lucide-react/dist/esm/icons/plus'
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2'
import XIcon from 'lucide-react/dist/esm/icons/x'
import { useCart } from '@/components/cart/CartContext'
import { LoadingImage } from '@/components/ui/loading-image'
import { formatCad } from '@/lib/currency'
import { trackAnalyticsEvent } from '@/lib/analytics'

function formatMoney(amount: number) {
	return formatCad(Math.round(amount))
}

function buildWhatsAppMessage({
	items,
	total,
}: {
	items: Array<{
		name: string
		quantity: number
		price: number
		currency: string
	}>
	total: number
}) {
	const lines = items.map((item, index) => {
		const lineTotal = item.price * item.quantity
		return `${index + 1}) ${item.name} — Qty: ${item.quantity} — ${formatMoney(item.price)} each — Line: ${formatMoney(lineTotal)}`
	})

	const totalLine = `Total: ${formatMoney(total)}`

	return [
		'Hello! I would like to inquire about these cart items:',
		'',
		...lines,
		'',
		totalLine,
	].join('\n')
}

function useAnimatedNumber(value: number) {
	const [displayValue, setDisplayValue] = useState(value)
	const previousValueRef = useRef(value)

	useEffect(() => {
		const start = previousValueRef.current
		const distance = value - start
		const startedAt = performance.now()
		let frame = 0

		const tick = (now: number) => {
			const progress = Math.min((now - startedAt) / 380, 1)
			const eased = 1 - Math.pow(1 - progress, 3)
			setDisplayValue(start + distance * eased)
			if (progress < 1) {
				frame = requestAnimationFrame(tick)
			} else {
				previousValueRef.current = value
			}
		}

		frame = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(frame)
	}, [value])

	return displayValue
}

export function CartDrawer({
	open,
	onOpenChange,
	whatsappNumber,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	whatsappNumber?: string | null
}) {
	const { items, subtotal, clearCart, removeItem, updateQuantity, itemCount } = useCart()
	const animatedSubtotal = useAnimatedNumber(subtotal)

	const sanitizedWhatsApp = useMemo(
		() => whatsappNumber?.replace(/[^0-9]/g, '') || '',
		[whatsappNumber],
	)

	const whatsappHref = useMemo(() => {
		if (!sanitizedWhatsApp || items.length === 0) {
			return ''
		}

		const message = buildWhatsAppMessage({
			items,
			total: subtotal,
		})

		return `https://wa.me/${sanitizedWhatsApp}?text=${encodeURIComponent(message)}`
	}, [items, sanitizedWhatsApp, subtotal])

	useEffect(() => {
		if (!open) {
			return
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onOpenChange(false)
			}
		}

		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [onOpenChange, open])

	return (
		<AnimatePresence>
			{open && (
				<>
					<motion.button
						type="button"
						aria-label="Close cart"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={() => onOpenChange(false)}
						className="fixed inset-0 z-70 bg-black/50"
					/>

					<motion.aside
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', damping: 28, stiffness: 280 }}
						className="fixed right-0 top-0 z-80 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
					>
						<div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
							<div>
								<p className="font-heading text-xl text-stone-900">Your Cart</p>
								<p className="text-xs uppercase tracking-widest text-stone-400 mt-1">
									<motion.span
										key={itemCount}
										initial={{ y: -4, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ duration: 0.18 }}
										className="inline-block"
									>
										{itemCount}
									</motion.span>{' '}
									item{itemCount === 1 ? '' : 's'}
								</p>
							</div>
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
								aria-label="Close cart drawer"
							>
								<XIcon size={18} />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto px-5 py-4">
							{items.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-center">
									<p className="font-heading text-2xl text-stone-900 mb-2">Cart is empty</p>
									<p className="text-stone-500 text-sm">
										Add some pieces to start your order inquiry.
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{items.map((item) => (
										<div key={item.id} className="border border-stone-200 p-3 rounded-sm">
											<div className="flex gap-3">
												<div className="relative w-16 h-20 bg-stone-100 shrink-0 overflow-hidden">
													{item.imageUrl ? (
														<LoadingImage
															src={item.imageUrl}
															alt={item.name}
															fill
															sizes="64px"
															className="object-cover"
														/>
													) : null}
												</div>
												<div className="min-w-0 flex-1">
													<p className="font-heading text-base text-stone-900 truncate">
														{item.name}
													</p>
													<p className="text-sm text-stone-500 mt-1">{formatMoney(item.price)}</p>
													<div className="mt-3 flex items-center justify-between">
														<div className="inline-flex items-center border border-stone-200">
															<button
																type="button"
																onClick={() => updateQuantity(item.id, item.quantity - 1)}
																className="px-2 py-1 text-stone-500 hover:text-stone-900"
																aria-label={`Decrease quantity for ${item.name}`}
															>
																<MinusIcon size={14} />
															</button>
															<span className="px-3 text-sm text-stone-900">{item.quantity}</span>
															<button
																type="button"
																onClick={() => updateQuantity(item.id, item.quantity + 1)}
																className="px-2 py-1 text-stone-500 hover:text-stone-900"
																aria-label={`Increase quantity for ${item.name}`}
															>
																<PlusIcon size={14} />
															</button>
														</div>

														<button
															type="button"
															onClick={() => removeItem(item.id)}
															className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-stone-400 hover:text-red-600 transition-colors"
														>
															<Trash2Icon size={14} />
															Remove
														</button>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="border-t border-stone-200 px-5 py-4 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-stone-500 text-sm">Subtotal</span>
								<span className="font-heading text-xl text-stone-900">
									{formatMoney(animatedSubtotal)}
								</span>
							</div>

							<button
								type="button"
								disabled
								title="Checkout is coming soon"
								className="w-full bg-stone-300 text-stone-600 px-4 py-3 text-xs uppercase tracking-widest font-semibold cursor-not-allowed"
							>
								Checkout (Coming Soon)
							</button>

							<a
								href={whatsappHref || '#'}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(event) => {
									if (!whatsappHref) {
										event.preventDefault()
										return
									}
									trackAnalyticsEvent({
										eventName: 'whatsapp_click',
										route: '/cart',
										value: items.length,
									})
								}}
								className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs uppercase tracking-widest font-semibold transition-colors ${
									whatsappHref
										? 'bg-stone-900 text-white hover:bg-yellow-700'
										: 'bg-stone-200 text-stone-500 cursor-not-allowed'
								}`}
							>
								<MessageCircleIcon size={14} />
								Inquire Now via WhatsApp
							</a>

							<button
								type="button"
								onClick={clearCart}
								disabled={items.length === 0}
								className="w-full border border-stone-300 text-stone-600 px-4 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Clear Cart
							</button>
						</div>
					</motion.aside>
				</>
			)}
		</AnimatePresence>
	)
}
