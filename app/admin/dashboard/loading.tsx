export default function AdminDashboardLoading() {
	return (
		<div className="min-h-screen bg-stone-50" role="status" aria-live="polite">
			<div className="border-b border-stone-200 bg-white">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<div className="space-y-2">
						<div className="h-6 w-40 animate-pulse bg-stone-200" />
						<div className="h-3 w-64 animate-pulse bg-stone-200" />
					</div>
					<div className="h-9 w-28 animate-pulse bg-stone-200" />
				</div>
			</div>
			<div className="mx-auto max-w-7xl px-6 py-8">
				<div className="mb-6 h-10 w-105 animate-pulse bg-stone-200" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, idx) => (
						<div key={idx} className="space-y-3 border border-stone-200 bg-white p-4">
							<div className="h-24 animate-pulse bg-stone-200" />
							<div className="h-4 w-2/3 animate-pulse bg-stone-200" />
							<div className="h-3 w-1/3 animate-pulse bg-stone-200" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
