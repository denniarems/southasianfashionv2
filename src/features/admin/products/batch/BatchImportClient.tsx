'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useAppRouter as useRouter } from '@/components/router-hooks'
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	FileImage,
	FolderOpen,
	Loader2,
	Sparkles,
	Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	batchImportProductsFn,
	generateProductDescriptionFn,
	type BatchImportResult,
	type BatchProductRow,
} from '@/server/admin/batch-import.functions'

interface CollectionItem {
	id: string
	name: string
}

interface CategoryItem {
	id: string
	name: string
}

interface ModelItem {
	id: string
	name: string
	description?: string | null
	ageRange?: string | null
	gender?: string | null
	ethnicity?: string | null
	promptUsed?: string | null
}

interface BatchImportClientProps {
	collections: CollectionItem[]
	categories: CategoryItem[]
	models: ModelItem[]
}

interface CsvRow {
	index: number
	name: string
	price: number
	category: string
	collection: string
	isNew: boolean
	isFeatured: boolean
}

interface FolderImage {
	file: File
	fileKey: string
	previewUrl: string
}

interface FolderContent {
	descText: string
	descFileKey?: string
	descFile?: File
	images: FolderImage[]
}

interface PreviewRow extends CsvRow {
	descText: string
	descFileKey?: string
	images: FolderImage[]
}

interface BatchUploadResponse {
	files?: Record<string, string>
	errors?: string[]
	error?: string
}

const ACCEPTED_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const CSV_TEMPLATE = `index,name,price,category,collection,isNew,isFeatured
1,Midnight Blue Silk Lehenga,850,Lehenga,Bridal 2026,true,true
2,Rose Gold Anarkali Suit,420,Suit,Festive Fusion,true,false`

function parseBooleanFlag(value: string) {
	return value.trim().toLowerCase() === 'true'
}

function splitCsvLine(line: string) {
	const out: string[] = []
	let current = ''
	let insideQuotes = false

	for (let i = 0; i < line.length; i += 1) {
		const ch = line[i]

		if (ch === '"') {
			if (insideQuotes && line[i + 1] === '"') {
				current += '"'
				i += 1
			} else {
				insideQuotes = !insideQuotes
			}
			continue
		}

		if (ch === ',' && !insideQuotes) {
			out.push(current.trim())
			current = ''
			continue
		}

		current += ch
	}

	out.push(current.trim())
	return out
}

function parseCsv(csvText: string): CsvRow[] {
	const lines = csvText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)

	if (lines.length < 2) return []

	const header = splitCsvLine(lines[0]).map((h) => h.trim())
	const required = ['index', 'name', 'price', 'category', 'collection', 'isNew', 'isFeatured']
	const headerMap = new Map(header.map((key, idx) => [key, idx]))

	for (const col of required) {
		if (!headerMap.has(col)) {
			throw new Error(`CSV is missing required column: ${col}`)
		}
	}

	const rows: CsvRow[] = []
	for (const line of lines.slice(1)) {
		const cells = splitCsvLine(line)
		const get = (key: string) => cells[headerMap.get(key) ?? -1] ?? ''
		const index = Number(get('index'))
		const price = Number(get('price'))
		rows.push({
			index,
			name: get('name'),
			price,
			category: get('category'),
			collection: get('collection'),
			isNew: parseBooleanFlag(get('isNew')),
			isFeatured: parseBooleanFlag(get('isFeatured')),
		})
	}

	return rows
}

function getRelativeKey(file: File) {
	const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath
	if (typeof relative === 'string' && relative.trim().length > 0) {
		return relative
	}
	return file.name
}

function getIndexFromRelativePath(path: string) {
	const segments = path
		.split('/')
		.map((segment) => segment.trim())
		.filter(Boolean)

	const numeric = segments.find((segment) => /^\d+$/.test(segment))
	if (numeric) return numeric

	if (segments.length >= 2) return segments[segments.length - 2]
	return ''
}

function getRowValidationErrors(row: PreviewRow) {
	const errors: string[] = []
	if (!Number.isFinite(row.index) || row.index <= 0) errors.push('Index must be a positive number')
	if (!row.name.trim()) errors.push('Product name is required')
	if (!Number.isFinite(row.price) || row.price <= 0) errors.push('Price must be greater than 0')
	if (!row.category.trim()) errors.push('Category is required')
	if (!row.descText.trim()) errors.push('desc.txt is missing for this index')
	if (row.images.length === 0) errors.push('At least one reference image is required')
	return errors
}

export default function BatchImportClient({
	collections,
	categories,
	models,
}: BatchImportClientProps) {
	const router = useRouter()
	const batchImportProducts = useServerFn(batchImportProductsFn)
	const generateProductDescription = useServerFn(generateProductDescriptionFn)

	const [step, setStep] = useState<1 | 2 | 3>(1)
	const [selectedModelId, setSelectedModelId] = useState('')

	const [csvFileName, setCsvFileName] = useState('')
	const [folderFileCount, setFolderFileCount] = useState(0)

	const [csvRows, setCsvRows] = useState<CsvRow[]>([])
	const [folderMap, setFolderMap] = useState<Record<string, FolderContent>>({})
	const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
	const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

	const [guideOpen, setGuideOpen] = useState(true)
	const [previewModalOpen, setPreviewModalOpen] = useState(false)
	const [previewDescription, setPreviewDescription] = useState('')
	const [previewDescriptionSource, setPreviewDescriptionSource] = useState('')
	const [lightboxImage, setLightboxImage] = useState('')

	const [isPreviewingDescription, startPreviewDescriptionTransition] = useTransition()
	const [isImporting, startImportTransition] = useTransition()

	const [uploadErrors, setUploadErrors] = useState<string[]>([])
	const [summary, setSummary] = useState<BatchImportResult | null>(null)
	const [progressCompleted, setProgressCompleted] = useState(0)
	const [progressLabel, setProgressLabel] = useState('Waiting to start...')

	const existingCategorySet = useMemo(
		() => new Set(categories.map((c) => c.name.trim().toLowerCase())),
		[categories],
	)
	const existingCollectionSet = useMemo(
		() => new Set(collections.map((c) => c.name.trim().toLowerCase())),
		[collections],
	)

	const totalRows = previewRows.length
	const descCount = useMemo(
		() => previewRows.filter((row) => row.descText.trim().length > 0).length,
		[previewRows],
	)
	const imageCount = useMemo(
		() => previewRows.reduce((sum, row) => sum + row.images.length, 0),
		[previewRows],
	)

	const rowHealth = useMemo(() => {
		const ready: number[] = []
		const warning: number[] = []
		const error: number[] = []

		for (const row of previewRows) {
			const validationErrors = getRowValidationErrors(row)
			const hasCollectionWarning =
				row.collection.trim().length > 0 &&
				!existingCollectionSet.has(row.collection.trim().toLowerCase())

			if (validationErrors.length > 0) {
				error.push(row.index)
				continue
			}

			if (hasCollectionWarning) {
				warning.push(row.index)
				continue
			}

			ready.push(row.index)
		}

		return { ready, warning, error }
	}, [existingCollectionSet, previewRows])

	useEffect(() => {
		const hasSeen = typeof window !== 'undefined' && localStorage.getItem('batch-import-guide-seen')
		if (hasSeen) {
			setGuideOpen(false)
			return
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem('batch-import-guide-seen', '1')
		}
	}, [])

	useEffect(() => {
		if (selectedModelId) return
		if (models.length > 0) {
			setSelectedModelId(models[0].id)
		}
	}, [models, selectedModelId])

	useEffect(() => {
		return () => {
			for (const row of previewRows) {
				for (const image of row.images) {
					URL.revokeObjectURL(image.previewUrl)
				}
			}
		}
	}, [previewRows])

	const hydratePreviewRows = (rows: CsvRow[], folders: Record<string, FolderContent>) => {
		const hydrated = rows.map((row) => {
			const folder = folders[String(row.index)]
			return {
				...row,
				descText: folder?.descText || '',
				descFileKey: folder?.descFileKey,
				images: folder?.images || [],
			}
		})

		setPreviewRows(hydrated)
		setExpandedRows(Object.fromEntries(hydrated.map((row, idx) => [row.index, idx === 0])))
	}

	const downloadTemplateCsv = () => {
		const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'batch-import-template.csv'
		a.click()
		URL.revokeObjectURL(url)
	}

	const handleCsvSelected = async (file: File | null) => {
		if (!file) return

		try {
			const text = await file.text()
			const parsedRows = parseCsv(text)
			setCsvRows(parsedRows)
			setCsvFileName(file.name)
			hydratePreviewRows(parsedRows, folderMap)
			toast.success(`Parsed ${parsedRows.length} rows from ${file.name}`)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Invalid CSV file')
		}
	}

	const handleFolderSelected = async (files: FileList | null) => {
		if (!files?.length) return

		try {
			const entries = Array.from(files)
			const nextMap: Record<string, FolderContent> = {}

			for (const file of entries) {
				const fileKey = getRelativeKey(file)
				const indexKey = getIndexFromRelativePath(fileKey)
				if (!indexKey) continue

				nextMap[indexKey] = nextMap[indexKey] || { descText: '', images: [] }
				const extension = file.name.split('.').pop()?.toLowerCase() || ''
				const isDesc = file.name.toLowerCase() === 'desc.txt'

				if (isDesc) {
					nextMap[indexKey].descText = await file.text()
					nextMap[indexKey].descFileKey = fileKey
					nextMap[indexKey].descFile = file
					continue
				}

				if (ACCEPTED_IMAGE_EXT.has(extension)) {
					nextMap[indexKey].images.push({
						file,
						fileKey,
						previewUrl: URL.createObjectURL(file),
					})
				}
			}

			setFolderMap(nextMap)
			setFolderFileCount(entries.length)
			hydratePreviewRows(csvRows, nextMap)
			toast.success(`Indexed ${entries.length} files from folder upload`)
		} catch {
			toast.error('Could not parse folder upload')
		}
	}

	const updatePreviewRow = (index: number, update: Partial<PreviewRow>) => {
		setPreviewRows((prev) =>
			prev.map((row) => {
				if (row.index !== index) return row
				return { ...row, ...update }
			}),
		)
	}

	const canProceedToPreview =
		selectedModelId.trim().length > 0 && csvRows.length > 0 && Object.keys(folderMap).length > 0

	const generatePreviewDescription = () => {
		startPreviewDescriptionTransition(() => {
			void (async () => {
				const candidate = previewRows.find(
					(row) => getRowValidationErrors(row).length === 0 && row.descText.trim().length > 0,
				)

				if (!candidate) {
					toast.error('Need at least one valid row with desc.txt to preview AI description')
					return
				}

				const res = await generateProductDescription({
					data: {
						name: candidate.name,
						category: candidate.category,
						price: candidate.price,
						rawNotes: candidate.descText,
					},
				})

				setPreviewDescription(res.description)
				setPreviewDescriptionSource(candidate.name)
				setPreviewModalOpen(true)

				if (res.error) {
					toast.warning('AI preview fell back to raw notes. Check OPENROUTER_API_KEY.')
				}
			})()
		})
	}

	const startImport = () => {
		startImportTransition(() => {
			void (async () => {
				setStep(3)
				setUploadErrors([])
				setSummary(null)
				setProgressCompleted(0)
				setProgressLabel('Preparing files...')

				const rowsToImport = previewRows
					.filter((row) => getRowValidationErrors(row).length === 0)
					.map((row) => ({
						...row,
						name: row.name.trim(),
						category: row.category.trim(),
						collection: row.collection.trim(),
					}))

				if (rowsToImport.length === 0) {
					toast.error('No valid rows to import. Please fix validation errors first.')
					setStep(2)
					return
				}

				setProgressLabel('Uploading reference files to R2...')
				const uploadForm = new FormData()

				const seenKeys = new Set<string>()
				for (const row of rowsToImport) {
					for (const image of row.images) {
						const key = image.fileKey
						if (seenKeys.has(key)) continue
						seenKeys.add(key)
						uploadForm.append('files', image.file)
					}
					const descKey = row.descFileKey
					if (descKey) {
						const folder = folderMap[String(row.index)]
						if (folder?.descFile) {
							uploadForm.append('files', folder.descFile)
						}
					}
				}

				const uploadResponse = await fetch('/api/upload/batch', {
					method: 'POST',
					body: uploadForm,
				})

				const uploadJson = (await uploadResponse.json()) as BatchUploadResponse
				if (!uploadResponse.ok) {
					throw new Error(uploadJson?.error || 'Batch upload failed')
				}

				const fileUrlMap: Record<string, string> = uploadJson.files || {}
				const uploadIssues: string[] = Array.isArray(uploadJson.errors) ? uploadJson.errors : []
				setUploadErrors(uploadIssues)

				setProgressLabel('Generating AI descriptions and photoshoots...')
				const payloadRows: BatchProductRow[] = rowsToImport.map((row) => ({
					index: row.index,
					name: row.name,
					price: row.price,
					category: row.category,
					collection: row.collection,
					isNew: row.isNew,
					isFeatured: row.isFeatured,
					descriptionRaw: row.descText,
					referenceImageUrls: row.images
						.map((image) => fileUrlMap[image.fileKey] || fileUrlMap[image.file.name] || '')
						.filter(Boolean),
				}))

				const result = await batchImportProducts({
					data: {
						rows: payloadRows,
						modelId: selectedModelId,
					},
				})

				setSummary(result)
				setProgressCompleted(result.created)
				setProgressLabel('Import complete')

				if (result.errors.length > 0) {
					toast.warning('Batch import completed with warnings/errors. Review summary below.')
				} else {
					toast.success(`Imported ${result.created} products successfully`)
				}
			})().catch((error) => {
				const message = error instanceof Error ? error.message : 'Batch import failed'
				setProgressLabel('Import failed')
				toast.error(message)
			})
		})
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-heading text-stone-900 tracking-wide">
						Batch Product Import
					</h1>
					<p className="text-sm text-stone-500 mt-1">
						Upload a CSV + product folder, preview everything, then import in one run.
					</p>
				</div>
				<div className="text-xs text-stone-500 border border-stone-200 bg-white px-3 py-2">
					Step {step} of 3
				</div>
			</div>

			{step === 1 && (
				<div className="space-y-6">
					<div className="border border-stone-200 bg-white">
						<button
							type="button"
							onClick={() => setGuideOpen((v) => !v)}
							className="w-full flex items-center justify-between px-4 py-3 border-b border-stone-100 text-left"
						>
							<div>
								<p className="text-sm font-semibold text-stone-900">Upload Guide</p>
								<p className="text-xs text-stone-500">
									CSV format, folder structure, desc.txt tips, and Sheets export
								</p>
							</div>
							{guideOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
						</button>

						{guideOpen && (
							<div className="p-4 space-y-5 text-sm text-stone-700">
								<section className="space-y-2">
									<h3 className="font-medium text-stone-900">📊 CSV Format</h3>
									<div className="overflow-x-auto border border-stone-200">
										<table className="min-w-full text-xs">
											<thead className="bg-stone-100 text-stone-700">
												<tr>
													<th className="px-3 py-2 text-left">index</th>
													<th className="px-3 py-2 text-left">name</th>
													<th className="px-3 py-2 text-left">price</th>
													<th className="px-3 py-2 text-left">category</th>
													<th className="px-3 py-2 text-left">collection</th>
													<th className="px-3 py-2 text-left">isNew</th>
													<th className="px-3 py-2 text-left">isFeatured</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td className="px-3 py-2">1</td>
													<td className="px-3 py-2">Midnight Blue Silk Lehenga</td>
													<td className="px-3 py-2">850</td>
													<td className="px-3 py-2">Lehenga</td>
													<td className="px-3 py-2">Bridal 2026</td>
													<td className="px-3 py-2">true</td>
													<td className="px-3 py-2">true</td>
												</tr>
											</tbody>
										</table>
									</div>
									<p className="text-xs text-stone-500">
										All columns are required. Price must be numeric (no CAD symbol). `isNew` /
										`isFeatured` must be `true` or `false`.
									</p>
								</section>

								<section className="space-y-2">
									<h3 className="font-medium text-stone-900">📁 Folder Structure</h3>
									<pre className="text-xs bg-stone-950 text-stone-100 p-3 overflow-auto">{`my-products/
├── 1/
│   ├── desc.txt
│   ├── front.jpg
│   └── detail.jpg
├── 2/
│   ├── desc.txt
│   └── main.webp
└── 3/
    ├── desc.txt
    └── saree-flat.png`}</pre>
									<p className="text-xs text-stone-500">Folder name must match `index` in CSV.</p>
								</section>

								<section className="space-y-2">
									<h3 className="font-medium text-stone-900">✍️ Writing desc.txt</h3>
									<pre className="text-xs bg-stone-100 border border-stone-200 p-3 overflow-auto">{`Midnight blue pure silk lehenga.
Heavy silver zari embroidery on border and hem.
Sweetheart neckline blouse with sheer net sleeves.
Matching net dupatta with scattered sequin work.
Semi-stitched, fits waist 26-32 inches.`}</pre>
									<p className="text-xs text-stone-500">
										Raw notes are perfect. AI will polish this into final product description.
									</p>
								</section>

								<section className="space-y-2">
									<h3 className="font-medium text-stone-900">🔄 Google Sheets → CSV</h3>
									<ol className="text-xs text-stone-600 list-decimal list-inside space-y-1">
										<li>Open your Google Sheet.</li>
										<li>Go to File → Download → Comma Separated Values (.csv).</li>
										<li>Upload that CSV file here.</li>
									</ol>
								</section>

								<div>
									<Button
										type="button"
										variant="outline"
										onClick={downloadTemplateCsv}
										className="rounded-none text-xs"
									>
										Download Template CSV
									</Button>
								</div>
							</div>
						)}
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<label className="block border border-dashed border-stone-300 bg-white p-4 cursor-pointer hover:border-stone-500 transition-colors">
							<div className="flex items-start gap-3">
								<Upload className="mt-0.5" size={16} />
								<div>
									<p className="text-sm font-medium text-stone-900">Upload CSV</p>
									<p className="text-xs text-stone-500 mt-1">Choose your product CSV file.</p>
									{csvFileName && (
										<p className="text-xs text-emerald-700 mt-2">Loaded: {csvFileName}</p>
									)}
								</div>
							</div>
							<input
								type="file"
								accept=".csv,text/csv"
								className="hidden"
								onChange={(e) => void handleCsvSelected(e.target.files?.[0] || null)}
							/>
						</label>

						<label className="block border border-dashed border-stone-300 bg-white p-4 cursor-pointer hover:border-stone-500 transition-colors">
							<div className="flex items-start gap-3">
								<FolderOpen className="mt-0.5" size={16} />
								<div>
									<p className="text-sm font-medium text-stone-900">Upload Image Folder</p>
									<p className="text-xs text-stone-500 mt-1">
										Select the root folder that contains `index/desc.txt` + image files.
									</p>
									{folderFileCount > 0 && (
										<p className="text-xs text-emerald-700 mt-2">
											Indexed files: {folderFileCount}
										</p>
									)}
								</div>
							</div>
							<input
								type="file"
								className="hidden"
								multiple
								{...({ webkitdirectory: 'true', directory: 'true' } as any)}
								onChange={(e) => void handleFolderSelected(e.target.files)}
							/>
						</label>
					</div>

					<div className="border border-stone-200 bg-white p-4 space-y-3">
						<p className="text-sm font-medium text-stone-900">Select Model</p>
						<select
							value={selectedModelId}
							onChange={(e) => setSelectedModelId(e.target.value)}
							className="w-full h-10 border border-stone-200 bg-white px-3 text-sm focus:ring-2 focus:ring-stone-500 outline-none"
						>
							<option value="">Choose a model</option>
							{models.map((model) => (
								<option key={model.id} value={model.id}>
									{model.name}
								</option>
							))}
						</select>
						{models.length === 0 && (
							<p className="text-xs text-amber-700">
								No saved models found. Create one in Admin → Models before importing.
							</p>
						)}
					</div>

					<div className="flex items-center justify-between">
						<Button
							type="button"
							variant="outline"
							onClick={downloadTemplateCsv}
							className="rounded-none text-xs"
						>
							Download Template CSV
						</Button>
						<Button
							type="button"
							onClick={() => setStep(2)}
							disabled={!canProceedToPreview}
							className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
						>
							Continue to Preview
						</Button>
					</div>
				</div>
			)}

			{step === 2 && (
				<div className="space-y-4">
					<div className="sticky top-4 z-10 bg-white border border-stone-200 px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
						<div className="text-xs text-stone-600 flex flex-wrap gap-3">
							<span>
								Total: <strong>{totalRows}</strong>
							</span>
							<span>
								Images: <strong>{imageCount}</strong>
							</span>
							<span>
								desc.txt: <strong>{descCount}</strong>
							</span>
							<span className="text-emerald-700">
								✅ Ready: <strong>{rowHealth.ready.length}</strong>
							</span>
							<span className="text-amber-700">
								⚠️ Warnings: <strong>{rowHealth.warning.length}</strong>
							</span>
							<span className="text-red-700">
								❌ Errors: <strong>{rowHealth.error.length}</strong>
							</span>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={generatePreviewDescription}
							disabled={isPreviewingDescription}
							className="rounded-none text-xs"
						>
							{isPreviewingDescription ? (
								<>
									<Loader2 size={14} className="mr-2 animate-spin" /> Generating...
								</>
							) : (
								<>
									<Sparkles size={14} className="mr-2" /> Generate Preview Description
								</>
							)}
						</Button>
					</div>

					<div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
						{previewRows.map((row) => {
							const validationErrors = getRowValidationErrors(row)
							const categoryExists = existingCategorySet.has(row.category.trim().toLowerCase())
							const collectionMatched =
								row.collection.trim().length === 0 ||
								existingCollectionSet.has(row.collection.trim().toLowerCase())

							const status =
								validationErrors.length > 0 ? 'error' : collectionMatched ? 'ready' : 'warning'

							return (
								<div key={row.index} className="border border-stone-200 bg-white">
									<button
										type="button"
										onClick={() =>
											setExpandedRows((prev) => ({ ...prev, [row.index]: !prev[row.index] }))
										}
										className="w-full px-4 py-3 flex items-center justify-between text-left"
									>
										<div className="flex items-center gap-3">
											<span className="text-xs border border-stone-300 px-2 py-0.5">
												#{row.index}
											</span>
											<div>
												<p className="text-sm font-medium text-stone-900">
													{row.name || '(Unnamed product)'}
												</p>
												<p className="text-xs text-stone-500">
													{row.category || 'No category'} · CAD{' '}
													{Number.isFinite(row.price) ? row.price : '-'}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{status === 'ready' && (
												<CheckCircle2 size={16} className="text-emerald-600" />
											)}
											{status === 'warning' && <AlertCircle size={16} className="text-amber-600" />}
											{status === 'error' && <AlertCircle size={16} className="text-red-600" />}
											{expandedRows[row.index] ? (
												<ChevronDown size={16} />
											) : (
												<ChevronRight size={16} />
											)}
										</div>
									</button>

									{expandedRows[row.index] && (
										<div className="px-4 pb-4 space-y-4 border-t border-stone-100">
											<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pt-3">
												<div>
													<label className="text-xs text-stone-500">Name</label>
													<Input
														value={row.name}
														onChange={(e) => updatePreviewRow(row.index, { name: e.target.value })}
														className="rounded-none mt-1"
													/>
												</div>
												<div>
													<label className="text-xs text-stone-500">Price (CAD)</label>
													<Input
														type="number"
														value={row.price}
														onChange={(e) =>
															updatePreviewRow(row.index, { price: Number(e.target.value) })
														}
														className="rounded-none mt-1"
													/>
												</div>
												<div>
													<label className="text-xs text-stone-500">Category</label>
													<Input
														value={row.category}
														onChange={(e) =>
															updatePreviewRow(row.index, { category: e.target.value })
														}
														className="rounded-none mt-1"
													/>
												</div>
												<div>
													<label className="text-xs text-stone-500">Collection</label>
													<Input
														value={row.collection}
														onChange={(e) =>
															updatePreviewRow(row.index, { collection: e.target.value })
														}
														className="rounded-none mt-1"
													/>
												</div>
												<div className="flex items-center justify-between border border-stone-200 px-3 py-2 mt-5">
													<span className="text-xs text-stone-700">isNew</span>
													<Switch
														checked={row.isNew}
														onCheckedChange={(checked) =>
															updatePreviewRow(row.index, { isNew: checked })
														}
													/>
												</div>
												<div className="flex items-center justify-between border border-stone-200 px-3 py-2 mt-5">
													<span className="text-xs text-stone-700">isFeatured</span>
													<Switch
														checked={row.isFeatured}
														onCheckedChange={(checked) =>
															updatePreviewRow(row.index, { isFeatured: checked })
														}
													/>
												</div>
											</div>

											<div className="flex flex-wrap gap-2 text-xs">
												<span
													className={
														categoryExists
															? 'bg-emerald-50 text-emerald-700 px-2 py-1 border border-emerald-200'
															: 'bg-amber-50 text-amber-700 px-2 py-1 border border-amber-200'
													}
												>
													{categoryExists ? 'Category exists' : '✨ Will create category'}
												</span>
												<span
													className={
														collectionMatched
															? 'bg-emerald-50 text-emerald-700 px-2 py-1 border border-emerald-200'
															: 'bg-stone-100 text-stone-700 px-2 py-1 border border-stone-200'
													}
												>
													{collectionMatched
														? 'Collection matched'
														: 'Collection not found — will be skipped'}
												</span>
											</div>

											<div>
												<p className="text-xs font-medium text-stone-700 mb-1">desc.txt Preview</p>
												<Textarea
													value={row.descText}
													readOnly
													className="rounded-none min-h-24 bg-stone-50"
												/>
											</div>

											<div>
												<p className="text-xs font-medium text-stone-700 mb-2">Reference Images</p>
												{row.images.length === 0 ? (
													<p className="text-xs text-amber-700">No images found for this index.</p>
												) : (
													<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
														{row.images.map((image) => (
															<button
																key={image.fileKey}
																type="button"
																onClick={() => setLightboxImage(image.previewUrl)}
																className="border border-stone-200 overflow-hidden"
															>
																<img
																	src={image.previewUrl}
																	alt={image.file.name}
																	className="w-full h-24 object-cover"
																/>
															</button>
														))}
													</div>
												)}
											</div>

											{validationErrors.length > 0 && (
												<div className="border border-red-200 bg-red-50 p-3">
													<p className="text-xs font-semibold text-red-700 mb-1">
														Validation Errors
													</p>
													<ul className="text-xs text-red-700 list-disc list-inside space-y-1">
														{validationErrors.map((err) => (
															<li key={err}>{err}</li>
														))}
													</ul>
												</div>
											)}
										</div>
									)}
								</div>
							)
						})}
					</div>

					<div className="flex items-center justify-between">
						<Button
							type="button"
							variant="outline"
							onClick={() => setStep(1)}
							className="rounded-none text-xs"
						>
							Back
						</Button>
						<Button
							type="button"
							onClick={startImport}
							disabled={isImporting || !selectedModelId}
							className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
						>
							{isImporting ? (
								<>
									<Loader2 size={14} className="mr-2 animate-spin" /> Importing...
								</>
							) : (
								<>
									<Upload size={14} className="mr-2" /> Start Import
								</>
							)}
						</Button>
					</div>
				</div>
			)}

			{step === 3 && (
				<div className="space-y-4 border border-stone-200 bg-white p-4">
					<div>
						<p className="text-sm font-medium text-stone-900">Batch Import Progress</p>
						<p className="text-xs text-stone-500 mt-1">{progressLabel}</p>
					</div>
					<div className="w-full h-3 bg-stone-100 border border-stone-200 overflow-hidden">
						<div
							className="h-full bg-stone-900 transition-all"
							style={{
								width: `${
									totalRows > 0 ? Math.min(100, (progressCompleted / totalRows) * 100) : 0
								}%`,
							}}
						/>
					</div>
					<p className="text-xs text-stone-600">
						{progressCompleted} / {totalRows} products created
					</p>

					{uploadErrors.length > 0 && (
						<div className="border border-amber-200 bg-amber-50 p-3">
							<p className="text-xs font-semibold text-amber-700 mb-1">Upload warnings</p>
							<ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
								{uploadErrors.map((err) => (
									<li key={err}>{err}</li>
								))}
							</ul>
						</div>
					)}

					{summary && (
						<div className="border border-stone-200 p-3 bg-stone-50 space-y-2">
							<p className="text-sm font-medium text-stone-900">Final Summary</p>
							<div className="grid gap-2 md:grid-cols-5 text-xs">
								<div>
									Created: <strong>{summary.created}</strong>
								</div>
								<div>
									Skipped: <strong>{summary.skipped}</strong>
								</div>
								<div>
									Descriptions: <strong>{summary.descriptions}</strong>
								</div>
								<div>
									Generated Images: <strong>{summary.generatedImages}</strong>
								</div>
								<div>
									Errors: <strong>{summary.errors.length}</strong>
								</div>
							</div>

							{summary.errors.length > 0 && (
								<ul className="text-xs text-red-700 list-disc list-inside space-y-1 max-h-40 overflow-auto">
									{summary.errors.map((err) => (
										<li key={err}>{err}</li>
									))}
								</ul>
							)}
						</div>
					)}

					<div className="flex items-center justify-between">
						<Button
							type="button"
							variant="outline"
							onClick={() => setStep(2)}
							className="rounded-none text-xs"
						>
							Back to Preview
						</Button>
						<Button
							type="button"
							onClick={() => router.push('/admin/products')}
							className="rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-yellow-700"
						>
							Go to Products
						</Button>
					</div>
				</div>
			)}

			<Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
				<DialogContent className="max-w-2xl rounded-none">
					<DialogHeader>
						<DialogTitle>AI Description Preview</DialogTitle>
						<DialogDescription>
							Generated using the first valid row: <strong>{previewDescriptionSource}</strong>
						</DialogDescription>
					</DialogHeader>
					<div className="border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
						{previewDescription || 'No preview generated yet.'}
					</div>
					<DialogFooter>
						<Button
							type="button"
							onClick={() => setPreviewModalOpen(false)}
							className="rounded-none"
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={Boolean(lightboxImage)} onOpenChange={(open) => !open && setLightboxImage('')}>
				<DialogContent className="max-w-3xl rounded-none p-3">
					<div className="border border-stone-200 bg-stone-100">
						{lightboxImage ? (
							<img
								src={lightboxImage}
								alt="Reference"
								className="w-full max-h-[70vh] object-contain"
							/>
						) : (
							<div className="h-48 flex items-center justify-center text-stone-500">
								<FileImage size={18} className="mr-2" /> No preview
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
