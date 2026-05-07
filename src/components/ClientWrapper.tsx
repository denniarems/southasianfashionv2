import { createContext, use, useCallback, useEffect, useRef, useState } from 'react'
import { ReactLenis } from 'lenis/react'
import { Toaster } from '@/components/ui/toaster'
import { FullScreenLoader } from '@/components/ui/full-screen-loader'
import { CartProvider } from '@/components/cart/CartContext'
import { usePathname } from '@/components/router-hooks'

interface GlobalLoadingContextValue {
	isLoading: boolean
	startLoading: () => void
	stopLoading: (delayMs?: number) => void
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(null)

export function useGlobalLoading() {
	const value = use(GlobalLoadingContext)

	if (!value) {
		throw new Error('useGlobalLoading must be used within ClientWrapper')
	}

	return value
}

export function ClientWrapper({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()

	const [isLoading, setIsLoading] = useState(true)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const clearPendingTimeout = useCallback(() => {
		if (!timeoutRef.current) {
			return
		}

		clearTimeout(timeoutRef.current)
		timeoutRef.current = null
	}, [])

	const startLoading = useCallback(() => {
		clearPendingTimeout()
		setIsLoading(true)
	}, [clearPendingTimeout])

	const stopLoading = useCallback(
		(delayMs = 0) => {
			clearPendingTimeout()

			if (delayMs <= 0) {
				setIsLoading(false)
				return
			}

			timeoutRef.current = setTimeout(() => {
				setIsLoading(false)
				timeoutRef.current = null
			}, delayMs)
		},
		[clearPendingTimeout],
	)

	useEffect(() => {
		startLoading()
		stopLoading(800)
	}, [pathname, startLoading, stopLoading])

	useEffect(() => {
		const { classList } = document.documentElement

		if (isLoading) {
			classList.add('overflow-hidden')
			return
		}

		classList.remove('overflow-hidden')
	}, [isLoading])

	useEffect(
		() => () => {
			clearPendingTimeout()
			document.documentElement.classList.remove('overflow-hidden')
		},
		[clearPendingTimeout],
	)

	return (
		<GlobalLoadingContext
			value={{
				isLoading,
				startLoading,
				stopLoading,
			}}
		>
			<ReactLenis root>
				<CartProvider>
					{children}
					<Toaster />
					<FullScreenLoader show={isLoading} />
				</CartProvider>
			</ReactLenis>
		</GlobalLoadingContext>
	)
}
