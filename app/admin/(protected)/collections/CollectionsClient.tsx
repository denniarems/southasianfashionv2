'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteItem } from '@/app/actions/admin/dashboard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingImage } from '@/components/ui/loading-image'
import { ItemDialog } from '../components/ItemDialog'
import { formatCad } from '@/lib/currency'


export default function CollectionsClient({ items, initialProducts, initialCollections, initialCategories, initialSizeGuides }: any) {
	const [dlg, setDlg] = useState({ open: false, type: 'collections', mode: 'add', data: null as any })
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
									Collections ({activeItems.length})
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
								{activeItems.map((c: any) => (
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
