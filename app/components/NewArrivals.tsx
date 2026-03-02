'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

interface Product {
	id: string
	name: string
	category: string | null
	price: number
	currency: string
	imageUrl: string | null
}

interface Settings {
	whatsappNumber?: string | null
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const fadeUp = {
	hidden: { opacity: 0, y: 30 },
	show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function NewArrivals({
	products,
	settings,
}: {
	products: Product[]
	settings?: Settings
}) {
	const whatsapp = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || ''

	if (!products?.length) return null

	return (
		<section id="new-arrivals" data-testid="new-arrivals-section" className="py-24 md:py-32">
			<div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-16"
				>
					<p className="font-accent italic text-yellow-700 text-base md:text-lg mb-2">
						Just Arrived
					</p>
					<h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-stone-900 tracking-tight">
						New Arrivals
					</h2>
				</motion.div>

				<motion.div
					variants={stagger}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
				>
					{products.map((p) => (
						<motion.div
							key={p.id}
							variants={fadeUp}
							className="group"
							data-testid={`product-card-${p.id}`}
						>
							<div className="relative overflow-hidden aspect-[3/4] mb-6">
								{p.imageUrl && (
									<Image
										src={p.imageUrl}
										alt={p.name}
										fill
										className="object-cover transition-transform duration-700 group-hover:scale-105"
									/>
								)}
								<div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500" />

								<div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-4">
									<a
										href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello! I'm interested in the ${p.name}. Could you tell me more?`)}`}
										target="_blank"
										rel="noopener noreferrer"
										data-testid={`product-whatsapp-${p.id}`}
										className="flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm text-stone-900 py-3 text-xs uppercase tracking-widest font-medium hover:bg-yellow-700 hover:text-white transition-colors duration-300 w-full"
									>
										<MessageCircle size={14} />
										Inquire via WhatsApp
									</a>
								</div>
							</div>

							<p className="text-[11px] uppercase tracking-widest text-stone-400 mb-2">
								{p.category}
							</p>
							<Link
								href={`/product/${p.id}`}
								className="block"
								data-testid={`product-link-${p.id}`}
							>
								<h3 className="font-heading text-lg text-stone-900 mb-1 hover:text-yellow-700 transition-colors">
									{p.name}
								</h3>
							</Link>
							<p className="text-sm text-stone-500">
								{p.currency} {p.price?.toLocaleString()}
							</p>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
