'use client'

import { ReactLenis } from 'lenis/react'
import { Toaster } from '@/components/ui/toaster'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
	return (
		<ReactLenis root>
			{children}
			<Toaster />
		</ReactLenis>
	)
}
