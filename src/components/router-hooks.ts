import { useLocation, useNavigate, useRouter } from '@tanstack/react-router'

export function usePathname() {
	return useLocation({
		select: (location) => location.pathname,
	})
}

export function useAppRouter() {
	const navigate = useNavigate()
	const router = useRouter()

	return {
		push: (to: string) => navigate({ to }),
		replace: (to: string) => navigate({ to, replace: true }),
		refresh: () => router.invalidate({ sync: true }),
		invalidate: () => router.invalidate({ sync: true }),
	}
}
