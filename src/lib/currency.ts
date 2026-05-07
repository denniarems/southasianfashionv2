export const STORE_CURRENCY = 'CAD'

const cadFormatter = new Intl.NumberFormat('en-CA', {
	style: 'currency',
	currency: STORE_CURRENCY,
	maximumFractionDigits: 0,
})

export function formatCad(amount: number): string {
	return cadFormatter.format(amount)
}
