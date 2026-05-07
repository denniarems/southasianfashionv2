import { createFileRoute } from '@tanstack/react-router'
import PackageIcon from 'lucide-react/dist/esm/icons/package'
import Link from '@/components/router-link'
import { LoadingImage } from '@/components/ui/loading-image'
import Navbar from '@/features/storefront/components/Navbar'
import Footer from '@/features/storefront/components/Footer'
import { getCollectionsPageDataFn } from '@/server/storefront.functions'
import { absoluteUrl, routeCanonical } from '@/lib/seo'

export const Route = createFileRoute('/collections/')({
	loader: () => getCollectionsPageDataFn(),
	head: () => {
		const description =
			'Explore curated South Asian Fashion collections by story, occasion, and style.'
		const canonical = routeCanonical('/collections')

		return {
			meta: [
				{ title: 'Collections | South Asian Fashion' },
				{
					name: 'description',
					content: description,
				},
				{ property: 'og:title', content: 'Collections | South Asian Fashion' },
				{ property: 'og:description', content: description },
				{ property: 'og:url', content: canonical },
				{ property: 'og:image', content: absoluteUrl('/logo.png') },
				{ name: 'twitter:card', content: 'summary_large_image' },
			],
			links: [{ rel: 'canonical', href: canonical }],
		}
	},
	component: CollectionsPage,
})

function CollectionsPage() {
	const { allCollections, siteSettings, productCategories, currentYear } = Route.useLoaderData()

	return (
		<>
			<Navbar
				settings={siteSettings}
				collections={allCollections}
				categories={productCategories}
				transparent={false}
			/>

			<main className="pt-32 pb-24 min-h-screen bg-stone-50">
				<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
					<div className="flex flex-col md:flex-row justify-between items-end mb-12">
						<div>
							<h1 className="font-heading text-4xl lg:text-5xl text-stone-900 tracking-tight mb-4">
								Collections
							</h1>
							<p className="font-accent italic text-stone-500 text-lg">Curated stories in thread</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
						{allCollections.map((collection) => (
							<Link
								href={`/collections/${collection.slug}`}
								key={collection.id}
								className="group block"
							>
								<div className="relative overflow-hidden aspect-4/3 sm:aspect-video mb-6">
									{collection.imageUrl ? (
										<LoadingImage
											src={collection.imageUrl}
											alt={collection.name}
											fill
											sizes="(max-width: 768px) 100vw, 50vw"
											className="object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									) : (
										<div className="w-full h-full bg-stone-200" />
									)}
									<div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500" />
								</div>
								<h3 className="font-heading text-2xl lg:text-3xl text-stone-900 mb-2 group-hover:text-yellow-700 transition-colors">
									{collection.name}
								</h3>
								<p className="text-stone-500 leading-relaxed max-w-xl">{collection.description}</p>
							</Link>
						))}
					</div>

					{allCollections.length === 0 && (
						<div className="text-center py-24">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 mb-6">
								<PackageIcon size={28} className="text-stone-400" />
							</div>
							<p className="font-heading text-2xl text-stone-900 mb-3">Check back soon</p>
							<p className="text-stone-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
								We&apos;re curating beautiful new collections. In the meantime, explore our
								products.
							</p>
							<Link
								href="/products"
								className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
							>
								Shop All Products
							</Link>
						</div>
					)}
				</div>
			</main>

			<Footer settings={siteSettings} year={currentYear} />
		</>
	)
}
