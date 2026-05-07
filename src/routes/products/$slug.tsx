import { createFileRoute } from '@tanstack/react-router'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import Link from '@/components/router-link'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import Navbar from '@/features/storefront/components/Navbar'
import Footer from '@/features/storefront/components/Footer'
import Breadcrumb from '@/features/storefront/components/Breadcrumb'
import SizeGuide from '@/features/storefront/components/SizeGuide'
import RelatedProducts from '@/features/storefront/components/RelatedProducts'
import ProductImageGallery from '@/features/storefront/components/ProductImageGallery'
import ShareButton from '@/features/storefront/components/ShareButton'
import PremiumPriceDisplay from '@/features/storefront/components/PremiumPriceDisplay'
import CustomizationInquiry from '@/features/storefront/components/CustomizationInquiry'
import ProductViewTracker from '@/features/storefront/components/ProductViewTracker'
import RecentlyViewedProducts from '@/features/storefront/components/RecentlyViewedProducts'
import WishlistButton from '@/features/storefront/components/WishlistButton'
import { getProductDetailDataFn } from '@/server/storefront.functions'
import {
	absoluteUrl,
	breadcrumbJsonLd,
	productCanonical,
	productDescription,
	productJsonLd,
	productTitle,
} from '@/lib/seo'
import { trackAnalyticsEvent } from '@/lib/analytics'
import { occasionLabelForSlug } from '@/lib/merchandising'

function parseJsonStringArray(input: string | null | undefined): string[] {
	if (!input) return []
	try {
		const parsed = JSON.parse(input)
		if (!Array.isArray(parsed)) return []
		return parsed.filter((item): item is string => typeof item === 'string')
	} catch {
		return []
	}
}

function parseSizeRows(
	input: string | null | undefined,
): Array<{ size: string; values: string[] }> {
	if (!input) return []
	try {
		const parsed = JSON.parse(input)
		if (!Array.isArray(parsed)) return []

		return parsed
			.map((row) => {
				if (!row || typeof row !== 'object') return null
				const rawSize = (row as { size?: unknown }).size
				const rawValues = (row as { values?: unknown }).values

				if (typeof rawSize !== 'string') return null
				if (!Array.isArray(rawValues)) return null

				return {
					size: rawSize,
					values: rawValues.map((value) => String(value)),
				}
			})
			.filter((row): row is { size: string; values: string[] } => row !== null)
	} catch {
		return []
	}
}

export const Route = createFileRoute('/products/$slug')({
	loader: ({ params }) => getProductDetailDataFn({ data: { slug: params.slug } }),
	head: ({ loaderData }) => {
		const product = loaderData?.product
		if (!product) {
			return {
				meta: [
					{ title: 'Product Not Found | South Asian Fashion' },
					{ name: 'robots', content: 'noindex,nofollow' },
				],
			}
		}

		const description = productDescription(product)
		const title = productTitle(product)
		const canonical = productCanonical(product)

		return {
			meta: [
				{ title },
				{ name: 'description', content: description },
				{ property: 'og:title', content: title },
				{ property: 'og:description', content: description },
				{ property: 'og:url', content: canonical },
				{ property: 'og:image', content: absoluteUrl(product.imageUrl) },
				{ name: 'twitter:card', content: 'summary_large_image' },
			],
			links: [{ rel: 'canonical', href: canonical }],
		}
	},
	component: ProductDetailPage,
})

function ProductNotFound() {
	return (
		<main className="min-h-screen bg-stone-50 pt-32 px-6 text-center">
			<h1 className="font-heading text-4xl text-stone-900 mb-4">Product not found</h1>
			<Link
				href="/products"
				className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors"
			>
				Shop All Products
			</Link>
		</main>
	)
}

function ProductDetailPage() {
	const data = Route.useLoaderData()
	const product = data.product

	if (!product || !data.pricingPreview) {
		return <ProductNotFound />
	}

	const whatsapp = data.siteSettings?.whatsappNumber?.replace(/[^0-9]/g, '') || ''
	const parsedSizeGuide = data.sizeGuide
		? {
				name: data.sizeGuide.name,
				unit: data.sizeGuide.unit || 'in',
				note:
					data.sizeGuide.note ||
					'For the best fit, we recommend comparing with a garment you already own.',
				columns: parseJsonStringArray(data.sizeGuide.columnsJson),
				rows: parseSizeRows(data.sizeGuide.rowsJson),
			}
		: null
	const productPath = `/products/${product.slug ?? product.id}`
	const siteUrl = data.siteUrl.replace(/\/$/, '')
	const productAbsoluteUrl = `${siteUrl}${productPath}`
	const productOccasion = product.occasion
		? occasionLabelForSlug(product.occasion, data.occasionLinks)
		: ''
	const productDetails = [
		['Occasion', productOccasion],
		['Fabric', product.fabric],
		['Color', product.color],
		[
			'Availability',
			product.isReadyToShip ? 'Ready to ship' : product.availabilityStatus?.replace(/-/g, ' '),
		],
	].filter((item): item is [string, string] => Boolean(item[1]))

	const collectionForBreadcrumb = product.collectionId
		? data.allCollections.find((collection) => collection.id === product.collectionId)
		: null

	const breadcrumbItems = collectionForBreadcrumb
		? [
				{ label: 'Collections', href: '/collections' },
				{
					label: collectionForBreadcrumb.name,
					href: `/collections/${collectionForBreadcrumb.slug}`,
				},
				{ label: product.name },
			]
		: [{ label: 'Products', href: '/products' }, { label: product.name }]

	return (
		<>
			<ProductViewTracker
				product={{
					id: product.id,
					name: product.name,
					slug: product.slug,
					category: product.category,
					price: product.price,
					imageUrl: product.imageUrl,
					availabilityStatus: product.availabilityStatus,
					isReadyToShip: product.isReadyToShip,
					pricing: data.pricingPreview,
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(
						productJsonLd({
							product,
							pricing: data.pricingPreview,
							images: data.productImages,
							url: productAbsoluteUrl,
						}),
					),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(
						breadcrumbJsonLd([
							{ label: 'Home', href: '/' },
							...breadcrumbItems.map((item) => ({
								label: item.label,
								href: item.href,
							})),
						]),
					),
				}}
			/>
			<Navbar
				settings={data.siteSettings}
				collections={data.allCollections}
				categories={data.productCategories}
				transparent={false}
			/>

			<main className="pt-24 md:pt-28 pb-16 md:pb-24 min-h-screen bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<Breadcrumb items={breadcrumbItems} />

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
						<div className="w-full">
							<ProductImageGallery images={data.productImages} productName={product.name} />
						</div>

						<div className="pt-2 lg:pt-6">
							<span className="text-xs uppercase tracking-widest text-stone-400 mb-4 block">
								{product.category || 'Uncategorized'}
							</span>
							<h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight mb-4">
								{product.name}
							</h1>
							<div className="mb-6 md:mb-8">
								<PremiumPriceDisplay
									currency="CAD"
									originalPrice={data.pricingPreview.originalPrice}
									discountedPrice={data.pricingPreview.discountedPrice}
									savingsAmount={data.pricingPreview.savingsAmount}
									savingsPercent={data.pricingPreview.savingsPercent}
									discountText={data.pricingPreview.discountText}
									badgeText={data.pricingPreview.badgeText}
									endDate={data.pricingPreview.endDate}
								/>
							</div>

							<div className="prose prose-stone max-w-none text-stone-500 mb-8 md:mb-12">
								<p className="leading-relaxed">{product.description}</p>
							</div>

							<div className="mb-8 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
								{productDetails.map(([label, value], index) => {
									const spansFullRow =
										productDetails.length % 2 === 1 && index === productDetails.length - 1

									return (
										<div
											key={label}
											className={`border border-stone-200 bg-white px-5 py-4 ${
												spansFullRow ? 'sm:col-span-2' : ''
											}`}
										>
											<p className="text-[10px] uppercase tracking-widest text-stone-400">
												{label}
											</p>
											<p className="mt-1 capitalize text-stone-700">{value}</p>
										</div>
									)
								})}
							</div>

							<div className="border-t border-b border-stone-200 py-6 md:py-8 mb-8 md:mb-12">
								<div className="grid gap-3">
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<AddToCartButton
											product={{
												id: product.id,
												name: product.name,
												slug: product.slug,
												price: data.pricingPreview.discountedPrice,
												currency: 'CAD',
												imageUrl: product.imageUrl,
											}}
											className="flex h-14 w-full items-center justify-center gap-3 bg-stone-900 px-6 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-yellow-700"
										/>

										<a
											href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
												`Hello! I'm interested in the ${product.name}. Could you share more details?`,
											)}`}
											target="_blank"
											rel="noopener noreferrer"
											onClick={() =>
												trackAnalyticsEvent({
													eventName: 'whatsapp_click',
													productId: product.id,
													productSlug: product.slug || undefined,
													category: product.category || undefined,
												})
											}
											className="flex h-14 w-full items-center justify-center gap-3 bg-stone-900 px-6 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-yellow-700"
										>
											<MessageCircleIcon size={16} />
											Inquire via WhatsApp
										</a>
									</div>

									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<ShareButton
											productId={product.id}
											productSlug={product.slug}
											category={product.category}
											productName={product.name}
											productUrl={productAbsoluteUrl}
											productImage={data.productImages[0] ?? ''}
											productDescription={product.description ?? ''}
											className="h-14 min-w-0 px-6"
										/>

										<WishlistButton
											productId={product.id}
											productSlug={product.slug}
											productName={product.name}
											category={product.category}
											showLabel
											className="h-14 w-full gap-3 border-stone-300 bg-white px-6 shadow-none backdrop-blur-none hover:border-stone-900 hover:bg-stone-50"
										/>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<p className="text-sm text-stone-500 flex items-center gap-2">
									<span className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Made to order
								</p>
								<p className="text-sm text-stone-500 flex items-center gap-2">
									<span className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Ships worldwide
								</p>
								<p className="text-sm text-stone-500 flex items-center gap-2">
									<span className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Customization available
								</p>
							</div>

							<SizeGuide whatsappNumber={whatsapp} guide={parsedSizeGuide} />

							<CustomizationInquiry
								productId={product.id}
								productSlug={product.slug}
								productName={product.name}
								productUrl={productAbsoluteUrl}
								whatsappNumber={data.siteSettings?.whatsappNumber}
								category={product.category}
							/>
						</div>
					</div>
				</div>

				<RelatedProducts
					products={data.relatedProducts}
					whatsappNumber={data.siteSettings?.whatsappNumber}
				/>
				<RecentlyViewedProducts
					excludeProductId={product.id}
					whatsappNumber={data.siteSettings?.whatsappNumber}
				/>
			</main>

			<Footer settings={data.siteSettings} year={data.currentYear} />
		</>
	)
}
