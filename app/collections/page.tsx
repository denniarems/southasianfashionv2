import { getDb } from '@/db'
import { settings, collections } from '@/db/schema'
import PackageIcon from 'lucide-react/dist/esm/icons/package'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { LoadingImage } from '@/components/ui/loading-image'
import { fetchProductCategories } from '../actions/products'

export const metadata: Metadata = {
	title: 'Collections',
	description:
		'Explore curated South Asian Fashion collections and discover pieces by story and style.',
	alternates: {
		canonical: '/collections',
	},
}

export default async function CollectionsPage() {
	const db = getDb()
	const currentYear = new Date().getFullYear()

	const [allCollections, [siteSettings], productCategories] = await Promise.all([
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(settings).limit(1),
		fetchProductCategories(),
	])

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
						{allCollections.map((c: typeof collections.$inferSelect) => (
							<Link href={`/collections/${c.slug}`} key={c.id} className="group block">
								<div className="relative overflow-hidden aspect-4/3 sm:aspect-video mb-6">
									{c.imageUrl ? (
										<LoadingImage
											src={c.imageUrl}
											alt={c.name}
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
									{c.name}
								</h3>
								<p className="text-stone-500 leading-relaxed max-w-xl">{c.description}</p>
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
