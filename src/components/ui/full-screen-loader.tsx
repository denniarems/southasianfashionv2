'use client'

import { AnimatePresence, m } from 'framer-motion'

interface FullScreenLoaderProps {
	show: boolean
	message?: string
	label?: string
}

const fadeTransition = {
	duration: 0.8,
	ease: [0.22, 1, 0.36, 1],
} as const

export function FullScreenLoader({
	show,
	message = 'Preparing your luxury edit',
	label = 'Loading South Asian Fashion',
}: FullScreenLoaderProps) {
	return (
		<AnimatePresence>
			{show ? (
				<m.div
					key="global-loader"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={fadeTransition}
					className="fixed inset-0 z-120 flex items-center justify-center bg-stone-50"
					role="status"
					aria-live="polite"
					aria-label={label}
				>
					<div className="mx-auto flex w-full max-w-md flex-col items-center px-8 text-center">
						<m.h1
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...fadeTransition, delay: 0.08 }}
							className="font-heading text-3xl tracking-[0.18em] text-stone-700 sm:text-4xl"
						>
							South Asian Fashion
						</m.h1>

						<m.p
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...fadeTransition, delay: 0.18 }}
							className="mt-3 font-body text-xs uppercase tracking-[0.28em] text-stone-400"
						>
							{message}
						</m.p>

						<div className="mt-10 flex items-center gap-2" aria-hidden="true">
							{Array.from({ length: 3 }).map((_, index) => (
								<m.span
									// biome-ignore lint/suspicious/noArrayIndexKey: decorative animated elements
									key={index}
									animate={{ opacity: [0.35, 1, 0.35], scaleY: [0.7, 1, 0.7] }}
									transition={{
										duration: 0.8,
										delay: index * 0.12,
										repeat: Number.POSITIVE_INFINITY,
										ease: [0.22, 1, 0.36, 1],
									}}
									className="h-8 w-1 origin-bottom bg-stone-200"
								/>
							))}
						</div>
					</div>
				</m.div>
			) : null}
		</AnimatePresence>
	)
}
