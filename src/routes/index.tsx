import { createFileRoute } from '@tanstack/react-router'
import Navbar from '@/features/storefront/components/Navbar'
import HeroSection from '@/features/storefront/components/HeroSection'
import Collections from '@/features/storefront/components/Collections'
import Featured from '@/features/storefront/components/Featured'
import NewArrivals from '@/features/storefront/components/NewArrivals'
import Footer from '@/features/storefront/components/Footer'
import WhatsAppButton from '@/features/storefront/components/WhatsAppButton'
import { getHomePageDataFn } from '@/server/storefront.functions'

export const Route = createFileRoute('/')({
	loader: () => getHomePageDataFn(),
	head: () => ({
		meta: [
			{ title: 'Home | South Asian Fashion' },
			{
				name: 'description',
				content:
					'Discover curated luxury South Asian fashion collections, featured pieces, and new arrivals.',
			},
		],
	}),
	component: HomePage,
})

function HomePage() {
	const {
		heroData,
		allCollections,
		featuredProducts,
		newArrivalProducts,
		siteSettings,
		productCategories,
		currentYear,
	} = Route.useLoaderData()

	return (
		<>
			<Navbar
				settings={siteSettings}
				collections={allCollections}
				categories={productCategories}
				transparent={true}
			/>

			<main>
				<HeroSection hero={heroData} />
				<Collections collections={allCollections} />
				<Featured products={featuredProducts} settings={siteSettings} />
				<NewArrivals products={newArrivalProducts} settings={siteSettings} />
			</main>

			<Footer settings={siteSettings} year={currentYear} />
			<WhatsAppButton settings={siteSettings} />
		</>
	)
}
