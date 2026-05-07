'use client'

import { motion } from 'framer-motion'
import ArrowUpRightIcon from 'lucide-react/dist/esm/icons/arrow-up-right'
import Link from '@/components/router-link'
import { LoadingImage } from '@/components/ui/loading-image'
import { OCCASION_LINKS, type OccasionLink } from '@/lib/merchandising'
import SectionHeading from './SectionHeading'

interface ShopByOccasionProps {
	occasions?: OccasionLink[]
}

export default function ShopByOccasion({ occasions = [...OCCASION_LINKS] }: ShopByOccasionProps) {
	const occasionItems = occasions.length > 0 ? occasions : OCCASION_LINKS

	return (
		<section className="bg-stone-100 py-20 md:py-28" data-testid="shop-by-occasion">
			<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
				<div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<SectionHeading
						kicker="Occasion Edits"
						title="Shop by Occasion"
						description="Curated paths for ceremonies, festivals, and custom styling conversations."
					/>
					<Link
						href="/products"
						className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:text-yellow-700"
					>
						View all pieces
						<ArrowUpRightIcon size={14} />
					</Link>
				</div>

				<div className="grid grid-cols-1 gap-px overflow-hidden border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
					{occasionItems.map((occasion, index) => (
						<motion.div
							key={occasion.slug}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.35 }}
							transition={{ duration: 0.45, delay: index * 0.05 }}
						>
							<Link
								href={`/products?occasion=${occasion.slug}`}
								className="group relative block min-h-72 overflow-hidden bg-stone-950 p-6"
							>
								{occasion.imageUrl ? (
									<LoadingImage
										src={occasion.imageUrl}
										alt={occasion.label}
										fill
										sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
										className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
									/>
								) : (
									<div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(184,134,11,0.28),transparent_32%),linear-gradient(135deg,#1c1917,#44403c)]" />
								)}
								<div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-950/45 to-stone-950/10 transition-colors duration-500 group-hover:from-stone-950 group-hover:via-stone-950/35" />
								<div className="absolute inset-x-0 bottom-0 h-24 translate-y-10 bg-linear-to-t from-yellow-700/20 to-transparent opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
								<div className="relative z-10 flex h-full min-h-60 flex-col justify-between">
									<div className="flex items-start justify-between gap-4">
										<p className="font-heading text-2xl text-white">{occasion.label}</p>
										<ArrowUpRightIcon
											size={18}
											className="text-stone-200 transition-colors group-hover:text-yellow-500"
										/>
									</div>
									<p className="mt-12 max-w-xs text-sm leading-relaxed text-stone-200">
										{occasion.description}
									</p>
								</div>
							</Link>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	)
}
