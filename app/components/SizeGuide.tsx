'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RulerIcon from 'lucide-react/dist/esm/icons/ruler'
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'

const SIZE_DATA = [
	{ size: 'XS', bust: '32', waist: '26', hip: '35', length: '38' },
	{ size: 'S', bust: '34', waist: '28', hip: '37', length: '39' },
	{ size: 'M', bust: '36', waist: '30', hip: '39', length: '40' },
	{ size: 'L', bust: '38', waist: '32', hip: '41', length: '41' },
	{ size: 'XL', bust: '40', waist: '34', hip: '43', length: '42' },
	{ size: 'XXL', bust: '42', waist: '36', hip: '45', length: '43' },
] as const

export default function SizeGuide({ whatsappNumber }: { whatsappNumber: string }) {
	const [open, setOpen] = useState(false)

	return (
		<div className="border border-stone-200 mt-8">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition-colors"
				aria-expanded={open}
			>
				<span className="flex items-center gap-3 text-sm font-medium text-stone-900">
					<RulerIcon size={16} className="text-stone-500" />
					Size Guide
				</span>
				<ChevronDownIcon
					size={16}
					className={`text-stone-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="overflow-hidden"
					>
						<div className="px-5 pb-5 border-t border-stone-100">
							<p className="text-xs text-stone-500 mt-4 mb-4">
								All measurements in inches. For the best fit, we recommend comparing with a garment
								you already own.
							</p>

							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-stone-200">
											<th className="py-2 pr-4 text-left text-xs uppercase tracking-widest text-stone-400 font-medium">
												Size
											</th>
											<th className="py-2 px-4 text-left text-xs uppercase tracking-widest text-stone-400 font-medium">
												Bust
											</th>
											<th className="py-2 px-4 text-left text-xs uppercase tracking-widest text-stone-400 font-medium">
												Waist
											</th>
											<th className="py-2 px-4 text-left text-xs uppercase tracking-widest text-stone-400 font-medium">
												Hip
											</th>
											<th className="py-2 pl-4 text-left text-xs uppercase tracking-widest text-stone-400 font-medium">
												Length
											</th>
										</tr>
									</thead>
									<tbody>
										{SIZE_DATA.map((row) => (
											<tr key={row.size} className="border-b border-stone-100 last:border-0">
												<td className="py-2.5 pr-4 font-medium text-stone-900">{row.size}</td>
												<td className="py-2.5 px-4 text-stone-500">{row.bust}&quot;</td>
												<td className="py-2.5 px-4 text-stone-500">{row.waist}&quot;</td>
												<td className="py-2.5 px-4 text-stone-500">{row.hip}&quot;</td>
												<td className="py-2.5 pl-4 text-stone-500">{row.length}&quot;</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="mt-4 p-3 bg-stone-50 flex items-start gap-3">
								<MessageCircleIcon size={14} className="text-stone-400 mt-0.5 shrink-0" />
								<p className="text-xs text-stone-500 leading-relaxed">
									All our pieces are made to order and can be customized to your exact measurements.
									{whatsappNumber && (
										<>
											{' '}
											<a
												href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello! I need help with sizing for my order.')}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-yellow-700 hover:text-stone-900 underline underline-offset-2 transition-colors"
											>
												Contact us for sizing help.
											</a>
										</>
									)}
								</p>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
