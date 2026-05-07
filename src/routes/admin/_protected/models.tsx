import { createFileRoute } from '@tanstack/react-router'
import ModelsClient from '@/features/admin/models/ModelsClient'
import { getModelsAdminDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/models')({
	loader: () => getModelsAdminDataFn(),
	head: () => ({ meta: [{ title: 'Models | South Asian Fashion Admin' }] }),
	component: ModelsPage,
})

function ModelsPage() {
	const data = Route.useLoaderData()
	return <ModelsClient initialModels={data.models} />
}
