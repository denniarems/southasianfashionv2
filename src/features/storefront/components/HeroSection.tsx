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
			className="relative flex min-h-screen items-end overflow-hidden bg-stone-950"
		>
			<div className="absolute inset-0">
				{hero.imageUrl && (
					<motion.div
						initial={{ scale: 1 }}
						animate={{ scale: 1.06 }}
						transition={{ duration: 14, ease: 'easeOut' }}
						className="absolute inset-0 motion-reduce:transform-none"
					>
						<LoadingImage
							src={hero.imageUrl}
							alt=""
							fill
							priority
							sizes="100vw"
							className="object-cover object-[center_30%]"
						/>
					</motion.div>
				)}
				<div className="absolute inset-0 bg-linear-to-t from-stone-950/78 via-stone-900/28 to-stone-950/8" />
			</div>

			<div className="relative z-10 max-w-450 mx-auto px-6 md:px-12 lg:px-24 w-full pb-20 md:pb-24">
				<div className="max-w-3xl text-white">
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="font-accent italic text-white/78 text-lg md:text-xl mb-4"
					>
						{subtitle}
					</motion.p>
					<div className="overflow-hidden pb-1">
						<motion.h1
							initial={{ y: '105%', opacity: 0.6 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
							className="font-heading text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.95] tracking-tight drop-shadow-sm"
						>
							{title}
						</motion.h1>
					</div>
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.95 }}
						className="mt-10"
					>
						<a
							href={hero.ctaLink || '#new-arrivals'}
							data-testid="hero-cta-btn"
							className="inline-flex min-h-12 items-center border border-white/70 bg-white text-stone-950 px-10 py-4 text-xs uppercase tracking-widest font-semibold transition-colors duration-300 hover:border-[#B8860B] hover:bg-[#B8860B] hover:text-white"
						>
							{ctaText}
						</a>
					</motion.div>
				</div>
			</div>
		</section>
	)
}
