export default function GlobalLoading() {
	return (
		<div className="min-h-screen bg-stone-50 pt-24 pb-12" role="status" aria-live="polite">
			<div className="mx-auto max-w-450 px-6 md:px-12 lg:px-24">
				<div className="mb-8 h-10 w-56 animate-pulse bg-stone-200" />
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, idx) => (
						<div key={idx} className="space-y-3">
							<div className="aspect-3/4 animate-pulse bg-stone-200" />
							<div className="h-4 w-3/4 animate-pulse bg-stone-200" />
							<div className="h-3 w-1/2 animate-pulse bg-stone-200" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
