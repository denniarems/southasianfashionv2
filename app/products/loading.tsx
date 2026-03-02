function SkeletonCard() {
	return (
		<div className="animate-pulse">
			<div className="aspect-3/4 bg-stone-200 mb-4" />
			<div className="h-3 w-16 bg-stone-200 mb-2" />
			<div className="h-5 w-3/4 bg-stone-200 mb-2" />
			<div className="h-4 w-20 bg-stone-200 mb-4" />
			<div className="h-11 bg-stone-200" />
		</div>
	)
}

export default function ProductsLoading() {
	return (
		<>
			{/* Navbar Skeleton */}
			<div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-stone-200/50">
				<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
					<div className="flex items-center justify-between h-20">
						<div className="h-5 w-40 bg-stone-200 animate-pulse" />
						<div className="hidden md:flex items-center gap-12">
							<div className="h-3 w-20 bg-stone-200 animate-pulse" />
							<div className="h-3 w-16 bg-stone-200 animate-pulse" />
							<div className="h-3 w-20 bg-stone-200 animate-pulse" />
						</div>
						<div className="h-10 w-10 border border-stone-200 animate-pulse" />
					</div>
				</div>
			</div>

			{/* Main Content Skeleton */}
			<main className="pt-32 pb-24 min-h-screen bg-stone-50">
				<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
					{/* Header */}
					<div className="mb-10">
						<div className="h-12 w-64 bg-stone-200 animate-pulse mb-4" />
						<div className="h-5 w-56 bg-stone-200 animate-pulse" />
					</div>

					{/* Search & Sort Bar */}
					<div className="flex flex-col sm:flex-row gap-3 mb-6">
						<div className="flex-1 h-11 bg-stone-200 animate-pulse" />
						<div className="h-11 w-48 bg-stone-200 animate-pulse" />
					</div>

					{/* Category Pills */}
					<div className="flex gap-2 mb-8">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="h-9 w-24 bg-stone-200 animate-pulse shrink-0" />
						))}
					</div>

					{/* Count */}
					<div className="h-4 w-36 bg-stone-200 animate-pulse mb-8" />

					{/* Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{Array.from({ length: 8 }).map((_, i) => (
							<SkeletonCard key={i} />
						))}
					</div>
				</div>
			</main>
		</>
	)
}
