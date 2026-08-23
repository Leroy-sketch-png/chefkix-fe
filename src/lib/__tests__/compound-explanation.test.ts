import {
	getCompoundExplanation,
	parseCompoundExplanation,
} from '@/lib/compound-explanation'

describe('compound explanation contract', () => {
	it('normalizes Lead snake_case payloads without changing the UI contract', () => {
		const result = parseCompoundExplanation({
			compound_explanation: {
				overlap_percentage: 0.73,
				shared_compounds: [
					{ compound_name: 'Caprylic acid', overlap_percentage: 0.28 },
					'Lauric acid',
				],
				one_liner: '73% shared volatiles, similar melting point.',
				original_nutrition: {
					calories_per_100g: 717,
					fat_grams: 81.1,
					protein_grams: 0.9,
				},
				substitute_nutrition: {
					calories_per_100g: 892,
					fat_grams: 99.1,
					protein_grams: 0,
				},
				source: 'chemistry',
				allergen_safe: true,
			},
		})

		expect(result).toMatchObject({
			overlapPercent: 73,
			explanation: '73% shared volatiles, similar melting point.',
			source: 'chemistry',
			allergenSafe: true,
			isMock: false,
			originalNutrition: { calories: 717, fat: 81.1, protein: 0.9 },
			substituteNutrition: { calories: 892, fat: 99.1, protein: 0 },
		})
		expect(result?.sharedCompounds.map(compound => compound.name)).toEqual([
			'Caprylic acid',
			'Lauric acid',
		])
	})

	it('keeps the interim butter demo available until the compound API is live', () => {
		const result = getCompoundExplanation('Butter', {
			name: 'Coconut Oil',
			compoundExplanation: undefined,
		})

		expect(result).toMatchObject({
			overlapPercent: 73,
			source: 'chemistry',
			isMock: true,
		})
		expect(result?.sharedCompounds).toHaveLength(4)
	})

	it('returns no fabricated chemistry for an unknown pair', () => {
		expect(
			getCompoundExplanation('salt', {
				name: 'lemon juice',
				compoundExplanation: undefined,
			}),
		).toBeNull()
	})
})
