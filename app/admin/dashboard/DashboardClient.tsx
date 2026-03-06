'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash2, LogOut, ArrowLeft, Loader2 } from 'lucide-react'
import ImageUpload from '@/app/components/ImageUpload'
import MultiImageUpload from '@/app/components/MultiImageUpload'
import {
	deleteItem,
	fetchProductImagesForAdmin,
	saveItem,
	saveSettings,
} from '@/app/actions/dashboard'
import { logout } from '@/app/actions/auth'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingImage } from '@/components/ui/loading-image'
import { formatCad } from '@/lib/currency'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<Label className="text-xs uppercase tracking-widest text-stone-500">{label}</Label>
			{children}
		</div>
	)
}

function FormSection({
	title,
	description,
	children,
}: {
	title: string
	description?: string
	children: React.ReactNode
}) {
	return (
		<div className="rounded-none border border-stone-200 p-4 space-y-4">
			<div>
				<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">{title}</p>
				{description ? <p className="text-[11px] text-stone-500 mt-1">{description}</p> : null}
			</div>
			{children}
		</div>
	)
}

function DiscountLivePreview({ form }: { form: any }) {
	const base = Number(form.originalPrice || 7999)
	const value = Number(form.discountValue || 0)
	let discounted = base

	if (form.discountType === 'percentage') {
		discounted = Math.max(0, base - (base * value) / 100)
	} else if (
		form.discountType === 'flat' ||
		form.discountType === 'bundle' ||
		form.discountType === 'tiered'
	) {
		discounted = Math.max(0, base - value)
	}

	const savings = Math.max(0, base - discounted)

	return (
		<div className="rounded-none border border-[#B8860B]/40 bg-gradient-to-r from-[#fffaf0] to-white p-4">
			<p className="text-[10px] uppercase tracking-[0.16em] text-[#7A1E2C]">
				Live Customer Preview
			</p>
			<p className="text-xs text-stone-500 mt-1">Preview based on an example item price.</p>
			<div className="mt-3 flex items-end gap-3">
				<p className="text-xl font-semibold text-stone-900">{formatCad(Math.round(discounted))}</p>
				<p className="text-sm text-stone-400 line-through">{formatCad(Math.round(base))}</p>
			</div>
			<div className="mt-2 flex items-center gap-2">
				<span className="text-[10px] uppercase tracking-[0.12em] bg-[#7A1E2C]/10 text-[#7A1E2C] px-2 py-0.5 border border-[#7A1E2C]/20">
					{form.wording || 'Instant Price Drop'}
				</span>
				<span className="text-xs text-[#B8860B] font-medium">
					Save {formatCad(Math.round(savings))}
				</span>
			</div>
		</div>
	)
}

const DISCOUNT_STRATEGIES: Array<{
	id: 'flat' | 'percentage' | 'tiered' | 'bundle'
	label: string
	description: string
	defaultWording: string
}> = [
	{
		id: 'flat',
		label: 'Flat Amount',
		description: 'Best for premium pieces where concrete savings convert faster.',
		defaultWording: 'Instant Price Drop',
	},
	{
		id: 'percentage',
		label: 'Percentage',
		description: 'Great for seasonal campaigns and store-wide buzz.',
		defaultWording: 'Exclusive Offer',
	},
	{
		id: 'tiered',
		label: 'Tiered Cart',
		description: 'Boost AOV with progressive savings by cart threshold.',
		defaultWording: 'Archive Tier Savings',
	},
	{
		id: 'bundle',
		label: 'Bundle Set',
		description: 'Move slow inventory by pairing complementary products.',
		defaultWording: 'Complete The Look Savings',
	},
]

const TIER_TEMPLATE = JSON.stringify(
	[
		{ minCartValue: 2000, discountValue: 10, discountType: 'percentage' },
		{ minCartValue: 5000, discountValue: 20, discountType: 'percentage' },
		{ minCartValue: 8000, discountValue: 30, discountType: 'percentage' },
	],
	null,
	2,
)

function parseStringArrayFromMixed(input: unknown): string[] {
	if (Array.isArray(input)) {
		return input.filter((v): v is string => typeof v === 'string').map((v) => v.trim())
	}

	if (typeof input === 'string') {
		const trimmed = input.trim()
		if (!trimmed) return []

		try {
			const parsed = JSON.parse(trimmed)
			if (!Array.isArray(parsed)) return []
			return parsed.filter((v): v is string => typeof v === 'string').map((v) => v.trim())
		} catch {
			return trimmed
				.split(',')
				.map((v) => v.trim())
				.filter(Boolean)
		}
	}

	return []
}

function getDefaultDiscountForm() {
	const now = new Date()
	const end = new Date(now)
	end.setDate(end.getDate() + 14)

	return {
		name: '',
		description: '',
		discountType: 'flat',
		discountValue: 0,
		originalPrice: '',
		startDate: now.toISOString().slice(0, 16),
		endDate: end.toISOString().slice(0, 16),
		minCartValue: 0,
		priority: 10,
		maxUses: '',
		applicableProductIds: [] as string[],
		applicableCategories: [] as string[],
		bundleProductIds: [] as string[],
		tierRulesJson: TIER_TEMPLATE,
		wording: 'Instant Price Drop',
		isActive: true,
		stackable: false,
	}
}

function normalizeDiscountFormData(data: any) {
	const defaults = getDefaultDiscountForm()

	if (!data) return defaults

	const { productId: legacyProductId, ...rest } = data
	const parsedApplicableProductIds = parseStringArrayFromMixed(data.applicableProductIds)

	return {
		...defaults,
		...rest,
		startDate: data.startDate
			? new Date(data.startDate).toISOString().slice(0, 16)
			: defaults.startDate,
		endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
		applicableProductIds:
			parsedApplicableProductIds.length > 0
				? parsedApplicableProductIds
				: typeof legacyProductId === 'string' && legacyProductId.trim()
					? [legacyProductId.trim()]
					: defaults.applicableProductIds,
		applicableCategories: parseStringArrayFromMixed(data.applicableCategories),
		bundleProductIds: parseStringArrayFromMixed(data.bundleProductIds),
		tierRulesJson:
			typeof data.tierRulesJson === 'string' && data.tierRulesJson.trim()
				? data.tierRulesJson
				: defaults.tierRulesJson,
		wording: data.wording || defaults.wording,
	}
}

export default function DashboardClient({
	initialProducts,
	initialCollections,
	initialHeroes,
	initialCategories,
	initialSizeGuides,
	initialDiscounts,
	initialSettings,
}: any) {
	const router = useRouter()
	const sizeGuideNameById = Object.fromEntries(
		(initialSizeGuides || []).map((guide: any) => [guide.id, guide.name]),
	)
	const [settingsForm, setSettingsForm] = useState(initialSettings)
	const [dlg, setDlg] = useState({ open: false, type: '', mode: 'add', data: null as any })
	const [pendingDelete, setPendingDelete] = useState<{
		open: boolean
		type: string
		id: string
		label: string
	}>({
		open: false,
		type: '',
		id: '',
		label: '',
	})
	const [isMutating, startMutatingTransition] = useTransition()
	const [productImagesMap, setProductImagesMap] = useState<Record<string, string[]>>({})

	useEffect(() => {
		fetchProductImagesForAdmin().then(setProductImagesMap)
	}, [initialProducts])

	const openDeleteConfirmation = (type: string, id: string, label: string) => {
		setPendingDelete({
			open: true,
			type,
			id,
			label,
		})
	}

	const handleDelete = () => {
		startMutatingTransition(() => {
			void (async () => {
				const res = await deleteItem(pendingDelete.type, pendingDelete.id)
				if (res.error) {
					toast.error(res.error || 'Delete failed')
					return
				}

				toast.success('Deleted successfully')
				setPendingDelete({ open: false, type: '', id: '', label: '' })
			})()
		})
	}

	const handleSaveSettings = (e: React.FormEvent) => {
		e.preventDefault()
		startMutatingTransition(() => {
			void (async () => {
				const res = await saveSettings(settingsForm)
				if (res.error) {
					toast.error(res.error || 'Failed to save settings')
					return
				}
				toast.success('Settings saved')
			})()
		})
	}

	const handleLogout = () => {
		startMutatingTransition(() => {
			void (async () => {
				await logout()
				router.push('/admin/login')
				router.refresh()
			})()
		})
	}

	return (
		<div className="min-h-screen bg-stone-50" data-testid="admin-dashboard">
			<div className="bg-white border-b border-stone-200">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<a
							href="/"
							data-testid="admin-back-btn"
							className="text-stone-400 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-stone-500 transition-colors"
							aria-label="Back to storefront"
						>
							<ArrowLeft size={18} />
						</a>
						<div>
							<h1 className="font-heading text-lg text-stone-900">Admin Dashboard</h1>
							<p className="text-xs text-stone-400">SouthAsianFashion Management</p>
						</div>
					</div>
					<Button
						data-testid="admin-logout-btn"
						variant="outline"
						onClick={handleLogout}
						disabled={isMutating}
						className="rounded-none text-xs uppercase tracking-widest"
					>
						{isMutating ? (
							<Loader2 size={14} className="mr-2 animate-spin" />
						) : (
							<LogOut size={14} className="mr-2" />
						)}{' '}
						Sign Out
					</Button>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-6 py-8">
				<Tabs defaultValue="products">
					<TabsList className="bg-stone-200/50 rounded-none border border-stone-200 p-1 mb-8 w-full md:w-auto h-auto flex flex-wrap">
						<TabsTrigger
							data-testid="tab-products"
							value="products"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Products
						</TabsTrigger>
						<TabsTrigger
							data-testid="tab-collections"
							value="collections"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Collections
						</TabsTrigger>
						<TabsTrigger
							data-testid="tab-hero"
							value="hero"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Hero
						</TabsTrigger>
						<TabsTrigger
							data-testid="tab-categories"
							value="categories"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Categories
						</TabsTrigger>
						<TabsTrigger
							data-testid="tab-discounts"
							value="discounts"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Discounts
						</TabsTrigger>
						<TabsTrigger
							data-testid="tab-settings"
							value="settings"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Settings
						</TabsTrigger>
						<TabsTrigger
							data-testid="tab-size-guides"
							value="size-guides"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Size Guides
						</TabsTrigger>
					</TabsList>

					{/* Products */}
					<TabsContent value="products">
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="font-heading text-xl text-stone-900">
									Products ({initialProducts.length})
								</h2>
								<Button
									data-testid="add-product-btn"
									onClick={() => setDlg({ open: true, type: 'products', mode: 'add', data: null })}
									className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									<Plus size={14} className="mr-2" /> Add Product
								</Button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{initialProducts.map((p: any) => (
									<div
										key={p.id}
										className="bg-white border border-stone-200 p-4"
										data-testid={`admin-product-${p.id}`}
									>
										<div className="flex gap-4">
											{p.imageUrl ? (
												<LoadingImage
													src={p.imageUrl}
													alt={p.name}
													width={80}
													height={80}
													sizes="80px"
													className="w-20 h-20 object-cover shrink-0"
												/>
											) : (
												<div className="w-20 h-20 bg-stone-100 shrink-0" />
											)}
											<div className="flex-1 min-w-0">
												<h3 className="font-heading text-sm text-stone-900 truncate">{p.name}</h3>
												<p className="text-xs text-stone-400 mt-1">
													{p.category} &middot; {formatCad(p.price)}
												</p>
												<p className="text-[11px] text-stone-500 mt-1">
													Size Guide:{' '}
													{p.sizeGuideId ? sizeGuideNameById[p.sizeGuideId] || 'Unknown' : 'None'}
												</p>
												<div className="flex gap-1 mt-2">
													{p.isNew && (
														<span className="text-[10px] bg-yellow-700/10 text-yellow-700 px-2 py-0.5">
															NEW
														</span>
													)}
													{p.isFeatured && (
														<span className="text-[10px] bg-stone-900/10 text-stone-700 px-2 py-0.5">
															FEATURED
														</span>
													)}
												</div>
											</div>
										</div>
										<div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
											<Button
												data-testid={`edit-product-${p.id}`}
												variant="outline"
												size="sm"
												onClick={() =>
													setDlg({
														open: true,
														type: 'products',
														mode: 'edit',
														data: { ...p, additionalImages: productImagesMap[p.id] || [] },
													})
												}
												className="rounded-none text-xs flex-1"
											>
												<Pencil size={12} className="mr-1" /> Edit
											</Button>
											<Button
												data-testid={`delete-product-${p.id}`}
												variant="outline"
												size="sm"
												onClick={() =>
													openDeleteConfirmation('products', p.id, p.name || 'this product')
												}
												className="rounded-none text-xs text-red-600 hover:bg-red-50"
											>
												<Trash2 size={12} />
											</Button>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</TabsContent>

					{/* Discounts */}
					<TabsContent value="discounts">
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="font-heading text-xl text-stone-900">
									Discounts ({initialDiscounts.length})
								</h2>
								<Button
									data-testid="add-discount-btn"
									onClick={() => setDlg({ open: true, type: 'discounts', mode: 'add', data: null })}
									className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									<Plus size={14} className="mr-2" /> Add Discount
								</Button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{initialDiscounts.map((discount: any) => {
									const typeLabel = discount.discountType.toUpperCase()
									const dateRange = `${new Date(discount.startDate).toLocaleDateString()}${discount.endDate ? ` to ${new Date(discount.endDate).toLocaleDateString()}` : ' to Permanent'}`

									return (
										<div
											key={discount.id}
											className="bg-white border border-stone-200 p-4"
											data-testid={`admin-discount-${discount.id}`}
										>
											<div className="flex items-start justify-between gap-3">
												<div>
													<h3 className="font-heading text-sm text-stone-900">{discount.name}</h3>
													<p className="text-xs text-stone-500 mt-1">{discount.description}</p>
												</div>
												<div className="flex gap-1">
													{discount.isActive ? (
														<span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5">
															ACTIVE
														</span>
													) : (
														<span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5">
															INACTIVE
														</span>
													)}
													<span className="text-[10px] bg-yellow-700/10 text-yellow-700 px-2 py-0.5">
														{typeLabel}
													</span>
												</div>
											</div>

											<div className="text-xs text-stone-500 mt-3 space-y-1">
												<p>
													Value: <span className="font-medium">{discount.discountValue}</span>
												</p>
												<p>
													Priority: <span className="font-medium">{discount.priority}</span>
												</p>
												<p>{dateRange}</p>
											</div>

											<div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
												<Button
													data-testid={`edit-discount-${discount.id}`}
													variant="outline"
													size="sm"
													onClick={() =>
														setDlg({ open: true, type: 'discounts', mode: 'edit', data: discount })
													}
													className="rounded-none text-xs flex-1"
												>
													<Pencil size={12} className="mr-1" /> Edit
												</Button>
												<Button
													data-testid={`delete-discount-${discount.id}`}
													variant="outline"
													size="sm"
													onClick={() =>
														openDeleteConfirmation(
															'discounts',
															discount.id,
															discount.name || 'this discount',
														)
													}
													className="rounded-none text-xs text-red-600 hover:bg-red-50"
												>
													<Trash2 size={12} />
												</Button>
											</div>
										</div>
									)
								})}
							</div>
						</motion.div>
					</TabsContent>

					{/* Collections */}
					<TabsContent value="collections">
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="font-heading text-xl text-stone-900">
									Collections ({initialCollections.length})
								</h2>
								<Button
									data-testid="add-collection-btn"
									onClick={() =>
										setDlg({ open: true, type: 'collections', mode: 'add', data: null })
									}
									className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									<Plus size={14} className="mr-2" /> Add Collection
								</Button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{initialCollections.map((c: any) => (
									<div
										key={c.id}
										className="bg-white border border-stone-200 p-4 flex gap-4"
										data-testid={`admin-collection-${c.id}`}
									>
										{c.imageUrl && (
											<LoadingImage
												src={c.imageUrl}
												alt={c.name}
												width={96}
												height={96}
												sizes="96px"
												className="w-24 h-24 object-cover shrink-0"
											/>
										)}
										<div className="flex-1">
											<h3 className="font-heading text-sm text-stone-900">{c.name}</h3>
											<p className="text-xs text-stone-400 mt-1 line-clamp-2">{c.description}</p>
											<div className="flex gap-2 mt-3">
												<Button
													data-testid={`edit-collection-${c.id}`}
													variant="outline"
													size="sm"
													onClick={() =>
														setDlg({ open: true, type: 'collections', mode: 'edit', data: c })
													}
													className="rounded-none text-xs"
												>
													<Pencil size={12} className="mr-1" /> Edit
												</Button>
												<Button
													data-testid={`delete-collection-${c.id}`}
													variant="outline"
													size="sm"
													onClick={() =>
														openDeleteConfirmation('collections', c.id, c.name || 'this collection')
													}
													className="rounded-none text-xs text-red-600 hover:bg-red-50"
												>
													<Trash2 size={12} />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</TabsContent>

					{/* Hero */}
					<TabsContent value="hero">
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="font-heading text-xl text-stone-900">
									Hero Banners ({initialHeroes.length})
								</h2>
								<Button
									data-testid="add-hero-btn"
									onClick={() => setDlg({ open: true, type: 'hero', mode: 'add', data: null })}
									className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									<Plus size={14} className="mr-2" /> Add Banner
								</Button>
							</div>
							<div className="space-y-4">
								{initialHeroes.map((h: any) => (
									<div
										key={h.id}
										className="bg-white border border-stone-200 p-4 flex gap-4"
										data-testid={`admin-hero-${h.id}`}
									>
										{h.imageUrl && (
											<LoadingImage
												src={h.imageUrl}
												alt={h.title}
												width={128}
												height={80}
												sizes="128px"
												className="w-32 h-20 object-cover shrink-0"
											/>
										)}
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<h3 className="font-heading text-sm text-stone-900">{h.title}</h3>
												{h.isActive && (
													<span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5">
														ACTIVE
													</span>
												)}
											</div>
											<p className="text-xs text-stone-400 mt-1 line-clamp-1">{h.subtitle}</p>
										</div>
										<div className="flex gap-2 items-start shrink-0">
											<Button
												data-testid={`edit-hero-${h.id}`}
												variant="outline"
												size="sm"
												onClick={() => setDlg({ open: true, type: 'hero', mode: 'edit', data: h })}
												className="rounded-none text-xs"
											>
												<Pencil size={12} />
											</Button>
											<Button
												data-testid={`delete-hero-${h.id}`}
												variant="outline"
												size="sm"
												onClick={() =>
													openDeleteConfirmation('hero', h.id, h.title || 'this banner')
												}
												className="rounded-none text-xs text-red-600 hover:bg-red-50"
											>
												<Trash2 size={12} />
											</Button>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</TabsContent>

					{/* Categories */}
					<TabsContent value="categories">
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="font-heading text-xl text-stone-900">
									Categories ({initialCategories.length})
								</h2>
								<Button
									data-testid="add-category-btn"
									onClick={() =>
										setDlg({ open: true, type: 'categories', mode: 'add', data: null })
									}
									className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									<Plus size={14} className="mr-2" /> Add Category
								</Button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{initialCategories.map((cat: any) => (
									<div
										key={cat.id}
										className="bg-white border border-stone-200 p-4"
										data-testid={`admin-category-${cat.id}`}
									>
										<h3 className="font-heading text-sm text-stone-900">{cat.name}</h3>
										<p className="text-xs text-stone-400 mt-1">{cat.slug}</p>
										{cat.description && (
											<p className="text-xs text-stone-500 mt-1 line-clamp-2">{cat.description}</p>
										)}
										<div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
											<Button
												data-testid={`edit-category-${cat.id}`}
												variant="outline"
												size="sm"
												onClick={() =>
													setDlg({ open: true, type: 'categories', mode: 'edit', data: cat })
												}
												className="rounded-none text-xs flex-1"
											>
												<Pencil size={12} className="mr-1" /> Edit
											</Button>
											<Button
												data-testid={`delete-category-${cat.id}`}
												variant="outline"
												size="sm"
												onClick={() =>
													openDeleteConfirmation('categories', cat.id, cat.name || 'this category')
												}
												className="rounded-none text-xs text-red-600 hover:bg-red-50"
											>
												<Trash2 size={12} />
											</Button>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</TabsContent>

					{/* Settings */}
					<TabsContent value="settings">
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<h2 className="font-heading text-xl text-stone-900 mb-6">Site Settings</h2>
							<form
								onSubmit={handleSaveSettings}
								className="bg-white border border-stone-200 p-6 md:p-8 space-y-8"
							>
								<div>
									<p className="text-xs uppercase tracking-widest text-stone-400 mb-4">Brand</p>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<Field label="Brand Name">
											<Input
												data-testid="settings-brand-name"
												value={settingsForm.brandName || ''}
												onChange={(e) =>
													setSettingsForm({ ...settingsForm, brandName: e.target.value })
												}
												className="rounded-none"
											/>
										</Field>
										<Field label="Tagline">
											<Input
												data-testid="settings-tagline"
												value={settingsForm.brandTagline || ''}
												onChange={(e) =>
													setSettingsForm({ ...settingsForm, brandTagline: e.target.value })
												}
												className="rounded-none"
											/>
										</Field>
										<Field label="Contact Email">
											<Input
												data-testid="settings-email"
												type="email"
												value={settingsForm.contactEmail || ''}
												onChange={(e) =>
													setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
												}
												className="rounded-none"
											/>
										</Field>
									</div>
								</div>
								<Separator />
								<div>
									<p className="text-xs uppercase tracking-widest text-stone-400 mb-4">WhatsApp</p>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<Field label="WhatsApp Number">
											<Input
												data-testid="settings-whatsapp-number"
												value={settingsForm.whatsappNumber || ''}
												onChange={(e) =>
													setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
												}
												className="rounded-none"
												placeholder="+1234567890"
											/>
										</Field>
										<Field label="Default Message">
											<Input
												data-testid="settings-whatsapp-message"
												value={settingsForm.whatsappMessage || ''}
												onChange={(e) =>
													setSettingsForm({ ...settingsForm, whatsappMessage: e.target.value })
												}
												className="rounded-none"
											/>
										</Field>
									</div>
								</div>
								<Separator />
								<div>
									<p className="text-xs uppercase tracking-widest text-stone-400 mb-4">Social</p>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<Field label="Instagram URL">
											<Input
												data-testid="settings-instagram"
												value={settingsForm.instagramUrl || ''}
												onChange={(e) =>
													setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })
												}
												className="rounded-none"
											/>
										</Field>
										<Field label="Facebook URL">
											<Input
												data-testid="settings-facebook"
												value={settingsForm.facebookUrl || ''}
												onChange={(e) =>
													setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })
												}
												className="rounded-none"
											/>
										</Field>
									</div>
								</div>
								<Button
									data-testid="save-settings-btn"
									type="submit"
									disabled={isMutating}
									aria-busy={isMutating}
									className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									{isMutating ? (
										<span className="inline-flex items-center gap-2">
											<Loader2 size={14} className="animate-spin" />
											Saving...
										</span>
									) : (
										'Save Settings'
									)}
								</Button>
							</form>
						</motion.div>
					</TabsContent>

					{/* Size Guides */}
					<TabsContent value="size-guides">
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="font-heading text-xl text-stone-900">
									Size Guides ({initialSizeGuides.length})
								</h2>
								<Button
									data-testid="add-size-guide-btn"
									onClick={() =>
										setDlg({ open: true, type: 'size-guides', mode: 'add', data: null })
									}
									className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									<Plus size={14} className="mr-2" /> Add Size Guide
								</Button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{initialSizeGuides.map((guide: any) => (
									<div
										key={guide.id}
										className="bg-white border border-stone-200 p-4"
										data-testid={`admin-size-guide-${guide.id}`}
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<h3 className="font-heading text-sm text-stone-900">{guide.name}</h3>
												<p className="text-xs text-stone-400 mt-1">
													{guide.productType || 'General'} &middot; {guide.unit}
												</p>
											</div>
											{guide.isActive ? (
												<span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5">
													ACTIVE
												</span>
											) : null}
										</div>
										<p className="text-xs text-stone-500 mt-3 line-clamp-2">
											{guide.note || 'No notes added'}
										</p>
										<div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
											<Button
												data-testid={`edit-size-guide-${guide.id}`}
												variant="outline"
												size="sm"
												onClick={() =>
													setDlg({ open: true, type: 'size-guides', mode: 'edit', data: guide })
												}
												className="rounded-none text-xs flex-1"
											>
												<Pencil size={12} className="mr-1" /> Edit
											</Button>
											<Button
												data-testid={`delete-size-guide-${guide.id}`}
												variant="outline"
												size="sm"
												onClick={() =>
													openDeleteConfirmation(
														'size-guides',
														guide.id,
														guide.name || 'this size guide',
													)
												}
												className="rounded-none text-xs text-red-600 hover:bg-red-50"
											>
												<Trash2 size={12} />
											</Button>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</TabsContent>
				</Tabs>
			</div>

			<ItemDialog
				dlg={dlg}
				setDlg={setDlg}
				products={initialProducts}
				collections={initialCollections}
				categories={initialCategories}
				sizeGuides={initialSizeGuides}
			/>

			<ConfirmDialog
				open={pendingDelete.open}
				onOpenChange={(open) => setPendingDelete((prev) => ({ ...prev, open }))}
				title="Delete item"
				description={`This will permanently delete ${pendingDelete.label}. This action cannot be undone.`}
				confirmText="Delete"
				variant="danger"
				onConfirm={handleDelete}
				confirming={isMutating}
			/>
		</div>
	)
}

function ItemDialog({ dlg, setDlg, products, collections, categories, sizeGuides }: any) {
	const { open, type, mode, data } = dlg
	const [form, setForm] = useState<any>(data || {})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [discountProductSearch, setDiscountProductSearch] = useState('')
	const [isSaving, startSavingTransition] = useTransition()

	useEffect(() => {
		if (!open) return
		if (type === 'discounts') {
			setForm(normalizeDiscountFormData(data))
		} else {
			setForm(data || {})
		}
		setDiscountProductSearch('')
		setErrors({})
	}, [open, data, type])

	const validate = () => {
		const nextErrors: Record<string, string> = {}

		if (type === 'products') {
			if (!form.name?.trim()) nextErrors.name = 'Product name is required.'
			if (!form.category?.trim()) nextErrors.category = 'Please select a category.'
			if (!form.price || Number(form.price) <= 0) {
				nextErrors.price = 'Price must be greater than 0.'
			}
		}

		if (type === 'collections') {
			if (!form.name?.trim()) nextErrors.name = 'Collection name is required.'
			if (!form.slug?.trim()) nextErrors.slug = 'Collection slug is required.'
		}

		if (type === 'hero') {
			if (!form.title?.trim()) nextErrors.title = 'Hero title is required.'
		}

		if (type === 'categories') {
			if (!form.name?.trim()) nextErrors.name = 'Category name is required.'
			if (!form.slug?.trim()) nextErrors.slug = 'Category slug is required.'
		}

		if (type === 'size-guides') {
			if (!form.name?.trim()) nextErrors.name = 'Size guide name is required.'

			try {
				const cols = JSON.parse(form.columnsJson || '[]')
				if (!Array.isArray(cols)) {
					nextErrors.columnsJson = 'Columns JSON must be an array of labels.'
				}
			} catch {
				nextErrors.columnsJson = 'Columns JSON must be valid JSON.'
			}

			try {
				const rows = JSON.parse(form.rowsJson || '[]')
				if (!Array.isArray(rows)) {
					nextErrors.rowsJson = 'Rows JSON must be an array.'
				}
			} catch {
				nextErrors.rowsJson = 'Rows JSON must be valid JSON.'
			}
		}

		if (type === 'discounts') {
			if (!form.name?.trim()) nextErrors.name = 'Discount name is required.'
			if (!form.discountType) nextErrors.discountType = 'Discount type is required.'
			if (!form.discountValue || Number(form.discountValue) <= 0) {
				nextErrors.discountValue = 'Discount value must be greater than 0.'
			}
			if (form.originalPrice && Number(form.originalPrice) <= 0) {
				nextErrors.originalPrice = 'Original price must be greater than 0.'
			}
			if (!form.startDate) {
				nextErrors.startDate = 'Start date is required.'
			}
			if (form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
				nextErrors.endDate = 'End date must be after start date.'
			}

			if (form.maxUses !== '' && Number(form.maxUses) <= 0) {
				nextErrors.maxUses = 'Max uses must be greater than 0.'
			}

			if (form.discountType === 'bundle') {
				const bundleIds = parseStringArrayFromMixed(form.bundleProductIds)
				if (bundleIds.length < 2) {
					nextErrors.bundleProductIds = 'Bundle discounts require at least 2 products.'
				}
			}

			if (form.discountType === 'tiered') {
				try {
					const parsed = JSON.parse(form.tierRulesJson || '[]')
					if (!Array.isArray(parsed) || parsed.length === 0) {
						nextErrors.tierRulesJson = 'Tier rules must be a JSON array.'
					} else {
						for (const rule of parsed) {
							if (
								!rule ||
								typeof rule !== 'object' ||
								Number((rule as { minCartValue?: unknown }).minCartValue) <= 0 ||
								Number((rule as { discountValue?: unknown }).discountValue) <= 0
							) {
								nextErrors.tierRulesJson =
									'Each tier needs positive minCartValue and discountValue.'
								break
							}
						}
					}
				} catch {
					nextErrors.tierRulesJson = 'Tier rules must be valid JSON.'
				}
			}
		}

		setErrors(nextErrors)
		return Object.keys(nextErrors).length === 0
	}

	const handleSave = async () => {
		if (!validate()) {
			toast.error('Please fix the highlighted fields')
			return
		}

		// Generate UUIDs for adds or keep existing
		const payload = {
			...form,
			id: mode === 'add' ? crypto.randomUUID() : form.id,
			createdAt: mode === 'add' ? new Date().toISOString() : form.createdAt,
			updatedAt: new Date().toISOString(),
		}

		startSavingTransition(() => {
			void (async () => {
				const res = await saveItem(type, mode, payload)

				if (res.error) {
					toast.error(res.error || 'Save failed')
					return
				}

				toast.success(mode === 'add' ? 'Created' : 'Updated')
				setDlg({ ...dlg, open: false })
			})()
		})
	}

	const fields = () => {
		if (type === 'products') {
			return (
				<div className="space-y-6">
					<FormSection
						title="Product Basics"
						description="Core merchandising details shown to customers."
					>
						<Field label="Name">
							<Input
								data-testid="dlg-name"
								value={form.name || ''}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								aria-invalid={Boolean(errors.name)}
								className="rounded-none"
							/>
							{errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
						</Field>
						<Field label="Description">
							<Textarea
								data-testid="dlg-desc"
								value={form.description || ''}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="rounded-none"
								rows={3}
							/>
						</Field>
						<div className="grid grid-cols-2 gap-4">
							<Field label="Price">
								<Input
									data-testid="dlg-price"
									type="number"
									value={form.price || ''}
									onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
									aria-invalid={Boolean(errors.price)}
									className="rounded-none"
								/>
								{errors.price ? <p className="text-xs text-red-600">{errors.price}</p> : null}
							</Field>
							<Field label="Category">
								<select
									data-testid="dlg-category"
									value={form.category || ''}
									onChange={(e) => setForm({ ...form, category: e.target.value })}
									aria-invalid={Boolean(errors.category)}
									className="w-full h-10 border border-stone-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-stone-500"
								>
									<option value="">Select category</option>
									{categories.map((cat: any) => (
										<option key={cat.id} value={cat.name}>
											{cat.name}
										</option>
									))}
								</select>
								{errors.category ? <p className="text-xs text-red-600">{errors.category}</p> : null}
							</Field>
						</div>
					</FormSection>

					<FormSection
						title="Catalog Linking"
						description="Control where this product appears across the storefront."
					>
						<Field label="Collection">
							<select
								data-testid="dlg-collection"
								value={form.collectionId || ''}
								onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
								className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
							>
								<option value="">No collection</option>
								{collections.map((col: any) => (
									<option key={col.id} value={col.id}>
										{col.name}
									</option>
								))}
							</select>
						</Field>
						<Field label="Size Guide Template">
							<select
								data-testid="dlg-size-guide"
								value={form.sizeGuideId || ''}
								onChange={(e) => setForm({ ...form, sizeGuideId: e.target.value })}
								className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
							>
								<option value="">No size guide</option>
								{sizeGuides
									.filter((guide: any) => guide.isActive)
									.map((guide: any) => (
										<option key={guide.id} value={guide.id}>
											{guide.name}
										</option>
									))}
							</select>
						</Field>
					</FormSection>

					<FormSection
						title="Media"
						description="Upload primary and gallery images for richer presentation."
					>
						<ImageUpload
							value={form.imageUrl}
							onChange={(url) => setForm({ ...form, imageUrl: url })}
						/>
						<MultiImageUpload
							values={form.additionalImages || []}
							onChange={(urls) => setForm({ ...form, additionalImages: urls })}
						/>
					</FormSection>

					<FormSection title="Highlight Flags">
						<div className="flex gap-6">
							<div className="flex items-center gap-2">
								<Switch
									data-testid="dlg-new"
									checked={form.isNew || false}
									onCheckedChange={(v) => setForm({ ...form, isNew: v })}
								/>
								<Label className="text-xs">New Arrival</Label>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									data-testid="dlg-featured"
									checked={form.isFeatured || false}
									onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
								/>
								<Label className="text-xs">Featured</Label>
							</div>
						</div>
					</FormSection>
				</div>
			)
		}
		if (type === 'collections') {
			return (
				<div className="space-y-6">
					<FormSection title="Collection Basics">
						<Field label="Name">
							<Input
								data-testid="dlg-name"
								value={form.name || ''}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								aria-invalid={Boolean(errors.name)}
								className="rounded-none"
							/>
							{errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
						</Field>
						<Field label="Description">
							<Textarea
								data-testid="dlg-desc"
								value={form.description || ''}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="rounded-none"
								rows={3}
							/>
						</Field>
					</FormSection>

					<FormSection title="SEO & Media">
						<ImageUpload
							value={form.imageUrl}
							onChange={(url) => setForm({ ...form, imageUrl: url })}
						/>
						<Field label="Slug">
							<Input
								data-testid="dlg-slug"
								value={form.slug || ''}
								onChange={(e) => setForm({ ...form, slug: e.target.value })}
								aria-invalid={Boolean(errors.slug)}
								className="rounded-none"
							/>
							{errors.slug ? <p className="text-xs text-red-600">{errors.slug}</p> : null}
						</Field>
					</FormSection>
				</div>
			)
		}
		if (type === 'hero') {
			return (
				<div className="space-y-6">
					<FormSection title="Banner Content">
						<Field label="Title">
							<Input
								data-testid="dlg-title"
								value={form.title || ''}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
								aria-invalid={Boolean(errors.title)}
								className="rounded-none"
							/>
							{errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : null}
						</Field>
						<Field label="Subtitle">
							<Textarea
								data-testid="dlg-subtitle"
								value={form.subtitle || ''}
								onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
								className="rounded-none"
								rows={2}
							/>
						</Field>
					</FormSection>

					<FormSection title="Banner Media & CTA">
						<ImageUpload
							value={form.imageUrl}
							onChange={(url) => setForm({ ...form, imageUrl: url })}
						/>
						<div className="grid grid-cols-2 gap-4">
							<Field label="CTA Text">
								<Input
									data-testid="dlg-cta-text"
									value={form.ctaText || ''}
									onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
									className="rounded-none"
								/>
							</Field>
							<Field label="CTA Link">
								<Input
									data-testid="dlg-cta-link"
									value={form.ctaLink || ''}
									onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
									className="rounded-none"
								/>
							</Field>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								data-testid="dlg-active"
								checked={form.isActive || false}
								onCheckedChange={(v) => setForm({ ...form, isActive: v })}
							/>
							<Label className="text-xs">Active</Label>
						</div>
					</FormSection>
				</div>
			)
		}
		if (type === 'categories') {
			return (
				<div className="space-y-6">
					<FormSection title="Category Basics">
						<Field label="Name">
							<Input
								data-testid="dlg-cat-name"
								value={form.name || ''}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								aria-invalid={Boolean(errors.name)}
								className="rounded-none"
							/>
							{errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
						</Field>
						<Field label="Slug">
							<Input
								data-testid="dlg-cat-slug"
								value={form.slug || ''}
								onChange={(e) => setForm({ ...form, slug: e.target.value })}
								aria-invalid={Boolean(errors.slug)}
								className="rounded-none"
								placeholder="e.g. sarees"
							/>
							{errors.slug ? <p className="text-xs text-red-600">{errors.slug}</p> : null}
						</Field>
						<Field label="Description">
							<Textarea
								data-testid="dlg-cat-desc"
								value={form.description || ''}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="rounded-none"
								rows={2}
							/>
						</Field>
					</FormSection>
				</div>
			)
		}
		if (type === 'size-guides') {
			return (
				<div className="space-y-6">
					<FormSection title="Template Basics">
						<Field label="Template Name">
							<Input
								data-testid="dlg-size-guide-name"
								value={form.name || ''}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								aria-invalid={Boolean(errors.name)}
								className="rounded-none"
							/>
							{errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
						</Field>

						<div className="grid grid-cols-2 gap-4">
							<Field label="Product Type">
								<Input
									data-testid="dlg-size-guide-product-type"
									value={form.productType || ''}
									onChange={(e) => setForm({ ...form, productType: e.target.value })}
									className="rounded-none"
									placeholder="e.g. Kurta, Sherwani"
								/>
							</Field>
							<Field label="Unit">
								<select
									data-testid="dlg-size-guide-unit"
									value={form.unit || 'in'}
									onChange={(e) => setForm({ ...form, unit: e.target.value })}
									className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
								>
									<option value="in">in</option>
									<option value="cm">cm</option>
								</select>
							</Field>
						</div>

						<Field label="Measurement Note">
							<Textarea
								data-testid="dlg-size-guide-note"
								value={form.note || ''}
								onChange={(e) => setForm({ ...form, note: e.target.value })}
								className="rounded-none"
								rows={2}
							/>
						</Field>
					</FormSection>

					<FormSection
						title="Measurements JSON"
						description="Use valid JSON for table headers and rows."
					>
						<Field label="Columns JSON (array of labels)">
							<Textarea
								data-testid="dlg-size-guide-columns"
								value={form.columnsJson || '["Bust","Waist","Hip","Length"]'}
								onChange={(e) => setForm({ ...form, columnsJson: e.target.value })}
								aria-invalid={Boolean(errors.columnsJson)}
								className="rounded-none font-mono text-xs"
								rows={3}
							/>
							{errors.columnsJson ? (
								<p className="text-xs text-red-600">{errors.columnsJson}</p>
							) : null}
						</Field>

						<Field label="Rows JSON (array of { size, values[] })">
							<Textarea
								data-testid="dlg-size-guide-rows"
								value={
									form.rowsJson ||
									'[{"size":"XS","values":["32","26","35","38"]},{"size":"S","values":["34","28","37","39"]}]'
								}
								onChange={(e) => setForm({ ...form, rowsJson: e.target.value })}
								aria-invalid={Boolean(errors.rowsJson)}
								className="rounded-none font-mono text-xs"
								rows={5}
							/>
							{errors.rowsJson ? <p className="text-xs text-red-600">{errors.rowsJson}</p> : null}
						</Field>

						<div className="flex items-center gap-2">
							<Switch
								data-testid="dlg-size-guide-active"
								checked={form.isActive ?? true}
								onCheckedChange={(v) => setForm({ ...form, isActive: v })}
							/>
							<Label className="text-xs">Active</Label>
						</div>
					</FormSection>
				</div>
			)
		}
		if (type === 'discounts') {
			const selectedApplicableProducts = parseStringArrayFromMixed(form.applicableProductIds)
			const selectedCategories = parseStringArrayFromMixed(form.applicableCategories)
			const selectedBundleProducts = parseStringArrayFromMixed(form.bundleProductIds)
			const normalizedProductSearch = discountProductSearch.trim().toLowerCase()
			const filteredProducts = products.filter((product: any) => {
				if (!normalizedProductSearch) return true
				const name = String(product.name || '').toLowerCase()
				const category = String(product.category || '').toLowerCase()
				return name.includes(normalizedProductSearch) || category.includes(normalizedProductSearch)
			})
			const currentStrategy =
				DISCOUNT_STRATEGIES.find((strategy) => strategy.id === form.discountType) ||
				DISCOUNT_STRATEGIES[0]

			const toggleApplicableProduct = (productId: string) => {
				const next = selectedApplicableProducts.includes(productId)
					? selectedApplicableProducts.filter((id: string) => id !== productId)
					: [...selectedApplicableProducts, productId]
				setForm({ ...form, applicableProductIds: next })
			}

			const toggleCategory = (categoryName: string) => {
				const next = selectedCategories.includes(categoryName)
					? selectedCategories.filter((name) => name !== categoryName)
					: [...selectedCategories, categoryName]
				setForm({ ...form, applicableCategories: next })
			}

			const toggleBundleProduct = (productId: string) => {
				const next = selectedBundleProducts.includes(productId)
					? selectedBundleProducts.filter((id: string) => id !== productId)
					: [...selectedBundleProducts, productId]
				setForm({ ...form, bundleProductIds: next })
			}

			const applyStrategy = (strategyId: 'flat' | 'percentage' | 'tiered' | 'bundle') => {
				const strategy = DISCOUNT_STRATEGIES.find((item) => item.id === strategyId)
				if (!strategy) return

				setForm({
					...form,
					discountType: strategy.id,
					wording: form.wording || strategy.defaultWording,
					tierRulesJson:
						strategy.id === 'tiered' ? form.tierRulesJson || TIER_TEMPLATE : form.tierRulesJson,
				})
			}

			return (
				<div className="space-y-6">
					<DiscountLivePreview form={form} />
					<div className="rounded-none border border-[#B8860B]/30 bg-[#B8860B]/5 p-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-[#7A1E2C] mb-3">
							Select Discount Strategy
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							{DISCOUNT_STRATEGIES.map((strategy) => {
								const active = form.discountType === strategy.id
								return (
									<button
										key={strategy.id}
										type="button"
										onClick={() => applyStrategy(strategy.id)}
										className={`text-left border px-3 py-2 transition-colors ${
											active
												? 'border-[#B8860B] bg-white'
												: 'border-stone-200 bg-white/70 hover:border-stone-400'
										}`}
									>
										<p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-900">
											{strategy.label}
										</p>
										<p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
											{strategy.description}
										</p>
									</button>
								)
							})}
						</div>
						<p className="text-[11px] text-stone-500 mt-3">{currentStrategy.description}</p>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
							Campaign Basics
						</p>
						<Field label="Discount Name">
							<Input
								data-testid="dlg-discount-name"
								value={form.name || ''}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								aria-invalid={Boolean(errors.name)}
								className="rounded-none"
							/>
							{errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
						</Field>

						<Field label="Description">
							<Textarea
								data-testid="dlg-discount-description"
								value={form.description || ''}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="rounded-none"
								rows={2}
							/>
						</Field>

						<Field label="Display Wording">
							<Input
								value={form.wording || currentStrategy.defaultWording}
								onChange={(e) => setForm({ ...form, wording: e.target.value })}
								className="rounded-none"
								placeholder={currentStrategy.defaultWording}
							/>
						</Field>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
							Pricing & Rules
						</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Field label="Type">
								<select
									data-testid="dlg-discount-type"
									value={form.discountType || 'flat'}
									onChange={(e) => setForm({ ...form, discountType: e.target.value })}
									className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
								>
									<option value="flat">flat</option>
									<option value="percentage">percentage</option>
									<option value="tiered">tiered</option>
									<option value="bundle">bundle</option>
								</select>
								{errors.discountType ? (
									<p className="text-xs text-red-600">{errors.discountType}</p>
								) : null}
							</Field>

							<Field label="Value">
								<Input
									data-testid="dlg-discount-value"
									type="number"
									value={form.discountValue ?? ''}
									onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) || 0 })}
									className="rounded-none"
								/>
								{errors.discountValue ? (
									<p className="text-xs text-red-600">{errors.discountValue}</p>
								) : null}
							</Field>

							<Field label="Original Price (Optional)">
								<Input
									type="number"
									value={form.originalPrice ?? ''}
									onChange={(e) =>
										setForm({
											...form,
											originalPrice: e.target.value ? Number(e.target.value) : '',
										})
									}
									className="rounded-none"
								/>
								{errors.originalPrice ? (
									<p className="text-xs text-red-600">{errors.originalPrice}</p>
								) : null}
							</Field>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<Field label="Priority">
								<Input
									type="number"
									value={form.priority ?? 10}
									onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })}
									className="rounded-none"
								/>
							</Field>
							<Field label="Min Cart Value">
								<Input
									type="number"
									value={form.minCartValue ?? 0}
									onChange={(e) => setForm({ ...form, minCartValue: Number(e.target.value) || 0 })}
									className="rounded-none"
								/>
							</Field>
							<Field label="Max Uses">
								<Input
									type="number"
									value={form.maxUses ?? ''}
									onChange={(e) =>
										setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : '' })
									}
									className="rounded-none"
								/>
								{errors.maxUses ? <p className="text-xs text-red-600">{errors.maxUses}</p> : null}
							</Field>
							<div className="flex items-end gap-6 pb-1">
								<div className="flex items-center gap-2">
									<Switch
										checked={form.isActive ?? true}
										onCheckedChange={(v) => setForm({ ...form, isActive: v })}
									/>
									<Label className="text-xs">Active</Label>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										checked={form.stackable || false}
										onCheckedChange={(v) => setForm({ ...form, stackable: v })}
									/>
									<Label className="text-xs">Stackable</Label>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
							Campaign Window
						</p>
						<div className="grid grid-cols-2 gap-4">
							<Field label="Start Date">
								<Input
									data-testid="dlg-discount-start"
									type="datetime-local"
									value={form.startDate || ''}
									onChange={(e) => setForm({ ...form, startDate: e.target.value })}
									className="rounded-none"
								/>
								{errors.startDate ? (
									<p className="text-xs text-red-600">{errors.startDate}</p>
								) : null}
							</Field>

							<Field label="End Date (Optional)">
								<Input
									data-testid="dlg-discount-end"
									type="datetime-local"
									value={form.endDate || ''}
									onChange={(e) => setForm({ ...form, endDate: e.target.value })}
									className="rounded-none"
								/>
								{errors.endDate ? <p className="text-xs text-red-600">{errors.endDate}</p> : null}
							</Field>
						</div>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">Targeting</p>
							<Field label="Applicable Products">
								<div className="space-y-3">
									<Input
										data-testid="dlg-discount-product-search"
										value={discountProductSearch}
										onChange={(e) => setDiscountProductSearch(e.target.value)}
										placeholder="Search products by name or category"
										className="rounded-none"
									/>
									<div className="flex items-center justify-between gap-3 text-[11px] text-stone-500">
										<p>
											{selectedApplicableProducts.length > 0
												? `${selectedApplicableProducts.length} selected`
												: 'Leave empty to target all matching products'}
										</p>
										<p>{filteredProducts.length} shown</p>
									</div>
									{selectedApplicableProducts.length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{selectedApplicableProducts.map((productId: string) => {
												const selectedProduct = products.find((product: any) => product.id === productId)
												if (!selectedProduct) return null

												return (
													<button
														key={productId}
														type="button"
														onClick={() => toggleApplicableProduct(productId)}
														className="px-3 py-1 text-[11px] uppercase tracking-[0.14em] border bg-stone-900 text-white border-stone-900"
													>
														{selectedProduct.name}
													</button>
												)
											})}
										</div>
									) : null}
									<div className="max-h-56 overflow-y-auto border border-stone-200 p-2">
										<div className="grid grid-cols-1 gap-1">
											{filteredProducts.length > 0 ? (
												filteredProducts.map((product: any) => {
													const selected = selectedApplicableProducts.includes(product.id)
													return (
														<button
															key={product.id}
															data-testid={`dlg-discount-applicable-product-${product.id}`}
															type="button"
															onClick={() => toggleApplicableProduct(product.id)}
															className={`w-full border px-3 py-2 text-left transition-colors ${
																selected
																	? 'bg-stone-900 text-white border-stone-900'
																	: 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
															}`}
														>
															<div className="flex items-start justify-between gap-3">
																<div>
																	<p className="text-xs font-medium uppercase tracking-[0.12em]">
																		{product.name}
																	</p>
																	<p
																		className={`mt-1 text-[11px] ${
																			selected ? 'text-stone-200' : 'text-stone-500'
																		}`}
																	>
																		{product.category || 'Uncategorized'}
																	</p>
																</div>
																<p className={`text-xs ${selected ? 'text-stone-200' : 'text-stone-500'}`}>
																	{formatCad(Math.round(Number(product.price) || 0))}
																</p>
															</div>
														</button>
													)
												})
											) : (
												<p className="px-3 py-6 text-center text-xs text-stone-500">
													No products match this search.
												</p>
											)}
										</div>
									</div>
								</div>
							</Field>

						<Field label="Applicable Categories">
							<div className="flex flex-wrap gap-2">
								{categories.map((category: any) => {
									const selected = selectedCategories.includes(category.name)
									return (
										<button
											key={category.id}
											type="button"
											onClick={() => toggleCategory(category.name)}
											className={`px-3 py-1 text-[11px] uppercase tracking-[0.14em] border transition-colors ${
												selected
													? 'bg-stone-900 text-white border-stone-900'
													: 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
											}`}
										>
											{category.name}
										</button>
									)
								})}
							</div>
						</Field>

						{form.discountType === 'bundle' ? (
							<Field label="Bundle Products (Select 2+)">
								<div className="max-h-44 overflow-y-auto border border-stone-200 p-2">
									<div className="grid grid-cols-1 gap-1">
										{products.map((product: any) => {
											const selected = selectedBundleProducts.includes(product.id)
											return (
												<button
													key={product.id}
													type="button"
													onClick={() => toggleBundleProduct(product.id)}
													className={`w-full text-left px-3 py-2 text-xs transition-colors ${
														selected
															? 'bg-stone-900 text-white'
															: 'hover:bg-stone-100 text-stone-700'
													}`}
												>
													{product.name}
												</button>
											)
										})}
									</div>
								</div>
								{errors.bundleProductIds ? (
									<p className="text-xs text-red-600">{errors.bundleProductIds}</p>
								) : null}
							</Field>
						) : null}
					</div>

					{form.discountType === 'tiered' ? (
						<div className="rounded-none border border-stone-200 p-4 space-y-3">
							<div className="flex items-center justify-between gap-2">
								<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">Tier Rules</p>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setForm({ ...form, tierRulesJson: TIER_TEMPLATE })}
										className="rounded-none text-[10px] uppercase tracking-[0.14em]"
									>
										Use Recommended Tiers
									</Button>
								</div>
							</div>
							<Textarea
								value={form.tierRulesJson || TIER_TEMPLATE}
								onChange={(e) => setForm({ ...form, tierRulesJson: e.target.value })}
								className="rounded-none font-mono text-xs"
								rows={6}
							/>
							<p className="text-[11px] text-stone-500">
								Format: [{'{'} minCartValue, discountValue, discountType {'}'}]
							</p>
							{errors.tierRulesJson ? (
								<p className="text-xs text-red-600">{errors.tierRulesJson}</p>
							) : null}
						</div>
					) : null}
				</div>
			)
		}
		return null
	}

	const typeLabel =
		type === 'hero'
			? 'Hero Banner'
			: type === 'products'
				? 'Product'
				: type === 'categories'
					? 'Category'
					: type === 'discounts'
						? 'Discount'
						: type === 'size-guides'
							? 'Size Guide'
							: 'Collection'

	return (
		<Dialog open={open} onOpenChange={(v) => setDlg({ ...dlg, open: v })}>
			<DialogContent
				className={`rounded-none max-h-[90vh] overflow-y-auto bg-white ${
					type === 'discounts' ? 'sm:max-w-4xl' : 'sm:max-w-lg'
				}`}
			>
				<DialogHeader>
					<DialogTitle className="font-heading">
						{mode === 'add' ? 'Add' : 'Edit'} {typeLabel}
					</DialogTitle>
					<DialogDescription className="text-xs text-stone-400">
						{mode === 'add' ? 'Create a new' : 'Update'} {typeLabel.toLowerCase()}
					</DialogDescription>
				</DialogHeader>
				{fields()}
				<div className="flex justify-end gap-2 mt-4">
					<Button
						data-testid="dlg-cancel"
						variant="outline"
						onClick={() => setDlg({ ...dlg, open: false })}
						disabled={isSaving}
						className="rounded-none text-xs"
					>
						Cancel
					</Button>
					<Button
						data-testid="dlg-save"
						onClick={handleSave}
						disabled={isSaving}
						aria-busy={isSaving}
						className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
					>
						{isSaving ? (
							<span className="inline-flex items-center gap-2">
								<Loader2 size={14} className="animate-spin" />
								Saving...
							</span>
						) : mode === 'add' ? (
							'Create'
						) : (
							'Save Changes'
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
