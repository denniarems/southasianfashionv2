import { getDb } from '@/db'
import { products, settings, collections, productImages, sizeGuides } from '@/db/schema'
import { and, asc, desc, eq, ne, or } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Breadcrumb from '../../components/Breadcrumb'
import SizeGuide from '../../components/SizeGuide'
import RelatedProducts from '../../components/RelatedProducts'
import ProductImageGallery from '../../components/ProductImageGallery'
import ShareButton from '../../components/ShareButton'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { fetchProductCategories } from '../../actions/products'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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

function parseSizeRows(input: string | null | undefined): Array<{ size: string; values: string[] }> {
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
					values: rawValues.map((v) => String(v)),
				}
			})
			.filter((row): row is { size: string; values: string[] } => row !== null)
	} catch {
		return []
	}
}

async function getProductBySlug(slug: string) {
	const db = getDb()
	const productQuery = await db
		.select()
		.from(products)
		.where(or(eq(products.slug, slug), eq(products.id, slug)))
		.limit(1)

	return productQuery[0]
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const product = await getProductBySlug(slug)

	if (!product) {
		return {
			title: 'Product Not Found',
			robots: {
				index: false,
				follow: false,
			},
		}
	}

	const productPath = `/products/${product.slug ?? product.id}`
	const title = product.name
	const description =
		product.description?.trim() || `Explore ${product.name} from South Asian Fashion.`

	return {
		title,
		description,
		alternates: {
			canonical: productPath,
		},
		openGraph: {
			type: 'website',
			title,
			description,
			url: productPath,
			images: product.imageUrl
				? [
						{
							url: product.imageUrl,
							alt: product.name,
						},
					]
				: undefined,
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: product.imageUrl ? [product.imageUrl] : undefined,
		},
	}
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
	const db = getDb()
	const { slug } = await params
	const currentYear = new Date().getFullYear()

	const [productQuery, allCollections, [siteSettings], productCategories] = await Promise.all([
		getProductBySlug(slug).then((product) => (product ? [product] : [])),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(settings).limit(1),
		fetchProductCategories(),
	])

	const p = productQuery[0]
	if (!p) return notFound()

	const relatedConditions = []
	if (p.category) relatedConditions.push(eq(products.category, p.category))
	if (p.collectionId) relatedConditions.push(eq(products.collectionId, p.collectionId))

	const [relatedProducts, productImageRows, selectedSizeGuide] = await Promise.all([
		relatedConditions.length > 0
			? db
					.select()
					.from(products)
					.where(and(ne(products.id, p.id), or(...relatedConditions)))
					.orderBy(desc(products.createdAt))
					.limit(4)
			: [],
		db
			.select()
			.from(productImages)
			.where(eq(productImages.productId, p.id))
			.orderBy(asc(productImages.sortOrder)),
		p.sizeGuideId
			? db
					.select()
					.from(sizeGuides)
					.where(eq(sizeGuides.id, p.sizeGuideId))
					.limit(1)
					.then((rows: Array<typeof sizeGuides.$inferSelect>) => rows[0] || null)
			: Promise.resolve(null),
	])

	const allImages = [
		...(p.imageUrl ? [p.imageUrl] : []),
		...productImageRows.map((img: typeof productImages.$inferSelect) => img.imageUrl),
	]

	const whatsapp = siteSettings?.whatsappNumber?.replace(/[^0-9]/g, '') || ''
	const parsedSizeGuide = selectedSizeGuide
		? {
				name: selectedSizeGuide.name,
				unit: selectedSizeGuide.unit || 'in',
				note:
					selectedSizeGuide.note ||
					'For the best fit, we recommend comparing with a garment you already own.',
				columns: parseJsonStringArray(selectedSizeGuide.columnsJson),
				rows: parseSizeRows(selectedSizeGuide.rowsJson),
			}
		: null
	const productPath = `/products/${p.slug ?? p.id}`
	const productAbsoluteUrl = `${siteUrl}${productPath}`

	const productJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: p.name,
		description: p.description || '',
		image: allImages.length > 0 ? allImages : [],
		sku: p.id,
		offers: {
			'@type': 'Offer',
			priceCurrency: p.currency,
			price: String(p.price),
			availability: 'https://schema.org/InStock',
			url: `${siteUrl}${productPath}`,
		},
	}

	const collectionForBreadcrumb = p.collectionId
		? allCollections.find((col: typeof collections.$inferSelect) => col.id === p.collectionId)
		: null

	const breadcrumbItems = collectionForBreadcrumb
		? [
				{ label: 'Collections', href: '/collections' },
				{
					label: collectionForBreadcrumb.name,
					href: `/collections/${collectionForBreadcrumb.slug}`,
				},
				{ label: p.name },
			]
		: [{ label: 'Products', href: '/products' }, { label: p.name }]

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
			/>
			<Navbar
				settings={siteSettings}
				collections={allCollections}
				categories={productCategories}
				transparent={false}
			/>

			<main className="pt-24 md:pt-28 pb-16 md:pb-24 min-h-screen bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<Breadcrumb items={breadcrumbItems} />

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
						<div className="w-full">
							<ProductImageGallery images={allImages} productName={p.name} />
						</div>

						<div className="pt-2 lg:pt-6">
							<span className="text-xs uppercase tracking-widest text-stone-400 mb-4 block">
								{p.category || 'Uncategorized'}
							</span>
							<h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight mb-4">
								{p.name}
							</h1>
							<p className="font-heading text-2xl text-stone-600 mb-6 md:mb-8">
								{p.currency} {p.price?.toLocaleString()}
							</p>

							<div className="prose prose-stone max-w-none text-stone-500 mb-8 md:mb-12">
								<p className="leading-relaxed">{p.description}</p>
							</div>

							<div className="border-t border-b border-stone-200 py-6 md:py-8 mb-8 md:mb-12">
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
									<AddToCartButton
										product={{
											id: p.id,
											name: p.name,
											slug: p.slug,
											price: p.price,
											currency: p.currency,
											imageUrl: p.imageUrl,
										}}
										className="w-full sm:w-auto sm:min-w-52 flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
									/>

									<a
										href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello! I'm interested in the ${p.name}. Could you share more details?`)}`}
										target="_blank"
										rel="noopener noreferrer"
										className="w-full sm:w-auto sm:min-w-70 flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
									>
										<MessageCircleIcon size={16} />
										Inquire via WhatsApp
									</a>

									<ShareButton
										productName={p.name}
										productUrl={productAbsoluteUrl}
										productImage={allImages[0] ?? ''}
										productDescription={p.description ?? ''}
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

				<RelatedProducts products={relatedProducts} />
			</main>

			<Footer settings={siteSettings} year={currentYear} />
		</>
	)
}
