import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { ClientWrapper } from '@/components/ClientWrapper'
import '@/styles/globals.css'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'South Asian Fashion' },
			{
				name: 'description',
				content: 'Curated luxury South Asian fashion, culturally rooted and globally inspired.',
			},
			{ property: 'og:type', content: 'website' },
			{ property: 'og:site_name', content: 'South Asian Fashion' },
			{ property: 'og:title', content: 'South Asian Fashion' },
			{
				property: 'og:description',
				content: 'Curated luxury South Asian fashion, culturally rooted and globally inspired.',
			},
			{ property: 'og:image', content: '/logo.png' },
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:image', content: '/logo.png' },
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
	}),
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
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
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
				<Scripts />
			</body>
		</html>
	)
}
