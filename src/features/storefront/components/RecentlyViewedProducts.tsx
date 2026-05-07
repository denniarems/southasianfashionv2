'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard, { type StorefrontProductCardProduct } from './ProductCard'
import SectionHeading from './SectionHeading'

export const RECENTLY_VIEWED_STORAGE_KEY = 'saf:recently-viewed:v1'

export type RecentlyViewedProduct = StorefrontProductCardProduct & {
	viewedAt: string
}

function readRecentProducts() {
	if (typeof window === 'undefined') return [] as RecentlyViewedProduct[]
	try {
		const parsed = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || '[]')
		if (!Array.isArray(parsed)) return []
		return parsed.filter(
			(item): item is RecentlyViewedProduct =>
				Boolean(item) &&
				typeof item === 'object' &&
				typeof item.id === 'string' &&
				typeof item.name === 'string' &&
				typeof item.price === 'number',
		)
	} catch {
		return []
	}
}

export function rememberRecentProduct(product: StorefrontProductCardProduct) {
	if (typeof window === 'undefined') return
	const current = readRecentProducts().filter((item) => item.id !== product.id)
	const next: RecentlyViewedProduct[] = [
		{ ...product, viewedAt: new Date().toISOString() },
		...current,
	].slice(0, 12)
	window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next))
	window.dispatchEvent(new CustomEvent('saf:recently-viewed-change', { detail: next }))
}

export default function RecentlyViewedProducts({
	excludeProductId,
	whatsappNumber,
}: {
	excludeProductId?: string
	whatsappNumber?: string | null
}) {
	const [products, setProducts] = useState<RecentlyViewedProduct[]>([])

	useEffect(() => {
		const sync = () => setProducts(readRecentProducts())
		sync()
		window.addEventListener('storage', sync)
		window.addEventListener('saf:recently-viewed-change', sync)
		return () => {
			window.removeEventListener('storage', sync)
			window.removeEventListener('saf:recently-viewed-change', sync)
		}
	}, [])

	const visibleProducts = useMemo(
		() => products.filter((product) => product.id !== excludeProductId).slice(0, 4),
		[excludeProductId, products],
	)

	if (visibleProducts.length === 0) return null

	return (
		<section className="border-t border-stone-200 mt-16 md:mt-20 pt-16 md:pt-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<SectionHeading kicker="Back on Your Radar" title="Recently Viewed" className="mb-10" />
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
					{visibleProducts.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
							whatsappNumber={whatsappNumber}
							compact
							showActions={false}
						/>
					))}
				</div>
			</div>
		</section>
	)
}
