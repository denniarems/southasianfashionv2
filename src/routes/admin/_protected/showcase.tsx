import { createFileRoute } from '@tanstack/react-router'
import ShowcaseClient from '@/features/admin/showcase/ShowcaseClient'
import { getShowcaseDataFn } from '@/server/admin/showcase.functions'

export const Route = createFileRoute('/admin/_protected/showcase')({
	loader: () => getShowcaseDataFn(),
	component: ShowcasePage,
})

function ShowcasePage() {
	const data = Route.useLoaderData()
	return <ShowcaseClient models={data.models} />
}
