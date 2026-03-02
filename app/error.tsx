'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
			<div className="w-full max-w-lg border border-stone-200 bg-white p-8 text-center">
				<h2 className="font-heading text-2xl text-stone-900">Something went wrong</h2>
				<p className="mt-3 text-sm text-stone-500">
					We hit an unexpected issue. You can try again safely.
				</p>
				<div className="mt-6 flex justify-center gap-3">
					<Button onClick={reset} className="rounded-none">
						Try again
					</Button>
					<Button variant="outline" asChild className="rounded-none">
						<a href="/">Go home</a>
					</Button>
				</div>
			</div>
		</div>
	)
}
