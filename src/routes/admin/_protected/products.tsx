import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import ProductsClient from '@/features/admin/products/ProductsClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/products')({
	loader: () => getAdminCrudDataFn({ data: { type: 'products' } }),
	head: () => ({ meta: [{ title: 'Products | South Asian Fashion Admin' }] }),
	component: ProductsPage,
})

function ProductsPage() {
	const pathname = useLocation({ select: (location) => location.pathname })
	const data = Route.useLoaderData()

	if (pathname !== '/admin/products') {
		return <Outlet />
	}

	return (
		<ProductsClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
