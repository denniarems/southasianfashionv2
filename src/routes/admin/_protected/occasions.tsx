import { createFileRoute } from '@tanstack/react-router'
import OccasionsClient from '@/features/admin/occasions/OccasionsClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/occasions')({
	loader: () => getAdminCrudDataFn({ data: { type: 'occasions' } }),
	head: () => ({ meta: [{ title: 'Occasions | South Asian Fashion Admin' }] }),
	component: OccasionsPage,
})

function OccasionsPage() {
	const data = Route.useLoaderData()
	return (
		<OccasionsClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialOccasions={data.initialOccasions}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
