'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
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
	const [loaded, setLoaded] = useState(false)

	const resolvedBlurDataURL =
		blurDataURL ?? (!disableAutoBlur && typeof src === 'string' ? DEFAULT_BLUR_DATA_URL : undefined)

	const resolvedPlaceholder = placeholder ?? (resolvedBlurDataURL ? 'blur' : 'empty')

	return (
		<Image
			{...props}
			src={src}
			className={cn(
				className,
				!disableSkeleton && !loaded && 'animate-pulse bg-stone-200',
				!disableSkeleton && !loaded && skeletonClassName,
			)}
			placeholder={resolvedPlaceholder}
			blurDataURL={resolvedBlurDataURL}
			onLoad={(event) => {
				setLoaded(true)
				onLoad?.(event)
			}}
		/>
	)
}