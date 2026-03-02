'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
	return (
		<Sonner
			closeButton
			richColors
			position="top-right"
			duration={4000}
			toastOptions={{
				className: 'font-body',
			}}
			{...props}
		/>
	)
}
