'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import MenuIcon from 'lucide-react/dist/esm/icons/menu'
import ShoppingCartIcon from 'lucide-react/dist/esm/icons/shopping-cart'
import XIcon from 'lucide-react/dist/esm/icons/x'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { useCart } from '@/components/cart/CartContext'
import { LoadingImage } from '@/components/ui/loading-image'

interface Collection {
	id: string
	name: string
	slug: string
	description: string | null
	imageUrl: string | null
}

interface Settings {
	brandName?: string | null
	whatsappNumber?: string | null
}

interface NavbarProps {
	settings?: Settings
	collections: Collection[]
	categories?: string[]
	transparent?: boolean
}

const staticLinks = [
	{ label: 'New Arrivals', href: '/#new-arrivals', isAnchor: true },
	{ label: 'Featured', href: '/#featured', isAnchor: true },
]

export default function Navbar({
	settings,
	collections,
	categories = [],
	transparent = false,
}: NavbarProps) {
	const [scrolled, setScrolled] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	const [cartOpen, setCartOpen] = useState(false)
	const [showMega, setShowMega] = useState(false)
	const [showShop, setShowShop] = useState(false)
	const [mobileShopOpen, setMobileShopOpen] = useState(false)
	const { itemCount } = useCart()

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

	const cartButtonClass = isDark
		? 'text-stone-900 border-stone-300 hover:bg-stone-100'
		: 'text-white border-white/60 hover:bg-white hover:text-stone-900'
	const brandName = settings?.brandName || 'South Asian Fashion'

	return (
		<>
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
							className="inline-flex items-center gap-3"
							data-testid="nav-logo"
							aria-label={brandName}
						>
							<Image
								src="/logo.png"
								alt={brandName}
								width={168}
								height={40}
								sizes="168px"
								priority
								className="h-8 w-auto md:h-9"
							/>
							<span
								className={`font-heading text-sm md:text-base tracking-wider transition-colors duration-500 ${isDark ? 'text-stone-900' : 'text-white'}`}
							>
								{brandName}
							</span>
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

							{categories.length > 0 && (
								<div
									className="relative"
									onMouseEnter={() => setShowShop(true)}
									onMouseLeave={() => setShowShop(false)}
								>
									<Link
										href="/products"
										data-testid="nav-link-shop"
										className={`text-xs uppercase tracking-widest transition-colors duration-300 ${linkClass}`}
									>
										Shop
									</Link>

									<AnimatePresence>
										{showShop && (
											<motion.div
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 8 }}
												transition={{ duration: 0.2 }}
												className="absolute top-full left-1/2 -translate-x-1/2 pt-6"
											>
												<div className="bg-white border border-stone-200 py-3 min-w-44 shadow-lg">
													<Link
														href="/products"
														onClick={() => setShowShop(false)}
														className="block px-5 py-2 text-xs uppercase tracking-widest text-stone-900 font-medium hover:bg-stone-50 hover:text-yellow-700 transition-colors"
													>
														All Products
													</Link>
													<div className="border-t border-stone-100 my-1" />
													{categories.map((cat) => (
														<Link
															key={cat}
															href={`/products?category=${encodeURIComponent(cat)}`}
															onClick={() => setShowShop(false)}
															className="block px-5 py-2 text-xs tracking-wider text-stone-500 hover:bg-stone-50 hover:text-yellow-700 transition-colors"
														>
															{cat}
														</Link>
													))}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							)}

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
																<LoadingImage
																	src={c.imageUrl}
																	alt={c.name}
																	width={56}
																	height={56}
																	sizes="56px"
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

						<div className="hidden md:flex items-center gap-3">
							<button
								type="button"
								onClick={() => setCartOpen(true)}
								aria-label="Open shopping cart"
								className={`relative inline-flex h-10 w-10 items-center justify-center border transition-colors duration-300 ${cartButtonClass}`}
							>
								<ShoppingCartIcon size={18} />
								{itemCount > 0 && (
									<span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-yellow-700 text-white text-[10px] font-semibold flex items-center justify-center">
										{itemCount}
									</span>
								)}
							</button>
						</div>

						<div className="md:hidden flex items-center gap-2">
							<button
								type="button"
								onClick={() => setCartOpen(true)}
								aria-label="Open shopping cart"
								className={`relative inline-flex h-9 w-9 items-center justify-center border transition-colors duration-300 ${cartButtonClass}`}
							>
								<ShoppingCartIcon size={16} />
								{itemCount > 0 && (
									<span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-yellow-700 text-white text-[10px] font-semibold flex items-center justify-center">
										{itemCount}
									</span>
								)}
							</button>

							<button
								data-testid="mobile-menu-toggle"
								className={`transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-stone-500 ${isDark ? 'text-stone-900' : 'text-white'}`}
								onClick={() => setMenuOpen(!menuOpen)}
								aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
							>
								{menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
							</button>
						</div>
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

								{categories.length > 0 && (
									<>
										<button
											type="button"
											onClick={() => setMobileShopOpen(!mobileShopOpen)}
											className="flex items-center justify-between w-full text-sm uppercase tracking-widest text-stone-700"
										>
											Shop
											<motion.span
												animate={{ rotate: mobileShopOpen ? 180 : 0 }}
												transition={{ duration: 0.2 }}
												className="text-stone-400"
											>
												▾
											</motion.span>
										</button>
										<AnimatePresence>
											{mobileShopOpen && (
												<motion.div
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: 'auto', opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													transition={{ duration: 0.2 }}
													className="overflow-hidden space-y-4"
												>
													<Link
														href="/products"
														onClick={() => setMenuOpen(false)}
														className="block text-sm text-stone-500 pl-4"
													>
														All Products
													</Link>
													{categories.map((cat) => (
														<Link
															key={cat}
															href={`/products?category=${encodeURIComponent(cat)}`}
															onClick={() => setMenuOpen(false)}
															className="block text-sm text-stone-400 pl-4"
														>
															{cat}
														</Link>
													))}
												</motion.div>
											)}
										</AnimatePresence>
									</>
								)}

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

			<CartDrawer
				open={cartOpen}
				onOpenChange={setCartOpen}
				whatsappNumber={settings?.whatsappNumber}
			/>
		</>
	)
}
