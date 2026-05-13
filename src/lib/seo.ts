import type { ProductPricePreview } from '@/lib/discounts'

export const SITE_NAME = 'South Asian Fashion'
export const CANONICAL_SITE_URL = 'https://southasianfashion.ca'

type StoreSettings = {
	brandName?: string | null
	brandTagline?: string | null
	whatsappNumber?: string | null
	contactEmail?: string | null
	instagramUrl?: string | null
	facebookUrl?: string | null
}

type ProductLike = {
	id: string
	name: string
	slug?: string | null
	description?: string | null
	price: number
	category?: string | null
	imageUrl?: string | null
	availabilityStatus?: string | null
}

type CollectionLike = {
	id?: string
	name: string
	slug: string
	description?: string | null
	imageUrl?: string | null
	seoTitle?: string | null
	seoDescription?: string | null
}

export function getSiteUrl() {
	return (process.env.SITE_URL || CANONICAL_SITE_URL).replace(/\/$/, '')
}

export function absoluteUrl(value: string | null | undefined, siteUrl = getSiteUrl()) {
	if (!value) return `${siteUrl}/logo.png`
	if (/^https?:\/\//i.test(value)) return value
	return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`
}

export function routeCanonical(pathname = '/', siteUrl = getSiteUrl()) {
	const path = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}`
	return `${siteUrl}${path === '/' ? '/' : path}`
}

export function jsonLdScriptContent(value: unknown) {
	return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function productCanonical(product: ProductLike, siteUrl = getSiteUrl()) {
	return routeCanonical(`/products/${product.slug || product.id}`, siteUrl)
}

export function collectionCanonical(collection: CollectionLike, siteUrl = getSiteUrl()) {
	return routeCanonical(`/collections/${collection.slug}`, siteUrl)
}

export function productTitle(product: ProductLike) {
	const category = product.category ? ` ${product.category}` : ''
	return `${product.name}${category} | ${SITE_NAME}`
}

export function productDescription(product: ProductLike) {
	const fallback = `Explore ${product.name} from ${SITE_NAME} in Ottawa. Private fitting requests and atelier review available.`
	const source = product.description?.trim() || fallback
	return source.length > 158 ? `${source.slice(0, 155).trim()}...` : source
}

export function collectionTitle(collection: CollectionLike) {
	return collection.seoTitle?.trim() || `${collection.name} Collection | ${SITE_NAME}`
}

export function collectionDescription(collection: CollectionLike) {
	const source =
		collection.seoDescription?.trim() ||
		collection.description?.trim() ||
		`Explore the ${collection.name} collection from ${SITE_NAME}.`
	return source.length > 158 ? `${source.slice(0, 155).trim()}...` : source
}

export function fashionStoreJsonLd(settings?: StoreSettings | null) {
	const brandName = settings?.brandName?.trim() || SITE_NAME
	const phone = settings?.whatsappNumber?.trim() || '+1-613-000-0000'
	const sameAs = [settings?.instagramUrl, settings?.facebookUrl].filter((url): url is string =>
		Boolean(url),
	)

	return {
		'@context': 'https://schema.org',
		'@type': 'FashionStore',
		'@id': `${getSiteUrl()}/#store`,
		name: brandName,
		url: getSiteUrl(),
		image: absoluteUrl('/logo.png'),
		description:
			settings?.brandTagline?.trim() ||
			'Curated luxury South Asian fashion, culturally rooted and globally inspired.',
		telephone: phone,
		email: settings?.contactEmail || undefined,
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Ottawa',
			addressRegion: 'ON',
			addressCountry: 'CA',
		},
		openingHoursSpecification: [
			{
				'@type': 'OpeningHoursSpecification',
				dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				opens: '10:00',
				closes: '18:00',
			},
		],
		sameAs: sameAs.length > 0 ? sameAs : undefined,
	}
}

export function productJsonLd({
	product,
	pricing,
	images,
	url,
}: {
	product: ProductLike
	pricing: ProductPricePreview
	images: string[]
	url: string
}) {
	const availability =
		product.availabilityStatus === 'ready-to-ship' || product.availabilityStatus === 'in-stock'
			? 'https://schema.org/InStock'
			: 'https://schema.org/PreOrder'

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: productDescription(product),
		image: images.map((image) => absoluteUrl(image)),
		sku: product.id,
		brand: {
			'@type': 'Brand',
			name: SITE_NAME,
		},
		category: product.category || undefined,
		offers: {
			'@type': 'Offer',
			priceCurrency: 'CAD',
			price: pricing.discountedPrice.toFixed(2),
			priceValidUntil: pricing.endDate || undefined,
			availability,
			url,
		},
	}
}

export function breadcrumbJsonLd(items: Array<{ label: string; href?: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.label,
			item: item.href ? absoluteUrl(item.href) : undefined,
		})),
	}
}

export function itemListJsonLd(items: ProductLike[], pathname: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		url: routeCanonical(pathname),
		numberOfItems: items.length,
		itemListElement: items.map((product, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			url: productCanonical(product),
			name: product.name,
		})),
	}
}
