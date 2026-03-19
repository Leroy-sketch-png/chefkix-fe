/**
 * Recipe Transform Utilities
 *
 * Converts recipe data from creation flow formats (ParsedRecipe, RecipeFormData)
 * into the canonical Recipe type expected by CookingPlayer/cookingStore.
 *
 * These transforms are intentionally lossy — they populate only the fields
 * CookingPlayer actually uses: id, title, steps, fullIngredientList, difficulty,
 * coverImageUrl, servings, totalTimeMinutes, xpReward, rewardBadges, skillTags.
 *
 * Fields like author, likeCount, isSaved etc. are set to safe defaults because
 * preview mode never writes to backend.
 */

import type { Recipe, Ingredient, Step } from '@/lib/types/recipe'

// Re-declare local interfaces to avoid circular imports from component files.
// These MUST stay in sync with RecipeCreateAiFlow.tsx and RecipeFormDetailed.tsx.

/** AI Flow ingredient — quantity merges value+unit like "2 tbsp" */
interface AiIngredient {
	id: string
	quantity: string
	name: string
}

/** AI Flow step */
interface AiRecipeStep {
	id: string
	instruction: string
	timerSeconds?: number
	technique?: string
	imageUrl?: string
	videoUrl?: string
	videoThumbnailUrl?: string
	videoDurationSec?: number
}

/** Subset of ParsedRecipe fields needed for transform */
export interface ParsedRecipeInput {
	title: string
	description: string
	coverImageUrl?: string
	cookTime: string
	difficulty: string
	servings: number
	cuisine: string
	ingredients: AiIngredient[]
	steps: AiRecipeStep[]
	detectedBadges: { emoji: string; name: string }[]
	xpReward?: number
	skillTags?: string[]
	difficultyMultiplier?: number
}

/** Manual form measurement unit */
type MeasurementUnit =
	| 'cup'
	| 'tbsp'
	| 'tsp'
	| 'g'
	| 'ml'
	| 'oz'
	| 'lb'
	| 'pieces'

/** Manual form ingredient */
interface FormIngredient {
	id: string
	amount: string
	unit: MeasurementUnit
	name: string
}

/** Manual form step */
interface FormRecipeStep {
	id: string
	instruction: string
	timerSeconds?: number
	imageUrl?: string
	imageFile?: File
	videoUrl?: string
	videoThumbnailUrl?: string
	videoDurationSec?: number
}

/** Subset of RecipeFormData fields needed for transform */
export interface RecipeFormDataInput {
	title: string
	description: string
	coverImageUrl?: string
	coverImageFile?: File
	prepTimeMinutes: number
	cookTimeMinutes: number
	servings: number
	difficulty: string
	category: string
	ingredients: FormIngredient[]
	steps: FormRecipeStep[]
	tips: string
	tags: string[]
}

// ============================================
// HELPERS
// ============================================

/**
 * Split a merged quantity string like "2 tbsp" into { quantity, unit }.
 * Falls back to { quantity: raw, unit: '' } if no unit detected.
 */
function splitQuantity(raw: string): { quantity: string; unit: string } {
	const trimmed = raw.trim()
	// Match leading number (with fractions/decimals/ranges) then optional unit
	const match = trimmed.match(/^([\d./\s\-½¼¾⅓⅔⅛]+)\s*(.*)$/)
	if (match) {
		return {
			quantity: match[1].trim(),
			unit: match[2].trim(),
		}
	}
	// No numeric prefix — treat entire string as quantity (e.g., "a pinch")
	return { quantity: trimmed, unit: '' }
}

/**
 * Parse a cookTime string like "30 minutes" to total minutes.
 */
function parseCookTimeToMinutes(cookTime: string): number {
	const lower = cookTime.toLowerCase().trim()
	const hourMatch = lower.match(/(\d+)\s*h/)
	const minMatch = lower.match(/(\d+)\s*m/)
	const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0
	const minutes = minMatch ? parseInt(minMatch[1], 10) : 0
	if (hours === 0 && minutes === 0) {
		// Try plain number
		const plain = parseInt(lower, 10)
		return isNaN(plain) ? 0 : plain
	}
	return hours * 60 + minutes
}

/** Stub author for preview recipes */
const PREVIEW_AUTHOR = {
	userId: 'preview',
	username: 'you',
	displayName: 'You (Preview)',
	avatarUrl: undefined,
} as const

/**
 * Shared defaults for fields CookingPlayer doesn't use in preview.
 */
function recipeDefaults(): Partial<Recipe> {
	return {
		id: `preview-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		recipeStatus: 'DRAFT',
		videoUrl: [],
		dietaryTags: [],
		likeCount: 0,
		saveCount: 0,
		viewCount: 0,
		cookCount: 0,
		isLiked: false,
		isSaved: false,
		author: { ...PREVIEW_AUTHOR },
	}
}

function sanitizeTransientMediaUrl(url?: string): string | undefined {
	if (!url) return undefined
	return url.startsWith('blob:') ? undefined : url
}

// ============================================
// TRANSFORMS
// ============================================

/**
 * Convert AI-flow ParsedRecipe → canonical Recipe for CookingPlayer.
 *
 * Key mappings:
 * - quantity "2 tbsp" → split into quantity + unit
 * - instruction → description
 * - technique → action
 * - All ingredients assigned to fullIngredientList (steps get their own copy)
 */
export function parsedRecipeToRecipe(parsed: ParsedRecipeInput): Recipe {
	const fullIngredientList: Ingredient[] = parsed.ingredients.map(ing => {
		const { quantity, unit } = splitQuantity(ing.quantity)
		return { name: ing.name, quantity, unit }
	})

	const steps: Step[] = parsed.steps.map((s, idx) => ({
		stepNumber: idx + 1,
		title: `Step ${idx + 1}`,
		description: s.instruction,
		action: s.technique,
		timerSeconds: s.timerSeconds,
		imageUrl: s.imageUrl,
		videoUrl: s.videoUrl,
		videoThumbnailUrl: s.videoThumbnailUrl,
		videoDurationSec: s.videoDurationSec,
		// Preview can't determine per-step mapping — show all on every step
		ingredients: fullIngredientList,
	}))

	const totalTimeMinutes = parseCookTimeToMinutes(parsed.cookTime)

	return {
		...recipeDefaults(),
		title: parsed.title,
		description: parsed.description,
		coverImageUrl: sanitizeTransientMediaUrl(parsed.coverImageUrl)
			? [sanitizeTransientMediaUrl(parsed.coverImageUrl)!]
			: [],
		difficulty: parsed.difficulty as Recipe['difficulty'],
		prepTimeMinutes: 0,
		cookTimeMinutes: totalTimeMinutes,
		totalTimeMinutes,
		servings: parsed.servings,
		cuisineType: parsed.cuisine || '',
		fullIngredientList,
		steps,
		xpReward: parsed.xpReward || 0,
		difficultyMultiplier: parsed.difficultyMultiplier || 1,
		rewardBadges: parsed.detectedBadges.map(b => b.name),
		skillTags: parsed.skillTags || [],
		caloriesPerServing: undefined,
	} as Recipe
}

/**
 * Convert manual RecipeFormData → canonical Recipe for CookingPlayer.
 *
 * Key mappings:
 * - amount → quantity
 * - unit (MeasurementUnit enum) → unit string
 * - instruction → description
 * - category → cuisineType
 */
export function formDataToRecipe(form: RecipeFormDataInput): Recipe {
	const fullIngredientList: Ingredient[] = form.ingredients.map(ing => ({
		name: ing.name,
		quantity: ing.amount,
		unit: ing.unit,
	}))

	const steps: Step[] = form.steps.map((s, idx) => ({
		stepNumber: idx + 1,
		title: `Step ${idx + 1}`,
		description: s.instruction,
		timerSeconds: s.timerSeconds,
		imageUrl: sanitizeTransientMediaUrl(s.imageUrl),
		videoUrl: s.videoUrl,
		videoThumbnailUrl: s.videoThumbnailUrl,
		videoDurationSec: s.videoDurationSec,
		// Preview can't determine per-step mapping — show all on every step
		ingredients: fullIngredientList,
	}))

	const totalTimeMinutes = form.prepTimeMinutes + form.cookTimeMinutes

	return {
		...recipeDefaults(),
		title: form.title,
		description: form.description,
		coverImageUrl: sanitizeTransientMediaUrl(form.coverImageUrl)
			? [sanitizeTransientMediaUrl(form.coverImageUrl)!]
			: [],
		difficulty: form.difficulty as Recipe['difficulty'],
		prepTimeMinutes: form.prepTimeMinutes,
		cookTimeMinutes: form.cookTimeMinutes,
		totalTimeMinutes,
		servings: form.servings,
		cuisineType: form.category || '',
		fullIngredientList,
		steps,
		xpReward: 0,
		difficultyMultiplier: 1,
		rewardBadges: [],
		skillTags: form.tags || [],
		caloriesPerServing: undefined,
	} as Recipe
}
