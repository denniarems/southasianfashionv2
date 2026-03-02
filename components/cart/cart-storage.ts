import type { CartItem, CartState } from '@/components/cart/cart-types'

const CART_STORAGE_VERSION = 'v1'
const CART_STORAGE_KEY = `saf_cart:${CART_STORAGE_VERSION}`
const LEGACY_KEYS = ['saf_cart'] as const

const EMPTY_CART_STATE: CartState = {
	items: [],
}

function isValidCartItem(value: unknown): value is CartItem {
	if (!value || typeof value !== 'object') {
		return false
	}

	const item = value as Partial<CartItem>

	return (
		typeof item.id === 'string' &&
		typeof item.name === 'string' &&
		typeof item.price === 'number' &&
		Number.isFinite(item.price) &&
		typeof item.currency === 'string' &&
		typeof item.quantity === 'number' &&
		Number.isFinite(item.quantity) &&
		item.quantity > 0
	)
}

function normalizeCartState(value: unknown): CartState {
	if (!value || typeof value !== 'object') {
		return EMPTY_CART_STATE
	}

	const maybeState = value as Partial<CartState>
	const items = Array.isArray(maybeState.items) ? maybeState.items.filter(isValidCartItem) : []

	return { items }
}

export function migrateLegacyCartStorage(): void {
	if (typeof window === 'undefined') {
		return
	}

	try {
		const alreadyMigrated = window.localStorage.getItem(CART_STORAGE_KEY)
		if (alreadyMigrated) {
			return
		}

		for (const legacyKey of LEGACY_KEYS) {
			const legacyRaw = window.localStorage.getItem(legacyKey)
			if (!legacyRaw) {
				continue
			}

			const parsed = JSON.parse(legacyRaw) as unknown
			const normalized = normalizeCartState(parsed)
			window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized))
			window.localStorage.removeItem(legacyKey)
			break
		}
	} catch {
		// Ignore migration errors in private mode/quota issues/corrupted payloads.
	}
}

export function loadCartState(): CartState {
	if (typeof window === 'undefined') {
		return EMPTY_CART_STATE
	}

	try {
		const raw = window.localStorage.getItem(CART_STORAGE_KEY)
		if (!raw) {
			return EMPTY_CART_STATE
		}

		const parsed = JSON.parse(raw) as unknown
		return normalizeCartState(parsed)
	} catch {
		return EMPTY_CART_STATE
	}
}

export function saveCartState(state: CartState): void {
	if (typeof window === 'undefined') {
		return
	}

	try {
		window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
	} catch {
		// Ignore write errors in private mode/quota issues.
	}
}
