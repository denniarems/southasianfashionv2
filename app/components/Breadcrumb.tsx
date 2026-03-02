import Link from 'next/link'
import ChevronRightIcon from 'lucide-react/dist/esm/icons/chevron-right'

interface BreadcrumbItem {
	label: string
	href?: string
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
	return (
		<nav aria-label="Breadcrumb" className="mb-6 md:mb-8">
			<ol className="flex items-center gap-1.5 flex-wrap text-xs uppercase tracking-widest">
				<li>
					<Link
						href="/"
						className="text-stone-400 hover:text-stone-900 transition-colors duration-300"
					>
						Home
					</Link>
				</li>
				{items.map((item, i) => (
					<li key={i} className="flex items-center gap-1.5">
						<ChevronRightIcon size={12} className="text-stone-300" />
						{item.href ? (
							<Link
								href={item.href}
								className="text-stone-400 hover:text-stone-900 transition-colors duration-300"
							>
								{item.label}
							</Link>
						) : (
							<span className="text-stone-600">{item.label}</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	)
}
