/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'i.pravatar.cc',
			},
			{
				protocol: 'https',
				hostname: 'i.imgur.com',
			},
			{
				protocol: 'https',
				hostname: 'loremflickr.com',
			},
		],
	},
}

export default nextConfig
