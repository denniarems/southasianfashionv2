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
			className="relative flex min-h-[100svh] items-end overflow-hidden bg-stone-50 pt-24 sm:min-h-screen sm:pt-0"
		>
			<div className="absolute inset-0">
				{hero.imageUrl && (
					<LoadingImage
						src={hero.imageUrl}
						alt=""
						fill
						priority
						sizes="100vw"
						className="object-cover object-center"
					/>
				)}
				<div className="absolute inset-0 bg-linear-to-t from-stone-900/45 via-stone-900/12 to-white/30" />
			</div>

			<div className="relative z-10 mx-auto w-full max-w-450 px-4 sm:px-6 md:px-12 lg:px-24 pb-8 sm:pb-16 md:pb-24">
				<div className="max-w-lg bg-white/85 backdrop-blur-md border border-white/70 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.55)] p-6 sm:p-8 md:p-10">
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="mb-3 font-accent text-sm italic text-stone-600 sm:mb-4 sm:text-base md:text-lg"
					>
						{subtitle}
					</motion.p>
					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.5 }}
						className="font-heading text-[clamp(2.75rem,13vw,4.5rem)] text-stone-900 leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl"
					>
						{title}
					</motion.h1>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.9 }}
						className="mt-8 sm:mt-10"
					>
						<a
							href={hero.ctaLink || '#new-arrivals'}
							data-testid="hero-cta-btn"
							className="inline-flex w-full items-center justify-center bg-stone-900 px-8 py-4 text-center text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-[#B8860B] sm:w-auto sm:px-10"
						>
							{ctaText}
						</a>
					</motion.div>
				</div>
			</div>
		</section>
	)
}
