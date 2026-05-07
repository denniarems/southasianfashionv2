import 'dotenv/config'
import alchemy from 'alchemy'
import { D1Database, R2Bucket, TanStackStart } from 'alchemy/cloudflare'

const appName = 'southasianfashion'
const stage = process.env.ALCHEMY_STAGE || 'prod'
const siteDomain = normalizeHost(process.env.ALCHEMY_SITE_DOMAIN || 'southasianfashion.ca')
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || undefined
const zoneId = process.env.CLOUDFLARE_ZONE_ID || undefined
const alchemyPassword = process.env.ALCHEMY_PASSWORD || process.env.PASSWORD

if (!alchemyPassword) {
	throw new Error('ALCHEMY_PASSWORD is required to encrypt deployment secrets in Alchemy state')
}

if (!accountId) {
	throw new Error('CLOUDFLARE_ACCOUNT_ID is required for Cloudflare deployment')
}

function optionalCsv(value: string | undefined) {
	return (value || '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

function isEnabled(value: string | undefined) {
	return value === '1' || value?.toLowerCase() === 'true'
}

function publicUrlFromHost(host: string) {
	return host.startsWith('http://') || host.startsWith('https://') ? host : `https://${host}`
}

function normalizeHost(hostOrUrl: string) {
	return hostOrUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

function requiredSecret(name: string) {
	const value = process.env[name]?.trim()

	if (!value) {
		throw new Error(`${name} is required for Cloudflare deployment`)
	}

	return alchemy.secret(value, name)
}

const app = await alchemy(appName, {
	stage,
	password: alchemyPassword,
	adopt: true,
})

const mediaDomain = process.env.ALCHEMY_R2_DOMAIN
	? normalizeHost(process.env.ALCHEMY_R2_DOMAIN)
	: undefined
const mediaBucket = await R2Bucket('media', {
	accountId,
	name: process.env.ALCHEMY_R2_BUCKET_NAME || 'southasianfashion-media',
	adopt: true,
	devDomain: !mediaDomain,
	domains: mediaDomain
		? [
				{
					domain: mediaDomain,
					zone: zoneId,
					adopt: true,
				},
			]
		: undefined,
	cors: [
		{
			allowed: {
				methods: ['GET', 'HEAD'],
				origins: ['*'],
			},
			maxAgeSeconds: 3600,
		},
	],
})

const database = await D1Database('database', {
	accountId,
	name: process.env.ALCHEMY_D1_DATABASE_NAME || 'southasianfashion-prod',
	migrationsDir: './migrations-d1',
	adopt: true,
})

const enableCustomDomains = isEnabled(process.env.ALCHEMY_ENABLE_CUSTOM_DOMAINS)
const workerDomains = enableCustomDomains
	? optionalCsv(process.env.ALCHEMY_WORKER_DOMAINS || `${siteDomain},www.${siteDomain}`).map(
			(domainName) => ({
				domainName,
				zoneId,
				adopt: true,
			}),
		)
	: undefined

const r2PublicUrl = mediaDomain
	? publicUrlFromHost(mediaDomain)
	: process.env.R2_PUBLIC_URL ||
		(mediaBucket.devDomain ? publicUrlFromHost(mediaBucket.devDomain) : '')

if (!r2PublicUrl) {
	throw new Error('R2_PUBLIC_URL or ALCHEMY_R2_DOMAIN is required for media object URLs')
}

export const website = await TanStackStart('website', {
	accountId,
	name: process.env.ALCHEMY_WORKER_NAME || 'southasianfashion',
	build: {
		command: 'bun run build',
		memoize: false,
	},
	dev: {
		command: 'bun run dev',
		domain: 'localhost:3000',
	},
	url: true,
	compatibilityDate: '2026-05-04',
	compatibilityFlags: ['nodejs_compat'],
	observability: {
		enabled: true,
	},
	domains: workerDomains,
	bindings: {
		DB: database,
		MEDIA_BUCKET: mediaBucket,
		NODE_ENV: 'production',
		SITE_URL: publicUrlFromHost(siteDomain),
		R2_PUBLIC_URL: r2PublicUrl,
		ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
		SENDER_EMAIL: process.env.SENDER_EMAIL || 'SouthAsianFashion <admin@example.com>',
		JWT_SECRET: requiredSecret('JWT_SECRET'),
		OPENROUTER_API_KEY: requiredSecret('OPENROUTER_API_KEY'),
		RESEND_API_KEY: requiredSecret('RESEND_API_KEY'),
	},
	wrangler: {
		path: './.alchemy/generated/wrangler.jsonc',
		transform: (spec) => ({
			...spec,
			observability: {
				enabled: true,
			},
		}),
	},
})

console.log({
	stage,
	url: website.url,
	domains: website.domains?.map((domain) => domain.name),
	database: database.name,
	mediaBucket: mediaBucket.name,
	mediaUrl: r2PublicUrl,
})

await app.finalize()
