import { createFileRoute } from '@tanstack/react-router'
import Navbar from '@/features/storefront/components/Navbar'
import Footer from '@/features/storefront/components/Footer'
import ProductsGrid from '@/features/storefront/components/ProductsGrid'
import { fetchProductsFn } from '@/server/products.functions'
import { getProductsShellDataFn } from '@/server/storefront.functions'
import { occasionLabelForSlug } from '@/lib/merchandising'
import { absoluteUrl, itemListJsonLd, jsonLdScriptContent, routeCanonical } from '@/lib/seo'

const FILTER_KEYS = [
	'category',
	'occasion',
	'fabric',
	'color',
	'availability',
	'priceMin',
	'priceMax',
	'sort',
	'search',
] as const

function stringSearch(value: unknown) {
	if (typeof value !== 'string') return undefined
	const trimmed = value.trim()
	return trimmed ? trimmed : undefined
}

export const Route = createFileRoute('/products/')({
	validateSearch: (search: Record<string, unknown>) => ({
		category: stringSearch(search.category),
		occasion: stringSearch(search.occasion),
		fabric: stringSearch(search.fabric),
		color: stringSearch(search.color),
		availability: stringSearch(search.availability),
		priceMin: stringSearch(search.priceMin),
		priceMax: stringSearch(search.priceMax),
		sort: stringSearch(search.sort),
		search: stringSearch(search.search),
	}),
	loaderDeps: ({ search }) => ({
		category: search.category || '',
		occasion: search.occasion || '',
		fabric: search.fabric || '',
		color: search.color || '',
		availability: search.availability || '',
		priceMin: search.priceMin || '',
		priceMax: search.priceMax || '',
		sort: search.sort || 'newest',
		search: search.search || '',
	}),
	loader: async ({ deps }) => {
		const [initialResult, shell] = await Promise.all([
			fetchProductsFn({
				data: { ...deps, offset: 0 },
			}),
			getProductsShellDataFn(),
		])

		const activeFilterKeys = FILTER_KEYS.filter((key) => key !== 'sort' && Boolean(deps[key]))
		const isCuratedOccasion =
			activeFilterKeys.length === 1 &&
			Boolean(deps.occasion) &&
			shell.occasionLinks.some((occasion) => occasion.slug === deps.occasion)

		return {
			initialResult,
			...shell,
			initialFilters: deps,
			canonicalPath: isCuratedOccasion ? `/products?occasion=${deps.occasion}` : '/products',
		}
	},
	head: ({ loaderData }) => {
		const filters = loaderData?.initialFilters
		const occasion = filters?.occasion
			? occasionLabelForSlug(filters.occasion, loaderData?.occasionLinks)
			: ''
		const title = occasion
			? `${occasion} South Asian Fashion | South Asian Fashion`
			: 'Products | South Asian Fashion'
		const description = occasion
			? `Browse curated ${occasion.toLowerCase()} South Asian outfits, jewelry, and custom inquiry-ready pieces in Ottawa.`
			: 'Browse all available South Asian Fashion products by occasion, fabric, color, availability, price, and style.'
		const canonical = routeCanonical(loaderData?.canonicalPath || '/products')

		return {
			meta: [
				{ title },
				{
					name: 'description',
					content: description,
				},
				{ property: 'og:title', content: title },
				{ property: 'og:description', content: description },
				{ property: 'og:url', content: canonical },
				{ property: 'og:image', content: absoluteUrl('/logo.png') },
				{ name: 'twitter:card', content: 'summary_large_image' },
			],
			links: [{ rel: 'canonical', href: canonical }],
		}
	},
	component: ProductsPage,
})

function ProductsPage() {
	const {
		initialResult,
		allCollections,
		siteSettings,
		productCategories,
		productFacets,
		occasionLinks,
		currentYear,
		initialFilters,
	} = Route.useLoaderData()

	return (
		<>
			<script type="application/ld+json">
				{jsonLdScriptContent(itemListJsonLd(initialResult.products, '/products'))}
			</script>
			<Navbar
				settings={siteSettings}
				collections={allCollections}
				categories={productCategories}
				transparent={false}
			/>

			<ProductsGrid
				initialProducts={initialResult.products}
				initialTotal={initialResult.total}
				initialHasMore={initialResult.hasMore}
				categories={productCategories}
				facets={productFacets}
				occasionLinks={occasionLinks}
				whatsappNumber={siteSettings?.whatsappNumber}
				initialFilters={initialFilters}
			/>

			<Footer settings={siteSettings} year={currentYear} />
		</>
	)
}
