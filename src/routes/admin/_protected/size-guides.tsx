import { createFileRoute } from '@tanstack/react-router'
import SizeGuidesClient from '@/features/admin/size-guides/SizeGuidesClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/size-guides')({
	loader: () => getAdminCrudDataFn({ data: { type: 'size-guides' } }),
	head: () => ({ meta: [{ title: 'Size Guides | South Asian Fashion Admin' }] }),
	component: SizeGuidesPage,
})

function SizeGuidesPage() {
	const data = Route.useLoaderData()
	return (
		<SizeGuidesClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
