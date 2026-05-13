'use client'

import { useState, useTransition } from 'react'
import { m } from 'framer-motion'
import { ArrowDown, ArrowUp, ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingImage } from '@/components/ui/loading-image'
import { ItemDialog } from '../components/ItemDialog'
import { useDeleteItemMutation, useSaveItemMutation } from '../components/admin-mutations'

export default function OccasionsClient({
	items,
	initialProducts,
	initialCollections,
	initialCategories,
	initialOccasions,
	initialSizeGuides,
}: any) {
	const [dlg, setDlg] = useState({
		open: false,
		type: 'occasions',
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
	const saveItem = useSaveItemMutation()

	const activeItems = items.toSorted((a: any, b: any) => {
		const orderDelta = Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0)
		if (orderDelta !== 0) return orderDelta
		return String(a.name || '').localeCompare(String(b.name || ''))
	})

	const openAddDialog = () => {
		setDlg({
			open: true,
			type: 'occasions',
			mode: 'add',
			data: { displayOrder: activeItems.length + 1 },
		})
	}

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

	const moveOccasion = (index: number, direction: -1 | 1) => {
		const occasion = activeItems[index]
		const target = activeItems[index + direction]
		if (!occasion || !target) return

		const occasionOrder = Number.isFinite(Number(occasion.displayOrder))
			? Number(occasion.displayOrder)
			: index + 1
		const targetOrder = Number.isFinite(Number(target.displayOrder))
			? Number(target.displayOrder)
			: index + direction + 1

		startMutatingTransition(() => {
			void (async () => {
				const first = await saveItem('occasions', 'edit', {
					...occasion,
					displayOrder: targetOrder === occasionOrder ? index + direction + 1 : targetOrder,
				})
				if (first.error) {
					toast.error(first.error || 'Sort failed')
					return
				}

				const second = await saveItem('occasions', 'edit', {
					...target,
					displayOrder: targetOrder === occasionOrder ? index + 1 : occasionOrder,
				})
				if (second.error) {
					toast.error(second.error || 'Sort failed')
					return
				}

				toast.success('Occasion order updated')
			})()
		})
	}

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto">
			<m.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
			>
				<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="font-heading text-xl text-stone-900">
							Occasions ({activeItems.length})
						</h2>
						<p className="mt-1 text-xs uppercase tracking-widest text-stone-400">
							Homepage grid and product filters
						</p>
					</div>
					<Button
						data-testid="add-occasion-btn"
						onClick={openAddDialog}
						className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
					>
						<Plus size={14} className="mr-2" /> Add Occasion
					</Button>
				</div>

				<div className="overflow-hidden border border-stone-200 bg-white">
					<div className="hidden grid-cols-[64px_96px_1.4fr_1.6fr_0.5fr_170px] items-center gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-stone-500 lg:grid">
						<span>Sort</span>
						<span>Image</span>
						<span>Occasion</span>
						<span>Description</span>
						<span>Order</span>
						<span className="text-right">Actions</span>
					</div>
					<div className="divide-y divide-stone-100">
						{activeItems.map((occasion: any, index: number) => (
							<div
								key={occasion.id}
								className="grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-stone-50 lg:grid-cols-[64px_96px_1.4fr_1.6fr_0.5fr_170px] lg:items-center"
								data-testid={`admin-occasion-${occasion.id}`}
							>
								<div className="flex gap-1">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={isMutating || index === 0}
										onClick={() => moveOccasion(index, -1)}
										className="h-8 w-8 rounded-none p-0"
										aria-label={`Move ${occasion.name} up`}
									>
										<ArrowUp size={13} />
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={isMutating || index === activeItems.length - 1}
										onClick={() => moveOccasion(index, 1)}
										className="h-8 w-8 rounded-none p-0"
										aria-label={`Move ${occasion.name} down`}
									>
										<ArrowDown size={13} />
									</Button>
								</div>

								{occasion.imageUrl ? (
									<LoadingImage
										src={occasion.imageUrl}
										alt={occasion.name}
										width={96}
										height={112}
										sizes="96px"
										className="h-28 w-24 object-cover"
									/>
								) : (
									<div className="flex h-28 w-24 items-center justify-center bg-stone-100 text-stone-400">
										<ImageOff size={18} />
									</div>
								)}

								<div className="min-w-0">
									<h3 className="font-heading text-base text-stone-900">{occasion.name}</h3>
									<p className="mt-1 text-xs text-stone-400">{occasion.slug}</p>
								</div>

								<p className="text-sm leading-relaxed text-stone-500 line-clamp-2">
									{occasion.description || 'No description'}
								</p>

								<p className="text-sm text-stone-600">{occasion.displayOrder ?? 0}</p>

								<div className="flex gap-2 lg:justify-end">
									<Button
										data-testid={`edit-occasion-${occasion.id}`}
										variant="outline"
										size="sm"
										onClick={() =>
											setDlg({ open: true, type: 'occasions', mode: 'edit', data: occasion })
										}
										className="rounded-none text-xs"
									>
										<Pencil size={12} className="mr-1" /> Edit
									</Button>
									<Button
										data-testid={`delete-occasion-${occasion.id}`}
										variant="outline"
										size="sm"
										onClick={() =>
											openDeleteConfirmation(
												'occasions',
												occasion.id,
												occasion.name || 'this occasion',
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
				title="Delete occasion"
				description={`This will permanently delete ${pendingDelete.label}. Products already tagged with this occasion will keep their text value.`}
				confirmText="Delete"
				variant="danger"
				onConfirm={handleDelete}
				confirming={isMutating}
			/>
		</div>
	)
}
