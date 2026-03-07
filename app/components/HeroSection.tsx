'use client'

import { motion } from 'framer-motion'
import { LoadingImage } from '@/components/ui/loading-image'

interface HeroData {
	title: string
	subtitle: string | null
	imageUrl: string | null
	ctaText: string | null
	ctaLink: string | null
}

export default function HeroSection({ hero }: { hero?: HeroData }) {
	if (!hero) return null

	const title = hero.title?.trim() || 'End of Season Archive Sale'
	const subtitle = hero.subtitle?.trim() || 'Up to 40% OFF Selected Pieces'
	const ctaText = hero.ctaText?.trim() || 'Explore Collection'

	return (
		<section
			data-testid="hero-section"
			className="relative min-h-screen flex items-end overflow-hidden bg-stone-50"
		>
			<div className="absolute inset-0">
				{hero.imageUrl && (
					<LoadingImage
						src={hero.imageUrl}
						alt=""
						fill
						priority
						sizes="100vw"
						className="object-cover object-[62%_24%] md:object-[68%_20%] lg:object-[72%_18%]"
					/>
				)}
				<div className="absolute inset-0 bg-linear-to-t from-stone-900/45 via-stone-900/12 to-white/30" />
			</div>

			<div className="relative z-10 max-w-450 mx-auto px-6 md:px-12 lg:px-24 w-full pb-20 md:pb-24">
				<div className="max-w-lg bg-white/85 backdrop-blur-md border border-white/70 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.55)] p-8 md:p-10">
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="font-accent italic text-stone-600 text-base md:text-lg mb-4"
					>
						{subtitle}
					</motion.p>
					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.5 }}
						className="font-heading text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-tight tracking-tight"
					>
						{title}
					</motion.h1>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.9 }}
						className="mt-10"
					>
						<a
							href={hero.ctaLink || '#new-arrivals'}
							data-testid="hero-cta-btn"
							className="inline-block bg-stone-900 text-white px-10 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-[#B8860B] transition-colors duration-300"
						>
							{ctaText}
						</a>
					</motion.div>
				</div>
			</div>
		</section>
	)
}
