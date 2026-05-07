import { createFileRoute } from '@tanstack/react-router'
import DiscountsClient from '@/features/admin/discounts/DiscountsClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/discounts')({
	loader: () => getAdminCrudDataFn({ data: { type: 'discounts' } }),
	head: () => ({ meta: [{ title: 'Discounts | South Asian Fashion Admin' }] }),
	component: DiscountsPage,
})

function DiscountsPage() {
	const data = Route.useLoaderData()
	return (
		<DiscountsClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
