'use client'

import { toast } from 'sonner'
import ShoppingCartIcon from 'lucide-react/dist/esm/icons/shopping-cart'
import { useCart } from '@/components/cart/CartContext'
import type { CartProduct } from '@/components/cart/cart-types'

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
	const buttonLabel = currentQuantity > 0 ? `Add to Cart (${currentQuantity})` : 'Add to Cart'

	return (
		<button
			type="button"
			onClick={() => {
				addItem(product, quantity)
				toast.success(`${product.name} added to cart`)
			}}
			aria-label={
				currentQuantity > 0 ? `Add to cart. Currently ${currentQuantity} in cart.` : 'Add to cart'
			}
			className={
				className ||
				'inline-flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300'
			}
		>
			<ShoppingCartIcon size={16} />
			{buttonLabel}
		</button>
	)
}
