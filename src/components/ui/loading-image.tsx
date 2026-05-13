'use client'

import { useEffect, useState } from 'react'
import Image, { type ImageProps } from '@/components/ui/image'
import { cn } from '@/lib/utils'

const DEFAULT_BLUR_DATA_URL =
	"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e7e5e4'/%3E%3C/svg%3E"

type LoadingImageProps = ImageProps & {
	disableSkeleton?: boolean
	disableAutoBlur?: boolean
	skeletonClassName?: string
}

export function LoadingImage({
	className,
	onLoad,
	placeholder,
	blurDataURL,
	src,
	disableSkeleton = false,
	disableAutoBlur = false,
	skeletonClassName,
	...props
}: LoadingImageProps) {
	const [loadedSrc, setLoadedSrc] = useState<ImageProps['src'] | null>(null)
	const loaded = loadedSrc === src

	const resolvedBlurDataURL =
		blurDataURL ?? (!disableAutoBlur && typeof src === 'string' ? DEFAULT_BLUR_DATA_URL : undefined)

	const resolvedPlaceholder = placeholder ?? (resolvedBlurDataURL ? 'blur' : 'empty')

	useEffect(() => {
		if (typeof src !== 'string' || typeof window === 'undefined') {
			setLoadedSrc(src)
			return
		}

		const image = new window.Image()
		image.src = src
		const markLoaded = () => setLoadedSrc(src)

		if (image.complete) {
			markLoaded()
			return
		}

		image.onload = markLoaded
		image.onerror = markLoaded

		return () => {
			image.onload = null
			image.onerror = null
		}
	}, [src])

	return (
		<Image
			{...props}
			src={src}
			className={cn(
				className,
				!disableSkeleton && !loaded && 'bg-stone-200',
				!disableSkeleton && !loaded && skeletonClassName,
			)}
			placeholder={resolvedPlaceholder}
			blurDataURL={resolvedBlurDataURL}
			onLoad={(event) => {
				setLoadedSrc(src)
				onLoad?.(event)
			}}
		/>
	)
}
