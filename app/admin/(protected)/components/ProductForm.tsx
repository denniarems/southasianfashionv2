'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ImageUpload from '@/app/components/ImageUpload'
import MultiImageUpload from '@/app/components/MultiImageUpload'
import { saveItem } from '@/app/actions/admin/dashboard'
import {
	generateModelPhotoshootImage,
	type PhotoshootShotType,
} from '@/app/actions/admin/models'
import { Field, FormSection } from './shared'

interface ProductFormProps {
	mode: 'add' | 'edit'
	initialData?: any
	collections: any[]
	categories: any[]
	sizeGuides: any[]
	models?: SavedModel[]
	onCancel?: () => void
}

interface SavedModel {
	id: string
	name: string
	description?: string | null
	ageRange?: string | null
	gender?: string | null
	ethnicity?: string | null
	promptUsed?: string | null
}

export function ProductForm({ mode, initialData, collections, categories, sizeGuides, models = [], onCancel }: ProductFormProps) {
	const router = useRouter()
	const [form, setForm] = useState<any>(initialData || {})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSaving, startSavingTransition] = useTransition()
	const [isGeneratingPhotoshoot, setIsGeneratingPhotoshoot] = useState(false)
	const [selectedModelId, setSelectedModelId] = useState('')
	const [backViewImageUrl, setBackViewImageUrl] = useState('')

	const uploadedClothingImages = useMemo(() => {
		const urls = [form.imageUrl, ...(form.additionalImages || [])].filter(
			(url): url is string => typeof url === 'string' && url.trim().length > 0,
		)
		return Array.from(new Set(urls))
	}, [form.additionalImages, form.imageUrl])

	useEffect(() => {
		if (selectedModelId) return
		if (models.length > 0) {
			setSelectedModelId(models[0].id)
		}
	}, [models, selectedModelId])

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

	const handleGeneratePhotoshoot = async () => {
		if (uploadedClothingImages.length === 0) {
			toast.error('Upload at least one clothing image first')
			return
		}

		if (!selectedModelId) {
			toast.error('Please select a saved model')
			return
		}

		const selectedModel = models.find((model) => model.id === selectedModelId)
		if (!selectedModel) {
			toast.error('Selected model not found')
			return
		}

		const baseShots: PhotoshootShotType[] = ['front', 'side', 'walking', 'close-up']

		setIsGeneratingPhotoshoot(true)

		try {
			const generationTasks = uploadedClothingImages.flatMap((clothingImageUrl) => {
				const shotTypes: PhotoshootShotType[] = [...baseShots]
				if (backViewImageUrl && clothingImageUrl === backViewImageUrl) {
					shotTypes.push('back')
				}

				return shotTypes.map((shotType) =>
					generateModelPhotoshootImage({
						model: {
							name: selectedModel.name,
							description: selectedModel.description || '',
							ageRange: selectedModel.ageRange || '',
							gender: selectedModel.gender || '',
							ethnicity: selectedModel.ethnicity || '',
							promptUsed: selectedModel.promptUsed || '',
						},
						clothingImageUrl,
						shotType,
					}),
				)
			})

			const results = await Promise.all(generationTasks)
			const generatedUrls = results
				.filter((result) => result.imageUrl && !result.error)
				.map((result) => result.imageUrl as string)

			const failedCount = results.filter((result) => result.error).length

			if (generatedUrls.length === 0) {
				throw new Error(results.find((result) => result.error)?.error || 'No images were generated')
			}

			setForm((prev: any) => ({
				...prev,
				additionalImages: Array.from(
					new Set([...(prev.additionalImages || []), ...generatedUrls]),
				),
			}))

			if (failedCount > 0) {
				toast.success(`Generated ${generatedUrls.length} images (${failedCount} failed)`)
				return
			}

			toast.success(`Generated ${generatedUrls.length} AI photoshoot images`)
		} catch (e: any) {
			toast.error(e.message || 'Failed to generate photoshoot images')
		} finally {
			setIsGeneratingPhotoshoot(false)
		}
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
				<div className="border border-stone-200 bg-stone-50 p-4 space-y-3">
					<div className="space-y-1">
						<p className="text-xs uppercase tracking-widest text-stone-600">AI Model Photoshoot</p>
						<p className="text-[11px] text-stone-500">
							Generate front, side, walking, and close-up photos automatically. Add a back shot by selecting a back-view clothing image.
						</p>
					</div>

					<Field label="Select Saved Model">
						<select
							value={selectedModelId}
							onChange={(e) => setSelectedModelId(e.target.value)}
							className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
						>
							<option value="">Select model</option>
							{models.map((model) => (
								<option key={model.id} value={model.id}>
									{model.name}
								</option>
							))}
						</select>
					</Field>

					<Field label="Back View Clothing Image (Optional)">
						<select
							value={backViewImageUrl}
							onChange={(e) => setBackViewImageUrl(e.target.value)}
							className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
						>
							<option value="">No back shot</option>
							{uploadedClothingImages.map((url, index) => (
								<option key={url} value={url}>
									{`Uploaded Image ${index + 1}`}
								</option>
							))}
						</select>
					</Field>

					<Button
						type="button"
						onClick={handleGeneratePhotoshoot}
						disabled={
							isGeneratingPhotoshoot ||
							uploadedClothingImages.length === 0 ||
							!selectedModelId ||
							models.length === 0
						}
						className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
					>
						{isGeneratingPhotoshoot ? (
							<>
								<Loader2 size={14} className="mr-2 animate-spin" /> Generating Photoshoot...
							</>
						) : (
							<>
								<Wand2 size={14} className="mr-2" /> Generate AI Photoshoot Variations
							</>
						)}
					</Button>

					{models.length === 0 ? (
						<p className="text-[11px] text-stone-500">
							No saved models found. Create one in the Models page first.
						</p>
					) : null}
				</div>
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
