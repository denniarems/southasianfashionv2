'use client'

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

type ConfirmVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description?: string
	confirmText?: string
	cancelText?: string
	onConfirm: () => void
	confirming?: boolean
	variant?: ConfirmVariant
}

const iconMap = {
	danger: ShieldAlert,
	warning: AlertTriangle,
	info: Info,
} as const

const iconColorMap = {
	danger: 'text-[#7A1E2C]',
	warning: 'text-[#B8860B]',
	info: 'text-stone-700',
} as const

const confirmVariantMap = {
	danger: 'destructive',
	warning: 'outline',
	info: 'outline',
} as const

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	confirming = false,
	variant = 'warning',
}: ConfirmDialogProps) {
	const Icon = iconMap[variant]

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md rounded-none" showCloseButton={!confirming}>
				<DialogHeader>
					<div className="mb-2 flex items-center gap-3">
						<Icon className={`size-5 ${iconColorMap[variant]}`} aria-hidden="true" />
						<DialogTitle>{title}</DialogTitle>
					</div>
					{description ? <DialogDescription>{description}</DialogDescription> : null}
				</DialogHeader>
				<DialogFooter className="mt-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={confirming}
						className="rounded-none text-xs uppercase tracking-widest"
					>
						{cancelText}
					</Button>
					<Button
						variant={confirmVariantMap[variant]}
						onClick={onConfirm}
						disabled={confirming}
						aria-busy={confirming}
						className={
							variant === 'danger'
								? 'rounded-none text-xs uppercase tracking-widest'
								: 'rounded-none bg-stone-900 text-white text-xs uppercase tracking-widest hover:bg-[#B8860B] border border-stone-900'
						}
					>
						{confirming ? 'Please wait…' : confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
