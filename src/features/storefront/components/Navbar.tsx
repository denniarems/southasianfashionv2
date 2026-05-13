'use client'

import { useReducer, useEffect } from 'react'
import Link from '@/components/router-link'
import Image from '@/components/ui/image'
import { usePathname } from '@/components/router-hooks'
import { AnimatePresence, m } from 'framer-motion'
import ClipboardListIcon from 'lucide-react/dist/esm/icons/clipboard-list'
import MenuIcon from 'lucide-react/dist/esm/icons/menu'
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

const EMPTY_CATEGORIES: string[] = []

type NavbarUiState = {
	scrolled: boolean
	menuOpen: boolean
	cartOpen: boolean
	showMega: boolean
	showShop: boolean
	mobileShopOpen: boolean
}

function navbarUiReducer(
	state: NavbarUiState,
	action:
		| { type: 'set'; key: keyof NavbarUiState; value: boolean }
		| { type: 'toggle'; key: keyof NavbarUiState },
): NavbarUiState {
	switch (action.type) {
		case 'set':
			return { ...state, [action.key]: action.value }
		case 'toggle':
			return { ...state, [action.key]: !state[action.key] }
		default:
			return state
	}
}

export default function Navbar({
	settings,
	collections,
	categories = EMPTY_CATEGORIES,
	transparent = false,
}: NavbarProps) {
	const [ui, dispatchUi] = useReducer(navbarUiReducer, {
		scrolled: false,
		menuOpen: false,
		cartOpen: false,
		showMega: false,
		showShop: false,
		mobileShopOpen: false,
	})
	const setUi = (key: keyof NavbarUiState, value: boolean) =>
		dispatchUi({ type: 'set', key, value })
	const toggleUi = (key: keyof NavbarUiState) => dispatchUi({ type: 'toggle', key })
	const { scrolled, menuOpen, cartOpen, showMega, showShop, mobileShopOpen } = ui
	const { itemCount } = useCart()

	const pathname = usePathname()
	// If we are not on the homepage, force the navbar to be dark/solid, overriding `transparent`
	const isHomePage = pathname === '/'
	const effectiveTransparent = isHomePage ? transparent : false

	useEffect(() => {
		const onScroll = () => setUi('scrolled', window.scrollY > 50)
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
				<div className="max-w-450 mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
					<div className="flex h-16 items-center justify-between gap-3 sm:h-20">
						<Link
							href="/"
							className="inline-flex min-w-0 items-center gap-2 sm:gap-3"
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
								className="h-7 w-auto shrink-0 sm:h-8 md:h-9"
							/>
							<span
								className={`truncate font-heading text-sm font-bold tracking-wide transition-colors duration-500 sm:text-base sm:tracking-wider ${isDark ? 'text-stone-900' : 'text-white'}`}
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
									onMouseEnter={() => setUi('showShop', true)}
									onMouseLeave={() => setUi('showShop', false)}
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
											<m.div
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 8 }}
												transition={{ duration: 0.2 }}
												className="absolute top-full left-1/2 -translate-x-1/2 pt-6"
											>
												<div className="bg-white border border-stone-200 py-3 min-w-44 shadow-lg">
													<Link
														href="/products"
														onClick={() => setUi('showShop', false)}
														className="block px-5 py-2 text-xs uppercase tracking-widest text-stone-900 font-medium hover:bg-stone-50 hover:text-yellow-700 transition-colors"
													>
														All Products
													</Link>
													<div className="border-t border-stone-100 my-1" />
													{categories.map((cat) => (
														<Link
															key={cat}
															href={`/products?category=${encodeURIComponent(cat)}`}
															onClick={() => setUi('showShop', false)}
															className="block px-5 py-2 text-xs tracking-wider text-stone-500 hover:bg-stone-50 hover:text-yellow-700 transition-colors"
														>
															{cat}
														</Link>
													))}
												</div>
											</m.div>
										)}
									</AnimatePresence>
								</div>
							)}

							<div
								className="relative"
								onMouseEnter={() => setUi('showMega', true)}
								onMouseLeave={() => setUi('showMega', false)}
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
										<m.div
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
															onClick={() => setUi('showMega', false)}
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
																	className="size-14 object-cover shrink-0"
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
														onClick={() => setUi('showMega', false)}
														className="block text-center text-xs uppercase tracking-widest text-yellow-700 hover:text-stone-900 transition-colors"
														data-testid="mega-menu-view-all"
													>
														View All Collections
													</Link>
												</div>
											</div>
										</m.div>
									)}
								</AnimatePresence>
							</div>
						</div>

						<div className="hidden md:flex items-center gap-3">
							<button
								type="button"
								onClick={() => setUi('cartOpen', true)}
								aria-label="Open atelier brief"
								className={`relative inline-flex h-10 w-10 items-center justify-center border transition-colors duration-300 ${cartButtonClass}`}
							>
								<ClipboardListIcon size={18} />
								{itemCount > 0 && (
									<span className="absolute -top-2 -right-2 min-size-5 px-1 rounded-full bg-yellow-700 text-white text-[10px] font-semibold flex items-center justify-center">
										{itemCount}
									</span>
								)}
							</button>
						</div>

						<div className="flex shrink-0 items-center gap-2 md:hidden">
							<button
								type="button"
								onClick={() => setUi('cartOpen', true)}
								aria-label="Open atelier brief"
								className={`relative inline-flex h-9 w-9 items-center justify-center border transition-colors duration-300 ${cartButtonClass}`}
							>
								<ClipboardListIcon size={16} />
								{itemCount > 0 && (
									<span className="absolute -top-2 -right-2 min-size-5 px-1 rounded-full bg-yellow-700 text-white text-[10px] font-semibold flex items-center justify-center">
										{itemCount}
									</span>
								)}
							</button>

							<button
								data-testid="mobile-menu-toggle"
								className={`transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-stone-500 ${isDark ? 'text-stone-900' : 'text-white'}`}
								onClick={() => toggleUi('menuOpen')}
								aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
							>
								{menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
							</button>
						</div>
					</div>
				</div>

				<AnimatePresence>
					{menuOpen && (
						<m.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="md:hidden bg-white/95 backdrop-blur-xl border-b border-stone-200 overflow-hidden"
						>
							<div className="px-6 py-8 space-y-6">
								<a
									href="/#new-arrivals"
									onClick={() => setUi('menuOpen', false)}
									className="block text-sm uppercase tracking-widest text-stone-700"
								>
									New Arrivals
								</a>

								{categories.length > 0 && (
									<>
										<button
											type="button"
											onClick={() => toggleUi('mobileShopOpen')}
											className="flex items-center justify-between w-full text-sm uppercase tracking-widest text-stone-700"
										>
											Shop
											<m.span
												animate={{ rotate: mobileShopOpen ? 180 : 0 }}
												transition={{ duration: 0.2 }}
												className="text-stone-400"
											>
												▾
											</m.span>
										</button>
										<AnimatePresence>
											{mobileShopOpen && (
												<m.div
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: 'auto', opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													transition={{ duration: 0.2 }}
													className="overflow-hidden space-y-4"
												>
													<Link
														href="/products"
														onClick={() => setUi('menuOpen', false)}
														className="block text-sm text-stone-500 pl-4"
													>
														All Products
													</Link>
													{categories.map((cat) => (
														<Link
															key={cat}
															href={`/products?category=${encodeURIComponent(cat)}`}
															onClick={() => setUi('menuOpen', false)}
															className="block text-sm text-stone-400 pl-4"
														>
															{cat}
														</Link>
													))}
												</m.div>
											)}
										</AnimatePresence>
									</>
								)}

								<Link
									href="/collections"
									onClick={() => setUi('menuOpen', false)}
									className="block text-sm uppercase tracking-widest text-stone-700"
								>
									Collections
								</Link>
								{collections.map((c) => (
									<Link
										key={c.id}
										href={`/collections/${c.slug}`}
										onClick={() => setUi('menuOpen', false)}
										className="block text-sm text-stone-400 pl-4"
									>
										{c.name}
									</Link>
								))}
								<a
									href="/#featured"
									onClick={() => setUi('menuOpen', false)}
									className="block text-sm uppercase tracking-widest text-stone-700"
								>
									Featured
								</a>
							</div>
						</m.div>
					)}
				</AnimatePresence>
			</nav>

			<CartDrawer
				open={cartOpen}
				onOpenChange={(open) => setUi('cartOpen', open)}
				whatsappNumber={settings?.whatsappNumber}
			/>
		</>
	)
}
