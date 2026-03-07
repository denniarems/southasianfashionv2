import alchemy from 'alchemy'
import {
	D1Database,
	Images,
	R2Bucket,
	WranglerJson,
} from 'alchemy/cloudflare'

const app = await alchemy('southasianfashion')

const envValue = (name: string, fallback: string) => {
	return process.env[name]?.trim() || fallback
}

const adminEmails = envValue(
	'ADMIN_EMAIL',
	'denniarems@gmail.com,binumv1998@gmail.com,binumv19982023@gmail.com,babusimon30@gmail.com',
)
	.split(',')
	.map((email) => email.trim())
	.filter(Boolean)

const senderEmail = envValue('SENDER_EMAIL', 'no-reply@southasianfashion.ca')
const publicR2Url = envValue(
	'R2_PUBLIC_URL',
	'https://media.southasianfashion.ca',
)
const imagesDeliveryHost = envValue(
	'CLOUDFLARE_IMAGES_DELIVERY_HOST',
	'imagedelivery.net',
)
const siteUrl = envValue(
	'NEXT_PUBLIC_SITE_URL',
	'https://southasianfashion.ca',
)

export const database = await D1Database('database', {
	name: 'southasianfashion',
	migrationsDir: 'migrations',
	adopt: true,
})

export const productMedia = await R2Bucket('product-media', {
	name: 'southasianfashion-media',
	adopt: true,
})

export const images = Images()

const worker = {
	name: 'southasianfashion',
	cwd: '.',
	entrypoint: 'dist/server/index.js',
	compatibilityDate: '2026-03-07',
	compatibilityFlags: ['nodejs_compat'],
	observability: {
		enabled: true,
	},
	assets: {
		not_found_handling: 'none' as const,
	},
	bindings: {
		SAF_DB: database,
		PRODUCT_MEDIA: productMedia,
		IMAGES: images,
		ADMIN_EMAIL: adminEmails.join(','),
		SENDER_EMAIL: senderEmail,
		R2_PUBLIC_URL: publicR2Url,
		CLOUDFLARE_IMAGES_DELIVERY_HOST: imagesDeliveryHost,
		NEXT_PUBLIC_SITE_URL: siteUrl,
		NODE_ENV: 'production',
	},
	noBundle: true,
}

export const wrangler = await WranglerJson({
	path: 'wrangler.jsonc',
	main: 'vinext/server/app-router-entry',
	assets: {
		binding: 'ASSETS',
		directory: 'dist/client',
	},
	worker,
	transform: {
		wrangler: (spec) => ({
			...spec,
			assets: spec.assets
				? {
					...spec.assets,
					not_found_handling: 'none',
				}
				: spec.assets,
			send_email: [
				{
					name: 'OTP_EMAIL',
					allowed_destination_addresses: adminEmails,
					allowed_sender_addresses: [senderEmail],
				},
			],
		}),
	},
})

console.log({
	worker: worker.name,
	database: database.name,
	bucket: productMedia.name,
	wrangler: wrangler.path,
	nextStep: 'Run `bun run deploy:production` to sync infra and deploy the vinext app.',
})

await app.finalize()