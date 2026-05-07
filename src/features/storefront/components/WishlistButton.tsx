'use client'

import { useEffect, useState } from 'react'
import HeartIcon from 'lucide-react/dist/esm/icons/heart'
import { cn } from '@/lib/utils'
import { trackAnalyticsEvent } from '@/lib/analytics'

export const WISHLIST_STORAGE_KEY = 'saf:wishlist:v1'

function readWishlist() {
	if (typeof window === 'undefined') return [] as string[]
	try {
		const parsed = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]')
		return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
	} catch {
		return []
	}
}

function writeWishlist(ids: string[]) {
	window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids.slice(0, 200)))
	window.dispatchEvent(new CustomEvent('saf:wishlist-change', { detail: ids }))
}

export default function WishlistButton({
	productId,
	productSlug,
	productName,
	category,
	className,
}: {
	productId: string
	productSlug?: string | null
	productName: string
	category?: string | null
	className?: string
}) {
	const [saved, setSaved] = useState(false)

	useEffect(() => {
		const sync = () => setSaved(readWishlist().includes(productId))
		sync()
		window.addEventListener('storage', sync)
		window.addEventListener('saf:wishlist-change', sync)
		return () => {
			window.removeEventListener('storage', sync)
			window.removeEventListener('saf:wishlist-change', sync)
		}
	}, [productId])

	const toggle = () => {
		const current = readWishlist()
		const next = current.includes(productId)
			? current.filter((id) => id !== productId)
			: [productId, ...current]
		writeWishlist(next)
		setSaved(next.includes(productId))
		trackAnalyticsEvent({
			eventName: 'wishlist_toggle',
			productId,
			productSlug: productSlug || undefined,
			category: category || undefined,
			value: next.includes(productId) ? 1 : 0.5,
		})
	}

	return (
		<button
			type="button"
			onClick={toggle}
			aria-pressed={saved}
			aria-label={`${saved ? 'Remove' : 'Save'} ${productName}`}
			className={cn(
				'inline-flex h-10 w-10 items-center justify-center border border-white/70 bg-white/90 text-stone-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white',
				saved ? 'text-[#7A1E2C]' : 'text-stone-700',
				className,
			)}
		>
			<HeartIcon size={17} fill={saved ? 'currentColor' : 'none'} />
		</button>
	)
}
