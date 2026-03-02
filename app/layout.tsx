import type { Metadata } from 'next'
import { Playfair_Display, Manrope, Cormorant_Garamond } from 'next/font/google'
import { ClientWrapper } from './ClientWrapper'
import './globals.css'

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
	title: 'South Asian Fashion',
	description: 'Curated Luxury. Culturally Rooted.',
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
			<body className="antialiased min-h-screen font-body overflow-x-hidden">
				<ClientWrapper>{children}</ClientWrapper>
			</body>
		</html>
	)
}
