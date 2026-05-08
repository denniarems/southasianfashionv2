'use client'

import { toast } from 'sonner'
import ClipboardListIcon from 'lucide-react/dist/esm/icons/clipboard-list'
import { useCart } from '@/components/cart/CartContext'
import type { CartProduct } from '@/components/cart/cart-types'
import { trackAnalyticsEvent } from '@/lib/analytics'

export function AddToCartButton({
	product,
	quantity = 1,
	className,
}: {
	product: CartProduct
	quantity?: number
	className?: string
}) {
	const { addItem, items } = useCart()
	const currentQuantity = items.find((item) => item.id === product.id)?.quantity ?? 0
	const buttonLabel =
		currentQuantity > 0 ? `Add to Atelier Brief (${currentQuantity})` : 'Add to Atelier Brief'

	return (
		<button
			type="button"
			onClick={() => {
				addItem(product, quantity)
				trackAnalyticsEvent({
					eventName: 'add_to_cart',
					productId: product.id,
					productSlug: product.slug || undefined,
					value: quantity,
				})
				toast.success(`${product.name} added to atelier brief`)
			}}
			aria-label={
				currentQuantity > 0
					? `Add to atelier brief. Currently ${currentQuantity} in brief.`
					: 'Add to atelier brief'
			}
			className={
				className ||
				'inline-flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300'
			}
		>
			<ClipboardListIcon size={16} />
			{buttonLabel}
		</button>
	)
}
