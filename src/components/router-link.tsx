import { Link as TanStackLink } from '@tanstack/react-router'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

type RouterLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
	children?: ReactNode
	href?: string
	to?: string
	prefetch?: boolean | 'intent' | 'render' | 'viewport'
}

function isNativeHref(value: string) {
	return (
		value.startsWith('http://') ||
		value.startsWith('https://') ||
		value.startsWith('#') ||
		value.startsWith('mailto:') ||
		value.startsWith('tel:')
	)
}

export default function Link({ children, href, to, ...props }: RouterLinkProps) {
	const target = to ?? href ?? ''

	if (isNativeHref(target)) {
		return (
			<a href={target} {...props}>
				{children}
			</a>
		)
	}

	return (
		<TanStackLink to={target} {...props}>
			{children}
		</TanStackLink>
	)
}
