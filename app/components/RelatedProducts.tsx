'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { LoadingImage } from '@/components/ui/loading-image'

interface Product {
	id: string
	name: string
	slug: string | null
	price: number
	currency: string
	category: string | null
	imageUrl: string | null
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const fadeUp = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function RelatedProducts({ products }: { products: Product[] }) {
	if (!products.length) return null

	return (
		<section className="border-t border-stone-200 mt-16 md:mt-24 pt-16 md:pt-24 pb-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-10">
					<p className="font-accent italic text-yellow-700 text-base mb-2">You May Also Like</p>
					<h2 className="font-heading text-2xl sm:text-3xl text-stone-900 tracking-tight">
						Related Pieces
					</h2>
				</div>

				<motion.div
					variants={stagger}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
				>
					{products.map((p) => (
						<motion.div key={p.id} variants={fadeUp} className="group">
							<Link
								href={`/products/${p.slug ?? p.id}`}
								className="relative overflow-hidden aspect-3/4 mb-4 block"
							>
								{p.imageUrl ? (
									<LoadingImage
										src={p.imageUrl}
										alt={p.name}
										fill
										sizes="(max-width: 640px) 50vw, 25vw"
										className="object-cover transition-transform duration-700 group-hover:scale-105"
									/>
								) : (
									<div className="w-full h-full bg-stone-200" />
								)}
								<div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500 pointer-events-none" />
							</Link>
							<p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
								{p.category}
							</p>
							<Link href={`/products/${p.slug ?? p.id}`} className="block">
								<h3 className="font-heading text-base text-stone-900 mb-1 hover:text-yellow-700 transition-colors">
									{p.name}
								</h3>
							</Link>
							<p className="text-sm text-stone-500">
								{p.currency} {p.price?.toLocaleString()}
							</p>
							<div className="mt-3">
								<AddToCartButton
									product={{
										id: p.id,
										name: p.name,
										slug: p.slug,
										price: p.price,
										currency: p.currency,
										imageUrl: p.imageUrl,
									}}
									className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
								/>
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
