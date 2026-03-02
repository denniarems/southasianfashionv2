import { Instagram, Facebook, Mail } from 'lucide-react'
import Link from 'next/link'

const storefrontAddress = '1642 Merivale Rd, Merivale Mall | Ottawa ON, CA'
const storefrontPhoneRaw = '(613) 221-9898'
const storefrontPhoneHref = '+16132219898'
const storefrontHours = 'Open Monday to Saturday: 9:30 AM – 7:00 PM'

const productHighlights = [
	'Sarees',
	'Salwar Kameez',
	'Sharara',
	'Punjabi Suits',
	'Lehanga',
	'Saree Blouse',
	'Kurta Pajama',
	'Dhoti / Lungi',
]

const serviceHighlights = [
	'Alterations',
	'Repairs',
	'Dry Cleaning',
	'Saree Blouse Stitching',
]

interface Settings {
	brandName?: string | null
	brandTagline?: string | null
	contactEmail?: string | null
	instagramUrl?: string | null
	facebookUrl?: string | null
}

export default function Footer({ settings, year }: { settings?: Settings; year: number }) {
	return (
		<footer id="contact" data-testid="footer" className="bg-stone-900 text-white py-24 md:py-32">
			<div className="max-w-450 mx-auto px-6 md:px-12 lg:px-24">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
					<div className="lg:col-span-2">
						<h3 className="font-heading text-2xl tracking-wide mb-4">
							{settings?.brandName || 'SouthAsianFashion'}
						</h3>
						<p className="font-accent italic text-white/40 text-lg mb-6">
							{settings?.brandTagline || 'Curated Luxury. Culturally Rooted.'}
						</p>
						<div className="space-y-3 text-sm text-white/70 leading-relaxed max-w-xl">
							<p>{storefrontAddress}</p>
							<p>
								<a
									href={`tel:${storefrontPhoneHref}`}
									className="hover:text-white transition-colors duration-300"
								>
									{storefrontPhoneRaw}
								</a>
							</p>
							<p>{storefrontHours}</p>
						</div>
					</div>

					<div>
						<p className="text-xs uppercase tracking-widest text-white/20 mb-6">Shop Highlights</p>
						<div className="space-y-4">
							{productHighlights.map((item) => (
								<p key={item} className="block text-sm text-white/60">
									{item}
								</p>
							))}
						</div>
					</div>

					<div>
						<p className="text-xs uppercase tracking-widest text-white/20 mb-6">Services & Connect</p>
						<div className="space-y-4">
							<div className="space-y-2">
								{serviceHighlights.map((service) => (
									<p key={service} className="text-sm text-white/60">
										{service}
									</p>
								))}
							</div>
							{settings?.contactEmail && (
								<a
									href={`mailto:${settings.contactEmail}`}
									data-testid="footer-email"
									className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors duration-300"
								>
									<Mail size={14} /> {settings.contactEmail}
								</a>
							)}
							<div className="flex items-center gap-4 mt-6">
								{settings?.instagramUrl && (
									<a
										href={settings.instagramUrl}
										target="_blank"
										rel="noopener noreferrer"
										data-testid="footer-instagram"
										className="text-white/30 hover:text-white transition-colors duration-300"
									>
										<Instagram size={18} />
									</a>
								)}
								{settings?.facebookUrl && (
									<a
										href={settings.facebookUrl}
										target="_blank"
										rel="noopener noreferrer"
										data-testid="footer-facebook"
										className="text-white/30 hover:text-white transition-colors duration-300"
									>
										<Facebook size={18} />
									</a>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-xs text-white/20 tracking-wider">
						&copy; {year} {settings?.brandName || 'SouthAsianFashion'}. All rights reserved.
					</p>
					<p className="text-xs text-white/60 tracking-wider font-accent italic">
						Crafted by{' '}
						<a
							href="https://denniarems.com"
							target="_blank"
							rel="noopener noreferrer"
							className="footer-glitch inline-block underline underline-offset-4 hover:text-white transition-colors duration-300"
						>
							denniarems
						</a>{' '}
						with{' '}
						<span className="footer-heart-glow" aria-hidden="true">
							♥
						</span>
					</p>
				</div>
			</div>
		</footer>
	)
}
