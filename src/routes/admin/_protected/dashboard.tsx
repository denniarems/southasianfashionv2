import { createFileRoute } from '@tanstack/react-router'
import DashboardOverviewClient from '@/features/admin/dashboard/DashboardOverviewClient'
import { getDashboardOverviewDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/dashboard')({
	loader: () => getDashboardOverviewDataFn(),
	head: () => ({ meta: [{ title: 'Dashboard | South Asian Fashion Admin' }] }),
	component: DashboardPage,
})

function DashboardPage() {
	const data = Route.useLoaderData()
	return (
		<DashboardOverviewClient
			stats={data.stats}
			recentProducts={data.recentProducts}
			recentCollections={data.recentCollections}
			analyticsSummary={data.analyticsSummary}
			merchandisingWarnings={data.merchandisingWarnings}
		/>
	)
}
