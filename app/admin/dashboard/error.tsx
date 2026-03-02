'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminDashboardError({
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
				<h2 className="font-heading text-2xl text-stone-900">Dashboard failed to load</h2>
				<p className="mt-3 text-sm text-stone-500">
					Please try reloading the dashboard. If the issue persists, re-authenticate and try again.
				</p>
				<div className="mt-6 flex justify-center gap-3">
					<Button onClick={reset} className="rounded-none">
						Retry
					</Button>
					<Button variant="outline" asChild className="rounded-none">
						<a href="/admin/login">Back to login</a>
					</Button>
				</div>
			</div>
		</div>
	)
}
