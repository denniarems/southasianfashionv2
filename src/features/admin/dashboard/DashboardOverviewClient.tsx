'use client'

import { motion } from 'framer-motion'
import { Package, Layers, Grid, Tags, ArrowRight, BarChart3, AlertTriangle } from 'lucide-react'
import Link from '@/components/router-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCad } from '@/lib/currency'

interface Stats {
	totalProducts: number
	totalCollections: number
	totalCategories: number
	activeDiscounts: number
}

type AnalyticsSummary = {
	available: boolean
	counts: Record<string, { sevenDay: number; thirtyDay: number }>
	topProducts: Array<{ productId: string | null; productSlug: string | null; views: number }>
}

type MerchandisingWarnings = {
	missingPrimaryImage: number
	lowImageCount: number
	weakProductNames: number
}

export default function DashboardOverviewClient({
	stats,
	recentProducts,
	recentCollections,
	analyticsSummary,
	merchandisingWarnings,
}: {
	stats: Stats
	recentProducts: any[]
	recentCollections: any[]
	analyticsSummary: AnalyticsSummary
	merchandisingWarnings: MerchandisingWarnings
}) {
	const statCards = [
		{ title: 'Total Products', value: stats.totalProducts, icon: Package, href: '/admin/products' },
		{
			title: 'Collections',
			value: stats.totalCollections,
			icon: Layers,
			href: '/admin/collections',
		},
		{ title: 'Categories', value: stats.totalCategories, icon: Grid, href: '/admin/categories' },
		{
			title: 'Active Discounts',
			value: stats.activeDiscounts,
			icon: Tags,
			href: '/admin/discounts',
		},
	]

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-heading text-stone-900 tracking-wide mb-1">Overview</h1>
				<p className="text-sm text-stone-500">Welcome to the SouthAsianFashion Admin Console</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map((stat, i) => {
					const Icon = stat.icon
					return (
						<motion.div
							key={stat.title}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.1 }}
						>
							<Link href={stat.href}>
								<Card className="rounded-none border-stone-200 hover:border-stone-400 transition-colors bg-white/50 backdrop-blur-sm h-full">
									<CardHeader className="flex flex-row items-center justify-between pb-2">
										<CardTitle className="text-xs uppercase tracking-widest text-stone-500 font-medium">
											{stat.title}
										</CardTitle>
										<Icon className="h-4 w-4 text-stone-400" />
									</CardHeader>
									<CardContent>
										<div className="text-3xl font-heading text-stone-900">{stat.value}</div>
									</CardContent>
								</Card>
							</Link>
						</motion.div>
					)
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
				<Card className="rounded-none border-stone-200 bg-white/70">
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<div>
							<CardTitle className="text-sm uppercase tracking-widest text-stone-900">
								Commerce Analytics
							</CardTitle>
							<p className="mt-1 text-xs text-stone-500">7-day and 30-day storefront events</p>
						</div>
						<BarChart3 className="h-4 w-4 text-stone-400" />
					</CardHeader>
					<CardContent>
						{analyticsSummary.available ? (
							<div className="space-y-5">
								<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
									{[
										['Views', analyticsSummary.counts.product_view],
										['Atelier Brief', analyticsSummary.counts.add_to_cart],
										['Private Fittings', analyticsSummary.counts.whatsapp_click],
										['Shares', analyticsSummary.counts.share_click],
										['Wishlist', analyticsSummary.counts.wishlist_toggle],
									].map(([label, counts]) => {
										const values = counts as { sevenDay: number; thirtyDay: number }
										return (
											<div key={label as string} className="border border-stone-200 bg-stone-50 p-3">
												<p className="text-[10px] uppercase tracking-widest text-stone-500">
													{label as string}
												</p>
												<p className="mt-2 font-heading text-2xl text-stone-900">
													{values.sevenDay}
												</p>
												<p className="text-[11px] text-stone-500">{values.thirtyDay} in 30 days</p>
											</div>
										)
									})}
								</div>
								<div>
									<p className="mb-2 text-[11px] uppercase tracking-widest text-stone-500">
										Top products by views
									</p>
									{analyticsSummary.topProducts.length > 0 ? (
										<div className="divide-y divide-stone-100 border border-stone-200">
											{analyticsSummary.topProducts.map((product) => (
												<div
													key={product.productId || product.productSlug}
													className="flex items-center justify-between px-3 py-2 text-sm"
												>
													<span className="text-stone-700">
														{product.productSlug || product.productId}
													</span>
													<span className="font-medium text-stone-900">{product.views}</span>
												</div>
											))}
										</div>
									) : (
										<p className="border border-stone-200 px-3 py-4 text-sm text-stone-500">
											No product view events yet.
										</p>
									)}
								</div>
							</div>
						) : (
							<p className="border border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">
								Analytics events are unavailable in this environment.
							</p>
						)}
					</CardContent>
				</Card>

				<Card className="rounded-none border-stone-200 bg-white/70">
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<CardTitle className="text-sm uppercase tracking-widest text-stone-900">
							Media Warnings
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-yellow-700" />
					</CardHeader>
					<CardContent className="space-y-3">
						{[
							['Missing primary image', merchandisingWarnings.missingPrimaryImage],
							['Low image count', merchandisingWarnings.lowImageCount],
							['Weak product names', merchandisingWarnings.weakProductNames],
						].map(([label, value]) => (
							<div key={label as string} className="flex items-center justify-between border border-stone-200 bg-stone-50 px-3 py-3">
								<span className="text-sm text-stone-600">{label as string}</span>
								<span className="font-heading text-xl text-stone-900">{value as number}</span>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Recent Products */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="space-y-4"
				>
					<div className="flex items-center justify-between">
						<h2 className="text-sm uppercase tracking-widest font-semibold text-stone-900">
							Recent Products
						</h2>
						<Link
							href="/admin/products"
							className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
						>
							View All <ArrowRight className="w-3 h-3" />
						</Link>
					</div>
					<div className="bg-white border border-stone-200 divide-y divide-stone-100">
						{recentProducts.length > 0 ? (
							recentProducts.map((product) => (
								<div
									key={product.id}
									className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
								>
									<div className="flex items-center gap-4">
										{product.imageUrl ? (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 overflow-hidden relative flex-shrink-0">
												<img
													src={product.imageUrl}
													alt={product.name}
													className="w-full h-full object-cover"
												/>
											</div>
										) : (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
												<Package className="w-4 h-4" />
											</div>
										)}
										<div>
											<p className="text-sm font-medium text-stone-900 uppercase tracking-wider">
												{product.name}
											</p>
											<p className="text-xs text-stone-500">
												{product.category || 'Uncategorized'}
											</p>
										</div>
									</div>
									<div className="text-sm text-stone-600 font-medium">
										{formatCad(Math.round(product.price))}
									</div>
								</div>
							))
						) : (
							<div className="p-8 text-center text-sm text-stone-500">No products found</div>
						)}
					</div>
				</motion.div>

				{/* Recent Collections */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="space-y-4"
				>
					<div className="flex items-center justify-between">
						<h2 className="text-sm uppercase tracking-widest font-semibold text-stone-900">
							Recent Collections
						</h2>
						<Link
							href="/admin/collections"
							className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
						>
							View All <ArrowRight className="w-3 h-3" />
						</Link>
					</div>
					<div className="bg-white border border-stone-200 divide-y divide-stone-100">
						{recentCollections.length > 0 ? (
							recentCollections.map((collection) => (
								<div
									key={collection.id}
									className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
								>
									<div className="flex items-center gap-4">
										{collection.imageUrl ? (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 overflow-hidden relative flex-shrink-0">
												<img
													src={collection.imageUrl}
													alt={collection.name}
													className="w-full h-full object-cover"
												/>
											</div>
										) : (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
												<Layers className="w-4 h-4" />
											</div>
										)}
										<div>
											<p className="text-sm font-medium text-stone-900 uppercase tracking-wider">
												{collection.name}
											</p>
											<p className="text-xs text-stone-500">{collection.slug}</p>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="p-8 text-center text-sm text-stone-500">No collections found</div>
						)}
					</div>
				</motion.div>
			</div>
		</div>
	)
}
