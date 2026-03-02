import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		formats: ['image/avif', 'image/webp'],
		minimumCacheTTL: 60 * 60 * 24 * 7,
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 80, 96, 128, 256, 384],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.public.blob.vercel-storage.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: '*.private.blob.vercel-storage.com',
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
