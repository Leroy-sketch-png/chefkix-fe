import type { Metadata } from 'next'
import { getServerBackendUrl } from '@/lib/server-backend-url'

interface RecipeApiResponse {
	success: boolean
	data?: {
		id: string
		title: string
		description?: string
		difficulty?: string
		coverImageUrl?: string | string[]
		estimatedTimeMinutes?: number
		authorDisplayName?: string
	}
}

function normalizeMediaUrl(value?: string | string[]): string | undefined {
	if (Array.isArray(value)) {
		return value.find(
			entry => typeof entry === 'string' && entry.trim().length > 0,
		)
	}

	return typeof value === 'string' && value.trim().length > 0
		? value
		: undefined
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>
}): Promise<Metadata> {
	const { id } = await params

	try {
		const res = await fetch(`${getServerBackendUrl()}/api/v1/recipes/${id}`, {
			next: { revalidate: 3600 },
		})

		if (!res.ok) return {}

		const json: RecipeApiResponse = await res.json()
		const recipe = json.data

		if (!recipe) return {}

		const coverImageUrl = normalizeMediaUrl(recipe.coverImageUrl)

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
				...(coverImageUrl && {
					images: [
						{ url: coverImageUrl, width: 1200, height: 630, alt: title },
					],
				}),
			},
			twitter: {
				card: 'summary_large_image',
				title: `${title} | Chefkix`,
				description,
				...(coverImageUrl && { images: [coverImageUrl] }),
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
