import type { Metadata } from 'next'

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'

interface RecipeApiResponse {
	success: boolean
	data?: {
		id: string
		title: string
		description?: string
		difficulty?: string
		coverImageUrl?: string
		estimatedTimeMinutes?: number
		authorDisplayName?: string
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>
}): Promise<Metadata> {
	const { id } = await params

	try {
		const res = await fetch(`${API_BASE}/api/v1/recipes/${id}`, {
			next: { revalidate: 3600 },
		})

		if (!res.ok) return {}

		const json: RecipeApiResponse = await res.json()
		const recipe = json.data

		if (!recipe) return {}

		const title = recipe.title
		const description = recipe.description
			? recipe.description.slice(0, 160)
			: `${recipe.difficulty || ''} recipe${recipe.estimatedTimeMinutes ? ` · ${recipe.estimatedTimeMinutes} min` : ''}`

		return {
			title,
			description,
			openGraph: {
				title: `${title} | Chefkix`,
				description,
				type: 'article',
				...(recipe.coverImageUrl && {
					images: [
						{ url: recipe.coverImageUrl, width: 1200, height: 630, alt: title },
					],
				}),
			},
			twitter: {
				card: 'summary_large_image',
				title: `${title} | Chefkix`,
				description,
				...(recipe.coverImageUrl && { images: [recipe.coverImageUrl] }),
			},
		}
	} catch {
		return {}
	}
}

export default function RecipeLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
