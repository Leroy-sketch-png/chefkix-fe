export const RECIPE_IMAGE_PLACEHOLDER = '/placeholder-recipe.svg'

export const KNOWN_BROKEN_IMAGE_PATTERNS = [
	'photo-1482049016530-d79f7d5e8c6e',
	'photo-1596097635121-14b63a7a7e7b',
]

export function isKnownBrokenImageSrc(src: unknown): boolean {
	return (
		typeof src === 'string' &&
		KNOWN_BROKEN_IMAGE_PATTERNS.some(pattern => src.includes(pattern))
	)
}

export function safeRecipeImageSrc(
	src: string | null | undefined,
): string {
	if (!src || isKnownBrokenImageSrc(src)) return RECIPE_IMAGE_PLACEHOLDER
	return src
}
