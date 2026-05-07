import { createFileRoute } from '@tanstack/react-router'
import Link from '@/components/router-link'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { LoadingImage } from '@/components/ui/loading-image'
import Navbar from '@/features/storefront/components/Navbar'
import Footer from '@/features/storefront/components/Footer'
import Breadcrumb from '@/features/storefront/components/Breadcrumb'
import PremiumPriceDisplay from '@/features/storefront/components/PremiumPriceDisplay'
import { getCollectionDetailDataFn } from '@/server/storefront.functions'

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

		const description =
			collection.description?.trim() ||
			`Explore the ${collection.name} collection from South Asian Fashion.`

		return {
			meta: [
				{ title: `${collection.name} | South Asian Fashion` },
				{ name: 'description', content: description },
				{ property: 'og:title', content: collection.name },
				{ property: 'og:description', content: description },
				...(collection.imageUrl ? [{ property: 'og:image', content: collection.imageUrl }] : []),
				{ name: 'twitter:card', content: 'summary_large_image' },
			],
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
							<div key={product.id} className="group h-full flex flex-col">
								<Link
									href={`/products/${product.slug ?? product.id}`}
									className="relative overflow-hidden aspect-3/4 mb-4 block"
								>
									{product.imageUrl ? (
										<LoadingImage
											src={product.imageUrl}
											alt={product.name}
											fill
											sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
											className="object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									) : (
										<div className="w-full h-full bg-stone-200" />
									)}
									<div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500 pointer-events-none" />
									{product.pricing?.hasDiscount && product.pricing.badgeText ? (
										<div className="absolute top-3 left-3 z-20">
											<span className="inline-flex rounded-full border border-[#7A1E2C]/30 bg-[#FDF3D4]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B1320] shadow-sm backdrop-blur-[1px] discount-badge-pulse">
												{product.pricing.badgeText}
											</span>
										</div>
									) : null}
								</Link>
								<div className="flex flex-1 flex-col">
									<p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
										{product.category}
									</p>
									<Link href={`/products/${product.slug ?? product.id}`} className="block">
										<h3 className="font-heading text-lg text-stone-900 mb-1 hover:text-yellow-700 transition-colors min-h-14 leading-tight line-clamp-2">
											{product.name}
										</h3>
									</Link>
									<PremiumPriceDisplay
										compact
										currency="CAD"
										originalPrice={product.pricing?.originalPrice ?? product.price}
										discountedPrice={product.pricing?.discountedPrice ?? product.price}
										savingsAmount={product.pricing?.savingsAmount ?? 0}
										savingsPercent={product.pricing?.savingsPercent ?? 0}
										discountText={product.pricing?.discountText}
										badgeText={undefined}
										endDate={product.pricing?.endDate}
									/>
									<div className="mt-auto pt-4">
										<AddToCartButton
											product={{
												id: product.id,
												name: product.name,
												slug: product.slug,
												price: product.pricing?.discountedPrice ?? product.price,
												currency: 'CAD',
												imageUrl: product.imageUrl,
											}}
											className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white px-6 py-3 text-[11px] uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
										/>
									</div>
								</div>
							</div>
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
