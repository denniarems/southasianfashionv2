import { createFileRoute } from '@tanstack/react-router'
import Navbar from '@/features/storefront/components/Navbar'
import Footer from '@/features/storefront/components/Footer'
import ProductsGrid from '@/features/storefront/components/ProductsGrid'
import { fetchProductsFn } from '@/server/products.functions'
import { getProductsShellDataFn } from '@/server/storefront.functions'

export const Route = createFileRoute('/products/')({
	validateSearch: (search: Record<string, unknown>) => ({
		category: typeof search.category === 'string' ? search.category : '',
	}),
	loaderDeps: ({ search }) => ({ category: search.category }),
	loader: async ({ deps }) => {
		const [initialResult, shell] = await Promise.all([
			fetchProductsFn({
				data: { search: '', category: deps.category, sort: 'newest', offset: 0 },
			}),
			getProductsShellDataFn(),
		])

		return { initialResult, ...shell, initialCategory: deps.category }
	},
	head: () => ({
		meta: [
			{ title: 'Products | South Asian Fashion' },
			{
				name: 'description',
				content:
					'Browse all available South Asian Fashion products and discover your next statement piece.',
			},
		],
	}),
	component: ProductsPage,
})

function ProductsPage() {
	const {
		initialResult,
		allCollections,
		siteSettings,
		productCategories,
		currentYear,
		initialCategory,
	} = Route.useLoaderData()

	return (
		<>
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
				initialCategory={initialCategory}
			/>

			<Footer settings={siteSettings} year={currentYear} />
		</>
	)
}
