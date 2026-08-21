'use client'

import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import Link from '@/components/router-link'
import { useAppRouter, usePathname } from '@/components/router-hooks'
import { LogOut, ArrowLeft, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logoutFn } from '@/server/admin/auth.functions'

export function AdminSidebar() {
	const [isOpen, setIsOpen] = useState(false)
	const pathname = usePathname()
	const router = useAppRouter()
	const logout = useServerFn(logoutFn)

	const navItems = [
		{ href: '/admin/dashboard', label: 'Dashboard' },
		{ href: '/admin/custom-enquiries', label: 'Fitting Requests' },
		{ href: '/admin/products', label: 'Products' },
		{ href: '/admin/collections', label: 'Collections' },
		{ href: '/admin/categories', label: 'Categories' },
		{ href: '/admin/occasions', label: 'Occasions' },
		{ href: '/admin/heroes', label: 'Hero Banners' },
		{ href: '/admin/size-guides', label: 'Size Guides' },
		{ href: '/admin/discounts', label: 'Discounts' },
		{ href: '/admin/models', label: 'Models' },
		{ href: '/admin/showcase', label: 'Showcase AI' },
		{ href: '/admin/settings', label: 'Settings' },
	]

	return (
		<>
			{/* Mobile Top Bar */}
			<div className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between sticky top-0 z-20">
				<div>
					<h1 className="font-heading text-xl text-stone-900 tracking-wide">
						S<span className="text-[#B8860B]">A</span>F
					</h1>
				</div>
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="text-stone-600 p-1 hover:bg-stone-100 transition-colors"
					aria-label="Toggle menu"
				>
					{isOpen ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{/* Mobile Overlay */}
			{isOpen && (
				<button
					type="button"
					className="fixed inset-0 bg-stone-900/50 z-30 md:hidden backdrop-blur-sm"
					onClick={() => setIsOpen(false)}
					aria-label="Close navigation menu"
				/>
			)}

			{/* Sidebar Container */}
			<aside
				className={`
					fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col transform transition-transform duration-300 ease-in-out
					md:static md:translate-x-0
					${isOpen ? 'translate-x-0' : '-translate-x-full'}
				`}
			>
				<div className="p-6 border-b border-stone-200 hidden md:block">
					<h1 className="font-heading text-2xl text-stone-900 tracking-wide">
						S<span className="text-[#B8860B]">A</span>F
					</h1>
					<p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">
						Admin Console
					</p>
				</div>
				<nav className="flex-1 overflow-y-auto p-4 space-y-1">
					{navItems.map((item) => {
						const isActive = pathname?.startsWith(item.href)
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setIsOpen(false)}
								className={`block px-4 py-2 text-sm transition-colors ${
									isActive
										? 'bg-stone-100 text-stone-900 font-medium'
										: 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
								}`}
							>
								{item.label}
							</Link>
						)
					})}
				</nav>
				<div className="p-4 border-t border-stone-200 space-y-2">
					<Link href="/">
						<Button variant="outline" className="w-full justify-start text-xs rounded-none">
							<ArrowLeft className="size-3 mr-2" />
							Back to Store
						</Button>
					</Link>
					<Button
						type="button"
						variant="ghost"
						onClick={async () => {
							await logout()
							await router.invalidate()
							router.push('/admin/login')
						}}
						className="w-full justify-start text-xs rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
					>
						<LogOut className="size-3 mr-2" />
						Sign Out
					</Button>
				</div>
			</aside>
		</>
	)
}
