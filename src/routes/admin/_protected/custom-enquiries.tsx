import { createFileRoute } from '@tanstack/react-router'
import CustomEnquiriesClient from '@/features/admin/custom-enquiries/CustomEnquiriesClient'
import { getCustomEnquiriesAdminDataFn } from '@/server/custom-enquiries.functions'

export const Route = createFileRoute('/admin/_protected/custom-enquiries')({
	loader: () => getCustomEnquiriesAdminDataFn(),
	head: () => ({ meta: [{ title: 'Custom Enquiries | South Asian Fashion Admin' }] }),
	component: CustomEnquiriesRoute,
})

function CustomEnquiriesRoute() {
	const data = Route.useLoaderData()
	return (
		<CustomEnquiriesClient
			enquiries={data.enquiries}
			migrationMissing={data.migrationMissing}
		/>
	)
}
