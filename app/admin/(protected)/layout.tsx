import { redirect } from 'next/navigation'
import { AdminSidebar } from './components/AdminSidebar'
import { AdminAuthError, requireAdmin } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	try {
		await requireAdmin()
	} catch (error) {
		if (!(error instanceof AdminAuthError)) {
			throw error
		}
		redirect('/admin/login')
	}

	return (
		<div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
			<AdminSidebar />
			{/* Main Content */}
			<main className="flex-1 overflow-y-auto">{children}</main>
		</div>
	)
}
