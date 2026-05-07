import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_protected/hero')({
	beforeLoad: () => {
		throw redirect({ to: '/admin/heroes' })
	},
})
