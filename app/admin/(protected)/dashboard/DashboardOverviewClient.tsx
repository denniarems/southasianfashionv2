'use client'

import { motion } from 'framer-motion'
import { Package, Layers, Grid, Tags, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCad } from '@/lib/currency'

interface Stats {
	totalProducts: number
	totalCollections: number
	totalCategories: number
	activeDiscounts: number
}

export default function DashboardOverviewClient({
	stats,
	recentProducts,
	recentCollections,
}: {
	stats: Stats
	recentProducts: any[]
	recentCollections: any[]
}) {
	const statCards = [
		{ title: 'Total Products', value: stats.totalProducts, icon: Package, href: '/admin/products' },
		{ title: 'Collections', value: stats.totalCollections, icon: Layers, href: '/admin/collections' },
		{ title: 'Categories', value: stats.totalCategories, icon: Grid, href: '/admin/categories' },
		{ title: 'Active Discounts', value: stats.activeDiscounts, icon: Tags, href: '/admin/discounts' },
	]

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-heading text-stone-900 tracking-wide mb-1">
					Overview
				</h1>
				<p className="text-sm text-stone-500">
					Welcome to the SouthAsianFashion Admin Console
				</p>
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
						<Link href="/admin/products" className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
							View All <ArrowRight className="w-3 h-3" />
						</Link>
					</div>
					<div className="bg-white border border-stone-200 divide-y divide-stone-100">
						{recentProducts.length > 0 ? (
							recentProducts.map((product) => (
								<div key={product.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
									<div className="flex items-center gap-4">
										{product.imageUrl ? (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 overflow-hidden relative flex-shrink-0">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
											</div>
										) : (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
												<Package className="w-4 h-4" />
											</div>
										)}
										<div>
											<p className="text-sm font-medium text-stone-900 uppercase tracking-wider">{product.name}</p>
											<p className="text-xs text-stone-500">{product.category || 'Uncategorized'}</p>
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
						<Link href="/admin/collections" className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
							View All <ArrowRight className="w-3 h-3" />
						</Link>
					</div>
					<div className="bg-white border border-stone-200 divide-y divide-stone-100">
						{recentCollections.length > 0 ? (
							recentCollections.map((collection) => (
								<div key={collection.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
									<div className="flex items-center gap-4">
										{collection.imageUrl ? (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 overflow-hidden relative flex-shrink-0">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img src={collection.imageUrl} alt={collection.name} className="w-full h-full object-cover" />
											</div>
										) : (
											<div className="w-10 h-10 bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
												<Layers className="w-4 h-4" />
											</div>
										)}
										<div>
											<p className="text-sm font-medium text-stone-900 uppercase tracking-wider">{collection.name}</p>
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