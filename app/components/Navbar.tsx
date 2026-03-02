'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

interface Collection {
	id: string
	name: string
	slug: string
	description: string | null
	imageUrl: string | null
}

interface Settings {
	brandName?: string | null
}

const staticLinks = [
	{ label: 'New Arrivals', href: '/#new-arrivals', isAnchor: true },
	{ label: 'Featured', href: '/#featured', isAnchor: true },
]

export default function Navbar({
	settings,
	collections,
	transparent = false,
}: {
	settings?: Settings
	collections: Collection[]
	transparent?: boolean
}) {
	const [scrolled, setScrolled] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	const [showMega, setShowMega] = useState(false)

	const pathname = usePathname()
	// If we are not on the homepage, force the navbar to be dark/solid, overriding `transparent`
	const isHomePage = pathname === '/'
	const effectiveTransparent = isHomePage ? transparent : false

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 50)
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	const isDark = scrolled || !effectiveTransparent
	const linkClass = isDark
		? 'text-stone-500 hover:text-stone-900'
		: 'text-white/70 hover:text-white'

	return (
		<nav
			data-testid="navbar"
			className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
				isDark ? 'bg-white/90 backdrop-blur-xl border-b border-stone-200/50' : 'bg-transparent'
			}`}
		>
			<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
				<div className="flex items-center justify-between h-20">
					<Link
						href="/"
						className={`font-heading text-lg tracking-wider transition-colors duration-500 ${isDark ? 'text-stone-900' : 'text-white'}`}
						data-testid="nav-logo"
					>
						{settings?.brandName || 'SouthAsianFashion'}
					</Link>

					<div className="hidden md:flex items-center gap-12">
						{staticLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								data-testid={`nav-link-${link.label.toLowerCase().replace(/\s/g, '-')}`}
								className={`text-xs uppercase tracking-widest transition-colors duration-300 ${linkClass}`}
							>
								{link.label}
							</a>
						))}

						{/* Collections mega-menu */}
						<div
							className="relative"
							onMouseEnter={() => setShowMega(true)}
							onMouseLeave={() => setShowMega(false)}
						>
							<Link
								href="/collections"
								data-testid="nav-link-collections"
								className={`text-xs uppercase tracking-widest transition-colors duration-300 ${linkClass}`}
							>
								Collections
							</Link>

							<AnimatePresence>
								{showMega && (
									<motion.div
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 8 }}
										transition={{ duration: 0.2 }}
										className="absolute top-full left-1/2 -translate-x-1/2 pt-6"
										data-testid="collections-mega-menu"
									>
										<div className="bg-white border border-stone-200 p-6 min-w-130 shadow-lg">
											<div className="grid grid-cols-2 gap-3 mb-4">
												{collections.map((c) => (
													<Link
														key={c.id}
														href={`/collections/${c.slug}`}
														onClick={() => setShowMega(false)}
														className="flex gap-3 group p-2 hover:bg-stone-50 transition-colors"
														data-testid={`mega-menu-${c.slug}`}
													>
														{c.imageUrl && (
															<Image
																src={c.imageUrl}
																alt={c.name}
																width={56}
																height={56}
																className="w-14 h-14 object-cover shrink-0"
															/>
														)}
														<div className="min-w-0">
															<p className="font-heading text-sm text-stone-900 group-hover:text-yellow-700 transition-colors">
																{c.name}
															</p>
															<p className="text-[11px] text-stone-400 line-clamp-1">
																{c.description}
															</p>
														</div>
													</Link>
												))}
											</div>
											<div className="border-t border-stone-100 pt-3">
												<Link
													href="/collections"
													onClick={() => setShowMega(false)}
													className="block text-center text-xs uppercase tracking-widest text-yellow-700 hover:text-stone-900 transition-colors"
													data-testid="mega-menu-view-all"
												>
													View All Collections
												</Link>
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					<Link
						href="/collections"
						data-testid="nav-inquire-btn"
						className={`hidden md:inline-block text-xs uppercase tracking-widest px-6 py-2.5 border transition-colors duration-300 ${isDark ? 'text-stone-900 border-stone-900 hover:bg-stone-900 hover:text-white' : 'text-white border-white/60 hover:bg-white hover:text-stone-900'}`}
					>
						Shop Now
					</Link>

					<button
						data-testid="mobile-menu-toggle"
						className={`md:hidden transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-stone-500 ${isDark ? 'text-stone-900' : 'text-white'}`}
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
					>
						{menuOpen ? <X size={20} /> : <Menu size={20} />}
					</button>
				</div>
			</div>

			<AnimatePresence>
				{menuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="md:hidden bg-white/95 backdrop-blur-xl border-b border-stone-200 overflow-hidden"
					>
						<div className="px-6 py-8 space-y-6">
							<a
								href="/#new-arrivals"
								onClick={() => setMenuOpen(false)}
								className="block text-sm uppercase tracking-widest text-stone-700"
							>
								New Arrivals
							</a>
							<Link
								href="/collections"
								onClick={() => setMenuOpen(false)}
								className="block text-sm uppercase tracking-widest text-stone-700"
							>
								Collections
							</Link>
							{collections.map((c) => (
								<Link
									key={c.id}
									href={`/collections/${c.slug}`}
									onClick={() => setMenuOpen(false)}
									className="block text-sm text-stone-400 pl-4"
								>
									{c.name}
								</Link>
							))}
							<a
								href="/#featured"
								onClick={() => setMenuOpen(false)}
								className="block text-sm uppercase tracking-widest text-stone-700"
							>
								Featured
							</a>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
}
