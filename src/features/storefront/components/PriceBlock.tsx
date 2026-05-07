'use client'

import PremiumPriceDisplay from '@/features/storefront/components/PremiumPriceDisplay'
import type { ProductPricePreview } from '@/lib/discounts'

export default function PriceBlock({
	price,
	pricing,
	compact = true,
}: {
	price: number
	pricing?: ProductPricePreview
	compact?: boolean
}) {
	return (
		<PremiumPriceDisplay
			compact={compact}
			currency="CAD"
			originalPrice={pricing?.originalPrice ?? price}
			discountedPrice={pricing?.discountedPrice ?? price}
			savingsAmount={pricing?.savingsAmount ?? 0}
			savingsPercent={pricing?.savingsPercent ?? 0}
			discountText={pricing?.discountText}
			badgeText={compact ? undefined : pricing?.badgeText}
			endDate={pricing?.endDate}
		/>
	)
}
