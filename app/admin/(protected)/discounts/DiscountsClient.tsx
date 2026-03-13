'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteItem } from '@/app/actions/admin/dashboard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ItemDialog } from '../components/ItemDialog'
import { formatCad } from '@/lib/currency'


export default function DiscountsClient({ items, initialProducts, initialCollections, initialCategories, initialSizeGuides }: any) {
	const [dlg, setDlg] = useState({ open: false, type: 'discounts', mode: 'add', data: null as any })
	const [pendingDelete, setPendingDelete] = useState<{ open: boolean; type: string; id: string; label: string }>({
		open: false, type: '', id: '', label: ''
	})
	const [isMutating, startMutatingTransition] = useTransition()
    
    

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
									Discounts ({activeItems.length})
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
								{activeItems.map((discount: any) => {
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
