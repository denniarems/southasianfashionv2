import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { ClientWrapper } from '@/components/ClientWrapper'
import { absoluteUrl, fashionStoreJsonLd, getSiteUrl } from '@/lib/seo'
import '@/styles/globals.css'

export const Route = createRootRoute({
	head: () => {
		const siteUrl = getSiteUrl()
		const description = 'Curated luxury South Asian fashion, culturally rooted and globally inspired.'

		return {
			meta: [
				{ charSet: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ title: 'South Asian Fashion' },
				{
					name: 'description',
					content: description,
				},
				{ property: 'og:type', content: 'website' },
				{ property: 'og:site_name', content: 'South Asian Fashion' },
				{ property: 'og:title', content: 'South Asian Fashion' },
				{
					property: 'og:description',
					content: description,
				},
				{ property: 'og:url', content: siteUrl },
				{ property: 'og:image', content: absoluteUrl('/logo.png', siteUrl) },
				{ name: 'twitter:card', content: 'summary_large_image' },
				{ name: 'twitter:title', content: 'South Asian Fashion' },
				{ name: 'twitter:description', content: description },
				{ name: 'twitter:image', content: absoluteUrl('/logo.png', siteUrl) },
			],
			links: [
				{ rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
				{ rel: 'apple-touch-icon', href: '/logo.png', type: 'image/png' },
				{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
				{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
				{
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Manrope:wght@300;400;500;600&family=Playfair+Display:wght@400;600;700&display=swap',
				},
			],
		}
	},
	component: RootComponent,
})

function RootComponent() {
	return (
		<RootDocument>
			<ClientWrapper>
				<Outlet />
			</ClientWrapper>
		</RootDocument>
	)
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	const webAnalyticsToken = process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim()
	const shouldLoadWebAnalytics = Boolean(webAnalyticsToken && !import.meta.env.DEV)

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(fashionStoreJsonLd()) }}
				/>
				{import.meta.env.DEV ? (
					<>
						<script src="//unpkg.com/react-grab/dist/index.global.js" crossOrigin="anonymous" />
						<script src="//unpkg.com/@react-grab/mcp/dist/client.global.js" />
					</>
				) : null}
			</head>
			<body
				className="antialiased min-h-screen font-body overflow-x-hidden"
				suppressHydrationWarning
			>
				{children}
				{shouldLoadWebAnalytics ? (
					<script
						defer
						src="https://static.cloudflareinsights.com/beacon.min.js"
						data-cf-beacon={JSON.stringify({ token: webAnalyticsToken })}
					/>
				) : null}
				<Scripts />
			</body>
		</html>
	)
}
