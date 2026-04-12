import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chefkix.com'

export default function sitemap(): MetadataRoute.Sitemap {
	// Static pages — always indexed
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1.0,
		},
		{
			url: `${BASE_URL}/explore`,
			lastModified: new Date(),
			changeFrequency: 'hourly',
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/search`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.8,
		},
		{
			url: `${BASE_URL}/leaderboard`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.7,
		},
		{
			url: `${BASE_URL}/challenges`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.7,
		},
		{
			url: `${BASE_URL}/community`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.6,
		},
	]

	// NOTE: Dynamic pages (recipes, posts, profiles) should be added
	// via a server-side data fetch when the API supports it.
	// Pattern: fetch all published recipe IDs → map to sitemap entries.
	// For now, static pages ensure crawlers discover the main sections.

	return staticPages
}
