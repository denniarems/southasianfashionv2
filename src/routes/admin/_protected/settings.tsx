import { createFileRoute } from '@tanstack/react-router'
import SettingsClient from '@/features/admin/settings/SettingsClient'
import { getAdminCrudDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/settings')({
	loader: () => getAdminCrudDataFn({ data: { type: 'settings' } }),
	head: () => ({ meta: [{ title: 'Settings | South Asian Fashion Admin' }] }),
	component: SettingsPage,
})

function SettingsPage() {
	const data = Route.useLoaderData()
	return (
		<SettingsClient
			items={data.items}
			initialProducts={data.initialProducts}
			initialCollections={data.initialCollections}
			initialCategories={data.initialCategories}
			initialSizeGuides={data.initialSizeGuides}
		/>
	)
}
