'use client'

import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Sparkles, Download, RotateCcw } from 'lucide-react'
import Link from '@/components/router-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	generateShowcaseCatalogFn,
	generateShowcaseImagesFn,
	importShowcaseCatalogFn,
	SHOWCASE_SHOT_KEYS,
	type ShowcaseProduct,
} from '@/server/admin/showcase.functions'
import {
	ONAM_CATEGORY_PRESET,
	ONAM_OCCASION,
	ONAM_TREND_BRIEF,
	matchPersonaModelId,
} from './onam-preset'

interface PersonaModel {
	id: string
	name: string
	gender: string | null
	ageRange: string | null
}

interface ImageResult {
	title: string
	generatedImages: number
	errors: string[]
}

interface ImportSummary {
	created: number
	errors: string[]
	imageResults: ImageResult[]
}

type Phase = 'config' | 'preview' | 'done'

const SHOT_LABELS = ['Studio (full-body)', 'Macro (fabric detail)', 'Lifestyle (Onam setting)']

export default function ShowcaseClient({ models }: { models: PersonaModel[] }) {
	const generateCatalog = useServerFn(generateShowcaseCatalogFn)
	const importCatalog = useServerFn(importShowcaseCatalogFn)
	const generateImages = useServerFn(generateShowcaseImagesFn)

	const [occasion, setOccasion] = useState(ONAM_OCCASION)
	const [collectionName, setCollectionName] = useState('')
	const [trendBrief, setTrendBrief] = useState(ONAM_TREND_BRIEF)
	const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(() =>
		Object.fromEntries(ONAM_CATEGORY_PRESET.map((category) => [category.name, category.count])),
	)
	const [modelByCategory, setModelByCategory] = useState<Record<string, string>>(() =>
		Object.fromEntries(
			ONAM_CATEGORY_PRESET.map((category) => [
				category.name,
				matchPersonaModelId(models, category.personaHint),
			]),
		),
	)

	const [phase, setPhase] = useState<Phase>('config')
	const [catalog, setCatalog] = useState<ShowcaseProduct[]>([])
	const [isGenerating, setIsGenerating] = useState(false)
	const [isImporting, setIsImporting] = useState(false)
	const [progressLabel, setProgressLabel] = useState('')
	const [progressCompleted, setProgressCompleted] = useState(0)
	const [summary, setSummary] = useState<ImportSummary | null>(null)

	const totalPlanned = ONAM_CATEGORY_PRESET.reduce(
		(sum, category) => sum + (categoryCounts[category.name] || 0),
		0,
	)

	const handleGenerate = async () => {
		setIsGenerating(true)
		try {
			const res = await generateCatalog({
				data: {
					occasion,
					collectionName,
					trendBrief,
					categories: ONAM_CATEGORY_PRESET.map((category) => ({
						...category,
						count: categoryCounts[category.name] || 0,
					})).filter((category) => category.count > 0),
				},
			})

			if ('error' in res && res.error) {
				toast.error(res.error)
				return
			}

			if (!res.products.length) {
				toast.error('The AI returned an empty catalog. Try again.')
				return
			}

			setCatalog(res.products)
			setPhase('preview')
			toast.success(`Generated ${res.products.length} products`)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Catalog generation failed')
		} finally {
			setIsGenerating(false)
		}
	}

	const updateProduct = (index: number, patch: Partial<ShowcaseProduct>) => {
		setCatalog((current) =>
			current.map((product, i) => (i === index ? { ...product, ...patch } : product)),
		)
	}

	const handleImport = async () => {
		setIsImporting(true)
		setProgressCompleted(0)
		setProgressLabel('Creating products…')

		try {
			const importResult = await importCatalog({
				data: { occasion, collectionName, products: catalog },
			})

			const imageResults: ImageResult[] = []

			if (importResult.created > 0) {
				for (const [index, product] of importResult.products.entries()) {
					setProgressLabel(
						`Generating images for ${product.title} (${index + 1} / ${importResult.products.length})…`,
					)

					try {
						const imageResult = await generateImages({
							data: {
								productId: product.productId,
								modelId: modelByCategory[product.category] || undefined,
								prompts: product.imagePrompts,
							},
						})
						imageResults.push({
							title: product.title,
							generatedImages: imageResult.generatedImages,
							errors: imageResult.errors,
						})
					} catch (error) {
						imageResults.push({
							title: product.title,
							generatedImages: 0,
							errors: [error instanceof Error ? error.message : 'Image generation failed'],
						})
					}

					setProgressCompleted(index + 1)
				}
			}

			setSummary({
				created: importResult.created,
				errors: importResult.errors,
				imageResults,
			})
			setPhase('done')
			setProgressLabel('Import complete')
			toast.success(`Imported ${importResult.created} products`)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Import failed')
			setProgressLabel('Import failed')
		} finally {
			setIsImporting(false)
		}
	}

	const handleDownloadDataset = () => {
		const dataset = catalog.map((product) => ({
			product_id: product.catalogId,
			title: product.title,
			category: product.category,
			price_cad: product.price,
			fabric: product.fabric,
			color: product.color,
			description: product.description,
			tags: product.tags,
			keywords: product.keywords,
			image_prompts: product.imagePrompts,
		}))

		const blob = new Blob(
			[JSON.stringify({ occasion, collectionName, products: dataset }, null, 2)],
			{
				type: 'application/json',
			},
		)
		const url = URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		anchor.href = url
		anchor.download = `${occasion.toLowerCase().replace(/\s+/g, '-')}-showcase-dataset.json`
		anchor.click()
		URL.revokeObjectURL(url)
	}

	const reset = () => {
		setPhase('config')
		setCatalog([])
		setSummary(null)
		setProgressCompleted(0)
		setProgressLabel('')
	}

	return (
		<div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-stone-900">Showcase AI</h1>
				<p className="text-sm text-stone-500 mt-1">
					Generate an Onam catalog — metadata, SEO fields, and 3 AI image prompts per product — then
					import it and generate all product photos in one run.
				</p>
			</div>

			{phase === 'config' && (
				<div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
					<div className="grid md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="showcase-occasion">Occasion</Label>
							<Input
								id="showcase-occasion"
								value={occasion}
								onChange={(event) => setOccasion(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="showcase-collection">Collection (optional)</Label>
							<Input
								id="showcase-collection"
								value={collectionName}
								onChange={(event) => setCollectionName(event.target.value)}
								placeholder="Leave empty — products compose normally by occasion and category"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="showcase-brief">Trend brief (fed to the AI)</Label>
						<Textarea
							id="showcase-brief"
							value={trendBrief}
							onChange={(event) => setTrendBrief(event.target.value)}
							rows={8}
						/>
					</div>

					<div className="space-y-3">
						<p className="text-sm font-medium text-stone-700">Categories</p>
						{ONAM_CATEGORY_PRESET.map((category) => (
							<div
								key={category.name}
								className="grid md:grid-cols-[140px_80px_1fr] gap-3 items-center border border-stone-100 rounded-lg p-3"
							>
								<div>
									<p className="text-sm font-medium text-stone-800">{category.name}</p>
									<p className="text-xs text-stone-400">{category.priceBand}</p>
								</div>
								<div className="space-y-1">
									<Label htmlFor={`count-${category.name}`} className="text-xs text-stone-500">
										Products
									</Label>
									<Input
										id={`count-${category.name}`}
										type="number"
										min={0}
										max={5}
										value={categoryCounts[category.name] ?? 0}
										onChange={(event) =>
											setCategoryCounts((current) => ({
												...current,
												[category.name]: Math.max(0, Math.min(5, Number(event.target.value) || 0)),
											}))
										}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor={`model-${category.name}`} className="text-xs text-stone-500">
										Persona (saved model used for identity in on-model shots)
									</Label>
									<select
										id={`model-${category.name}`}
										className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800"
										value={modelByCategory[category.name] || ''}
										onChange={(event) =>
											setModelByCategory((current) => ({
												...current,
												[category.name]: event.target.value,
											}))
										}
									>
										<option value="">Text-only persona (no saved model)</option>
										{models.map((model) => (
											<option key={model.id} value={model.id}>
												{model.name}
												{model.gender ? ` — ${model.gender}` : ''}
												{model.ageRange ? `, ${model.ageRange}` : ''}
											</option>
										))}
									</select>
								</div>
							</div>
						))}
					</div>

					<div className="flex items-center justify-between">
						<p className="text-sm text-stone-500">
							{totalPlanned} products planned · {totalPlanned * 3} images will be generated
						</p>
						<Button onClick={handleGenerate} disabled={isGenerating || totalPlanned === 0}>
							<Sparkles className="w-4 h-4 mr-2" />
							{isGenerating ? 'Generating catalog…' : 'Generate Catalog'}
						</Button>
					</div>
				</div>
			)}

			{phase === 'preview' && (
				<>
					<div className="flex flex-wrap items-center gap-3">
						<Button variant="outline" onClick={reset} disabled={isImporting}>
							<RotateCcw className="w-4 h-4 mr-2" />
							Start over
						</Button>
						<Button variant="outline" onClick={handleDownloadDataset} disabled={isImporting}>
							<Download className="w-4 h-4 mr-2" />
							Download dataset JSON
						</Button>
						<div className="flex-1" />
						<Button onClick={handleImport} disabled={isImporting || catalog.length === 0}>
							{isImporting ? 'Importing…' : `Import & Generate Images (${catalog.length * 3})`}
						</Button>
					</div>

					{isImporting && (
						<div className="bg-white rounded-xl border border-stone-200 p-4">
							<div className="h-2 rounded-full bg-stone-100 overflow-hidden">
								<div
									className="h-full bg-stone-800 transition-all"
									style={{
										width: `${catalog.length ? Math.min(100, (progressCompleted / catalog.length) * 100) : 0}%`,
									}}
								/>
							</div>
							<p className="text-xs text-stone-500 mt-2">{progressLabel}</p>
						</div>
					)}

					<div className="grid gap-4">
						{catalog.map((product, index) => (
							<div
								key={product.catalogId}
								className="bg-white rounded-xl border border-stone-200 p-5 space-y-4"
							>
								<div className="grid md:grid-cols-[1fr_140px_140px] gap-3">
									<div className="space-y-1">
										<Label className="text-xs text-stone-500">Title</Label>
										<Input
											value={product.title}
											onChange={(event) => updateProduct(index, { title: event.target.value })}
											disabled={isImporting}
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-xs text-stone-500">Price (CAD)</Label>
										<Input
											type="number"
											min={1}
											value={product.price}
											onChange={(event) =>
												updateProduct(index, { price: Number(event.target.value) || product.price })
											}
											disabled={isImporting}
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-xs text-stone-500">Category</Label>
										<Input value={product.category} disabled />
									</div>
								</div>

								<div className="grid md:grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label className="text-xs text-stone-500">Fabric</Label>
										<Input
											value={product.fabric}
											onChange={(event) => updateProduct(index, { fabric: event.target.value })}
											disabled={isImporting}
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-xs text-stone-500">Color</Label>
										<Input
											value={product.color}
											onChange={(event) => updateProduct(index, { color: event.target.value })}
											disabled={isImporting}
										/>
									</div>
								</div>

								<div className="space-y-1">
									<Label className="text-xs text-stone-500">Description</Label>
									<Textarea
										value={product.description}
										onChange={(event) => updateProduct(index, { description: event.target.value })}
										rows={3}
										disabled={isImporting}
									/>
								</div>

								<p className="text-xs text-stone-400">
									Tags: {product.tags.join(', ') || '—'} · Keywords:{' '}
									{product.keywords.join(', ') || '—'}
								</p>

								<details className="text-sm">
									<summary className="cursor-pointer text-stone-600 font-medium">
										Image prompts ({product.imagePrompts.length})
									</summary>
									<div className="mt-2 space-y-2">
										{product.imagePrompts.map((prompt, promptIndex) => (
											<div
												key={promptIndex}
												className="rounded-lg bg-stone-50 border border-stone-100 p-3"
											>
												<p className="text-xs font-medium text-stone-500 mb-1">
													{SHOT_LABELS[promptIndex] || SHOWCASE_SHOT_KEYS[promptIndex]}
												</p>
												<Textarea
													value={prompt}
													onChange={(event) =>
														updateProduct(index, {
															imagePrompts: product.imagePrompts.map((item, i) =>
																i === promptIndex ? event.target.value : item,
															),
														})
													}
													rows={4}
													disabled={isImporting}
													className="text-xs"
												/>
											</div>
										))}
									</div>
								</details>
							</div>
						))}
					</div>
				</>
			)}

			{phase === 'done' && summary && (
				<div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
					<h2 className="text-lg font-semibold text-stone-900">Showcase imported</h2>
					<p className="text-sm text-stone-600">
						{summary.created} products created under occasion "{occasion}"
						{collectionName ? ` and collection "${collectionName}"` : ''}.
					</p>

					{summary.errors.length > 0 && (
						<div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
							<p className="text-sm font-medium text-amber-800 mb-1">Import warnings</p>
							<ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
								{summary.errors.map((error) => (
									<li key={error}>{error}</li>
								))}
							</ul>
						</div>
					)}

					<ul className="divide-y divide-stone-100">
						{summary.imageResults.map((result) => (
							<li key={result.title} className="py-2 text-sm">
								<span className="text-stone-800">{result.title}</span>
								<span className="text-stone-400"> — {result.generatedImages}/3 images</span>
								{result.errors.map((error) => (
									<p key={error} className="text-xs text-amber-700 mt-1">
										{error}
									</p>
								))}
							</li>
						))}
					</ul>

					<div className="flex gap-3">
						<Button variant="outline" onClick={reset}>
							<RotateCcw className="w-4 h-4 mr-2" />
							New run
						</Button>
						<Link href="/admin/products">
							<Button>Review products</Button>
						</Link>
					</div>
				</div>
			)}
		</div>
	)
}
