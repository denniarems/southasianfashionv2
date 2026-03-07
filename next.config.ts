import type { NextConfig } from 'next'

function getHostname(url?: string) {
	if (!url) return null

	try {
		return new URL(url).hostname
	} catch {
		return null
	}
}

const r2PublicHost = getHostname(process.env.R2_PUBLIC_URL)
const cloudflareImagesHost = process.env.CLOUDFLARE_IMAGES_DELIVERY_HOST || 'imagedelivery.net'

const nextConfig: NextConfig = {
	images: {
		formats: ['image/avif', 'image/webp'],
		minimumCacheTTL: 60 * 60 * 24 * 7,
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 80, 96, 128, 256, 384],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: r2PublicHost || '**.r2.dev',
				port: '',
			},
			{
				protocol: 'https',
				hostname: cloudflareImagesHost,
				port: '',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				port: '',
			},
		],
	},
}

export default nextConfig
