import type { ReactNode } from 'react'
import PackageIcon from 'lucide-react/dist/esm/icons/package'

export default function EmptyState({
	title,
	description,
	action,
}: {
	title: string
	description: string
	action?: ReactNode
}) {
	return (
		<div className="text-center py-20">
			<div className="inline-flex items-center justify-center size-16 bg-stone-100 mb-6">
				<PackageIcon size={28} className="text-stone-400" />
			</div>
			<p className="font-heading text-2xl text-stone-900 mb-3">{title}</p>
			<p className="text-stone-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">{description}</p>
			{action}
		</div>
	)
}
