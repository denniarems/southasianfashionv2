import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import { analyticsEvents } from '@/db/schema'
import { sanitizeAnalyticsInput } from '@/lib/analytics'

function isMissingAnalyticsTableError(error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes('analytics_events') &&
		(message.includes('does not exist') || message.includes('no such table'))
	)
}

function writeAnalyticsEngine(event: NonNullable<ReturnType<typeof sanitizeAnalyticsInput>>) {
	try {
		env.ANALYTICS?.writeDataPoint({
			blobs: [
				event.eventName,
				event.route,
				event.productId || '',
				event.productSlug || '',
				event.collectionId || '',
				event.collectionSlug || '',
				event.category || '',
				event.filterKeys,
				event.deviceClass,
				event.timestampBucket,
			],
			doubles: [event.value],
			indexes: [event.productId || event.collectionId || event.route || event.eventName],
		})
	} catch (error) {
		console.warn({
			level: 'warn',
			source: 'analytics',
			message: 'analytics_engine_write_failed',
			eventName: event.eventName,
			route: event.route,
			error: error instanceof Error ? error.message : String(error),
		})
	}
}

export const Route = createFileRoute('/api/analytics')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				let input: unknown
				try {
					input = await request.json()
				} catch {
					return Response.json({ ok: false }, { status: 400 })
				}

				const url = new URL(request.url)
				const event = sanitizeAnalyticsInput(input, {
					userAgent: request.headers.get('user-agent') || '',
					route: url.pathname,
				})

				if (!event) {
					return Response.json({ ok: false }, { status: 400 })
				}

				writeAnalyticsEngine(event)

				try {
					const db = await getDb()
					const createdAt = new Date().toISOString()
					await db
						.insert(analyticsEvents)
						.values({
							id: crypto.randomUUID(),
							eventName: event.eventName,
							route: event.route,
							productId: event.productId || null,
							productSlug: event.productSlug || null,
							collectionId: event.collectionId || null,
							collectionSlug: event.collectionSlug || null,
							category: event.category || null,
							filterKeys: event.filterKeys,
							deviceClass: event.deviceClass,
							timestampBucket: event.timestampBucket,
							value: event.value,
							createdAt,
						})
						.run()
				} catch (error) {
					if (!isMissingAnalyticsTableError(error)) {
						console.warn({
							level: 'warn',
							source: 'analytics',
							message: 'analytics_d1_write_failed',
							eventName: event.eventName,
							route: event.route,
							error: error instanceof Error ? error.message : String(error),
						})
					}
				}

				return Response.json({ ok: true })
			},
		},
	},
})
