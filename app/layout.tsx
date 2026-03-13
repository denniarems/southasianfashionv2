import type { Metadata } from 'next'
import Script from "next/script";
import { Playfair_Display, Manrope, Cormorant_Garamond } from 'next/font/google'
import { ClientWrapper } from './ClientWrapper'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const playfair = Playfair_Display({
	subsets: ['latin'],
	weight: ['400', '600', '700'],
	variable: '--font-heading',
})

const manrope = Manrope({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600'],
	variable: '--font-body',
})

const cormorant = Cormorant_Garamond({
	subsets: ['latin'],
	weight: ['300', '400', '600'],
	style: ['normal', 'italic'],
	variable: '--font-accent',
})

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	icons: {
		icon: [{ url: '/icon.ico', type: 'image/x-icon' }],
		shortcut: ['/icon.ico'],
		apple: [{ url: '/logo.png', type: 'image/png' }],
	},
	title: {
		default: 'South Asian Fashion',
		template: '%s | South Asian Fashion',
	},
	description: 'Curated luxury South Asian fashion, culturally rooted and globally inspired.',
	alternates: {
		canonical: '/',
	},
	openGraph: {
		type: 'website',
		url: '/',
		siteName: 'South Asian Fashion',
		title: 'South Asian Fashion',
		description: 'Curated luxury South Asian fashion, culturally rooted and globally inspired.',
		images: [
			{
				url: '/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'South Asian Fashion',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'South Asian Fashion',
		description: 'Curated luxury South Asian fashion, culturally rooted and globally inspired.',
		images: ['/opengraph-image'],
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			className={`${playfair.variable} ${manrope.variable} ${cormorant.variable}`}
			suppressHydrationWarning
		>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/mcp/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
			<body className="antialiased min-h-screen font-body overflow-x-hidden" suppressHydrationWarning>
				<ClientWrapper>{children}</ClientWrapper>
			</body>
		</html>
	)
}
