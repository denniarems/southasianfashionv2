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
import { STORE_CURRENCY } from '@/lib/currency'

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
		const loaded = loadCartState()
		setState({
			items: loaded.items.map((item) => ({ ...item, currency: STORE_CURRENCY })),
		})
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
					items: [...currentState.items, { ...product, currency: STORE_CURRENCY, quantity }],
				}
			}

			const items = [...currentState.items]
			const existingItem = items[existingIndex]
			items[existingIndex] = {
				...existingItem,
				currency: STORE_CURRENCY,
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

	const currency = state.items.length > 0 ? STORE_CURRENCY : null
	const hasMixedCurrencies = false

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
