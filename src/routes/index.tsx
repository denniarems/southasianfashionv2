import { createFileRoute } from '@tanstack/react-router'
import Navbar from '@/features/storefront/components/Navbar'
import HeroSection from '@/features/storefront/components/HeroSection'
import Collections from '@/features/storefront/components/Collections'
import Featured from '@/features/storefront/components/Featured'
import NewArrivals from '@/features/storefront/components/NewArrivals'
import ShopByOccasion from '@/features/storefront/components/ShopByOccasion'
import Footer from '@/features/storefront/components/Footer'
import WhatsAppButton from '@/features/storefront/components/WhatsAppButton'
import { getHomePageDataFn } from '@/server/storefront.functions'
import { absoluteUrl, routeCanonical } from '@/lib/seo'

export const Route = createFileRoute('/')({
	loader: () => getHomePageDataFn(),
	head: () => {
		const description =
			'Discover curated luxury South Asian fashion in Ottawa, including bridal, Eid, Diwali, wedding guest, groom, and temple jewelry edits.'
		const canonical = routeCanonical('/')

		return {
			meta: [
				{ title: 'South Asian Fashion | Ottawa Luxury South Asian Clothing' },
				{
					name: 'description',
					content: description,
				},
				{ property: 'og:title', content: 'South Asian Fashion' },
				{ property: 'og:description', content: description },
				{ property: 'og:url', content: canonical },
				{ property: 'og:image', content: absoluteUrl('/logo.png') },
				{ name: 'twitter:card', content: 'summary_large_image' },
			],
			links: [{ rel: 'canonical', href: canonical }],
		}
	},
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
		occasionLinks,
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
				<ShopByOccasion occasions={occasionLinks} />
				<Collections collections={allCollections} />
				<Featured products={featuredProducts} settings={siteSettings} />
				<NewArrivals products={newArrivalProducts} settings={siteSettings} />
			</main>

			<Footer settings={siteSettings} year={currentYear} />
			<WhatsAppButton settings={siteSettings} />
		</>
	)
}
