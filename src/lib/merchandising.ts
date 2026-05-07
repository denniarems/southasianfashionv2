export type OccasionLink = {
	slug: string
	label: string
	description: string
	imageUrl?: string | null
	displayOrder?: number | null
}

export const DEFAULT_OCCASION_LINKS: readonly OccasionLink[] = [
	{
		slug: 'bridal',
		label: 'Bridal',
		description: 'Statement lehengas, sarees, and heirloom finishing touches.',
	},
	{
		slug: 'eid',
		label: 'Eid',
		description: 'Refined festive pieces with rich texture and graceful drape.',
	},
	{
		slug: 'diwali',
		label: 'Diwali',
		description: 'Celebration-ready silhouettes with luminous detail.',
	},
	{
		slug: 'wedding-guest',
		label: 'Wedding Guest',
		description: 'Elegant outfits for ceremonies, receptions, and sangeet nights.',
	},
	{
		slug: 'groom',
		label: 'Groom',
		description: 'Sherwani, kurta, and formalwear directions for the groom.',
	},
	{
		slug: 'temple-jewelry',
		label: 'Temple Jewelry',
		description: 'Ornate jewelry accents for classical and ceremonial styling.',
	},
] as const

export const OCCASION_LINKS = DEFAULT_OCCASION_LINKS

export const AVAILABILITY_OPTIONS = [
	{ value: 'made-to-order', label: 'Made to Order' },
	{ value: 'ready-to-ship', label: 'Ready to Ship' },
	{ value: 'in-stock', label: 'In Stock' },
	{ value: 'limited', label: 'Limited' },
] as const

export function occasionLabelForSlug(
	slug: string,
	occasions: readonly OccasionLink[] = OCCASION_LINKS,
) {
	return occasions.find((occasion) => occasion.slug === slug)?.label ?? slug
}

export function normalizeFilterValue(value: string) {
	return value.trim().toLowerCase()
}
