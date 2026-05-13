export const ANALYTICS_EVENT_NAMES = [
	'product_view',
	'add_to_cart',
	'whatsapp_click',
	'share_click',
	'filter_apply',
	'wishlist_toggle',
	'customization_start',
	'admin_merchandising_action',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

export type AnalyticsInput = {
	eventName: AnalyticsEventName
	route?: string
	productId?: string
	productSlug?: string
	collectionId?: string
	collectionSlug?: string
	category?: string
	filterKeys?: string[] | string
	deviceClass?: string
	value?: number
}

export type SanitizedAnalyticsEvent = Required<
	Pick<AnalyticsInput, 'eventName' | 'route' | 'deviceClass'>
> &
	Pick<
		AnalyticsInput,
		'productId' | 'productSlug' | 'collectionId' | 'collectionSlug' | 'category'
	> & {
		filterKeys: string
		timestampBucket: string
		value: number
	}

const EVENT_SET = new Set<string>(ANALYTICS_EVENT_NAMES)
const SAFE_TEXT = /^[a-zA-Z0-9][a-zA-Z0-9_./:?=& -]{0,159}$/

function safeString(value: unknown) {
	if (typeof value !== 'string') return undefined
	const trimmed = value.trim()
	if (!trimmed || !SAFE_TEXT.test(trimmed)) return undefined
	return trimmed.slice(0, 160)
}

export function deviceClassFromUserAgent(userAgent = '') {
	const normalized = userAgent.toLowerCase()
	if (/ipad|tablet/.test(normalized)) return 'tablet'
	if (/mobile|iphone|android/.test(normalized)) return 'mobile'
	if (normalized) return 'desktop'
	return 'unknown'
}

export function timestampBucket(date = new Date()) {
	const bucket = new Date(date)
	bucket.setUTCMinutes(0, 0, 0)
	return bucket.toISOString()
}

export function sanitizeAnalyticsInput(
	input: unknown,
	options: { userAgent?: string; route?: string } = {},
): SanitizedAnalyticsEvent | null {
	if (!input || typeof input !== 'object' || Array.isArray(input)) return null
	const row = input as Record<string, unknown>
	const eventName = safeString(row.eventName)
	if (!eventName || !EVENT_SET.has(eventName)) return null

	const rawFilterKeys = Array.isArray(row.filterKeys)
		? row.filterKeys
		: typeof row.filterKeys === 'string'
			? row.filterKeys.split(',')
			: []
	const filterKeys = rawFilterKeys
		.flatMap((value) => {
			const normalized = safeString(value)
			return normalized ? [normalized] : []
		})
		.slice(0, 12)
		.join(',')

	const value = Number(row.value)

	return {
		eventName: eventName as AnalyticsEventName,
		route: safeString(row.route) || options.route || '/',
		productId: safeString(row.productId),
		productSlug: safeString(row.productSlug),
		collectionId: safeString(row.collectionId),
		collectionSlug: safeString(row.collectionSlug),
		category: safeString(row.category),
		filterKeys,
		deviceClass: safeString(row.deviceClass) || deviceClassFromUserAgent(options.userAgent),
		timestampBucket: timestampBucket(),
		value: Number.isFinite(value) && value > 0 ? value : 1,
	}
}

export function trackAnalyticsEvent(event: AnalyticsInput) {
	if (typeof window === 'undefined') return

	const payload = {
		...event,
		route: event.route || window.location.pathname,
		deviceClass:
			event.deviceClass ||
			(window.matchMedia('(max-width: 640px)').matches
				? 'mobile'
				: window.matchMedia('(max-width: 1024px)').matches
					? 'tablet'
					: 'desktop'),
	}
	const body = JSON.stringify(payload)

	try {
		if ('sendBeacon' in navigator) {
			const sent = navigator.sendBeacon(
				'/api/analytics',
				new Blob([body], { type: 'application/json' }),
			)
			if (sent) return
		}
	} catch {
		// Fall back to fetch below.
	}

	void fetch('/api/analytics', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body,
		keepalive: true,
	}).catch(() => undefined)
}
