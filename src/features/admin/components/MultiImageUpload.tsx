'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LoadingImage } from '@/components/ui/loading-image'

interface UploadResponse {
	url?: string
	error?: string
}

interface MultiImageUploadProps {
	values: string[]
	onChange: (urls: string[]) => void
	label?: string
	emptyText?: string
}

export default function MultiImageUpload({
	values,
	onChange,
	label = 'Additional Images',
	emptyText = 'No additional images. Upload images to create a gallery on the product page.',
}: MultiImageUploadProps) {
	const [uploading, setUploading] = useState(false)
	const fileRef = useRef<HTMLInputElement>(null)

	const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files?.length) return
		setUploading(true)

		const uploadedUrls = await Promise.all(
			Array.from(files).map(async (file) => {
				const form = new FormData()
				form.append('file', file)

				try {
					const res = await fetch('/api/upload', { method: 'POST', body: form })
					if (!res.ok) throw new Error('Upload failed')
					const data = (await res.json()) as UploadResponse
					if (!data.url) throw new Error(data.error || 'Upload failed')
					return data.url
				} catch {
					toast.error(`Failed to upload ${file.name}`)
					return ''
				}
			}),
		)
		const newUrls = uploadedUrls.flatMap((url) => (url ? [url] : []))

		if (newUrls.length > 0) {
			onChange([...values, ...newUrls])
			toast.success(`${newUrls.length} image${newUrls.length > 1 ? 's' : ''} uploaded`)
		}

		setUploading(false)
		if (fileRef.current) fileRef.current.value = ''
	}

	const removeImage = (index: number) => {
		onChange(values.filter((_, i) => i !== index))
	}

	return (
		<div className="space-y-3">
			<Label className="text-xs uppercase tracking-widest text-stone-500">{label}</Label>
			<div>
				<Button
					type="button"
					variant="outline"
					onClick={() => fileRef.current?.click()}
					disabled={uploading}
					className="rounded-none px-4"
				>
					{uploading ? (
						'Uploading…'
					) : (
						<>
							<Upload size={14} className="mr-2" /> Add Images
						</>
					)}
				</Button>
			</div>
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				onChange={handleFiles}
			/>
			{values.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{values.map((url, i) => (
						<div key={url} className="relative inline-block">
							<LoadingImage
								src={url}
								alt={`Image ${i + 1}`}
								width={80}
								height={80}
								sizes="80px"
								className="h-20 w-auto object-cover border border-stone-200"
							/>
							<button
								type="button"
								onClick={() => removeImage(i)}
								className="absolute -top-2 -right-2 bg-stone-900 text-white size-5 flex items-center justify-center"
							>
								<X size={10} />
							</button>
						</div>
					))}
				</div>
			)}
			{values.length === 0 && <p className="text-xs text-stone-400 italic">{emptyText}</p>}
		</div>
	)
}
