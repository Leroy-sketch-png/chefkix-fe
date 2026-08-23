import { allergenLabel, normalizeAllergenFlags } from '@/lib/allergen-profile'
import type { Substitution } from '@/services/ai'

export type AllergenSafetyStatus = 'safe' | 'check' | 'blocked'
export type AllergenSafetySource = 'backend' | 'profile' | 'demo'

export interface AllergenSafetyResult {
	status: AllergenSafetyStatus
	flaggedAllergens: string[]
	reason: string
	source: AllergenSafetySource
}

export interface RecipeAllergenConflict {
	ingredient: string
	flaggedAllergens: string[]
	reason: string
}

type UnknownRecord = Record<string, unknown>

const FAMILY_ALIASES: Record<string, string> = {
	celery: 'celery',
	cereals_gluten: 'wheat_gluten',
	crustaceans: 'shellfish',
	eggs: 'eggs',
	fish: 'fish',
	lupin: 'lupin',
	milk: 'dairy',
	molluscs: 'molluscs',
	mustard: 'mustard',
	peanuts: 'peanuts',
	sesame: 'sesame',
	soybeans: 'soy',
	sulphites: 'sulphites',
	tree_nuts: 'tree_nuts',
	dairy: 'dairy',
	nuts: 'tree_nuts',
	shellfish: 'shellfish',
	soy: 'soy',
	wheat: 'wheat_gluten',
}

const INGREDIENT_FAMILIES: Record<string, string> = {
	almond: 'tree_nuts',
	almonds: 'tree_nuts',
	almond_butter: 'tree_nuts',
	almond_flour: 'tree_nuts',
	cashew: 'tree_nuts',
	cashews: 'tree_nuts',
	cashew_butter: 'tree_nuts',
	hazelnut: 'tree_nuts',
	macadamia: 'tree_nuts',
	peanut: 'peanuts',
	peanuts: 'peanuts',
	peanut_butter: 'peanuts',
	peanut_flour: 'peanuts',
	peanut_oil: 'peanuts',
	milk: 'dairy',
	butter: 'dairy',
	ghee: 'dairy',
	cheese: 'dairy',
	yogurt: 'dairy',
	cream: 'dairy',
	egg: 'eggs',
	eggs: 'eggs',
	mayonnaise: 'eggs',
	flour: 'wheat_gluten',
	wheat: 'wheat_gluten',
	bread: 'wheat_gluten',
	panko: 'wheat_gluten',
	pasta: 'wheat_gluten',
	soy: 'soy',
	soy_sauce: 'soy',
	tofu: 'soy',
	tempeh: 'soy',
	fish: 'fish',
	anchovy: 'fish',
	anchovies: 'fish',
	fish_sauce: 'fish',
	shrimp: 'shellfish',
	prawn: 'shellfish',
	crab: 'shellfish',
	lobster: 'shellfish',
	sesame: 'sesame',
	tahini: 'sesame',
	mustard: 'mustard',
	celery: 'celery',
	lupin: 'lupin',
}

const asRecord = (value: unknown): UnknownRecord | null =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as UnknownRecord)
		: null

const firstValue = (record: UnknownRecord, keys: string[]) => {
	for (const key of keys) {
		if (record[key] !== undefined && record[key] !== null) return record[key]
	}
	return undefined
}

const asStringArray = (value: unknown) => {
	if (!Array.isArray(value)) return []
	return value.filter(
		(item): item is string =>
			typeof item === 'string' && item.trim().length > 0,
	)
}

const normalizeIngredient = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_|_$/g, '')

const ingredientFamilies = (ingredient: string) => {
	const normalized = normalizeIngredient(ingredient)
	const matches = new Set<string>()
	for (const [term, family] of Object.entries(INGREDIENT_FAMILIES)) {
		if (normalized === term || normalized.includes(term)) matches.add(family)
	}
	return matches
}

const parseBackendSafety = (
	substitution: Substitution,
): AllergenSafetyResult | null => {
	const nested = asRecord(substitution.allergenSafety)
	const source = nested ?? asRecord(substitution)
	const rawStatus = firstValue(source, [
		'status',
		'safetyStatus',
		'safety_status',
	])
	const status =
		rawStatus === 'safe' || rawStatus === 'check' || rawStatus === 'blocked'
			? rawStatus
			: null
	const explicitSafe =
		typeof substitution.allergenSafe === 'boolean'
			? substitution.allergenSafe
			: null
	if (!status && explicitSafe === null && !nested) return null

	const flaggedAllergens = asStringArray(
		firstValue(source, [
			'flaggedAllergens',
			'flagged_allergens',
			'allergens',
			'matchedAllergens',
			'matched_allergens',
		]),
	)
	const reason = firstValue(source, [
		'reason',
		'blockedReason',
		'blocked_reason',
		'message',
	])
	const resolvedStatus = status ?? (explicitSafe ? 'safe' : 'blocked')
	return {
		status: resolvedStatus,
		flaggedAllergens,
		reason:
			typeof reason === 'string' && reason.trim()
				? reason
				: resolvedStatus === 'safe'
					? 'No conflict found in the current profile.'
					: 'The safety service flagged a possible allergen conflict.',
		source: 'backend',
	}
}

export const resolveAllergenSafety = (
	substitution: Substitution,
	allergenFlags: string[] | null | undefined,
): AllergenSafetyResult => {
	const backendResult = parseBackendSafety(substitution)
	if (backendResult) return backendResult

	const normalizedFlags = normalizeAllergenFlags(allergenFlags)
	if (normalizedFlags.length === 0) {
		return {
			status: 'check',
			flaggedAllergens: [],
			reason:
				'Add an allergen profile for a personalized safety check. Verify the product label.',
			source: 'profile',
		}
	}

	const candidateFamilies = ingredientFamilies(substitution.name)
	const matchingFlags = normalizedFlags.filter(flag => {
		const canonical = normalizeIngredient(flag.replace(/^custom:/, ''))
		return (
			(candidateFamilies.size > 0 &&
				candidateFamilies.has(FAMILY_ALIASES[canonical])) ||
			(flag.startsWith('custom:') &&
				normalizeIngredient(substitution.name).includes(canonical))
		)
	})
	if (matchingFlags.length > 0) {
		const labels = matchingFlags.map(allergenLabel)
		return {
			status: 'blocked',
			flaggedAllergens: matchingFlags,
			reason: `Contains: ${labels.join(', ')} — matches your allergen profile.`,
			source: 'profile',
		}
	}

	if (candidateFamilies.size === 0) {
		return {
			status: 'check',
			flaggedAllergens: [],
			reason:
				'Ingredient-level evidence is incomplete. Verify the brand label for cross-contact.',
			source: 'profile',
		}
	}

	return {
		status: 'safe',
		flaggedAllergens: [],
		reason: 'No match found against the saved allergen profile.',
		source: 'profile',
	}
}

export const findRecipeAllergenConflicts = (
	ingredients: string[],
	allergenFlags: string[] | null | undefined,
): RecipeAllergenConflict[] => {
	const normalizedFlags = normalizeAllergenFlags(allergenFlags)
	if (normalizedFlags.length === 0) return []
	return ingredients.flatMap(ingredient => {
		const matches = normalizedFlags.filter(flag => {
			const isCustom = flag.startsWith('custom:')
			const canonical = normalizeIngredient(flag.replace(/^custom:/, ''))
			const family = FAMILY_ALIASES[canonical]
			return (
				(Boolean(family) && ingredientFamilies(ingredient).has(family)) ||
				(isCustom && normalizeIngredient(ingredient).includes(canonical))
			)
		})
		if (matches.length === 0) return []
		return [
			{
				ingredient,
				flaggedAllergens: matches,
				reason: `Contains ${matches.map(allergenLabel).join(', ')} from your saved profile.`,
			},
		]
	})
}

export const safetyStatusLabel = (status: AllergenSafetyStatus) =>
	status === 'safe' ? 'Safe' : status === 'blocked' ? 'Blocked' : 'Check'
