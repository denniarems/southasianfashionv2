'use server'

import { getDb } from '@/db'
import { discounts, discountUsages } from '@/db/schema'
import { inArray, sql } from 'drizzle-orm'
import { computeCartDiscounts } from '@/lib/discounts'

export async function applyDiscountsToCart(input: {
	items: Array<{ productId: string; quantity: number }>
	userKey?: string
	commitUsage?: boolean
}) {
	try {
		if (!input?.items || !Array.isArray(input.items)) {
			return { error: 'Invalid cart payload' }
		}

		const summary = await computeCartDiscounts(input.items, input.userKey)

		if (input.commitUsage && input.userKey && summary.appliedDiscountIds.length > 0) {
			const db = getDb()
			const now = new Date().toISOString()

			await Promise.all(
				summary.appliedDiscountIds.map((discountId) =>
					db
						.insert(discountUsages)
						.values({
							discountId,
							userKey: input.userKey as string,
							useCount: 1,
							lastUsedAt: now,
						})
						.onConflictDoUpdate({
							target: [discountUsages.discountId, discountUsages.userKey],
							set: {
								useCount: sql`${discountUsages.useCount} + 1`,
								lastUsedAt: now,
							},
						}),
				),
			)

			await db
				.update(discounts)
				.set({
					usageCount: sql`${discounts.usageCount} + 1`,
					updatedAt: now,
				})
				.where(inArray(discounts.id, summary.appliedDiscountIds))
		}

		return { success: true, summary }
	} catch (error: any) {
		return { error: error.message || 'Failed to apply discounts' }
	}
}