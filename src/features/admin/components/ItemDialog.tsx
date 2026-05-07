import React, { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
import ImageUpload from '@/features/admin/components/ImageUpload'
import MultiImageUpload from '@/features/admin/components/MultiImageUpload'
import { useSaveItemMutation } from './admin-mutations'
import {
	Field,
	FormSection,
	DiscountLivePreview,
	DISCOUNT_STRATEGIES,
	TIER_TEMPLATE,
	parseStringArrayFromMixed,
	normalizeDiscountFormData,
} from './shared'
import { formatCad } from '@/lib/currency'

export function ItemDialog({ dlg, setDlg, products, collections, categories, sizeGuides }: any) {
	const { open, type, mode, data } = dlg
	const [form, setForm] = useState<any>(data || {})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [discountProductSearch, setDiscountProductSearch] = useState('')
	const [isSaving, startSavingTransition] = useTransition()
	const saveItem = useSaveItemMutation()

	useEffect(() => {
		if (!open) return
		if (type === 'discounts') {
			setForm(normalizeDiscountFormData(data))
		} else {
			setForm(data || {})
		}
		setDiscountProductSearch('')
		setErrors({})
	}, [open, data, type])

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

		if (type === 'size-guides') {
			if (!form.name?.trim()) nextErrors.name = 'Size guide name is required.'

			try {
				const cols = JSON.parse(form.columnsJson || '[]')
				if (!Array.isArray(cols)) {
					nextErrors.columnsJson = 'Columns JSON must be an array of labels.'
				}
			} catch {
				nextErrors.columnsJson = 'Columns JSON must be valid JSON.'
			}

			try {
				const rows = JSON.parse(form.rowsJson || '[]')
				if (!Array.isArray(rows)) {
					nextErrors.rowsJson = 'Rows JSON must be an array.'
				}
			} catch {
				nextErrors.rowsJson = 'Rows JSON must be valid JSON.'
			}
		}

		if (type === 'discounts') {
			if (!form.name?.trim()) nextErrors.name = 'Discount name is required.'
			if (!form.discountType) nextErrors.discountType = 'Discount type is required.'
			if (!form.discountValue || Number(form.discountValue) <= 0) {
				nextErrors.discountValue = 'Discount value must be greater than 0.'
			}
			if (form.originalPrice && Number(form.originalPrice) <= 0) {
				nextErrors.originalPrice = 'Original price must be greater than 0.'
			}
			if (!form.startDate) {
				nextErrors.startDate = 'Start date is required.'
			}
			if (form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
				nextErrors.endDate = 'End date must be after start date.'
			}

			if (form.maxUses !== '' && Number(form.maxUses) <= 0) {
				nextErrors.maxUses = 'Max uses must be greater than 0.'
			}

			if (form.discountType === 'bundle') {
				const bundleIds = parseStringArrayFromMixed(form.bundleProductIds)
				if (bundleIds.length < 2) {
					nextErrors.bundleProductIds = 'Bundle discounts require at least 2 products.'
				}
			}

			if (form.discountType === 'tiered') {
				try {
					const parsed = JSON.parse(form.tierRulesJson || '[]')
					if (!Array.isArray(parsed) || parsed.length === 0) {
						nextErrors.tierRulesJson = 'Tier rules must be a JSON array.'
					} else {
						for (const rule of parsed) {
							if (
								!rule ||
								typeof rule !== 'object' ||
								Number((rule as { minCartValue?: unknown }).minCartValue) <= 0 ||
								Number((rule as { discountValue?: unknown }).discountValue) <= 0
							) {
								nextErrors.tierRulesJson =
									'Each tier needs positive minCartValue and discountValue.'
								break
							}
						}
					}
				} catch {
					nextErrors.tierRulesJson = 'Tier rules must be valid JSON.'
				}
			}
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
				<div className="space-y-6">
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
				</div>
			)
		}
		if (type === 'collections') {
			return (
				<div className="space-y-6">
					<FormSection title="Collection Basics">
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
					</FormSection>

					<FormSection title="SEO & Media">
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
					</FormSection>
				</div>
			)
		}
		if (type === 'hero') {
			return (
				<div className="space-y-6">
					<FormSection title="Banner Content">
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
					</FormSection>

					<FormSection title="Banner Media & CTA">
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
					</FormSection>
				</div>
			)
		}
		if (type === 'categories') {
			return (
				<div className="space-y-6">
					<FormSection title="Category Basics">
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
					</FormSection>
				</div>
			)
		}
		if (type === 'size-guides') {
			return (
				<div className="space-y-6">
					<FormSection title="Template Basics">
						<Field label="Template Name">
							<Input
								data-testid="dlg-size-guide-name"
								value={form.name || ''}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								aria-invalid={Boolean(errors.name)}
								className="rounded-none"
							/>
							{errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
						</Field>

						<div className="grid grid-cols-2 gap-4">
							<Field label="Product Type">
								<Input
									data-testid="dlg-size-guide-product-type"
									value={form.productType || ''}
									onChange={(e) => setForm({ ...form, productType: e.target.value })}
									className="rounded-none"
									placeholder="e.g. Kurta, Sherwani"
								/>
							</Field>
							<Field label="Unit">
								<select
									data-testid="dlg-size-guide-unit"
									value={form.unit || 'in'}
									onChange={(e) => setForm({ ...form, unit: e.target.value })}
									className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
								>
									<option value="in">in</option>
									<option value="cm">cm</option>
								</select>
							</Field>
						</div>

						<Field label="Measurement Note">
							<Textarea
								data-testid="dlg-size-guide-note"
								value={form.note || ''}
								onChange={(e) => setForm({ ...form, note: e.target.value })}
								className="rounded-none"
								rows={2}
							/>
						</Field>
					</FormSection>

					<FormSection
						title="Measurements JSON"
						description="Use valid JSON for table headers and rows."
					>
						<Field label="Columns JSON (array of labels)">
							<Textarea
								data-testid="dlg-size-guide-columns"
								value={form.columnsJson || '["Bust","Waist","Hip","Length"]'}
								onChange={(e) => setForm({ ...form, columnsJson: e.target.value })}
								aria-invalid={Boolean(errors.columnsJson)}
								className="rounded-none font-mono text-xs"
								rows={3}
							/>
							{errors.columnsJson ? (
								<p className="text-xs text-red-600">{errors.columnsJson}</p>
							) : null}
						</Field>

						<Field label="Rows JSON (array of { size, values[] })">
							<Textarea
								data-testid="dlg-size-guide-rows"
								value={
									form.rowsJson ||
									'[{"size":"XS","values":["32","26","35","38"]},{"size":"S","values":["34","28","37","39"]}]'
								}
								onChange={(e) => setForm({ ...form, rowsJson: e.target.value })}
								aria-invalid={Boolean(errors.rowsJson)}
								className="rounded-none font-mono text-xs"
								rows={5}
							/>
							{errors.rowsJson ? <p className="text-xs text-red-600">{errors.rowsJson}</p> : null}
						</Field>

						<div className="flex items-center gap-2">
							<Switch
								data-testid="dlg-size-guide-active"
								checked={form.isActive ?? true}
								onCheckedChange={(v) => setForm({ ...form, isActive: v })}
							/>
							<Label className="text-xs">Active</Label>
						</div>
					</FormSection>
				</div>
			)
		}
		if (type === 'discounts') {
			const selectedApplicableProducts = parseStringArrayFromMixed(form.applicableProductIds)
			const selectedCategories = parseStringArrayFromMixed(form.applicableCategories)
			const selectedBundleProducts = parseStringArrayFromMixed(form.bundleProductIds)
			const normalizedProductSearch = discountProductSearch.trim().toLowerCase()
			const filteredProducts = products.filter((product: any) => {
				if (!normalizedProductSearch) return true
				const name = String(product.name || '').toLowerCase()
				const category = String(product.category || '').toLowerCase()
				return name.includes(normalizedProductSearch) || category.includes(normalizedProductSearch)
			})
			const currentStrategy =
				DISCOUNT_STRATEGIES.find((strategy) => strategy.id === form.discountType) ||
				DISCOUNT_STRATEGIES[0]

			const toggleApplicableProduct = (productId: string) => {
				const next = selectedApplicableProducts.includes(productId)
					? selectedApplicableProducts.filter((id: string) => id !== productId)
					: [...selectedApplicableProducts, productId]
				setForm({ ...form, applicableProductIds: next })
			}

			const toggleCategory = (categoryName: string) => {
				const next = selectedCategories.includes(categoryName)
					? selectedCategories.filter((name) => name !== categoryName)
					: [...selectedCategories, categoryName]
				setForm({ ...form, applicableCategories: next })
			}

			const toggleBundleProduct = (productId: string) => {
				const next = selectedBundleProducts.includes(productId)
					? selectedBundleProducts.filter((id: string) => id !== productId)
					: [...selectedBundleProducts, productId]
				setForm({ ...form, bundleProductIds: next })
			}

			const applyStrategy = (strategyId: 'flat' | 'percentage' | 'tiered' | 'bundle') => {
				const strategy = DISCOUNT_STRATEGIES.find((item) => item.id === strategyId)
				if (!strategy) return

				setForm({
					...form,
					discountType: strategy.id,
					wording: form.wording || strategy.defaultWording,
					tierRulesJson:
						strategy.id === 'tiered' ? form.tierRulesJson || TIER_TEMPLATE : form.tierRulesJson,
				})
			}

			return (
				<div className="space-y-6">
					<DiscountLivePreview form={form} />
					<div className="rounded-none border border-[#B8860B]/30 bg-[#B8860B]/5 p-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-[#7A1E2C] mb-3">
							Select Discount Strategy
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							{DISCOUNT_STRATEGIES.map((strategy) => {
								const active = form.discountType === strategy.id
								return (
									<button
										key={strategy.id}
										type="button"
										onClick={() => applyStrategy(strategy.id)}
										className={`text-left border px-3 py-2 transition-colors ${
											active
												? 'border-[#B8860B] bg-white'
												: 'border-stone-200 bg-white/70 hover:border-stone-400'
										}`}
									>
										<p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-900">
											{strategy.label}
										</p>
										<p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
											{strategy.description}
										</p>
									</button>
								)
							})}
						</div>
						<p className="text-[11px] text-stone-500 mt-3">{currentStrategy.description}</p>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
							Campaign Basics
						</p>
						<Field label="Discount Name">
							<Input
								data-testid="dlg-discount-name"
								value={form.name || ''}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								aria-invalid={Boolean(errors.name)}
								className="rounded-none"
							/>
							{errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
						</Field>

						<Field label="Description">
							<Textarea
								data-testid="dlg-discount-description"
								value={form.description || ''}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="rounded-none"
								rows={2}
							/>
						</Field>

						<Field label="Display Wording">
							<Input
								value={form.wording || currentStrategy.defaultWording}
								onChange={(e) => setForm({ ...form, wording: e.target.value })}
								className="rounded-none"
								placeholder={currentStrategy.defaultWording}
							/>
						</Field>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
							Pricing & Rules
						</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Field label="Type">
								<select
									data-testid="dlg-discount-type"
									value={form.discountType || 'flat'}
									onChange={(e) => setForm({ ...form, discountType: e.target.value })}
									className="w-full h-10 border border-stone-200 bg-white px-3 text-sm"
								>
									<option value="flat">flat</option>
									<option value="percentage">percentage</option>
									<option value="tiered">tiered</option>
									<option value="bundle">bundle</option>
								</select>
								{errors.discountType ? (
									<p className="text-xs text-red-600">{errors.discountType}</p>
								) : null}
							</Field>

							<Field label="Value">
								<Input
									data-testid="dlg-discount-value"
									type="number"
									value={form.discountValue ?? ''}
									onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) || 0 })}
									className="rounded-none"
								/>
								{errors.discountValue ? (
									<p className="text-xs text-red-600">{errors.discountValue}</p>
								) : null}
							</Field>

							<Field label="Original Price (Optional)">
								<Input
									type="number"
									value={form.originalPrice ?? ''}
									onChange={(e) =>
										setForm({
											...form,
											originalPrice: e.target.value ? Number(e.target.value) : '',
										})
									}
									className="rounded-none"
								/>
								{errors.originalPrice ? (
									<p className="text-xs text-red-600">{errors.originalPrice}</p>
								) : null}
							</Field>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<Field label="Priority">
								<Input
									type="number"
									value={form.priority ?? 10}
									onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })}
									className="rounded-none"
								/>
							</Field>
							<Field label="Min Cart Value">
								<Input
									type="number"
									value={form.minCartValue ?? 0}
									onChange={(e) => setForm({ ...form, minCartValue: Number(e.target.value) || 0 })}
									className="rounded-none"
								/>
							</Field>
							<Field label="Max Uses">
								<Input
									type="number"
									value={form.maxUses ?? ''}
									onChange={(e) =>
										setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : '' })
									}
									className="rounded-none"
								/>
								{errors.maxUses ? <p className="text-xs text-red-600">{errors.maxUses}</p> : null}
							</Field>
							<div className="flex items-end gap-6 pb-1">
								<div className="flex items-center gap-2">
									<Switch
										checked={form.isActive ?? true}
										onCheckedChange={(v) => setForm({ ...form, isActive: v })}
									/>
									<Label className="text-xs">Active</Label>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										checked={form.stackable || false}
										onCheckedChange={(v) => setForm({ ...form, stackable: v })}
									/>
									<Label className="text-xs">Stackable</Label>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
							Campaign Window
						</p>
						<div className="grid grid-cols-2 gap-4">
							<Field label="Start Date">
								<Input
									data-testid="dlg-discount-start"
									type="datetime-local"
									value={form.startDate || ''}
									onChange={(e) => setForm({ ...form, startDate: e.target.value })}
									className="rounded-none"
								/>
								{errors.startDate ? (
									<p className="text-xs text-red-600">{errors.startDate}</p>
								) : null}
							</Field>

							<Field label="End Date (Optional)">
								<Input
									data-testid="dlg-discount-end"
									type="datetime-local"
									value={form.endDate || ''}
									onChange={(e) => setForm({ ...form, endDate: e.target.value })}
									className="rounded-none"
								/>
								{errors.endDate ? <p className="text-xs text-red-600">{errors.endDate}</p> : null}
							</Field>
						</div>
					</div>

					<div className="rounded-none border border-stone-200 p-4 space-y-4">
						<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">Targeting</p>
						<Field label="Applicable Products">
							<div className="space-y-3">
								<Input
									data-testid="dlg-discount-product-search"
									value={discountProductSearch}
									onChange={(e) => setDiscountProductSearch(e.target.value)}
									placeholder="Search products by name or category"
									className="rounded-none"
								/>
								<div className="flex items-center justify-between gap-3 text-[11px] text-stone-500">
									<p>
										{selectedApplicableProducts.length > 0
											? `${selectedApplicableProducts.length} selected`
											: 'Leave empty to target all matching products'}
									</p>
									<p>{filteredProducts.length} shown</p>
								</div>
								{selectedApplicableProducts.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{selectedApplicableProducts.map((productId: string) => {
											const selectedProduct = products.find(
												(product: any) => product.id === productId,
											)
											if (!selectedProduct) return null

											return (
												<button
													key={productId}
													type="button"
													onClick={() => toggleApplicableProduct(productId)}
													className="px-3 py-1 text-[11px] uppercase tracking-[0.14em] border bg-stone-900 text-white border-stone-900"
												>
													{selectedProduct.name}
												</button>
											)
										})}
									</div>
								) : null}
								<div className="max-h-56 overflow-y-auto border border-stone-200 p-2">
									<div className="grid grid-cols-1 gap-1">
										{filteredProducts.length > 0 ? (
											filteredProducts.map((product: any) => {
												const selected = selectedApplicableProducts.includes(product.id)
												return (
													<button
														key={product.id}
														data-testid={`dlg-discount-applicable-product-${product.id}`}
														type="button"
														onClick={() => toggleApplicableProduct(product.id)}
														className={`w-full border px-3 py-2 text-left transition-colors ${
															selected
																? 'bg-stone-900 text-white border-stone-900'
																: 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
														}`}
													>
														<div className="flex items-start justify-between gap-3">
															<div>
																<p className="text-xs font-medium uppercase tracking-[0.12em]">
																	{product.name}
																</p>
																<p
																	className={`mt-1 text-[11px] ${
																		selected ? 'text-stone-200' : 'text-stone-500'
																	}`}
																>
																	{product.category || 'Uncategorized'}
																</p>
															</div>
															<p
																className={`text-xs ${selected ? 'text-stone-200' : 'text-stone-500'}`}
															>
																{formatCad(Math.round(Number(product.price) || 0))}
															</p>
														</div>
													</button>
												)
											})
										) : (
											<p className="px-3 py-6 text-center text-xs text-stone-500">
												No products match this search.
											</p>
										)}
									</div>
								</div>
							</div>
						</Field>

						<Field label="Applicable Categories">
							<div className="flex flex-wrap gap-2">
								{categories.map((category: any) => {
									const selected = selectedCategories.includes(category.name)
									return (
										<button
											key={category.id}
											type="button"
											onClick={() => toggleCategory(category.name)}
											className={`px-3 py-1 text-[11px] uppercase tracking-[0.14em] border transition-colors ${
												selected
													? 'bg-stone-900 text-white border-stone-900'
													: 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
											}`}
										>
											{category.name}
										</button>
									)
								})}
							</div>
						</Field>

						{form.discountType === 'bundle' ? (
							<Field label="Bundle Products (Select 2+)">
								<div className="max-h-44 overflow-y-auto border border-stone-200 p-2">
									<div className="grid grid-cols-1 gap-1">
										{products.map((product: any) => {
											const selected = selectedBundleProducts.includes(product.id)
											return (
												<button
													key={product.id}
													type="button"
													onClick={() => toggleBundleProduct(product.id)}
													className={`w-full text-left px-3 py-2 text-xs transition-colors ${
														selected
															? 'bg-stone-900 text-white'
															: 'hover:bg-stone-100 text-stone-700'
													}`}
												>
													{product.name}
												</button>
											)
										})}
									</div>
								</div>
								{errors.bundleProductIds ? (
									<p className="text-xs text-red-600">{errors.bundleProductIds}</p>
								) : null}
							</Field>
						) : null}
					</div>

					{form.discountType === 'tiered' ? (
						<div className="rounded-none border border-stone-200 p-4 space-y-3">
							<div className="flex items-center justify-between gap-2">
								<p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">Tier Rules</p>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setForm({ ...form, tierRulesJson: TIER_TEMPLATE })}
										className="rounded-none text-[10px] uppercase tracking-[0.14em]"
									>
										Use Recommended Tiers
									</Button>
								</div>
							</div>
							<Textarea
								value={form.tierRulesJson || TIER_TEMPLATE}
								onChange={(e) => setForm({ ...form, tierRulesJson: e.target.value })}
								className="rounded-none font-mono text-xs"
								rows={6}
							/>
							<p className="text-[11px] text-stone-500">
								Format: [{'{'} minCartValue, discountValue, discountType {'}'}]
							</p>
							{errors.tierRulesJson ? (
								<p className="text-xs text-red-600">{errors.tierRulesJson}</p>
							) : null}
						</div>
					) : null}
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
					: type === 'discounts'
						? 'Discount'
						: type === 'size-guides'
							? 'Size Guide'
							: 'Collection'

	return (
		<Dialog open={open} onOpenChange={(v) => setDlg({ ...dlg, open: v })}>
			<DialogContent
				className={`rounded-none max-h-[90vh] overflow-y-auto bg-white ${
					type === 'discounts' ? 'sm:max-w-4xl' : 'sm:max-w-lg'
				}`}
			>
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
