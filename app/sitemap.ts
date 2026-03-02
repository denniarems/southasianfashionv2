import type { MetadataRoute } from 'next'
import { getDb } from '@/db'
import { products, collections } from '@/db/schema'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const db = getDb()

	const [allProducts, allCollections] = await Promise.all([
		db
			.select({
				slug: products.slug,
				id: products.id,
				createdAt: products.createdAt,
			})
			.from(products),
		db
			.select({
				slug: collections.slug,
				createdAt: collections.createdAt,
			})
			.from(collections),
	])

	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: `${siteUrl}/`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1,
		},
		{
			url: `${siteUrl}/products`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.9,
		},
		{
			url: `${siteUrl}/collections`,
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 0.8,
		},
	]

	type ProductSitemapEntry = (typeof allProducts)[number]
	type CollectionSitemapEntry = (typeof allCollections)[number]

	const productRoutes: MetadataRoute.Sitemap = allProducts.map((product: ProductSitemapEntry) => ({
		url: `${siteUrl}/products/${product.slug || product.id}`,
		lastModified: new Date(product.createdAt),
		changeFrequency: 'weekly',
		priority: 0.7,
	}))

	const collectionRoutes: MetadataRoute.Sitemap = allCollections.map(
		(collection: CollectionSitemapEntry) => ({
		url: `${siteUrl}/collections/${collection.slug}`,
		lastModified: new Date(collection.createdAt),
		changeFrequency: 'weekly',
		priority: 0.7,
		}),
	)

	return [...staticRoutes, ...productRoutes, ...collectionRoutes]
}
