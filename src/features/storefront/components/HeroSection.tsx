'use client'

import { m } from 'framer-motion'
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

	const title = hero.title?.trim() || 'Private Atelier Edit'
	const subtitle =
		hero.subtitle?.trim() ||
		'Made-to-measure South Asian pieces prepared for ceremony, celebration, and private fitting conversations.'
	const ctaText = hero.ctaText?.trim() || 'Explore the Edit'

	return (
		<section
			data-testid="hero-section"
			className="relative flex min-h-[100svh] items-end overflow-hidden bg-stone-950"
		>
			<div className="absolute inset-0">
				{hero.imageUrl && (
					<m.div
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
							className="object-cover object-[58%_center] sm:object-[center_30%]"
						/>
					</m.div>
				)}
				<div className="absolute inset-0 bg-linear-to-t from-stone-950/88 via-stone-900/36 to-stone-950/10 sm:from-stone-950/78 sm:via-stone-900/28 sm:to-stone-950/8" />
				<div className="absolute inset-0 bg-linear-to-r from-stone-950/35 via-transparent to-transparent sm:hidden" />
			</div>

			<div className="relative z-10 max-w-450 mx-auto w-full px-4 pb-14 pt-28 sm:px-6 sm:pb-20 md:px-12 md:pb-24 lg:px-24">
				<div className="max-w-3xl text-white">
					<m.p
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="mb-4 max-w-xs font-accent text-base italic leading-relaxed text-white/82 sm:max-w-lg sm:text-lg md:text-xl"
					>
						{subtitle}
					</m.p>
					<div className="overflow-hidden pb-1">
						<m.h1
							initial={{ y: '105%', opacity: 0.6 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
							className="max-w-[10ch] font-heading text-4xl leading-[0.98] text-white drop-shadow-sm sm:text-6xl lg:text-7xl"
						>
							{title}
						</m.h1>
					</div>
					<m.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.95 }}
						className="mt-10"
					>
						<a
							href={hero.ctaLink || '#new-arrivals'}
							data-testid="hero-cta-btn"
							className="inline-flex min-h-12 w-full max-w-xs items-center justify-center border border-white/70 bg-white px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-950 transition-colors duration-300 hover:border-[#B8860B] hover:bg-[#B8860B] hover:text-white sm:w-auto sm:px-10 sm:text-xs sm:tracking-widest"
						>
							{ctaText}
						</a>
					</m.div>
				</div>
			</div>
		</section>
	)
}
