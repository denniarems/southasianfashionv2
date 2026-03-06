import { getDb } from '@/db'
import { products, settings, collections } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Breadcrumb from '../../components/Breadcrumb'
import PremiumPriceDisplay from '../../components/PremiumPriceDisplay'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { LoadingImage } from '@/components/ui/loading-image'
import { fetchProductCategories } from '../../actions/products'
import { previewProductPrice, type ProductPricePreview } from '@/lib/discounts'

async function getCollectionBySlug(slug: string) {
	const db = getDb()
	const collectionQuery = await db
		.select()
		.from(collections)
		.where(eq(collections.slug, slug))
		.limit(1)

	return collectionQuery[0]
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const collection = await getCollectionBySlug(slug)

	if (!collection) {
		return {
			title: 'Collection Not Found',
			robots: {
				index: false,
				follow: false,
			},
		}
	}

	const collectionPath = `/collections/${collection.slug}`
	const title = collection.name
	const description =
		collection.description?.trim() ||
		`Explore the ${collection.name} collection from South Asian Fashion.`

	return {
		title,
		description,
		alternates: {
			canonical: collectionPath,
		},
		openGraph: {
			type: 'website',
			title,
			description,
			url: collectionPath,
			images: collection.imageUrl
				? [
						{
							url: collection.imageUrl,
							alt: collection.name,
						},
					]
				: undefined,
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: collection.imageUrl ? [collection.imageUrl] : undefined,
		},
	}
}

export default async function CollectionDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const db = getDb()
	const { slug } = await params
	const currentYear = new Date().getFullYear()

	const [collectionQuery, allCollections, [siteSettings], productCategories] = await Promise.all([
		getCollectionBySlug(slug).then((collection) => (collection ? [collection] : [])),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(settings).limit(1),
		fetchProductCategories(),
	])

	const c = collectionQuery[0]
	if (!c) return notFound()

	const collectionProducts = await db
		.select()
		.from(products)
		.where(eq(products.collectionId, c.id))
		.orderBy(desc(products.createdAt))

	const collectionProductsWithPricing = await Promise.all(
		collectionProducts.map(async (product: typeof products.$inferSelect) => ({
			...product,
			pricing: (await previewProductPrice(product)) as ProductPricePreview,
		})),
	)

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
					<Breadcrumb items={[{ label: 'Collections', href: '/collections' }, { label: c.name }]} />

					<div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
						<h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-stone-900 tracking-tight mb-6">
							{c.name}
						</h1>
						<p className="font-accent italic text-stone-500 text-lg md:text-xl leading-relaxed">
							{c.description}
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{collectionProductsWithPricing.map(
							(p: typeof products.$inferSelect & { pricing?: ProductPricePreview }) => (
								<div key={p.id} className="group h-full flex flex-col">
									<Link
										href={`/products/${p.slug ?? p.id}`}
										className="relative overflow-hidden aspect-3/4 mb-4 block"
									>
										{p.imageUrl ? (
											<LoadingImage
												src={p.imageUrl}
												alt={p.name}
												fill
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
												className="object-cover transition-transform duration-700 group-hover:scale-105"
											/>
										) : (
											<div className="w-full h-full bg-stone-200" />
										)}
										<div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500 pointer-events-none" />
										{p.pricing?.hasDiscount && p.pricing.badgeText ? (
											<div className="absolute top-3 left-3 z-20">
												<span className="inline-flex rounded-full border border-[#7A1E2C]/30 bg-[#FDF3D4]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B1320] shadow-sm backdrop-blur-[1px] discount-badge-pulse">
													{p.pricing.badgeText}
												</span>
											</div>
										) : null}
									</Link>
									<div className="flex flex-1 flex-col">
										<p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
											{p.category}
										</p>
										<Link href={`/products/${p.slug ?? p.id}`} className="block">
											<h3 className="font-heading text-lg text-stone-900 mb-1 hover:text-yellow-700 transition-colors min-h-14 leading-tight line-clamp-2">
												{p.name}
											</h3>
										</Link>
										<PremiumPriceDisplay
											compact
											currency="CAD"
											originalPrice={p.pricing?.originalPrice ?? p.price}
											discountedPrice={p.pricing?.discountedPrice ?? p.price}
											savingsAmount={p.pricing?.savingsAmount ?? 0}
											savingsPercent={p.pricing?.savingsPercent ?? 0}
											discountText={p.pricing?.discountText}
											badgeText={undefined}
											endDate={p.pricing?.endDate}
										/>
										<div className="mt-auto pt-4">
										<AddToCartButton
											product={{
												id: p.id,
												name: p.name,
												slug: p.slug,
												price: p.pricing?.discountedPrice ?? p.price,
												currency: 'CAD',
												imageUrl: p.imageUrl,
											}}
											className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white px-6 py-3 text-[11px] uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
										/>
										</div>
									</div>
								</div>
							),
						)}
					</div>

					{collectionProductsWithPricing.length === 0 && (
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

			<Footer settings={siteSettings} year={currentYear} />
		</>
	)
}
