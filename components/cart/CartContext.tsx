'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import type { CartProduct, CartState } from '@/components/cart/cart-types'
import {
	loadCartState,
	migrateLegacyCartStorage,
	saveCartState,
} from '@/components/cart/cart-storage'

const EMPTY_CART_STATE: CartState = { items: [] }

interface CartContextValue {
	items: CartState['items']
	itemCount: number
	subtotal: number
	currency: string | null
	hasMixedCurrencies: boolean
	addItem: (product: CartProduct, quantity?: number) => void
	updateQuantity: (productId: string, quantity: number) => void
	removeItem: (productId: string) => void
	clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<CartState>(EMPTY_CART_STATE)
	const [hydrated, setHydrated] = useState(false)

	useEffect(() => {
		migrateLegacyCartStorage()
		setState(loadCartState())
		setHydrated(true)
	}, [])

	useEffect(() => {
		if (!hydrated) {
			return
		}

		saveCartState(state)
	}, [state, hydrated])

	const addItem = useCallback((product: CartProduct, quantity = 1) => {
		if (quantity <= 0) {
			return
		}

		setState((currentState) => {
			const existingIndex = currentState.items.findIndex((item) => item.id === product.id)

			if (existingIndex === -1) {
				return {
					items: [...currentState.items, { ...product, quantity }],
				}
			}

			const items = [...currentState.items]
			const existingItem = items[existingIndex]
			items[existingIndex] = {
				...existingItem,
				quantity: existingItem.quantity + quantity,
			}

			return { items }
		})
	}, [])

	const updateQuantity = useCallback((productId: string, quantity: number) => {
		setState((currentState) => {
			if (quantity <= 0) {
				return {
					items: currentState.items.filter((item) => item.id !== productId),
				}
			}

			return {
				items: currentState.items.map((item) =>
					item.id === productId ? { ...item, quantity } : item,
				),
			}
		})
	}, [])

	const removeItem = useCallback((productId: string) => {
		setState((currentState) => ({
			items: currentState.items.filter((item) => item.id !== productId),
		}))
	}, [])

	const clearCart = useCallback(() => {
		setState(EMPTY_CART_STATE)
	}, [])

	const itemCount = useMemo(
		() => state.items.reduce((sum, item) => sum + item.quantity, 0),
		[state.items],
	)

	const subtotal = useMemo(
		() => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
		[state.items],
	)

	const currencies = useMemo(
		() => Array.from(new Set(state.items.map((item) => item.currency))),
		[state.items],
	)

	const currency = currencies.length === 1 ? currencies[0] : null
	const hasMixedCurrencies = currencies.length > 1

	const value = useMemo<CartContextValue>(
		() => ({
			items: state.items,
			itemCount,
			subtotal,
			currency,
			hasMixedCurrencies,
			addItem,
			updateQuantity,
			removeItem,
			clearCart,
		}),
		[
			state.items,
			itemCount,
			subtotal,
			currency,
			hasMixedCurrencies,
			addItem,
			updateQuantity,
			removeItem,
			clearCart,
		],
	)

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
	const context = useContext(CartContext)
	if (!context) {
		throw new Error('useCart must be used within a CartProvider')
	}

	return context
}
