/**
 * Pure helper functions for the recipe creation flow.
 *
 * All functions are stateless and side-effect-free — easy to unit test.
 */
import type {
	ParsedRecipe,
	PublishValidationError,
	RecipeStep,
	TimeUnit,
} from '@/lib/types/recipeCreate'
import type { Difficulty } from '@/lib/types/gamification'
import type { processRecipe } from '@/services/ai'

// ── Platform detection ──────────────────────────────────────────────
const isMac =
	typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
export const modKey = isMac ? '⌘' : 'Ctrl'

// ── Recalculation threshold ─────────────────────────────────────────
/**
 * Threshold for triggering XP recalculation.
 * Typo fixes ≈ 5-10% change, substantial edits ≈ 30%+.
 */
export const RECALCULATION_THRESHOLD = 30

// ── Pre-publish validation ──────────────────────────────────────────
/**
 * Validates recipe data before publish, matching backend requirements:
 * 1. Title is required
 * 2. At least 1 cover image
 * 3. Ingredients list is not empty
 * 4. At least 1 step
 *
 * Returns array of validation errors (empty = valid).
 */
export const validateRecipeForPublish = (
	recipe: ParsedRecipe | null,
): PublishValidationError[] => {
	if (!recipe) {
		return [
			{
				field: 'title',
				message: 'No recipe data',
				hint: 'Please create a recipe first.',
			},
		]
	}

	const errors: PublishValidationError[] = []

	if (!recipe.title?.trim()) {
		errors.push({
			field: 'title',
			message: 'Title is required',
			hint: 'Add a title for your recipe in the preview.',
		})
	}

	if (!recipe.coverImageUrl?.trim()) {
		errors.push({
			field: 'coverImage',
			message: 'Cover image is required',
			hint: 'Upload a photo of your finished dish using the image button.',
		})
	}

	if (!recipe.ingredients || recipe.ingredients.length === 0) {
		errors.push({
			field: 'ingredients',
			message: 'Ingredients are required',
			hint: 'Add at least one ingredient to your recipe.',
		})
	}

	if (!recipe.steps || recipe.steps.length === 0) {
		errors.push({
			field: 'steps',
			message: 'Steps are required',
			hint: 'Add at least one step to your recipe instructions.',
		})
	}

	return errors
}

// ── Backend error mapping ───────────────────────────────────────────
/**
 * Maps backend Vietnamese error messages to English (for robustness).
 */
export const mapBackendErrorToEnglish = (message: string): string => {
	const errorMap: Record<string, string> = {
		'Tiêu đề là bắt buộc': 'Title is required',
		'Cần ít nhất 1 ảnh bìa': 'Cover image is required',
		'Danh sách nguyên liệu không được trống':
			'Ingredients list cannot be empty',
		'Cần ít nhất 1 bước hướng dẫn': 'At least one step is required',
	}
	return errorMap[message] || message
}

// ── Smart recalculation detection ───────────────────────────────────
/**
 * Calculates the percentage of change between original and current recipe.
 * Only considers XP-affecting content: ingredients (40%) and steps (60%).
 * Typo fixes (small text changes) don't count.
 *
 * @returns 0-100 representing the % of change
 */
export const calculateRecipeChangePercent = (
	original: ParsedRecipe | null,
	current: ParsedRecipe | null,
): number => {
	if (!original || !current) return 0

	let totalWeight = 0
	let changedWeight = 0

	// --- INGREDIENTS COMPARISON (40% weight) ---
	const origIngredients = original.ingredients || []
	const currIngredients = current.ingredients || []
	const ingredientWeight = 40
	totalWeight += ingredientWeight

	const origIngNames = new Set(
		origIngredients.map(i => i.name.toLowerCase().trim()),
	)
	const currIngNames = new Set(
		currIngredients.map(i => i.name.toLowerCase().trim()),
	)

	const addedIngs = [...currIngNames].filter(n => !origIngNames.has(n)).length
	const removedIngs = [...origIngNames].filter(n => !currIngNames.has(n)).length
	const totalIngChanges = addedIngs + removedIngs

	const maxIngChanges = Math.max(
		origIngredients.length,
		currIngredients.length,
		1,
	)
	const ingChangeRatio = Math.min(totalIngChanges / maxIngChanges, 1)
	changedWeight += ingredientWeight * ingChangeRatio

	// --- STEPS COMPARISON (60% weight) ---
	const origSteps = original.steps || []
	const currSteps = current.steps || []
	const stepWeight = 60
	totalWeight += stepWeight

	// Step count change (40% of step weight)
	const stepCountDiff = Math.abs(currSteps.length - origSteps.length)
	const stepCountWeight = stepWeight * 0.4
	const maxStepCount = Math.max(origSteps.length, currSteps.length, 1)
	changedWeight += stepCountWeight * Math.min(stepCountDiff / maxStepCount, 1)

	// Step content change via Jaccard similarity (60% of step weight)
	const stepContentWeight = stepWeight * 0.6
	let substantialStepChanges = 0

	const minSteps = Math.min(origSteps.length, currSteps.length)
	for (let i = 0; i < minSteps; i++) {
		const origWords = new Set(
			origSteps[i].instruction
				.toLowerCase()
				.split(/\s+/)
				.filter(w => w.length > 2),
		)
		const currWords = new Set(
			currSteps[i].instruction
				.toLowerCase()
				.split(/\s+/)
				.filter(w => w.length > 2),
		)

		const intersection = [...origWords].filter(w => currWords.has(w)).length
		const union = new Set([...origWords, ...currWords]).size
		const similarity = union > 0 ? intersection / union : 1

		if (similarity < 0.5) {
			substantialStepChanges++
		}
	}

	changedWeight +=
		stepContentWeight * Math.min(substantialStepChanges / maxStepCount, 1)

	return Math.round((changedWeight / totalWeight) * 100)
}

// ── API response transform ──────────────────────────────────────────
/**
 * Transforms AI service response to the local ParsedRecipe format.
 */
export const transformProcessedRecipe = (
	data: Awaited<ReturnType<typeof processRecipe>>['data'],
): ParsedRecipe | null => {
	if (!data) return null

	return {
		title: data.title,
		description: data.description,
		cookTime: `${data.cookTimeMinutes} min`,
		difficulty: (data.difficulty || 'Intermediate') as Difficulty,
		servings: data.servings,
		cuisine: data.cuisineType || 'International',
		ingredients: (data.fullIngredientList || []).map((ing, i) => ({
			id: `ing-${i}`,
			quantity: `${ing.quantity} ${ing.unit}`.trim(),
			name: ing.name,
		})),
		steps: (data.steps || []).map(step => ({
			id: `step-${step.stepNumber}`,
			instruction: step.description,
			timerSeconds: step.timerSeconds,
			technique: step.action,
			imageUrl: step.imageUrl,
		})),
		detectedBadges:
			data.badges?.map(badge => ({
				emoji: '🏆',
				name: badge,
			})) || [],
		xpReward: data.xpReward,
		xpBreakdown: data.xpBreakdown,
		skillTags: data.skillTags,
		difficultyMultiplier: data.difficultyMultiplier,
	}
}

// ── Timer formatting ────────────────────────────────────────────────
/** Converts seconds to human-readable display (e.g. "5 min", "1h 30m"). */
export const formatTimer = (seconds: number): string => {
	if (seconds >= 86400) {
		const days = Math.floor(seconds / 86400)
		const hours = Math.floor((seconds % 86400) / 3600)
		return hours > 0
			? `${days}d ${hours}h`
			: `${days} day${days > 1 ? 's' : ''}`
	}
	if (seconds >= 3600) {
		const hours = Math.floor(seconds / 3600)
		const mins = Math.floor((seconds % 3600) / 60)
		return mins > 0
			? `${hours}h ${mins}m`
			: `${hours} hour${hours > 1 ? 's' : ''}`
	}
	if (seconds >= 60) {
		return `${Math.floor(seconds / 60)} min`
	}
	return `${seconds} sec`
}

/** Extracts non-zero timer seconds from a step, or undefined. */
export const getTimerSeconds = (step: RecipeStep): number | undefined => {
	if (step.timerSeconds != null && step.timerSeconds > 0)
		return step.timerSeconds
	return undefined
}

// ── Timer unit conversion ───────────────────────────────────────────
/** Converts a value in any time unit to seconds. */
export const toSeconds = (value: number, unit: TimeUnit): number => {
	switch (unit) {
		case 'seconds':
			return value
		case 'minutes':
			return value * 60
		case 'hours':
			return value * 3600
		case 'days':
			return value * 86400
	}
}
