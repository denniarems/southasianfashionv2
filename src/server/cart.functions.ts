import { createServerFn } from '@tanstack/react-start'
import { inArray, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { discounts, discountUsages } from '@/db/schema'
import { computeCartDiscounts } from '@/lib/discounts'

type ApplyDiscountsInput = {
	items: Array<{ productId: string; quantity: number }>
	userKey?: string
	commitUsage?: boolean
}

export const applyDiscountsToCartFn = createServerFn({ method: 'POST' })
	.inputValidator((data: ApplyDiscountsInput) => data)
	.handler(async ({ data }) => {
		try {
			if (!data?.items || !Array.isArray(data.items)) {
				return { error: 'Invalid cart payload' }
			}

			const summary = await computeCartDiscounts(data.items, data.userKey)

			if (data.commitUsage && data.userKey && summary.appliedDiscountIds.length > 0) {
				const db = await getDb()
				const now = new Date().toISOString()

				await Promise.all(
					summary.appliedDiscountIds.map((discountId) =>
						db
							.insert(discountUsages)
							.values({
								discountId,
								userKey: data.userKey as string,
								useCount: 1,
								lastUsedAt: now,
							})
							.onConflictDoUpdate({
								target: [discountUsages.discountId, discountUsages.userKey],
								set: {
									useCount: sql`${discountUsages.useCount} + 1`,
									lastUsedAt: now,
								},
							})
							.run(),
					),
				)

				await db
					.update(discounts)
					.set({
						usageCount: sql`${discounts.usageCount} + 1`,
						updatedAt: now,
					})
					.where(inArray(discounts.id, summary.appliedDiscountIds))
					.run()
			}

			return { success: true, summary }
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Failed to apply discounts' }
		}
	})
