'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RulerIcon from 'lucide-react/dist/esm/icons/ruler'
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'

type SizeGuideRow = {
	size: string
	values: string[]
}

type SizeGuideData = {
	name: string
	unit: string
	note: string
	columns: string[]
	rows: SizeGuideRow[]
}

const FALLBACK_SIZE_GUIDE: SizeGuideData = {
	name: 'General Size Guide',
	unit: 'in',
	note: 'All measurements in inches. For the best fit, we recommend comparing with a garment you already own.',
	columns: ['Bust', 'Waist', 'Hip', 'Length'],
	rows: [
		{ size: 'XS', values: ['32', '26', '35', '38'] },
		{ size: 'S', values: ['34', '28', '37', '39'] },
		{ size: 'M', values: ['36', '30', '39', '40'] },
		{ size: 'L', values: ['38', '32', '41', '41'] },
		{ size: 'XL', values: ['40', '34', '43', '42'] },
		{ size: 'XXL', values: ['42', '36', '45', '43'] },
	],
}

export default function SizeGuide({
	whatsappNumber,
	guide,
}: {
	whatsappNumber: string
	guide?: SizeGuideData | null
}) {
	const [open, setOpen] = useState(false)
	const effectiveGuide = guide && guide.rows.length > 0 ? guide : FALLBACK_SIZE_GUIDE

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
								{effectiveGuide.note ||
									'For the best fit, we recommend comparing with a garment you already own.'}
							</p>

							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-stone-200">
											<th className="py-2 pr-4 text-left text-xs uppercase tracking-widest text-stone-400 font-medium">
												Size
											</th>
											{effectiveGuide.columns.map((column) => (
												<th
													key={column}
													className="py-2 px-4 text-left text-xs uppercase tracking-widest text-stone-400 font-medium"
												>
													{column}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{effectiveGuide.rows.map((row) => (
											<tr key={row.size} className="border-b border-stone-100 last:border-0">
												<td className="py-2.5 pr-4 font-medium text-stone-900">{row.size}</td>
												{effectiveGuide.columns.map((column, columnIndex) => (
													<td key={`${row.size}-${column}`} className="py-2.5 px-4 text-stone-500">
														{row.values[columnIndex] || '-'} {effectiveGuide.unit}
													</td>
												))}
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
