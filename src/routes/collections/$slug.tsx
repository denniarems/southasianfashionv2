import { createFileRoute } from '@tanstack/react-router'
import Link from '@/components/router-link'
import Navbar from '@/features/storefront/components/Navbar'
import Footer from '@/features/storefront/components/Footer'
import Breadcrumb from '@/features/storefront/components/Breadcrumb'
import ProductCard from '@/features/storefront/components/ProductCard'
import { getCollectionDetailDataFn } from '@/server/storefront.functions'
import {
	absoluteUrl,
	breadcrumbJsonLd,
	collectionCanonical,
	collectionDescription,
	collectionTitle,
	itemListJsonLd,
	jsonLdScriptContent,
} from '@/lib/seo'

export const Route = createFileRoute('/collections/$slug')({
	loader: ({ params }) => getCollectionDetailDataFn({ data: { slug: params.slug } }),
	head: ({ loaderData }) => {
		const collection = loaderData?.collection

		if (!collection) {
			return {
				meta: [
					{ title: 'Collection Not Found | South Asian Fashion' },
					{ name: 'robots', content: 'noindex,nofollow' },
				],
			}
		}

		const description = collectionDescription(collection)
		const title = collectionTitle(collection)
		const canonical = collectionCanonical(collection)

		return {
			meta: [
				{ title },
				{ name: 'description', content: description },
				{ property: 'og:title', content: title },
				{ property: 'og:description', content: description },
				{ property: 'og:url', content: canonical },
				{ property: 'og:image', content: absoluteUrl(collection.imageUrl) },
				{ name: 'twitter:card', content: 'summary_large_image' },
			],
			links: [{ rel: 'canonical', href: canonical }],
		}
	},
	component: CollectionDetailPage,
})

function CollectionNotFound() {
	return (
		<main className="min-h-screen bg-stone-50 pt-32 px-6 text-center">
			<h1 className="font-heading text-4xl text-stone-900 mb-4">Collection not found</h1>
			<Link
				href="/collections"
				className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors"
			>
				Browse Collections
			</Link>
		</main>
	)
}

function CollectionDetailPage() {
	const data = Route.useLoaderData()
	const collection = data.collection

	if (!collection) {
		return <CollectionNotFound />
	}

	return (
		<>
			<script type="application/ld+json">
				{jsonLdScriptContent(
					breadcrumbJsonLd([
						{ label: 'Home', href: '/' },
						{ label: 'Collections', href: '/collections' },
						{ label: collection.name },
					]),
				)}
			</script>
			<script type="application/ld+json">
				{jsonLdScriptContent(
					itemListJsonLd(data.collectionProducts, `/collections/${collection.slug}`),
				)}
			</script>
			<Navbar
				settings={data.siteSettings}
				collections={data.allCollections}
				categories={data.productCategories}
				transparent={false}
			/>

			<main className="pt-32 pb-24 min-h-screen bg-stone-50">
				<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
					<Breadcrumb
						items={[{ label: 'Collections', href: '/collections' }, { label: collection.name }]}
					/>

					<div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
						<h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-stone-900 tracking-tight mb-6">
							{collection.name}
						</h1>
						<p className="font-accent italic text-stone-500 text-lg md:text-xl leading-relaxed">
							{collection.description}
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{data.collectionProducts.map((product) => (
							<ProductCard
								key={product.id}
								product={product}
								whatsappNumber={data.siteSettings?.whatsappNumber}
							/>
						))}
					</div>

					{data.collectionProducts.length === 0 && (
						<div className="text-center py-24">
							<p className="font-heading text-2xl text-stone-900 mb-3">New pieces coming soon</p>
							<p className="text-stone-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
								We&apos;re curating beautiful pieces for this collection. Check back soon or explore
								our other collections.
							</p>
							<div className="flex flex-col sm:flex-row gap-3 justify-center">
								<Link
									href="/collections"
									className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
								>
									Browse Collections
								</Link>
								<Link
									href="/products"
									className="inline-block border border-stone-300 text-stone-700 px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-stone-100 transition-colors duration-300"
								>
									Shop All Products
								</Link>
							</div>
						</div>
					)}
				</div>
			</main>

			<Footer settings={data.siteSettings} year={data.currentYear} />
		</>
	)
}
