import { cn } from '@/lib/utils'

export default function SectionHeading({
	kicker,
	title,
	description,
	className,
}: {
	kicker?: string
	title: string
	description?: string
	className?: string
}) {
	return (
		<div className={cn('max-w-2xl', className)}>
			{kicker ? (
				<p className="font-accent italic text-yellow-700 text-base md:text-lg mb-2">{kicker}</p>
			) : null}
			<h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-stone-900 tracking-tight">
				{title}
			</h2>
			{description ? (
				<p className="mt-4 text-sm md:text-base leading-relaxed text-stone-500">{description}</p>
			) : null}
		</div>
	)
}
