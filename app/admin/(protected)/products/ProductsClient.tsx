'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteItem, fetchProductImagesForAdmin } from '@/app/actions/dashboard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingImage } from '@/components/ui/loading-image'
import { ItemDialog } from '../components/ItemDialog'
import { formatCad } from '@/lib/currency'


export default function ProductsClient({ items, initialProducts, initialCollections, initialCategories, initialSizeGuides }: any) {
	const [dlg, setDlg] = useState({ open: false, type: 'products', mode: 'add', data: null as any })
	const [pendingDelete, setPendingDelete] = useState<{ open: boolean; type: string; id: string; label: string }>({
		open: false, type: '', id: '', label: ''
	})
	const [isMutating, startMutatingTransition] = useTransition()
	const sizeGuideNameById = Object.fromEntries((initialSizeGuides || []).map((guide: any) => [guide.id, guide.name]))
    
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
    const activeItems = items;
    

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="font-heading text-xl text-stone-900">
									Products ({activeItems.length})
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
								{activeItems.map((p: any) => (
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
