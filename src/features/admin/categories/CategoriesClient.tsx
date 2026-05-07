'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useDeleteItemMutation } from '../components/admin-mutations'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ItemDialog } from '../components/ItemDialog'

export default function CategoriesClient({
	items,
	initialProducts,
	initialCollections,
	initialCategories,
	initialSizeGuides,
}: any) {
	const [dlg, setDlg] = useState({
		open: false,
		type: 'categories',
		mode: 'add',
		data: null as any,
	})
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
	const deleteItem = useDeleteItemMutation()

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

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex justify-between items-center mb-6">
					<h2 className="font-heading text-xl text-stone-900">Categories ({activeItems.length})</h2>
					<Button
						data-testid="add-category-btn"
						onClick={() => setDlg({ open: true, type: 'categories', mode: 'add', data: null })}
						className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
					>
						<Plus size={14} className="mr-2" /> Add Category
					</Button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{activeItems.map((cat: any) => (
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
