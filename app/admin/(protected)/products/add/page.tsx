import { getDb } from '@/db'
import { collections, categories, sizeGuides, models } from '@/db/schema'
import { ProductForm } from '../../components/ProductForm'

export default async function AddProductPage() {
	const db = getDb()

	const [allCollections, allCategories, allSizeGuides, allModels] = await Promise.all([
		db.select().from(collections).orderBy(collections.name),
		db.select().from(categories).orderBy(categories.name),
		db.select().from(sizeGuides).orderBy(sizeGuides.name),
		db.select().from(models).orderBy(models.updatedAt),
	])

	return (
		<div className="p-6 md:p-10 max-w-4xl mx-auto">
			<ProductForm
				mode="add"
				collections={allCollections}
				categories={allCategories}
				sizeGuides={allSizeGuides}
				models={allModels}
			/>
		</div>
	)
}
