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


export default function HeroesClient({ items, initialProducts, initialCollections, initialCategories, initialSizeGuides }: any) {
	const [dlg, setDlg] = useState({ open: false, type: 'hero', mode: 'add', data: null as any })
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
									Hero Banners ({activeItems.length})
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
								{activeItems.map((h: any) => (
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
