'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ImageUpload from '@/app/components/ImageUpload'
import MultiImageUpload from '@/app/components/MultiImageUpload'
import { saveItem } from '@/app/actions/admin/dashboard'
import { Field, FormSection } from './shared'

interface ProductFormProps {
	mode: 'add' | 'edit'
	initialData?: any
	collections: any[]
	categories: any[]
	sizeGuides: any[]
	onCancel?: () => void
}

export function ProductForm({ mode, initialData, collections, categories, sizeGuides, onCancel }: ProductFormProps) {
	const router = useRouter()
	const [form, setForm] = useState<any>(initialData || {})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSaving, startSavingTransition] = useTransition()

	const validate = () => {
		const nextErrors: Record<string, string> = {}
		if (!form.name?.trim()) nextErrors.name = 'Product name is required.'
		if (!form.category?.trim()) nextErrors.category = 'Please select a category.'
		if (!form.price || Number(form.price) <= 0) {
			nextErrors.price = 'Price must be greater than 0.'
		}
		setErrors(nextErrors)
		return Object.keys(nextErrors).length === 0
	}

	const handleSave = async () => {
		if (!validate()) {
			toast.error('Please fix the highlighted fields')
			return
		}

		const payload = {
			...form,
			id: mode === 'add' ? crypto.randomUUID() : form.id,
			createdAt: mode === 'add' ? new Date().toISOString() : form.createdAt,
			updatedAt: new Date().toISOString(),
		}

		startSavingTransition(() => {
			void (async () => {
				const res = await saveItem('products', mode, payload)
				if (res.error) {
					toast.error(res.error || 'Save failed')
					return
				}
				toast.success(mode === 'add' ? 'Created' : 'Updated')
				router.push('/admin/products')
				router.refresh()
			})()
		})
	}

	return (
		<div className="space-y-6">
			<div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push('/admin/products')}
					className="rounded-none text-stone-500 hover:text-stone-900 hover:bg-stone-100 -ml-3"
				>
					<ArrowLeft size={16} className="mr-1" />
					Back to Products
				</Button>
				<h1 className="font-heading text-xl text-stone-900 mt-2">
					{mode === 'add' ? 'Add New Product' : 'Edit Product'}
				</h1>
			</div>

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

			<div className="flex justify-end gap-2 pt-4">
				{onCancel && (
					<Button
						variant="outline"
						onClick={onCancel}
						disabled={isSaving}
						className="rounded-none text-xs"
					>
						Cancel
					</Button>
				)}
				<Button
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
						'Create Product'
					) : (
						'Save Changes'
					)}
				</Button>
			</div>
		</div>
	)
}
