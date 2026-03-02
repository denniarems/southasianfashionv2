'use client'

import { useEffect, useState } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster({ position, ...props }: ToasterProps) {
	const [isDesktop, setIsDesktop] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia('(min-width: 1024px)')

		const sync = () => {
			setIsDesktop(mediaQuery.matches)
		}

		sync()
		mediaQuery.addEventListener('change', sync)

		return () => {
			mediaQuery.removeEventListener('change', sync)
		}
	}, [])

	return (
		<Sonner
			closeButton
			richColors={false}
			position={position ?? (isDesktop ? 'bottom-right' : 'top-center')}
			duration={4000}
			toastOptions={{
				className: 'saf-toast font-body',
				classNames: {
					toast: 'saf-toast',
					title: 'saf-toast-title',
					description: 'saf-toast-description',
					actionButton: 'saf-toast-action',
					cancelButton: 'saf-toast-cancel',
					closeButton: 'saf-toast-close',
					success: 'saf-toast-success',
					error: 'saf-toast-error',
					warning: 'saf-toast-warning',
					info: 'saf-toast-info',
				},
			}}
			{...props}
		/>
	)
}
