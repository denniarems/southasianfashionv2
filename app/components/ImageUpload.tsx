'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LoadingImage } from '@/components/ui/loading-image'

interface ImageUploadProps {
	value: string
	onChange: (url: string) => void
	label?: string
}

export default function ImageUpload({ value, onChange, label = 'Image' }: ImageUploadProps) {
	const [uploading, setUploading] = useState(false)
	const fileRef = useRef<HTMLInputElement>(null)

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setUploading(true)

		const form = new FormData()
		form.append('file', file)

		try {
			const res = await fetch(`/api/upload`, {
				method: 'POST',
				body: form,
			})

			if (!res.ok) throw new Error('Upload failed')

			const data = await res.json()
			onChange(data.url)
			toast.success('Image uploaded')
		} catch {
			toast.error('Upload failed')
		} finally {
			setUploading(false)
			if (fileRef.current) fileRef.current.value = ''
		}
	}

	return (
		<div className="space-y-3" data-testid="image-upload">
			<Label className="text-xs uppercase tracking-widest text-stone-500">{label}</Label>
			<div>
				<Button
					type="button"
					variant="outline"
					onClick={() => fileRef.current?.click()}
					disabled={uploading}
					className="rounded-none px-4"
					data-testid="image-upload-btn"
				>
					{uploading ? (
						'...'
					) : (
						<>
							<Upload size={14} className="mr-2" /> Upload File
						</>
					)}
				</Button>
			</div>
			<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
			{value && (
				<div className="relative inline-block">
					<LoadingImage
						src={value}
						alt="Preview"
						width={96}
						height={96}
						sizes="96px"
						className="h-24 w-auto object-cover border border-stone-200"
					/>
					<button
						type="button"
						onClick={() => onChange('')}
						className="absolute -top-2 -right-2 bg-stone-900 text-white w-5 h-5 flex items-center justify-center"
					>
						<X size={10} />
					</button>
				</div>
			)}
		</div>
	)
}
