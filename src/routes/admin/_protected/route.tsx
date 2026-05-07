import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AdminSidebar } from '@/features/admin/components/AdminSidebar'
import { requireAdminFn } from '@/server/admin/auth.functions'

export const Route = createFileRoute('/admin/_protected')({
	beforeLoad: async ({ location }) => {
		const session = await requireAdminFn()

		if (!session?.email) {
			throw redirect({ to: '/admin/login', search: { redirect: location.href } })
		}

		return { admin: session }
	},
	component: AdminLayout,
})

function AdminLayout() {
	return (
		<div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
			<AdminSidebar />
			<main className="flex-1 overflow-y-auto">
				<Outlet />
			</main>
		</div>
	)
}
