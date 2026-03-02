'use client'

import { useState } from 'react'
import { LoadingImage } from '@/components/ui/loading-image'

interface ProductImageGalleryProps {
	images: string[]
	productName: string
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
	const [selectedIndex, setSelectedIndex] = useState(0)

	if (images.length === 0) {
		return (
			<div className="relative aspect-4/5 w-full bg-stone-100 overflow-hidden rounded-sm lg:sticky lg:top-28">
				<div className="w-full h-full flex items-center justify-center text-stone-400 font-accent italic">
					No Image
				</div>
			</div>
		)
	}

	if (images.length === 1) {
		return (
			<div className="relative aspect-4/5 w-full bg-stone-100 overflow-hidden rounded-sm lg:sticky lg:top-28">
				<LoadingImage
					src={images[0]}
					alt={productName}
					fill
					priority
					sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 50vw"
					className="object-cover"
				/>
			</div>
		)
	}

	return (
		<div className="lg:sticky lg:top-28 space-y-3">
			<div className="relative aspect-4/5 w-full bg-stone-100 overflow-hidden rounded-sm">
				<LoadingImage
					key={images[selectedIndex]}
					src={images[selectedIndex]}
					alt={`${productName} — Image ${selectedIndex + 1}`}
					fill
					priority
					sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 50vw"
					className="object-cover"
				/>
			</div>
			<div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
				{images.map((img, i) => (
					<button
						key={img}
						type="button"
						onClick={() => setSelectedIndex(i)}
						className={`relative shrink-0 w-16 h-20 overflow-hidden transition-all duration-300 cursor-pointer ${
							i === selectedIndex
								? 'ring-2 ring-stone-900 opacity-100'
								: 'ring-1 ring-stone-200 opacity-60 hover:opacity-100'
						}`}
					>
						<LoadingImage
							src={img}
							alt={`${productName} — Thumbnail ${i + 1}`}
							fill
							sizes="64px"
							className="object-cover"
						/>
					</button>
				))}
			</div>
		</div>
	)
}
