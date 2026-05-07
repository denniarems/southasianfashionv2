'use client'

import { motion } from 'framer-motion'
import type { ProductPricePreview } from '@/lib/discounts'
import ProductCard from './ProductCard'
import SectionHeading from './SectionHeading'

interface Product {
	id: string
	slug?: string | null
	name: string
	category: string | null
	price: number
	currency: string
	imageUrl: string | null
	availabilityStatus?: string | null
	isReadyToShip?: boolean | null
	pricing?: ProductPricePreview
}

interface Settings {
	whatsappNumber?: string | null
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
	hidden: { opacity: 0, y: 24 },
	show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export default function NewArrivals({
	products,
	settings,
}: {
	products: Product[]
	settings?: Settings
}) {
	if (!products?.length) return null

	return (
		<section id="new-arrivals" data-testid="new-arrivals-section" className="py-24 md:py-32">
			<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-16"
				>
					<SectionHeading kicker="Just Arrived" title="New Arrivals" />
				</motion.div>

				<motion.div
					variants={stagger}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
				>
					{products.map((product) => (
						<motion.div key={product.id} variants={fadeUp}>
							<ProductCard product={product} whatsappNumber={settings?.whatsappNumber} />
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
