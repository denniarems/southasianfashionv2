import { createFileRoute } from '@tanstack/react-router'
import { ProductForm } from '@/features/admin/components/ProductForm'
import { getProductFormDataFn } from '@/server/admin/data.functions'

export const Route = createFileRoute('/admin/_protected/products/add')({
	loader: () => getProductFormDataFn(),
	head: () => ({ meta: [{ title: 'Add Product | South Asian Fashion Admin' }] }),
	component: AddProductPage,
})

function AddProductPage() {
	const data = Route.useLoaderData()

	return (
		<div className="p-6 md:p-10 max-w-4xl mx-auto">
			<ProductForm
				mode="add"
				collections={data.collections}
				categories={data.categories}
				occasions={data.occasions}
				sizeGuides={data.sizeGuides}
				models={data.models}
			/>
		</div>
	)
}
