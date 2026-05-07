import { createFileRoute } from '@tanstack/react-router'
import HeroesClient from '@/features/admin/heroes/HeroesClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/heroes')({
	loader: () => getAdminCrudDataFn({ data: { type: 'hero' } }),
	head: () => ({ meta: [{ title: 'Hero Banners | South Asian Fashion Admin' }] }),
	component: HeroesPage,
})

function HeroesPage() {
	const data = Route.useLoaderData()
	return (
		<HeroesClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
