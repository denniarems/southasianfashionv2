'use client'

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react'
import Link from '@/components/router-link'
import { useServerFn } from '@tanstack/react-start'
import { AnimatePresence, motion } from 'framer-motion'
import SearchIcon from 'lucide-react/dist/esm/icons/search'
import XIcon from 'lucide-react/dist/esm/icons/x'
import LoaderIcon from 'lucide-react/dist/esm/icons/loader'
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down'
import SlidersHorizontalIcon from 'lucide-react/dist/esm/icons/sliders-horizontal'
import { fetchProductsFn, type ProductRow } from '@/server/products.functions'
import { AVAILABILITY_OPTIONS, OCCASION_LINKS, type OccasionLink } from '@/lib/merchandising'
import { trackAnalyticsEvent } from '@/lib/analytics'
import EmptyState from './EmptyState'
import ProductCard from './ProductCard'

const PAGE_SIZE = 12

const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'featured', label: 'Featured' },
	{ value: 'price-asc', label: 'Price: Low to High' },
	{ value: 'price-desc', label: 'Price: High to Low' },
	{ value: 'name-asc', label: 'Name: A to Z' },
] as const

const filterControlClass =
	'h-12 w-full rounded-none border border-stone-200 bg-white px-4 text-sm text-stone-800 outline-none transition-colors hover:border-stone-300 focus:border-stone-700 focus:bg-white'

type ProductFilters = {
	search: string
	category: string
	occasion: string
	fabric: string
	color: string
	availability: string
	priceMin: string
	priceMax: string
	sort: string
}

interface ProductsGridProps {
	initialProducts: ProductRow[]
	initialTotal: number
	initialHasMore: boolean
	categories: string[]
	facets?: {
		occasions?: string[]
		fabrics?: string[]
		colors?: string[]
	}
	occasionLinks?: OccasionLink[]
	whatsappNumber?: string | null
	initialFilters?: Partial<ProductFilters>
}

function normalizeInitialFilters(filters?: Partial<ProductFilters>): ProductFilters {
	return {
		search: filters?.search || '',
		category: filters?.category || '',
		occasion: filters?.occasion || '',
		fabric: filters?.fabric || '',
		color: filters?.color || '',
		availability: filters?.availability || '',
		priceMin: filters?.priceMin || '',
		priceMax: filters?.priceMax || '',
		sort: filters?.sort || 'newest',
	}
}

function readFiltersFromUrl() {
	if (typeof window === 'undefined') return normalizeInitialFilters()
	const params = new URLSearchParams(window.location.search)
	return normalizeInitialFilters({
		search: params.get('search') || '',
		category: params.get('category') || '',
		occasion: params.get('occasion') || '',
		fabric: params.get('fabric') || '',
		color: params.get('color') || '',
		availability: params.get('availability') || '',
		priceMin: params.get('priceMin') || '',
		priceMax: params.get('priceMax') || '',
		sort: params.get('sort') || 'newest',
	})
}

function buildProductsSearch(filters: ProductFilters) {
	const params = new URLSearchParams()
	for (const [key, value] of Object.entries(filters)) {
		if (!value) continue
		if (key === 'sort' && value === 'newest') continue
		params.set(key, value)
	}
	const query = params.toString()
	return query ? `/products?${query}` : '/products'
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

function uniqueOptions(values: string[] = []) {
	return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function FilterSelect({
	value,
	onChange,
	children,
	ariaLabel,
	className = '',
}: {
	value: string
	onChange: (value: string) => void
	children: ReactNode
	ariaLabel: string
	className?: string
}) {
	return (
		<div className="relative min-w-0">
			<select
				aria-label={ariaLabel}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className={`${filterControlClass} appearance-none pr-11 ${className}`}
			>
				{children}
			</select>
			<ChevronDownIcon
				size={15}
				strokeWidth={1.8}
				className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
			/>
		</div>
	)
}

export default function ProductsGrid({
	initialProducts,
	initialTotal,
	initialHasMore,
	categories,
	facets,
	occasionLinks = [...OCCASION_LINKS],
	whatsappNumber,
	initialFilters,
}: ProductsGridProps) {
	const [items, setItems] = useState<ProductRow[]>(initialProducts)
	const [total, setTotal] = useState(initialTotal)
	const [hasMore, setHasMore] = useState(initialHasMore)
	const [filters, setFilters] = useState<ProductFilters>(() =>
		normalizeInitialFilters(initialFilters),
	)
	const [searchInput, setSearchInput] = useState(filters.search)
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)

	const sentinelRef = useRef<HTMLDivElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
	const abortRef = useRef(0)
	const isInitialRender = useRef(true)
	const syncingFromHistory = useRef(false)
	const fetchProducts = useServerFn(fetchProductsFn)

	const fabricOptions = useMemo(() => uniqueOptions(facets?.fabrics), [facets?.fabrics])
	const colorOptions = useMemo(() => uniqueOptions(facets?.colors), [facets?.colors])
	const occasionOptions = occasionLinks.length > 0 ? occasionLinks : OCCASION_LINKS

	useEffect(() => {
		debounceRef.current = setTimeout(() => {
			setFilters((prev) => ({ ...prev, search: searchInput }))
		}, 300)
		return () => clearTimeout(debounceRef.current)
	}, [searchInput])

	useEffect(() => {
		const desiredUrl = buildProductsSearch(filters)
		const currentUrl = `${window.location.pathname}${window.location.search}`
		if (currentUrl !== desiredUrl) {
			window.history.replaceState(null, '', desiredUrl)
		}
	})

	useEffect(() => {
		const onPopState = () => {
			syncingFromHistory.current = true
			const next = readFiltersFromUrl()
			setFilters(next)
			setSearchInput(next.search)
		}
		window.addEventListener('popstate', onPopState)
		return () => window.removeEventListener('popstate', onPopState)
	}, [])

	const activeFilterKeys = useMemo(
		() =>
			(Object.entries(filters) as Array<[keyof ProductFilters, string]>)
				.filter(([key, value]) => value && !(key === 'sort' && value === 'newest'))
				.map(([key]) => key),
		[filters],
	)

	const fetchFiltered = useCallback(
		async (nextFilters: ProductFilters) => {
			const requestId = ++abortRef.current
			setIsLoading(true)
			setIsLoadingMore(false)
			window.scrollTo({ top: 0, behavior: 'smooth' })

			try {
				const result = await fetchProducts({
					data: {
						...nextFilters,
						offset: 0,
					},
				})

				if (abortRef.current !== requestId) return

				setItems(result.products)
				setTotal(result.total)
				setHasMore(result.hasMore)
			} finally {
				if (abortRef.current === requestId) {
					setIsLoading(false)
				}
			}
		},
		[fetchProducts],
	)

	useEffect(() => {
		if (isInitialRender.current) {
			isInitialRender.current = false
			return
		}

		const nextUrl = buildProductsSearch(filters)
		if (syncingFromHistory.current) {
			syncingFromHistory.current = false
		} else {
			window.history.pushState(null, '', nextUrl)
		}

		trackAnalyticsEvent({
			eventName: 'filter_apply',
			filterKeys: activeFilterKeys,
			route: '/products',
		})
		void fetchFiltered(filters)
	}, [activeFilterKeys, fetchFiltered, filters])

	const loadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return
		const requestId = abortRef.current
		setIsLoadingMore(true)

		const result = await fetchProducts({
			data: {
				...filters,
				offset: items.length,
			},
		})

		if (abortRef.current !== requestId) return

		setItems((prev) => [...prev, ...result.products])
		setTotal(result.total)
		setHasMore(result.hasMore)
		setIsLoadingMore(false)
	}, [fetchProducts, filters, hasMore, isLoadingMore, items.length])

	useEffect(() => {
		const sentinel = sentinelRef.current
		if (!sentinel || !hasMore || isLoading) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					void loadMore()
				}
			},
			{ rootMargin: '400px' },
		)

		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [hasMore, isLoading, loadMore])

	const updateFilter = (key: keyof ProductFilters, value: string) => {
		setFilters((prev) => ({ ...prev, [key]: value }))
	}

	const clearFilters = () => {
		const next = normalizeInitialFilters()
		setSearchInput('')
		setFilters(next)
	}

	const hasActiveFilters = activeFilterKeys.length > 0

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

				<motion.div layout className="mb-8 border border-stone-200 bg-white p-5 md:p-6">
					<div className="mb-4 flex items-center justify-between gap-4">
						<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
							<SlidersHorizontalIcon size={15} />
							Filters
						</div>
						{hasActiveFilters ? (
							<button
								type="button"
								onClick={clearFilters}
								className="text-xs uppercase tracking-widest text-yellow-700 hover:text-stone-900 transition-colors"
							>
								Clear all
							</button>
						) : null}
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr]">
						<div className="relative">
							<SearchIcon
								size={16}
								className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
							/>
							<input
								type="text"
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Search products"
								className={`${filterControlClass} pl-11 pr-10 placeholder:text-stone-400`}
							/>
							{searchInput ? (
								<button
									type="button"
									onClick={() => setSearchInput('')}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
									aria-label="Clear search"
								>
									<XIcon size={16} />
								</button>
							) : null}
						</div>

						<FilterSelect
							ariaLabel="Sort products"
							value={filters.sort}
							onChange={(value) => updateFilter('sort', value)}
							className="text-xs uppercase tracking-widest text-stone-600"
						>
							{SORT_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</FilterSelect>
					</div>

					<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr]">
						<FilterSelect
							ariaLabel="Filter by category"
							value={filters.category}
							onChange={(value) => updateFilter('category', value)}
						>
							<option value="">All categories</option>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</FilterSelect>
						<FilterSelect
							ariaLabel="Filter by occasion"
							value={filters.occasion}
							onChange={(value) => updateFilter('occasion', value)}
						>
							<option value="">All occasions</option>
							{occasionOptions.map((occasion) => (
								<option key={occasion.slug} value={occasion.slug}>
									{occasion.label}
								</option>
							))}
						</FilterSelect>
						<FilterSelect
							ariaLabel="Filter by availability"
							value={filters.availability}
							onChange={(value) => updateFilter('availability', value)}
						>
							<option value="">Any availability</option>
							{AVAILABILITY_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</FilterSelect>
						<div className="grid min-w-0 grid-cols-2 gap-2">
							<input
								type="number"
								min="0"
								value={filters.priceMin}
								onChange={(event) => updateFilter('priceMin', event.target.value)}
								placeholder="Min price"
								className={`${filterControlClass} min-w-0 placeholder:text-stone-400`}
							/>
							<input
								type="number"
								min="0"
								value={filters.priceMax}
								onChange={(event) => updateFilter('priceMax', event.target.value)}
								placeholder="Max price"
								className={`${filterControlClass} min-w-0 placeholder:text-stone-400`}
							/>
						</div>
					</div>

					{fabricOptions.length > 0 || colorOptions.length > 0 ? (
						<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
							{fabricOptions.length > 0 ? (
								<FilterSelect
									ariaLabel="Filter by fabric"
									value={filters.fabric}
									onChange={(value) => updateFilter('fabric', value)}
								>
									<option value="">All fabrics</option>
									{fabricOptions.map((fabric) => (
										<option key={fabric} value={fabric.toLowerCase()}>
											{fabric}
										</option>
									))}
								</FilterSelect>
							) : null}
							{colorOptions.length > 0 ? (
								<FilterSelect
									ariaLabel="Filter by color"
									value={filters.color}
									onChange={(value) => updateFilter('color', value)}
								>
									<option value="">All colors</option>
									{colorOptions.map((color) => (
										<option key={color} value={color.toLowerCase()}>
											{color}
										</option>
									))}
								</FilterSelect>
							) : null}
						</div>
					) : null}
				</motion.div>

				<div className="flex items-center justify-between mb-8">
					<p className="font-accent italic text-stone-500 text-sm">
						{isLoading ? 'Searching...' : `Showing ${items.length} of ${total} pieces`}
					</p>
					{hasActiveFilters ? (
						<div className="hidden md:flex flex-wrap justify-end gap-2">
							{activeFilterKeys.map((key) => (
								<span
									key={key}
									className="border border-stone-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-widest text-stone-500"
								>
									{key}
								</span>
							))}
						</div>
					) : null}
				</div>

				<AnimatePresence mode="wait">
					{isLoading ? (
						<motion.div
							key="loading"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
						>
							{Array.from({ length: 8 }).map((_, index) => (
								<ProductCardSkeleton key={index} />
							))}
						</motion.div>
					) : items.length > 0 ? (
						<motion.div
							key="products"
							layout
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
						>
							{items.map((product) => (
								<ProductCard key={product.id} product={product} whatsappNumber={whatsappNumber} />
							))}
						</motion.div>
					) : null}
				</AnimatePresence>

				{!isLoading && items.length === 0 ? (
					<EmptyState
						title={hasActiveFilters ? 'No products found' : 'Check back soon'}
						description={
							hasActiveFilters
								? 'Adjust the selected filters to reveal more pieces.'
								: "We're curating new pieces for the collection."
						}
						action={
							hasActiveFilters ? (
								<button
									type="button"
									onClick={clearFilters}
									className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
								>
									View All Products
								</button>
							) : (
								<Link
									href="/collections"
									className="inline-block bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
								>
									Browse Collections
								</Link>
							)
						}
					/>
				) : null}

				{!isLoading && hasMore ? <div ref={sentinelRef} className="h-1" /> : null}

				{isLoadingMore ? (
					<div className="flex justify-center py-12">
						<LoaderIcon size={24} className="animate-spin text-stone-400" />
					</div>
				) : null}

				{!isLoading && !hasMore && items.length > 0 && items.length >= PAGE_SIZE ? (
					<p className="text-center py-12 text-sm text-stone-400 font-accent italic">
						You have viewed all {total} pieces
					</p>
				) : null}
			</div>
		</main>
	)
}
