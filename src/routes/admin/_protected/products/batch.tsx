import { createFileRoute } from '@tanstack/react-router'
import BatchImportClient from '@/features/admin/products/batch/BatchImportClient'
import { getBatchImportDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/products/batch')({
	loader: () => getBatchImportDataFn(),
	head: () => ({ meta: [{ title: 'Batch Import | South Asian Fashion Admin' }] }),
	component: BatchImportPage,
})

function BatchImportPage() {
	const data = Route.useLoaderData()

	return (
		<div className="p-6 md:p-10 max-w-5xl mx-auto">
			<BatchImportClient
				collections={data.collections}
				categories={data.categories}
				models={data.models}
			/>
		</div>
	)
}
