import withPWA from '@ducanh2912/next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'i.imgur.com',
			},
			{
				protocol: 'https',
				hostname: 'res.cloudinary.com',
			},
			{
				protocol: 'https',
				hostname: 'example.com',
			},
			{
                protocol: 'https',
                hostname: 'cdn.chefkix.com',
            },
		],
	},
}

export default withPWA({
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
	register: true,
	skipWaiting: true,
	runtimeCaching: [
		{
			urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'images',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
				},
			},
		},
		{
			// Cache API responses for recipes
			urlPattern: /\/api\/v1\/recipes\/[^/]+$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'recipe-details',
				networkTimeoutSeconds: 10,
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
				},
			},
		},
	],
})(nextConfig)
