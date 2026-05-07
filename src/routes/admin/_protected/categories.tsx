import { createFileRoute } from '@tanstack/react-router'
import CategoriesClient from '@/features/admin/categories/CategoriesClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/categories')({
	loader: () => getAdminCrudDataFn({ data: { type: 'categories' } }),
	head: () => ({ meta: [{ title: 'Categories | South Asian Fashion Admin' }] }),
	component: CategoriesPage,
})

function CategoriesPage() {
	const data = Route.useLoaderData()
	return (
		<CategoriesClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
