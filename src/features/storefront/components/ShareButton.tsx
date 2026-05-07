'use client'

import { useMemo, useState } from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import Share2Icon from 'lucide-react/dist/esm/icons/share-2'
import MessageCircleIcon from 'lucide-react/dist/esm/icons/message-circle'
import CopyIcon from 'lucide-react/dist/esm/icons/copy'
import SmartphoneIcon from 'lucide-react/dist/esm/icons/smartphone'
import CheckIcon from 'lucide-react/dist/esm/icons/check'
import { toast } from 'sonner'
import { trackAnalyticsEvent } from '@/lib/analytics'

type ShareButtonProps = {
	productId: string
	productSlug?: string | null
	category?: string | null
	productName: string
	productUrl: string
	productImage: string
	productDescription: string
}

function buildDescriptionSnippet(description: string) {
	const normalized = description.trim().replace(/\s+/g, ' ')
	if (!normalized) return 'A curated design from South Asian Fashion.'
	if (normalized.length <= 120) return normalized
	return `${normalized.slice(0, 117)}...`
}

export default function ShareButton({
	productId,
	productSlug,
	category,
	productName,
	productUrl,
	productImage,
	productDescription,
}: ShareButtonProps) {
	const [copied, setCopied] = useState(false)

	const shareSnippet = useMemo(
		() => buildDescriptionSnippet(productDescription),
		[productDescription],
	)

	const shareText = useMemo(
		() =>
			[productName, shareSnippet, `Image: ${productImage}`, `Link: ${productUrl}`].join(
				'\n\n',
			),
		[productImage, productName, productUrl, shareSnippet],
	)

	const whatsappHref = useMemo(() => {
		const params = new URLSearchParams({ text: shareText })
		return `https://wa.me/?${params.toString()}`
	}, [shareText])

	const canNativeShare =
		typeof navigator !== 'undefined' &&
		typeof navigator.share === 'function' &&
		typeof window !== 'undefined' &&
		window.matchMedia('(max-width: 1024px)').matches

	const handleNativeShare = async () => {
		if (!canNativeShare) return
		try {
			trackAnalyticsEvent({
				eventName: 'share_click',
				productId,
				productSlug: productSlug || undefined,
				category: category || undefined,
			})
			await navigator.share({
				title: productName,
				text: `${shareSnippet}\n\nImage: ${productImage}`,
				url: productUrl,
			})
		} catch {
			// user dismissed share dialog
		}
	}

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(productUrl)
			trackAnalyticsEvent({
				eventName: 'share_click',
				productId,
				productSlug: productSlug || undefined,
				category: category || undefined,
			})
			setCopied(true)
			toast.success('Link copied to clipboard')
			setTimeout(() => setCopied(false), 1600)
		} catch {
			toast.error('Unable to copy link')
		}
	}

	return (
		<PopoverPrimitive.Root>
			<PopoverPrimitive.Trigger asChild>
				<button
					type="button"
					className="w-full sm:w-auto sm:min-w-40 flex items-center justify-center gap-3 border border-stone-300 bg-white text-stone-900 px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-stone-50 transition-colors duration-300"
				>
					<Share2Icon size={16} />
					Share
				</button>
			</PopoverPrimitive.Trigger>

			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					sideOffset={10}
					align="end"
					className="z-50 w-72 border border-stone-200 bg-white p-2 shadow-xl"
				>
					<div className="px-2 py-1.5 text-[11px] uppercase tracking-widest text-stone-400">
						Share this product
					</div>

					<a
						href={whatsappHref}
						target="_blank"
						rel="noopener noreferrer"
						onClick={() =>
							trackAnalyticsEvent({
								eventName: 'share_click',
								productId,
								productSlug: productSlug || undefined,
								category: category || undefined,
							})
						}
						className="flex w-full items-center gap-3 px-2 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
					>
						<MessageCircleIcon size={16} />
						<span className="text-xs uppercase tracking-widest font-medium">Share on WhatsApp</span>
					</a>

					{canNativeShare && (
						<button
							type="button"
							onClick={handleNativeShare}
							className="flex w-full items-center gap-3 px-2 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
						>
							<SmartphoneIcon size={16} />
							<span className="text-xs uppercase tracking-widest font-medium">
								Share via Device
							</span>
						</button>
					)}

					<button
						type="button"
						onClick={handleCopyLink}
						className="flex w-full items-center gap-3 px-2 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
					>
						{copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
						<span className="text-xs uppercase tracking-widest font-medium">
							{copied ? 'Link Copied' : 'Copy Link'}
						</span>
					</button>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	)
}
