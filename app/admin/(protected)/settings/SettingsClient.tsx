'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteItem, saveSettings } from '@/app/actions/dashboard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ItemDialog } from '../components/ItemDialog'
import { formatCad } from '@/lib/currency'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FormSection, Field } from '../components/shared'
import { Loader2 } from 'lucide-react'

export default function SettingsClient({ items, initialProducts, initialCollections, initialCategories, initialSizeGuides }: any) {
	const [dlg, setDlg] = useState({ open: false, type: 'settings', mode: 'add', data: null as any })
	const [pendingDelete, setPendingDelete] = useState<{ open: boolean; type: string; id: string; label: string }>({
		open: false, type: '', id: '', label: ''
	})
	const [isMutating, startMutatingTransition] = useTransition()
    
    
    const [settingsForm, setSettingsForm] = useState(items[0] || {})
    const handleSaveSettings = (e: React.FormEvent) => {
		e.preventDefault()
		startMutatingTransition(() => {
			void (async () => {
				const res = await saveSettings(settingsForm)
				if (res.error) {
					toast.error(res.error || 'Failed to save settings')
					return
				}
				toast.success('Settings saved')
			})()
		})
	}

	const openDeleteConfirmation = (type: string, id: string, label: string) => {
		setPendingDelete({ open: true, type, id, label })
	}

	const handleDelete = () => {
		startMutatingTransition(() => {
			void (async () => {
				const res = await deleteItem(pendingDelete.type, pendingDelete.id)
				if (res.error) {
					toast.error(res.error || 'Delete failed')
					return
				}
				toast.success('Deleted successfully')
				setPendingDelete({ open: false, type: '', id: '', label: '' })
			})()
		})
	}

    

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto">
            
            <div className="max-w-2xl">
				<h2 className="text-xl font-heading mb-6">Store Settings</h2>
				<form onSubmit={handleSaveSettings} className="space-y-6">
					<FormSection title="Brand Assets" description="Logos and primary imagery.">
						<Field label="Logo URL">
							<Input
								value={settingsForm.logoUrl || ''}
								onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
								placeholder="https://..."
								className="rounded-none"
							/>
						</Field>
					</FormSection>
					<FormSection title="Contact & Social">
						<Field label="WhatsApp Number">
							<Input
								value={settingsForm.whatsappNumber || ''}
								onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
								placeholder="e.g. +1234567890"
								className="rounded-none"
							/>
						</Field>
						<Field label="Instagram URL">
							<Input
								value={settingsForm.instagramUrl || ''}
								onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
								className="rounded-none"
							/>
						</Field>
					</FormSection>
					<Button
						type="submit"
						disabled={isMutating}
						className="rounded-none bg-stone-900 text-white uppercase tracking-widest text-xs"
					>
						{isMutating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
						Save Settings
					</Button>
				</form>
			</div>
            

			<ItemDialog
				dlg={dlg}
				setDlg={setDlg}
				products={initialProducts}
				collections={initialCollections}
				categories={initialCategories}
				sizeGuides={initialSizeGuides}
			/>

			<ConfirmDialog
				open={pendingDelete.open}
				onOpenChange={(open) => setPendingDelete((prev) => ({ ...prev, open }))}
				title="Delete item"
				description={`This will permanently delete ${pendingDelete.label}. This action cannot be undone.`}
				confirmText="Delete"
				variant="danger"
				onConfirm={handleDelete}
				confirming={isMutating}
			/>
		</div>
	)
}
