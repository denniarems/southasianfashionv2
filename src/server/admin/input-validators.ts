export type UnknownRecord = Record<string, unknown>

export function asRecord(value: unknown, label = 'Input'): UnknownRecord {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${label} must be an object`)
	}

	return value as UnknownRecord
}

export function optionalString(value: unknown): string | undefined {
	if (value === undefined || value === null) return undefined
	if (typeof value !== 'string') return undefined

	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : undefined
}

export function requiredString(value: unknown, label: string): string {
	const normalized = optionalString(value)
	if (!normalized) {
		throw new Error(`${label} is required`)
	}

	return normalized
}

export function stringWithDefault(value: unknown, fallback = ''): string {
	return optionalString(value) ?? fallback
}

export function numberValue(
	value: unknown,
	label: string,
	options: { min?: number; fallback?: number } = {},
): number {
	const numeric = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(numeric)) {
		if (options.fallback !== undefined) return options.fallback
		throw new Error(`${label} must be a number`)
	}

	if (options.min !== undefined && numeric < options.min) {
		throw new Error(`${label} must be at least ${options.min}`)
	}

	return numeric
}

export function optionalNumber(value: unknown, label: string, min?: number): number | null {
	if (value === undefined || value === null || value === '') return null
	return numberValue(value, label, min === undefined ? {} : { min })
}

export function booleanValue(value: unknown, fallback = false): boolean {
	if (typeof value === 'boolean') return value
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase()
		if (normalized === 'true') return true
		if (normalized === 'false') return false
	}

	return fallback
}

export function enumValue<const T extends readonly string[]>(
	value: unknown,
	allowed: T,
	label: string,
): T[number] {
	if (typeof value !== 'string' || !allowed.includes(value)) {
		throw new Error(`${label} must be one of: ${allowed.join(', ')}`)
	}

	return value
}

export function stringArrayValue(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap((item) => {
			if (typeof item !== 'string') {
				return []
			}

			const trimmed = item.trim()
			return trimmed ? [trimmed] : []
		})
	}

	if (typeof value === 'string') {
		const trimmed = value.trim()
		if (!trimmed) return []

		try {
			const parsed = JSON.parse(trimmed)
			if (Array.isArray(parsed)) {
				return stringArrayValue(parsed)
			}
		} catch {
			// Fall through to comma-separated parsing.
		}

		return trimmed.split(',').flatMap((item) => {
			const normalized = item.trim()
			return normalized ? [normalized] : []
		})
	}

	return []
}

export function dateValue(value: unknown, label: string, fallback?: Date): Date {
	if (value === undefined || value === null || value === '') {
		if (fallback) return fallback
		throw new Error(`${label} is required`)
	}

	const date = value instanceof Date ? value : new Date(String(value))
	if (Number.isNaN(date.getTime())) {
		throw new Error(`${label} must be a valid date`)
	}

	return date
}

export function isoStringValue(value: unknown, fallback = new Date().toISOString()): string {
	const normalized = optionalString(value)
	if (!normalized) return fallback

	const date = new Date(normalized)
	return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

export function jsonArrayString(value: unknown, label: string, fallback = '[]'): string {
	if (value === undefined || value === null || value === '') return fallback

	const raw = typeof value === 'string' ? value : JSON.stringify(value)
	try {
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) {
			throw new Error(`${label} must be a JSON array`)
		}

		return JSON.stringify(parsed)
	} catch (error) {
		if (error instanceof Error && error.message.includes('must be a JSON array')) {
			throw error
		}

		throw new Error(`${label} must be valid JSON`)
	}
}
