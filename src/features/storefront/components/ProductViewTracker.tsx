'use client'

import { useEffect } from 'react'
import { trackAnalyticsEvent } from '@/lib/analytics'
import { rememberRecentProduct } from './RecentlyViewedProducts'
import type { StorefrontProductCardProduct } from './ProductCard'

export default function ProductViewTracker({ product }: { product: StorefrontProductCardProduct }) {
	useEffect(() => {
		rememberRecentProduct(product)
		trackAnalyticsEvent({
			eventName: 'product_view',
			productId: product.id,
			productSlug: product.slug || undefined,
			category: product.category || undefined,
		})
	}, [product])

	return null
}
