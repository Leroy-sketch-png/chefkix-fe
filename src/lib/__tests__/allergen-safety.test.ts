import {
	findRecipeAllergenConflicts,
	resolveAllergenSafety,
} from '@/lib/allergen-safety'

const substitution = (name: string, extra: Record<string, unknown> = {}) => ({
	name,
	ratio: '1:1',
	notes: '',
	confidenceScore: 0.9,
	...extra,
})
describe('allergen safety contract', () => {
	it('blocks a known profile conflict with a specific allergen reason', () => {
		const result = resolveAllergenSafety(substitution('peanut flour'), [
			'peanuts',
		])

		expect(result).toMatchObject({
			status: 'blocked',
			flaggedAllergens: ['peanuts'],
			source: 'profile',
		})
		expect(result.reason).toContain('Peanuts')
	})

	it('returns check when ingredient evidence is not specific enough', () => {
		const result = resolveAllergenSafety(substitution('artisan sauce'), [
			'peanuts',
		])

		expect(result.status).toBe('check')
	})

	it('honors backend safety decisions when the Lead contract is present', () => {
		const result = resolveAllergenSafety(
			substitution('sunflower seed butter', {
				allergenSafety: {
					status: 'safe',
					flaggedAllergens: [],
					reason: 'Validated by the allergen guard.',
				},
			}),
			['peanuts'],
		)

		expect(result).toEqual({
			status: 'safe',
			flaggedAllergens: [],
			reason: 'Validated by the allergen guard.',
			source: 'backend',
		})
	})

	it('finds recipe ingredient conflicts for the detail-page banner', () => {
		const conflicts = findRecipeAllergenConflicts(
			['olive oil', 'peanut butter', 'cinnamon'],
			['peanuts'],
		)

		expect(conflicts).toEqual([
			expect.objectContaining({
				ingredient: 'peanut butter',
				flaggedAllergens: ['peanuts'],
			}),
		])
	})
})

it.each([
	['UNKNOWN', 'check'],
	['SAFE', 'safe'],
	['BLOCKED', 'blocked'],
	['nonsense', 'check'],
])('normalizes policy status %s', (status, expected) => {
	expect(
		resolveAllergenSafety(
			substitution('olive oil', {
				allergenSafety: { status },
				allergenSafe: true,
			}),
			['peanuts'],
		).status,
	).toBe(expected)
})
it('never infers safe from unrelated known ingredients, absent policy, or legacy booleans', () => {
	for (const extra of [{}, { allergenSafe: true }, { allergenSafety: {} }]) {
		expect(
			resolveAllergenSafety(substitution('milk', extra), ['peanuts']).status,
		).toBe('check')
	}
	expect(
		resolveAllergenSafety(
			substitution('olive oil', { allergenSafety: { status: 'safe' } }),
			[],
		).status,
	).toBe('check')
})
it('local conflicts override a contradictory safe claim and custom flags use whole words', () => {
	expect(
		resolveAllergenSafety(
			substitution('peanut flour', { allergenSafety: { status: 'SAFE' } }),
			['peanuts'],
		).status,
	).toBe('blocked')
	expect(
		resolveAllergenSafety(substitution('kiwi puree'), ['custom:kiwi']).status,
	).toBe('blocked')
	expect(
		resolveAllergenSafety(substitution('nutmeg'), ['custom:nut']).status,
	).toBe('check')
	expect(
		resolveAllergenSafety(substitution('wheat'), ['wheat_gluten']).status,
	).toBe('blocked')
})
it('does not classify plant alternatives or substrings as confirmed dairy/egg conflicts', () => {
	for (const name of ['peanut butter', 'coconut milk', 'eggplant']) {
		expect(
			resolveAllergenSafety(substitution(name), ['milk', 'eggs']).status,
		).toBe('check')
	}
})
