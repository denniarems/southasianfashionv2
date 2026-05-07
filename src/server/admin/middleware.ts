import { createMiddleware } from '@tanstack/react-start'
import { requireAdmin } from './auth.server'

export const adminOnly = createMiddleware({ type: 'function' }).server(async ({ next }) => {
	await requireAdmin()
	return next()
})
