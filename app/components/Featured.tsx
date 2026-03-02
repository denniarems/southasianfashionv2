'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import { AddToCartButton } from '@/components/cart/AddToCartButton'

interface Product {
	id: string
	slug?: string
	name: string
	description: string | null
	price: number
	currency: string
	imageUrl: string | null
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

	return (
		<section id="featured" data-testid="featured-section" className="py-24 md:py-32">
			<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
					<motion.div
						initial={{ opacity: 0, x: -40 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
						className="relative overflow-hidden aspect-3/4"
					>
						{item.imageUrl && (
							<Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
						)}
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 40 }}
						whileInView={{ opacity: 1, x: 0 }}
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
						<p className="font-heading text-2xl text-stone-900 mb-10">
							{item.currency} {item.price?.toLocaleString()}
						</p>
						<div className="flex flex-col sm:flex-row gap-3">
							<AddToCartButton
								product={{
									id: item.id,
									name: item.name,
									slug: item.slug,
									price: item.price,
									currency: item.currency,
									imageUrl: item.imageUrl,
								}}
								className="inline-flex items-center justify-center gap-3 bg-stone-900 text-white px-10 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
							/>

							<a
								href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello! I'm interested in the ${item.name}. Could you share more details?`)}`}
								target="_blank"
								rel="noopener noreferrer"
								data-testid="featured-whatsapp-btn"
								className="inline-flex items-center justify-center gap-3 bg-stone-900 text-white px-10 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
							>
								<MessageCircleIcon size={16} />
								Inquire Now
							</a>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	)
}
