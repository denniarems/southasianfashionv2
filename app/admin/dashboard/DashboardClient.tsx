'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
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
import { deleteItem, saveItem, saveSettings } from '@/app/actions/dashboard'
import { logout } from '@/app/actions/auth'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<Label className="text-xs uppercase tracking-widest text-stone-500">{label}</Label>
			{children}
		</div>
	)
}

export default function DashboardClient({
	initialProducts,
	initialCollections,
	initialHeroes,
	initialCategories,
	initialSettings,
}: any) {
	const router = useRouter()
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
						{isMutating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <LogOut size={14} className="mr-2" />} Sign Out
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
							data-testid="tab-settings"
							value="settings"
							className="rounded-none text-xs uppercase tracking-widest"
						>
							Settings
						</TabsTrigger>
					</TabsList>

					{/* Products */}
					<TabsContent value="products">
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
											<Image
												src={p.imageUrl}
												alt={p.name}
												width={80}
												height={80}
												className="w-20 h-20 object-cover shrink-0"
											/>
										) : (
											<div className="w-20 h-20 bg-stone-100 shrink-0" />
										)}
										<div className="flex-1 min-w-0">
											<h3 className="font-heading text-sm text-stone-900 truncate">{p.name}</h3>
											<p className="text-xs text-stone-400 mt-1">
												{p.category} &middot; {p.currency} {p.price}
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
												setDlg({ open: true, type: 'products', mode: 'edit', data: p })
											}
											className="rounded-none text-xs flex-1"
										>
											<Pencil size={12} className="mr-1" /> Edit
										</Button>
										<Button
											data-testid={`delete-product-${p.id}`}
											variant="outline"
											size="sm"
											onClick={() => openDeleteConfirmation('products', p.id, p.name || 'this product')}
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

					{/* Collections */}
					<TabsContent value="collections">
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
						<div className="flex justify-between items-center mb-6">
							<h2 className="font-heading text-xl text-stone-900">
								Collections ({initialCollections.length})
							</h2>
							<Button
								data-testid="add-collection-btn"
								onClick={() => setDlg({ open: true, type: 'collections', mode: 'add', data: null })}
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
										<Image
											src={c.imageUrl}
											alt={c.name}
											width={96}
											height={96}
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
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
										<Image
											src={h.imageUrl}
											alt={h.title}
											width={128}
											height={80}
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
											onClick={() => openDeleteConfirmation('hero', h.id, h.title || 'this banner')}
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
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
						<div className="flex justify-between items-center mb-6">
							<h2 className="font-heading text-xl text-stone-900">
								Categories ({initialCategories.length})
							</h2>
							<Button
								data-testid="add-category-btn"
								onClick={() => setDlg({ open: true, type: 'categories', mode: 'add', data: null })}
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
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
				</Tabs>
			</div>

			<ItemDialog
				dlg={dlg}
				setDlg={setDlg}
				collections={initialCollections}
				categories={initialCategories}
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

function ItemDialog({ dlg, setDlg, collections, categories }: any) {
	const { open, type, mode, data } = dlg
	const [form, setForm] = useState<any>(data || {})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSaving, startSavingTransition] = useTransition()

	useEffect(() => {
		if (!open) return
		setForm(data || {})
		setErrors({})
	}, [open, data])

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
				<div className="space-y-4">
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
					<ImageUpload
						value={form.imageUrl}
						onChange={(url) => setForm({ ...form, imageUrl: url })}
					/>
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
				</div>
			)
		}
		if (type === 'collections') {
			return (
				<div className="space-y-4">
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
				</div>
			)
		}
		if (type === 'hero') {
			return (
				<div className="space-y-4">
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
				</div>
			)
		}
		if (type === 'categories') {
			return (
				<div className="space-y-4">
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
					: 'Collection'

	return (
		<Dialog open={open} onOpenChange={(v) => setDlg({ ...dlg, open: v })}>
			<DialogContent className="rounded-none max-h-[90vh] overflow-y-auto sm:max-w-lg bg-white">
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
