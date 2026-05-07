import React from 'react'
import { Label } from '@/components/ui/label'
import { formatCad } from '@/lib/currency'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<Label className="text-xs uppercase tracking-widest text-stone-500">{label}</Label>
			{children}
		</div>
	)
}

export function FormSection({
	title,
	description,
	children,
}: {
	title: string
	description?: string
	children: React.ReactNode
}) {
	return (
		<div className="rounded-none border border-stone-200 p-4 space-y-4">
			<div>
				<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">{title}</p>
				{description ? <p className="text-[11px] text-stone-500 mt-1">{description}</p> : null}
			</div>
			{children}
		</div>
	)
}

export function DiscountLivePreview({ form }: { form: any }) {
	const base = Number(form.originalPrice || 7999)
	const value = Number(form.discountValue || 0)
	let discounted = base

	if (form.discountType === 'percentage') {
		discounted = Math.max(0, base - (base * value) / 100)
	} else if (
		form.discountType === 'flat' ||
		form.discountType === 'bundle' ||
		form.discountType === 'tiered'
	) {
		discounted = Math.max(0, base - value)
	}

	const savings = Math.max(0, base - discounted)

	return (
		<div className="rounded-none border border-[#B8860B]/40 bg-gradient-to-r from-[#fffaf0] to-white p-4">
			<p className="text-[10px] uppercase tracking-[0.16em] text-[#7A1E2C]">
				Live Customer Preview
			</p>
			<p className="text-xs text-stone-500 mt-1">Preview based on an example item price.</p>
			<div className="mt-3 flex items-end gap-3">
				<p className="text-xl font-semibold text-stone-900">{formatCad(Math.round(discounted))}</p>
				<p className="text-sm text-stone-400 line-through">{formatCad(Math.round(base))}</p>
			</div>
			<div className="mt-2 flex items-center gap-2">
				<span className="text-[10px] uppercase tracking-[0.12em] bg-[#7A1E2C]/10 text-[#7A1E2C] px-2 py-0.5 border border-[#7A1E2C]/20">
					{form.wording || 'Instant Price Drop'}
				</span>
				<span className="text-xs text-[#B8860B] font-medium">
					Save {formatCad(Math.round(savings))}
				</span>
			</div>
		</div>
	)
}

export const DISCOUNT_STRATEGIES: Array<{
	id: 'flat' | 'percentage' | 'tiered' | 'bundle'
	label: string
	description: string
	defaultWording: string
}> = [
	{
		id: 'flat',
		label: 'Flat Amount',
		description: 'Best for premium pieces where concrete savings convert faster.',
		defaultWording: 'Instant Price Drop',
	},
	{
		id: 'percentage',
		label: 'Percentage',
		description: 'Great for seasonal campaigns and store-wide buzz.',
		defaultWording: 'Exclusive Offer',
	},
	{
		id: 'tiered',
		label: 'Tiered Cart',
		description: 'Boost AOV with progressive savings by cart threshold.',
		defaultWording: 'Archive Tier Savings',
	},
	{
		id: 'bundle',
		label: 'Bundle Set',
		description: 'Move slow inventory by pairing complementary products.',
		defaultWording: 'Complete The Look Savings',
	},
]

export const TIER_TEMPLATE = JSON.stringify(
	[
		{ minCartValue: 2000, discountValue: 10, discountType: 'percentage' },
		{ minCartValue: 5000, discountValue: 20, discountType: 'percentage' },
		{ minCartValue: 8000, discountValue: 30, discountType: 'percentage' },
	],
	null,
	2,
)

export function parseStringArrayFromMixed(input: unknown): string[] {
	if (Array.isArray(input)) {
		return input.filter((v): v is string => typeof v === 'string').map((v) => v.trim())
	}

	if (typeof input === 'string') {
		const trimmed = input.trim()
		if (!trimmed) return []

		try {
			const parsed = JSON.parse(trimmed)
			if (!Array.isArray(parsed)) return []
			return parsed.filter((v): v is string => typeof v === 'string').map((v) => v.trim())
		} catch {
			return trimmed
				.split(',')
				.map((v) => v.trim())
				.filter(Boolean)
		}
	}

	return []
}

export function getDefaultDiscountForm() {
	const now = new Date()
	const end = new Date(now)
	end.setDate(end.getDate() + 14)

	return {
		name: '',
		description: '',
		discountType: 'flat',
		discountValue: 0,
		originalPrice: '',
		startDate: now.toISOString().slice(0, 16),
		endDate: end.toISOString().slice(0, 16),
		minCartValue: 0,
		priority: 10,
		maxUses: '',
		applicableProductIds: [] as string[],
		applicableCategories: [] as string[],
		bundleProductIds: [] as string[],
		tierRulesJson: TIER_TEMPLATE,
		wording: 'Instant Price Drop',
		isActive: true,
		stackable: false,
	}
}

export function normalizeDiscountFormData(data: any) {
	const defaults = getDefaultDiscountForm()

	if (!data) return defaults

	const { productId: legacyProductId, ...rest } = data
	const parsedApplicableProductIds = parseStringArrayFromMixed(data.applicableProductIds)

	return {
		...defaults,
		...rest,
		startDate: data.startDate
			? new Date(data.startDate).toISOString().slice(0, 16)
			: defaults.startDate,
		endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
		applicableProductIds:
			parsedApplicableProductIds.length > 0
				? parsedApplicableProductIds
				: typeof legacyProductId === 'string' && legacyProductId.trim()
					? [legacyProductId.trim()]
					: defaults.applicableProductIds,
		applicableCategories: parseStringArrayFromMixed(data.applicableCategories),
		bundleProductIds: parseStringArrayFromMixed(data.bundleProductIds),
		tierRulesJson:
			typeof data.tierRulesJson === 'string' && data.tierRulesJson.trim()
				? data.tierRulesJson
				: defaults.tierRulesJson,
		wording: data.wording || defaults.wording,
	}
}
