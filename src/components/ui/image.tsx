import type { ImgHTMLAttributes } from 'react'

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
	src: string
	alt: string
	fill?: boolean
	priority?: boolean
	placeholder?: 'blur' | 'empty'
	blurDataURL?: string
}

export default function Image({
	src,
	alt,
	fill = false,
	priority = false,
	placeholder: _placeholder,
	blurDataURL: _blurDataURL,
	style,
	...props
}: ImageProps) {
	return (
		<img
			{...props}
			src={src}
			alt={alt}
			decoding={props.decoding ?? 'async'}
			loading={priority ? 'eager' : (props.loading ?? 'lazy')}
			fetchPriority={priority ? 'high' : props.fetchPriority}
			style={{
				...style,
				...(fill
					? {
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
						}
					: null),
			}}
		/>
	)
}
