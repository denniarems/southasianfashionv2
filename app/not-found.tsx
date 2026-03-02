import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
			<div className="w-full max-w-lg border border-stone-200 bg-white p-8 text-center">
				<p className="font-accent text-lg italic text-yellow-700">404</p>
				<h1 className="mt-2 font-heading text-3xl text-stone-900">Page not found</h1>
				<p className="mt-3 text-sm text-stone-500">
					The page you&apos;re looking for doesn&apos;t exist or may have moved.
				</p>
				<div className="mt-6 flex justify-center gap-3">
					<Button asChild className="rounded-none">
						<Link href="/">Go home</Link>
					</Button>
					<Button variant="outline" asChild className="rounded-none">
						<Link href="/collections">Browse collections</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}