'use client'

import { useState, useTransition, useEffect } from 'react'
import { useAppRouter as useRouter } from '@/components/router-hooks'
import { m } from 'framer-motion'
import { Plus, Pencil, Trash2, Upload, ImageOff, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { fetchProductImagesForAdmin, useDeleteItemMutation } from '../components/admin-mutations'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingImage } from '@/components/ui/loading-image'
import { ItemDialog } from '../components/ItemDialog'
import { formatCad } from '@/lib/currency'

export default function ProductsClient({
	items,
	initialProducts,
	initialCollections,
	initialCategories,
	initialOccasions,
	initialSizeGuides,
}: any) {
	const [dlg, setDlg] = useState({ open: false, type: 'products', mode: 'add', data: null as any })
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
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const deleteItem = useDeleteItemMutation()
	const sizeGuideNameById = Object.fromEntries(
		(initialSizeGuides || []).map((guide: any) => [guide.id, guide.name]),
	)

	const { push } = useRouter()
	const [productImagesMap, setProductImagesMap] = useState<Record<string, string[]>>({})
	useEffect(() => {
		fetchProductImagesForAdmin().then(setProductImagesMap)
	}, [initialProducts])

	const openDeleteConfirmation = (type: string, id: string, label: string) => {
		setPendingDelete({ open: true, type, id, label })
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

	// Using a generic items reference for the render mapping below
	const activeItems = items
	const selectedCount = selectedIds.length

	const toggleSelection = (productId: string) => {
		setSelectedIds((prev) =>
			prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
		)
	}

	const mediaWarningsFor = (product: any) => {
		const galleryCount = productImagesMap[product.id]?.length || 0
		const imageCount = (product.imageUrl ? 1 : 0) + galleryCount
		return {
			missingPrimary: !product.imageUrl,
			lowImageCount: imageCount < 2,
			weakName: String(product.name || '').trim().length < 12,
			imageCount,
		}
	}

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto">
			<m.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
					<div>
						<h2 className="font-heading text-xl text-stone-900">Products ({activeItems.length})</h2>
						<p className="mt-1 text-xs uppercase tracking-widest text-stone-400">
							{selectedCount > 0 ? `${selectedCount} selected` : 'Dense merchandising view'}
						</p>
					</div>
					<div className="flex items-center gap-2">
						{selectedCount > 0 ? (
							<Button
								type="button"
								variant="outline"
								onClick={() => setSelectedIds([])}
								className="rounded-none text-xs uppercase tracking-widest"
							>
								Clear Selection
							</Button>
						) : null}
						<Button
							type="button"
							data-testid="batch-import-btn"
							variant="outline"
							onClick={() => push('/admin/products/batch')}
							className="rounded-none text-xs uppercase tracking-widest"
						>
							<Upload size={14} className="mr-2" /> Batch Import
						</Button>
						<Button
							type="button"
							data-testid="add-product-btn"
							onClick={() => push('/admin/products/add')}
							className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
						>
							<Plus size={14} className="mr-2" /> Add Product
						</Button>
					</div>
				</div>

				<div className="overflow-hidden border border-stone-200 bg-white">
					<div className="hidden grid-cols-[44px_76px_1.7fr_0.8fr_0.7fr_1fr_130px] items-center gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-stone-500 lg:grid">
						<span />
						<span>Image</span>
						<span>Product</span>
						<span>Price</span>
						<span>Order</span>
						<span>Status</span>
						<span className="text-right">Actions</span>
					</div>
					<div className="divide-y divide-stone-100">
						{activeItems.map((p: any) => {
							const warnings = mediaWarningsFor(p)
							return (
								<div
									key={p.id}
									className="grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-stone-50 lg:grid-cols-[44px_76px_1.7fr_0.8fr_0.7fr_1fr_130px] lg:items-center"
									data-testid={`admin-product-${p.id}`}
								>
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={selectedIds.includes(p.id)}
											onChange={() => toggleSelection(p.id)}
											className="size-4 accent-stone-900"
											aria-label={`Select ${p.name}`}
										/>
									</label>
									{p.imageUrl ? (
										<LoadingImage
											src={p.imageUrl}
											alt={p.name}
											width={64}
											height={80}
											sizes="64px"
											className="h-20 w-16 object-cover shrink-0"
										/>
									) : (
										<div className="flex h-20 w-16 items-center justify-center bg-stone-100 text-stone-400">
											<ImageOff size={18} />
										</div>
									)}
									<div className="min-w-0">
										<h3 className="font-heading text-base text-stone-900 truncate">{p.name}</h3>
										<p className="text-xs text-stone-400 mt-1">
											{p.category || 'Uncategorized'} &middot; {p.occasion || 'No occasion'}
										</p>
										<p className="text-[11px] text-stone-500 mt-1">
											Size Guide:{' '}
											{p.sizeGuideId ? sizeGuideNameById[p.sizeGuideId] || 'Unknown' : 'None'}
										</p>
										<div className="mt-2 flex flex-wrap gap-1">
											{warnings.missingPrimary ? (
												<span className="border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-red-700">
													No primary image
												</span>
											) : null}
											{warnings.lowImageCount ? (
												<span className="border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-yellow-700">
													Low media
												</span>
											) : null}
											{warnings.weakName ? (
												<span className="border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-stone-600">
													Weak name
												</span>
											) : null}
										</div>
									</div>
									<div className="text-sm font-medium text-stone-700">{formatCad(p.price)}</div>
									<div className="text-sm text-stone-600">{p.displayOrder ?? 0}</div>
									<div className="flex flex-wrap gap-1">
										{p.isNew ? (
											<span className="text-[10px] bg-yellow-700/10 text-yellow-700 px-2 py-0.5">
												NEW
											</span>
										) : null}
										{p.isFeatured ? (
											<span className="text-[10px] bg-stone-900/10 text-stone-700 px-2 py-0.5">
												FEATURED
											</span>
										) : null}
										{p.isReadyToShip ? (
											<span className="inline-flex items-center gap-1 text-[10px] bg-emerald-700/10 text-emerald-700 px-2 py-0.5">
												<Layers size={10} />
												RTS
											</span>
										) : null}
									</div>
									<div className="flex gap-2 lg:justify-end">
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
											className="rounded-none text-xs"
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
							)
						})}
					</div>
				</div>
			</m.div>

			<ItemDialog
				dlg={dlg}
				setDlg={setDlg}
				products={initialProducts}
				collections={initialCollections}
				categories={initialCategories}
				occasions={initialOccasions}
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
