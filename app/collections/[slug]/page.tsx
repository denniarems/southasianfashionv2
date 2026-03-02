import Image from 'next/image'
import { getDb } from '@/db'
import { products, settings, collections } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default async function CollectionDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const db = getDb()
	const { slug } = await params
	const currentYear = new Date().getFullYear()

	const [collectionQuery, allCollections, [siteSettings]] = await Promise.all([
		db.select().from(collections).where(eq(collections.slug, slug)).limit(1),
		db.select().from(collections).orderBy(desc(collections.createdAt)),
		db.select().from(settings).limit(1),
	])

	const c = collectionQuery[0]
	if (!c) return notFound()

	// Fetch products for this collection independently so we can parallelize the first wave
	const collectionProducts = await db
		.select()
		.from(products)
		.where(eq(products.collectionId, c.id))
		.orderBy(desc(products.createdAt))

	return (
		<>
			<Navbar settings={siteSettings} collections={allCollections} transparent={false} />

			<main className="pt-32 pb-24 min-h-screen bg-stone-50">
				<div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
					<div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
						<h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-stone-900 tracking-tight mb-6">
							{c.name}
						</h1>
						<p className="font-accent italic text-stone-500 text-lg md:text-xl leading-relaxed">
							{c.description}
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{collectionProducts.map((p: any) => (
							<div key={p.id} className="group">
								<div className="relative overflow-hidden aspect-[3/4] mb-4">
									{p.imageUrl ? (
										<Image
											src={p.imageUrl}
											alt={p.name}
											fill
											sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
											className="object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									) : (
										<div className="w-full h-full bg-stone-200" />
									)}
									<div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500" />
								</div>
								<p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
									{p.category}
								</p>
								<Link href={`/products/${p.slug ?? p.id}`} className="block">
									<h3 className="font-heading text-lg text-stone-900 mb-1 hover:text-yellow-700 transition-colors">
										{p.name}
									</h3>
								</Link>
								<p className="text-sm text-stone-500">
									{p.currency} {p.price?.toLocaleString()}
								</p>
							</div>
						))}
					</div>

					{collectionProducts.length === 0 && (
						<div className="text-center py-20 text-stone-500 font-accent italic text-lg">
							No pieces currently available in this collection.
						</div>
					)}
				</div>
			</main>

			<Footer settings={siteSettings} year={currentYear} />
		</>
	)
}
