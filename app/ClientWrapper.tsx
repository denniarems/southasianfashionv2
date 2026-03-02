'use client'

import { ReactLenis } from 'lenis/react'
import { Toaster } from '@/components/ui/toaster'
import { CartProvider } from '@/components/cart/CartContext'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
	return (
		<ReactLenis root>
			<CartProvider>
				{children}
				<Toaster />
			</CartProvider>
		</ReactLenis>
	)
}
