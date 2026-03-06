import { cache } from 'react'
import { and, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm'
import { getDb } from '@/db'
import { discounts, discountUsages, products } from '@/db/schema'
import { formatCad, STORE_CURRENCY } from '@/lib/currency'

export interface CartDiscountInput {
	productId: string
	quantity: number
}

interface TierRule {
	minCartValue: number
	discountValue: number
	discountType?: 'flat' | 'percentage'
}

export interface ProductPricePreview {
	hasDiscount: boolean
	originalPrice: number
	discountedPrice: number
	savingsAmount: number
	savingsPercent: number
	discountText: string
	badgeText: string
	endDate: string | null
}

export interface ComputedCartLine {
	productId: string
	name: string
	category: string | null
	currency: string
	quantity: number
	unitPrice: number
	lineOriginalTotal: number
	lineDiscountTotal: number
	lineFinalTotal: number
	appliedDiscountIds: string[]
}

export interface ComputedCartDiscountSummary {
	currency: string
	originalSubtotal: number
	lineDiscountTotal: number
	cartLevelDiscountTotal: number
	totalSavings: number
	discountedSubtotal: number
	lines: ComputedCartLine[]
	appliedDiscountIds: string[]
}

type ProductRow = typeof products.$inferSelect
type DiscountRow = typeof discounts.$inferSelect

type ProductLookup = Pick<ProductRow, 'id' | 'name' | 'category' | 'price' | 'currency'>

function parseTierRules(input: string | null | undefined): TierRule[] {
	if (!input) return []

	try {
		const parsed: unknown = JSON.parse(input)
		if (!Array.isArray(parsed)) return []

		const normalized = parsed.map((rule) => {
			if (!rule || typeof rule !== 'object') return null

			const minCartValue = Number((rule as { minCartValue?: unknown }).minCartValue)
			const discountValue = Number((rule as { discountValue?: unknown }).discountValue)
			const discountType = (rule as { discountType?: unknown }).discountType

			if (!Number.isFinite(minCartValue) || !Number.isFinite(discountValue)) return null
			if (discountType !== undefined && discountType !== 'flat' && discountType !== 'percentage') {
				return null
			}

			return {
				minCartValue,
				discountValue,
				discountType: discountType as TierRule['discountType'],
			}
		})

		const validRules = normalized.filter((rule): rule is NonNullable<typeof rule> => rule !== null)

		return validRules.sort((a, b) => b.minCartValue - a.minCartValue)
	} catch {
		return []
	}
}

function toDiscountText(discount: DiscountRow): string {
	if (discount.discountType === 'percentage') {
		return `${discount.discountValue}% Price Drop`
	}

	const amount = Math.round(discount.discountValue)
	if (discount.wording?.trim()) {
		return `${discount.wording.trim()} ${formatCad(amount)}`
	}

	return `Instant ${formatCad(amount)} Price Drop`
}

function resolveStacking(discountRows: DiscountRow[]): DiscountRow[] {
	if (discountRows.length === 0) return []
	const sorted = [...discountRows].sort((a, b) => b.priority - a.priority)
	const highestNonStackable = sorted.find((d) => !d.stackable)
	if (highestNonStackable) {
		return [highestNonStackable]
	}
	return sorted
}

function canApplyToProduct(discount: DiscountRow, product: ProductLookup): boolean {
	if (discount.applicableProductIds.length > 0) {
		if (!discount.applicableProductIds.includes(product.id)) {
			return false
		}
	} else if (discount.productId && discount.productId !== product.id) {
		return false
	}

	if (discount.applicableCategories.length > 0) {
		if (!product.category) return false
		return discount.applicableCategories.includes(product.category)
	}

	if (discount.applicableProductIds.length > 0 || discount.productId) {
		return true
	}

	return true
}

function computeDiscountAmount(
	discount: DiscountRow,
	remainingAmount: number,
	lineQuantity: number,
): number {
	if (remainingAmount <= 0) return 0

	if (discount.discountType === 'percentage') {
		return (remainingAmount * discount.discountValue) / 100
	}

	if (discount.discountType === 'flat') {
		const flatPerLine = discount.discountValue * lineQuantity
		return Math.min(remainingAmount, Math.max(0, flatPerLine))
	}

	return 0
}

const getActiveDiscountsCached = cache(async () => {
	const db = getDb()
	const now = new Date()

	return db
		.select()
		.from(discounts)
		.where(
			and(
				eq(discounts.isActive, true),
				lte(discounts.startDate, now),
				or(isNull(discounts.endDate), gte(discounts.endDate, now)),
			),
		)
})

async function getPerUserUsageMap(
	discountIds: string[],
	userKey?: string,
): Promise<Map<string, number>> {
	if (!userKey || discountIds.length === 0) {
		return new Map()
	}

	const db = getDb()
	const rows = await db
		.select()
		.from(discountUsages)
		.where(
			and(eq(discountUsages.userKey, userKey), inArray(discountUsages.discountId, discountIds)),
		)

	const map = new Map<string, number>()
	for (const row of rows) {
		map.set(row.discountId, row.useCount)
	}
	return map
}

function filterUsableDiscounts(
	discountRows: DiscountRow[],
	perUserUsage: Map<string, number>,
): DiscountRow[] {
	return discountRows.filter((discount) => {
		if (discount.maxUses === null) return true
		if (discount.usageCount >= discount.maxUses) return false

		const userUseCount = perUserUsage.get(discount.id) ?? 0
		return userUseCount < discount.maxUses
	})
}

export async function previewProductPrice(product: ProductLookup): Promise<ProductPricePreview> {
	const discountSummary = await computeCartDiscounts(
		[{ productId: product.id, quantity: 1 }],
		undefined,
	)

	const line = discountSummary.lines[0]
	const savingsAmount = line ? line.lineDiscountTotal : 0
	const originalPrice = line ? line.unitPrice : product.price
	const discountedPrice = line ? line.lineFinalTotal : product.price
	const savingsPercent = originalPrice > 0 ? (savingsAmount / originalPrice) * 100 : 0

	const activeDiscounts = (await getActiveDiscountsCached()) as DiscountRow[]
	const relevant = activeDiscounts
		.filter((d: DiscountRow) => canApplyToProduct(d, product))
		.sort((a: DiscountRow, b: DiscountRow) => b.priority - a.priority)

	const top = relevant[0]
	const discountText = top ? toDiscountText(top) : ''
	const badgeText = top
		? top.discountType === 'percentage'
			? `${Math.round(top.discountValue)}% OFF`
			: `${formatCad(Math.round(top.discountValue))} OFF`
		: ''

	return {
		hasDiscount: savingsAmount > 0,
		originalPrice,
		discountedPrice,
		savingsAmount,
		savingsPercent,
		discountText,
		badgeText,
		endDate: top?.endDate ? top.endDate.toISOString() : null,
	}
}

export async function computeCartDiscounts(
	items: CartDiscountInput[],
	userKey?: string,
): Promise<ComputedCartDiscountSummary> {
	const db = getDb()
	const normalizedItems = items
		.filter((item) => item.quantity > 0 && item.productId)
		.map((item) => ({ ...item, quantity: Math.floor(item.quantity) }))
		.filter((item) => item.quantity > 0)

	if (normalizedItems.length === 0) {
		return {
			currency: STORE_CURRENCY,
			originalSubtotal: 0,
			lineDiscountTotal: 0,
			cartLevelDiscountTotal: 0,
			totalSavings: 0,
			discountedSubtotal: 0,
			lines: [],
			appliedDiscountIds: [],
		}
	}

	const productIds = normalizedItems.map((item) => item.productId)
	const [productRowsRaw, allActiveDiscountsRaw] = await Promise.all([
		db
			.select({
				id: products.id,
				name: products.name,
				category: products.category,
				price: products.price,
				currency: products.currency,
			})
			.from(products)
			.where(inArray(products.id, productIds)),
		getActiveDiscountsCached(),
	])

	const productRows = productRowsRaw as ProductLookup[]
	const allActiveDiscounts = allActiveDiscountsRaw as DiscountRow[]

	const productMap = new Map<string, ProductLookup>(
		productRows.map((p: ProductLookup) => [p.id, p]),
	)
	const discountIds = allActiveDiscounts.map((d: DiscountRow) => d.id)
	const perUserUsage = await getPerUserUsageMap(discountIds, userKey)
	const usableDiscounts = filterUsableDiscounts(allActiveDiscounts, perUserUsage)

	const lines = normalizedItems
		.map((item) => {
			const product = productMap.get(item.productId)
			if (!product) return null

			const lineOriginalTotal = product.price * item.quantity
			return {
				product,
				quantity: item.quantity,
				lineOriginalTotal,
			}
		})
		.filter((line): line is NonNullable<typeof line> => Boolean(line))

	if (lines.length === 0) {
		return {
			currency: STORE_CURRENCY,
			originalSubtotal: 0,
			lineDiscountTotal: 0,
			cartLevelDiscountTotal: 0,
			totalSavings: 0,
			discountedSubtotal: 0,
			lines: [],
			appliedDiscountIds: [],
		}
	}

	const currency = STORE_CURRENCY
	const originalSubtotal = lines.reduce((sum, line) => sum + line.lineOriginalTotal, 0)
	const lineDiscountMap = new Map<string, number>()
	const lineAppliedIds = new Map<string, string[]>()

	// Bundle discounts
	const bundleDiscounts = resolveStacking(
		usableDiscounts.filter(
			(discount) => discount.discountType === 'bundle' && discount.bundleProductIds.length > 0,
		),
	)

	const cartProductIdSet = new Set(lines.map((line) => line.product.id))

	for (const bundle of bundleDiscounts) {
		if (bundle.minCartValue > originalSubtotal) continue
		const qualifies = bundle.bundleProductIds.every((id) => cartProductIdSet.has(id))
		if (!qualifies) continue

		const affected = lines.filter((line) => bundle.bundleProductIds.includes(line.product.id))
		const affectedSubtotal = affected.reduce((sum, line) => sum + line.lineOriginalTotal, 0)
		if (affectedSubtotal <= 0) continue

		let bundleAmount = 0
		if (bundle.discountType === 'bundle' || bundle.discountType === 'flat') {
			bundleAmount = Math.min(bundle.discountValue, affectedSubtotal)
		} else if (bundle.discountType === 'percentage') {
			bundleAmount = (affectedSubtotal * bundle.discountValue) / 100
		}

		if (bundleAmount <= 0) continue

		for (const line of affected) {
			const ratio = line.lineOriginalTotal / affectedSubtotal
			const apportioned = bundleAmount * ratio
			const prev = lineDiscountMap.get(line.product.id) ?? 0
			lineDiscountMap.set(line.product.id, prev + apportioned)
			lineAppliedIds.set(line.product.id, [
				...(lineAppliedIds.get(line.product.id) ?? []),
				bundle.id,
			])
		}
	}

	// Product-level flat/percentage discounts
	for (const line of lines) {
		const applicable = usableDiscounts.filter((discount) => {
			if (discount.discountType !== 'flat' && discount.discountType !== 'percentage') {
				return false
			}
			if (discount.bundleProductIds.length > 0) {
				return false
			}
			if (discount.minCartValue > originalSubtotal) {
				return false
			}
			return canApplyToProduct(discount, line.product)
		})

		const resolved = resolveStacking(applicable)
		let remaining = line.lineOriginalTotal - (lineDiscountMap.get(line.product.id) ?? 0)

		for (const discount of resolved) {
			const discountAmount = computeDiscountAmount(discount, remaining, line.quantity)
			if (discountAmount <= 0) continue

			const prev = lineDiscountMap.get(line.product.id) ?? 0
			lineDiscountMap.set(line.product.id, prev + discountAmount)
			lineAppliedIds.set(line.product.id, [
				...(lineAppliedIds.get(line.product.id) ?? []),
				discount.id,
			])
			remaining = Math.max(0, remaining - discountAmount)
		}
	}

	const lineDiscountTotal = Array.from(lineDiscountMap.values()).reduce(
		(sum, value) => sum + value,
		0,
	)
	const subtotalAfterLineDiscounts = Math.max(0, originalSubtotal - lineDiscountTotal)

	const cartLevelCandidates = usableDiscounts.filter((discount) => {
		if (discount.discountType === 'bundle') return false
		if (discount.minCartValue > originalSubtotal) return false

		const isTiered = discount.discountType === 'tiered'
		const isStorewideFlatOrPercentage =
			(discount.discountType === 'flat' || discount.discountType === 'percentage') &&
			discount.applicableProductIds.length === 0 &&
			!discount.productId &&
			discount.applicableCategories.length === 0

		return isTiered || isStorewideFlatOrPercentage
	})

	const resolvedCartLevel = resolveStacking(cartLevelCandidates)
	let cartLevelDiscountTotal = 0
	const cartAppliedIds: string[] = []
	let remainingCartAmount = subtotalAfterLineDiscounts

	for (const discount of resolvedCartLevel) {
		if (remainingCartAmount <= 0) break

		let amount = 0
		if (discount.discountType === 'tiered') {
			const tierRules = parseTierRules(discount.tierRulesJson)
			const matchedTier = tierRules.find((rule) => remainingCartAmount >= rule.minCartValue)
			if (matchedTier) {
				if (matchedTier.discountType === 'flat') {
					amount = Math.min(remainingCartAmount, matchedTier.discountValue)
				} else {
					amount = (remainingCartAmount * matchedTier.discountValue) / 100
				}
			}
		} else {
			amount = computeDiscountAmount(discount, remainingCartAmount, 1)
		}

		if (amount <= 0) continue

		cartLevelDiscountTotal += amount
		remainingCartAmount = Math.max(0, remainingCartAmount - amount)
		cartAppliedIds.push(discount.id)
	}

	const discountedSubtotal = Math.max(0, subtotalAfterLineDiscounts - cartLevelDiscountTotal)
	const totalSavings = lineDiscountTotal + cartLevelDiscountTotal

	const computedLines: ComputedCartLine[] = lines.map((line) => {
		const lineDiscountTotalValue = Math.min(
			line.lineOriginalTotal,
			lineDiscountMap.get(line.product.id) ?? 0,
		)
		const lineFinalTotal = Math.max(0, line.lineOriginalTotal - lineDiscountTotalValue)

		return {
			productId: line.product.id,
			name: line.product.name,
			category: line.product.category,
			currency: STORE_CURRENCY,
			quantity: line.quantity,
			unitPrice: line.product.price,
			lineOriginalTotal: line.lineOriginalTotal,
			lineDiscountTotal: lineDiscountTotalValue,
			lineFinalTotal,
			appliedDiscountIds: lineAppliedIds.get(line.product.id) ?? [],
		}
	})

	const appliedDiscountIds = Array.from(
		new Set([...computedLines.flatMap((line) => line.appliedDiscountIds), ...cartAppliedIds]),
	)

	return {
		currency,
		originalSubtotal,
		lineDiscountTotal,
		cartLevelDiscountTotal,
		totalSavings,
		discountedSubtotal,
		lines: computedLines,
		appliedDiscountIds,
	}
}
