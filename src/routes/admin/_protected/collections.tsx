import { createFileRoute } from '@tanstack/react-router'
import CollectionsClient from '@/features/admin/collections/CollectionsClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/collections')({
	loader: () => getAdminCrudDataFn({ data: { type: 'collections' } }),
	head: () => ({ meta: [{ title: 'Collections | South Asian Fashion Admin' }] }),
	component: CollectionsPage,
})

function CollectionsPage() {
	const data = Route.useLoaderData()
	return (
		<CollectionsClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
