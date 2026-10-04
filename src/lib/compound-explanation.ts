import type { Substitution } from '@/services/ai'

export type CompoundSource = 'chemistry' | 'llm' | 'hybrid' | 'unknown'
export interface NutritionProfile {
	calories: number | null
	fat: number | null
	protein: number | null
}
export interface SharedCompound {
	name: string
}
export interface CompoundExplanation {
	overlapPercent: number | null
	sharedCompounds: SharedCompound[]
	explanation: string
	originalNutrition: NutritionProfile
	substituteNutrition: NutritionProfile
	source: CompoundSource
	sourceAuthority: string | null
	sourceSha256: string | null
	isGrounded: boolean
	isMock: boolean
	degraded: boolean
}
type UnknownRecord = Record<string, unknown>
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
const asNumber = (value: unknown): number | null =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0
		? value
		: null
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

/** Percent fields use 0–100; the official pair endpoint's overlap_percentage is 0–1. */
export const parseCompoundExplanation = (
	value: unknown,
): CompoundExplanation | null => {
	const envelope = asRecord(value)
	if (!envelope) return null
	const record = asRecord(envelope.data) ?? envelope
	const source =
		asRecord(
			firstValue(record, [
				'compoundExplanation',
				'compound_explanation',
				'compoundData',
				'compound_data',
			]),
		) ?? record
	const states = [envelope, record, source]
	const isMock = states.some(
		item => item.isMock === true || item.is_mock === true,
	)
	const degraded = states.some(
		item =>
			item.degraded === true ||
			item.success === false ||
			item.status === 'degraded',
	)
	const groundingValues = states.map(item =>
		firstValue(item, [
			'isGrounded',
			'is_grounded',
			'isCompoundGrounded',
			'is_compound_grounded',
		]),
	)
	const grounding = groundingValues.includes(false)
		? false
		: groundingValues.includes(true)
			? true
			: undefined
	const isGrounded = grounding === true && !isMock && !degraded
	const rawSource = firstValue(source, [
		'source',
		'suggestionSource',
		'suggestion_source',
	])
	const normalizedSource: CompoundSource =
		rawSource === 'chemistry' || rawSource === 'hybrid' || rawSource === 'llm'
			? rawSource
			: isGrounded
				? 'chemistry'
				: 'unknown'
	const percent = asNumber(
		firstValue(source, [
			'overlapPercent',
			'overlap_percent',
			'overlap_pct',
			'sharedCompoundPercentage',
			'shared_compound_percentage',
			'compoundOverlapPercent',
			'compound_overlap_percent',
		]),
	)
	const fraction = asNumber(source.overlap_percentage)
	const overlap =
		percent ?? (fraction !== null && fraction <= 1 ? fraction * 100 : null)
	const unavailable = degraded || isMock || grounding === false
	const rawCompounds = firstValue(source, [
		'sharedCompounds',
		'shared_compounds',
		'compounds',
	])
	const compounds = Array.isArray(rawCompounds)
		? rawCompounds.flatMap(item => {
				const name =
					typeof item === 'string'
						? item
						: firstValue(asRecord(item) ?? {}, [
								'name',
								'compoundName',
								'compound_name',
							])
				return typeof name === 'string' && name.trim()
					? [{ name: name.trim() }]
					: []
			})
		: []
	const explanation = firstValue(source, [
		'explanation',
		'oneLiner',
		'one_liner',
		'summary',
		'rationale',
	])
	if (
		overlap === null &&
		!compounds.length &&
		typeof explanation !== 'string' &&
		grounding === undefined &&
		!degraded
	)
		return null
	return {
		overlapPercent:
			!unavailable && overlap !== null && overlap <= 100 ? overlap : null,
		sharedCompounds: unavailable ? [] : compounds.slice(0, 5),
		explanation: degraded
			? 'Compound evidence is temporarily unavailable.'
			: typeof explanation === 'string'
				? explanation.trim()
				: 'Compound presence does not establish cooking suitability or allergen safety.',
		originalNutrition: normalizeNutrition(
			unavailable
				? null
				: firstValue(source, ['originalNutrition', 'original_nutrition']),
		),
		substituteNutrition: normalizeNutrition(
			unavailable
				? null
				: firstValue(source, [
						'substituteNutrition',
						'substitute_nutrition',
						'replacementNutrition',
						'replacement_nutrition',
					]),
		),
		source: normalizedSource,
		sourceAuthority:
			typeof source.sourceAuthority === 'string'
				? source.sourceAuthority
				: null,
		sourceSha256:
			typeof source.sourceSha256 === 'string' &&
			/^[a-f0-9]{64}$/i.test(source.sourceSha256)
				? source.sourceSha256
				: null,
		isGrounded,
		isMock,
		degraded,
	}
}
export const getCompoundExplanation = (
	_originalIngredient: string,
	substitution: Pick<Substitution, 'name' | 'compoundExplanation'>,
): CompoundExplanation | null =>
	parseCompoundExplanation(substitution.compoundExplanation)
