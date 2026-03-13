import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { AdminSidebar } from './components/AdminSidebar'

const JWT_SECRET = process.env.JWT_SECRET || 'saf_default_secret'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const cookieStore = await cookies()
	const token = cookieStore.get('saf_admin_session')?.value

	if (!token) {
		redirect('/admin/login')
	}

	try {
		jwt.verify(token, JWT_SECRET)
	} catch (error) {
		redirect('/admin/login')
	}

	return (
		<div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
			<AdminSidebar />
			{/* Main Content */}
			<main className="flex-1 overflow-y-auto">
				{children}
			</main>
		</div>
	)
}
