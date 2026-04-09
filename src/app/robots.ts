import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chefkix.com'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: [
					'/',
					'/explore',
					'/search',
					'/recipes/',
					'/post/',
					'/leaderboard',
					'/challenges',
					'/community',
				],
				disallow: [
					'/api/',
					'/auth/',
					'/settings',
					'/messages',
					'/admin/',
					'/create',
					'/post/new',
					'/cook-together/room',
					'/profile/year-in-cooking',
				],
			},
		],
		sitemap: `${BASE_URL}/sitemap.xml`,
	}
}
