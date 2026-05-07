import { createFileRoute } from '@tanstack/react-router'
import { getSitemapDataFn } from '@/server/storefront.functions'

function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}

function urlEntry(url: string, lastModified: Date, changeFrequency: string, priority: number) {
	return `<url><loc>${escapeXml(url)}</loc><lastmod>${lastModified.toISOString()}</lastmod><changefreq>${changeFrequency}</changefreq><priority>${priority}</priority></url>`
}

export const Route = createFileRoute('/sitemap.xml')({
	server: {
		handlers: {
			GET: async () => {
				let data: Awaited<ReturnType<typeof getSitemapDataFn>>
				try {
					data = await getSitemapDataFn()
				} catch (error) {
					console.error({
						level: 'error',
						source: 'seo',
						message: 'sitemap_generation_failed',
						error: error instanceof Error ? error.message : String(error),
					})
					throw error
				}

				const now = new Date()
				const entries = [
					urlEntry(`${data.siteUrl}/`, now, 'daily', 1),
					urlEntry(`${data.siteUrl}/products`, now, 'daily', 0.9),
					...data.occasionLinks.map((occasion) =>
						urlEntry(`${data.siteUrl}/products?occasion=${occasion.slug}`, now, 'weekly', 0.75),
					),
					urlEntry(`${data.siteUrl}/collections`, now, 'weekly', 0.8),
					...data.products.map((product) =>
						urlEntry(
							`${data.siteUrl}/products/${product.slug || product.id}`,
							new Date(product.updatedAt || product.createdAt),
							'weekly',
							0.7,
						),
					),
					...data.collections.map((collection) =>
						urlEntry(
							`${data.siteUrl}/collections/${collection.slug}`,
							new Date(collection.updatedAt || collection.createdAt),
							'weekly',
							0.7,
						),
					),
				]

				return new Response(
					`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`,
					{
						headers: {
							'content-type': 'application/xml; charset=utf-8',
							'cache-control': 'public, max-age=3600, s-maxage=3600',
						},
					},
				)
			},
		},
	},
})
