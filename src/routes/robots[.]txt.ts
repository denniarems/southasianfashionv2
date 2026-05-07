import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/robots.txt')({
	server: {
		handlers: {
			GET: async () => {
				const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

				return new Response(
					[
						'User-agent: *',
						'Allow: /',
						'Disallow: /admin',
						'Disallow: /api',
						`Sitemap: ${siteUrl}/sitemap.xml`,
						'',
					].join('\n'),
					{
						headers: {
							'content-type': 'text/plain; charset=utf-8',
						},
					},
				)
			},
		},
	},
})
