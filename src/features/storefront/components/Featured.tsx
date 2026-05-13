'use client'

import Link from '@/components/router-link'
import { m } from 'framer-motion'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { LoadingImage } from '@/components/ui/loading-image'
import PremiumPriceDisplay from '@/features/storefront/components/PremiumPriceDisplay'
import type { ProductPricePreview } from '@/lib/discounts'
import { trackAnalyticsEvent } from '@/lib/analytics'

interface Product {
	id: string
	slug?: string
	name: string
	description: string | null
	price: number
	currency: string
	imageUrl: string | null
	pricing?: ProductPricePreview
}

interface Settings {
	whatsappNumber?: string | null
}

export default function Featured({
	products,
	settings,
}: {
	products: Product[]
	settings?: Settings
}) {
	const whatsapp = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || ''
	const item = products?.[0]

	if (!item) return null
	const itemHref = `/products/${item.slug ?? item.id}`

	return (
		<section
			id="featured"
			data-testid="featured-section"
			className="overflow-hidden py-20 sm:py-24 md:py-32"
		>
			<div className="max-w-450 mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
					<m.div
						initial={{ opacity: 0, y: 28 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
						className="relative overflow-hidden aspect-3/4"
					>
						<Link
							href={`/products/${item.slug ?? item.id}`}
							className="absolute inset-0 z-10"
							aria-label={`View ${item.name}`}
						/>
						{item.imageUrl && (
							<LoadingImage
								src={item.imageUrl}
								alt={item.name}
								fill
								sizes="(max-width: 1024px) 100vw, 50vw"
								className="object-cover"
							/>
						)}
						{item.pricing?.hasDiscount && item.pricing.badgeText ? (
							<div className="absolute top-4 left-4 z-20">
								<span className="inline-flex rounded-full border border-stone-300 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-700 discount-badge-pulse">
									{item.pricing.badgeText}
								</span>
							</div>
						) : null}
					</m.div>

					<m.div
						initial={{ opacity: 0, y: 28 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						<p className="font-accent italic text-yellow-700 text-base md:text-lg mb-4">
							Featured Piece
						</p>
						<h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-stone-900 tracking-tight mb-6">
							{item.name}
						</h2>
						<p className="text-stone-500 leading-relaxed mb-4 max-w-lg">{item.description}</p>
						<div className="mb-10">
							<PremiumPriceDisplay
								currency="CAD"
								originalPrice={item.pricing?.originalPrice ?? item.price}
								discountedPrice={item.pricing?.discountedPrice ?? item.price}
								savingsAmount={item.pricing?.savingsAmount ?? 0}
								savingsPercent={item.pricing?.savingsPercent ?? 0}
								discountText={item.pricing?.discountText}
								badgeText={item.pricing?.badgeText}
								endDate={item.pricing?.endDate}
							/>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<AddToCartButton
								product={{
									id: item.id,
									name: item.name,
									slug: item.slug,
									price: item.pricing?.discountedPrice ?? item.price,
									currency: 'CAD',
									imageUrl: item.imageUrl,
								}}
								className="inline-flex w-full items-center justify-center gap-2 bg-stone-900 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-white transition-colors duration-300 hover:bg-yellow-700 sm:w-auto sm:gap-3 sm:px-10 sm:text-xs sm:tracking-widest"
							/>

							<a
								href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello, I would like to start a private fitting for ${item.name}.\nProduct: ${itemHref}`)}`}
								target="_blank"
								rel="noopener noreferrer"
								data-testid="featured-whatsapp-btn"
								onClick={() =>
									trackAnalyticsEvent({
										eventName: 'whatsapp_click',
										productId: item.id,
										productSlug: item.slug,
									})
								}
								className="inline-flex w-full items-center justify-center gap-2 bg-stone-900 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-white transition-colors duration-300 hover:bg-yellow-700 sm:w-auto sm:gap-3 sm:px-10 sm:text-xs sm:tracking-widest"
							>
								<MessageCircleIcon size={16} />
								Start a Private Fitting
							</a>
						</div>
					</m.div>
				</div>
			</div>
		</section>
	)
}
