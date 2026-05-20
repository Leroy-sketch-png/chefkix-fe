import type { Metadata } from 'next'

/**
 * SEO Meta Helpers — Consistent <head> metadata generation.
 *
 * Adapted from .tmp stash. Works with Next.js App Router's
 * generateMetadata() pattern for consistent OG/Twitter cards.
 *
 * @example
 * // In page.tsx
 * export function generateMetadata() {
 *   return pageSeo({ title: 'Dashboard', description: 'Your cooking dashboard', path: '/dashboard' })
 * }
 */

// ─── Config ──────────────────────────────────────────────
const defaults = {
	siteName: 'ChefKix',
	siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://chefkix.com',
	locale: 'en_US',
	twitterHandle: '@chefkix',
	defaultImage: '/og-image.png',
} as const

// ─── Page Metadata ──────────────────────────────────────
interface PageSeoOptions {
	title: string
	description: string
	path?: string
	image?: string
	noIndex?: boolean
}

export function pageSeo({
	title,
	description,
	path = '',
	image,
	noIndex = false,
}: PageSeoOptions): Metadata {
	const url = `${defaults.siteUrl}${path}`
	const ogImage = image ?? defaults.defaultImage

	return {
		title,
		description,
		...(noIndex && { robots: { index: false, follow: false } }),
		alternates: { canonical: url },
		openGraph: {
			title,
			description,
			url,
			siteName: defaults.siteName,
			locale: defaults.locale,
			type: 'website',
			images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [ogImage],
			creator: defaults.twitterHandle,
		},
	}
}

// ─── Recipe Metadata ────────────────────────────────────
interface RecipeSeoOptions extends PageSeoOptions {
	publishedAt: string
	updatedAt?: string
	author?: string
	tags?: string[]
}

export function recipeSeo({
	publishedAt,
	updatedAt,
	author,
	tags,
	...pageOptions
}: RecipeSeoOptions): Metadata {
	const base = pageSeo(pageOptions)

	return {
		...base,
		openGraph: {
			...base.openGraph,
			type: 'article',
			publishedTime: publishedAt,
			...(updatedAt && { modifiedTime: updatedAt }),
			...(author && { authors: [author] }),
			...(tags && { tags }),
		},
	}
}

// ─── JSON-LD Structured Data ────────────────────────────
export function jsonLd(data: Record<string, unknown>) {
	return {
		__html: JSON.stringify({
			'@context': 'https://schema.org',
			...data,
		}),
	}
}

interface RecipeJsonLdInput {
	id: string
	title: string
	description: string
	imageUrl?: string
	authorName?: string
	datePublished?: string
	dateModified?: string
	cookTimeMinutes?: number
	prepTimeMinutes?: number
	totalTimeMinutes?: number
	servings?: number
	ingredients?: string[]
	instructions?: string[]
	cuisine?: string
	keywords?: string[]
}

function minutesToIsoDuration(minutes?: number): string | undefined {
	if (!minutes || minutes <= 0) return undefined
	return `PT${Math.round(minutes)}M`
}

export function generateRecipeJsonLd(
	recipe: RecipeJsonLdInput,
): Record<string, unknown> {
	const totalTime = minutesToIsoDuration(recipe.totalTimeMinutes)
	const cookTime = minutesToIsoDuration(recipe.cookTimeMinutes)
	const prepTime = minutesToIsoDuration(recipe.prepTimeMinutes)

	return {
		'@context': 'https://schema.org',
		'@type': 'Recipe',
		'@id': `${defaults.siteUrl}/recipes/${recipe.id}`,
		name: recipe.title,
		description: recipe.description,
		...(recipe.imageUrl ? { image: [recipe.imageUrl] } : {}),
		...(recipe.authorName
			? { author: { '@type': 'Person', name: recipe.authorName } }
			: {}),
		...(recipe.datePublished ? { datePublished: recipe.datePublished } : {}),
		...(recipe.dateModified ? { dateModified: recipe.dateModified } : {}),
		...(prepTime ? { prepTime } : {}),
		...(cookTime ? { cookTime } : {}),
		...(totalTime ? { totalTime } : {}),
		...(recipe.servings ? { recipeYield: recipe.servings.toString() } : {}),
		...(recipe.cuisine ? { recipeCuisine: recipe.cuisine } : {}),
		...(recipe.keywords?.length
			? { keywords: recipe.keywords.join(', ') }
			: {}),
		...(recipe.ingredients?.length
			? { recipeIngredient: recipe.ingredients }
			: {}),
		...(recipe.instructions?.length
			? {
					recipeInstructions: recipe.instructions.map(step => ({
						'@type': 'HowToStep',
						text: step,
					})),
				}
			: {}),
	}
}

// ─── Template title ─────────────────────────────────────
/** Creates "Page Title | ChefKix" format */
export function titleTemplate(page: string): string {
	return `${page} | ${defaults.siteName}`
}
