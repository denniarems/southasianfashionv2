'use client'

import { motion } from 'framer-motion'
import type { ProductPricePreview } from '@/lib/discounts'
import ProductCard from './ProductCard'
import SectionHeading from './SectionHeading'

interface Product {
	id: string
	name: string
	slug: string | null
	price: number
	currency: string
	category: string | null
	imageUrl: string | null
	availabilityStatus?: string | null
	isReadyToShip?: boolean | null
	pricing?: ProductPricePreview
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export default function RelatedProducts({
	products,
	whatsappNumber,
}: {
	products: Product[]
	whatsappNumber?: string | null
}) {
	if (!products.length) return null

	return (
		<section className="border-t border-stone-200 mt-16 md:mt-24 pt-16 md:pt-24 pb-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<SectionHeading
					kicker="You May Also Like"
					title="Related Pieces"
					className="mb-10"
				/>

				<motion.div
					variants={stagger}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
				>
					{products.map((product) => (
						<motion.div key={product.id} variants={fadeUp}>
							<ProductCard
								product={product}
								whatsappNumber={whatsappNumber}
								compact
								showActions={false}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
