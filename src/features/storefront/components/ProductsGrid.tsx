'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from '@/components/router-link'
import { useServerFn } from '@tanstack/react-start'
import { motion } from 'framer-motion'
import PackageIcon from 'lucide-react/dist/esm/icons/package'
import SearchIcon from 'lucide-react/dist/esm/icons/search'
import XIcon from 'lucide-react/dist/esm/icons/x'
import LoaderIcon from 'lucide-react/dist/esm/icons/loader'
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { LoadingImage } from '@/components/ui/loading-image'
import { fetchProductsFn, type ProductRow } from '@/server/products.functions'
import PremiumPriceDisplay from '@/features/storefront/components/PremiumPriceDisplay'

const PAGE_SIZE = 12

const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'price-asc', label: 'Price: Low to High' },
	{ value: 'price-desc', label: 'Price: High to Low' },
	{ value: 'name-asc', label: 'Name: A \u2192 Z' },
] as const

interface ProductsGridProps {
	initialProducts: ProductRow[]
	initialTotal: number
	initialHasMore: boolean
	categories: string[]
	initialCategory?: string
}

function ProductCardSkeleton() {
	return (
		<div className="animate-pulse">
			<div className="aspect-3/4 bg-stone-200 mb-4" />
			<div className="h-3 w-16 bg-stone-200 mb-2" />
			<div className="h-5 w-3/4 bg-stone-200 mb-2" />
			<div className="h-4 w-20 bg-stone-200 mb-4" />
			<div className="h-11 bg-stone-200" />
		</div>
	)
}

export default function ProductsGrid({
	initialProducts,
	initialTotal,
	initialHasMore,
	categories,
	initialCategory = '',
}: ProductsGridProps) {
	const [items, setItems] = useState<ProductRow[]>(initialProducts)
	const [total, setTotal] = useState(initialTotal)
	const [hasMore, setHasMore] = useState(initialHasMore)

	const [searchInput, setSearchInput] = useState('')
	const [search, setSearch] = useState('')
	const [category, setCategory] = useState(initialCategory)
	const [sort, setSort] = useState('newest')

	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)

	const sentinelRef = useRef<HTMLDivElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
	const abortRef = useRef(0)
	const fetchProducts = useServerFn(fetchProductsFn)

	useEffect(() => {
		debounceRef.current = setTimeout(() => {
			setSearch(searchInput)
		}, 300)
		return () => clearTimeout(debounceRef.current)
	}, [searchInput])

	const fetchFiltered = useCallback(async () => {
		const requestId = ++abortRef.current
		setIsLoading(true)
		setIsLoadingMore(false)
		window.scrollTo({ top: 0, behavior: 'smooth' })

		const result = await fetchProducts({
			data: {
				search,
				category,
				sort,
				offset: 0,
			},
		})

		if (abortRef.current !== requestId) return

		setItems(result.products)
		setTotal(result.total)
		setHasMore(result.hasMore)
		setIsLoading(false)
	}, [fetchProducts, search, category, sort])

	const isInitialRender = useRef(true)
	useEffect(() => {
		if (isInitialRender.current) {
			isInitialRender.current = false
			return
		}
		fetchFiltered()
	}, [fetchFiltered])

	const loadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return
		const requestId = abortRef.current
		setIsLoadingMore(true)

		const result = await fetchProducts({
			data: {
				search,
				category,
				sort,
				offset: items.length,
			},
		})

		if (abortRef.current !== requestId) return

		setItems((prev) => [...prev, ...result.products])
		setTotal(result.total)
		setHasMore(result.hasMore)
		setIsLoadingMore(false)
	}, [fetchProducts, isLoadingMore, hasMore, search, category, sort, items.length])

	useEffect(() => {
		const sentinel = sentinelRef.current
		if (!sentinel || !hasMore || isLoading) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMore()
				}
			},
			{ rootMargin: '400px' },
		)

		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [hasMore, isLoading, loadMore])

	const clearSearch = () => {
		setSearchInput('')
		setSearch('')
	}

	const hasActiveFilters = search || category

	return (
		<main className="pt-32 pb-24 min-h-screen bg-stone-50">
			<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
				<div className="mb-10">
					<h1 className="font-heading text-4xl lg:text-5xl text-stone-900 tracking-tight mb-4">
						All Products
					</h1>
					<p className="font-accent italic text-stone-500 text-lg">
						Discover your next statement piece
					</p>
				</div>

				{/* Search & Sort */}
				<div className="flex flex-col sm:flex-row gap-3 mb-6">
					<div className="relative flex-1">
						<SearchIcon
							size={16}
							className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
						/>
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Search products..."
							className="w-full h-11 pl-11 pr-10 bg-white border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
						/>
						{searchInput && (
							<button
								type="button"
								onClick={clearSearch}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
								aria-label="Clear search"
							>
								<XIcon size={16} />
							</button>
						)}
					</div>

					<div className="relative">
						<select
							value={sort}
							onChange={(e) => setSort(e.target.value)}
							className="h-11 pl-4 pr-10 bg-white border border-stone-200 text-xs uppercase tracking-widest text-stone-600 focus:outline-none focus:border-stone-400 transition-colors appearance-none cursor-pointer"
						>
							{SORT_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
						<ChevronDownIcon
							size={14}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
						/>
					</div>
				</div>

				{/* Category Filters */}
				{categories.length > 0 && (
					<div className="flex gap-2 mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
						<button
							type="button"
							onClick={() => setCategory('')}
							className={`shrink-0 px-5 py-2 text-xs uppercase tracking-widest font-medium border transition-colors duration-300 ${
								category === ''
									? 'bg-stone-900 text-white border-stone-900'
									: 'bg-white text-stone-600 border-stone-200 hover:border-stone-900'
							}`}
						>
							All
						</button>
						{categories.map((c) => (
							<button
								key={c}
								type="button"
								onClick={() => setCategory(category === c ? '' : c)}
								className={`shrink-0 px-5 py-2 text-xs uppercase tracking-widest font-medium border transition-colors duration-300 ${
									category === c
										? 'bg-stone-900 text-white border-stone-900'
										: 'bg-white text-stone-600 border-stone-200 hover:border-stone-900'
								}`}
							>
								{c}
							</button>
						))}
					</div>
				)}

				{/* Results Count */}
				<div className="flex items-center justify-between mb-8">
					<p className="font-accent italic text-stone-500 text-sm">
						{isLoading ? 'Searching...' : `Showing ${items.length} of ${total} pieces`}
					</p>
					{hasActiveFilters && !isLoading && (
						<button
							type="button"
							onClick={() => {
								setSearchInput('')
								setSearch('')
								setCategory('')
							}}
							className="text-xs uppercase tracking-widest text-yellow-700 hover:text-stone-900 transition-colors"
						>
							Clear filters
						</button>
					)}
				</div>

				{/* Loading Skeletons */}
				{isLoading && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{Array.from({ length: 8 }).map((_, i) => (
							<ProductCardSkeleton key={i} />
						))}
					</div>
				)}

				{/* Product Grid */}
				{!isLoading && items.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{items.map((p, index) => (
							<motion.div
								key={p.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.4,
									delay: (index % PAGE_SIZE) * 0.05,
								}}
								className="group h-full flex flex-col"
							>
								<Link
									href={`/products/${p.slug ?? p.id}`}
									className="relative overflow-hidden aspect-3/4 mb-4 block"
								>
									{p.imageUrl ? (
										<LoadingImage
											src={p.imageUrl}
											alt={p.name}
											fill
											sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
											className="object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									) : (
										<div className="w-full h-full bg-stone-200" />
									)}
									<div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500 pointer-events-none" />
									{p.pricing?.hasDiscount && p.pricing.badgeText ? (
										<div className="absolute top-3 left-3 z-10">
											<span className="inline-flex rounded-full border border-[#7A1E2C]/30 bg-[#FDF3D4]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B1320] shadow-sm backdrop-blur-[1px] discount-badge-pulse">
												{p.pricing.badgeText}
											</span>
										</div>
									) : null}
								</Link>
								<div className="flex flex-1 flex-col">
									<p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
										{p.category}
									</p>
									<Link href={`/products/${p.slug ?? p.id}`} className="block">
										<h3 className="font-heading text-lg text-stone-900 mb-1 hover:text-yellow-700 transition-colors min-h-14 leading-tight line-clamp-2">
											{p.name}
										</h3>
									</Link>
									<div>
										<PremiumPriceDisplay
											compact
											currency="CAD"
											originalPrice={p.pricing?.originalPrice ?? p.price}
											discountedPrice={p.pricing?.discountedPrice ?? p.price}
											savingsAmount={p.pricing?.savingsAmount ?? 0}
											savingsPercent={p.pricing?.savingsPercent ?? 0}
											discountText={p.pricing?.discountText}
											badgeText={undefined}
											endDate={p.pricing?.endDate}
										/>
									</div>
									<div className="mt-auto pt-4">
										<AddToCartButton
											product={{
												id: p.id,
												name: p.name,
												slug: p.slug,
												price: p.pricing?.discountedPrice ?? p.price,
												currency: 'CAD',
												imageUrl: p.imageUrl,
											}}
											className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white px-6 py-3 text-[11px] uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
										/>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				)}

				{/* Empty State */}
				{!isLoading && items.length === 0 && (
					<div className="text-center py-24">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 mb-6">
							<PackageIcon size={28} className="text-stone-400" />
						</div>
						{hasActiveFilters ? (
							<>
								<p className="font-heading text-2xl text-stone-900 mb-3">No products found</p>
								<p className="text-stone-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
									Try adjusting your search or filters to discover more pieces.
								</p>
								<button
									type="button"
									onClick={() => {
										setSearchInput('')
										setSearch('')
										setCategory('')
										setSort('newest')
									}}
									className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
								>
									View All Products
								</button>
							</>
						) : (
							<>
								<p className="font-heading text-2xl text-stone-900 mb-3">Check back soon</p>
								<p className="text-stone-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
									We&apos;re curating beautiful new pieces for our collection. In the meantime,
									explore our curated collections.
								</p>
								<Link
									href="/collections"
									className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
								>
									Browse Collections
								</Link>
							</>
						)}
					</div>
				)}

				{/* Infinite Scroll Sentinel */}
				{!isLoading && hasMore && <div ref={sentinelRef} className="h-1" />}

				{/* Loading More Indicator */}
				{isLoadingMore && (
					<div className="flex justify-center py-12">
						<LoaderIcon size={24} className="animate-spin text-stone-400" />
					</div>
				)}

				{/* End of Results */}
				{!isLoading && !hasMore && items.length > 0 && items.length >= PAGE_SIZE && (
					<p className="text-center py-12 text-sm text-stone-400 font-accent italic">
						You\u2019ve viewed all {total} pieces
					</p>
				)}
			</div>
		</main>
	)
}
