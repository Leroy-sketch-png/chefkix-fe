import type { Metadata } from 'next'

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'

interface PostApiResponse {
	success: boolean
	data?: {
		id: string
		content?: string
		photoUrls?: string[]
		postType?: string
		authorDisplayName?: string
		authorUsername?: string
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>
}): Promise<Metadata> {
	const { id } = await params

	try {
		const res = await fetch(`${API_BASE}/api/v1/posts/${id}`, {
			next: { revalidate: 3600 },
		})

		if (!res.ok) return {}

		const json: PostApiResponse = await res.json()
		const post = json.data

		if (!post) return {}

		const authorName = post.authorDisplayName || post.authorUsername || 'Chef'
		const content = post.content || ''
		const title =
			content.length > 60
				? content.slice(0, 57) + '...'
				: content || `Post by ${authorName}`
		const description =
			content.length > 160
				? content.slice(0, 157) + '...'
				: content || `A post by ${authorName} on Chefkix`
		const image = post.photoUrls?.[0]

		return {
			title,
			description,
			openGraph: {
				title: `${title} | Chefkix`,
				description,
				type: 'article',
				...(image && {
					images: [{ url: image, width: 1200, height: 630, alt: title }],
				}),
			},
			twitter: {
				card: image ? 'summary_large_image' : 'summary',
				title: `${title} | Chefkix`,
				description,
				...(image && { images: [image] }),
			},
		}
	} catch {
		return {}
	}
}

export default function PostLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
