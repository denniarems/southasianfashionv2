'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface HeroData {
	title: string
	subtitle: string | null
	imageUrl: string | null
	ctaText: string | null
	ctaLink: string | null
}

export default function HeroSection({ hero }: { hero?: HeroData }) {
	if (!hero) return null

	return (
		<section
			data-testid="hero-section"
			className="relative min-h-screen flex items-end overflow-hidden"
		>
			<div className="absolute inset-0">
				{hero.imageUrl && <Image src={hero.imageUrl} alt="" fill className="object-cover" />}
				<div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/30 to-stone-900/10" />
			</div>

			<div className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 w-full pb-24 md:pb-32">
				<div className="max-w-3xl">
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="font-accent italic text-white/70 text-lg md:text-xl mb-6"
					>
						{hero.subtitle}
					</motion.p>
					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.5 }}
						className="font-heading text-4xl sm:text-5xl lg:text-7xl text-white leading-none tracking-tight"
					>
						{hero.title}
					</motion.h1>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.9 }}
						className="mt-12"
					>
						<a
							href={hero.ctaLink || '#new-arrivals'}
							data-testid="hero-cta-btn"
							className="inline-block bg-white text-stone-900 px-10 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 hover:text-white transition-colors duration-300"
						>
							{hero.ctaText || 'Explore'}
						</a>
					</motion.div>
				</div>
			</div>
		</section>
	)
}
