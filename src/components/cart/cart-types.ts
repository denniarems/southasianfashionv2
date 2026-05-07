export interface CartProduct {
	id: string
	name: string
	slug?: string | null
	price: number
	currency: string
	imageUrl?: string | null
}

export interface CartItem extends CartProduct {
	quantity: number
}

export interface CartState {
	items: CartItem[]
}
