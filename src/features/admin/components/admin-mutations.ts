import { useRouter } from '@tanstack/react-router'
import {
	deleteItemFn,
	fetchProductImagesForAdminFn,
	saveItemFn,
	saveSettingsFn,
} from '@/server/admin/dashboard.functions'

export function useDeleteItemMutation() {
	const router = useRouter()

	return async (type: string, id: string) => {
		const result = await deleteItemFn({ data: { type, id } })
		if (!result.error) {
			await router.invalidate({ sync: true })
		}
		return result
	}
}

export function useSaveItemMutation() {
	const router = useRouter()

	return async (type: string, mode: 'add' | 'edit', data: any) => {
		const result = await saveItemFn({ data: { type, mode, data } })
		if (!result.error) {
			await router.invalidate({ sync: true })
		}
		return result
	}
}

export function useSaveSettingsMutation() {
	const router = useRouter()

	return async (data: any) => {
		const result = await saveSettingsFn({ data })
		if (!result.error) {
			await router.invalidate({ sync: true })
		}
		return result
	}
}

export function fetchProductImagesForAdmin() {
	return fetchProductImagesForAdminFn()
}
