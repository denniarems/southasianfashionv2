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
import { getProductDetailDataFn } from '@/server/storefront.functions'

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

		const description =
			product.description?.trim() || `Explore ${product.name} from South Asian Fashion.`

		return {
			meta: [
				{ title: `${product.name} | South Asian Fashion` },
				{ name: 'description', content: description },
				{ property: 'og:title', content: product.name },
				{ property: 'og:description', content: description },
				...(product.imageUrl ? [{ property: 'og:image', content: product.imageUrl }] : []),
				{ name: 'twitter:card', content: 'summary_large_image' },
			],
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

	const productJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: product.description || '',
		image: data.productImages.length > 0 ? data.productImages : [],
		sku: product.id,
		offers: {
			'@type': 'Offer',
			priceCurrency: 'CAD',
			price: String(product.price),
			availability: 'https://schema.org/InStock',
			url: productAbsoluteUrl,
		},
	}

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
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
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

							<div className="border-t border-b border-stone-200 py-6 md:py-8 mb-8 md:mb-12">
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
									<AddToCartButton
										product={{
											id: product.id,
											name: product.name,
											slug: product.slug,
											price: data.pricingPreview.discountedPrice,
											currency: 'CAD',
											imageUrl: product.imageUrl,
										}}
										className="w-full sm:w-auto sm:min-w-52 flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
									/>

									<a
										href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
											`Hello! I'm interested in the ${product.name}. Could you share more details?`,
										)}`}
										target="_blank"
										rel="noopener noreferrer"
										className="w-full sm:w-auto sm:min-w-70 flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
									>
										<MessageCircleIcon size={16} />
										Inquire via WhatsApp
									</a>

									<ShareButton
										productName={product.name}
										productUrl={productAbsoluteUrl}
										productImage={data.productImages[0] ?? ''}
										productDescription={product.description ?? ''}
									/>
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
						</div>
					</div>
				</div>

				<RelatedProducts products={data.relatedProducts} />
			</main>

			<Footer settings={data.siteSettings} year={data.currentYear} />
		</>
	)
}
