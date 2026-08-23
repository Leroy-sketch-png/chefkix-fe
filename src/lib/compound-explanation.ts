import type { Substitution } from '@/services/ai'

export type CompoundSource = 'chemistry' | 'llm' | 'hybrid'

export interface NutritionProfile {
	calories: number
	fat: number
	protein: number
}

export interface SharedCompound {
	name: string
	/** Optional contribution to the overlap percentage. */
	overlapPercent?: number
}

export interface CompoundExplanation {
	overlapPercent: number
	sharedCompounds: SharedCompound[]
	explanation: string
	originalNutrition: NutritionProfile
	substituteNutrition: NutritionProfile
	source: CompoundSource
	allergenSafe: boolean | null
	isMock: boolean
}

type UnknownRecord = Record<string, unknown>

const DEMO_COMPOUND_EXPLANATIONS: Record<string, CompoundExplanation> = {
	'butter::coconut oil': {
		overlapPercent: 73,
		sharedCompounds: [
			{ name: 'Caprylic acid', overlapPercent: 28 },
			{ name: 'Lauric acid', overlapPercent: 24 },
			{ name: 'Palmitic acid', overlapPercent: 13 },
			{ name: 'Oleic acid', overlapPercent: 8 },
		],
		explanation:
			'73% shared volatile compounds, with a similar melting profile for baking and sautéing.',
		originalNutrition: { calories: 717, fat: 81.1, protein: 0.9 },
		substituteNutrition: { calories: 892, fat: 99.1, protein: 0 },
		source: 'chemistry',
		allergenSafe: true,
		isMock: true,
	},
	'butter::ghee': {
		overlapPercent: 81,
		sharedCompounds: [
			{ name: 'Butyric acid', overlapPercent: 25 },
			{ name: 'Palmitic acid', overlapPercent: 23 },
			{ name: 'Oleic acid', overlapPercent: 18 },
			{ name: 'Stearic acid', overlapPercent: 15 },
		],
		explanation:
			'81% shared fatty-acid profile and an almost identical high-heat cooking behavior.',
		originalNutrition: { calories: 717, fat: 81.1, protein: 0.9 },
		substituteNutrition: { calories: 900, fat: 100, protein: 0 },
		source: 'chemistry',
		allergenSafe: true,
		isMock: true,
	},
	'butter::avocado oil': {
		overlapPercent: 38,
		sharedCompounds: [
			{ name: 'Oleic acid', overlapPercent: 24 },
			{ name: 'Palmitic acid', overlapPercent: 9 },
			{ name: 'Stearic acid', overlapPercent: 5 },
		],
		explanation:
			'38% shared lipid profile; the neutral flavor and high smoke point make it better for frying than baking.',
		originalNutrition: { calories: 717, fat: 81.1, protein: 0.9 },
		substituteNutrition: { calories: 884, fat: 100, protein: 0 },
		source: 'chemistry',
		allergenSafe: true,
		isMock: true,
	},
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

const asNumber = (value: unknown, fallback = 0) => {
	const parsed = typeof value === 'number' ? value : Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

const asPercent = (value: unknown) => {
	const parsed = asNumber(value)
	const percent = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed
	return Math.max(0, Math.min(100, percent))
}

const normalizeNutrition = (value: unknown): NutritionProfile => {
	const record = asRecord(value) ?? {}
	return {
		calories: asNumber(
			firstValue(record, ['calories', 'caloriesPer100g', 'calories_per_100g']),
		),
		fat: asNumber(firstValue(record, ['fat', 'fatGrams', 'fat_grams'])),
		protein: asNumber(
			firstValue(record, ['protein', 'proteinGrams', 'protein_grams']),
		),
	}
}

const normalizeCompounds = (value: unknown): SharedCompound[] => {
	if (!Array.isArray(value)) return []
	return value
		.map((item): SharedCompound | null => {
			if (typeof item === 'string') return { name: item }
			const record = asRecord(item)
			if (!record) return null
			const name = firstValue(record, ['name', 'compoundName', 'compound_name'])
			return typeof name === 'string' && name.trim()
				? {
						name: name.trim(),
						overlapPercent:
							firstValue(record, ['overlapPercent', 'overlap_percentage']) ===
							undefined
								? undefined
								: asPercent(
										firstValue(record, [
											'overlapPercent',
											'overlap_percentage',
										]),
									),
					}
				: null
		})
		.filter((item): item is SharedCompound => item !== null)
}

/**
 * Converts likely Lead payload variants into the stable UI contract.
 * The API may use camelCase or snake_case while the visual layer stays unchanged.
 */
export const parseCompoundExplanation = (
	value: unknown,
	options?: { originalIngredient?: string; substituteName?: string },
): CompoundExplanation | null => {
	const record = asRecord(value)
	if (!record) return null

	const nested = asRecord(
		firstValue(record, [
			'compoundExplanation',
			'compound_explanation',
			'compoundData',
			'compound_data',
		]),
	)
	const source = nested ?? record
	const overlapValue = firstValue(source, [
		'overlapPercent',
		'overlap_percentage',
		'sharedCompoundPercentage',
		'shared_compound_percentage',
		'compoundOverlapPercent',
		'compound_overlap_percent',
	])
	const compounds = normalizeCompounds(
		firstValue(source, ['sharedCompounds', 'shared_compounds', 'compounds']),
	)
	const originalNutrition = normalizeNutrition(
		firstValue(source, ['originalNutrition', 'original_nutrition']),
	)
	const substituteNutrition = normalizeNutrition(
		firstValue(source, [
			'substituteNutrition',
			'substitute_nutrition',
			'replacementNutrition',
			'replacement_nutrition',
		]),
	)
	const explanation = firstValue(source, [
		'explanation',
		'oneLiner',
		'one_liner',
		'summary',
		'rationale',
	])

	if (
		overlapValue === undefined &&
		compounds.length === 0 &&
		explanation === undefined
	) {
		return null
	}

	const rawSource = firstValue(source, [
		'source',
		'suggestionSource',
		'suggestion_source',
	])
	const normalizedSource: CompoundSource =
		rawSource === 'chemistry' || rawSource === 'hybrid' ? rawSource : 'llm'
	const safeValue = firstValue(source, ['allergenSafe', 'allergen_safe'])

	return {
		overlapPercent: asPercent(overlapValue),
		sharedCompounds: compounds.slice(0, 5),
		explanation:
			typeof explanation === 'string' && explanation.trim()
				? explanation.trim()
				: 'Compound evidence is available for this substitution.',
		originalNutrition,
		substituteNutrition,
		source: normalizedSource,
		allergenSafe: typeof safeValue === 'boolean' ? safeValue : null,
		isMock: false,
	}
}

export const getCompoundExplanation = (
	originalIngredient: string,
	substitution: Pick<Substitution, 'name' | 'compoundExplanation'>,
): CompoundExplanation | null => {
	const parsed = parseCompoundExplanation(substitution.compoundExplanation, {
		originalIngredient,
		substituteName: substitution.name,
	})
	if (parsed) return parsed

	const key = `${originalIngredient.trim().toLowerCase()}::${substitution.name.trim().toLowerCase()}`
	return DEMO_COMPOUND_EXPLANATIONS[key] ?? null
}
