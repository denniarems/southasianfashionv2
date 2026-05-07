import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const variants = {
	primary: 'bg-stone-900 text-white hover:bg-yellow-700 border-stone-900',
	secondary: 'bg-white text-stone-900 hover:bg-stone-50 border-stone-300',
	ghost: 'bg-transparent text-stone-700 hover:text-stone-950 border-transparent',
}

type BaseProps = {
	children: ReactNode
	variant?: keyof typeof variants
	className?: string
}

export function StorefrontButton({
	children,
	variant = 'primary',
	className,
	...props
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className={cn(
				'inline-flex min-h-11 items-center justify-center gap-2 border px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors',
				variants[variant],
				className,
			)}
			{...props}
		>
			{children}
		</button>
	)
}

export function StorefrontLinkButton({
	children,
	variant = 'primary',
	className,
	...props
}: BaseProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
	return (
		<a
			className={cn(
				'inline-flex min-h-11 items-center justify-center gap-2 border px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors',
				variants[variant],
				className,
			)}
			{...props}
		>
			{children}
		</a>
	)
}
