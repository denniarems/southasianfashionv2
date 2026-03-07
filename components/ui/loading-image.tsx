'use client'

import { useEffect, useMemo, useState } from 'react'
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
	onError,
	placeholder,
	blurDataURL,
	src,
	disableSkeleton = false,
	disableAutoBlur = false,
	skeletonClassName,
	...props
}: LoadingImageProps) {
	const [loaded, setLoaded] = useState(false)
	const resolvedSrc = useMemo(() => {
		if (typeof src === 'string') {
			return src
		}

		return 'src' in src ? src.src : ''
	}, [src])

	useEffect(() => {
		if (!resolvedSrc) {
			setLoaded(true)
			return
		}

		setLoaded(false)

		const preloadImage = new window.Image()
		let cancelled = false

		const markLoaded = () => {
			if (!cancelled) {
				setLoaded(true)
			}
		}

		preloadImage.onload = markLoaded
		preloadImage.onerror = markLoaded
		preloadImage.src = resolvedSrc

		if (preloadImage.complete && preloadImage.naturalWidth > 0) {
			markLoaded()
		}

		return () => {
			cancelled = true
			preloadImage.onload = null
			preloadImage.onerror = null
		}
	}, [resolvedSrc])

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
			onError={(event) => {
				setLoaded(true)
				onError?.(event)
			}}
		/>
	)
}
