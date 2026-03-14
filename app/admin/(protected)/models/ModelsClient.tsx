'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Loader2, RefreshCw, Save, Trash2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingImage } from '@/components/ui/loading-image'
import { FormSection, Field } from '../components/shared'
import {
	saveModel,
	deleteModel,
	generateModelImage,
} from '@/app/actions/admin/models'

export default function ModelsClient({ initialModels }: { initialModels: any[] }) {
	const [models] = useState(initialModels)
	
	// Form state
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [ageRange, setAgeRange] = useState('20-30')
	const [gender, setGender] = useState('Female')
	const [ethnicity, setEthnicity] = useState('South Asian')
	const [style, setStyle] = useState('Realistic Fashion Editorial')
	
	const [generatedImageUrl, setGeneratedImageUrl] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)
	const [isSaving, startSaving] = useTransition()
	const [isDeleting, startDeleting] = useTransition()

	const handleGenerate = async () => {
		if (!description.trim()) {
			toast.error('Please enter a description/prompt')
			return
		}

		setIsGenerating(true)
		setGeneratedImageUrl('')

		try {
			const res = await generateModelImage(description, style, ageRange, gender, ethnicity)
			if (res.error) throw new Error(res.error)

			setGeneratedImageUrl(res.imageUrl || '')
			toast.success('Model generated successfully!')
		} catch (e: any) {
			toast.error(e.message || 'Generation failed')
		} finally {
			setIsGenerating(false)
		}
	}

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error('Please enter a name for this model')
			return
		}
		if (!generatedImageUrl) {
			toast.error('No image generated to save')
			return
		}

		startSaving(async () => {
			try {
				const res = await saveModel({
					name,
					description,
					ageRange,
					gender,
					ethnicity,
					imageUrl: generatedImageUrl,
					promptUsed: `Subject: ${ageRange} ${ethnicity} ${gender} | Style: ${style} | Prompt: ${description}`,
				})

				if (res.error) throw new Error(res.error)
				toast.success('Model saved to gallery')
				setGeneratedImageUrl('')
				setName('')
				setDescription('')
			} catch (e: any) {
				toast.error(e.message || 'Failed to save model')
			}
		})
	}

	const handleDelete = (id: string) => {
		if (!confirm('Are you sure you want to delete this model?')) return
		startDeleting(async () => {
			const res = await deleteModel(id)
			if (res.error) toast.error(res.error)
			else toast.success('Model deleted')
		})
	}

	const styleOptions = [
		'Minimalist Studio Portrait',
		'Realistic Fashion Editorial',
		'Cinematic Lighting',
		'Vintage Film Photography',
		'Street Style',
	]

	const genderOptions = ['Female', 'Male', 'Non-binary', 'Any']
	const ethnicityOptions = ['South Asian', 'Middle Eastern', 'Mixed Heritage', 'Any']
	const ageOptions = ['Kids (0-12)', 'Teens (13-17)', '18-25', '20-30', '30-40', '40-50', '50+']

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-heading text-stone-900 tracking-wide mb-1">Models</h1>
				<p className="text-sm text-stone-500">
					Create virtual model models to showcase your collections.
				</p>
			</div>

			<Tabs defaultValue="create" className="w-full">
				<TabsList className="bg-stone-200/50 rounded-none border border-stone-200 p-1 mb-8 w-full md:w-auto flex flex-wrap h-auto">
					<TabsTrigger value="create" className="rounded-none text-xs uppercase tracking-widest flex-1 md:flex-none">
						Create Model
					</TabsTrigger>
					<TabsTrigger value="gallery" className="rounded-none text-xs uppercase tracking-widest flex-1 md:flex-none">
						Saved Models ({models.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="create" className="focus-visible:ring-0 focus-visible:outline-none">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Studio / Generation Form */}
						<motion.div
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
							className="space-y-6"
						>
							<FormSection
								title="Model Studio"
								description="Define the exact demographics and style of your virtual model."
							>
								<Field label="Model Name">
									<Input
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="e.g., Summer Bride, Modern Groom"
										className="rounded-none"
									/>
								</Field>

								<div className="grid grid-cols-2 gap-4">
									<Field label="Age Range">
										<select
											value={ageRange}
											onChange={(e) => setAgeRange(e.target.value)}
											className="w-full h-10 border border-stone-200 bg-white px-3 text-sm focus:ring-2 focus:ring-stone-500 outline-none"
										>
											{ageOptions.map((opt) => (
												<option key={opt} value={opt}>
													{opt}
												</option>
											))}
										</select>
									</Field>

									<Field label="Gender">
										<select
											value={gender}
											onChange={(e) => setGender(e.target.value)}
											className="w-full h-10 border border-stone-200 bg-white px-3 text-sm focus:ring-2 focus:ring-stone-500 outline-none"
										>
											{genderOptions.map((opt) => (
												<option key={opt} value={opt}>
													{opt}
												</option>
											))}
										</select>
									</Field>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<Field label="Ethnicity">
										<select
											value={ethnicity}
											onChange={(e) => setEthnicity(e.target.value)}
											className="w-full h-10 border border-stone-200 bg-white px-3 text-sm focus:ring-2 focus:ring-stone-500 outline-none"
										>
											{ethnicityOptions.map((opt) => (
												<option key={opt} value={opt}>
													{opt}
												</option>
											))}
										</select>
									</Field>

									<Field label="Style Preference">
										<select
											value={style}
											onChange={(e) => setStyle(e.target.value)}
											className="w-full h-10 border border-stone-200 bg-white px-3 text-sm focus:ring-2 focus:ring-stone-500 outline-none"
										>
											{styleOptions.map((opt) => (
												<option key={opt} value={opt}>
													{opt}
												</option>
											))}
										</select>
									</Field>
								</div>

								<Field label="Description / Prompt">
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Describe the model's appearance, vibe, pose, clothing context..."
										className="rounded-none"
										rows={3}
									/>
								</Field>

								<div className="pt-2">
									<Button
										onClick={handleGenerate}
										disabled={isGenerating}
										className="w-full rounded-none bg-stone-900 text-white uppercase tracking-widest text-xs hover:bg-yellow-700"
									>
										{isGenerating ? (
											<>
												<Loader2 size={14} className="mr-2 animate-spin" /> Generating...
											</>
										) : (
											<>
												<Wand2 size={14} className="mr-2" /> Generate Model
											</>
										)}
									</Button>
								</div>
							</FormSection>
						</motion.div>

						{/* Preview Area */}
						<motion.div
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3, delay: 0.1 }}
						>
							<FormSection title="Preview & Save" description="Review the generated image before saving.">
								<div className="bg-stone-100 border border-stone-200 aspect-square flex items-center justify-center relative overflow-hidden">
									{isGenerating ? (
										<div className="text-stone-400 flex flex-col items-center">
											<Loader2 className="w-8 h-8 animate-spin mb-2" />
											<span className="text-xs uppercase tracking-widest">Creating Magic...</span>
										</div>
									) : generatedImageUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={generatedImageUrl}
											alt="Generated Model"
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="text-stone-400 text-xs uppercase tracking-widest text-center px-4">
											Waiting for generation...<br />
											<span className="opacity-70 normal-case mt-2 block">Configure the model demographics on the left and hit generate.</span>
										</div>
									)}
								</div>

								{generatedImageUrl && !isGenerating && (
									<div className="flex gap-2 pt-2">
										<Button
											variant="outline"
											onClick={handleGenerate}
											className="flex-1 rounded-none text-xs uppercase tracking-widest"
											disabled={isSaving}
										>
											<RefreshCw size={14} className="mr-2" /> Retry
										</Button>
										<Button
											onClick={handleSave}
											className="flex-1 rounded-none bg-yellow-700 text-white text-xs uppercase tracking-widest hover:bg-stone-900"
											disabled={isSaving}
										>
											{isSaving ? (
												<Loader2 size={14} className="animate-spin" />
											) : (
												<>
													<Save size={14} className="mr-2" /> Save Model
												</>
											)}
										</Button>
									</div>
								)}
							</FormSection>
						</motion.div>
					</div>
				</TabsContent>

				<TabsContent value="gallery" className="focus-visible:ring-0 focus-visible:outline-none">
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						{models.length === 0 ? (
							<div className="text-center py-16 bg-white border border-stone-200">
								<Wand2 className="w-8 h-8 text-stone-300 mx-auto mb-3" />
								<p className="text-sm text-stone-500">No model models saved yet.</p>
								<p className="text-xs text-stone-400 mt-1">Switch to the Create tab to generate your first model.</p>
							</div>
						) : (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{models.map((model) => (
									<div key={model.id} className="border border-stone-200 bg-white group flex flex-col h-full">
										<div className="aspect-square overflow-hidden bg-stone-100 relative">
											<LoadingImage
												src={model.imageUrl}
												alt={model.name}
												width={300}
												height={300}
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDelete(model.id)}
													disabled={isDeleting}
													className="rounded-none text-xs"
												>
													<Trash2 size={14} className="mr-2" /> Delete
												</Button>
											</div>
										</div>
										<div className="p-4 flex-1 flex flex-col">
											<h3 className="font-heading text-sm text-stone-900 truncate">{model.name}</h3>
											<div className="mt-2 space-y-1">
												<div className="flex flex-wrap gap-1">
													{model.ageRange && (
														<span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 uppercase tracking-widest">{model.ageRange}</span>
													)}
													{model.gender && (
														<span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 uppercase tracking-widest">{model.gender}</span>
													)}
													{model.ethnicity && (
														<span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 uppercase tracking-widest truncate max-w-[80px]">{model.ethnicity}</span>
													)}
												</div>
												{model.description && (
													<p className="text-[10px] text-stone-500 line-clamp-2 mt-2 leading-relaxed">
														{model.description}
													</p>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</motion.div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
