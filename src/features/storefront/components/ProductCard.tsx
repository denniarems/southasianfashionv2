'use client'

import Link from '@/components/router-link'
import { motion } from 'framer-motion'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { LoadingImage } from '@/components/ui/loading-image'
import type { ProductPricePreview } from '@/lib/discounts'
import { trackAnalyticsEvent } from '@/lib/analytics'
import PriceBlock from './PriceBlock'
import WishlistButton from './WishlistButton'

export type StorefrontProductCardProduct = {
	id: string
	slug?: string | null
	name: string
	category?: string | null
	price: number
	currency?: string | null
	imageUrl?: string | null
	secondaryImageUrl?: string | null
	availabilityStatus?: string | null
	isReadyToShip?: boolean | null
	pricing?: ProductPricePreview
}

export default function ProductCard({
	product,
	whatsappNumber,
	showActions = true,
	compact = false,
}: {
	product: StorefrontProductCardProduct
	whatsappNumber?: string | null
	showActions?: boolean
	compact?: boolean
}) {
	const href = `/products/${product.slug ?? product.id}`
	const whatsapp = whatsappNumber?.replace(/[^0-9]/g, '') || ''
	const price = product.pricing?.discountedPrice ?? product.price
	const availabilityLabel = product.isReadyToShip
		? 'Ready to Ship'
		: product.availabilityStatus
			? product.availabilityStatus.replace(/-/g, ' ')
			: ''
	const whatsappHref = whatsapp
		? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
				`Hello! I'm interested in ${product.name}. Could you share more details?`,
			)}`
		: '#'

	return (
		<motion.article
			layout
			className="group h-full min-w-0"
			data-testid={`product-card-${product.id}`}
			whileHover={{ y: compact ? 0 : -4 }}
			transition={{ duration: 0.24 }}
		>
			<div className="relative mb-4 overflow-hidden bg-stone-100 aspect-3/4">
				<Link href={href} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
				{product.imageUrl ? (
					<LoadingImage
						src={product.imageUrl}
						alt={product.name}
						fill
						sizes={compact ? '(max-width: 640px) 50vw, 25vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
						className="object-cover transition-transform duration-700 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-stone-400 font-accent italic">
						No Image
					</div>
				)}
				{product.secondaryImageUrl ? (
					<LoadingImage
						src={product.secondaryImageUrl}
						alt=""
						fill
						sizes={compact ? '(max-width: 640px) 50vw, 25vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
						className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					/>
				) : null}
				<div className="absolute inset-0 bg-stone-900/0 transition-colors duration-500 group-hover:bg-stone-900/10 pointer-events-none" />

				<div className="absolute right-3 top-3 z-20">
					<WishlistButton
						productId={product.id}
						productSlug={product.slug}
						productName={product.name}
						category={product.category}
					/>
				</div>

				{product.pricing?.hasDiscount && product.pricing.badgeText ? (
					<div className="absolute top-3 left-3 z-20">
						<span className="discount-badge-shimmer inline-flex border border-[#7A1E2C]/30 bg-[#FDF3D4]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B1320] shadow-sm backdrop-blur-[1px]">
							{product.pricing.badgeText}
						</span>
					</div>
				) : null}

				{showActions ? (
					<div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0 group-focus-within:translate-y-0">
						<div className="space-y-2">
							<AddToCartButton
								product={{
									id: product.id,
									name: product.name,
									slug: product.slug,
									price,
									currency: 'CAD',
									imageUrl: product.imageUrl || null,
								}}
								className="flex w-full items-center justify-center gap-2 bg-white/95 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-stone-900 backdrop-blur-sm transition-colors hover:bg-yellow-700 hover:text-white"
							/>
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
										productId: product.id,
										productSlug: product.slug || undefined,
										category: product.category || undefined,
									})
								}}
								className="flex w-full items-center justify-center gap-2 bg-white/95 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-stone-900 backdrop-blur-sm transition-colors hover:bg-yellow-700 hover:text-white"
							>
								<MessageCircleIcon size={14} />
								WhatsApp
							</a>
						</div>
					</div>
				) : null}
			</div>

			<div className="flex min-h-40 flex-col">
				<div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400">
					{product.category ? <span>{product.category}</span> : null}
					{availabilityLabel ? (
						<span className="border-l border-stone-200 pl-2 capitalize">{availabilityLabel}</span>
					) : null}
				</div>
				<Link href={href} className="block">
					<h3 className="min-h-12 font-heading text-base md:text-lg leading-tight text-stone-900 transition-colors hover:text-yellow-700 line-clamp-2">
						{product.name}
					</h3>
				</Link>
				<div className="mt-2">
					<PriceBlock compact price={product.price} pricing={product.pricing} />
				</div>
			</div>
		</motion.article>
	)
}
