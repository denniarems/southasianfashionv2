'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useServerFn } from '@tanstack/react-start'
import { useAppRouter as useRouter } from '@/components/router-hooks'
import { ArrowLeft, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { LoadingImage } from '@/components/ui/loading-image'
import ImageUpload from '@/features/admin/components/ImageUpload'
import MultiImageUpload from '@/features/admin/components/MultiImageUpload'
import {
	generateModelPhotoshootImageFn,
	type PhotoshootShotType,
} from '@/server/admin/models.functions'
import { deleteUploadedProductReferenceImagesFn } from '@/server/admin/dashboard.functions'
import { useSaveItemMutation } from './admin-mutations'
import { Field, FormSection } from './shared'
import { AVAILABILITY_OPTIONS, OCCASION_LINKS } from '@/lib/merchandising'

interface ProductFormProps {
	mode: 'add' | 'edit'
	initialData?: any
	collections: any[]
	categories: any[]
	occasions?: any[]
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
	imageUrl?: string | null
	promptUsed?: string | null
}

const EMPTY_OCCASIONS: any[] = []
const EMPTY_MODELS: SavedModel[] = []

async function runWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<R>,
) {
	const results: R[] = []
	let nextIndex = 0

	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (nextIndex < items.length) {
				const currentIndex = nextIndex
				nextIndex += 1
				results[currentIndex] = await worker(items[currentIndex])
			}
		}),
	)

	return results
}

export function ProductForm({
	mode,
	initialData,
	collections,
	categories,
	occasions = EMPTY_OCCASIONS,
	sizeGuides,
	models = EMPTY_MODELS,
	onCancel,
}: ProductFormProps) {
	const { push, refresh } = useRouter()
	const isAddMode = mode === 'add'
	const [form, setForm] = useState<any>(initialData || {})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSaving, startSavingTransition] = useTransition()
	const [isGeneratingPhotoshoot, setIsGeneratingPhotoshoot] = useState(false)
	const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
	const saveItem = useSaveItemMutation()
	const generateModelPhotoshootImage = useServerFn(generateModelPhotoshootImageFn)
	const deleteUploadedProductReferenceImages = useServerFn(deleteUploadedProductReferenceImagesFn)
	const [selectedModelId, setSelectedModelId] = useState('')
	const [customPhotoshootPrompt, setCustomPhotoshootPrompt] = useState('')
	const [backViewImageUrl, setBackViewImageUrl] = useState('')
	const occasionOptions =
		occasions.length > 0
			? occasions.map((occasion: any) => ({
					slug: occasion.slug,
					label: occasion.name,
				}))
			: OCCASION_LINKS

	const savedProductImages = useMemo(() => {
		const urls = [form.imageUrl, ...(form.additionalImages || [])].filter(
			(url): url is string => typeof url === 'string' && url.trim().length > 0,
		)
		return Array.from(new Set(urls))
	}, [form.additionalImages, form.imageUrl])
	const photoshootSourceImages = isAddMode ? referenceImageUrls : savedProductImages

	const getImageNameFromUrl = (url: string, index: number) => {
		try {
			const fileName = decodeURIComponent(new URL(url).pathname.split('/').pop() || '')
			return fileName || `Uploaded Image ${index + 1}`
		} catch {
			const sanitizedUrl = decodeURIComponent(url.split('?')[0] || '')
			const fileName = sanitizedUrl.split('/').pop() || ''
			return fileName || `Uploaded Image ${index + 1}`
		}
	}

	useEffect(() => {
		if (selectedModelId) return
		if (models.length > 0) {
			setSelectedModelId(models[0].id)
		}
	}, [models, selectedModelId])

	const handleReferenceImagesChange = (urls: string[]) => {
		const nextUrls = Array.from(new Set(urls))
		setReferenceImageUrls(nextUrls)
		if (backViewImageUrl && !nextUrls.includes(backViewImageUrl)) {
			setBackViewImageUrl('')
		}
	}

	const validate = () => {
		const nextErrors: Record<string, string> = {}
		if (!form.name?.trim()) nextErrors.name = 'Product name is required.'
		if (!form.category?.trim()) nextErrors.category = 'Please select a category.'
		if (!form.price || Number(form.price) <= 0) {
			nextErrors.price = 'Price must be greater than 0.'
		}
		if (isAddMode && !form.imageUrl?.trim()) {
			nextErrors.imageUrl = 'Generate photoshoot images before creating the product.'
		}
		setErrors(nextErrors)
		return nextErrors
	}

	const handleSave = async () => {
		const nextErrors = validate()
		if (Object.keys(nextErrors).length > 0) {
			toast.error(nextErrors.imageUrl || 'Please fix the highlighted fields')
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
				push('/admin/products')
				refresh()
			})()
		})
	}

	const handleGeneratePhotoshoot = async () => {
		const sourceImageUrls = Array.from(new Set(photoshootSourceImages))

		if (sourceImageUrls.length === 0) {
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
		const normalizedCustomPhotoshootPrompt = customPhotoshootPrompt.trim()

		setIsGeneratingPhotoshoot(true)

		try {
			const generationTasks = sourceImageUrls.flatMap((clothingImageUrl) => {
				const shotTypes: PhotoshootShotType[] = [...baseShots]
				if (backViewImageUrl && clothingImageUrl === backViewImageUrl) {
					shotTypes.push('back')
				}

				return shotTypes.map((shotType) => ({ clothingImageUrl, shotType }))
			})

			const results = await runWithConcurrency(
				generationTasks,
				2,
				({ clothingImageUrl, shotType }) =>
					generateModelPhotoshootImage({
						data: {
							model: {
								name: selectedModel.name,
								description: selectedModel.description || '',
								ageRange: selectedModel.ageRange || '',
								gender: selectedModel.gender || '',
								ethnicity: selectedModel.ethnicity || '',
								imageUrl: selectedModel.imageUrl || '',
								promptUsed: selectedModel.promptUsed || '',
								customPrompt: normalizedCustomPhotoshootPrompt,
							},
							clothingImageUrl,
							shotType,
						},
					}),
			)
			const generatedUrls = results
				.filter(
					(result): result is { imageUrl: string } =>
						'imageUrl' in result && Boolean(result.imageUrl),
				)
				.map((result) => result.imageUrl)
			const uniqueGeneratedUrls = Array.from(new Set(generatedUrls))

			const failedCount = results.filter(
				(result) => 'error' in result && Boolean(result.error),
			).length

			if (uniqueGeneratedUrls.length === 0) {
				const failed = results.find(
					(result): result is { error: string } => 'error' in result && Boolean(result.error),
				)
				throw new Error(failed?.error || 'No images were generated')
			}

			if (isAddMode) {
				const [primaryImageUrl, ...additionalImages] = uniqueGeneratedUrls
				setForm((prev: any) => ({
					...prev,
					imageUrl: primaryImageUrl,
					additionalImages,
				}))
				setReferenceImageUrls([])
				setBackViewImageUrl('')

				try {
					const cleanup = await deleteUploadedProductReferenceImages({
						data: { urls: sourceImageUrls },
					})
					if (cleanup.failed > 0) {
						toast.warning('Generated images saved, but reference cleanup needs review')
					}
				} catch {
					toast.warning('Generated images saved, but reference cleanup failed')
				}
			} else {
				setForm((prev: any) => ({
					...prev,
					additionalImages: Array.from(
						new Set([...(prev.additionalImages || []), ...uniqueGeneratedUrls]),
					),
				}))
			}

			if (failedCount > 0) {
				toast.success(`Generated ${uniqueGeneratedUrls.length} images (${failedCount} failed)`)
				return
			}

			toast.success(`Generated ${uniqueGeneratedUrls.length} AI photoshoot images`)
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
					onClick={() => push('/admin/products')}
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
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
				</div>
			</FormSection>

			<FormSection title="Discovery & Merchandising">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Field label="Occasion">
						<select
							value={form.occasion || ''}
							onChange={(e) => setForm({ ...form, occasion: e.target.value })}
							className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
						>
							<option value="">No occasion</option>
							{occasionOptions.map((occasion: any) => (
								<option key={occasion.slug} value={occasion.label}>
									{occasion.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Fabric">
						<Input
							value={form.fabric || ''}
							onChange={(e) => setForm({ ...form, fabric: e.target.value })}
							className="rounded-none"
							placeholder="Silk, georgette, velvet"
						/>
					</Field>
					<Field label="Color">
						<Input
							value={form.color || ''}
							onChange={(e) => setForm({ ...form, color: e.target.value })}
							className="rounded-none"
							placeholder="Ivory, red, emerald"
						/>
					</Field>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Field label="Availability">
						<select
							value={form.availabilityStatus || 'made-to-order'}
							onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
							className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
						>
							{AVAILABILITY_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Display Order">
						<Input
							type="number"
							value={form.displayOrder ?? 0}
							onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
							className="rounded-none"
						/>
					</Field>
					<div className="flex items-end pb-2">
						<div className="flex items-center gap-2">
							<Switch
								checked={form.isReadyToShip || false}
								onCheckedChange={(v) => setForm({ ...form, isReadyToShip: v })}
							/>
							<Label className="text-xs">Ready to Ship</Label>
						</div>
					</div>
				</div>
			</FormSection>

			<FormSection
				title="Media"
				description={
					isAddMode
						? 'Upload reference images, then generate the product media.'
						: 'Upload primary and gallery images for richer presentation.'
				}
			>
				{isAddMode ? (
					<MultiImageUpload
						label="Reference Clothing Images"
						values={referenceImageUrls}
						onChange={handleReferenceImagesChange}
						emptyText="Upload at least one clothing image to generate product media."
					/>
				) : (
					<ImageUpload
						value={form.imageUrl}
						onChange={(url) => setForm({ ...form, imageUrl: url })}
					/>
				)}
				<div className="border border-stone-200 bg-stone-50 p-4 space-y-3">
					<div className="space-y-1">
						<p className="text-xs uppercase tracking-widest text-stone-600">AI Model Photoshoot</p>
						<p className="text-[11px] text-stone-500">
							Generate front, side, walking, and close-up photos automatically. Add a back shot by
							selecting a back-view clothing image.
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

					<Field label="Custom Prompt (Optional)">
						<Textarea
							value={customPhotoshootPrompt}
							onChange={(e) => setCustomPhotoshootPrompt(e.target.value)}
							placeholder="e.g. Editorial luxury campaign, soft golden-hour mood, emphasize embroidery and drape"
							rows={3}
							className="rounded-none"
						/>
					</Field>

					<Field label="Back View Clothing Image (Optional)">
						<select
							value={backViewImageUrl}
							onChange={(e) => setBackViewImageUrl(e.target.value)}
							className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
						>
							<option value="">No back shot</option>
							{photoshootSourceImages.map((url, index) => (
								<option key={url} value={url}>
									{getImageNameFromUrl(url, index)}
								</option>
							))}
						</select>
					</Field>

					<Button
						type="button"
						onClick={handleGeneratePhotoshoot}
						disabled={
							isGeneratingPhotoshoot ||
							photoshootSourceImages.length === 0 ||
							!selectedModelId ||
							models.length === 0
						}
						className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
					>
						{isGeneratingPhotoshoot ? (
							<>
								<Loader2 size={14} className="mr-2 animate-spin" /> Generating Photoshoot…
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
				{isAddMode ? (
					<div className="space-y-3">
						<Label className="text-xs uppercase tracking-widest text-stone-500">
							Generated Product Media
						</Label>
						{savedProductImages.length > 0 ? (
							<div className="flex flex-wrap gap-3">
								{savedProductImages.map((url, index) => (
									<div key={url} className="space-y-1">
										<div className="text-[10px] uppercase tracking-widest text-stone-500">
											{index === 0 ? 'Primary' : `Gallery ${index}`}
										</div>
										<LoadingImage
											src={url}
											alt={
												index === 0 ? 'Generated primary product image' : 'Generated gallery image'
											}
											width={96}
											height={120}
											sizes="96px"
											className="h-[120px] w-24 object-cover border border-stone-200"
										/>
									</div>
								))}
							</div>
						) : (
							<p
								className={`text-xs ${errors.imageUrl ? 'text-red-600' : 'text-stone-400 italic'}`}
							>
								{errors.imageUrl ||
									'Generated images will appear here after photoshoot generation.'}
							</p>
						)}
					</div>
				) : (
					<MultiImageUpload
						values={form.additionalImages || []}
						onChange={(urls) => setForm({ ...form, additionalImages: urls })}
					/>
				)}
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
							Saving…
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
