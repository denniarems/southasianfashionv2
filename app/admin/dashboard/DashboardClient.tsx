'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
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
import { Plus, Pencil, Trash2, LogOut, ArrowLeft } from 'lucide-react'
import ImageUpload from '@/app/components/ImageUpload'
import { deleteItem, saveItem, saveSettings } from '@/app/actions/dashboard'
import { logout } from '@/app/actions/auth'

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
	const [settingsForm, setSettingsForm] = useState(initialSettings)
	const [dlg, setDlg] = useState({ open: false, type: '', mode: 'add', data: null as any })

	const handleDelete = async (type: string, id: string) => {
		if (!window.confirm('Delete this item?')) return
		const res = await deleteItem(type, id)
		if (res.error) toast.error('Delete failed')
		else toast.success('Deleted')
	}

	const handleSaveSettings = async (e: React.FormEvent) => {
		e.preventDefault()
		const res = await saveSettings(settingsForm)
		if (res.error) toast.error('Failed to save')
		else toast.success('Settings saved')
	}

	const handleLogout = async () => {
		await logout()
		window.location.href = '/admin/login'
	}

	return (
		<div className="min-h-screen bg-stone-50" data-testid="admin-dashboard">
			<div className="bg-white border-b border-stone-200">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<a
							href="/"
							data-testid="admin-back-btn"
							className="text-stone-400 hover:text-stone-600 transition-colors"
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
						className="rounded-none text-xs uppercase tracking-widest"
					>
						<LogOut size={14} className="mr-2" /> Sign Out
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
												className="w-20 h-20 object-cover flex-shrink-0"
											/>
										) : (
											<div className="w-20 h-20 bg-stone-100 flex-shrink-0" />
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
											onClick={() => handleDelete('products', p.id)}
											className="rounded-none text-xs text-red-600 hover:bg-red-50"
										>
											<Trash2 size={12} />
										</Button>
									</div>
								</div>
							))}
						</div>
					</TabsContent>

					{/* Collections */}
					<TabsContent value="collections">
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
											className="w-24 h-24 object-cover flex-shrink-0"
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
												onClick={() => handleDelete('collections', c.id)}
												className="rounded-none text-xs text-red-600 hover:bg-red-50"
											>
												<Trash2 size={12} />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					</TabsContent>

					{/* Hero */}
					<TabsContent value="hero">
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
											className="w-32 h-20 object-cover flex-shrink-0"
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
									<div className="flex gap-2 items-start flex-shrink-0">
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
											onClick={() => handleDelete('hero', h.id)}
											className="rounded-none text-xs text-red-600 hover:bg-red-50"
										>
											<Trash2 size={12} />
										</Button>
									</div>
								</div>
							))}
						</div>
					</TabsContent>

					{/* Categories */}
					<TabsContent value="categories">
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
											onClick={() => handleDelete('categories', cat.id)}
											className="rounded-none text-xs text-red-600 hover:bg-red-50"
										>
											<Trash2 size={12} />
										</Button>
									</div>
								</div>
							))}
						</div>
					</TabsContent>

					{/* Settings */}
					<TabsContent value="settings">
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
								className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
							>
								Save Settings
							</Button>
						</form>
					</TabsContent>
				</Tabs>
			</div>

			<ItemDialog
				dlg={dlg}
				setDlg={setDlg}
				collections={initialCollections}
				categories={initialCategories}
			/>
		</div>
	)
}

function ItemDialog({ dlg, setDlg, collections, categories }: any) {
	const { open, type, mode, data } = dlg
	const [form, setForm] = useState<any>(data || {})

	// Reset form when dialog opens
	if (open && form.id !== data?.id) {
		setForm(data || {})
	}

	const handleSave = async () => {
		// Generate UUIDs for adds or keep existing
		const payload = {
			...form,
			id: mode === 'add' ? crypto.randomUUID() : form.id,
			createdAt: mode === 'add' ? new Date().toISOString() : form.createdAt,
			updatedAt: new Date().toISOString(),
		}

		const res = await saveItem(type, mode, payload)

		if (res.error) {
			toast.error('Save failed')
		} else {
			toast.success(mode === 'add' ? 'Created' : 'Updated')
			setDlg({ ...dlg, open: false })
		}
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
							className="rounded-none"
						/>
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
								className="rounded-none"
							/>
						</Field>
						<Field label="Category">
							<select
								data-testid="dlg-category"
								value={form.category || ''}
								onChange={(e) => setForm({ ...form, category: e.target.value })}
								className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
							>
								<option value="">Select category</option>
								{categories.map((cat: any) => (
									<option key={cat.id} value={cat.name}>
										{cat.name}
									</option>
								))}
							</select>
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
							className="rounded-none"
						/>
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
							className="rounded-none"
						/>
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
							className="rounded-none"
						/>
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
							className="rounded-none"
						/>
					</Field>
					<Field label="Slug">
						<Input
							data-testid="dlg-cat-slug"
							value={form.slug || ''}
							onChange={(e) => setForm({ ...form, slug: e.target.value })}
							className="rounded-none"
							placeholder="e.g. sarees"
						/>
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
						className="rounded-none text-xs"
					>
						Cancel
					</Button>
					<Button
						data-testid="dlg-save"
						onClick={handleSave}
						className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
					>
						{mode === 'add' ? 'Create' : 'Save Changes'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
