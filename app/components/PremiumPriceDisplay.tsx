'use client'

import { motion } from 'framer-motion'
import { formatCad } from '@/lib/currency'

interface PremiumPriceDisplayProps {
	currency?: string
	originalPrice: number
	discountedPrice: number
	savingsAmount: number
	savingsPercent?: number
	discountText?: string
	badgeText?: string
	endDate?: string | null
	compact?: boolean
}

function formatCurrency(currency: string, amount: number): string {
	void currency
	return formatCad(Math.round(amount))
}

function useCountdownLabel(endDate?: string | null): string | null {
	if (!endDate) return null
	const end = new Date(endDate)
	if (Number.isNaN(end.getTime())) return null

	const diff = end.getTime() - Date.now()
	if (diff <= 0) return null

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

	if (hours >= 24) {
		const days = Math.floor(hours / 24)
		return `Offer ends in ${days} day${days === 1 ? '' : 's'}`
	}

	return `Offer ends in ${hours}h ${minutes}m`
}

export default function PremiumPriceDisplay({
	currency = 'CAD',
	originalPrice,
	discountedPrice,
	savingsAmount,
	savingsPercent = 0,
	discountText,
	badgeText,
	endDate,
	compact = false,
}: PremiumPriceDisplayProps) {
	const hasDiscount = savingsAmount > 0 && discountedPrice < originalPrice
	const countdown = useCountdownLabel(endDate)

	if (!hasDiscount) {
		return (
			<p className={compact ? 'text-sm text-stone-600' : 'font-heading text-2xl text-stone-900'}>
				{formatCurrency(currency, originalPrice)}
			</p>
		)
	}

	return (
		<div className="space-y-1.5">
			{badgeText ? (
				<motion.span
					initial={{ opacity: 0, scale: 0.92 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.25 }}
					className="inline-flex rounded-full border border-[#B8860B]/40 bg-[#B8860B]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7A1E2C] discount-badge-pulse"
				>
					{badgeText}
				</motion.span>
			) : null}

			<motion.div
				key={`${originalPrice}-${discountedPrice}`}
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.22 }}
				className="flex items-end gap-2"
			>
				<span
					className={
						compact ? 'text-xs text-stone-400 line-through' : 'text-lg text-stone-400 line-through'
					}
				>
					{formatCurrency(currency, originalPrice)}
				</span>
				<span
					className={
						compact
							? 'text-base font-semibold text-stone-900'
							: 'font-heading text-3xl text-stone-900'
					}
				>
					{formatCurrency(currency, discountedPrice)}
				</span>
			</motion.div>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.05 }}
				className="text-xs uppercase tracking-[0.14em] text-[#7A1E2C]"
			>
				You Save {formatCurrency(currency, savingsAmount)}
				{savingsPercent > 0 ? ` (${Math.round(savingsPercent)}%)` : ''}
			</motion.p>

			{discountText ? <p className="text-xs text-stone-500">{discountText}</p> : null}
			{countdown ? <p className="text-[11px] text-[#7A1E2C]">{countdown}</p> : null}
		</div>
	)
}
